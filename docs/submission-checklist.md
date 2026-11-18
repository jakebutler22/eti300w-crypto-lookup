# Submission checklist

Status date: November 18, 2026. This maps the supplied Canvas Cloud Build rubric, the pasted Final Assignment to Add, earlier project briefs, and team reports to evidence. The Canvas screenshots establish the four sections below; they do not supply every earlier assignment instruction.

## Confirmed Canvas submission requirements

Submit one document describing the current cloud implementation, with actual application/infrastructure screenshots and an explanation of how the components communicate. The displayed deadline is **Sunday, November 22, 2026, 11:59 p.m.** Availability until November 29 is not an extension of that deadline.

| Rubric section | Points | Evidence to assemble |
| --- | --- | --- |
| Front End | 25 | Actual cloud-hosted frontend screenshot and explanation |
| Middleware | 25 | Actual middleware screenshot and explanation of its role/requests |
| Back End | 25 | Actual database-tier screenshot and explanation |
| Add Two Documentation | 25 | Identify and document at least two of the listed additional options |

Recommended additions are **II (private VPC networking between Server2/app and Server3/database)** and **VII (full network diagram)**. Alex's subsequently supplied infrastructure packet now supports both: text captures/report describe the private app-to-database query and VPC routes/security rules, and readable SVG/PNG/PDF diagram assets are present. Keep these attributed to Alex; final actual infrastructure/application screenshots, command provenance, and resource-association mapping remain needed. EC2 membership alone does not prove a private data path. See [Alex's handoff review](alex-handoff-review.md).

Option I requires a real cloud-hosted frontend framework if selected. The vanilla frontend does not satisfy I, but I is optional when two other additions are chosen. Local Git history alone does not demonstrate VI's Desktop → GitHub → Server → multiple-developer workflow. Do not make Kiro/MCP or unselected additions blockers for the displayed rubric. See the [Nolan/Alex handoff](teammate-handoff.md) for copy-ready requests, ownership, and evidence filenames.

## Sources reviewed

- November 18 implementation brief and the earlier November 8 frontend brief supplied in chat attachments.
- November 15 `Milestone III.pdf`, located in Downloads, pp. 2–4: team reports an existing three-EC2/Flask/MariaDB prototype with eight sample-priced records, and promises a glossary and FAQ.
- `Milestone 1.pdf` and `Milestone II.pdf`: team intent for name/ticker search, stored profiles plus market data, and raw JSON.
- Nolan's original `crypto-backend.zip`: source-confirmed routes and missing fields; see [API contract](api-contract.md).
- November 18 read-only inspection in the user's actual Safari: authenticated Ohio EC2 inventory, existing public website, successful public database/BTC API responses, and local updated frontend checks against the real API. See [AWS inspection](aws-inspection.md) and [testing](testing.md).
- Subsequently supplied November 18 Canvas screenshots: single-document Cloud Build instructions, deadline, and four 25-point rubric sections; pasted Final Assignment to Add: options I–VII and minimum of two additions.
- `Alex-infrastructure-handoff-2026-11-18.zip`, captured 21:14 UTC: teammate text captures, handoff narrative, and SVG/PNG/PDF diagram; reviewed in [alex-handoff-review.md](alex-handoff-review.md), with sanitized retained evidence. It does not contain actual screenshots, `evidence.sh`, or infrastructure source code.
- Nolan's middleware write-up supplied in chat on November 18: overview, routes/query explanation, reported runtime/deployment/tests, limitations and personal contribution. [Report-ready section](nolan-middleware.md) and [preserved wording](evidence/nolan-2026-11-18/middleware-writeup.source.txt). Narrative receipt does not establish a new backend release, new fields, actual screenshots or frontend deployment.

At the earlier discovery stage the original rubric had not been located. The newly supplied Canvas screenshots now resolve this submission's rubric and displayed deadline. The full earlier base assignment and any instructions outside the supplied screenshots remain unverified; distinguish those from earlier project-brief requirements such as category/description and equivalent raw JSON.

## Requirement and evidence matrix

| Requirement | Local evidence / status | Final proof still needed |
| --- | --- | --- |
| Finished HTML/CSS/JavaScript frontend | Existing app upgraded; source and visual/functional evidence in [testing](testing.md) | Hosted website and final desktop/mobile screenshots |
| Show supported assets; search by name/ticker, case-insensitive; select details | Public directory returned eight records; updated local frontend rendered real BTC/ETH responses in Safari | Repeat name/ticker/case checks on the deployed updated frontend; keep demo and database catalogs distinct |
| Name, ticker, category, description | Adapter uses database values and exposes absent fields | Nolan/Alex return and populate missing required profile fields |
| Current USD price and 24-hour volume | Public BTC route returned numeric market fields and Coinbase Exchange source; local Safari BTC/ETH worked; stored prices never substitute | Confirm provider observation time and volume units, supported products, and hosted updated rendering |
| Loading, empty, error, unavailable/stale/sample states | Frontend implementation; current tests recorded separately | Repeat database/provider/rate-limit failure and recovery against hosted service |
| Responsive layout and keyboard access | Local visual/interaction checks recorded separately | Hosted desktop/mobile and keyboard check; record any remaining accessibility limits |
| Glossary and FAQ for public visitors | Added to frontend during this pass | Hosted help content visible and usable |
| Addition II: private app → database VPC networking | Alex supplies VPC/subnet/route/security-rule text and an app-side private query returning eight rows | Actual VPC/subnet/route-table/security-group association screenshots and individual-command provenance; retain teammate attribution |
| Addition VII: full network diagram | Alex supplied readable SVG/PNG/PDF assets, reviewed against his reported topology | Confirm diagram/resource associations and include the readable export with explanation; correct any mismatch rather than requesting a new generic diagram |
| Raw backend JSON | Public database/BTC routes directly checked; originals preserved and browser wrapper labeled | Confirm an equivalent profile-plus-market endpoint and compare it with deployed updated HTML; no combined remote endpoint tested yet |
| Three different EC2 instances | Authenticated Safari console confirmed three distinct running Ohio `t3.micro` instances with checks passed; IDs in [inspection](aws-inspection.md) | Final demonstration/evidence of roles and actual services; instance checks alone do not establish application health |
| Presentation → Flask → MariaDB | Public database route HTTP `200`; Alex's packet reports nginx → app:5000, Gunicorn service, MariaDB:3306, schema and successful private query with eight rows | Actual service/schema/private-path screenshots and command mapping; this assistant did not independently run server commands |
| Middleware explanation and contribution | Nolan's narrative received; edited report section preserves route separation, private query and connection-test distinction | Add actual middleware/query screenshots and dated captions; complete hashes/version remain outstanding |
| Flask → Coinbase | Public BTC market response returned Coinbase Exchange price/volume; local Safari BTC/ETH success and XMR unsupported-market partial profile | Provider time/unit/product metadata, full supported coverage, and hosted updated frontend demonstration |
| Safe frontend deployment | Local packaging and reversible release procedure | Exact target discovery, backup/rollback record, user approval, deployed release hash, post-deploy results |
| Shared Kiro project context | Crew 0.12.2 installed; repository agents/steering prepared; see [Kiro setup](kiro-setup.md) | Compatible Kiro IDE/CLI selection/validation remains unverified; AWS MCP is not connected |
| Clear team contributions | Ownership table below | Update with actual final work/evidence |

## Final demonstration sequence

Completed read-only checks:

- [x] Inspect the three distinct named Ohio EC2 instances in the user's actual Safari console; record instance IDs, running states, and checks.
- [x] Open the existing public website and directly check the database/BTC JSON routes, with sanitized response evidence.
- [x] Exercise the updated local frontend in Safari against real public API responses through a temporary local proxy: BTC/ETH success and XMR partial profile with no stored-price fallback.
- [x] Review Alex's infrastructure handoff text and readable diagram assets; retain sanitized evidence with teammate attribution and record missing screenshots/commands/full hashes.
- [x] Receive Nolan's middleware explanation/contribution and prepare a report section consistent with source/public evidence; keep screenshot, release and API-field gaps open.

Remaining final demonstration:

- [ ] Show three distinct running EC2 instances in Ohio and identify web, app, and database roles.
- [ ] Open the hosted frontend in API mode and show the real database catalog.
- [ ] Search a real database asset by ticker, then full name with different casing.
- [ ] Compare rendered name/profile/market values with the real JSON route; show sources, units, and observation/receipt times honestly.
- [ ] Demonstrate invalid/empty input and one controlled missing-data/provider-failure state without changing production records or infrastructure.
- [ ] Show the actual MariaDB table structure and returned asset records with sanitized evidence; confirm category/description fields or disclose the gap.
- [ ] Show the relevant application/web service status with sanitized output.
- [ ] Show glossary/FAQ, keyboard interaction, and a mobile viewport.
- [ ] Record the deployed frontend release hash, public website/API URLs, test time, backup path, and rollback procedure.
- [ ] Assemble one document with all four rubric sections, actual screenshots, communication explanations, and the two selected additions; submit by November 22 at 11:59 p.m.
- [ ] Confirm any additional base-assignment requirements outside the supplied Canvas screenshots; include genuine evidence only.

## Evidence inventory

| Evidence | Location / state |
| --- | --- |
| Local test commands, counts, limitations | [testing.md](testing.md), maintained from actual runs |
| Current local interface screenshots | `docs/screenshots/`; filenames and context described in testing record |
| Earlier controlled API screenshot | `docs/screenshots/backend-compatibility.jpg`; fixture evidence, not live AWS |
| Archive source review | [BACKEND-REVIEW.md](BACKEND-REVIEW.md), historical November 8 findings |
| Current access discovery | [aws-inspection.md](aws-inspection.md) |
| Existing public website/API URLs | [http://3.145.42.74/](http://3.145.42.74/), `/api/db/cryptos`, `/api/live/BTC`; successful read-only checks recorded in [inspection](aws-inspection.md). Updated frontend not deployed. |
| Observed database/market payloads | HTTP `200` public responses captured November 18; fields and limits in [API contract](api-contract.md). Alex separately supplied schema/private-query text, not independent execution by this assistant. |
| Three-instance inventory | Authenticated Safari console evidence and exact IDs in [inspection](aws-inspection.md); Alex's packet supplies attributed runtime service/document-root details |
| Alex's infrastructure/query/diagram handoff | [Review](alex-handoff-review.md) and sanitized `docs/evidence/alex-2026-11-18/`; text captures and SVG/PNG/PDF diagram, no actual screenshots or `evidence.sh` |
| Nolan's middleware narrative | [Report section](nolan-middleware.md) and [provided wording](evidence/nolan-2026-11-18/middleware-writeup.source.txt); written explanation/contribution received, no new code or screenshot evidence supplied |
| Prepared frontend release | `.artifacts/release/eti300w-frontend-api.tar.gz` and `eti300w-frontend-api.manifest.json`; local artifacts only, final hashes recorded after packaging |

## Contribution record and next handoff

| Owner | Work and remaining responsibility |
| --- | --- |
| Jake | Frontend design, search, accessibility, help content, adapter, local checks, raw JSON interface, release preparation. Verify deployed response mapping and hosted behavior after access/approval. |
| Nolan | Middleware explanation/contribution received, covering Flask routes, database queries and Coinbase integration. Still supply actual middleware evidence and complete deployed version/hash mapping, and coordinate the earlier brief's profile fields, equivalent JSON and market metadata. |
| Alex | AWS/EC2/network/database setup; console-verified instances plus supplied service/schema/private-query/network text and diagram assets. Supply actual screenshots, missing command/full-hash mapping, and verified backup/staging/rollback for the specifically approved frontend release. |

Local fixtures, real public API checks, authenticated EC2 inventory, Alex's supplied captures/diagram, and deployed updated-frontend verification are separate evidence. The first four have results; the updated frontend is not deployed. This assistant made no remote file, database, service, IAM, or security-group changes. Keep metadata, combined-endpoint, actual screenshot, command/full-hash, and approved-release gaps visible. Kiro remains outside the displayed grading requirements.
