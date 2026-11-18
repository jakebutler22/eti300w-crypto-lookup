# Alex - remaining evidence and release handoff

Your inventory, service/schema/query text, VPC explanation and diagram are received. Please return only the missing items using `RETURN_TO_JAKE/ALEX_REPLY.md`.

## Actual screenshots

Provide readable, dated captures from the actual cloud environment:

- Three named running EC2 instances in Ohio.
- Actual web/app/database service status (coordinate the app capture with Nolan).
- MariaDB schema and all 27 requested records now observed through the public API, labeled stored/sample prices; disclose any retained extra rows.
- App-side private database query, actual VPC/subnet/route-table associations, and security rules showing the permitted app-to-DB path.

Use instance/role context in captions and redact private addresses, credentials and unrelated details. The text captures are useful source material; do not screenshot them and label them a live console/terminal capture.

Confirm the existing diagram's resource placement and map its friendly security-group labels to the actual resource associations. Keep the current editable SVG and exports; no generic redraw is requested. Individual commands or the missing evidence.sh can help reproduce captures, but review any script before use; no destroy/cleanup script is needed.

## New backend and migration candidate

The SharePoint upgrade is received and included in `03-backend-candidate-REVIEW-ONLY/`. Read `BACKEND_CANDIDATE_REVIEW.md` with Nolan. Confirm the current production source/service environment, compare all changed routes and dependencies, and propose the exact application and optional database migration changes. The existing migration adds/populates category/description for the earlier eight assets; it does not implement the new 27-coin requirement or refresh market prices. Public checks begun at 22:10:18 UTC now show all 27 requested records with categories/descriptions and BTC/SHIB/POL market metadata. With Nolan, identify the actual deployed source and seed/migration/product map responsible, rather than running a duplicate extension. Preserve current data and report exact counts and any retained extra rows. Review descriptions, symbol uniqueness, required fields, transaction/backup behavior and rollback before approval. Do not modify or execute the included nine candidate source files as an implicit release.

Before **any** remote backup/staging/migration/install/restart, provide the protected code/database backup, validation and restore plan for specific approval. For any further approved changes, validate Python 3.9 compatibility and staged tests, then real pre/post-migration queries and web-origin responses. Supplied mocked tests do not prove MariaDB or AWS readiness. Do not treat the candidate README's sequencing as authorization.

Nolan must resolve the existing `/api/cryptos*` behavior changes. Jake must map/test the new metadata and combined response and rebuild the frontend. Coordinate the order of these releases; the attached frontend retains the current routes and is being finalized for optional returned metadata; combined JSON remains a separate contract.

## Candidate frontend release review

Target reported by your handoff:

- Region `us-east-2`; `coinbase-300w-web`, instance `i-07af2a856bd6c5a38`.
- Amazon Linux 2023 / nginx; root `/usr/share/nginx/html`; ordinary files root:root mode 644.
- Existing `/etc/nginx/default.d/crypto-api.conf` preserves `/api/` to app:5000. Preserve it.
- The candidate payload is only `01-web-release-API/` (36 runtime files), also in `release/eti300w-frontend-api.tar.gz` with its manifest. The rest of this team ZIP is not a web payload.

Before any remote write, confirm the current effective root/deployment method and provide the exact file list/hash, protected backup location, staging location, retained ownership/modes, and verified restore plan for Jake's approval. Sending this ZIP is not deployment authorization.

After specific approval, preserve the existing root's unrelated `api.html`, default pages, icons and symlinks. Static files generally need no nginx restart; the static frontend release itself requires no proxy/IAM/security-group/database/package change. The separate backend/schema candidate requires its own reviewed plan and approval. Directories need approved traversal permissions (normally 755), distinct from file mode 644.

Do not use the earlier delete-first rollback. Validate the backup and restoration in a separate location before replacing live files; restore the approved file set or existing release pointer without first deleting the entire root. No remote backup/staging/upload should occur before approval.

After the approved release, return public URL, deployed release hash/test time and acceptance results for the new interface, 27-target directory, current supported versus Awaiting backend support states, BTC/Bitcoin, ETH/Ethereum, JSON under Specifications, selected-asset 30-second refresh and session chart. XMR must stay excluded from selections while original raw JSON remains intact. Verify every target name/ticker against the current 27-row response and explicit provider availability; missing market values must not use stored samples. Jake will perform the final frontend/keyboard/responsive checks and assemble the report.

## Latest website check

On November 18, the hosted core frontend matched the all-coin release and all 27 live routes worked through the adapter. The public `assets/coins/btc.svg` and `assets/coins/fil.svg` paths returned 404. Include the entire `assets/coins/` folder (27 SVGs plus license) from the 36-file archive when reviewing the next deployment; preserve the nested paths. The newer local-file recovery view is included in this updated archive.
