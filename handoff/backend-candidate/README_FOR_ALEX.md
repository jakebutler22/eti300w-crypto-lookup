# ETI 300W — completed backend upgrade (review before deployment)

**Target:** the existing `coinbase-300w-app` Flask+Gunicorn service (`/opt/crypto-backend`, Python 3.9, port 5000), with `crypto_db.cryptocurrencies` on the private MariaDB server. Nothing has been deployed by ChatGPT.

**Important:** We have Alex's server evidence and the current API behavior, **not** the original contents of Nolan's `app.py`/`database.py`. These are complete candidate replacement files, not a verified textual patch. Compare against the current source and retain any custom behavior before deploying. Confirm with Jake that the frontend accepts the response fields before making changes to the working app.

## Functionality included

- Preserves `GET /api/db/cryptos` and `GET /api/live/<symbol>` including their existing core JSON keys. Keeps `/api/test-db` response unchanged. Adds aliases `/api/cryptos`, `/api/cryptos/<symbol>`, `/api/db/cryptos/<symbol>`.
- Adds `GET /api/assets/<symbol>` and `GET /api/raw/<symbol>` — **one real server JSON response** containing both database profile (`profile`) and Coinbase market (`market`). XMR retains the profile with `market: null` and `market_status: unsupported_market`, not a fabricated live price.
- Adds SQL `category` and `description` for the eight existing coins, without changing stored price samples. **Only `migration.sql` actually alters the database.** Before migration, routes still respond with `category: null`, `description: null`.
- Adds Coinbase `provider_timestamp` (ticker's last-trade time), `retrieved_at` (our retrieval time), `volume_unit`/`volume_24h_unit` (base asset units, e.g. BTC), `quote_currency: USD` and `product_id`.
- Handles missing markets (404 on `/api/live/XMR`), upstream timeouts (504), rate limiting (503 + Retry-After where supplied), DB outages (503), invalid symbols (400), and invalid provider payloads without exposing credentials or substituting sample prices.
- Uses existing `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` variables in the protected systemd environment; supports optional `DB_PORT` (defaults to 3306). **No new public ports or security group changes required.**

## Existing route sample

`GET /api/db/cryptos` returns a list of records including:

```json
[{"name":"Bitcoin","symbol":"BTC","price":30000.0,"category":"Digital currency","description":"Bitcoin is a decentralized peer-to-peer cryptocurrency.","price_type":"stored_sample","price_currency":"USD"}]
```

`GET /api/live/BTC` preserves `name`, `symbol`, `price`, `source`, `volume_24h` while adding units and timestamps. **The price is fetched from Coinbase, not the sample price.**

`GET /api/assets/XMR` returns a `profile` object, `market:null`, `market_available:false`, `market_status:"unsupported_market"` and `market_error` explaining why.

## Safe deployment checklist for Alex (no changes made yet)

1. Review actual existing code in `/opt/crypto-backend` and compare it to this package. Keep any unrelated existing routes. Check the API contract with Jake.
2. Back up the **existing database and code** with the team's established backup procedures. Verify you can restore both. Do not share DB credentials or protected environment files.
3. Run `migration.sql` against `crypto_db` only if the extra profile fields are approved. It is repeatable; it preserves existing columns, keys, and eight sample prices. A database owner must approve schema changes.
4. Install these modules and pinned requirements **in a separate staging venv** first. Run `python -m pytest -q` (install `pytest` in staging if needed). Also run `python -m compileall -q .` and verify route listing. Compare behavior with the current production API before making any deployment changes.
5. Confirm the current Gunicorn entry point is `app:app`; if it differs, preserve your systemd setup. Leave `/etc/crypto-backend.env`, Nginx `/api/` forwarding, security groups, and ports untouched.
6. Following explicit deployment approval, release with the team's backup/rollback procedure. Restart `crypto-backend.service` only as part of the reviewed deployment, check service health, and verify `/api/test-db`, `/api/db/cryptos`, `/api/live/BTC`, `/api/live/ETH`, `/api/live/XMR`, `/api/assets/BTC`, and `/api/assets/XMR` **through the existing website's `/api/` reverse proxy**.
7. Send Jake the final verified API responses so the frontend can map `profile.category`, `profile.description`, `market.provider_timestamp`, and `market.volume_unit`.

## Notes

The database and Coinbase API are distinct data sources. The sample `price` column is not suitable for displaying a live price. The current website is served via HTTP and has no authentication; this demo backend is intended for the course prototype, not production financial trading.

Tests use fake database records and fake Coinbase responses; run them on the team's development machine with the listed packages. No AWS instance, live Coinbase account, or MariaDB server is needed for the unit tests.
