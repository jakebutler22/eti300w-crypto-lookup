# Nolan: middleware implementation

Report-ready wording based on the middleware write-up supplied in chat on November 18, 2026, Alex's attributed infrastructure captures, the original backend source, and the recorded public API checks. The [provided wording](evidence/nolan-2026-11-18/middleware-writeup.source.txt) is preserved as normalized plain text. This section does not establish a new API release or deployment of the upgraded frontend.

## Middleware overview and implementation

My responsibility was developing the Python Flask backend that connects the cryptocurrency website to MariaDB and the Coinbase Exchange API. The middleware runs on the separate `coinbase-300w-app` EC2 instance in Ohio (`us-east-2`). The team's infrastructure handoff reports Amazon Linux 2023, Python 3.9.25, Flask 3.1.3 and Gunicorn 23.0.

The application uses `database.py` and its `get_all_cryptos()` function to run `SELECT name, symbol, price FROM cryptocurrencies`. The database contains eight assets: BTC, ETH, XRP, LTC, ADA, DOGE, SOL and XMR. The stored prices are sample values. For supported USD products, Flask separately requests a last-trade price snapshot and 24-hour trading volume from Coinbase and returns JSON.

## Deployment and communication

Alex deployed the backend to `/opt/crypto-backend`. The `crypto-backend.service` systemd unit runs Gunicorn on port 5000. Nginx on `coinbase-300w-web` forwards `/api/` requests to Flask while preserving the path prefix.

Flask queries MariaDB on the separate `coinbase-300w-db` instance over the private network on port 3306. It contacts Coinbase over HTTPS on port 443. Browser requests go through the web tier; the browser does not connect directly to MariaDB.

The principal routes demonstrated are:

| Route | Purpose |
| --- | --- |
| `/api/db/cryptos` | Retrieve the database catalog with names, symbols and stored prices |
| `/api/live/BTC` | Retrieve a supported USD market's last-trade price and 24-hour volume |
| `/api/test-db` | Check that the application can open a database connection |

## Testing and evidence

The team's November 18 evidence records the application service active, Gunicorn listening on port 5000, and an app-side `get_all_cryptos()` query returning all eight records through the private database connection. The public database and BTC market routes also returned HTTP 200 in the recorded independent public checks.

Alex's capture reports `/api/test-db` returning HTTP 200 with a connection-success response. That check establishes connectivity; the separate eight-row query demonstrates data retrieval. Actual service/query/API screenshots should accompany this section in the final Cloud Build document.

## Limitations and contribution

Stored database prices are not current market observations. Coinbase snapshots are retrieved separately, and unsupported markets such as XMR remain unavailable. The database currently lacks category and description columns. The observed market JSON also lacks provider observation time and explicit volume units, so the interface cannot independently establish quote freshness or label volume units from that response alone.

My contribution was developing the Flask routes, database access and Coinbase integration, and testing and troubleshooting the backend. The existing cloud API demonstrates the middleware's role between the web, database and external data source. Deployment and hosted verification of Jake's upgraded frontend remain separate outstanding work.

## Assembly notes (keep outside the submitted narrative)

- Add the actual app-instance service screenshot, the successful database query/API evidence, and their dated captions. The write-up is narrative, not a screenshot or executable implementation update.
- The original text states the deployed backend matched the ZIP. Alex supplied matching truncated hash prefixes; full deployed hashes were not supplied. The report wording avoids claiming independently verified byte identity.
- The text acknowledges missing profile fields but adds no category/description, provider timestamp, volume-unit field or combined endpoint. Track those under the earlier project brief; do not mark them implemented from a narrative alone.
- See [API contract](api-contract.md), [Alex's review](alex-handoff-review.md), and [submission checklist](submission-checklist.md) for remaining evidence and release work. No server changes were made while preparing this section.
