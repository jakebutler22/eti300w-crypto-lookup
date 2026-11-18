import test from "node:test";
import assert from "node:assert/strict";
import { ApiError, loadMarketDirectory } from "../api.js";
import { TEAM_ASSETS } from "../data/demo-assets.js";

const config = {
  mode: "api", apiContract: "nolan-v1", apiBaseUrl: "/api",
  catalogPath: "/db/cryptos", marketPath: "/live",
  requestTimeoutMs: 1000, allowPartialMarket: true,
};
const catalog = () => TEAM_ASSETS.map((asset) => ({ ...asset, description: `Database description for ${asset.symbol}.`, price: 999999, extra: "original" }));
const quote = (symbol) => ({
  symbol, price: 123.45, volume_24h: 456.78, source: "Coinbase Exchange",
  product_id: `${symbol}-USD`, quote_currency: "USD", volume_unit: symbol,
  provider_timestamp: "2026-11-18T22:10:17.833555643Z", extra: { original: true },
});
const json = (body, status = 200, retryAfter) => ({
  ok: status >= 200 && status < 300, status,
  headers: new Headers(retryAfter === undefined ? {} : { "Retry-After": retryAfter }),
  json: async () => body,
});
const isCode = (code) => (error) => error instanceof ApiError && error.code === code;
const immediate = () => new Promise((resolve) => setImmediate(resolve));

test("every catalog market loads with one database request, preserves metadata/JSON, and reports progressive results", async (t) => {
  const profiles = catalog();
  const markets = new Map();
  const events = [];
  let finished = false;
  const mock = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(options.cache, "no-store");
    assert.equal(options.credentials, "same-origin");
    assert.equal(options.headers.Accept, "application/json");
    if (url === "/api/db/cryptos") return json(profiles);
    const symbol = url.split("/").at(-1);
    const market = quote(symbol);
    markets.set(symbol, market);
    return json(market);
  });
  const result = await loadMarketDirectory({
    config, launchIntervalMs: 0,
    onDirectory(directory) {
      assert.equal(markets.size, 0);
      assert.equal(directory.length, 27);
      events.push("directory");
    },
    onResult(response) {
      assert.equal(finished, false);
      events.push(response.data.symbol);
    },
  });
  finished = true;
  assert.equal(mock.mock.callCount(), 28);
  assert.equal(mock.mock.calls.filter(({ arguments: [url] }) => url === "/api/db/cryptos").length, 1);
  assert.equal(events[0], "directory");
  assert.equal(events.length, 28);
  assert.deepEqual(result.responses.map(({ data }) => data.symbol), TEAM_ASSETS.map(({ symbol }) => symbol));
  assert.equal(result.responses.length, 27);
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.pendingSymbols, []);
  assert.equal(result.stopped, false);
  for (const response of result.responses) {
    const symbol = response.data.symbol;
    const original = profiles.find((profile) => profile.symbol === symbol);
    assert.equal(response.data.market.priceUsd, 123.45);
    assert.notEqual(response.data.market.priceUsd, original.price);
    assert.equal(response.data.category, original.category);
    assert.equal(response.data.description, original.description);
    assert.equal(response.data.market.volumeUnit, symbol);
    assert.equal(response.data.market.asOf, quote(symbol).provider_timestamp);
    assert.ok(Number.isFinite(Date.parse(response.data.retrievedAt)));
    assert.equal(response.data.simulated, false);
    assert.equal(response.raw.profiles, profiles);
    assert.equal(response.raw.market, markets.get(symbol));
    assert.equal(response.endpointUrls.profile, "/api/db/cryptos");
    assert.equal(response.endpointUrls.market, `/api/live/${symbol}`);
    assert.equal(response.marketStatus, "available");
  }
});

test("market concurrency is capped at three even when a larger number is requested", async (t) => {
  let active = 0;
  let maximum = 0;
  const release = [];
  const mock = t.mock.method(globalThis, "fetch", async (url) => {
    if (url.endsWith("/db/cryptos")) return json(catalog().slice(0, 7));
    active += 1;
    maximum = Math.max(maximum, active);
    await new Promise((resolve) => release.push(resolve));
    active -= 1;
    return json(quote(url.split("/").at(-1)));
  });
  const pending = loadMarketDirectory({ config, concurrency: 99, launchIntervalMs: 0 });
  await immediate();
  assert.equal(active, 3);
  assert.equal(mock.mock.callCount(), 4);
  while (release.length) {
    release.splice(0).forEach((resolve) => resolve());
    await immediate();
  }
  const result = await pending;
  assert.equal(maximum, 3);
  assert.equal(result.responses.length, 7);
});

test("default pacing separates market starts without delaying the database request", async (t) => {
  let now = 0;
  t.mock.method(Date, "now", () => now);
  t.mock.method(globalThis, "setTimeout", (callback, milliseconds) => {
    // Request deadlines are deliberately idle; only the pacing clock advances.
    if (milliseconds < config.requestTimeoutMs) queueMicrotask(() => { now += milliseconds; callback(); });
    return {};
  });
  t.mock.method(globalThis, "clearTimeout", () => {});
  const starts = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.endsWith("/db/cryptos")) return json(catalog().slice(0, 4));
    starts.push(Date.now());
    return json(quote(url.split("/").at(-1)));
  });
  const result = await loadMarketDirectory({ config });
  assert.equal(result.responses.length, 4);
  assert.deepEqual(starts, [0, 250, 500, 750]);
});

test("a symbol allowlist honors requested order but cannot request coins absent from the database", async (t) => {
  const urls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    urls.push(url);
    return json(url.endsWith("/db/cryptos") ? catalog().slice(0, 3) : quote(url.split("/").at(-1)));
  });
  const result = await loadMarketDirectory({ config, symbols: [" xrp ", "UNKNOWN", "BTC", "xrp"], concurrency: 1, launchIntervalMs: 0 });
  assert.deepEqual(urls, ["/api/db/cryptos", "/api/live/XRP", "/api/live/BTC"]);
  assert.equal(result.directory.length, 3);
  assert.deepEqual(result.responses.map(({ data }) => data.symbol), ["XRP", "BTC"]);
});

test("a failed market keeps only its validated database profile while other markets still load", async (t) => {
  const body = { error: "Trading pair unavailable on Coinbase", original: true };
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.endsWith("/db/cryptos")) return json(catalog().slice(0, 3));
    return url.endsWith("/ETH") ? json(body, 404) : json(quote(url.split("/").at(-1)));
  });
  const result = await loadMarketDirectory({ config, launchIntervalMs: 0 });
  assert.equal(result.responses.length, 3);
  assert.equal(result.stopped, false);
  const failed = result.responses.find(({ data }) => data.symbol === "ETH");
  assert.equal(failed.data.market.priceUsd, null);
  assert.equal(failed.marketError.code, "PRODUCT_UNAVAILABLE");
  assert.equal(failed.raw.market, body);
  assert.equal(result.responses.filter(({ marketStatus }) => marketStatus === "available").length, 2);
});

test("strict failures produce per-row safe errors without preventing unrelated quotes", async (t) => {
  const errorEvents = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.endsWith("/db/cryptos")) return json(catalog().slice(0, 3));
    return url.endsWith("/ETH") ? json({ error: "Private debug text must not become a message" }, 502) : json(quote(url.split("/").at(-1)));
  });
  const result = await loadMarketDirectory({
    config: { ...config, allowPartialMarket: false }, launchIntervalMs: 0,
    onError(error, symbol) { errorEvents.push({ error, symbol }); },
  });
  assert.equal(result.responses.length, 2);
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].symbol, "ETH");
  assert.equal(result.errors[0].error.status, 502);
  assert.doesNotMatch(result.errors[0].error.message, /Private debug/);
  assert.deepEqual(errorEvents, result.errors);
});

test("429 and explicitly delayed 503 responses stop queued requests and retain original error JSON", async (t) => {
  let status;
  const body = { error: "Provider busy" };
  const mock = t.mock.method(globalThis, "fetch", async (url) =>
    url.endsWith("/db/cryptos") ? json(catalog()) : json(body, status, "45"));
  for (status of [429, 503]) {
    const before = mock.mock.callCount();
    const result = await loadMarketDirectory({ config, concurrency: 1, launchIntervalMs: 0 });
    assert.equal(mock.mock.callCount() - before, 2);
    assert.equal(result.stopped, true);
    assert.equal(result.retryAfterMs, 45000);
    assert.equal(result.responses.length, 1);
    assert.equal(result.responses[0].raw.market, body);
    assert.equal(result.responses[0].data.market.priceUsd, null);
    assert.deepEqual(result.pendingSymbols, TEAM_ASSETS.slice(1).map(({ symbol }) => symbol));
  }
});

test("an ordinary 503 without retry guidance does not invent a rate limit or stop unrelated markets", async (t) => {
  t.mock.method(globalThis, "fetch", async (url) => {
    if (url.endsWith("/db/cryptos")) return json(catalog().slice(0, 3));
    return url.endsWith("/BTC") ? json({ error: "Temporary provider failure" }, 503) : json(quote(url.split("/").at(-1)));
  });
  const result = await loadMarketDirectory({ config, concurrency: 1, launchIntervalMs: 0 });
  assert.equal(result.stopped, false);
  assert.equal(result.retryAfterMs, undefined);
  assert.equal(result.responses.length, 3);
  assert.equal(result.responses[0].marketStatus, "unavailable");
  assert.equal(result.responses[1].marketStatus, "available");
});

test("a rate limit leaves already active markets free to finish while every queued market stays unrequested", async (t) => {
  const release = new Map();
  const mock = t.mock.method(globalThis, "fetch", async (url) => {
    if (url.endsWith("/db/cryptos")) return json(catalog());
    return new Promise((resolve) => release.set(url.split("/").at(-1), resolve));
  });
  const pending = loadMarketDirectory({ config, launchIntervalMs: 0 });
  await immediate();
  assert.equal(release.size, 3);
  release.get("BTC")(json({ error: "Busy" }, 429, "30"));
  await immediate();
  assert.equal(mock.mock.callCount(), 4);
  release.get("ETH")(json(quote("ETH")));
  release.get("XRP")(json(quote("XRP")));
  const result = await pending;
  assert.equal(result.stopped, true);
  assert.equal(result.responses.length, 3);
  assert.equal(result.responses.filter(({ marketStatus }) => marketStatus === "available").length, 2);
  assert.equal(result.pendingSymbols.length, 24);
  assert.equal(mock.mock.callCount(), 4);
});

test("strict rate-limit errors also stop queued work and expose the bounded retry guidance", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async (url) =>
    url.endsWith("/db/cryptos") ? json(catalog()) : json({ error: "Busy" }, 429, "9999"));
  const result = await loadMarketDirectory({ config: { ...config, allowPartialMarket: false }, concurrency: 1, launchIntervalMs: 0 });
  assert.equal(mock.mock.callCount(), 2);
  assert.equal(result.stopped, true);
  assert.equal(result.retryAfterMs, 300000);
  assert.equal(result.responses.length, 0);
  assert.equal(result.errors[0].symbol, "BTC");
  assert.equal(result.errors[0].error.status, 429);
  assert.equal(result.pendingSymbols.length, 26);
});

test("aborting a batch cancels active requests, leaves queued coins unrequested, and prevents later callbacks", async (t) => {
  const controller = new AbortController();
  let cancelled = 0;
  let callbacks = 0;
  const mock = t.mock.method(globalThis, "fetch", async (url, { signal }) => {
    if (url.endsWith("/db/cryptos")) return json(catalog());
    return new Promise((resolve, reject) => signal.addEventListener("abort", () => {
      cancelled += 1;
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true }));
  });
  const pending = loadMarketDirectory({ config, signal: controller.signal, launchIntervalMs: 0, onResult() { callbacks += 1; } });
  await immediate();
  assert.equal(mock.mock.callCount(), 4);
  controller.abort();
  await assert.rejects(pending, isCode("ABORTED"));
  await immediate();
  assert.equal(cancelled, 3);
  assert.equal(callbacks, 0);
  assert.equal(mock.mock.callCount(), 4);
});

test("cancelling from the directory callback prevents every market request", async (t) => {
  const controller = new AbortController();
  const mock = t.mock.method(globalThis, "fetch", async () => json(catalog()));
  await assert.rejects(loadMarketDirectory({ config, signal: controller.signal, onDirectory() { controller.abort(); } }), isCode("ABORTED"));
  assert.equal(mock.mock.callCount(), 1);
});

test("cancellation during request pacing clears its wait and prevents queued requests or callbacks", async (t) => {
  const controller = new AbortController();
  let callbacks = 0;
  const mock = t.mock.method(globalThis, "fetch", async (url) =>
    json(url.endsWith("/db/cryptos") ? catalog() : quote(url.split("/").at(-1))));
  await assert.rejects(loadMarketDirectory({
    config, signal: controller.signal,
    onResult() { callbacks += 1; controller.abort(); },
  }), isCode("ABORTED"));
  await immediate();
  assert.equal(mock.mock.callCount(), 2);
  assert.equal(callbacks, 1);
});

test("a timed-out market keeps its own profile and does not consume the next market's timeout budget", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, { signal }) => {
    if (url.endsWith("/db/cryptos")) return json(catalog().slice(0, 2));
    if (url.endsWith("/ETH")) return json(quote("ETH"));
    return new Promise((resolve, reject) => signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true }));
  });
  const result = await loadMarketDirectory({ config: { ...config, requestTimeoutMs: 10 }, concurrency: 1, launchIntervalMs: 0 });
  assert.equal(result.responses[0].marketError.code, "TIMEOUT");
  assert.equal(result.responses[0].data.market.priceUsd, null);
  assert.equal(result.responses[1].data.symbol, "ETH");
  assert.equal(result.responses[1].marketStatus, "available");
});

test("empty or failed database catalogs never generate market requests or fixture fallbacks", async (t) => {
  let response = json([]);
  const mock = t.mock.method(globalThis, "fetch", async () => response);
  const empty = await loadMarketDirectory({ config });
  assert.deepEqual(empty.directory, []);
  assert.deepEqual(empty.responses, []);
  assert.equal(mock.mock.callCount(), 1);
  response = json({ error: "Database unavailable" }, 503, "30");
  await assert.rejects(loadMarketDirectory({ config }), (error) => isCode("DATABASE_UNAVAILABLE")(error) && error.retryAfterMs === 30000);
  assert.equal(mock.mock.callCount(), 2);
  response = json([...catalog().slice(0, 1), ...catalog().slice(0, 1)]);
  await assert.rejects(loadMarketDirectory({ config }), isCode("AMBIGUOUS_MATCH"));
  assert.equal(mock.mock.callCount(), 3);
});

test("invalid batch options and already aborted requests fail before any network access", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => { throw new Error("Must not run"); });
  for (const options of [
    { concurrency: 0 }, { concurrency: 1.5 }, { launchIntervalMs: -1 }, { launchIntervalMs: Infinity },
    { symbols: "BTC" }, { symbols: ["BTC", null] }, { symbols: ["BTC?inject=1"] }, { onResult: true },
    { config: { ...config, apiContract: "combined-v1" } }, { config: { mode: "invalid" } },
  ]) {
    await assert.rejects(loadMarketDirectory({ config, ...options }), isCode("CONFIGURATION_ERROR"));
  }
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(loadMarketDirectory({ config, signal: controller.signal }), isCode("ABORTED"));
  assert.equal(mock.mock.callCount(), 0);
});

test("explicit demo batches remain labeled simulated, honor order, and make no API requests", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => { throw new Error("Must not run"); });
  const events = [];
  const result = await loadMarketDirectory({ config: { mode: "demo" }, symbols: ["ETH", "BTC"], onResult(response) { events.push(response.data.symbol); } });
  assert.deepEqual(events, ["ETH", "BTC"]);
  assert.equal(result.directory.length, 27);
  assert.equal(result.responses.length, 2);
  assert.ok(result.responses.every(({ data, mode }) => data.simulated === true && mode === "demo"));
  assert.equal(mock.mock.callCount(), 0);
});
