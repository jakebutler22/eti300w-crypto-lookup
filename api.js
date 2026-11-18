import { APP_CONFIG } from "./config.js?v=20261118-context";
import { DEMO_ASSETS } from "./data/demo-assets.js?v=20261118-context";

export class ApiError extends Error {
  constructor(code, message, { status, cause, retryAfterMs, responseBody } = {}) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = code === "ABORTED" ? "AbortError" : "ApiError";
    this.code = code;
    if (status !== undefined) this.status = status;
    if (retryAfterMs !== undefined) this.retryAfterMs = retryAfterMs;
    if (responseBody !== undefined) this.responseBody = responseBody;
  }
}

/** Demo-only catalog; API directories are loaded with loadAssetDirectory(). */
export function getAssetDirectory() {
  return DEMO_ASSETS.map(({ symbol, name, category }) => ({ symbol, name, category }));
}

function abortedError() {
  return new ApiError("ABORTED", "The search was cancelled.");
}

function timeoutError() {
  return new ApiError("TIMEOUT", "The data service took too long to respond. Please try again.");
}

function retryDelay(response, { useFallback = true } = {}) {
  const fallback = useFallback ? 30000 : undefined;
  const maximum = 300000;
  const value = response.headers?.get?.("Retry-After")?.trim();
  if (!value) return fallback;
  let milliseconds;
  if (/^\d+$/.test(value)) {
    milliseconds = Number(value) * 1000;
  } else if (/^[A-Za-z]{3}, \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(value)) {
    milliseconds = Date.parse(value) - Date.now();
  }
  return Number.isFinite(milliseconds) ? Math.min(maximum, Math.max(0, milliseconds)) : fallback;
}

function normalizeQuery(query) {
  if (typeof query !== "string") {
    throw new ApiError("INVALID_QUERY", "Enter a cryptocurrency name or ticker symbol.");
  }
  const normalized = query.trim().replace(/\s+/g, " ");
  if (!normalized) {
    throw new ApiError("EMPTY_QUERY", "Enter a cryptocurrency name or ticker symbol.");
  }
  if (normalized.length > 120) {
    throw new ApiError("INVALID_QUERY", "Keep your search to 120 characters or fewer.");
  }
  return normalized;
}

function copyAsset(asset) {
  return { ...asset, market: { ...asset.market }, sources: { ...asset.sources } };
}

function demoDelay(signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortedError());
    const onAbort = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      reject(abortedError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, 280);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function endpointForPath(path, config) {
  const base = config.apiBaseUrl;
  if (
    typeof base !== "string" ||
    !base.trim() ||
    typeof path !== "string" ||
    !/^\/[\w/-]*$/.test(path) ||
    !Number.isFinite(config.requestTimeoutMs) ||
    config.requestTimeoutMs <= 0
  ) {
    throw new ApiError("CONFIGURATION_ERROR", "The middleware connection is not configured correctly.");
  }

  // Relative paths keep requests on the presentation server's reverse proxy.
  // Absolute HTTP(S) origins are supported when a public API is intentional.
  const isAbsolute = /^https?:\/\//i.test(base);
  if (!isAbsolute && !/^\/(?!\/)[\w/.-]*$/.test(base)) {
    throw new ApiError("CONFIGURATION_ERROR", "Use an HTTP(S) API URL or a same-origin path such as /api.");
  }
  let endpoint;
  try {
    endpoint = new URL(`${base.replace(/\/+$/, "")}${path}`, "https://same-origin.invalid");
    if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash) throw new Error("Invalid API base URL");
  } catch (cause) {
    throw new ApiError("CONFIGURATION_ERROR", "The middleware connection is not configured correctly.", { cause });
  }
  return isAbsolute ? endpoint.href : endpoint.pathname;
}

function endpointFor(query, config) {
  const endpoint = endpointForPath(config.lookupPath, config);
  const url = new URL(endpoint, "https://same-origin.invalid");
  url.searchParams.set("query", query);
  return /^https?:\/\//i.test(endpoint) ? url.href : `${url.pathname}${url.search}`;
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonemptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isIsoTimestamp(value) {
  if (typeof value !== "string") return false;
  // Require explicit timezone and a valid calendar date, not a browser's
  // locale-dependent interpretation of an arbitrary date string.
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  const [, year, month, day, hour, minute, second, zone] = match;
  const daysInMonth = new Date(Date.UTC(Number(year), Number(month), 0)).getUTCDate();
  const zoneHours = zone === "Z" ? 0 : Number(zone.slice(1, 3));
  const zoneMinutes = zone === "Z" ? 0 : Number(zone.slice(4, 6));
  return Number(month) >= 1 && Number(month) <= 12 &&
    Number(day) >= 1 && Number(day) <= daysInMonth &&
    Number(hour) <= 23 && Number(minute) <= 59 && Number(second) <= 59 &&
    zoneHours <= 23 && zoneMinutes <= 59;
}

function validatePayload(raw) {
  const data = isRecord(raw) ? raw.data : null;
  if (
    !isRecord(data) ||
    !["symbol", "name", "category", "description"].every((key) => nonemptyString(data[key])) ||
    !isRecord(data.market) ||
    !["priceUsd", "volume24hUsd"].every((key) =>
      typeof data.market[key] === "number" && Number.isFinite(data.market[key]) && data.market[key] >= 0,
    ) ||
    !isIsoTimestamp(data.market.asOf) ||
    !isRecord(data.sources) ||
    !nonemptyString(data.sources.profile) ||
    !nonemptyString(data.sources.market) ||
    typeof data.simulated !== "boolean"
  ) {
    throw new ApiError("INVALID_RESPONSE", "The middleware returned incomplete or invalid cryptocurrency data.");
  }
  return {
    symbol: data.symbol.trim().toUpperCase(),
    name: data.name.trim(),
    category: data.category.trim(),
    description: data.description.trim(),
    market: {
      priceUsd: data.market.priceUsd,
      volume24hUsd: data.market.volume24hUsd,
      asOf: data.market.asOf,
    },
    sources: { profile: data.sources.profile.trim(), market: data.sources.market.trim() },
    simulated: data.simulated,
  };
}

/** One timeout covers every request in an operation, including both Nolan routes. */
async function withApiRequest({ signal, config }, operation) {
  const controller = new AbortController();
  let timedOut = false;
  const onAbort = () => controller.abort();
  if (signal?.aborted) throw abortedError();
  signal?.addEventListener("abort", onAbort, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, config.requestTimeoutMs);

  const ensureActive = () => {
    if (signal?.aborted) throw abortedError();
    if (timedOut) throw timeoutError();
    if (controller.signal.aborted) throw abortedError();
  };

  const requestError = (cause) => {
    if (signal?.aborted) return abortedError();
    if (timedOut) return timeoutError();
    if (cause instanceof ApiError) return cause;
    return new ApiError("NETWORK_ERROR", "The data service could not be reached. Check your connection and try again.", { cause });
  };

  const requestJson = async (endpointUrl, { stage = "combined", query, symbol } = {}) => {
    let parsedBody;
    try {
      ensureActive();
      const response = await fetch(endpointUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
        credentials: "same-origin",
        cache: "no-store",
      });
      ensureActive();
      if (!response.ok) {
        if (stage === "market") {
          parsedBody = null;
          try {
            parsedBody = await response.json();
          } catch {
            // An HTML proxy error is not JSON evidence or safe application copy.
          }
          ensureActive();
        }
        const errorOptions = { status: response.status, responseBody: parsedBody };
        // A 503 may carry explicit provider maintenance/rate-limit guidance.
        // Unlike 429, an ordinary 503 does not imply a retry-delay fallback.
        if (response.status === 503) {
          const retryAfterMs = retryDelay(response, { useFallback: false });
          if (Number.isFinite(retryAfterMs)) errorOptions.retryAfterMs = retryAfterMs;
        }
        if (stage === "catalog" && response.status === 503) {
          throw new ApiError("DATABASE_UNAVAILABLE", "Database profiles are unavailable. The backend must connect to MySQL before searches can run.", errorOptions);
        }
        if (stage === "market" && response.status === 404) {
          // Translate recognized messages without exposing arbitrary debug output.
          let message = `The market service has no supported USD trading pair for ${symbol}.`;
          if (parsedBody?.error === "Trading pair unavailable on Coinbase") {
            message = `The ${symbol}-USD trading pair is unavailable on Coinbase.`;
          } else if (parsedBody?.error === "Cryptocurrency not found") {
            message = `${symbol} is in the database, but the market service does not support it.`;
          }
          throw new ApiError("PRODUCT_UNAVAILABLE", message, errorOptions);
        }
        if (response.status === 404) {
          if (stage === "catalog") {
            throw new ApiError("HTTP_ERROR", "The database profile endpoint is unavailable. Check the middleware route.", { status: 404 });
          }
          throw new ApiError("NOT_FOUND", `No cryptocurrency was found for “${query}”. Try another name or ticker.`, { status: 404 });
        }
        if (response.status === 429) {
          throw new ApiError("HTTP_ERROR", "The data service is busy. Please wait a moment and try again.", { ...errorOptions, retryAfterMs: retryDelay(response) });
        }
        const message = stage === "catalog"
          ? "Database profiles could not be retrieved. Please try again."
          : "The data service could not complete the request. Please try again.";
        throw new ApiError("HTTP_ERROR", message, errorOptions);
      }
      try {
        parsedBody = await response.json();
      } catch (cause) {
        if (controller.signal.aborted) throw cause;
        throw new ApiError("INVALID_JSON", "The middleware returned a response that is not valid JSON.", { cause });
      }
      ensureActive();
      return parsedBody;
    } catch (cause) {
      const error = requestError(cause);
      if (stage === "market" && parsedBody !== undefined && error.responseBody === undefined) {
        error.responseBody = parsedBody;
      }
      throw error;
    }
  };

  try {
    const result = await operation(requestJson, ensureActive);
    // An expired market request may finish with a validated database profile.
    // An explicit visitor cancellation always wins, including at this boundary.
    if (signal?.aborted) throw abortedError();
    const recoveredMarketTimeout = config.allowPartialMarket === true && timedOut &&
      result?.marketStatus === "unavailable" && result?.marketError?.code === "TIMEOUT";
    if (!recoveredMarketTimeout) ensureActive();
    return result;
  } catch (cause) {
    throw requestError(cause);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

async function lookupFromCombinedApi(query, { signal, config }) {
  const endpointUrl = endpointFor(query, config);
  return withApiRequest({ signal, config }, async (requestJson) => {
    const raw = await requestJson(endpointUrl, { query });
    const data = validatePayload(raw);
    return { data, raw, endpointUrl, mode: "api", contract: "combined-v1" };
  });
}

function apiContract(config) {
  // Older integrations that provide just lookupPath keep the original contract.
  const contract = config.apiContract ?? "combined-v1";
  if (!["nolan-v1", "combined-v1"].includes(contract)) {
    throw new ApiError("CONFIGURATION_ERROR", "Choose nolan-v1 or combined-v1 as the API contract in config.js.");
  }
  return contract;
}

function optionalProfileText(value, field) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw new ApiError("INVALID_RESPONSE", `The database returned an invalid cryptocurrency ${field}.`);
  }
  return value.trim() || null;
}

function validateCatalog(raw) {
  if (!Array.isArray(raw)) {
    throw new ApiError("INVALID_RESPONSE", "The database profile endpoint must return a JSON array.");
  }
  return raw.map((row) => {
    if (!isRecord(row) || !nonemptyString(row.name) || !nonemptyString(row.symbol) ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(row.symbol.trim())) {
      throw new ApiError("INVALID_RESPONSE", "The database returned a profile without a valid name and symbol.");
    }
    return {
      symbol: row.symbol.trim().toUpperCase(),
      name: row.name.trim().replace(/\s+/g, " "),
      category: optionalProfileText(row.category, "category"),
      description: optionalProfileText(row.description, "description"),
    };
  });
}

function nolanEndpoints(config) {
  if (config.allowPartialMarket !== undefined && typeof config.allowPartialMarket !== "boolean") {
    throw new ApiError("CONFIGURATION_ERROR", "Set allowPartialMarket to true or false in config.js.");
  }
  // Validate both paths before issuing either request.
  return {
    profile: endpointForPath(config.catalogPath, config),
    marketBase: endpointForPath(config.marketPath, config).replace(/\/+$/, ""),
  };
}

function nolanMarketMetadata(market, symbol) {
  // Legacy responses omit these fields. When supplied, they must confirm the
  // selected USD product before its price can be presented as USD.
  for (const [field, expected] of [["product_id", `${symbol}-USD`], ["quote_currency", "USD"]]) {
    if (Object.hasOwn(market, field) &&
      (!nonemptyString(market[field]) || market[field].trim().toUpperCase() !== expected)) {
      throw new ApiError("INVALID_RESPONSE", "The market service returned a mismatched USD product or quote currency.");
    }
  }
  // Both deployed aliases describe base-asset quantity. Conflicting, malformed,
  // or other-asset units stay unknown; they never become USD volume.
  const units = [market.volume_unit, market.volume_24h_unit].filter((value) => value !== null && value !== undefined);
  const volumeUnit = units.length && units.every((value) => nonemptyString(value) && value.trim().toUpperCase() === symbol)
    ? symbol : null;
  return {
    volumeUnit,
    asOf: isIsoTimestamp(market.provider_timestamp) ? market.provider_timestamp : null,
  };
}

async function lookupFromNolanApi(query, { signal, config }) {
  const { profile, marketBase } = nolanEndpoints(config);
  return withApiRequest({ signal, config }, async (requestJson, ensureActive) => {
    const profiles = await requestJson(profile, { stage: "catalog" });
    const rows = validateCatalog(profiles);
    const key = query.toLocaleLowerCase("en-US");
    const matches = rows.filter(({ symbol, name }) =>
      symbol.toLocaleLowerCase("en-US") === key || name.toLocaleLowerCase("en-US") === key,
    );
    if (!matches.length) {
      throw new ApiError("NOT_FOUND", `No cryptocurrency was found in the database for “${query}”. Try another name or ticker.`);
    }
    if (matches.length > 1) {
      throw new ApiError("AMBIGUOUS_MATCH", "The database contains multiple matching profiles. Search by a unique ticker or ask the database owner to resolve duplicates.");
    }
    ensureActive();
    const selected = matches[0];
    const marketEndpoint = `${marketBase}/${encodeURIComponent(selected.symbol)}`;
    let market = null;
    let marketError = null;
    let metadata = { volumeUnit: null, asOf: null };
    try {
      market = await requestJson(marketEndpoint, { stage: "market", symbol: selected.symbol });
      if (!isRecord(market) || !nonemptyString(market.symbol) ||
        market.symbol.trim().toUpperCase() !== selected.symbol || !nonemptyString(market.source) ||
        !["price", "volume_24h"].every((field) =>
          typeof market[field] === "number" && Number.isFinite(market[field]) && market[field] >= 0,
        )) {
        throw new ApiError("INVALID_RESPONSE", "The market service returned an invalid symbol, source, price, or 24-hour volume.");
      }
      metadata = nolanMarketMetadata(market, selected.symbol);
    } catch (cause) {
      const recoverable = cause instanceof ApiError && (
        ["NETWORK_ERROR", "TIMEOUT", "INVALID_JSON", "INVALID_RESPONSE", "PRODUCT_UNAVAILABLE"].includes(cause.code) ||
        (cause.code === "HTTP_ERROR" && (cause.status === 429 || cause.status >= 500))
      );
      if (signal?.aborted || config.allowPartialMarket !== true || !recoverable) throw cause;
      if (cause.responseBody !== undefined) market = cause.responseBody;
      marketError = { code: cause.code, message: cause.message };
      if (cause.status !== undefined) marketError.status = cause.status;
      if (cause.retryAfterMs !== undefined) marketError.retryAfterMs = cause.retryAfterMs;
    }
    const warnings = [];
    if (!selected.category) warnings.push("Category is unavailable in the database response.");
    if (!selected.description) warnings.push("Description is unavailable in the database response.");
    if (marketError) {
      warnings.push(`Market data unavailable: ${marketError.message}`);
    } else {
      if (!metadata.asOf) warnings.push("The market response does not include a valid provider quote timestamp.");
      if (!metadata.volumeUnit) warnings.push("The market response does not identify a valid base-asset unit for 24-hour volume.");
    }
    return {
      data: {
        ...selected,
        market: {
          priceUsd: marketError ? null : market.price,
          volume24h: marketError ? null : market.volume_24h,
          volumeUnit: marketError ? null : metadata.volumeUnit,
          asOf: marketError ? null : metadata.asOf,
        },
        sources: { profile: "MySQL via Python API", market: marketError ? null : market.source.trim() },
        simulated: false,
        // Browser receipt time is separate from both provider_timestamp and the
        // middleware's retrieved_at. Neither advances when the UI rerenders.
        retrievedAt: new Date().toISOString(),
      },
      raw: { profiles, market },
      endpointUrl: null,
      endpointUrls: { profile, market: marketEndpoint },
      directory: rows.map(({ symbol, name, category }) => ({ symbol, name, category })),
      mode: "api",
      contract: "nolan-v1",
      marketStatus: marketError ? "unavailable" : "available",
      marketError,
      warnings,
    };
  });
}

/** The API directory comes exclusively from MySQL; fixtures are demo-only. */
export async function loadAssetDirectory({ signal, config = APP_CONFIG } = {}) {
  if (signal?.aborted) throw abortedError();
  if (!config || !["demo", "api"].includes(config.mode)) {
    throw new ApiError("CONFIGURATION_ERROR", "Choose demo or api mode in config.js.");
  }
  if (config.mode === "demo") return getAssetDirectory();
  if (apiContract(config) === "combined-v1") return [];
  const { profile } = nolanEndpoints(config);
  return withApiRequest({ signal, config }, async (requestJson) => {
    const raw = await requestJson(profile, { stage: "catalog" });
    return validateCatalog(raw).map(({ symbol, name, category }) => ({ symbol, name, category }));
  });
}

/**
 * Resolve a name or ticker via local fixtures or the selected middleware contract.
 * Market-only failures may retain a database profile when explicitly configured.
 * Database/query failures propagate; API requests never fall back to fixtures.
 * The optional config override supports isolated tests and integration previews.
 */
export async function lookupAsset(query, { signal, config = APP_CONFIG } = {}) {
  const normalizedQuery = normalizeQuery(query);
  if (signal?.aborted) throw abortedError();
  if (!config || !["demo", "api"].includes(config.mode)) {
    throw new ApiError("CONFIGURATION_ERROR", "Choose demo or api mode in config.js.");
  }
  if (config.mode === "api") {
    const lookup = apiContract(config) === "nolan-v1" ? lookupFromNolanApi : lookupFromCombinedApi;
    return lookup(normalizedQuery, { signal, config: { ...config } });
  }

  await demoDelay(signal);
  const key = normalizedQuery.toLocaleLowerCase("en-US");
  const asset = DEMO_ASSETS.find(({ symbol, name }) =>
    symbol.toLocaleLowerCase("en-US") === key || name.toLocaleLowerCase("en-US") === key,
  );
  if (!asset) {
    throw new ApiError("NOT_FOUND", `No cryptocurrency was found for “${normalizedQuery}”. Try another name or ticker.`);
  }
  return { data: copyAsset(asset), raw: { data: copyAsset(asset) }, endpointUrl: null, mode: "demo" };
}
