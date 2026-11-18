# Requirements and remaining work

Historical November 8 checklist. Use the current [submission checklist](submission-checklist.md) and [architecture](architecture.md) for the November 18 state, including the team's later report that the three instances and MariaDB prototype already exist. That report still requires runtime verification.

This checklist maps the user's supplied implementation brief to the project as of November 8, 2026. The original professor assignment sheet/rubric was not provided, so this is not a certification of unknown submission, report, or grading requirements.

The **working frontend milestone is implemented** with eight example profiles and clearly labeled simulated market data. Nolan has now supplied a Flask backend prototype, reviewed as source. The frontend has an adapter for its actual routes. The **full application still needs missing backend fields, a combined JSON endpoint, actual MySQL verification, and three-tier AWS integration**. See [Backend review](BACKEND-REVIEW.md) for evidence from the supplied ZIP; it has not been run here.

## Requirement-to-status matrix

| Requirement in the supplied brief | Current status | Remaining owner/work |
| --- | --- | --- |
| HTML, CSS, vanilla JavaScript; professional navigation and branding | Implemented and revised into a straightforward lookup interface | Jake: review against the final professor rubric if it adds visual constraints. |
| Search by cryptocurrency name or ticker | Implemented in demo; Nolan adapter resolves names/tickers from the real database directory | Nolan + Jake: verify against the running database-backed routes and reconcile supported products. |
| Display name, ticker, category, description, USD price, and 24-hour volume | Demo complete; actual API mapping added with unavailable fields shown honestly | Nolan + Alex: add/populate/query category and description; Nolan: confirm volume units and return all required data. |
| Loading, errors, empty search, invalid symbols, and asynchronous request handling | Implemented and locally tested | Jake + Nolan: repeat failure/recovery checks with the real middleware. |
| Keyboard accessibility and responsive desktop/mobile layouts | Implemented; local keyboard/layout checks recorded | Jake: complete the remaining accessibility checks in [testing.md](testing.md), and verify after design changes. |
| View raw JSON; identify source and freshness | Demo complete; actual API JSON wrapper preserves both responses and endpoint links; missing market time/unit shown honestly | Nolan: return provider observation time/unit; Nolan + Jake: verify combined JSON equivalence. Client receipt time is not provider freshness. |
| Configurable, separate frontend API service module | Implemented; `nolan-v1` supports actual ZIP routes; old `combined-v1` remains optional | Jake: activate API mode after proxy/service verification. |
| Profiles retrieved from MySQL through Python middleware | Database query/JSON route supplied; source reviewed; no runtime database verification here | Alex + Nolan: provide/populate MySQL, add missing profile fields, verify query and combined response. |
| Current trading information retrieved through Coinbase Exchange Ticker API | Coinbase calls/JSON routes supplied; frontend adapter implemented; runtime integration unverified | Nolan: reconcile USD-product mapping, add time/unit metadata, complete validation; team: verify real retrieval. |
| Three separate EC2 instances: presentation, application, database | Deployment guidance prepared; no deployment verified | Alex: provision and configure all three tiers. |
| Browser reaches middleware through an appropriate public route/reverse proxy | Client prepared for same-origin `/api/`; Apache example documented | Alex + Nolan: deploy and confirm the actual route and private tier communication. |
| Network-accessible API endpoint returning equivalent raw JSON | Prototype JSON routes exist separately for database and live data; no combined/deployed equivalent endpoint verified | Nolan: add one response with required profile and market fields; Alex: expose it; Jake: verify HTML equivalence. The client-assembled dialog wrapper alone does not satisfy this requirement. |
| Required project files, README, deployment instructions, testing checklist, backend handoff | Present | Team: update actual deployment/integration results when available. |

## Exact next steps by owner

**Jake — frontend**

- [x] Revise the design into a straightforward lookup interface and verify required information, search/error handling, JSON controls, and desktop/mobile layouts.
- [x] Review Nolan's ZIP and adapt the frontend to its actual database/live routes, database directory, and response fields without filling missing data from demos.
- [ ] Confirm final profile fields, supported symbols, market timestamps, and volume units with Nolan; map his final combined response when available.
- [ ] Set `config.js` to `mode: 'api'` after the middleware route works.
- [ ] Verify real name/ticker lookups, required fields, loading/error recovery, source/freshness labels, and raw JSON equivalence.
- [ ] Complete the remaining keyboard/accessibility checks recorded in [testing.md](testing.md).

**Nolan — Python middleware and data**

- [x] Supply Flask prototype with database query, Coinbase ticker retrieval, and JSON routes (source reviewed; local operation is Nolan's report).
- [ ] Add/populate/query category and description in MySQL, and implement one combined name/ticker lookup endpoint.
- [ ] Reconcile database symbols with supported Coinbase USD products; verify the running provider requests and returned values.
- [ ] Confirm volume units with Jake. The brief requires a **USD price**, but does **not specify USD-denominated volume**. Verified base-asset units can be displayed with corresponding schema/UI changes; a USD calculation is an optional contract choice that needs a documented methodology and truthful labeling.
- [ ] Return combined information through a real JSON HTTP endpoint, including provider observation time, product identifier, volume unit, and consistent failures/timeouts.
- [ ] Supply the agreed service port, route, and response contract to Alex and Jake.

**Alex — AWS infrastructure**

- [ ] Provision three separate EC2 instances for the frontend, Python application, and MySQL database.
- [ ] Install/configure each service and security groups so the required tier-to-tier communication works.
- [ ] Run Nolan's Flask app using a production WSGI server, provide its four database environment variables, and verify the actual table query. `/api/test-db` checks only connection opening.
- [ ] Deploy the frontend and expose the selected Python API route through the presentation server, using the documented reverse proxy approach or an agreed browser-accessible alternative.
- [ ] Verify the frontend host can reach the application tier and the application tier can reach MySQL and Coinbase.

**Team — final integration verification**

- [ ] Demonstrate a lookup through the deployed presentation → Python → MySQL path, with Coinbase market data included by Python.
- [ ] Open the raw JSON endpoint directly and confirm it contains equivalent information to the rendered HTML result.
- [ ] Verify invalid searches and database/market-service failures are handled visibly.
- [ ] Record the working frontend/API URLs and integration results. Screenshots and request traces are useful evidence; the supplied brief does not establish an additional formal evidence submission format.

No login, wallet, portfolio, trading, or chart features are required by the supplied brief.
