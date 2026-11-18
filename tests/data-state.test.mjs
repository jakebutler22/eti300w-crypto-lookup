import test from "node:test";
import assert from "node:assert/strict";
import { appendPriceObservation, classifyFreshness, formatUsdPrice, formatVolume, priceChartGeometry } from "../data-state.js";

const now = Date.parse("2026-11-18T15:00:00Z");
const observation = (asOf, extra = {}) => ({
  simulated: false,
  market: { priceUsd: 10, asOf },
  retrievedAt: "2026-11-18T15:00:00Z",
  ...extra,
});

test("USD price distinguishes unavailable amounts from a real zero", () => {
  for (const value of [null, undefined, NaN, Infinity, -Infinity, -1, "0", false]) {
    assert.equal(formatUsdPrice(value), "—");
  }
  assert.equal(formatUsdPrice(0), "$0.00");
  assert.equal(formatUsdPrice(72500.25), "$72,500.25");
});

test("tiny positive USD prices retain significant decimals instead of appearing to be zero", () => {
  assert.equal(formatUsdPrice(0.0000001234567), "$0.000000123457");
  assert.equal(formatUsdPrice(0.00001), "$0.000010");
  assert.equal(formatUsdPrice(0.3874), "$0.3874");
  assert.notEqual(formatUsdPrice(Number.MIN_VALUE), "$0.00");
  assert.equal(Number(formatUsdPrice(Number.MIN_VALUE).slice(1)), Number.MIN_VALUE);
});

test("legacy USD volume retains its known currency and a full quantity", () => {
  const result = formatVolume({ volume24hUsd: 1234567.89 });
  assert.equal(result.display, "$1.235M");
  assert.equal(result.exact, "1,234,567.89 USD");
  assert.equal(result.unitLabel, "USD");
  assert.equal(result.available, true);
});

test("reported volume and explicit units take precedence over a legacy USD value", () => {
  const result = formatVolume({ volume24h: 1234.56789, volumeUnit: " BTC ", volume24hUsd: 99999 });
  assert.equal(result.display, "1.235K");
  assert.equal(result.exact, "1,234.56789 BTC");
  assert.equal(result.unitLabel, "BTC");
  assert.equal(result.available, true);
  assert.equal(formatVolume({ volume24h: 1234, volumeUnit: " usd " }).display, "$1.234K");
});

test("unknown volume units never produce a currency symbol or an invented asset unit", () => {
  for (const volumeUnit of [null, undefined, "", "  ", 10, "<script>USD</script>"]) {
    const result = formatVolume({ volume24h: 1234.5, volumeUnit, volume24hUsd: 99999 });
    assert.equal(result.display, "1.235K");
    assert.equal(result.exact, "1,234.5 · unit not provided");
    assert.equal(result.unitLabel, "Unit not provided");
    assert.equal(result.available, true);
    assert.doesNotMatch(result.display, /\$/);
    assert.doesNotMatch(result.exact, /USD|BTC/);
  }
});

test("unavailable volume stays missing even if a legacy value is also present", () => {
  for (const quantity of [null, undefined, NaN, Infinity, -1, "0"]) {
    const result = formatVolume({ volume24h: quantity, volumeUnit: "BTC", volume24hUsd: 100 });
    assert.equal(result.display, "—");
    assert.equal(result.exact, "Volume unavailable");
    assert.equal(result.available, false);
    assert.equal(result.unitLabel, "BTC");
  }
  assert.equal(formatVolume(null).available, false);
  assert.equal(formatVolume(null).unitLabel, "Unit not provided");
  assert.equal(formatVolume({ volume24hUsd: null }).available, false);
});

test("zero and tiny volumes remain available without rounding the exact quantity to zero", () => {
  assert.deepEqual(formatVolume({ volume24h: 0, volumeUnit: "BTC" }), {
    display: "0", exact: "0 BTC", unitLabel: "BTC", available: true,
  });
  assert.equal(formatVolume({ volume24hUsd: 0 }).available, true);
  assert.equal(formatVolume({ volume24h: 0.0000000000000000000123, volumeUnit: "BTC" }).exact,
    "0.0000000000000000000123 BTC");
});

test("sample freshness remains fixed sample data regardless of observation age or receipt time", () => {
  const result = classifyFreshness(observation("2026-11-08T14:00:00Z", { simulated: true }), { now });
  assert.equal(result.kind, "sample");
  assert.equal(result.badge, "Sample data");
  assert.equal(result.label, "Demo snapshot");
  assert.equal(result.timestamp, "2026-11-08T14:00:00Z");
  assert.match(result.description, /fixed sample/i);
});

test("missing price is unavailable while a zero price can have a current observation", () => {
  for (const priceUsd of [null, undefined, NaN, Infinity, -1]) {
    const result = classifyFreshness(observation("2026-11-18T14:59:00Z", { market: { priceUsd, asOf: "2026-11-18T14:59:00Z" } }), { now });
    assert.equal(result.kind, "unavailable");
    assert.equal(result.timestamp, "2026-11-18T15:00:00Z");
    assert.equal(result.label, "Response received");
  }
  assert.equal(classifyFreshness(observation("2026-11-18T14:59:00Z", { market: { priceUsd: 0, asOf: "2026-11-18T14:59:00Z" } }), { now }).kind, "current");
});

test("fresh receipt time cannot establish market freshness when the provider timestamp is absent", () => {
  const result = classifyFreshness(observation(null), { now });
  assert.equal(result.kind, "unknown");
  assert.equal(result.badge, "Freshness unknown");
  assert.equal(result.label, "Response received");
  assert.equal(result.timestamp, "2026-11-18T15:00:00Z");
  assert.match(result.description, /receipt time does not establish quote freshness/i);
  assert.equal(classifyFreshness({ market: { priceUsd: 10 } }, { now }).timestamp, null);
});

test("provider observation time determines staleness independently of receipt time", () => {
  const result = classifyFreshness(observation("2026-11-18T14:50:00Z"), { now });
  assert.equal(result.kind, "stale");
  assert.equal(result.badge, "Stale snapshot");
  assert.equal(result.label, "Market data as of");
  assert.equal(result.timestamp, "2026-11-18T14:50:00Z");
  assert.match(result.description, /10 min old/);
  assert.equal(classifyFreshness(observation("2026-11-18T14:55:00Z"), { now }).kind, "current");
  assert.equal(classifyFreshness(observation("2026-11-18T14:55:00Z"), { now, staleAfterMs: 60000 }).kind, "stale");
});

test("current snapshots use the provider timestamp and describe age without calling the result live", () => {
  const result = classifyFreshness(observation("2026-11-18T14:59:45Z"), { now });
  assert.equal(result.kind, "current");
  assert.equal(result.badge, "API snapshot");
  assert.equal(result.timestamp, "2026-11-18T14:59:45Z");
  assert.match(result.description, /less than a minute old/i);
  assert.doesNotMatch(result.description, /live/i);
});

test("a provider timestamp too far ahead of the device clock has unknown freshness", () => {
  const result = classifyFreshness(observation("2026-11-18T15:02:00Z"), { now });
  assert.equal(result.kind, "unknown");
  assert.equal(result.label, "Market data as of");
  assert.equal(result.timestamp, "2026-11-18T15:02:00Z");
  assert.match(result.description, /ahead of this device clock/);
  assert.equal(classifyFreshness(observation("2026-11-18T15:00:30Z"), { now }).kind, "current");
});

test("invalid and timezone-free timestamps cannot imply market freshness", () => {
  for (const asOf of ["not a date", "2026-11-18", "2026-11-18T14:59:00", "2026-02-30T14:59:00Z", "2026-11-18T25:00:00Z"]) {
    const result = classifyFreshness(observation(asOf), { now });
    assert.equal(result.kind, "unknown");
    assert.equal(result.label, "Response received");
  }
  assert.equal(classifyFreshness(observation(null, { retrievedAt: "invalid" }), { now }).timestamp, null);
  assert.equal(classifyFreshness(observation("2026-11-18T09:59:00-05:00"), { now }).kind, "current");
});

test("session prices append real zero and positive observations without mutating existing history", () => {
  const history = [{ price: 10, receivedAt: now }];
  const updated = appendPriceObservation(history, 0, now + 60000);
  assert.deepEqual(updated, [{ price: 10, receivedAt: now }, { price: 0, receivedAt: now + 60000 }]);
  assert.deepEqual(history, [{ price: 10, receivedAt: now }]);
  assert.notEqual(updated, history);
  assert.notEqual(updated[0], history[0]);
});

test("session history never fabricates a price or receipt timestamp from missing or malformed values", () => {
  const history = [{ price: 10, receivedAt: now }];
  for (const price of [null, undefined, NaN, Infinity, -1, "10", true]) {
    assert.deepEqual(appendPriceObservation(history, price, now + 1000), history);
  }
  for (const receivedAt of [null, undefined, NaN, Infinity, -1, "2026-11-18T15:01:00Z", 8640000000000001]) {
    assert.deepEqual(appendPriceObservation(history, 11, receivedAt), history);
  }
  assert.deepEqual(appendPriceObservation(null, null, null), []);
});

test("duplicate and older receipts do not replace or extend the session's observed history", () => {
  const history = [{ price: 10, receivedAt: now }, { price: 12, receivedAt: now + 60000 }];
  assert.deepEqual(appendPriceObservation(history, 999, now), history);
  assert.deepEqual(appendPriceObservation(history, 999, now + 60000), history);
  assert.deepEqual(appendPriceObservation(history, 999, now - 60000), history);
});

test("bounded session history drops the oldest observation and applies a zero limit explicitly", () => {
  let history = [];
  for (let index = 0; index < 125; index++) history = appendPriceObservation(history, index, now + index * 1000);
  assert.equal(history.length, 120);
  assert.deepEqual(history[0], { price: 5, receivedAt: now + 5000 });
  const bounded = appendPriceObservation(history, 125, now + 125000, { limit: 2 });
  assert.deepEqual(bounded, [
    { price: 124, receivedAt: now + 124000 }, { price: 125, receivedAt: now + 125000 },
  ]);
  assert.deepEqual(appendPriceObservation(history, 126, now + 126000, { limit: 0 }), []);
  assert.equal(appendPriceObservation(history, 126, now + 126000, { limit: -1 }).length, 120);
});

test("malformed history is filtered and sorted while preserving the first actual observation at a timestamp", () => {
  const history = [
    { price: 12, receivedAt: now + 1000 }, null, { price: 999, receivedAt: now + 1000 },
    { price: 0, receivedAt: now }, { price: null, receivedAt: now + 2000 },
  ];
  assert.deepEqual(appendPriceObservation(history, 14, now + 3000), [
    { price: 0, receivedAt: now }, { price: 12, receivedAt: now + 1000 }, { price: 14, receivedAt: now + 3000 },
  ]);
});

test("empty chart history contains no paths, point, extrema, or invented time range", () => {
  const empty = { linePath: "", areaPath: "", lastPoint: null, high: null, low: null, start: null, end: null, count: 0 };
  for (const history of [null, undefined, [], [{ price: null, receivedAt: now }]]) {
    assert.deepEqual(priceChartGeometry(history), empty);
  }
});

test("one real chart observation yields only a centered circle and its actual value/time", () => {
  assert.deepEqual(priceChartGeometry([{ price: 0, receivedAt: now }]), {
    linePath: "", areaPath: "", lastPoint: { x: 300, y: 90 },
    high: 0, low: 0, start: now, end: now, count: 1,
  });
});

function lineCoordinates(geometry) {
  return [...geometry.linePath.matchAll(/[ML] ([\d.-]+) ([\d.-]+)/g)].map((match) => ({ x: Number(match[1]), y: Number(match[2]) }));
}

test("chart x coordinates reflect actual unequal receipt intervals rather than evenly spaced samples", () => {
  const geometry = priceChartGeometry([
    { price: 10, receivedAt: now }, { price: 12, receivedAt: now + 1000 }, { price: 11, receivedAt: now + 10000 },
  ]);
  const coordinates = lineCoordinates(geometry);
  assert.equal(coordinates.length, 3);
  assert.equal(coordinates[0].x, 12);
  assert.equal(coordinates[1].x, 69.6);
  assert.equal(coordinates[2].x, 588);
  assert.equal(geometry.high, 12);
  assert.equal(geometry.low, 10);
  assert.equal(geometry.start, now);
  assert.equal(geometry.end, now + 10000);
  assert.deepEqual(geometry.lastPoint, coordinates[2]);
  assert.match(geometry.areaPath, /L 588 168 L 12 168 Z$/);
});

test("flat and zero-price session charts stay centered with finite geometry", () => {
  for (const price of [0, 10, Number.MIN_VALUE, Number.MAX_VALUE]) {
    const geometry = priceChartGeometry([{ price, receivedAt: now }, { price, receivedAt: now + 1000 }]);
    assert.equal(geometry.high, price);
    assert.equal(geometry.low, price);
    assert.equal(geometry.count, 2);
    assert.deepEqual(lineCoordinates(geometry), [{ x: 12, y: 90 }, { x: 588, y: 90 }]);
    assert.doesNotMatch(geometry.linePath + geometry.areaPath, /NaN|Infinity/);
  }
});

test("chart filters missing points without converting them to zero or mutating source observations", () => {
  const history = [
    { price: 12, receivedAt: now + 1000 }, { price: null, receivedAt: now + 500 },
    { price: 10, receivedAt: now }, { price: 999, receivedAt: now + 1000 },
  ];
  const before = structuredClone(history);
  const geometry = priceChartGeometry(history);
  assert.equal(geometry.count, 2);
  assert.equal(geometry.high, 12);
  assert.equal(geometry.low, 10);
  assert.equal(geometry.start, now);
  assert.equal(geometry.end, now + 1000);
  assert.deepEqual(history, before);
});

test("chart geometry remains within the supplied viewport for tiny and extreme finite prices", () => {
  for (const prices of [[0, Number.MIN_VALUE], [0, Number.MAX_VALUE], [0.00000001, 0.00000002], [1, 2]]) {
    const geometry = priceChartGeometry(prices.map((price, index) => ({ price, receivedAt: now + index * 1000 })), { width: 320, height: 120, padding: 10 });
    assert.equal(geometry.count, 2);
    for (const { x, y } of lineCoordinates(geometry)) {
      assert.ok(Number.isFinite(x) && x >= 10 && x <= 310);
      assert.ok(Number.isFinite(y) && y >= 10 && y <= 110);
    }
  }
  const fallback = priceChartGeometry([{ price: 10, receivedAt: now }], { width: 0, height: NaN, padding: -1 });
  assert.deepEqual(fallback.lastPoint, { x: 300, y: 90 });
});
