# Review of Nolan's supplied backend

Reviewed November 8, 2026 from `crypto-backend.zip` and the accompanying email screenshot. The email reports local success and says the database integration is untested. That is teammate context; this review establishes source behavior, not a new runtime verification.

Archive SHA-256:

```text
728a76a4d448671c9fe322de498dd243a35fd18fc74f3486164e375bb5ff0f5a
```

The three files are `crypto-backend/app.py`, `crypto-backend/database.py`, and `crypto-backend/requirements.txt`. References below use their original archive line numbers. The backend has not been changed, started, or deployed in this frontend work.

## Implemented source behavior

| Evidence | What it establishes |
| --- | --- |
| `app.py:20–48`, `53–78`, `93–126` | Flask JSON routes call Coinbase's Exchange USD-product ticker with a 10-second requests timeout |
| `app.py:93–126` | `/api/live/<symbol>` returns `name`, `symbol`, numeric `price`, numeric `volume_24h`, and `source` |
| `app.py:132–141`; `database.py:15–29` | `/api/db/cryptos` executes a MySQL query and returns rows |
| `database.py:4–10` | MySQL uses `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` environment variables |
| `app.py:82–89` | `/api/test-db` opens a connection; it does not query the cryptocurrency table |
| `requirements.txt:1–3` | Flask, requests, mysql-connector-python are declared without version pins |

This is a concrete Flask prototype. The frontend can adapt to its routes while keeping response gaps visible.

## Gaps against the supplied brief

| Gap | Source evidence | Next owner/action |
| --- | --- | --- |
| Category and description are missing | `database.py:21–23` selects only `name`, `symbol`, `price`; live routes also omit profile fields | Nolan + Alex: add/populate fields and query them |
| No one endpoint combines database profiles and current market data | Database/live routes are separate; `/api/cryptos` uses hardcoded names rather than MySQL | Nolan: add combined name/ticker lookup JSON endpoint |
| Market observation time is discarded | `app.py:117–123` omits Coinbase `time` | Nolan: return the provider timestamp with an explicit meaning |
| Volume unit/product metadata are absent | The same return block has `volume_24h` and a source name only | Nolan: verify and return unit/product; Jake: map labels |
| Database and live coverage may disagree | `app.py:8–17`, `97–104` allow eight hardcoded symbols independently of database rows | Nolan: reconcile database assets and supported USD-product mapping |
| MySQL integration is unverified | Email says untested; no schema, seed, or tests are supplied | Alex + Nolan: populate the actual database and exercise its query |
| Production deployment is not supplied | No WSGI service, Gunicorn dependency, AWS configuration, or deployment evidence in ZIP | Alex + Nolan: deploy and verify the three-tier path |

These are observed omissions, not a claim the code has been run and failed.

## Integration checks

- `/api/cryptos` makes eight sequential provider calls (`app.py:24–46`). It can wait for multiple upstream timeouts and is unsuitable as a quick database directory. The frontend uses `/api/db/cryptos`.
- List membership is not proof of Coinbase product availability; an allowed live symbol can still return an unavailable-pair `404`.
- MySQL has no explicit timeout (`database.py:5–10`). Coordinate database, proxy, and client budgets.
- The live conversion catches `RequestException`, `ValueError`, and `KeyError` (`app.py:125`); unexpected provider types may fall outside it. Validate finite nonnegative values and consistent JSON errors.
- A successful `/api/test-db` does not establish that the table/query works or contains required profile fields.
- Resolve/test dependencies in Alex's environment and add a production WSGI server; see [Deployment](DEPLOYMENT.md). No dependencies were installed for this review.

## Frontend response to this handoff

The `nolan-v1` adapter loads database rows, resolves the selected name/ticker, and calls `/api/live/<symbol>`. API mode uses database assets and never fills missing information with demo content. Missing category/description, volume unit, and market timestamp stay visibly unavailable/unconfirmed. The JSON dialog preserves both original responses and actual endpoint links in an explicitly client-assembled wrapper.

This advances Jake's integration work. The wrapper does not replace Nolan's combined HTTP endpoint. [Requirements](REQUIREMENTS.md) separates those remaining backend/deployment dependencies from the frontend work.
