# Shared status - November 18, 2026

## Received

- Alex: infrastructure/service/schema/query text captures, configuration paths, VPC explanation, contribution draft, and editable SVG plus PNG/PDF network diagram.
- Nolan: middleware implementation/test narrative, limitations/contribution, and the new SharePoint `ETI300W_Flask_Backend_Upgrade` candidate (downloaded and statically reviewed).
- These materials do not need to be resent. Actual infrastructure/application screenshots remain outstanding. The backend candidate has not been executed or verified deployed in this handoff work.

## Frontend

The Explore redesign adds a Coinbase-inspired market table, selected-asset overview, browser-local watchlist, filters and name sorting. Public project footnotes have been removed. Original JSON and endpoint links are available under Specifications.

The requested website catalog is now the exact **27 symbols, names and categories in `REQUESTED_CATALOG.csv`**. Demo mode provides fixed, labeled simulated values for all 27. In API mode only returned database records are eligible for market lookups; absent target assets stay visibly Awaiting backend support rather than generating speculative requests. Monero is excluded from website selections without modifying raw responses or requesting database deletion. Local catalog categories do not fill missing API metadata.

**Latest read-only public checks, begun `2026-11-18T22:10:18Z`:** `/api/db/cryptos` returned all 27 targets with the supplied categories and descriptions, plus `price_currency: "USD"` and `price_type: "stored_sample"`. `/api/live/BTC`, `/api/live/SHIB` and `/api/live/POL` returned HTTP 200. The BTC response included `product_id: "BTC-USD"`, `quote_currency: "USD"`, provider last-trade timestamp, separate retrieval timestamp and BTC volume units. These are genuine observed route improvements; they do not prove the unchanged candidate's exact bytes are deployed, every product works, or backend tests passed. Jake is finishing the optional frontend metadata mapping and verification.

The earlier eight-row catalog including XMR is historical evidence and is superseded by this public 27-row check. Actual database/schema/query screenshots and deployed source/migration provenance are still needed.

The selected asset refreshes every 30 seconds while the page is visible and on initial page load, respecting in-flight requests, cancellation, cooldown and returned rate-limit waits (including an explicit retry delay when exposed for HTTP 503). The session chart plots actual received prices against browser receipt time; it does not invent historical data or treat receipt time as provider observation time. Repeated fixed samples can produce a flat chart. API failures never fall back to fixtures or stored prices.

**96/96 local automated frontend checks passed.** Earlier Safari local-proxy checks rendered real BTC/ETH responses and an unavailable XMR profile. That was historical verification of the preceding interface; XMR is now excluded. Latest hosted/frontend verification remains pending. These local results do not establish deployment of this release or execution of the backend candidate.

The last verified public origin was `http://3.145.42.74/`, serving the temporary stored-price site. The public database and BTC routes worked. Confirm the origin before release; public IPs can change after stop/start.

## What the new backend candidate changes

| Item | Candidate source contains | Still needed |
| --- | --- | --- |
| Catalog/category/description | Included candidate migration covers the earlier eight; public catalog now returns all 27 with category/description | Confirm actual deployed source/schema/seed provenance and retain actual screenshots; no duplicate migration requested |
| Market metadata | BTC/SHIB/POL public responses now supply `provider_timestamp`, `retrieved_at`, units and product/currency identity | Finish optional frontend mapping/tests; confirm semantics and coverage; rebuild frontend |
| Equivalent JSON | `/api/assets/<symbol>` and `/api/raw/<symbol>` returning profile + market | Agree contract; new frontend mapping and comparison against actual server response |
| Existing aliases | `/api/cryptos` and `/api/cryptos/<symbol>` become stored-profile routes | Nolan resolve breaking market-to-sample behavior against original/deployed code |
| Failure/retry behavior | Live route uses 404/503/504/502; provider rate limits become 503 + optional Retry-After | Frontend handles HTTP 429 and explicit HTTP 503 retry metadata; confirm combined failure status/retry semantics |

The unchanged nine-file candidate documents the earlier eight-asset scope. The public API has since advanced to 27; source identity and migration provenance still require confirmation. Candidate implementation is not cloud verification. Its combined response also differs from the older frontend `combined-v1` proposal; changing a URL/config alone does not integrate it. Current `nolan-v1` reads `/api/db/cryptos` and `/api/live/<symbol>`, accepts optional catalog category/description, and validates optional returned metadata while leaving absent fields unknown. Jake owns the mapping/tests/new release; combined JSON still needs its own agreed adapter.

Category/description and equivalent JSON come from the earlier project brief; metadata supports truthful display. They are distinct from the four Canvas rubric sections. Unknown/unavailable labels remain honest while these gaps are disclosed.

## Owners and remaining work

- **Nolan:** compare candidate with original/deployed behavior, confirm current 27-coin source/seed provenance and explicit USD product availability, agree routes/metadata/errors, correct or document breaking aliases, provide local test results and actual middleware/API/query screenshots plus deployed JSON when released.
- **Alex:** confirm effective deployment configuration; document the deployed 27-coin schema/seed provenance and review any further code/schema and frontend plans with backup/restore before remote-write approval; provide actual service/DB/VPC screenshots; assist approved deployment and confirm diagram resource associations.
- **Jake:** adapt frontend to the agreed new contract, test/repackage, verify hosted search/JSON/keyboard/responsive behavior, capture cloud UI evidence and assemble the report.

## Submission

One document with Front End, Middleware, Back End and Add Two Documentation, each 25 points. Proposed additions: **II (private app-to-DB VPC networking)** and **VII (full network diagram)**. Confirm team agreement and support both with actual evidence. Vanilla JavaScript does not count as option I; Kiro/local tests are not listed additions.

Include actual cloud screenshots with captions, communication explanation, diagram, test results/limitations and contributions. Hashes help provenance but are not separately listed grading requirements. No framework migration, VPC rebuild or name-search rewrite is needed for the proposed additions.

Suggested team return target: Friday, November 20. Canvas due date shown: **Sunday, November 22, 2026, 11:59 p.m.** November 29 is the availability cutoff, not an extension.
