"""Run with: python -m pytest -q (requires pip install pytest)."""
import pytest
from requests import Response

import app as backend
import coinbase
from coinbase import MarketProviderError, MarketUnavailable
from database import DatabaseUnavailable


@pytest.fixture
def client():
    backend.app.config.update(TESTING=True)
    return backend.app.test_client()


@pytest.fixture
def fake_db(monkeypatch):
    sample = [
        {"name": "Bitcoin", "symbol": "BTC", "price": 30000.0,
         "category": "Digital currency", "description": "Bitcoin is a peer-to-peer cryptocurrency."},
        {"name": "Monero", "symbol": "XMR", "price": 630.0,
         "category": "Privacy cryptocurrency", "description": "Privacy-focused cryptocurrency."},
    ]
    monkeypatch.setattr(backend, "get_all_cryptos", lambda: sample)
    monkeypatch.setattr(backend, "get_crypto_by_symbol",
                        lambda symbol: next((r for r in sample if r["symbol"] == symbol), None))
    monkeypatch.setattr(backend, "check_db", lambda: True)
    return sample


def test_legacy_db_route_preserved(client, fake_db):
    res = client.get("/api/db/cryptos")
    assert res.status_code == 200
    rows = res.get_json()
    assert len(rows) == 2
    assert rows[0]["name"] == "Bitcoin"
    assert rows[0]["price"] == 30000.0
    assert rows[0]["price_type"] == "stored_sample"
    assert rows[0]["category"] == "Digital currency"


def test_legacy_test_db_response(client, fake_db):
    assert client.get("/api/test-db").get_json() == {"status": "Database connection successful"}


def test_profile_lookup_is_case_insensitive(client, fake_db):
    assert client.get("/api/cryptos/btc").get_json()["symbol"] == "BTC"
    assert client.get("/api/cryptos/ZZZ").status_code == 404
    assert client.get("/api/cryptos/a!a").status_code == 400


def test_live_returns_source_and_units(client, fake_db, monkeypatch):
    def market(symbol):
        return {"symbol": symbol, "name": None, "price": 100.2,
                "source": "Coinbase Exchange", "volume_24h": 5.0,
                "volume_unit": symbol, "provider_timestamp": "2026-11-18T20:00:00Z",
                "retrieved_at": "2026-11-18T20:01:00Z"}
    monkeypatch.setattr(backend, "fetch_market", market)
    result = client.get("/api/live/BTC")
    assert result.status_code == 200
    body = result.get_json()
    assert body["name"] == "Bitcoin"
    assert body["price"] == 100.2
    assert body["volume_unit"] == "BTC"


def test_combined_response_keeps_price_sources_separate(client, fake_db, monkeypatch):
    monkeypatch.setattr(backend, "fetch_market", lambda symbol: {
        "symbol": symbol, "price": 64000.0, "name": None,
        "source": "Coinbase Exchange", "volume_24h": 1000,
        "volume_unit": symbol, "provider_timestamp": "2026-11-18T21:00:00Z"})
    body = client.get("/api/assets/BTC").get_json()
    assert body["profile"]["price"] == 30000.0
    assert body["market"]["price"] == 64000.0
    assert body["market_available"] is True
    assert client.get("/api/raw/BTC").get_json() == body


def test_xmr_is_unavailable_not_stored_price(client, fake_db, monkeypatch):
    monkeypatch.setattr(backend, "fetch_market", lambda symbol: (_ for _ in ()).throw(
        MarketUnavailable("Coinbase Exchange does not offer XMR-USD")))
    live = client.get("/api/live/XMR")
    assert live.status_code == 404
    combined = client.get("/api/assets/XMR")
    assert combined.status_code == 200
    body = combined.get_json()
    assert body["profile"]["price"] == 630
    assert body["market"] is None
    assert body["market_status"] == "unsupported_market"


def test_db_failure_is_safe(client, monkeypatch):
    monkeypatch.setattr(backend, "get_all_cryptos", lambda: (_ for _ in ()).throw(
        DatabaseUnavailable("private details must not leak")))
    res = client.get("/api/db/cryptos")
    assert res.status_code == 503
    assert "private details" not in res.get_data(as_text=True)


def test_live_rate_limit_response(client, fake_db, monkeypatch):
    monkeypatch.setattr(backend, "fetch_market", lambda symbol: (_ for _ in ()).throw(
        MarketProviderError("Coinbase rate limit reached", http_status=503, retry_after="30")))
    res = client.get("/api/live/BTC")
    assert res.status_code == 503
    assert res.headers["Retry-After"] == "30"


def test_coinbase_ticker_parsing_without_external_network(monkeypatch):
    class Reply:
        status_code = 200
        headers = {}
        def json(self):
            return {"price": "62361.94", "volume": "11431.29545037",
                    "time": "2026-11-18T21:14:00Z"}
    monkeypatch.setattr(coinbase._SESSION, "get", lambda url, **kwargs: Reply())
    result = coinbase.fetch_market("btc")
    assert result["symbol"] == "BTC"
    assert result["quote_currency"] == "USD"
    assert result["volume_24h_unit"] == "BTC"
    assert result["provider_timestamp"] == "2026-11-18T21:14:00Z"
    assert result["retrieved_at"].endswith("Z")
