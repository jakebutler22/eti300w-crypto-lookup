"""MariaDB access using the credentials already supplied by the EC2 systemd service."""
from __future__ import annotations

import os
import mysql.connector
from mysql.connector import Error as MySQLError


class DatabaseUnavailable(Exception):
    """Database couldn't be queried; never expose credentials or host details."""


def get_connection():
    # No secrets are stored in code or a checked-in .env file.
    try:
        return mysql.connector.connect(
            host=os.environ["DB_HOST"],
            user=os.environ["DB_USER"],
            password=os.environ["DB_PASSWORD"],
            database=os.environ["DB_NAME"],
            port=int(os.environ.get("DB_PORT", "3306")),
            connection_timeout=5,
        )
    except (MySQLError, KeyError, ValueError) as exc:
        raise DatabaseUnavailable("Database connection unavailable") from exc


def _query(sql: str, params: tuple = ()) -> list[dict]:
    connection = get_connection()
    cursor = None
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(sql, params)
        return list(cursor.fetchall())
    except MySQLError as exc:
        raise DatabaseUnavailable("Database query unavailable") from exc
    finally:
        if cursor is not None:
            cursor.close()
        connection.close()


def _selected_columns() -> str:
    """Works before AND after the optional category/description migration."""
    rows = _query("SHOW COLUMNS FROM cryptocurrencies")
    columns = {r["Field"] for r in rows}
    if not {"name", "symbol", "price"}.issubset(columns):
        raise DatabaseUnavailable("Database schema is missing required fields")
    category = "category" if "category" in columns else "NULL AS category"
    description = "description" if "description" in columns else "NULL AS description"
    # All SQL identifiers here are fixed strings, never interpolated user input.
    return f"name, symbol, price, {category}, {description}"


def get_all_cryptos() -> list[dict]:
    return _query(f"SELECT {_selected_columns()} FROM cryptocurrencies ORDER BY id")


def get_crypto_by_symbol(symbol: str) -> dict | None:
    rows = _query(
        f"SELECT {_selected_columns()} FROM cryptocurrencies WHERE symbol = %s LIMIT 1",
        (symbol.upper(),),
    )
    return rows[0] if rows else None


def check_db() -> bool:
    return bool(_query("SELECT 1 AS ok"))
