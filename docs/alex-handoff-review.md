# Alex infrastructure handoff review

Reviewed November 18, 2026. Source: `Alex-infrastructure-handoff-2026-11-18.zip`, SHA-256 `527a4ac369f04fba61c6e836012e731595aada7abf94c6899ad4ed5c20aeb679`. Alex labels captures `2026-11-18 21:14 UTC` (4:14 p.m. Eastern).

The original ZIP was inspected as data. Its commands were not executed. No AWS login, administrative connection, deployment, service change or database change was performed during this review. The original archive remains unchanged. [Saved evidence](evidence/alex-2026-11-18/README.md) records provenance; internal addresses/ranges are redacted in the repository text copies.

## What is now supplied

| Item | Evidence received | Status / limits |
| --- | --- | --- |
| Three distinct EC2 tiers | `01-instances.txt`; same names/IDs as our earlier direct console check | Alex-supplied capture corroborates the prior inventory |
| VPC/private app-to-DB path | `02-network.txt`, `05-query.txt`, `06-db.txt` | Subnet/route/security-group descriptions and a reported private `get_all_cryptos()` query returning eight records support addition II; actual screenshots and explicit resource associations still needed |
| Running OS/services | `03-web.txt`, `04-app.txt`, `06-db.txt` | Alex reports Amazon Linux 2023 on all tiers, nginx 1.30.6, Gunicorn/Flask and MariaDB 10.5.29; these internal checks were not independently re-run by Codex |
| Deployment paths | `03-web.txt` and handoff narrative | Web root `/usr/share/nginx/html`; proxy `/etc/nginx/default.d/crypto-api.conf`; app `/opt/crypto-backend`; service `crypto-backend.service` |
| Backend correspondence | Three truncated hashes in `04-app.txt` | All prefixes match the original ZIP's full hashes computed locally. Obtain complete deployed hashes to verify byte identity; prefix matching alone is insufficient |
| Database schema | `06-db.txt` | `crypto_db.cryptocurrencies`, `id`, `name`, `symbol`, `price`, eight rows; no category/description; prices explicitly stored/sample |
| Full network diagram | Unchanged SVG, PNG and one-page PDF | Visually inspected PNG and rendered PDF: readable, no clipping seen, includes three tiers, subnets, traffic/ports, Coinbase, gateway, S3 and administrative path. Supports addition VII; Alex should confirm resource placement/alias mapping |
| Infrastructure narrative/contribution | Handoff Markdown | Useful draft for the single report; reconcile claims with actual screenshots and team contributions |
| Deployment procedure | Handoff Markdown | Preparation only. Approval order, directory modes and delete-first rollback require correction before use |

The reported gateway preserves `/api/`, forwards to app port 5000, and has a 120-second read timeout. The app/database path uses port 3306. The frontend can retain same-origin `/api` configuration and its existing adapter. The packet does not call for changing the gateway, rebuilding the VPC or migrating the frontend framework.

## What still needs Alex

1. **Actual screenshots.** The ZIP has six `.txt` captures, not actual console/terminal screenshots. Get genuine screenshots of the three EC2 instances, running middleware, MariaDB schema/records, and VPC/private-path evidence for the single Cloud Build document. Do not turn a text file into a screenshot and label it a live terminal capture.
2. **Reproducible capture details.** The handoff references an `infra` folder and `evidence.sh`, neither of which is included. Request the script or exact individual commands for review before using them. No need to obtain or run `destroy.sh`.
3. **Resource associations.** Obtain the app/DB subnet IDs, their actual route-table associations, and security-group IDs/rule evidence. The text and diagram use friendly `web-sg`, `app-sg`, `db-sg` labels; map them to actual resources. Confirm Instance Connect Endpoint placement and outbound rules shown in the diagram.
4. **Full deployed file hashes.** Ask for the complete SHA-256 values of the three backend files and current release identity. The handoff's service user, worker count, timeout and credential-file mode are narrative claims not fully shown by the captured unit/status output; a sanitized service/config excerpt can corroborate them without printing environment values.
5. **Approved frontend release.** Review the eight-file package/hash and existing document root, obtain specific authorization before any remote backup/write, back up and validate the existing files, stage the new release, preserve the gateway, and record hosted acceptance/rollback evidence.

## What still needs Nolan

- Confirm the deployed contract/version and any changes being proposed; preserve the currently working DB/live routes.
- Coordinate database category/description with Alex if completing the earlier frontend brief's full profile fields.
- Preserve the provider observation time and return explicit verified volume units/product identity. Alex describes base-currency volume, but the public API still has no unit field. The frontend must not infer a new field solely from this narrative. [Coinbase ticker documentation](https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-ticker) exposes a provider `time` that the supplied backend currently drops.
- Identify or provide the equivalent profile-plus-market raw JSON route requested by the earlier project brief. The Canvas screenshots do not separately mandate a combined route.
- Provide a short middleware/database/provider explanation and actual middleware evidence, coordinating screenshots already being gathered by Alex. XMR's unsupported market should remain an honest unavailable state.

## Corrections before reusing the handoff verbatim

- **Approval must precede remote backup creation.** Alex's sequence creates a backup before its approval step. Our user instructions gate all remote writes, including backup creation.
- **Do not use the delete-first rollback.** The proposed command removes the live document-root contents before validating a restoration. It can destroy a working release, and `*` misses hidden entries. Prepare/verify restoration outside the live root and restore the explicitly approved file set or existing release pointer. Do not apply the packet's recursive-delete command.
- **Directories need traversal permissions.** Mode 644 is suitable for ordinary static files under the reported ownership convention, not directories. The release's `data/` directory must retain the server's approved traversable mode (normally 755). Preserve existing ownership/modes and unrelated default pages, `api.html`, icons and symlinks.
- **A failed Coinbase request is not proof of every network property.** The private route table, security groups, no-public-IP status and successful private query together are stronger evidence. Describe the DB as not directly reachable from the public internet; do not claim private placement eliminates every possible access path or makes security-group rules irrelevant.
- **S3 gateway placement/routing.** A gateway endpoint is a VPC route-table target, not a server installed inside one subnet. Confirm the diagram's schematic placement and label the private route-table association. Its existence supports S3 access; package repository access itself still needs its own evidence if claimed. See [AWS gateway endpoint routing](https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html).
- **Keep estimates and scope factual.** HTTP-only hosting, one Availability Zone, and absent automated database backups are acknowledged limitations, not implemented SSL/high-availability additions. Omit unverified current cost estimates or mark them as Alex's dated estimate. Do not create new resources for this review.

## Submission impact

**II (VPC) and VII (full network diagram) remain the recommended two additions.** The packet supplies substantial supporting material for both. The primary remaining submission work is genuine cloud evidence, deployment of the updated frontend, the agreed Nolan API/profile work, and assembly into one document. The last independently checked public website was still the temporary page; deployment of the new frontend is not established by this archive.

The existing release remains prepared at `.artifacts/release/eti300w-frontend-api.tar.gz`, with SHA-256 `20c27ebc022beb87a8c22d4e0bbe14891b46cb43fcb357e48028591ce4777622`. No runtime source changed during this review. Use [deployment](aws-deployment.md), [submission checklist](submission-checklist.md) and [teammate handoff](teammate-handoff.md) for the updated next steps.
