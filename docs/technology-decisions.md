# Technology decisions

Reviewed November 18, 2026 against the current repository and team reports.

The subsequently supplied Final Assignment to Add requires **two** options from I–VII. A cloud-hosted framework is option I, not a universal requirement. Recommend II (private app/database VPC networking) and VII (full network diagram), subject to verification and team agreement. Keeping vanilla JavaScript therefore remains appropriate for this proposed pair; it must not be represented as satisfying option I. See the [submission checklist](submission-checklist.md).

## Retain HTML, CSS, and vanilla JavaScript

The application has one asset directory, one search flow, one detail view, and a small help section. `api.js` already separates data access from `script.js` and `style.css`. Keeping this structure preserves working code and gives Alex static files to serve, with no frontend build service or Node process on EC2.

Angular offers reusable [components](https://angular.dev/guide/components), structured templates, and [accessibility tools](https://angular.dev/best-practices/a11y), including focus management and live announcements. These would be useful for a larger application with many independently maintained screens. The current search, semantic controls, keyboard behavior, and responsive layout do not require a framework. Angular would introduce a migration and a [CLI build step](https://angular.dev/tools/cli/deployment) without resolving the actual integration gaps: missing backend fields, deployment discovery, and live verification.

This is a project scope decision, not a claim that Angular cannot run on a `t3.micro`. A client-rendered Angular build can also be served as static files; compilation need not happen on the server. Reconsider if the project grows into multiple routed tools or a larger component library.

## Do not add Kaggle

The team already reports eight MariaDB asset records. The required market source is Coinbase. Kaggle's [Bitcoin Historical Data](https://www.kaggle.com/datasets/mczielinski/bitcoin-historical-data) offers historical market observations, which could support a separately scoped analysis feature. It does not solve a missing requirement in this lookup application.

No dataset was downloaded or imported. No historical dataset price replaces Coinbase data. If static descriptions need work, Nolan and Alex should maintain and return those fields in the existing database; importing another catalog would require provenance, license, symbol mapping, and consistency checks without an identified benefit.

The immediate priorities remain the existing Flask contract, honest source/freshness labels, public visitor usability, and a verified three-tier deployment.
