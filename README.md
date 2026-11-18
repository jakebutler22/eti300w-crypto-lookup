# Explore cryptocurrency

A cryptocurrency explorer with a searchable 27-asset catalog, a browser-local watchlist, automatic quote refresh and session price charts. Built with HTML, CSS and vanilla JavaScript; no frontend build or API key is required.

The page title is Explore cryptocurrency. Navigation follows the section order: Explore, Data sources, Learn. Secondary taglines, source badges and routine status bars have been removed.

The interface takes visual inspiration from [Coinbase Explore](https://www.coinbase.com/explore), using its own branding and implementation. Course/project footnotes have been removed from the visitor interface. Production pages describe the actual database/API sources and contain no sample-data boilerplate.

## Current state · November 18, 2026

The [public cryptocurrency website](http://3.145.42.74/) was observed serving the redesigned interface and `mode: "api"` on November 18 at 5:22 p.m. Eastern. The team deployed that version; this assistant made no AWS writes. This subsequent copy cleanup is a new GitHub/release update and needs hosted byte verification after deployment.

At approximately 22:12 UTC, read-only checks of `/api/db/cryptos` returned all 27 requested coins, names, categories and descriptions. Every `/api/live/<symbol>` request returned HTTP 200 during that check, including SHIB and POL. Market responses now include product identity, USD quote currency, provider observation time and volume units. This verifies public response behavior at that time, not remote source-file identity, backend test completion or future availability. See the [recorded results](docs/evidence/api-2026-11-18-catalog-verification.json).

The supplied backend candidate remains unchanged under [handoff/backend-candidate](handoff/backend-candidate/). Its exact relationship to the newly observed deployment still needs Nolan/Alex's version and full-hash confirmation. No migration or AWS write was performed here.

## Use the explorer

- Search by full name or ticker, filter a local watchlist, and sort the catalog by name.
- Every supported asset loads its market price and 24-hour volume automatically on page load. A full refresh starts 30 seconds after the previous batch completes while the tab is visible. Up to three paced requests run at once; hidden tabs and API retry guidance pause work.
- Price charts retain successful quotes for every asset during this visit, up to 120 per asset. A first quote is a dot; subsequent quotes create a line. Times indicate browser receipt, while provider time independently determines freshness.
- Demo mode uses clearly labeled fixed examples; its chart stays flat. Database stored prices never fill missing market prices.
- Open **Specifications → View JSON response** for original payloads and endpoint links. The current view assembles database and market responses in the browser.
- All 27 requested assets are present; Monero and USDC are excluded. If a target asset is absent from the database response, its row says Awaiting API and sends no market request.

## Run locally

```sh
npm run serve
```

Open [localhost:8000](http://127.0.0.1:8000). Stop with Ctrl+C. JavaScript modules require HTTP; opening `index.html` directly is unsupported.

If prices, volume and the asset overview are all blank, check the address first. A `file:///…/index.html` address bypasses the web server and blocks module loading; the file now shows a recovery link instead of an endless loading state. Use the [live website](http://3.145.42.74/) or the local server above. A plain static server does not supply the `/api` proxy. If Safari still shows an older page after a deployment, press Option–Command–R to reload from the origin.

`config.js` defaults to **api**. The local preview serves the allowlisted runtime files and forwards only GET catalog/market routes to the observed public API. `npm run serve:demo` is an explicit offline fixture preview; it keeps truthful fixture labels. API mode uses the same-origin `/api/db/cryptos` and `/api/live/<symbol>` routes through the existing web-tier proxy. A static local server alone does not provide those API routes. Credentials and private endpoints do not belong in frontend configuration.

```sh
npm test
python3 scripts/package_frontend.py --mode api
```

All 122 automated checks pass with `npm test`. The release command writes a 36-file archive and SHA-256 manifest to `.artifacts/release/`; it does not deploy. Use [releases/explore-2026-11-18](releases/explore-2026-11-18/) for the reviewed API/demo archives and team handoff ZIP. The deployment contains 36 runtime files: eight application files, 27 local SVG coin logos, and their license. Preserve the `assets/coins/` directory structure in the web root.

## Documentation and team handoff

[Interface changes](docs/explore-redesign.md) · [Testing](docs/testing.md) · [API contract](docs/api-contract.md) · [Architecture](docs/architecture.md) · [AWS deployment review](docs/aws-deployment.md) · [Submission checklist](docs/submission-checklist.md)

[Team reply templates and requests](docs/team-return/) identify the remaining evidence, release review and contribution work. Jake owns the frontend; Nolan owns Flask, database queries and provider integration; Alex owns infrastructure and database deployment. Actual hosted frontend verification, cloud screenshots and the final single submission document still need completion. Earlier infrastructure material and source reports retain their dates and attribution.

All 27 coins use local SVG logos. Quote updates retain the same row/image nodes; failed image URLs stay as readable ticker fallbacks for the rest of that visit instead of being retried on every quote. The full `assets/coins/` folder must be deployed with the application. [Logo provenance and license](docs/coin-logo-sources.md) records the pinned source; no image CDN is needed at runtime.
