"""ETI 300W cryptocurrency middleware, compatible with existing nginx /api/ proxy."""
from __future__ import annotations

from flask import Flask, jsonify

from coinbase import MarketProviderError, MarketUnavailable, fetch_market, normalize_symbol
from database import DatabaseUnavailable, check_db, get_all_cryptos, get_crypto_by_symbol

app = Flask(__name__)


def _profile(record: dict) -> dict:
    return {
        "name": record["name"],
        "symbol": record["symbol"],
        "price": record["price"],  # legacy field: stored SAMPLE price, not live
        "category": record.get("category"),
        "description": record.get("description"),
        "price_type": "stored_sample",
        "price_currency": "USD",
    }


def _bad_symbol_response():
    return jsonify({"error": "Invalid cryptocurrency symbol"}), 400


def _db_error_response():
    return jsonify({"error": "Database temporarily unavailable"}), 503


def _get_record(symbol: str):
    record = get_crypto_by_symbol(symbol)
    return record


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "service": "crypto-backend"})


@app.get("/api/test-db")
def test_db():
    try:
        check_db()
    except DatabaseUnavailable:
        return jsonify({"error": "Database connection unavailable"}), 503
    # Preserve the existing response used by the web server health check.
    return jsonify({"status": "Database connection successful"})


@app.get("/api/db/cryptos")
@app.get("/api/cryptos")
def list_cryptos():
    try:
        return jsonify([_profile(row) for row in get_all_cryptos()])
    except DatabaseUnavailable:
        return _db_error_response()


@app.get("/api/db/cryptos/<symbol>")
@app.get("/api/cryptos/<symbol>")
def crypto_profile(symbol: str):
    symbol = normalize_symbol(symbol)
    if symbol is None:
        return _bad_symbol_response()
    try:
        record = _get_record(symbol)
    except DatabaseUnavailable:
        return _db_error_response()
    if record is None:
        return jsonify({"error": "Cryptocurrency not found", "symbol": symbol}), 404
    return jsonify(_profile(record))


@app.get("/api/live/<symbol>")
def live_market(symbol: str):
    symbol = normalize_symbol(symbol)
    if symbol is None:
        return _bad_symbol_response()
    try:
        market = fetch_market(symbol)
    except MarketUnavailable as exc:
        return jsonify({"error": str(exc), "symbol": symbol, "available": False}), 404
    except MarketProviderError as exc:
        response = jsonify({"error": str(exc), "symbol": symbol, "available": False})
        if exc.retry_after:
            response.headers["Retry-After"] = exc.retry_after
        return response, exc.http_status
    # Keep the original required keys (name, symbol, price, source, volume_24h).
    try:
        record = _get_record(symbol)
        if record is not None:
            market["name"] = record["name"]
    except DatabaseUnavailable:
        pass  # live market should remain usable during DB outages
    return jsonify(market)


def _combined(symbol: str):
    symbol = normalize_symbol(symbol)
    if symbol is None:
        return _bad_symbol_response()
    try:
        record = _get_record(symbol)
    except DatabaseUnavailable:
        return _db_error_response()
    if record is None:
        return jsonify({"error": "Cryptocurrency not found", "symbol": symbol}), 404

    profile = _profile(record)
    result = {
        "profile": profile,
        "market": None,
        "market_available": False,
        "market_status": "unavailable",
        "market_error": None,
    }
    try:
        market = fetch_market(symbol)
        market["name"] = record["name"]
        result.update(market=market, market_available=True, market_status="available")
    except MarketUnavailable as exc:
        result.update(market_status="unsupported_market", market_error=str(exc))
    except MarketProviderError as exc:
        result.update(market_status="provider_error", market_error=str(exc))
    # Return the valid database profile even if the live market is unavailable.
    # Never use profile.price as a substitute for a failed live request.
    return jsonify(result)


@app.get("/api/assets/<symbol>")
@app.get("/api/raw/<symbol>")
def combined_asset(symbol: str):
    return _combined(symbol)


if __name__ == "__main__":
    # Development only. On AWS, Gunicorn uses app:app as a systemd service.
    app.run(debug=False, host="127.0.0.1", port=5000)
