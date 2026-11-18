# Nolan reply to Jake

Returned on:
Preferred contact/availability:
Use **done / planned / blocked** for each item. For pending items give owner + next step + ETA. A narrative alone does not mark code/evidence implemented.

## Current API

- Current deployed version / full file hashes (or unknown):
- Confirmed catalog route and response:
- Confirmed selected-market route and response:
- Actual success/error JSON examples attached under api-examples/:
- For each example: public path, status, capture time, product:
- Unsupported markets / errors:

## Current 27-coin catalog confirmation

Public checks begun at 22:10:18 UTC returned all 27 with categories/descriptions and BTC/SHIB/POL market metadata. Confirm provenance and remaining coverage; a duplicate catalog extension is not requested.

- REQUESTED_CATALOG.csv reviewed against actual database and backend whitelist:
- Current returned symbols/count; retained extra records:
- Actual deployed seed/migration and category/description content provenance:
- Actual whitelist and verified USD product mapping for all 27 symbols:
- Unsupported/unavailable products and explicit API behavior:
- No stored sample-price substitution; no destructive XMR deletion:
- Actual schema/query counts and deployed source version/full hashes:
- Any further proposed changes, compatibility, validation and rollback plan:
- Sanitized changed-file proposal attached (unchanged nine-file candidate need not be resent):

## Candidate review

- New upgrade accepted / corrections needed / not yet reviewed:
- Compared with original and actual deployed source? Result:
- Existing /api/cryptos* market behavior preserved, or agreed breaking change/consumers:
- Agreed metadata and combined JSON contract:
- HTTP 429/503, combined failure status/retry contract:
- Provider timestamp validation/nullable behavior:
- Local test command/result and Python/dependency compatibility:
- Real MariaDB/migration test evidence (separate from mocked tests):

## Earlier-brief data gaps

| Item | Status | Agreed field/route, evidence or plan | Owner / ETA |
| --- | --- | --- | --- |
| DB category/description | | | |
| Provider observation time | | | |
| Volume meaning/unit and product identity | | | |
| Equivalent profile + market raw JSON | | | |

The frontend now refreshes only the selected quote every 30 seconds while visible and charts received session prices; JSON is under Specifications. Confirm the backend supports this cadence and exposes retry information.

The public BTC/SHIB/POL responses now include provider_timestamp/retrieved_at, volume units and product/currency identity. Confirm their semantics and deployed source identity. The candidate also proposes /api/assets or /api/raw; those combined routes still need contract verification and explicit frontend mapping. Keep missing fields unknown and disclose the remaining scope gap.

## Proposed backend changes

- Changes since the received upgrade (do not resend unchanged files):
- Changed sanitized files attached under changed-backend-files/:
- Dependency or migration/content proposal:
- Expected JSON example and compatibility with existing routes:
- Needed frontend mapping changes for Jake:
- Remote approval/change status (proposal is not deployment approval):

## Evidence

- Actual running middleware + request screenshot filename/time:
- Actual app-to-DB query screenshot filename/time (coordinate Alex):
- Diagram application/provider flow confirmed or corrections:

Your written explanation/contribution is already received. Do not include .env, passwords, keys, MFA codes, credentials or private addresses.
