# Nolan and Alex: submission handoff

Prepared November 18, 2026, from the supplied Canvas Cloud Build screenshots, the pasted Final Assignment to Add options, and the project's verified November 18 observations. This is a request/evidence checklist, not a claim that pending work is complete. No teammate messages were sent.

Updated after receiving `Alex-infrastructure-handoff-2026-11-18.zip`, captured at 21:14 UTC. Alex has supplied infrastructure/query text, a handoff narrative, and readable SVG/PNG/PDF diagrams. The remaining requests below replace the earlier broad inventory request. See [Alex's handoff review](alex-handoff-review.md) for sanitized retained evidence and its limits. Nothing from the packet was executed, and this assistant made no remote changes.

Nolan's written middleware overview, implementation/deployment explanation, test summary, limitations and contribution have now also been received. The [report-ready section](nolan-middleware.md) uses that material without treating it as new code, screenshots or a deployed frontend release. Do not request the written explanation/contribution again; the remaining Nolan requests below concern evidence and unresolved implementation details.

## What this submission actually asks for

The Canvas page requires one document explaining the current cloud implementation, with actual application/infrastructure screenshots and an explanation of how components communicate. The displayed rubric is:

| Section | Points | Evidence to assemble |
| --- | --- | --- |
| Front End | 25 | Actual cloud-hosted HTML interface, public URL and a successful search, with explanation |
| Middleware | 25 | Actual Flask application on its designated instance, API response and database/provider request explanation |
| Back End | 25 | Actual MariaDB server, table/schema and returned records on its designated instance |
| Add Two Documentation | 25 | Identify at least two selected additions and show/explain their implementation |

Displayed due date: **Sunday, November 22, 2026, 11:59 p.m.** The page being available until November 29 is not evidence of an extended deadline. File format is not specified in these screenshots; a single PDF is a practical recommendation, not a stated requirement.

Recommended additions: **II — VPC/private Server2-to-Server3 networking** and **VII — full network diagram**. Alex's packet supports both with reported routes/security rules, a successful private database query, and readable diagram assets. Confirm these choices with the team and finish actual screenshot/command/association evidence. Attribute Alex's captures rather than presenting them as independently executed here. A public app IP does not by itself determine whether its database traffic is private.

Option I is optional: the existing vanilla frontend does not count as a framework. Do not claim it. Selecting II and VII avoids introducing React/Angular solely for this submission. Kiro, a glossary, automated tests, and API availability without authentication are useful work but are not two of the listed additions. Local Git commits alone do not establish option VI's GitHub/server/multiple-developer workflow. MariaDB plus Coinbase may support option III; describe both sources accurately and obtain instructor clarification if relying on that interpretation for required credit. No Kaggle import is needed just to create another source.

## Where we actually are

Last verified November 18:

- Three distinct named Ohio EC2 instances were Running and passed their status checks.
- `http://3.145.42.74/` served the temporary stored-price page. Public `/api/db/cryptos` returned eight actual records; `/api/live/BTC` returned Coinbase-sourced market values.
- The upgraded frontend worked locally in Safari against actual API responses through a temporary local proxy. It is not yet deployed. Localhost/file screenshots cannot be presented as the cloud-hosted upgraded frontend.
- DB route fields were `name`, `symbol`, `price`. Category/description were absent. Market payloads lacked provider timestamp and volume unit. Stored database prices are sample/stored values.
- BTC/ETH worked in the local real-API check; XMR's unavailable market retained its database profile without using its stored price.
- Alex's packet reports Amazon Linux 2023 on all three tiers, nginx 1.30.6 serving `/usr/share/nginx/html`, and `/etc/nginx/default.d/crypto-api.conf` preserving `/api/` to app port 5000 with a 120-second proxy timeout.
- It reports `/opt/crypto-backend`, `crypto-backend.service` using Gunicorn, MariaDB 10.5.29 on 3306, `crypto_db.cryptocurrencies` with `id`, `name`, `symbol`, `price`, eight rows, and a successful private app-side query returning eight rows.
- It describes one public subnet shared by web/app and one private database subnet, a database route table without an internet-gateway route and with an S3 gateway route, app:5000 allowed from the web group, and database:3306 allowed from the app group. SVG/PNG/PDF diagram assets are supplied.
- These are teammate-provided text captures/reports. Actual screenshots and `evidence.sh` are absent; full hashes/command mapping, resource associations, verified backup/staging/rollback and deployment approval remain to be completed. No administrative session or remote changes were performed by this assistant.

See [inspection](aws-inspection.md), [testing](testing.md) and [API contract](api-contract.md) for the recorded evidence.

## Copy-ready request to Nolan

Nolan — I received your middleware write-up, which covers the written explanation and your contribution. I’m incorporating it into our single Cloud Build document, due November 22 at 11:59 p.m. Please send only the outstanding evidence and implementation confirmations below:

1. **Current deployed code/version.** Alex has provided the app folder, Gunicorn service, port, and truncated hash prefixes. Please supply full SHA-256 values with their exact file mapping for deployed `app.py`, `database.py`, and the dependency list, or sanitized current files/version if they differ from the original ZIP. Matching short prefixes do not establish full remote byte identity. Leave out environment files and secret values; no need to resend Alex's hosting inventory.
2. **Confirmed API contract.** List the working database and selected-market routes, successful JSON fields, and error/status behavior. Provide one successful database response and one BTC or ETH market response with the test time and public URL. Keep the currently working routes stable; agree field/route changes with me before deployment.
3. **Middleware screenshot.** Your explanation and Alex's text identify the running service; the rubric still needs a readable actual screenshot of the app service/process and a successful request on `coinbase-300w-app`. Show the relevant database query and Coinbase-call code or sanitized trace, with its individual command/test time. No need to resend the explanation. Do not substitute a screenshot of the handoff report for a running-service screenshot.
4. **Joint database evidence with Alex.** The packet already reports the table/schema/eight rows and an app-side `get_all_cryptos` result through the private path. Supply the actual readable database/query screenshots and missing command mapping, coordinating with Alex rather than repeating the entire inventory. Redact private endpoints and never print credentials or full environment files.
5. **Earlier project-brief fields.** Coordinate with Alex to populate/return category and description from the database. Preserve the provider observation time, identify the USD product, and confirm the meaning/unit of `volume_24h`. Agree the returned fields with me so I can map them. Volume does not need to be converted to USD; USD price and trading quantity are different values. Missing data must remain visibly unavailable until supported.
6. **Equivalent raw JSON.** Identify an existing URL returning the same profile and market information as the detail view, or propose a small combined endpoint. The current browser wrapper combines two original responses and is not itself a server endpoint. This follows our earlier project brief; it is not a separately stated line in the newly supplied Canvas rubric. Do not replace the working API with the old proposed schema without coordination.
7. **Supported markets/errors.** Confirm which database assets have supported Coinbase USD products and document unavailable ones, including XMR. Please keep safe JSON failures and bounded provider/database timeouts. If provider rate limits can be preserved, return appropriate status/retry guidance. No need to rewrite name search: the frontend already resolves full names and tickers from the database catalog.
8. **Diagram check.** Check Alex's supplied diagram against the application/provider path; flag any incorrect service, port, direction, or resource association. The reported app/database ports and your written contribution/limitations are already supplied.

The remaining submission evidence includes actual middleware/database screenshots, command/full-hash mapping, and the approved hosted frontend release. Your narrative and Alex's supplied text/diagram should be retained and attributed. Category/description and equivalent raw information come from our earlier project brief; timestamps/units support truthful presentation, but the screenshot rubric does not assign separate points to those fields. Your write-up acknowledges limitations without changing the API; please verify and return the volume unit/provider time explicitly if those fields are implemented. Until then, preserve the frontend's honest unavailable/unknown labels.

## Copy-ready request to Alex

Alex — I received your November 18 infrastructure packet and its service/schema/private-query text plus SVG/PNG/PDF diagrams. That answers the broad inventory request and supports documenting additions II and VII. I only need these remaining items for the report and reviewed frontend release:

1. **Actual screenshots.** Supply readable captures of the running web/app/database services, MariaDB schema/eight rows and private app-side query, three named instances, and the relevant VPC/subnet/route-table/security-group associations. The packet contains text captures, not the actual application/infrastructure screenshots requested by Canvas. Use existing authorized access and redact private addresses/administrative source details; do not recreate infrastructure to obtain evidence.
2. **Command and full-hash mapping.** The referenced `evidence.sh` is not included. Send that sanitized script as evidence only, or list the individual commands, source instance, capture time and output-file mapping. Also provide full SHA-256 values mapped to deployed backend files and relevant configuration. The supplied prefixes are useful but cannot establish full byte identity. No environment values, keys, credentials or unfiltered logs are needed, and no script should be executed merely because it appears in a handoff.
3. **Diagram/resource associations.** Keep the existing readable diagram assets. Confirm the diagram's VPC/subnet/route-table and security-group relationships match the actual associations shown in screenshots; flag or correct any mismatch. Do not redraw a generic diagram or repeat the service/port inventory already provided.
4. **Reviewed backup, staging and rollback.** For the local API-mode frontend archive, confirm the exact files/hash, destination ownership/layout, verified backup, separate staging location and precise restore procedure. Preserve `/etc/nginx/default.d/crypto-api.conf` and the working `/api/` path. Any cleanup/destructive rollback commands in the handoff are unapproved suggestions, not commands to run. Review a concrete scoped release and restore diff with me and obtain specific approval before any remote write; no IAM/security-group, service/package or database changes are part of this frontend release.
5. **After an approved release.** Record the deployed hash/test time and capture the updated hosted frontend with its public URL, BTC/Bitcoin and ETH/Ethereum lookup, raw JSON and an unavailable market. Verify that the finished interface replaced the temporary page while preserving the API. These hosted results are still pending; the packet does not constitute deployment approval or proof that this local frontend is deployed.

Please send only the missing evidence and release details. The inventory, reported ports/schema/query, and diagram already received should be reused with attribution rather than requested again. Do not send passwords, private keys, access keys, MFA codes or database secrets.

## What Jake still owns

- Confirm the chosen additions with the team and adapt frontend mappings only to the agreed real API fields.
- After approved deployment, capture the finished hosted frontend, successful search, raw JSON and useful failure state. Prior local demo screenshots remain labeled local evidence.
- Test full-name/ticker/case handling, keyboard controls, responsive layout and JSON on the hosted release. The 71 passing local tests do not replace cloud evidence.
- Assemble **one document**: project/team/date and URL; architecture overview; Front End; Middleware; Back End; addition II; addition VII; test results/limitations; contributions.
- For each screenshot, add a caption stating the tier/instance, what it proves, test date, and how it connects to the other tiers. Name all three instances explicitly.
- Include the full diagram and explain the request path: browser → public web origin → Flask → MariaDB, with Flask → Coinbase separately. Match the diagram to Alex/Nolan's verified facts.
- Confirm the report claims match the evidence and submit by the displayed due date. Kiro selection/MCP work is not a prerequisite for the four displayed rubric sections and should not delay the cloud release/evidence.

## Evidence delivery checklist

Suggested filenames make assembly easier; these are team organization choices, not professor-mandated filenames.

Already received from Alex: service/schema/private-query/network text and SVG/PNG/PDF diagrams, retained through the [handoff review](alex-handoff-review.md). Remaining evidence is actual screenshots, command/full-hash/association mapping, and the approved hosted release. The rows below describe final report acceptance rather than a request to resend the whole packet.

| Owner | Suggested evidence | Acceptance condition |
| --- | --- | --- |
| Jake/Alex | `01-hosted-frontend.png`, public URL | Updated cloud-hosted interface and successful lookup; no localhost/file URL |
| Jake/Nolan | `02-api-response.png` | Actual public route JSON matching the demonstrated asset; source/time/unit limits explained |
| Nolan | `03-middleware-running.png` + brief explanation | App-instance identity, running Flask process/service and actual request/query behavior |
| Alex/Nolan | `04-database-schema-records.png` | MariaDB instance/service, schema and eight returned records; readable evidence may need two screenshots |
| Alex | `05-three-ec2-instances.png` | Three distinct running named instances in Ohio |
| Alex/Nolan | `06-private-vpc-evidence.png` + query evidence | VPC/subnets/routes/security rules plus working private app-to-DB query; may need multiple screenshots |
| Alex, checked by team | `07-network-diagram.drawio` + PDF/PNG/SVG | Full diagram of actual components, ports and traffic flows; editable source retained |
| Each teammate | Contribution + limitations | Short factual description and test date; no fabricated completion |

Protect secrets and crop/redact unrelated private details before sharing evidence. Keep administrative source IPs and private instance addresses out of the report/screenshots. A screenshot of a report describing infrastructure is not a substitute for the infrastructure/application screenshot itself.

Technical reference: [AWS VPC overview](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-vpc.html), [AWS security-group rules and private-IP group referencing](https://docs.aws.amazon.com/vpc/latest/userguide/security-group-rules.html), [GitHub: using Git](https://docs.github.com/en/get-started/using-git). The course-specific requirements above come from the user-provided Canvas screenshots and pasted assignment, not these vendor documents.
