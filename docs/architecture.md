# Project architecture

## Production default and copy cleanup

The public origin was observed serving Crypto Context and API mode at 5:22 p.m. Eastern on November 18. The repository now defaults to API mode too. `npm run serve` uses `scripts/serve_frontend.py` for a localhost-only, read-only proxy to the public catalog/market routes; the default cannot silently show fixtures on failure. Explicit offline previews remain available with `npm run serve:demo`. Production HTML/FAQs no longer contain sample-data boilerplate. Original JSON payloads remain unchanged. This newer release still requires hosted verification after the team deploys it; no AWS write was performed here.

## Latest public verification · 22:12 UTC, November 18

The backend now returns all 27 requested catalog records with category/description. All 27 selected market routes returned HTTP 200 in the [read-only check](evidence/api-2026-11-18-catalog-verification.json). BTC, SHIB and POL were also inspected with explicit `product_id`, `quote_currency`, `provider_timestamp`, `volume_unit` and `volume_24h_unit`. The adapter now maps valid optional metadata while retaining compatibility with earlier responses that lack it. Stored database prices remain excluded from market values. Browser receipt time and provider observation time remain distinct.

The earlier eight-record/no-metadata observations below are dated baseline evidence. They no longer describe the latest public success payloads. The exact deployed version/full hashes, candidate alias compatibility, backend tests and remote screenshots still need teammate confirmation. This assistant made no AWS writes. The newer combined route `/api/assets/BTC` returned HTTP 200 with `{profile, market, market_available, market_status, market_error}` at 22:10 UTC, but the frontend continues using the two established routes; its browser-assembled JSON is identified accordingly.

## Earlier baseline and implementation history

Status date: November 18, 2026. This is the current architecture reference. The November 8 uppercase guides remain historical handoff material.

## Evidence and limits

| Source | Established by inspection | Not established by that source |
| --- | --- | --- |
| Local frontend repository and Safari checks | Static HTML/CSS/JavaScript, separate API adapter, labeled demos, automated checks; local frontend rendered real API BTC/ETH responses and an honest XMR partial-profile failure through a temporary local proxy | Deployment of this updated frontend on AWS |
| Nolan's `crypto-backend.zip` | Flask routes, MySQL connector query, Coinbase ticker calls; original source preserved | That this archive matches the deployed service or successfully queries MariaDB today |
| November 15 Milestone III, pp. 2–4 | Team reports three `t3.micro` instances, Flask, MariaDB, a temporary page, eight name/symbol/sample-price records; promises glossary and FAQ | Authenticated current instance inventory, current service configuration, or live Coinbase integration |
| November 18 user brief | Target region `us-east-2`, instance and administrative endpoint names, ownership and deployment restrictions | Resource existence, OS, public URL, actual document root, or service ports |
| November 18 authenticated Safari EC2 console | Three named `t3.micro` instances running in `us-east-2a`, with status checks passed; IDs and sanitized details in [AWS inspection](aws-inspection.md); web AMI identifies Amazon Linux 2023 | Runtime OS, installed service configuration, document root, database schema, or private connections |
| November 18 public HTTP checks | Existing temporary website and `/api.html`; `/api/db/cryptos` HTTP `200` with eight name/symbol/stored-price records; `/api/live/BTC` HTTP `200` with Coinbase Exchange price/volume; nginx 1.30.6 header | Provider observation time/unit, every route/error case, private tier path, TLS, or a combined JSON endpoint |
| Alex's November 18 infrastructure packet, captured 21:14 UTC | Teammate text captures/narrative report runtime OS, service paths, schema, private query, network rules/routes; SVG/PNG/PDF diagram supplied and readable; see [handoff review](alex-handoff-review.md) | Independent execution by this assistant, actual infrastructure/application screenshots, full remote file identity, verified staged backup/rollback, or deployment of the updated frontend |

Milestone III was located at `Milestone III.pdf` and read, including rendered pages 2–4. SHA-256: `66e3ad5f9ef6f5dcc8e65156b6c8d7ca22c6337552763b70157840c957369dd7`. The original rubric was unavailable during that discovery stage. The user subsequently supplied Canvas Cloud Build screenshots and the additions list; the [submission checklist](submission-checklist.md) now records their four rubric sections, deadline and two-addition requirement. Milestone I/II remain team reports rather than professor-authored instructions.

## Reported deployment path

```text
Visitor browser
  └─ public web origin: coinbase-300w-web
       ├─ nginx :80 → /usr/share/nginx/html
       └─ same-origin /api/* proxy, prefix preserved
            └─ app :5000: coinbase-300w-app
                 ├─ Gunicorn / Flask → MariaDB :3306: coinbase-300w-db
                 └─ Flask → Coinbase Exchange over HTTPS
```

The three distinct named instances are independently verified as running in the user's actual Safari EC2 console; their IDs are in [AWS inspection](aws-inspection.md). Public web/API responses work at [http://3.145.42.74/](http://3.145.42.74/). The service paths/ports above come from Alex's subsequently supplied packet. Preserve the existing deployment; the updated frontend remains local.

Alex's packet reports Amazon Linux 2023 on all three tiers; nginx 1.30.6 with `/etc/nginx/default.d/crypto-api.conf` preserving `/api/` to app port 5000 with a 120-second proxy timeout; `/opt/crypto-backend` under `crypto-backend.service` using Gunicorn; and MariaDB 10.5.29 with `crypto_db.cryptocurrencies` containing `id`, `name`, `symbol`, `price` and eight rows. It includes an app-side `get_all_cryptos` result with eight rows over the private database path. These are teammate-supplied captures/reports, not commands independently run by this assistant. Full remote hashes and the mapping of captures/diagram to actual resource associations still need confirmation.

The packet describes one public subnet shared by web/app and one private database subnet with no internet-gateway route and an S3 gateway route. App port 5000 is allowed from the web security group; database port 3306 is allowed from the app security group. This supports documenting addition II; actual association/rule screenshots and command provenance remain needed for the final report. The supplied SVG/PNG/PDF diagram supports addition VII, with the readable export and actual topology mapping retained in [Alex's evidence review](alex-handoff-review.md). Alex reports HTTP-only hosting; no independent HTTPS check was performed, and TLS is not a prerequisite for documenting these selected additions.

The browser uses the public web origin. Flask owns database access, product mapping, and Coinbase requests. Credentials and private addresses stay server-side. EC2 Instance Connect is administrative access, not the visitor API gateway. This assistant opened no administrative session and made no remote changes.

## Local implementation

- `index.html`, `style.css`, and `script.js` implement the visitor interface.
- `api.js` loads and validates responses, resolves database names/tickers, and normalizes data for rendering. It can retain a validated profile when only the market request fails. [API contract](api-contract.md) separates archive behavior from observed public responses.
- `config.js` selects `demo` or `api` mode. The working default remains a clearly labeled demo until the inspected and approved frontend deployment; public API success alone does not deploy this frontend.
- `data-state.js` formats prices/volume and separates samples, missing markets, provider observation time, browser receipt time, and stale snapshots. Manual refresh has a five-second cooldown and respects returned rate-limit waits; there is no automatic polling.
- The interface includes a visitor glossary and FAQ as promised in Milestone III.
- `data/demo-assets.js` contains isolated examples. API mode does not fill missing database records or market fields with these fixtures.
- The local Python static server serves frontend files. It does not implement Flask, database access, or `/api/` forwarding.

Eight is both the report's count and the observed public directory count, not a hardcoded production limit. API mode renders the returned directory. The current eight symbols match the archive's whitelist, but differ from demo assets and do not guarantee supported Coinbase USD products.

## Data meaning

| Value | Required provenance and presentation |
| --- | --- |
| Name, symbol, category, description | Actual database response; missing fields visibly unavailable |
| Stored/sample price | Sample or stored value only; never described as a current quote |
| USD price | Coinbase USD-product last-trade response through Flask; freshness depends on provider time |
| 24-hour volume | Returned amount with confirmed unit; distinct from price and percentage change |
| Provider timestamp | Market observation time only when supplied and validated |
| Client receipt time | When the browser received data; does not prove market freshness |
| Raw JSON | Original endpoint payloads and endpoint links; a client wrapper is identified as assembled in the browser |

The original ZIP omits category, description, market time, volume unit, and a combined profile/market endpoint. The public responses and Alex's reported schema agree that category/description are missing; the market response still omits provider time/unit. Alex describes volume as base-asset quantity, but that assertion has not changed the API contract or adapter: the UI still labels its unit unprovided until verified and returned explicitly. A combined remote endpoint remains untested; source absence is not a claim about every deployed route. Remaining work includes actual screenshots/associations and command/full-hash mapping, complete product/metadata coverage, a reviewed backup/staging/rollback and approved frontend deployment, and final hosted HTML/JSON equivalence.

## Ownership

Jake owns frontend code, integration mapping, local tests, and release preparation. Nolan owns Flask, queries, Coinbase integration, and backend changes. Alex owns AWS configuration, networking, operating systems, and the database server. Remote writes require approval of the exact target and changes, with backup and rollback. See [deployment](aws-deployment.md), [testing](testing.md), and [submission checklist](submission-checklist.md).
