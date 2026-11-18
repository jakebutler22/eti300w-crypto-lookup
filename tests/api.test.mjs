import test from "node:test";
import assert from "node:assert/strict";
import { APP_CONFIG } from "../config.js";
import { ApiError, getAssetDirectory, loadAssetDirectory, lookupAsset } from "../api.js";
import { DEMO_ASSETS, TEAM_ASSETS } from "../data/demo-assets.js";

const apiConfig = {
  mode: "api",
  apiContract: "combined-v1",
  apiBaseUrl: "https://middleware.example/api/",
  lookupPath: "/cryptocurrencies",
  requestTimeoutMs: 100,
};

const demoConfig = { ...APP_CONFIG, mode: "demo" };

const envelope = () => ({ data: structuredClone(DEMO_ASSETS[0]) });
const isCode = (code) => (error) => error instanceof ApiError && error.code === code;

function mockJson(t, body, status = 200) {
  return t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  }));
}

test("default mode uses the production API and explicit fixtures contain all 27 requested assets", () => {
  assert.equal(APP_CONFIG.mode, "api");
  assert.equal(APP_CONFIG.apiBaseUrl, "/api");
  assert.equal(APP_CONFIG.lookupPath, "/cryptocurrencies");
  assert.equal(APP_CONFIG.apiContract, "nolan-v1");
  assert.equal(APP_CONFIG.catalogPath, "/db/cryptos");
  assert.equal(APP_CONFIG.marketPath, "/live");
  assert.equal(APP_CONFIG.requestTimeoutMs, 20000);
  const directory = getAssetDirectory();
  assert.deepEqual(directory.map(({ symbol }) => symbol), ["BTC", "ETH", "XRP", "LTC", "ADA", "DOGE", "SOL", "BCH", "LINK", "AVAX", "DOT", "XLM", "UNI", "ATOM", "SHIB", "POL", "ETC", "HBAR", "NEAR", "AAVE", "ICP", "APT", "ARB", "OP", "SUI", "ALGO", "FIL"]);
  assert.deepEqual(Object.keys(directory[0]), ["symbol", "name", "category"]);
  directory[0].name = "Changed";
  assert.equal(getAssetDirectory()[0].name, "Bitcoin");
});

test("default lookups load the real directory and Coinbase market route without using fixtures", async (t) => {
  const catalog = [{ symbol: "BTC", name: "Backend Bitcoin", category: "Backend category", price: 123 }];
  const market = { symbol: "BTC", price: 90123.45, volume_24h: 75.5, source: "Coinbase Exchange" };
  const mock = t.mock.method(globalThis, "fetch", async (url) => {
    if (url === "/api/db/cryptos") return new Response(JSON.stringify(catalog));
    assert.equal(url, "/api/live/BTC");
    return new Response(JSON.stringify(market));
  });
  assert.deepEqual(await loadAssetDirectory(), [{ symbol: "BTC", name: "Backend Bitcoin", category: "Backend category" }]);
  const result = await lookupAsset("Backend Bitcoin");
  assert.equal(result.mode, "api");
  assert.equal(result.data.name, "Backend Bitcoin");
  assert.equal(result.data.market.priceUsd, market.price);
  assert.notEqual(result.data.market.priceUsd, catalog[0].price);
  assert.equal(result.data.simulated, false);
  assert.deepEqual(result.raw, { profiles: catalog, market });
  assert.deepEqual(mock.mock.calls.map(({ arguments: [url] }) => url), ["/api/db/cryptos", "/api/db/cryptos", "/api/live/BTC"]);
});

test("default API failures cannot silently return sample prices or a fixture directory", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify({ error: "Database unavailable" }), { status: 503 }));
  await assert.rejects(loadAssetDirectory(), isCode("DATABASE_UNAVAILABLE"));
  await assert.rejects(lookupAsset("BTC"), isCode("DATABASE_UNAVAILABLE"));
  assert.equal(mock.mock.callCount(), 2);
});

test("the requested directory preserves all supplied names and categories without Monero or USDC", () => {
  const expected = [
    ["BTC", "Bitcoin", "Digital currency"],
    ["ETH", "Ethereum", "Smart contract platform"],
    ["XRP", "Ripple", "Payments"],
    ["LTC", "Litecoin", "Digital currency"],
    ["ADA", "Cardano", "Smart contract platform"],
    ["DOGE", "Dogecoin", "Meme cryptocurrency"],
    ["SOL", "Solana", "Smart contract platform"],
    ["BCH", "Bitcoin Cash", "Digital currency"],
    ["LINK", "Chainlink", "Oracle network"],
    ["AVAX", "Avalanche", "Smart contract platform"],
    ["DOT", "Polkadot", "Interoperability"],
    ["XLM", "Stellar", "Payments"],
    ["UNI", "Uniswap", "Decentralized exchange"],
    ["ATOM", "Cosmos", "Interoperability"],
    ["SHIB", "Shiba Inu", "Meme cryptocurrency"],
    ["POL", "Polygon", "Layer 2 scaling"],
    ["ETC", "Ethereum Classic", "Smart contract platform"],
    ["HBAR", "Hedera", "Smart contract platform"],
    ["NEAR", "NEAR Protocol", "Smart contract platform"],
    ["AAVE", "Aave", "Lending protocol"],
    ["ICP", "Internet Computer", "Smart contract platform"],
    ["APT", "Aptos", "Smart contract platform"],
    ["ARB", "Arbitrum", "Layer 2 scaling"],
    ["OP", "Optimism", "Layer 2 scaling"],
    ["SUI", "Sui", "Smart contract platform"],
    ["ALGO", "Algorand", "Smart contract platform"],
    ["FIL", "Filecoin", "Decentralized storage"],
  ];
  assert.deepEqual(TEAM_ASSETS.map(({ symbol, name, category }) => [symbol, name, category]), expected);
  assert.deepEqual(DEMO_ASSETS.map(({ symbol, name, category }) => [symbol, name, category]), expected);
  assert.equal(new Set(TEAM_ASSETS.map(({ symbol }) => symbol)).size, 27);
  assert.ok(Object.isFrozen(TEAM_ASSETS));
  assert.ok(TEAM_ASSETS.every(Object.isFrozen));
});

test("demo searches match ticker and name without case or outer-whitespace sensitivity", async () => {
  const [ticker, name, multiword] = await Promise.all([
    lookupAsset(" btc ", { config: demoConfig }), lookupAsset("eThErEuM", { config: demoConfig }), lookupAsset("  Bitcoin   Cash ", { config: demoConfig }),
  ]);
  assert.equal(ticker.data.symbol, "BTC");
  assert.equal(name.data.symbol, "ETH");
  assert.equal(multiword.data.symbol, "BCH");
  assert.equal(ticker.mode, "demo");
  assert.equal(ticker.endpointUrl, null);
  assert.equal(ticker.data.simulated, true);
  assert.equal(ticker.data.market.asOf, "2026-11-08T14:00:00Z");
  assert.match(ticker.data.sources.market, /Simulated/);
  assert.deepEqual(ticker.raw, { data: ticker.data });
  ticker.data.market.priceUsd = 1;
  assert.notEqual(ticker.raw.data.market.priceUsd, 1);
  assert.notEqual(DEMO_ASSETS[0].market.priceUsd, 1);
});

test("every requested asset has a complete independently usable demo record", async () => {
  await Promise.all(getAssetDirectory().map(async ({ symbol }) => {
    const { data } = await lookupAsset(symbol, { config: demoConfig });
    assert.ok(data.description.length > 50);
    assert.ok(Number.isFinite(data.market.priceUsd));
    assert.ok(Number.isFinite(data.market.volume24hUsd));
    assert.ok(data.market.priceUsd >= 0);
    assert.ok(data.market.volume24hUsd >= 0);
    assert.equal(data.simulated, true);
  }));
});

test("expanded samples never fetch market data and removed assets cannot be selected", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => { throw new Error("Samples must stay local"); });
  await Promise.all(TEAM_ASSETS.map(async ({ name, symbol }) => {
    const { data } = await lookupAsset(name, { config: demoConfig });
    assert.equal(data.symbol, symbol);
    assert.equal(data.market.asOf, "2026-11-08T14:00:00Z");
    assert.match(data.sources.market, /Simulated/);
  }));
  await assert.rejects(lookupAsset("XMR", { config: demoConfig }), isCode("NOT_FOUND"));
  await assert.rejects(lookupAsset("Monero", { config: demoConfig }), isCode("NOT_FOUND"));
  await assert.rejects(lookupAsset("USDC", { config: demoConfig }), isCode("NOT_FOUND"));
  assert.equal(mock.mock.callCount(), 0);
});

test("empty, unsupported, oversized, and unknown searches have explicit errors", async () => {
  await assert.rejects(lookupAsset("  ", { config: demoConfig }), isCode("EMPTY_QUERY"));
  await assert.rejects(lookupAsset(null, { config: demoConfig }), isCode("INVALID_QUERY"));
  await assert.rejects(lookupAsset("A".repeat(121), { config: demoConfig }), isCode("INVALID_QUERY"));
  await assert.rejects(lookupAsset("not-a-coin", { config: demoConfig }), isCode("NOT_FOUND"));
});

test("demo cancellation supports pending and already cancelled requests", async () => {
  const controller = new AbortController();
  const pending = lookupAsset("BTC", { signal: controller.signal, config: demoConfig });
  controller.abort();
  await assert.rejects(pending, (error) => isCode("ABORTED")(error) && error.name === "AbortError");
  await assert.rejects(lookupAsset("BTC", { signal: controller.signal, config: demoConfig }), isCode("ABORTED"));
});

test("API requests encode search, use GET JSON, and preserve original JSON", async (t) => {
  const raw = envelope();
  raw.data.symbol = " btc ";
  raw.data.name = " Bitcoin ";
  raw.metadata = { upstream: "middleware-test" };
  const mock = mockJson(t, raw);
  const result = await lookupAsset(" USD Coin ", { config: apiConfig });
  assert.equal(result.mode, "api");
  assert.equal(result.endpointUrl, "https://middleware.example/api/cryptocurrencies?query=USD+Coin");
  assert.equal(result.data.symbol, "BTC");
  assert.equal(result.data.name, "Bitcoin");
  assert.deepEqual(result.raw, raw);
  const [url, options] = mock.mock.calls[0].arguments;
  assert.equal(url, result.endpointUrl);
  assert.equal(options.method, "GET");
  assert.equal(options.headers.Accept, "application/json");
  assert.equal(options.credentials, "same-origin");
  assert.equal(options.cache, "no-store");
});

test("same-origin reverse proxy configuration builds a relative endpoint", async (t) => {
  mockJson(t, envelope());
  const result = await lookupAsset("BTC", { config: { ...apiConfig, apiBaseUrl: "/api" } });
  assert.equal(result.endpointUrl, "/api/cryptocurrencies?query=BTC");
});

test("query values cannot inject a different route or extra query parameter", async (t) => {
  mockJson(t, envelope());
  const result = await lookupAsset("BTC&admin=true/#", { config: apiConfig });
  const url = new URL(result.endpointUrl);
  assert.equal(url.pathname, "/api/cryptocurrencies");
  assert.equal(url.searchParams.get("query"), "BTC&admin=true/#");
  assert.deepEqual([...url.searchParams.keys()], ["query"]);
  assert.equal(url.hash, "");
});

test("HTTP errors propagate without fallback and include status", async (t) => {
  const mock = t.mock.method(globalThis, "fetch");
  for (const [status, code] of [[404, "NOT_FOUND"], [429, "HTTP_ERROR"], [500, "HTTP_ERROR"], [503, "HTTP_ERROR"]]) {
    mock.mock.mockImplementation(async () => new Response("backend failure", { status }));
    await assert.rejects(lookupAsset("BTC", { config: apiConfig }), (error) => isCode(code)(error) && error.status === status);
  }
});

test("invalid JSON is distinct from network errors", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => new Response("<html>Bad gateway</html>"));
  await assert.rejects(lookupAsset("BTC", { config: apiConfig }), isCode("INVALID_JSON"));
  mock.mock.mockImplementation(async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(lookupAsset("BTC", { config: apiConfig }), isCode("NETWORK_ERROR"));
});

test("invalid response shapes and numeric strings fail rather than becoming zero or demo quotes", async (t) => {
  const mock = t.mock.method(globalThis, "fetch");
  const invalidBodies = [null, [], {}, { data: [] }, { data: DEMO_ASSETS[0].market }];
  for (const key of ["symbol", "name", "category", "description"]) {
    const raw = envelope();
    raw.data[key] = " ";
    invalidBodies.push(raw);
  }
  for (const key of ["priceUsd", "volume24hUsd"]) {
    for (const badValue of ["100", -1, null, false, "", "Infinity"]) {
      const raw = envelope();
      raw.data.market[key] = badValue;
      invalidBodies.push(raw);
    }
  }
  for (const badValue of [undefined, null, "false", 0]) {
    const raw = envelope();
    raw.data.simulated = badValue;
    invalidBodies.push(raw);
  }
  for (const key of ["profile", "market"]) {
    const raw = envelope();
    raw.data.sources[key] = "";
    invalidBodies.push(raw);
  }
  for (const raw of invalidBodies) {
    mock.mock.mockImplementation(async () => new Response(JSON.stringify(raw)));
    await assert.rejects(lookupAsset("BTC", { config: apiConfig }), isCode("INVALID_RESPONSE"));
  }
});

test("nonfinite numbers are rejected even from a nonstandard JSON response implementation", async (t) => {
  const mock = t.mock.method(globalThis, "fetch");
  for (const badValue of [NaN, Infinity, -Infinity]) {
    const raw = envelope();
    raw.data.market.priceUsd = badValue;
    mock.mock.mockImplementation(async () => ({ ok: true, json: async () => raw }));
    await assert.rejects(lookupAsset("BTC", { config: apiConfig }), isCode("INVALID_RESPONSE"));
  }
});

test("freshness requires a valid ISO timestamp with an explicit timezone", async (t) => {
  const mock = t.mock.method(globalThis, "fetch");
  for (const asOf of ["yesterday", "2026-11-08", "2026-11-08T14:00:00", "2026-02-31T14:00:00Z", "2026-11-08T24:00:00Z", "2026-13-08T14:00:00Z"]) {
    const raw = envelope();
    raw.data.market.asOf = asOf;
    mock.mock.mockImplementation(async () => new Response(JSON.stringify(raw)));
    await assert.rejects(lookupAsset("BTC", { config: apiConfig }), isCode("INVALID_RESPONSE"));
  }
  for (const asOf of ["2026-11-08T14:00:00Z", "2026-11-08T09:00:00-05:00", "2026-11-08T14:00:00.125Z"]) {
    const raw = envelope();
    raw.data.market.asOf = asOf;
    mock.mock.mockImplementation(async () => new Response(JSON.stringify(raw)));
    const result = await lookupAsset("BTC", { config: apiConfig });
    assert.equal(result.data.market.asOf, asOf);
  }
});

test("API accepts valid zero values and an explicit nonsimulated record", async (t) => {
  const raw = envelope();
  raw.data.market.priceUsd = 0;
  raw.data.market.volume24hUsd = 0;
  raw.data.simulated = false;
  mockJson(t, raw);
  const result = await lookupAsset("BTC", { config: apiConfig });
  assert.equal(result.data.market.priceUsd, 0);
  assert.equal(result.data.market.volume24hUsd, 0);
  assert.equal(result.data.simulated, false);
});

function pendingUntilAborted(_url, { signal }) {
  return new Promise((_resolve, reject) => {
    const onAbort = () => reject(new DOMException("Aborted", "AbortError"));
    if (signal.aborted) onAbort();
    else signal.addEventListener("abort", onAbort, { once: true });
  });
}

test("slow API requests time out explicitly", async (t) => {
  t.mock.method(globalThis, "fetch", pendingUntilAborted);
  await assert.rejects(lookupAsset("BTC", { config: { ...apiConfig, requestTimeoutMs: 5 } }), isCode("TIMEOUT"));
});

test("API cancellation is distinct from timeout and no request runs when already aborted", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", pendingUntilAborted);
  const controller = new AbortController();
  const pending = lookupAsset("BTC", { signal: controller.signal, config: apiConfig });
  controller.abort();
  await assert.rejects(pending, isCode("ABORTED"));
  await assert.rejects(lookupAsset("BTC", { signal: controller.signal, config: apiConfig }), isCode("ABORTED"));
  assert.equal(mock.mock.callCount(), 1);
});

test("invalid API configuration is reported before making a network request", async (t) => {
  const mock = t.mock.method(globalThis, "fetch", async () => { throw new Error("must not run"); });
  for (const overrides of [
    { mode: "live" }, { apiBaseUrl: "" }, { apiBaseUrl: "//example.com/api" },
    { apiBaseUrl: "ftp://example.com/api" }, { apiBaseUrl: "https://user:password@example.com/api" },
    { apiBaseUrl: "https://example.com/api?secret=bad" }, { apiBaseUrl: "https://example.com/api#bad" },
    { lookupPath: "cryptocurrencies" }, { requestTimeoutMs: 0 }, { requestTimeoutMs: "1000" },
  ]) {
    await assert.rejects(lookupAsset("BTC", { config: { ...apiConfig, ...overrides } }), isCode("CONFIGURATION_ERROR"));
  }
  assert.equal(mock.mock.callCount(), 0);
});
