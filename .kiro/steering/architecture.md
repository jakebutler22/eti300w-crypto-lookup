---
inclusion: always
---

# Three-tier architecture

The intended path is browser → presentation EC2 → Flask application EC2 → MariaDB database EC2. Flask also obtains Coinbase market information. Resource region: `us-east-2`. Expected names: `coinbase-300w-web`, `coinbase-300w-app`, `coinbase-300w-db`. Administrative EC2 Instance Connect Endpoint: `coinbase-300w-instance-connect`.

Milestone III reports three t3.micro instances, Flask, MariaDB, eight stored assets, and a temporary frontend. Verify those claims against authorized read-only inspection. OS, web server, document root, instance IDs, private paths, deployed routes, schema, live Coinbase integration, and production health are not established by names or a report.

Nolan's reviewed ZIP contains `GET /api/db/cryptos` (database name/symbol/sample price), `GET /api/live/<symbol>` (Coinbase price/volume/source), plus `/api/cryptos`, `/api/cryptos/<symbol>`, and `/api/test-db`. This is a source-level baseline; the running Flask service may differ. Inspect the real response before changing the adapter. Do not use database sample prices as live prices. Missing category, description, volume units, or provider timestamps remain explicit contract gaps until confirmed.

Browser code must use the public web origin and a documented API path, normally `/api`. Keep app/private database endpoints in server-side configuration. A static local development server does not itself proxy Flask. EC2 Instance Connect does not create a public API route.

Nolan owns middleware/contracts, Alex owns infrastructure/MariaDB, and Jake owns the frontend. Inspection is read-only by default. Present a concrete target, diff, backup, checks, and rollback and obtain specific approval before remote writes. Never grant IAM permissions or change security groups to make a tool work without account-owner approval. Read the current `docs/architecture.md` and `docs/aws-inspection.md` for observed facts and evidence.
