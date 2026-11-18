# Explore redesign release - November 18, 2026

- `eti300w-frontend-api.tar.gz`: eight runtime files configured for the existing same-origin `nolan-v1` API.
- `eti300w-frontend-demo.tar.gz`: the same interface with explicitly labeled fixed sample data.
- Matching manifests record archive/file SHA-256 values.
- The team handoff ZIP includes the frontend, demo, unchanged backend review candidate, request/reply templates and diagram references. It is not a web payload.

The earlier local handoff ZIP predates this redesign. This release supersedes its frontend payload. The backend candidate still needs contract review, mapping/tests and separate approved deployment. No archive is authorization to change AWS or the database.

Run demo through HTTP, not file://. Deploy only reviewed runtime files after the exact backup/validation/rollback plan is approved. Preserve the existing `/api/` gateway and unrelated web-root files.
