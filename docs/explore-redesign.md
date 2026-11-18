# Explore redesign - November 18, 2026

Reference: [Coinbase Explore](https://www.coinbase.com/explore), inspected in the user's actual Safari. The implementation uses this project's own branding, HTML, CSS and vanilla JavaScript.

## Changes

- Centered Explore/search layout, restrained white/black/blue palette, thin rules, round search/filter controls, asset glyphs and an asset table beside the selected-asset overview.
- Browser-local persistent watchlist with an in-memory fallback, All/Watchlist filtering, name sorting, search clear/reset and useful empty states.
- Semantic table, native sort control with `aria-sort`, asset-specific watch/lookup buttons, keyboard focus preservation, existing JSON modal and reduced-motion support.
- Responsive table: asset/watch/price remain visible; secondary columns collapse and the overview follows the table at narrow widths. Full volume remains in asset details.

## Data boundary

The API adapter now validates optional returned provider timestamps, volume units and USD product identity, with legacy compatibility. No remote server/database or working mode configuration changes. Working mode remains demo. Demo rows read only labeled fixtures for the requested 27 assets. The API view displays that target catalog while distinguishing records absent from the actual database as Awaiting API; those selections send no market request. API table values are cached only from requested validated market responses. Unrequested rows show a dash and View price. Only the selected asset refreshes automatically: on load, then 30 seconds after each completed lookup while visible. Cooldowns, in-flight requests, cancellation and returned rate limits are respected. The chart holds up to 120 actual successful receipt-time observations per asset in memory; one observation is a dot and fixed samples form a flat line. There is no bulk quote fetch, stored-price fallback or invented historical/market-cap/change data. Cached responses retain snapshot/freshness labels; the original JSON behavior remains.

The newly supplied backend candidate remains separate work: metadata/combined responses are not integrated by this visual redesign. The existing `nolan-v1` contract and unknown time/unit handling remain intact.

## Verification

- `npm test`: 94/94 pass after the catalog and chart additions. These controlled-response tests cover adapters, catalog identity, formatting, freshness and chart geometry; they are not automated DOM tests of the new controls.
- Runtime JavaScript syntax checks pass. HTML has unique IDs and every literal script ID reference resolves. Release extraction/file hashes are checked separately.
- Actual Safari local demo: initial BTC table/details, saved watchlist survives reload, removal and empty-watchlist recovery, A–Z name sorting, mixed-case `eThErEuM` search, JSON content, and Escape close behavior observed. Temporary saved BTC was removed after the persistence check.
- Safari increased page zoom triggered compact search/navigation, collapsed table columns and the stacked overview. This checks CSS reflow, not an emulated iPhone or a measured device viewport. Normal page zoom was restored. A dedicated touch-device check remains useful before hosted submission.
- The follow-up release was checked in actual Safari through a local read-only proxy against the updated real API: BTC/DOGE metadata and multiple received chart quotes rendered. This remains local verification; it has not been deployed to AWS. Earlier observations retain their original scope.

Earlier local screenshot captures are retained privately; they are not cloud-hosted submission evidence. Public copies omit unrelated browser chrome and personal tabs.

No remote service or AWS resource was modified by this assistant. The earlier team handoff ZIP remains the earlier snapshot; a new Explore release identifies the redesigned runtime with new hashes.

## Follow-up controls and catalog

Removed course/classroom branding from visitor-facing HTML. JSON is now inside the Specifications disclosure, preserving the original modal and endpoint links. Monero is not selectable; its raw database record, if returned, remains intact in JSON. The exact 27 requested symbols/names/categories are in `TEAM_ASSETS`. Nolan and Alex still need to extend the deployed database/backend before all 27 can return API quotes. No remote migration was performed.

All 27 public market routes returned HTTP 200 during the latest read-only check, and the catalog now supplies names/categories/descriptions. See `evidence/api-2026-11-18-catalog-verification.json`. Optional new metadata is integrated; the new combined-route schema remains separate work.

## Final copy cleanup

Renamed the page Crypto Context and FAQ heading FAQs. Navigation now follows document order: Explore → Data sources → Learn. Removed the refresh summary strip, API status banner, source tags, directory caption and promotional section taglines; retained the asset count and essential quote/sample/freshness information. Normal refresh countdowns are hidden while rate-limit guidance remains visible.

## Live production wording

The heading and browser title are Explore cryptocurrency. Production HTML, FAQs and loading placeholders no longer contain sample/demo wording. API mode is now the source default. Local development forwards only the public GET catalog/market routes; explicit offline preview keeps its actual fixture labels. Original JSON is preserved, including stored-price metadata supplied by the database, which is never used as a market price.
