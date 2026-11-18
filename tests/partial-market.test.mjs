import test from "node:test";
import assert from "node:assert/strict";
import { ApiError, lookupAsset } from "../api.js";
import { APP_CONFIG } from "../config.js";

const config = {
  mode: "api",
  apiContract: "nolan-v1",
  apiBaseUrl: "/api",
  catalogPath: "/db/cryptos",
  marketPath: "/live",
  requestTimeoutMs: 100,
  allowPartialMarket: true,
};
const profiles = () => [{ name: "Database Bitcoin", symbol: "BTC", price: 9876 }];
const quote = () => ({ symbol: "BTC", price: 50000, volume_24h: 10, source: "Coinbase Exchange" });
const isCode = (code) => (error) => error instanceof ApiError && error.code === code;

function jsonResponse(body, status = 200, retryAfter) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(retryAfter === undefined ? {} : { "Retry-After": retryAfter }),
    json: async () => body,
  };
}

function mockMarket(t, response, catalog = profiles()) {
  return t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url === "/api/db/cryptos") return jsonResponse(catalog);
    assert.equal(url, "/api/live/BTC");
    return typeof response === "function" ? response(options) : response;
  });
}

function assertPartial(result, code) {
  assert.equal(result.marketStatus, "unavailable");
  assert.equal(result.marketError.code, code);
  assert.equal(result.data.name, "Database Bitcoin");
  assert.equal(result.data.symbol, "BTC");
  assert.equal(result.data.simulated, false);
  assert.deepEqual(result.data.market, {
    priceUsd: null, volume24h: null, volumeUnit: null, asOf: null,
  });
  assert.equal(result.data.sources.profile, "MySQL via Python API");
  assert.equal(result.data.sources.market, null);
  assert.equal(result.data.category, null);
  assert.equal(result.data.description, null);
  assert.ok(Number.isFinite(Date.parse(result.data.retrievedAt)));
  assert.ok(result.warnings.some((warning) => warning.includes(result.marketError.message)));
  assert.deepEqual(result.endpointUrls, { profile: "/api/db/cryptos", market: "/api/live/BTC" });
  assert.deepEqual(result.directory, [{ symbol: "BTC", name: "Database Bitcoin", category: null }]);
}

test("partial market display is enabled explicitly in default config with bounded UI refresh and stale intervals", () => {
  assert.equal(APP_CONFIG.mode, "demo");
  assert.equal(APP_CONFIG.allowPartialMarket, true);
  assert.equal(APP_CONFIG.refreshCooldownMs, 5000);
  assert.equal(APP_CONFIG.staleAfterMs, 300000);
});

test("a market 502 retains only the database profile and preserves the exact error JSON without a price fallback", async (t) => {
  const catalog = profiles();
  const errorBody = { error: "Unable to retrieve live price", extra: { original: true } };
  const mock = mockMarket(t, jsonResponse(errorBody, 502), catalog);
  const result = await lookupAsset("BTC", { config });
  assertPartial(result, "HTTP_ERROR");
  assert.equal(result.marketError.status, 502);
  assert.equal(result.raw.profiles, catalog);
  assert.equal(result.raw.market, errorBody);
  assert.equal(result.raw.profiles[0].price, 9876);
  assert.equal(mock.mock.callCount(), 2);
});

test("an unsupported market pair retains the known database profile and distinct safe error", async (t) => {
  const errorBody = { error: "Trading pair unavailable on Coinbase" };
  mockMarket(t, jsonResponse(errorBody, 404));
  const result = await lookupAsset("Database Bitcoin", { config });
  assertPartial(result, "PRODUCT_UNAVAILABLE");
  assert.equal(result.marketError.status, 404);
  assert.match(result.marketError.message, /BTC-USD.*unavailable on Coinbase/);
  assert.equal(result.raw.market, errorBody);
});

test("rate limits expose safe Retry-After seconds or dates bounded to five minutes without automatic retries", async (t) => {
  const now = Date.UTC(2026, 10, 18, 15);
  t.mock.method(Date, "now", () => now);
  let retryAfter;
  const errorBody = { error: "Too many requests" };
  const mock = mockMarket(t, () => jsonResponse(errorBody, 429, retryAfter));
  for (const [header, expected] of [
    ["45", 45000], ["9999", 300000], ["0", 0],
    [new Date(now + 90000).toUTCString(), 90000],
    [new Date(now - 60000).toUTCString(), 0],
    [undefined, 30000], ["-1", 30000], ["not a delay", 30000],
    ["9".repeat(400), 30000],
  ]) {
    retryAfter = header;
    const result = await lookupAsset("BTC", { config });
    assertPartial(result, "HTTP_ERROR");
    assert.equal(result.marketError.status, 429);
    assert.equal(result.marketError.retryAfterMs, expected);
    assert.equal(result.raw.market, errorBody);
  }
  assert.equal(mock.mock.callCount(), 18);
});

test("strict API errors also carry the rate-limit retry delay", async (t) => {
  const errorBody = { error: "Too many requests" };
  mockMarket(t, jsonResponse(errorBody, 429, "60"));
  await assert.rejects(lookupAsset("BTC", { config: { ...config, allowPartialMarket: false } }), (error) =>
    isCode("HTTP_ERROR")(error) && error.status === 429 && error.retryAfterMs === 60000 && error.responseBody === errorBody,
  );
});

test("a 503 exposes only valid explicit Retry-After guidance, with no invented default delay", async (t) => {
  const now = Date.UTC(2026, 10, 18, 22);
  t.mock.method(Date, "now", () => now);
  let retryAfter;
  const errorBody = { error: "Coinbase rate limit reached" };
  const mock = mockMarket(t, () => jsonResponse(errorBody, 503, retryAfter));
  for (const [header, expected] of [
    ["30", 30000], ["99999", 300000], ["0", 0],
    [new Date(now + 60000).toUTCString(), 60000],
    [undefined, undefined], ["not a delay", undefined], ["-1", undefined], ["9".repeat(400), undefined],
  ]) {
    retryAfter = header;
    const result = await lookupAsset("BTC", { config });
    assertPartial(result, "HTTP_ERROR");
    assert.equal(result.marketError.status, 503);
    assert.equal(result.marketError.retryAfterMs, expected);
    assert.equal(Object.hasOwn(result.marketError, "retryAfterMs"), expected !== undefined);
    assert.equal(result.raw.market, errorBody);
  }
  assert.equal(mock.mock.callCount(), 16);
});

test("strict 503 market failures preserve explicit retry guidance and original error JSON", async (t) => {
  const errorBody = { error: "Coinbase rate limit reached" };
  mockMarket(t, jsonResponse(errorBody, 503, "45"));
  await assert.rejects(lookupAsset("BTC", { config: { ...config, allowPartialMarket: false } }), (error) =>
    isCode("HTTP_ERROR")(error) && error.status === 503 && error.retryAfterMs === 45000 && error.responseBody === errorBody,
  );
});

test("database 503 still blocks searches while preserving explicit retry guidance", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => jsonResponse({ error: "Database unavailable" }, 503, "30"));
  await assert.rejects(lookupAsset("BTC", { config }), (error) =>
    isCode("DATABASE_UNAVAILABLE")(error) && error.status === 503 && error.retryAfterMs === 30000,
  );
  assert.equal(mock.mock.callCount(), 1);
});

test("a mismatched explicit USD product retains only the database profile in partial mode", async (t) => {
  const body = { ...quote(), product_id: "ETH-USD", quote_currency: "USD", volume_unit: "BTC", provider_timestamp: "2026-11-18T22:10:17Z" };
  mockMarket(t, jsonResponse(body));
  const result = await lookupAsset("BTC", { config });
  assertPartial(result, "INVALID_RESPONSE");
  assert.equal(result.raw.market, body);
  assert.notEqual(result.data.market.priceUsd, profiles()[0].price);
});

test("malformed market fields never become zero, a stored price, or a partly valid quote", async (t) => {
  let market;
  mockMarket(t, () => jsonResponse(market));
  for (const body of [
    { ...quote(), price: "50000" }, { ...quote(), price: -1 },
    { ...quote(), volume_24h: null }, { ...quote(), volume_24h: Infinity },
    { ...quote(), symbol: "ETH" }, { ...quote(), source: "" }, null, [],
  ]) {
    market = body;
    const result = await lookupAsset("BTC", { config });
    assertPartial(result, "INVALID_RESPONSE");
    assert.equal(result.raw.market, body);
  }
});

test("a market network failure preserves a profile with no fabricated raw response or source", async (t) => {
  const mock = mockMarket(t, async () => { throw new TypeError("Network failed"); });
  const result = await lookupAsset("BTC", { config });
  assertPartial(result, "NETWORK_ERROR");
  assert.equal(result.raw.market, null);
  assert.equal(mock.mock.callCount(), 2);
});

test("a market timeout aborts its request but can finish with the already validated database profile", async (t) => {
  let deadline;
  const timer = t.mock.method(globalThis, "setTimeout", (callback) => { deadline = callback; return 12345; });
  t.mock.method(globalThis, "clearTimeout", () => {});
  const mock = mockMarket(t, async ({ signal }) => {
    deadline();
    assert.equal(signal.aborted, true);
    throw new DOMException("Aborted", "AbortError");
  });
  const result = await lookupAsset("BTC", { config });
  assertPartial(result, "TIMEOUT");
  assert.equal(result.raw.market, null);
  assert.equal(timer.mock.callCount(), 1);
  assert.equal(mock.mock.callCount(), 2);
});

test("database timeouts still reject without starting a market request", async (t) => {
  let deadline;
  t.mock.method(globalThis, "setTimeout", (callback) => { deadline = callback; return 12345; });
  t.mock.method(globalThis, "clearTimeout", () => {});
  const mock = t.mock.method(globalThis, "fetch", async (_url, { signal }) => {
    deadline();
    assert.equal(signal.aborted, true);
    throw new DOMException("Aborted", "AbortError");
  });
  await assert.rejects(lookupAsset("BTC", { config }), isCode("TIMEOUT"));
  assert.equal(mock.mock.callCount(), 1);
});

test("explicit cancellation remains an AbortError even while recovering an internal market timeout", async (t) => {
  let deadline;
  const controller = new AbortController();
  t.mock.method(globalThis, "setTimeout", (callback) => { deadline = callback; return 12345; });
  t.mock.method(globalThis, "clearTimeout", () => {});
  mockMarket(t, async () => {
    deadline();
    controller.abort();
    throw new DOMException("Aborted", "AbortError");
  });
  await assert.rejects(lookupAsset("BTC", { config, signal: controller.signal }), (error) =>
    isCode("ABORTED")(error) && error.name === "AbortError",
  );
});

test("explicit cancellation between database and market requests cannot return a partial profile", async (t) => {
  const controller = new AbortController();
  const mock = t.mock.method(globalThis, "fetch", async () => ({
    ok: true,
    json: async () => { controller.abort(); return profiles(); },
  }));
  await assert.rejects(lookupAsset("BTC", { config, signal: controller.signal }), isCode("ABORTED"));
  assert.equal(mock.mock.callCount(), 1);
});

test("database errors, missing profiles, and ambiguous profiles never return partial or demo records", async (t) => {
  let response;
  const mock = t.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(url, "/api/db/cryptos");
    return response;
  });
  for (const [body, status, code] of [
    [{ error: "Unavailable" }, 503, "DATABASE_UNAVAILABLE"],
    [[], 200, "NOT_FOUND"],
    [[{ symbol: "BTC" }], 200, "INVALID_RESPONSE"],
    [[...profiles(), ...profiles()], 200, "AMBIGUOUS_MATCH"],
  ]) {
    response = jsonResponse(body, status);
    await assert.rejects(lookupAsset("BTC", { config }), isCode(code));
  }
  assert.equal(mock.mock.callCount(), 4);
});

test("authorization and unexpected client HTTP errors still reject", async (t) => {
  let status;
  mockMarket(t, () => jsonResponse({ error: "Access denied" }, status));
  for (status of [400, 401, 403]) {
    await assert.rejects(lookupAsset("BTC", { config }), (error) => isCode("HTTP_ERROR")(error) && error.status === status);
  }
});

test("a non-JSON market response is readable as unavailable without displaying server HTML", async (t) => {
  mockMarket(t, () => new Response("<html>Private server traceback</html>", { status: 200 }));
  const result = await lookupAsset("BTC", { config });
  assertPartial(result, "INVALID_JSON");
  assert.equal(result.raw.market, null);
  assert.doesNotMatch(result.marketError.message, /traceback|<html>/);
});

test("an HTML gateway error does not become raw JSON or application error copy", async (t) => {
  mockMarket(t, () => new Response("<html>Private server traceback</html>", { status: 502 }));
  const result = await lookupAsset("BTC", { config });
  assertPartial(result, "HTTP_ERROR");
  assert.equal(result.raw.market, null);
  assert.doesNotMatch(result.marketError.message, /traceback|<html>/);
});

test("valid market data stays available with its actual source, including a valid zero quote", async (t) => {
  const market = { ...quote(), price: 0, volume_24h: 0 };
  mockMarket(t, jsonResponse(market));
  const result = await lookupAsset("BTC", { config });
  assert.equal(result.marketStatus, "available");
  assert.equal(result.marketError, null);
  assert.equal(result.data.market.priceUsd, 0);
  assert.equal(result.data.market.volume24h, 0);
  assert.equal(result.data.sources.market, "Coinbase Exchange");
  assert.equal(result.raw.market, market);
  assert.equal(result.data.market.asOf, null);
  assert.equal(result.data.market.volumeUnit, null);
});

test("invalid partial-market configuration rejects before making a request", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => { throw new Error("Must not run"); });
  for (const allowPartialMarket of ["true", 1, null, {}]) {
    await assert.rejects(lookupAsset("BTC", { config: { ...config, allowPartialMarket } }), isCode("CONFIGURATION_ERROR"));
  }
  assert.equal(mock.mock.callCount(), 0);
});

test("demo mode remains explicitly simulated and is unaffected by partial-market configuration", async () => {
  const result = await lookupAsset("BTC", { config: { ...config, mode: "demo" } });
  assert.equal(result.mode, "demo");
  assert.equal(result.data.simulated, true);
  assert.ok(Number.isFinite(result.data.market.priceUsd));
  assert.match(result.data.sources.market, /simulated/i);
});
