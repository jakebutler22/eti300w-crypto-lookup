const MISSING = "—";
const DEFAULT_STALE_AFTER_MS = 300000;
const CLOCK_TOLERANCE_MS = 60000;
const usd = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2,
});
const fractionalUsd = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", minimumSignificantDigits: 2, maximumSignificantDigits: 6,
});
const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact", maximumSignificantDigits: 4,
});
const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency", currency: "USD", notation: "compact", maximumSignificantDigits: 4,
});
const exactNumber = new Intl.NumberFormat("en-US", { maximumSignificantDigits: 21 });

function isAmount(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/** Missing values never become zero; small positive prices retain visible precision. */
export function formatUsdPrice(value) {
  if (!isAmount(value)) return MISSING;
  return value > 0 && value < 1 ? fractionalUsd.format(value) : usd.format(value);
}

function volumeUnit(value) {
  if (typeof value !== "string") return null;
  const unit = value.trim().replace(/\s+/g, " ");
  if (!unit || unit.length > 80 || /[<>\u0000-\u001f\u007f]/u.test(unit)) return null;
  return unit.toUpperCase() === "USD" ? "USD" : unit;
}

/** Return plain text for textContent; an unspecified volume unit never implies USD. */
export function formatVolume(market) {
  const hasReportedVolume = market != null && Object.hasOwn(market, "volume24h");
  const hasLegacyUsdVolume = market != null && Object.hasOwn(market, "volume24hUsd");
  const quantity = hasReportedVolume ? market.volume24h : market?.volume24hUsd;
  const unit = hasReportedVolume ? volumeUnit(market.volumeUnit) : hasLegacyUsdVolume ? "USD" : null;
  const unitLabel = unit || "Unit not provided";
  if (!isAmount(quantity)) {
    return { display: MISSING, exact: "Volume unavailable", unitLabel, available: false };
  }
  return {
    display: unit === "USD" ? compactUsd.format(quantity) : compactNumber.format(quantity),
    exact: unit ? `${exactNumber.format(quantity)} ${unit}` : `${exactNumber.format(quantity)} · unit not provided`,
    unitLabel,
    available: true,
  };
}

// Require a real calendar date with an explicit timezone. Date.parse alone would
// accept local-time strings and normalize dates such as February 30.
function validTimestamp(value) {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return null;
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, zone] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const validZone = zone === "Z" || (Number(zone.slice(1, 3)) <= 23 && Number(zone.slice(4, 6)) <= 59);
  return month >= 1 && month <= 12 && Number(dayText) >= 1 && Number(dayText) <= days[month - 1] &&
    Number(hourText) <= 23 && Number(minuteText) <= 59 && Number(secondText) <= 59 && validZone ? value : null;
}

function ageDescription(ageMs) {
  const minutes = Math.floor(ageMs / 60000);
  if (minutes < 1) return "Less than a minute";
  if (minutes < 60) return `${minutes.toLocaleString("en-US")} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours.toLocaleString("en-US")} hr`;
  const days = Math.floor(hours / 24);
  return `${days.toLocaleString("en-US")} ${days === 1 ? "day" : "days"}`;
}

/** Keep provider observation age separate from the browser's receipt time. */
export function classifyFreshness(data, { now = Date.now(), staleAfterMs = DEFAULT_STALE_AFTER_MS } = {}) {
  const asOf = validTimestamp(data?.market?.asOf);
  const receivedAt = validTimestamp(data?.retrievedAt);
  if (data?.simulated === true) {
    return {
      kind: "sample", badge: "Sample data", label: "Demo snapshot",
      description: "Fixed sample values. No live market connection.", timestamp: asOf,
    };
  }
  if (!isAmount(data?.market?.priceUsd)) {
    return {
      kind: "unavailable", badge: "Market unavailable", label: "Response received",
      description: "Market price is unavailable. Receipt time does not establish market freshness.", timestamp: receivedAt,
    };
  }
  if (!asOf) {
    return {
      kind: "unknown", badge: "Freshness unknown", label: "Response received",
      description: "The API did not provide a valid market timestamp. Receipt time does not establish quote freshness.", timestamp: receivedAt,
    };
  }
  const ageMs = now - Date.parse(asOf);
  if (!Number.isFinite(now) || ageMs < -CLOCK_TOLERANCE_MS) {
    return {
      kind: "unknown", badge: "Freshness unknown", label: "Market data as of",
      description: Number.isFinite(now)
        ? "The provider timestamp is ahead of this device clock. Freshness cannot be confirmed."
        : "This device clock cannot be used to confirm market freshness.",
      timestamp: asOf,
    };
  }
  const threshold = Number.isFinite(staleAfterMs) && staleAfterMs >= 0 ? staleAfterMs : DEFAULT_STALE_AFTER_MS;
  const stale = ageMs > threshold;
  return {
    kind: stale ? "stale" : "current",
    badge: stale ? "Stale snapshot" : "API snapshot",
    label: "Market data as of",
    description: `${ageDescription(Math.max(0, ageMs))} old. Use Refresh to request another snapshot.`,
    timestamp: asOf,
  };
}

function validReceiptTime(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 8640000000000000;
}

function priceObservations(history) {
  if (!Array.isArray(history)) return [];
  const seenTimes = new Set();
  return history
    .filter((point) => {
      if (!isAmount(point?.price) || !validReceiptTime(point?.receivedAt) || seenTimes.has(point.receivedAt)) return false;
      seenTimes.add(point.receivedAt);
      return true;
    })
    .map(({ price, receivedAt }) => ({ price, receivedAt }))
    .sort((left, right) => left.receivedAt - right.receivedAt);
}

/**
 * Keep actual successfully received prices in receipt order. The caller supplies
 * epoch milliseconds (Date.parse for ISO receipt strings); no point is invented.
 * A duplicate or older new observation cannot replace a later receipt. A zero
 * limit clears history; invalid limits use the default of 120 points.
 */
export function appendPriceObservation(history, price, receivedAt, { limit = 120 } = {}) {
  const points = priceObservations(history);
  const maximum = Number.isSafeInteger(limit) && limit >= 0 ? limit : 120;
  if (maximum === 0) return [];
  if (isAmount(price) && validReceiptTime(receivedAt) && (!points.length || receivedAt > points.at(-1).receivedAt)) {
    points.push({ price, receivedAt });
  }
  return points.slice(-maximum);
}

/**
 * SVG geometry for received session observations, not provider trading history.
 * start/end are epoch milliseconds; high/low are raw prices. One observation
 * produces only lastPoint for a circle, with no fabricated line or filled area.
 */
export function priceChartGeometry(history, { width = 600, height = 180, padding = 12 } = {}) {
  const points = priceObservations(history);
  const count = points.length;
  if (!count) {
    return { linePath: "", areaPath: "", lastPoint: null, high: null, low: null, start: null, end: null, count: 0 };
  }
  const chartWidth = typeof width === "number" && Number.isFinite(width) && width > 0 ? width : 600;
  const chartHeight = typeof height === "number" && Number.isFinite(height) && height > 0 ? height : 180;
  const chartPadding = typeof padding === "number" && Number.isFinite(padding) && padding >= 0 ? padding : 12;
  const inset = Math.min(chartPadding, chartWidth / 2, chartHeight / 2);
  const plotWidth = chartWidth - inset * 2;
  const plotHeight = chartHeight - inset * 2;
  let high = points[0].price;
  let low = high;
  for (const point of points) {
    high = Math.max(high, point.price);
    low = Math.min(low, point.price);
  }
  const start = points[0].receivedAt;
  const end = points.at(-1).receivedAt;
  const rounded = (value) => Number(value.toFixed(3));
  if (count === 1) {
    return {
      linePath: "", areaPath: "", lastPoint: { x: rounded(chartWidth / 2), y: rounded(chartHeight / 2) },
      high, low, start, end, count,
    };
  }
  // Normalize before adding axis space so even very large or tiny finite prices
  // remain drawable. A flat sequence stays centered rather than dividing by zero.
  const scale = high > 0 ? high : 1;
  const normalizedHigh = high / scale;
  const normalizedLow = low / scale;
  const range = normalizedHigh - normalizedLow;
  const margin = range > 0 ? range * 0.12 : Math.max(normalizedHigh * 0.02, 0.01);
  const axisHigh = normalizedHigh + margin;
  const axisLow = normalizedLow - margin;
  const coordinates = points.map((point) => ({
    x: rounded(inset + ((point.receivedAt - start) / (end - start)) * plotWidth),
    y: rounded(inset + ((axisHigh - point.price / scale) / (axisHigh - axisLow)) * plotHeight),
  }));
  const linePath = coordinates.map(({ x, y }, index) => `${index ? "L" : "M"} ${x} ${y}`).join(" ");
  const first = coordinates[0];
  const lastPoint = coordinates.at(-1);
  const baseline = rounded(chartHeight - inset);
  return {
    linePath,
    areaPath: `${linePath} L ${lastPoint.x} ${baseline} L ${first.x} ${baseline} Z`,
    lastPoint, high, low, start, end, count,
  };
}
