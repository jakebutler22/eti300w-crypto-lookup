# ETI 300W project instructions

Build and maintain Jake's cryptocurrency lookup frontend. Codex is the primary implementation assistant; Kiro provides frontend review, AWS inspection, and integration troubleshooting. Read `README.md`, `docs/api-contract.md`, and `docs/architecture.md` before changing integration behavior. If current lowercase documents are absent, consult `docs/BACKEND-INTEGRATION.md` and record that they describe the supplied ZIP rather than a live service.

## Ownership and collaboration

- Jake owns HTML, CSS, JavaScript, accessibility, search, API adaptation, local testing, and frontend deployment preparation.
- Nolan owns Flask, database queries, Coinbase integration, and backend contracts. Alex owns EC2, operating systems, networking, security groups, and MariaDB setup.
- Preserve teammate contributions. Prepare and document requested backend or infrastructure changes; obtain the user's specific approval before applying them remotely.
- Codex and Kiro do not automatically exchange messages. Share context through these files and a short handoff stating branch, changed files, commands run, unresolved issues, and requested review.
- Use one writing assistant per checkout. For parallel implementation use separate Git worktrees/branches; for a coordinated session, explicitly assign disjoint file ownership and keep the other assistant read-only. Do not overwrite another worker's uncommitted changes.

## Implementation and truthfulness

- Keep HTML, CSS, and vanilla JavaScript, with minimal dependencies and no frontend build requirement. Preserve the API service layer rather than placing requests throughout the UI.
- Support only the returned database directory in API mode. Match full names and tickers case-insensitively. Missing metadata must stay visibly unavailable.
- Label mock/sample data. Never present stored MariaDB sample prices as live Coinbase observations or silently replace a failed API response with fixtures.
- Keep USD price, 24-hour volume, and price change distinct. Do not invent timestamps or volume units. Preserve original JSON responses and distinguish a client-created wrapper from an actual HTTP endpoint.
- Keep credentials, database secrets, private keys, and private EC2 addresses out of public JavaScript, repository files, logs, screenshots, and chat. Do not inspect secret stores.
- Use semantic HTML, clear focus indicators, useful errors/loading states, keyboard access, responsive layouts, and restrained financial information design. Preserve glossary and FAQ coverage.

## AWS boundary

The requested resource region is `us-east-2` (Ohio). Expected instance names are `coinbase-300w-web`, `coinbase-300w-app`, and `coinbase-300w-db`; administrative endpoint name is `coinbase-300w-instance-connect`. Names and report claims are discovery targets, not proof of running instances or deployment.

Start with read-only inspection using authorized temporary credentials or an existing console session. Verify IDs, region, OS, web server/document root, routes, network paths, and response shapes. EC2 Instance Connect is administration, not an application API gateway. Keep browser API requests on the public web origin; a private app server needs a verified web-tier proxy.

Before any remote write, present the exact instance, file/config diff, backup, validation, and rollback, then obtain the user's specific approval. This includes uploading frontend files, changing a proxy, installing packages, restarting services, IAM/security-group changes, schema/data changes, and resource creation. Never terminate/replace instances, publicly expose MariaDB, delete data/volumes, or consume credits by creating resources without explicit authorization. Do not treat general setup permission as deployment approval.

## Verification and reporting

Run `npm test` after JavaScript changes. Serve locally with `npm run serve` or `python3 -m http.server 8000 --bind 127.0.0.1`. Inspect rendered desktop/mobile behavior after interface changes and check search, keyboard use, missing data, errors, JSON, and source labels. Use the repository's current test scripts if they have expanded.

Report local fixture tests, real backend tests, AWS discovery, and deployed verification separately. Record commands and genuine evidence. Do not claim agent selection, live pricing, backend/database connectivity, or deployment without observing it. Maintain concise documentation and leave final checks to the agent owning the implementation.
