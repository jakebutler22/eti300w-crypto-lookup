# API contract

## Production default and copy cleanup

The public origin was observed serving Crypto Context and API mode at 5:22 p.m. Eastern on November 18. The repository now defaults to API mode too. `npm run serve` uses `scripts/serve_frontend.py` for a localhost-only, read-only proxy to the public catalog/market routes; the default cannot silently show fixtures on failure. Explicit offline previews remain available with `npm run serve:demo`. Production HTML/FAQs no longer contain sample-data boilerplate. Original JSON payloads remain unchanged. This newer release still requires hosted verification after the team deploys it; no AWS write was performed here.

## Latest public verification · 22:12 UTC, November 18

The backend now returns all 27 requested catalog records with category/description. All 27 selected market routes returned HTTP 200 in the [read-only check](evidence/api-2026-11-18-catalog-verification.json). BTC, SHIB and POL were also inspected with explicit `product_id`, `quote_currency`, `provider_timestamp`, `volume_unit` and `volume_24h_unit`. The adapter now maps valid optional metadata while retaining compatibility with earlier responses that lack it. Stored database prices remain excluded from market values. Browser receipt time and provider observation time remain distinct.

The earlier eight-record/no-metadata observations below are dated baseline evidence. They no longer describe the latest public success payloads. The exact deployed version/full hashes, candidate alias compatibility, backend tests and remote screenshots still need teammate confirmation. This assistant made no AWS writes. The newer combined route `/api/assets/BTC` returned HTTP 200 with `{profile, market, market_available, market_status, market_error}` at 22:10 UTC, but the frontend continues using the two established routes; its browser-assembled JSON is identified accordingly.

## Earlier baseline and implementation history

Status date: November 18, 2026. This distinguishes source-confirmed behavior from public routes and frontend behavior actually checked. [AWS inspection](aws-inspection.md) records the sanitized console and public HTTP evidence; [testing](testing.md) records the Safari checks.

Source: `crypto-backend.zip`, SHA-256 `728a76a4d448671c9fe322de498dd243a35fd18fc74f3486164e375bb5ff0f5a`. Its three original files remain unchanged. The two public success responses below match that archive's field shapes; this does not establish that every deployed route or error case matches it.

## Observed public responses and frontend checks

Read-only HTTP checks at `2026-11-18T19:44:50Z` confirmed:

| Public request | Observed response |
| --- | --- |
| [`GET /api/db/cryptos`](http://3.145.42.74/api/db/cryptos) | HTTP `200`; eight records containing `name`, `symbol`, and stored `price`: BTC, ETH, XRP, LTC, ADA, DOGE, SOL, XMR; no category/description |
| [`GET /api/live/BTC`](http://3.145.42.74/api/live/BTC) | HTTP `200`; `name: "Bitcoin"`, `symbol: "BTC"`, `source: "Coinbase Exchange"`, numeric price/volume; no provider observation time or volume unit |

The captured BTC response was:

```json
{
  "name": "Bitcoin",
  "price": 62635.68,
  "source": "Coinbase Exchange",
  "symbol": "BTC",
  "volume_24h": 10906.03705733
}
```

Those numbers are inspection evidence, not a current quote. The inspection time is not a provider timestamp. The existing [website](http://3.145.42.74/) and `/api.html` remain the team's temporary stored-price pages; the updated frontend has not been deployed. The observed HTTP server header identifies nginx 1.30.6, without establishing its effective configuration or document root.

In the user's actual Safari browser, a temporary local proxy let the updated local frontend use the real public API. BTC and ETH rendered successfully. XMR produced an unsupported-market partial profile with price/volume unavailable; its stored `630` price was not substituted. These are local frontend checks against real remote responses, not verification of a newly hosted frontend.

The remaining source routes below were not all exercised remotely. No combined profile-plus-market endpoint was tested. Public success responses alone do not inspect the database schema, application service configuration, or private server-to-server path; Alex's later packet supplies separately attributed details below.

## Alex's infrastructure handoff

The packet captured at 21:14 UTC reports nginx forwarding `/api/` with its prefix preserved to app port 5000; the app runs from `/opt/crypto-backend` under `crypto-backend.service` using Gunicorn. It reports MariaDB 10.5.29 at port 3306, table `crypto_db.cryptocurrencies` with `id`, `name`, `symbol`, `price`, eight rows, and an app-side `get_all_cryptos` query returning those eight rows through the private path. See [Alex's handoff review](alex-handoff-review.md) for sanitized evidence, source attribution, and limitations.

This supports the existing adapter and confirms which missing profile fields to coordinate; it is not independent command execution by this assistant. The report's truncated file-hash prefixes are insufficient to establish full remote byte identity. Obtain full hashes and file/command mapping rather than assuming the original ZIP is exactly the deployed source.

Alex describes `volume_24h` as base-asset quantity. The observed response still supplies no unit field or provider timestamp, and that teammate assertion has not changed the frontend adapter. Keep `volumeUnit`/`asOf` null until the agreed backend contract supplies verified metadata. Category/description and the equivalent combined JSON route remain unresolved.

## Routes confirmed in the supplied source

Nolan's subsequently supplied [middleware narrative](nolan-middleware.md) describes the same separate database and Coinbase routes, reported deployment and tests, and missing category/description. It is written submission material, not a replacement backend, a response-schema update or full deployed-file hash evidence. No adapter/configuration change follows from receiving it; observation time, volume unit and equivalent combined JSON remain unresolved.

| Method and path | Result/source behavior | Frontend use |
| --- | --- | --- |
| `GET /api/db/cryptos` | `SELECT name, symbol, price FROM cryptocurrencies`; JSON array; database failures return `503` with string `error` | Actual database directory and local full-name/ticker matching |
| `GET /api/live/<symbol>` | Uppercases an allowed symbol; calls Coinbase `/products/{symbol}-USD/ticker`; returns `name`, `symbol`, numeric `price`, numeric `volume_24h`, `source` | Selected asset's market values |
| `GET /api/cryptos` | Eight sequential Coinbase requests using a hardcoded catalog; failed items have null market values | Avoided for directory loading; not database backed |
| `GET /api/cryptos/<symbol>` | Hardcoded name/symbol plus Coinbase fields; omits `source` | Not used by current adapter |
| `GET /api/test-db` | Opens/closes a connection; `200` or `503` | Connection diagnostic only; does not verify the query or records |

The source whitelist is `BTC`, `ETH`, `XRP`, `LTC`, `ADA`, `DOGE`, `SOL`, `XMR`, matching the eight symbols observed in the public directory. Membership does not prove each Coinbase USD pair is supported; the Safari XMR check demonstrated that distinction. The stored database `price` is deliberately excluded from the current-market display.

These are illustrative shapes, not live observations:

```json
[{ "name": "Bitcoin", "symbol": "BTC", "price": 30000 }]
```

```json
{
  "name": "Bitcoin",
  "symbol": "BTC",
  "price": 68420.5,
  "volume_24h": 12345.67,
  "source": "Coinbase Exchange"
}
```

In the archive, `/api/live` returns `404` for unsupported symbols/unavailable pairs and `502` for caught upstream/parse failures. Database failures return `503`. Errors usually have `{ "error": "..." }`; unexpected Flask/proxy failures may be HTML. The source translates upstream Coinbase failures, including rate-limit failures, into its own `502`; it does not preserve every upstream status or `Retry-After` header. This source review does not substitute for testing every deployed error path.

## Frontend activation

The public route checks passed. The working `config.js` remains in demo mode; use the following in the API release after hosting discovery and the approved deployment:

```js
mode: "api",
apiContract: "nolan-v1",
apiBaseUrl: "/api",
catalogPath: "/db/cryptos",
marketPath: "/live",
requestTimeoutMs: 20000,
allowPartialMarket: true,
refreshCooldownMs: 5000,
staleAfterMs: 300000,
```

Keep credentials, private IPs, and EC2 administrative endpoints out of frontend configuration. The same-origin gateway must preserve the `/api/` prefix. A static-file server alone cannot supply these routes.

The adapter exports `loadAssetDirectory({ signal, config })` and `lookupAsset(query, { signal, config })`. The website displays the requested 27-asset target catalog. API-supported directory records come only from the database; target assets absent from that response are marked Awaiting API and send no market request. XMR is excluded from selections while original raw payloads remain unchanged. Search normalizes surrounding/repeated whitespace and case; suggestions/filtering use the loaded directory, while lookup requires a full name or ticker. Empty/unsupported/ambiguous queries receive explicit errors. Unknown symbols do not generate speculative Coinbase requests. The response symbol must match the selected asset.

These additional options are frontend behavior, not new server fields. `allowPartialMarket: true` keeps a validated database profile visible when its market request fails with an unsupported product, network/timeout, malformed response, rate limit, or server error. Price and volume become null and visibly unavailable; the stored sample price never replaces them. Database, query, explicit cancellation, and nonrecoverable failures remain blocking. Omitting the flag or setting it false preserves strict error behavior.

One cancellation budget covers a lookup's database and market requests; standalone directory loading has its own budget. The source backend uses a 10-second Coinbase request timeout and no explicit database timeout. Alex reports a 120-second nginx proxy timeout; the browser's 20-second budget remains unchanged. Browser cancellation does not guarantee cancellation of Flask/database work. A market-only timeout can still return the already validated profile in partial mode. The selected asset refreshes on load and 30 seconds after each completed lookup while the tab is visible. Hidden tabs, in-flight lookups, cooldowns and returned rate limits pause polling. A due refresh runs once when the tab becomes visible. The refresh control uses a five-second cooldown; a returned `429` can supply a longer `retryAfterMs` from a valid `Retry-After` header. The ZIP currently hides provider `429` behind `502`, so provider-specific retry metadata requires Nolan's coordination. Align bounded backend work and gateway timeouts with Nolan and Alex.

## Normalized data and JSON evidence

| UI information | `nolan-v1` mapping |
| --- | --- |
| Name/symbol | Validated selected database row |
| Category/description | Optional database text; unavailable when absent |
| USD price | Validated market `price`; database `price` ignored |
| 24-hour volume | Market `volume_24h`; no invented currency/unit |
| Market source | Returned `source` |
| Market observation time | Absent in archive and observed BTC response; unknown |
| Receipt time | Client-created `retrievedAt`, explicitly separate from quote time |

The lookup result includes normalized `data`, `raw: { profiles, market }`, `endpointUrls: { profile, market }`, the returned directory, warnings, `marketStatus` (`available` or `unavailable`), and an optional `marketError` containing sanitized code/message/status/retry delay. If a market request returns an error JSON body, the raw view preserves that body; absent/non-JSON payloads are not invented. Both original endpoint links remain available. The combined wrapper is assembled in the browser. It is not a new Flask endpoint and cannot by itself demonstrate the requested directly accessible equivalent profile/market JSON response.

`staleAfterMs` controls the UI's age label when a valid provider observation time is supplied by a supported contract. It does not manufacture a timestamp or make the current archive's quotes fresh. The `nolan-v1` archive mapping still leaves `market.asOf` and `volumeUnit` null.

## Minimal coordination needed with Nolan

1. Confirm remaining deployed routes/error cases and full file hashes/version. The public database/BTC success shapes match the ZIP, and Alex has supplied hosting/schema/query details; do not request that entire inventory again.
2. Return existing database category/description fields if available; otherwise coordinate their schema/content with Alex. Do not fill production gaps from demo descriptions.
3. Return provider observation time, product identity, and verified volume unit. The [Coinbase ticker](https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-ticker) is a last-trade snapshot with 24-hour volume; receipt time is different. [Product stats](https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-stats) explicitly describes base-currency volume. Confirm ticker semantics before applying that label. Price, volume, and 24-hour percentage change are different values.
4. Expose one agreed profile-plus-market JSON endpoint (or document an existing equivalent). Keep names, nullable fields, stale/error states, units, and timestamps explicit; use actual database records and server-side product mapping.
5. Bound database/provider work; validate finite nonnegative market values; return consistent JSON errors and sensible rate-limit handling. Do not change the teammate-owned backend without coordination.

`combined-v1` remains an optional earlier frontend proposal for `/api/cryptocurrencies?query=...`. That route does not exist in the ZIP. Its strict schema requires complete fields and USD volume, which would need a documented calculation; it is not the default and must not be presented as the current backend contract. See the historical [backend integration handoff](BACKEND-INTEGRATION.md) for that proposal.

Before final submission, compare the deployed updated HTML with directly opened JSON responses, and verify the agreed equivalent profile-plus-market endpoint. The current public database/BTC checks and local Safari rendering checks are complete; a hosted updated-frontend comparison remains pending. Record URLs, response time, source/time/unit, and sanitized evidence in [testing](testing.md) and the [submission checklist](submission-checklist.md).
