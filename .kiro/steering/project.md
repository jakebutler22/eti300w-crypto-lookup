---
inclusion: always
---

# Project

ETI 300W is a Penn State cryptocurrency information assignment. Public visitors must browse supported assets, search a full name or ticker, select details, understand data provenance and freshness, and access corresponding raw backend JSON. Include short glossary/FAQ help without overwhelming the lookup interface.

Codex leads implementation. Kiro reviews frontend changes and investigates integration. Follow root `AGENTS.md` for ownership, coordination, secrets, and approval. Use a separate worktree for concurrent writers; otherwise Kiro reviews while Codex writes, then explicitly hand off ownership.

Use semantic HTML, CSS, and vanilla JavaScript. Prefer readable market tables and restrained typography, contrast, spacing, and accents. Avoid oversized rounded cards, gradients, fabricated metrics, and unnecessary dependencies. Angular and Kaggle are not baseline dependencies; consult `docs/technology-decisions.md` for the current rationale.

The local frontend supports an explicit demo mode. Demo success is not deployed-system evidence. API mode must show actual database records and honestly handle missing profile fields, failed requests, unsupported products, stale data, and unknown timestamp/volume semantics. Never merge fixture records into production responses.

Read `docs/api-contract.md`, `docs/architecture.md`, and `docs/testing.md` when present. Earlier uppercase backend documents describe Nolan's supplied prototype. Resolve differences by inspecting the current configured service and reporting uncertainty, not by guessing routes.
