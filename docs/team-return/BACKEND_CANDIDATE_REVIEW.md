# New backend candidate - review only

Downloaded through the supplied SharePoint link in actual Safari on November 18, 2026. Safari made the extracted `eti300w-backend-upgrade` folder available locally. The team ZIP includes an unchanged copy of its nine files for review, with file hashes in `reference/backend-candidate-provenance.json`. There is no original ZIP-byte hash because the browser provided an extracted folder.

**This is source review, not execution, deployment approval or proof of live behavior.** Candidate tests were not run in this packaging task. No production code, schema, environment or service was changed. The frontend's 94 passing tests cover the current frontend, not the new backend implementation.

## Useful proposed work

The source preserves the current frontend's catalog/live paths and adds optional profile fields, a repeatable MariaDB migration, explicit base-asset volume units, quote/product identity, provider last-trade time and separate retrieval time. It adds combined profile/market endpoints and retains a profile with a null market on failure. These changes address several earlier-brief gaps if reviewed, integrated and verified.

## New 27-coin scope

`REQUESTED_CATALOG.csv` now defines the exact website target. This unchanged candidate still addresses the earlier eight assets, including XMR. Subsequent public checks begun at 22:10:18 UTC return all 27 with categories/descriptions and successful BTC/SHIB/POL market metadata. Nolan and Alex should identify the actual deployed source, database seed/migration and product map; do not rerun an extension just because this older candidate has eight assets. Preserve existing data, disclose unsupported markets and do not delete XMR solely for the UI change. In the frontend, all 27 targets are listed, missing database targets await backend support, and Monero is excluded from selections without changing raw payloads.

## Review before release

- **Existing route behavior changes.** Original `/api/cryptos` and `/api/cryptos/<symbol>` returned market price/volume. Candidate aliases instead return stored database profiles/sample prices. The candidate README calls them additions, but those paths already existed. Nolan should preserve prior semantics or agree/document the breaking change against actual deployed consumers.
- **Frontend mapping remains.** `nolan-v1` accepts catalog category/description; optional market metadata mapping is now being completed for the newly observed fields. The new combined shape is incompatible with the older `combined-v1` shape. Jake must implement and test an explicit mapping, then issue a newly hashed release.
- **Retry semantics need agreement.** Live provider rate limits become HTTP 503 + optional Retry-After. The frontend applies cooldown for HTTP 429 and explicit HTTP 503 retry metadata. Combined market failures return HTTP 200 and omit upstream status/retry details. Coordinate the contract so the UI can handle these honestly.
- **Deployment and migration remain separate.** Null category/description before migration is expected. Confirm Python 3.9/pinned dependency compatibility in a separate approved staging environment, compare original/deployed behavior, and test real MariaDB queries before claiming the upgrade complete.

The supplied `README_FOR_ALEX.md` is teammate source material, not an authorized deployment procedure. This package's approval boundary takes precedence: present the exact code/schema/file changes, backup, validation and rollback for Jake's approval **before any remote backup, staging, upload, migration, install or restart**. Never execute a migration merely because it appears in this ZIP.

Follow `NOLAN_REQUEST.md`, `ALEX_REQUEST.md` and the reply templates for the remaining handoff. The backend candidate folder does not belong in the public web root.
