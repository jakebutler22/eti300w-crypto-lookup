import test from "node:test";
import assert from "node:assert/strict";
import { ApiError, loadAssetDirectory, lookupAsset } from "../api.js";
import { DEMO_ASSETS } from "../data/demo-assets.js";

const config = {
  mode: "api",
  apiContract: "nolan-v1",
  apiBaseUrl: "/api",
  catalogPath: "/db/cryptos",
  marketPath: "/live",
  requestTimeoutMs: 100,
};
const catalog = () => [
  { name: "Bitcoin from MySQL", symbol: "BTC", price: 30000 },
  { name: "Ripple", symbol: "XRP", price: 0.5 },
  { name: "Dogecoin", symbol: "DOGE", price: 0.07 },
];
const quote = (symbol = "BTC") => ({
  name: "Ignored upstream profile name",
  symbol,
  price: 72500.25,
  volume_24h: 1234.5,
  source: "Coinbase Exchange",
});
const isCode = (code) => (error) => error instanceof ApiError && error.code === code;

function mockResponses(t, responses) {
  let index = 0;
  return t.mock.method(globalThis, "fetch", async () => {
    const entry = responses[index++];
    assert.ok(entry, "No unexpected API request is made");
    if (entry.error) throw entry.error;
    return {
      ok: entry.status === undefined || (entry.status >= 200 && entry.status < 300),
      status: entry.status ?? 200,
      json: async () => entry.body,
    };
  });
}

test("Nolan lookup joins database profile with live market values and preserves both original payloads", async (t) => {
  const profiles = catalog();
  profiles[0].internal_note = "kept only in original JSON";
  const market = quote();
  market.upstream_extra = { retained: true };
  const before = Date.now();
  const mock = mockResponses(t, [{ body: profiles }, { body: market }]);
  const result = await lookupAsset(" Bitcoin   from MySQL ", { config });
  assert.equal(result.mode, "api");
  assert.equal(result.contract, "nolan-v1");
  assert.equal(result.data.name, "Bitcoin from MySQL");
  assert.equal(result.data.symbol, "BTC");
  assert.equal(result.data.market.priceUsd, market.price);
  assert.notEqual(result.data.market.priceUsd, profiles[0].price);
  assert.deepEqual(result.data.market, {
    priceUsd: 72500.25, volume24h: 1234.5, volumeUnit: null, asOf: null,
  });
  assert.deepEqual(result.data.sources, { profile: "MySQL via Python API", market: "Coinbase Exchange" });
  assert.equal(result.data.simulated, false);
  assert.ok(Date.parse(result.data.retrievedAt) >= before);
  assert.ok(Date.parse(result.data.retrievedAt) <= Date.now());
  assert.match(result.data.retrievedAt, /^\d{4}-\d{2}-\d{2}T.*Z$/);
  assert.equal(result.raw.profiles, profiles);
  assert.equal(result.raw.market, market);
  assert.equal(profiles[0].name, "Bitcoin from MySQL");
  assert.equal(market.name, "Ignored upstream profile name");
  assert.equal(result.endpointUrl, null);
  assert.deepEqual(result.endpointUrls, { profile: "/api/db/cryptos", market: "/api/live/BTC" });
  assert.deepEqual(result.directory, profiles.map(({ symbol, name }) => ({ symbol, name, category: null })));
  assert.notEqual(result.directory[0], profiles[0]);
  assert.deepEqual(mock.mock.calls.map(({ arguments: args }) => args[0]), ["/api/db/cryptos", "/api/live/BTC"]);
  for (const { arguments: [, options] } of mock.mock.calls) {
    assert.equal(options.method, "GET");
    assert.equal(options.headers.Accept, "application/json");
    assert.equal(options.cache, "no-store");
    assert.equal(options.credentials, "same-origin");
  }
  assert.equal(mock.mock.calls[0].arguments[1].signal, mock.mock.calls[1].arguments[1].signal);
});

test("Nolan names and tickers resolve from the database catalog", async (t) => {
  const mock = t.mock.method(globalThis, "fetch");
  for (const [query, symbol] of [["rIpPlE", "XRP"], [" doge ", "DOGE"], ["Dogecoin", "DOGE"]]) {
    mock.mock.mockImplementation(async (url) => ({
      ok: true,
      json: async () => url.endsWith("/db/cryptos") ? catalog() : quote(symbol),
    }));
    const result = await lookupAsset(query, { config });
    assert.equal(result.data.symbol, symbol);
    assert.equal(result.endpointUrls.market, `/api/live/${symbol}`);
  }
});

test("a requested website asset missing from the database cannot generate a speculative market request", async (t) => {
  const mock = mockResponses(t, [{ body: catalog() }]);
  await assert.rejects(lookupAsset("SHIB", { config }), isCode("NOT_FOUND"));
  assert.equal(mock.mock.callCount(), 1);
  assert.equal(mock.mock.calls[0].arguments[0], "/api/db/cryptos");
});

test("Nolan missing metadata is explicit and no local category, description, timestamp, or volume unit fills it", async (t) => {
  mockResponses(t, [{ body: catalog() }, { body: quote() }]);
  const { data, warnings } = await lookupAsset("BTC", { config });
  assert.equal(data.category, null);
  assert.equal(data.description, null);
  assert.equal(data.market.asOf, null);
  assert.equal(data.market.volumeUnit, null);
  assert.equal("volume24hUsd" in data.market, false);
  assert.equal(warnings.length, 4);
  assert.ok(warnings.some((text) => /category/i.test(text)));
  assert.ok(warnings.some((text) => /description/i.test(text)));
  assert.ok(warnings.some((text) => /timestamp/i.test(text)));
  assert.ok(warnings.some((text) => /unit/i.test(text)));
});

test("deployed provider time and verified base volume units map without replacing browser receipt time or original JSON", async (t) => {
  const profiles = catalog();
  profiles[0].category = "Digital currency";
  profiles[0].description = "A profile returned by the database.";
  const market = {
    ...quote(), product_id: "BTC-USD", quote_currency: "USD",
    provider_timestamp: "2026-11-18T22:10:17.833555643Z",
    retrieved_at: "2026-11-18T22:10:19Z", volume_unit: "BTC", volume_24h_unit: "BTC",
  };
  const before = Date.now();
  mockResponses(t, [{ body: profiles }, { body: market }]);
  const result = await lookupAsset("BTC", { config });
  assert.deepEqual(result.data.market, {
    priceUsd: market.price, volume24h: market.volume_24h,
    volumeUnit: "BTC", asOf: market.provider_timestamp,
  });
  assert.equal(result.data.category, profiles[0].category);
  assert.equal(result.data.description, profiles[0].description);
  assert.equal(result.warnings.length, 0);
  assert.ok(Date.parse(result.data.retrievedAt) >= before);
  assert.ok(Date.parse(result.data.retrievedAt) <= Date.now());
  assert.notEqual(result.data.retrievedAt, market.retrieved_at);
  assert.notEqual(result.data.retrievedAt, market.provider_timestamp);
  assert.equal(result.raw.profiles, profiles);
  assert.equal(result.raw.market, market);
  assert.equal(result.raw.market.provider_timestamp, "2026-11-18T22:10:17.833555643Z");
});

test("optional provider timestamps require a valid calendar date and explicit timezone without invalidating a usable price", async (t) => {
  let provider_timestamp;
  t.mock.method(globalThis, "fetch", async (url) => ({
    ok: true, json: async () => url.endsWith("/db/cryptos") ? catalog() : { ...quote(), provider_timestamp, volume_unit: "BTC" },
  }));
  for (provider_timestamp of [null, undefined, "", 123, "2026-11-18T22:10:17", "2026-02-30T22:10:17Z", "2026-11-18T25:00:00Z", "not a timestamp"]) {
    const result = await lookupAsset("BTC", { config });
    assert.equal(result.marketStatus, "available");
    assert.equal(result.data.market.priceUsd, quote().price);
    assert.equal(result.data.market.asOf, null);
    assert.equal(result.data.market.volumeUnit, "BTC");
    assert.ok(result.warnings.some((text) => /valid provider quote timestamp/.test(text)));
  }
});

test("either volume-unit alias may identify the selected base asset but conflicts never become USD volume", async (t) => {
  let unitFields;
  t.mock.method(globalThis, "fetch", async (url) => ({
    ok: true, json: async () => url.endsWith("/db/cryptos") ? catalog() : { ...quote(), ...unitFields },
  }));
  for (const [fields, expected] of [
    [{ volume_unit: "BTC" }, "BTC"], [{ volume_24h_unit: " btc " }, "BTC"],
    [{ volume_unit: "BTC", volume_24h_unit: "btc" }, "BTC"],
    [{ volume_unit: "BTC", volume_24h_unit: null }, "BTC"],
    [{ volume_unit: "BTC", volume_24h_unit: "ETH" }, null],
    [{ volume_unit: "USD" }, null], [{ volume_unit: "ETH" }, null],
    [{ volume_unit: 10 }, null], [{ volume_unit: " " }, null], [{}, null],
  ]) {
    unitFields = fields;
    const result = await lookupAsset("BTC", { config });
    assert.equal(result.marketStatus, "available");
    assert.equal(result.data.market.volumeUnit, expected);
    assert.equal("volume24hUsd" in result.data.market, false);
    assert.equal(result.warnings.some((text) => /base-asset unit/.test(text)), expected === null);
    for (const key of Object.keys(fields)) assert.equal(result.raw.market[key], fields[key]);
  }
});

test("an explicitly non-USD or mismatched product cannot be displayed as the selected USD price", async (t) => {
  let fields;
  t.mock.method(globalThis, "fetch", async (url) => ({
    ok: true, json: async () => url.endsWith("/db/cryptos") ? catalog() : { ...quote(), ...fields },
  }));
  for (fields of [
    { product_id: "ETH-USD" }, { product_id: "BTC-USDT" }, { product_id: "" }, { product_id: null },
    { product_id: 10 }, { quote_currency: "EUR" }, { quote_currency: "USDT" }, { quote_currency: null },
    { quote_currency: false }, { quote_currency: " " },
  ]) {
    await assert.rejects(lookupAsset("BTC", { config }), (error) =>
      isCode("INVALID_RESPONSE")(error) && /USD product or quote currency/.test(error.message),
    );
  }
});

test("matching optional USD product metadata accepts harmless case and surrounding whitespace", async (t) => {
  mockResponses(t, [{ body: catalog() }, { body: { ...quote(), product_id: " btc-usd ", quote_currency: " usd " } }]);
  const result = await lookupAsset("BTC", { config });
  assert.equal(result.marketStatus, "available");
  assert.equal(result.data.market.priceUsd, quote().price);
  assert.equal(result.raw.market.product_id, " btc-usd ");
});

test("Nolan optional profile fields come only from the database", async (t) => {
  const profiles = [{ name: " Ripple  ", symbol: " xrp ", category: " Payments ", description: " A database profile. ", price: 100 }];
  const market = quote(" xrp ");
  market.source = " Coinbase Exchange ";
  mockResponses(t, [{ body: profiles }, { body: market }]);
  const result = await lookupAsset("Ripple", { config });
  assert.equal(result.data.category, "Payments");
  assert.equal(result.data.description, "A database profile.");
  assert.equal(result.data.sources.market, "Coinbase Exchange");
  assert.equal(result.warnings.length, 2);
  assert.equal(result.raw.profiles[0].category, " Payments ");
  assert.equal(result.raw.market.symbol, " xrp ");
});

test("blank or null optional database fields remain unavailable with explicit warnings", async (t) => {
  mockResponses(t, [{ body: [{ name: "Bitcoin", symbol: "BTC", category: "  ", description: null }] }, { body: quote() }]);
  const result = await lookupAsset("BTC", { config });
  assert.equal(result.data.category, null);
  assert.equal(result.data.description, null);
  assert.equal(result.warnings.length, 4);
});

test("Nolan directory lists only returned MySQL profiles without requesting Coinbase", async (t) => {
  const profiles = [
    { name: "  Database   Coin  ", symbol: " new ", price: "stale and intentionally ignored" },
    { name: "Ripple", symbol: "XRP", category: " Payments " },
  ];
  const mock = mockResponses(t, [{ body: profiles }]);
  const directory = await loadAssetDirectory({ config });
  assert.deepEqual(directory, [
    { name: "Database Coin", symbol: "NEW", category: null },
    { name: "Ripple", symbol: "XRP", category: "Payments" },
  ]);
  assert.equal(mock.mock.callCount(), 1);
  assert.equal(mock.mock.calls[0].arguments[0], "/api/db/cryptos");
  assert.deepEqual(profiles[0], { name: "  Database   Coin  ", symbol: " new ", price: "stale and intentionally ignored" });
});

test("an empty database directory stays empty and an unknown or partial name never triggers a market request", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => ({ ok: true, json: async () => [] }));
  assert.deepEqual(await loadAssetDirectory({ config }), []);
  await assert.rejects(lookupAsset("BTC", { config }), isCode("NOT_FOUND"));
  mock.mock.mockImplementation(async () => ({ ok: true, json: async () => catalog() }));
  await assert.rejects(lookupAsset("Bit", { config }), isCode("NOT_FOUND"));
  assert.equal(mock.mock.callCount(), 3);
  assert.ok(mock.mock.calls.every(({ arguments: [url] }) => url === "/api/db/cryptos"));
});

test("duplicate matching names or tickers are rejected rather than selecting an arbitrary database row", async (t) => {
  const mock = t.mock.method(globalThis, "fetch");
  for (const [query, profiles] of [
    ["Bitcoin", [{ name: "Bitcoin", symbol: "BTC" }, { name: "Bitcoin", symbol: "BCH" }]],
    ["BTC", [{ name: "Bitcoin", symbol: "BTC" }, { name: "Different Bitcoin", symbol: "btc" }]],
    ["BTC", [{ name: "Bitcoin", symbol: "BTC" }, { name: "BTC", symbol: "OTHER" }]],
  ]) {
    mock.mock.mockImplementation(async () => ({ ok: true, json: async () => profiles }));
    await assert.rejects(lookupAsset(query, { config }), isCode("AMBIGUOUS_MATCH"));
  }
  assert.equal(mock.mock.callCount(), 3);
});

test("database failure is explicit and cannot trigger live market requests or demo fallback", async (t) => {
  const mock = mockResponses(t, [{ status: 503, body: { error: "Unable to retrieve cryptocurrency data from database" } }]);
  await assert.rejects(lookupAsset("BTC", { config }), (error) =>
    isCode("DATABASE_UNAVAILABLE")(error) && error.status === 503 && /database profiles.*unavailable/i.test(error.message),
  );
  assert.equal(mock.mock.callCount(), 1);
});

test("database JSON and profile validation fail before a market request", async (t) => {
  const mock = t.mock.method(globalThis, "fetch");
  for (const body of [
    null, {}, { data: catalog() }, [null], [{ symbol: "BTC" }], [{ name: "Bitcoin" }],
    [{ name: " ", symbol: "BTC" }], [{ name: "Bitcoin", symbol: "../live" }],
    [{ name: "Bitcoin", symbol: "BTC", category: 4 }],
    [{ name: "Bitcoin", symbol: "BTC", description: {} }],
  ]) {
    mock.mock.mockImplementation(async () => ({ ok: true, json: async () => body }));
    await assert.rejects(lookupAsset("BTC", { config }), isCode("INVALID_RESPONSE"));
  }
  assert.equal(mock.mock.callCount(), 10);
  assert.ok(mock.mock.calls.every(({ arguments: [url] }) => url === "/api/db/cryptos"));
  mock.mock.mockImplementation(async () => new Response("<html>Database error</html>"));
  await assert.rejects(lookupAsset("BTC", { config }), isCode("INVALID_JSON"));
  mock.mock.mockImplementation(async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(lookupAsset("BTC", { config }), isCode("NETWORK_ERROR"));
});

test("Nolan market values must be finite nonnegative JSON numbers; stored prices never fill invalid quotes", async (t) => {
  const mock = t.mock.method(globalThis, "fetch");
  for (const field of ["price", "volume_24h"]) {
    for (const bad of ["100", null, undefined, false, -1, NaN, Infinity, -Infinity]) {
      const market = { ...quote(), [field]: bad };
      mock.mock.mockImplementation(async (url) => ({ ok: true, json: async () => url.endsWith("/db/cryptos") ? catalog() : market }));
      await assert.rejects(lookupAsset("BTC", { config }), isCode("INVALID_RESPONSE"));
    }
  }
  assert.equal(mock.mock.callCount(), 32);
});

test("Nolan market symbol and source are required and the returned symbol must match the selected database profile", async (t) => {
  const mock = t.mock.method(globalThis, "fetch");
  for (const market of [null, [], {}, { ...quote(), symbol: "ETH" }, { ...quote(), symbol: null }, { ...quote(), source: " " }, { ...quote(), source: 123 }]) {
    mock.mock.mockImplementation(async (url) => ({ ok: true, json: async () => url.endsWith("/db/cryptos") ? catalog() : market }));
    await assert.rejects(lookupAsset("BTC", { config }), isCode("INVALID_RESPONSE"));
  }
});

test("Nolan accepts a real zero quote and volume without copying the database price", async (t) => {
  mockResponses(t, [{ body: catalog() }, { body: { ...quote(), price: 0, volume_24h: 0 } }]);
  const { data } = await lookupAsset("BTC", { config });
  assert.equal(data.market.priceUsd, 0);
  assert.equal(data.market.volume24h, 0);
  assert.equal(data.simulated, false);
});

test("unsupported Coinbase pairs are distinct from unknown database names and arbitrary server messages stay out of UI errors", async (t) => {
  const mock = t.mock.method(globalThis, "fetch");
  for (const [body, expected] of [
    [{ error: "Trading pair unavailable on Coinbase" }, /BTC-USD.*unavailable on Coinbase/],
    [{ error: "Cryptocurrency not found" }, /in the database.*does not support/],
    [{ error: "<script>arbitrary traceback or credentials</script>" }, /no supported USD trading pair/],
  ]) {
    mock.mock.mockImplementation(async (url) => ({
      ok: url.endsWith("/db/cryptos"), status: url.endsWith("/db/cryptos") ? 200 : 404,
      json: async () => url.endsWith("/db/cryptos") ? catalog() : body,
    }));
    await assert.rejects(lookupAsset("BTC", { config }), (error) =>
      isCode("PRODUCT_UNAVAILABLE")(error) && error.status === 404 && expected.test(error.message) && !/arbitrary/.test(error.message),
    );
  }
});

test("upstream market failure never falls back to a database price", async (t) => {
  const mock = mockResponses(t, [{ body: catalog() }, { status: 502, body: { error: "Unable to retrieve live price" } }]);
  await assert.rejects(lookupAsset("BTC", { config }), (error) => isCode("HTTP_ERROR")(error) && error.status === 502);
  assert.equal(mock.mock.callCount(), 2);
});

test("cancellation between the catalog and quote prevents the second request", async (t) => {
  const controller = new AbortController();
  const mock = t.mock.method(globalThis, "fetch", async () => ({
    ok: true,
    json: async () => { controller.abort(); return catalog(); },
  }));
  await assert.rejects(lookupAsset("BTC", { config, signal: controller.signal }), isCode("ABORTED"));
  assert.equal(mock.mock.callCount(), 1);
});

test("cancellation of the live request stays distinct from a timeout", async (t) => {
  const controller = new AbortController();
  const mock = t.mock.method(globalThis, "fetch", async (url, { signal }) => {
    if (url.endsWith("/db/cryptos")) return { ok: true, json: async () => catalog() };
    controller.abort();
    if (signal.aborted) throw new DOMException("Aborted", "AbortError");
    throw new Error("The live request should be aborted");
  });
  await assert.rejects(lookupAsset("BTC", { config, signal: controller.signal }), isCode("ABORTED"));
  assert.equal(mock.mock.callCount(), 2);
});

test("one shared timeout covers the catalog and live request rather than restarting for the quote", async (t) => {
  let deadline;
  const timerMock = t.mock.method(globalThis, "setTimeout", (callback, milliseconds) => {
    assert.equal(milliseconds, config.requestTimeoutMs);
    deadline = callback;
    return 12345;
  });
  t.mock.method(globalThis, "clearTimeout", () => {});
  const mock = t.mock.method(globalThis, "fetch", async (url, { signal }) => {
    if (url.endsWith("/db/cryptos")) return { ok: true, json: async () => catalog() };
    deadline();
    assert.equal(signal.aborted, true);
    throw new DOMException("Aborted", "AbortError");
  });
  await assert.rejects(lookupAsset("BTC", { config }), isCode("TIMEOUT"));
  assert.equal(timerMock.mock.callCount(), 1);
  assert.equal(mock.mock.callCount(), 2);
});

test("Nolan validates both routes and its API contract before any network request", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => { throw new Error("must not run"); });
  for (const overrides of [
    { apiContract: "unknown" }, { catalogPath: "db/cryptos" }, { marketPath: "live" },
    { marketPath: "/live?other=1" }, { catalogPath: "/db/cryptos#fragment" },
    { apiBaseUrl: "https://user:password@example.com/api" },
    { apiBaseUrl: "https://example.com/api?secret=bad" },
    { apiBaseUrl: "https://example.com/api#fragment" },
    { requestTimeoutMs: 0 }, { requestTimeoutMs: "20000" },
  ]) {
    await assert.rejects(lookupAsset("BTC", { config: { ...config, ...overrides } }), isCode("CONFIGURATION_ERROR"));
  }
  assert.equal(mock.mock.callCount(), 0);
});

test("Nolan supports a public HTTP(S) API origin without changing the actual route names", async (t) => {
  const mock = mockResponses(t, [{ body: catalog() }, { body: quote() }]);
  const result = await lookupAsset("BTC", { config: { ...config, apiBaseUrl: "https://middleware.example/api/" } });
  assert.deepEqual(result.endpointUrls, {
    profile: "https://middleware.example/api/db/cryptos", market: "https://middleware.example/api/live/BTC",
  });
  assert.equal(mock.mock.callCount(), 2);
});

test("older API config without apiContract keeps the original combined-v1 response contract", async (t) => {
  const raw = { data: structuredClone(DEMO_ASSETS[0]) };
  mockResponses(t, [{ body: raw }]);
  const result = await lookupAsset("BTC", { config: {
    mode: "api", apiBaseUrl: "/api", lookupPath: "/cryptocurrencies", requestTimeoutMs: 100,
  } });
  assert.equal(result.contract, "combined-v1");
  assert.equal(result.endpointUrl, "/api/cryptocurrencies?query=BTC");
  assert.equal(result.data.market.volume24hUsd, raw.data.market.volume24hUsd);
});

test("directory loading respects demo/API modes and cancellation without seeding API data from fixtures", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => { throw new Error("must not run"); });
  assert.equal((await loadAssetDirectory({ config: { mode: "demo" } })).length, 27);
  assert.deepEqual(await loadAssetDirectory({ config: { ...config, apiContract: "combined-v1" } }), []);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(loadAssetDirectory({ config, signal: controller.signal }), isCode("ABORTED"));
  await assert.rejects(loadAssetDirectory({ config: { mode: "invalid" } }), isCode("CONFIGURATION_ERROR"));
  assert.equal(mock.mock.callCount(), 0);
});
