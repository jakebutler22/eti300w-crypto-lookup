# Backend integration · Nolan

Historical November 8 handoff. The current [API contract](api-contract.md) records the confirmed archive routes, frontend partial-market behavior, and remaining deployed-contract verification.

This document follows the **actual source** in the supplied `crypto-backend.zip`, reviewed November 8, 2026. The previous `/api/cryptocurrencies?query=BTC` contract remains an optional proposal; that route is not in the ZIP. Source references are in [BACKEND-REVIEW.md](BACKEND-REVIEW.md).

No Python backend code was changed or deployed in this frontend work. Actual database, Coinbase, and EC2 behavior remain to be tested by the team.

## Existing routes

| Route | Source behavior | Frontend use |
| --- | --- | --- |
| `GET /api/db/cryptos` | Queries MySQL for `name`, `symbol`, `price`; returns an array, or `503` with a string `error` | Load the database directory and resolve a full name/ticker |
| `GET /api/live/<symbol>` | Checks a hardcoded whitelist, calls Coinbase `{SYMBOL}-USD/ticker`, returns market fields | Fetch the selected asset's market data |
| `GET /api/cryptos` | Calls Coinbase sequentially for eight hardcoded assets; failed entries have null market values | Not used for the catalog: it does not query MySQL and makes eight upstream requests |
| `GET /api/cryptos/<symbol>` | Hardcoded-name lookup and one Coinbase call; omits the `source` field present on `/api/live` | Not needed by this adapter |
| `GET /api/test-db` | Opens and closes a database connection; returns `200` or `503` | Diagnostic only; does not verify the table, query, or profiles |

The live whitelist is `BTC`, `ETH`, `XRP`, `LTC`, `ADA`, `DOGE`, `SOL`, `XMR`. It differs from the demo directory. Membership does not establish Coinbase product availability; the live route separately handles a missing pair. A database entry outside the whitelist currently fails at the live route.

## Actual response shapes

These numbers are illustrative, not observations from a running service.

`GET /api/db/cryptos`:

```json
[
  { "name": "Bitcoin", "symbol": "BTC", "price": 30000 }
]
```

`GET /api/live/BTC`:

```json
{
  "name": "Bitcoin",
  "symbol": "BTC",
  "price": 68420.5,
  "volume_24h": 12345.67,
  "source": "Coinbase Exchange"
}
```

Current errors are top-level strings, such as `{ "error": "Trading pair unavailable on Coinbase" }`. The live route uses `404` for unsupported symbols/missing pairs and `502` for caught upstream/parse failures. The database route returns `503` on failure. Unexpected exceptions may use Flask's default error response; do not assume every failure is JSON.

## Client activation and mapping

Set `mode: 'api'`, `apiContract: 'nolan-v1'`, `apiBaseUrl: '/api'`, `catalogPath: '/db/cryptos'`, and `marketPath: '/live'` after the proxy/backend work. Keep the route on the public frontend origin. The browser never connects directly to MySQL, Coinbase, or a private EC2 address.

The directory supplies actual database names and symbols; case-insensitive full-name/ticker matching happens in the client. The selected result requests `/api/live/<encoded ticker>`. Unknown names do not trigger speculative Coinbase requests. The returned market symbol must match the selected database symbol. Failed requests never fall back to demo data.

| Information | Mapping under `nolan-v1` |
| --- | --- |
| Name and ticker | Selected MySQL directory row |
| Category and description | MySQL row when supplied; otherwise explicitly unavailable |
| Current USD price | Live `price` from the backend's USD product request; stored database `price` is ignored |
| 24-hour volume | Live `volume_24h` as returned; no currency symbol or invented unit |
| Source | Database profile provenance and the returned market `source` |
| Market freshness | Unknown because the current route discards Coinbase's timestamp |
| Receipt time | Client receipt time, labeled as receipt rather than market observation |

The response has no provider timestamp, product identifier, volume unit, or calculation methodology. Do not infer market freshness from when JSON arrived or USD volume from the USD price. Fix missing profile fields in MySQL/query output rather than filling them with demo text.

`api.js` exports `loadAssetDirectory({ signal, config })` for the configured directory and `lookupAsset(query, { signal, config })` for a result. A Nolan result contains normalized `data`, `warnings`, the original `raw: { profiles, market }`, `endpointUrls: { profile, market }`, `endpointUrl: null`, `contract: 'nolan-v1'`, `mode: 'api'`, and the just-fetched `directory` of names/symbols/categories. `data.market` uses `priceUsd`, `volume24h`, `volumeUnit: null`, and `asOf: null`; `data.retrievedAt` is client receipt time. `getAssetDirectory()` remains the local demo examples. `ApiError` represents validation, request, timeout, and cancellation failures. Database `503` becomes `DATABASE_UNAVAILABLE`; unsupported live products become `PRODUCT_UNAVAILABLE`; ambiguous database matches become `AMBIGUOUS_MATCH`.

The JSON dialog preserves the two original payloads in an explicitly client-assembled wrapper and links to their actual endpoints. The wrapper is not a Python endpoint. **One directly accessible JSON response with equivalent profile and market information remains required.**

The browser uses one 20-second cancellation timer for the entire `lookupAsset` operation, including its database and live requests. A standalone directory load has its own timer. Coinbase calls use `timeout=10` in the supplied backend; MySQL has no explicit connection/query timeout. Agree limits across all tiers: client cancellation bounds the browser's wait, but does not establish a bounded database query or successful backend completion.

## Required backend changes

1. Add/populate `category` and `description` in MySQL and return them from the profile query. No schema/seed script was supplied; agree actual column names and types with Alex.
2. Provide one endpoint combining the database profile and Coinbase result, accepting full name/ticker. Use parameterized queries for user input, keep product mapping server-side, and reconcile it with database assets.
3. Include the product identifier and provider observation time. Coinbase's [Exchange ticker reference](https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-ticker) describes a last-trade snapshot and 24-hour volume, and includes `time` in the example. State what the returned timestamp means.
4. Confirm and return the volume unit. The supplied brief requires USD **price**, but does not require USD volume. Coinbase explicitly identifies base-currency volume on its [product stats endpoint](https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-stats); the ticker reference does not explicitly define that unit. Verify ticker semantics before labeling it. Label any approximate USD conversion and document its methodology.
5. Bound database/upstream work, validate finite nonnegative market numbers, and return consistent JSON failures. The current `float()` conversion does not establish all those guarantees.
6. Give Alex the WSGI startup command, private bind address/port, dependencies, and database environment requirements. Verify the real query, not only `/api/test-db`.

## Optional combined proposal

`apiContract: 'combined-v1'` selects the previous proposal. It requires a separately implemented route; deploying the ZIP does not create it.

```http
GET /api/cryptocurrencies?query=BTC
Accept: application/json
```

```json
{
  "data": {
    "symbol": "BTC",
    "name": "Bitcoin",
    "category": "Store of value",
    "description": "Profile text maintained in MySQL.",
    "market": {
      "priceUsd": 68420.5,
      "volume24hUsd": 123456789.12,
      "asOf": "2026-11-08T14:00:00Z"
    },
    "sources": {
      "profile": "Team MySQL database",
      "market": "Coinbase Exchange · BTC-USD"
    },
    "simulated": false
  }
}
```

This proposal requires nonempty profile/source strings, finite nonnegative numeric price/volume, a valid explicitly zoned ISO timestamp, and boolean `simulated`. `volume24hUsd` needs an agreed USD calculation; it is not a raw Coinbase ticker field. Verified base-asset volume is a valid alternative for the brief, but changing to it requires revising this schema and the `combined-v1` adapter together. The illustrative values above are not real observations.

## Acceptance checks

- [ ] Verify Apache preserves `/api/` and the database directory reads the actual table.
- [ ] Search an actual database name/ticker and verify its required profile fields and selected USD product.
- [ ] Confirm unsupported database symbols and missing Coinbase pairs produce visible failures.
- [ ] Verify volume units and provider observation time in JSON and HTML.
- [ ] Open the final combined endpoint directly and compare all required values with the HTML result.
- [ ] Check database/provider failure, malformed responses, timeouts, cancellation, and recovery against the running service.
- [ ] Record working public URLs and the three-instance path in the testing record.
