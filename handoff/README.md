# Backend candidate handoff

`backend-candidate/` contains the nine unchanged files supplied in Nolan's November 18 SharePoint upgrade. This is a review candidate, not a claim that it is deployed or integrated.

Read the [candidate review](../docs/team-return/BACKEND_CANDIDATE_REVIEW.md) first. Existing `/api/cryptos*` behavior changes, metadata/combined JSON mapping and retry semantics still need agreement. The migration and deployment instructions are proposals. Approval must precede every remote write, including backup/staging/migration/install/restart. Do not place this folder in the public web root.

`.env.example` contains placeholders only. No real environment files, credentials, private addresses or keys belong in this repository. The candidate's mocked tests were supplied; they were not executed as part of the frontend redesign. Frontend `npm test` results do not establish backend or MariaDB readiness.
