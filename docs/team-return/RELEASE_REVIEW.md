# Candidate frontend release - review before deployment

This is the Explore redesign API release built November 18, 2026 at 22:56:08 UTC. It retains the current-route API contract. It has not been verified deployed. Latest public checks begun at 22:10:18 UTC now return the 27-target catalog with category/description and BTC/SHIB/POL market metadata. The frontend validates and maps the optional fields; the separate combined JSON contract still requires explicit integration. Unknown fields remain unknown when absent. The received backend candidate is not proof of the current deployed source version.

API archive SHA-256:
`cfea2a1f76bf4ff6f11952c27795b72a6bf73da7cbe9b3da872813fb5ea04b93`

`release/eti300w-frontend-api.manifest.json` records every runtime file hash. `01-web-release-API/` is extracted from that archive without changing its bytes.

## Exact web payload

- `index.html` - replaces temporary page after backup/review
- `style.css` - replaces existing stylesheet after backup/review
- `script.js`
- `api.js`
- `config.js` - mode `api`, contract `nolan-v1`, same-origin `/api`
- `data-state.js`
- `data/demo-assets.js` - required module asset; fixtures are only used in explicit demo mode
- `favicon.svg`
- `assets/coins/*.svg` - all 27 local coin logos
- `assets/coins/LICENSE.txt` - required logo license

Confirm what already exists before labeling files new. Deploy only these approved paths. Preserve unrelated files and the gateway configuration. `02-local-preview-DEMO/` differs only in its mode configuration and is for local sample previews; it is not the candidate API deployment.

Do not point the old `combined-v1` setting at the candidate `/api/assets/<symbol>` route: their schemas and URL patterns differ. The frontend recognizes explicit HTTP 503 retry metadata; agree and test the backend combined-route error contract separately. See `BACKEND_CANDIDATE_REVIEW.md`.

The frontend has passed 122 local automated checks. These do not establish backend candidate readiness or hosted verification.

## Acceptance after specific deployment approval

- [ ] All 27 coin logos load from local `assets/coins/` files and every supported row automatically receives price/volume; no click is required to fetch a row.
- [ ] Updated interface loads from the confirmed public web URL; JavaScript/CSS imports succeed.
- [ ] Both modes show the exact 27-target list from REQUESTED_CATALOG.csv. Demo values are clearly simulated. API rows distinguish returned database records from Awaiting backend support targets and never send speculative market requests.
- [ ] Current public baseline is confirmed: all 27 requested targets with category/description. Any retained extra database records are disclosed. Missing target rows, if encountered, remain Awaiting backend support; local metadata never silently fills missing API fields.
- [ ] BTC and full-name Bitcoin resolve; ETH and mixed-case Ethereum resolve.
- [ ] Displayed market price comes from market JSON, not stored database sample price.
- [ ] Missing fields, observation time and volume units remain unavailable/unknown unless the agreed backend and frontend mapping supply them.
- [ ] XMR/Monero is excluded from website selections/search without changing original raw JSON or deleting database rows. Supported-profile market failures still show unavailable values.
- [ ] Empty/unknown searches, loading and errors remain useful. Initial page load requests every supported quote; automatic full-catalog refresh occurs 30 seconds after each batch finishes while visible, respects cancellation/in-flight requests/cooldown/rate limits and pauses when hidden.
- [ ] Session chart uses received prices and browser receipt times only; samples stay explicitly simulated, missing values stay absent, and no historical path or provider timestamp is invented.
- [ ] Specifications contains the JSON action. It preserves original responses, links to actual endpoints, explains browser assembly and works with keyboard/Escape.
- [ ] Actual mobile/narrow layout and keyboard checks are recorded.
- [ ] Public route/HTML comparison and any agreed equivalent JSON route are recorded with test time.
- [ ] Backup/restore validation, release hash and actual hosted screenshots are retained for the single report.

The existing working same-origin routes should remain intact. No deployment commands or authority to change infrastructure are included in this package.
