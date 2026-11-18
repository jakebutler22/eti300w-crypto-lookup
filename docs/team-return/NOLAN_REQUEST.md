# Nolan - remaining handoff after the upgrade package

Your write-up and new backend candidate are received. No need to resend unchanged files. Please use `RETURN_TO_JAKE/NOLAN_REPLY.md`.

## Confirm the new public API with Alex

`REQUESTED_CATALOG.csv` is the exact 27-coin target. In the latest read-only checks begun `2026-11-18T22:10:18Z`, `/api/db/cryptos` returned all 27 with categories/descriptions and explicit stored-sample price labels; BTC, SHIB and POL market requests returned HTTP 200 with product/time/unit metadata. Thank you: these are now observed improvements, so a duplicate 27-coin implementation is not requested.

Please identify the actual deployed version/full hashes and return the schema/seed or migration that produced the current catalog, with exact counts and any retained extra records. Confirm the server-side whitelist and USD product map for all 27; report unsupported products explicitly rather than assuming every pair works. Preserve sample/live separation and unrelated routes. The supplied nine-file candidate remains unchanged and reflects an earlier eight-asset scope; it is not proof of the current deployed source.

The website excludes XMR, preserves original JSON and lists all requested targets. Only returned database records can trigger market requests. Missing targets, if any, show Awaiting backend support; local categories never silently fill missing API fields.

## Review and agree the candidate

1. Compare it with the original ZIP and actual deployed source; retain unrelated routes/custom behavior. The candidate README says it was prepared without the original source, so treat it as a replacement proposal rather than a verified patch.
2. Resolve the existing `/api/cryptos` and `/api/cryptos/<symbol>` route regression: the original returned Coinbase market data/volume; the candidate returns database profiles with stored sample prices. Preserve the old behavior or explicitly agree/document a breaking change and identify affected consumers. Jake's current frontend uses `/api/db/cryptos` plus `/api/live/<symbol>`.
3. Confirm `provider_timestamp` means Coinbase last-trade time, `retrieved_at` means backend retrieval time, `volume_24h` is base-asset quantity with its symbol unit, and `quote_currency`/`product_id` identify the USD market. Keep trade time separate from retrieval time and USD price separate from volume.
4. Confirm the combined `/api/assets/<symbol>` or `/api/raw/<symbol>` contract: `profile`, `market`, `market_available`, `market_status`, `market_error`, including null market during failure. It is a new contract, not the existing `combined-v1` adapter shape. Jake must implement/test the combined mapping and compare UI to actual endpoint JSON; optional market metadata mapping is being completed separately.
5. Confirm the category/description content and actual 27-row seed/migration with Alex. These fields now appear in the public catalog; provide schema/query evidence and disclose any retained extra records. Stored prices remain sample values, not market observations. Any further migration still needs an exact reviewed plan and approval.
6. Agree retry/error behavior. The candidate converts provider 429 to HTTP 503 plus optional `Retry-After`; the frontend now handles HTTP 429 and explicit retry metadata on 503; keep retry semantics consistent and test them. The combined route returns HTTP 200 for market failures and drops the upstream status/retry information. Preserve or explicitly agree usable error/retry metadata before Jake integrates it.
7. Return your local test command/result, dependency/Python 3.9 compatibility result, changed-file hashes and any corrections. Candidate tests were supplied but were not run by Jake during this packaging review. Include route-preservation, pre/post-migration, provider timeout/rate-limit and database-outage cases where relevant.

## Remaining evidence and any later approved release

Send sanitized actual JSON with path, HTTP status and capture time for:

- Catalog: `/api/db/cryptos`, confirming the now-observed 27 requested targets; include exact counts, schema/query context and any retained extra records.
- Successful markets: BTC plus coverage of other target products. BTC/SHIB/POL successes with metadata were already observed publicly; attach actual middleware/provider context rather than simply repeating the same implementation claim.
- Unavailable/unsupported market: an agreed controlled fixture or confirmed unavailable product. XMR is excluded from website selections; no need to restore it for this test.
- Combined success/unavailable: `/api/assets/BTC` and the agreed unavailable case (or raw alias). Do not describe a browser-assembled JSON wrapper as a server endpoint.

Also send an actual running `crypto-backend.service`/Gunicorn screenshot with app-instance context and successful request. Coordinate an actual app-to-MariaDB query screenshot with Alex. A connection-only `/api/test-db` check does not demonstrate the catalog query or 27-coin coverage.

Your narrative/contribution and existing diagram inputs are already received. Full-name/ticker search already works in the frontend. JSON is under Specifications; selected quotes refresh every 30 seconds while visible, and the chart records received session prices only. Please account for this request cadence and retain usable retry metadata. Keep unsupported markets unavailable and never substitute stored prices.

No production code/schema/service change is authorized by receiving this ZIP. Review the exact changes, backup, validation and rollback with Jake before any remote write. Exclude secrets and private addresses from all returned materials.
