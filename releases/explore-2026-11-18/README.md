# Explore redesign release - November 18, 2026

- `eti300w-frontend-api.tar.gz`: 36 runtime files configured for the existing same-origin `nolan-v1` API.
- `eti300w-frontend-demo.tar.gz`: the same interface with explicitly labeled fixed sample data.
- Matching manifests record archive/file SHA-256 values.
- The team handoff ZIP includes the frontend, demo, unchanged backend review candidate, request/reply templates and diagram references. It is not a web payload.

The earlier local handoff ZIP predates this redesign. This release supersedes its frontend payload. The frontend now maps validated optional timestamps, units and product identity from observed responses. The backend candidate still needs deployed source-identity/alias review; its combined JSON route needs a separate frontend contract. All 122 frontend tests pass. No archive is authorization to change AWS or the database.

Run demo through HTTP, not file://. Deploy only reviewed runtime files after the exact backup/validation/rollback plan is approved. Preserve the existing `/api/` gateway and unrelated web-root files.

Deploy the complete `assets/coins/` folder with its 27 SVG logos and license. The table now loads all supported market quotes automatically; cached row selection opens immediately.

The logo-flashing fix keeps existing row/image nodes through quote updates and uses readable, stable failure fallbacks. Deploy the whole archive; the live server previously omitted all 27 SVGs.
