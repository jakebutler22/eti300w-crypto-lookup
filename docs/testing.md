# Verification record

## Logo flashing fix · November 18, 2026

The deployed core files matched the preceding release, but all 27 `/assets/coins/<symbol>.svg` requests returned HTTP 404 HTML. The existing renderer recreated every table image as each market quote arrived, repeatedly retrying the missing files. Oversized ticker fallbacks also clipped inside the icon circles.

The renderer now retains each asset row and logo node across quote/freshness updates, sorting and filters. Same-asset detail refreshes preserve their logo; failed URLs use a readable ticker fallback for the visit. An old image error cannot replace a newer selected asset's logo. Release query versions changed to `20261118-logos`.

`npm test`: **122/122 passed**, including seven new checks exercising actual production rendering functions with a minimal DOM. They cover row/image identity, keyboard focus, sort/filter reuse, updated metadata/support state, missing-image retries and delayed error races. Actual Safari tested an isolated missing-logo preview using the live API: 54 successful market responses over initial load plus automatic refresh produced exactly 27 image requests, one per coin, with readable steady fallbacks. A second Safari preview served the complete assets: all 27 SVGs returned 200, and another 54 market responses plus selection of Ethereum produced no repeated logo requests (27 total SVG requests). The correct logos and cached Ethereum overview remained visible. These controlled previews did not change production. No AWS files or services were changed. The complete 36-file API archive includes all 27 SVGs and their license; the missing hosted folder still requires deployment.

## Direct-file loading diagnosis · November 18, 2026

Opening `index.html` with a `file://` address prevents the module-based app from loading and supplies no same-origin `/api` server. The file now has an inline, import-free recovery view linking to the real website and explaining `npm run serve`. It hides the unusable controls and indefinite loading state only for the file protocol; HTTP behavior is unchanged.

A read-only check on November 18 found the hosted core HTML/CSS/modules byte-identical to the preceding all-coin release. The catalog returned 27 complete profiles and `loadMarketDirectory` returned all 27 market responses without errors in 6.7 seconds. Public BTC/FIL logo requests returned 404: the core deployment is current, but its `assets/coins/` folder still needs to be copied from the full 36-file API archive. This recovery-view change is a subsequent release and has not been deployed here. Actual Safari confirmed that the local file now shows only the recovery view. Its live-site link initially hit an old cached “Crypto Asset Data” document; Reload Page From Origin (Option–Command–R) loaded the deployed Explore interface with a real BTC price, 24-hour volume and asset overview. The live API and frontend required no remote changes. All 115 automated checks passed after the recovery-view change.

## All-coin loading and local logos · November 18, 2026

- `npm test`: **115/115 passed**. The 17 bulk-loader tests cover one catalog request, all-coin delivery, bounded concurrency/pacing, partial failures, per-request timeouts, cancellation and rate-limit stops. Two logo checks verify unique self-contained local SVGs for the exact 27-coin catalog, with license and pinned provenance.
- A real read-only `loadMarketDirectory` request to the public API returned **27/27 available quotes**, zero errors and zero pending symbols in 6.7 seconds. Every response had a provider timestamp and explicit volume unit. This is a point-in-time API observation, not a deployment claim.
- Actual Safari through `npm run serve` showed all 27 catalog rows with market prices/volume and zero loading/unavailable rows after the batch. Filecoin opened from cache with its own local logo, category/description, price and base-asset volume; its session chart grew from one to two received quotes after automatic refresh. Specifications opened the original JSON with the FIL market endpoint, and Escape closed the dialog. A page reload started another full automatic catalog load. These are local browser checks using the real public API, not hosted deployment verification.
- HTTP checks confirmed all 36 runtime paths were served locally, including every SVG and the license. HTML IDs/script references and `git diff --check` passed.
- The web release contains **36 files**: eight application files, 27 local SVG logos and their MIT license. Both release modes preserve the `assets/coins/` structure.
- The following sections preserve earlier checks and their original scope. No AWS writes were performed for this update; the new frontend still needs deployment and hosted acceptance checks.

## Production wording and default mode update

The page is titled Explore cryptocurrency. Static production HTML/FAQs contain no sample/demo/simulated boilerplate. Default mode is API, with a localhost-only development proxy provided by `npm run serve`. The explicit offline preview remains truthfully labeled. All **96/96 tests pass**, including default live requests and failure without fixture fallback. HTTP checks of the local preview returned the 27-record real catalog and a Coinbase BTC response; non-runtime files and unsupported proxy routes returned 404. Actual Safari rendered a live BTC quote with an API snapshot label and no sample wording.

Public HTTP observation at 5:22 p.m. Eastern found the preceding interface deployed in API mode. This new title/copy/config release requires subsequent hosted verification; no AWS write was made by this assistant.

## Latest 27-asset release verification · November 18, 2026

- `npm test`: **94/94 passed**, including exact catalog identity/categories, real zero/tiny values, session chart geometry, optional metadata validation, partial failures, request cancellation and Retry-After handling.
- `node --check script.js`; HTML ID/reference validation; `git diff --check` passed.
- Read-only public HTTP check returned the exact 27 requested catalog records with categories/descriptions, and HTTP 200 for all 27 `/api/live/<symbol>` requests. [Sanitized observations](evidence/api-2026-11-18-catalog-verification.json) record response metadata and capture time. Availability is a point-in-time observation.
- Actual Safari local demo showed all 27 rows, initial one-point chart, manual reload adding a second observation, automatic refresh adding further observations, Specifications disclosure opening original JSON, and Escape closing the modal. Fixed samples remained labeled and flat. Page reload restarted the session chart with one observation.
- Actual Safari through an owned local read-only proxy rendered real BTC and DOGE responses with provider freshness and base-asset volume units. The DOGE chart showed two successfully received quotes and automatic refresh. This is local frontend verification using a real API, not cloud deployment of this frontend.
- Earlier narrow reflow/watchlist/search checks remain recorded below. A dedicated touch-device check, hidden-tab network instrumentation and controlled delayed-response browser race checks were not newly completed; source review checked the visibility/in-flight/cancellation safeguards.
- Runtime import/style URLs carry a release version to avoid stale browser modules after an update. The tall desktop overview scrolls independently so Specifications remains reachable.

The final copy cleanup was reloaded in actual Safari: Crypto Context title, navigation in document order, retained 27-asset count and FAQs were visible; removed API/summary/promotional text was absent.

No AWS writes, migration, service restart or frontend upload was performed. Earlier records below retain their original dates and scope.

## Earlier verification history

November 18, 2026. This is the current verification record. Earlier November 8 screenshots document the previous interface; they do not establish that every old browser check was repeated after these changes.

## Explore redesign verification

The later November 18 table/watchlist redesign is documented in [Explore redesign](explore-redesign.md), including its new Safari demo checks and screenshots. The real-API Safari checks below belong to the prior layout; they were not all repeated after the visual redesign. The API adapter remains unchanged. All 71 automated checks were rerun successfully after the redesign.

## Automated checks

`npm test` passes **71/71** checks using Node's built-in runner; no package installation or browser build is needed. Tests use controlled responses and do not call AWS or Coinbase.

| Coverage | Checks |
| --- | --- |
| Original demo and optional combined adapter | 17 |
| Database catalog + Nolan market adapter | 22 |
| Partial market responses, timeouts, explicit cancellation, error JSON and rate-limit handling | 18 |
| Financial formatting and freshness | 14 |

Coverage includes full-name/ticker/case/whitespace search, unknown/ambiguous records, database failures, original JSON preservation, mismatched products, finite nonnegative numeric validation, zero/tiny values, missing metadata, unknown volume units, provider time versus receipt time, stale/future timestamps, bounded `Retry-After`, and no stored/demo-price substitution. Explicit aborts remain aborts; market-only failures can preserve a validated database profile. Database failures remain blocking.

JavaScript syntax checks pass for all runtime modules. The Python packager parses successfully and its API release was extracted and checked for the exact eight runtime files, matching file/archive SHA-256 values, API-only packaged configuration, and unchanged working demo configuration. Missing/symlink source-file rejection was checked with temporary fixtures. These are local packaging checks, not deployment.

## Safari interaction checks

The user's actual Safari window was used after their browser preference was clarified. No browser extension or settings were installed. A temporary localhost preview proxy forwarded only the observed public database/market routes to the existing web origin, while serving the new frontend locally in API mode. It did not change EC2 files or services. The working `config.js` remains `demo`.

| Scenario | Observed result |
| --- | --- |
| Demo full-name search ` eThErEuM ` | Ethereum selected with fixed, explicitly simulated values |
| Real API initial catalog | Eight actual database assets; BTC, ETH, XRP, LTC, ADA, DOGE, SOL, XMR; no demo-only additions |
| Real BTC and ETH rendering | Returned market price and plain-number volume, missing category/description, unknown volume unit and freshness, separately labeled receipt time |
| Real XMR unsupported market | Monero database identity remains visible; price/volume are unavailable; stored `$630` is never used as a current quote |
| Unsupported `ZZZZ` | Catalog has no matches; useful no-result message; no speculative market request |
| Empty input | “Enter a name or ticker” with a catalog and recovery control |
| JSON dialog | Original database/market payloads, actual endpoint links and explicit browser-assembly explanation |
| JSON keyboard boundaries | Shift+Tab from Close reaches the Market JSON link; Tab wraps to Close; Escape restores View JSON focus |
| Manual refresh / rate limit | Refresh disabled during its cooldown; controlled HTTP 429 with `Retry-After: 8` disables Search/Refresh, retains the profile, and gives wait feedback; controls re-enable after expiry |
| No automatic retries | The initial idle interval logged two catalog reads and one market request, with no automatic retry after the wait expired. Later user interaction/reload generated additional requests |
| Responsive layout | Inspected in a wide Safari window, narrowed window and increased page zoom; directory stacks above details and numeric values remain readable. This was a narrow-window/zoom check, not iPhone device emulation or a measured device viewport |

Code review identified and fixed catalog rate-limit handling, stale initialization overwriting a newer request, and repeated same-asset Search bypassing the refresh cooldown. Initialization now has cancellation and a request-identity guard. Different asset selections can still replace an in-flight lookup. Freshness text updates locally without market polling.

Saved screenshots:

- [Real API desktop](screenshots/safari-api-desktop.png)
- [Real API original JSON](screenshots/safari-api-json.png)
- [Narrow Safari detail](screenshots/safari-api-narrow.png)
- [Real unsupported-market state](screenshots/safari-api-unavailable.png)

These show the updated frontend served from localhost using actual public API responses. They are not screenshots of a deployed frontend release. Earlier `.jpg` captures are November 8 demo/fixture evidence. No server filesystem, database schema, credentials, or private instance addresses appear in the new interface screenshots.

## Public AWS observations

At `2026-11-18T19:44:50Z`, read-only public checks returned:

| URL | Observation |
| --- | --- |
| `http://3.145.42.74/` | HTTP 200; existing temporary “Crypto Asset Data” page; stored-price table with eight records |
| `http://3.145.42.74/api/db/cryptos` | HTTP 200 JSON; eight `name`, `symbol`, `price` records |
| `http://3.145.42.74/api/live/BTC` | HTTP 200 JSON; Bitcoin/BTC, numeric price `62635.68`, volume `10906.03705733`, source `Coinbase Exchange` |

Responses advertised `Server: nginx/1.30.6`. Later local UI lookups obtained newer BTC/ETH responses; the numbers above describe one observation, not fixed reference prices. The live route omits provider time and volume units, so its freshness/unit cannot be established from that payload. XMR returned an unsupported-market response in the local real-API check. No automated repeated polling or all-products scan was run.

The actual adapter was also invoked once against the public origin and returned eight catalog entries with BTC market data, missing metadata and unknown freshness. This verifies compatibility with observed deployed payloads. Public responses do not independently prove the private hop configuration, running SQL query, runtime OS, document root, or service units. See [AWS inspection](aws-inspection.md).

Authenticated Safari EC2 inspection confirmed the three named instances running as `t3.micro` in `us-east-2a`, each with 3/3 checks passed. The web launch AMI is Amazon Linux 2023. No EC2 Instance Connect shell was opened, and no remote writes or deployment occurred.

## Still required

- Repeat final symbol/full-name, refresh, JSON, failure/recovery, keyboard and mobile checks on the approved hosted release.
- Inspect runtime OS, effective document root, web/app service configuration, private proxy path, and MariaDB schema/query with authorized access.
- Obtain provider timestamp and verified volume unit; populate required database category/description fields; agree an equivalent combined raw JSON route if required.
- Run an actual screen reader, full-page keyboard traversal, reduced-motion check, Firefox and measured mobile-device/viewport checks. Safari screenshots do not establish those results.
- Select and run the custom agents in a compatible Kiro IDE/CLI; installed Kiro Crew alone does not validate their execution.
- Record the exact approved release hash, backup, rollback and hosted acceptance results. No deployment success is claimed here.

## Reproduce locally

```sh
npm test
python3 -m http.server 8000 --bind 127.0.0.1
python3 scripts/package_frontend.py --mode api
```

Open `http://127.0.0.1:8000/` while the server runs. Stop it with Ctrl+C. A static server alone has no `/api/` routes; API mode requires the real gateway or a clearly identified local test proxy. Temporary preview/fixture proxies used for this record were stopped after inspection and are not production components.
