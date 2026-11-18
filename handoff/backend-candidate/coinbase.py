"""Public Coinbase Exchange market data. Never returns stored/sample DB prices."""
from __future__ import annotations

from datetime import datetime, timezone
import math
import re

import requests

BASE_URL = "https://api.exchange.coinbase.com"
SYMBOL_RE = re.compile(r"^[A-Z0-9]{2,10}$")
_SESSION = requests.Session()
_SESSION.headers.update({"Accept": "application/json", "User-Agent": "ETI300W-StudentCryptoPrototype/1.0"})


class MarketUnavailable(Exception):
    """The requested Coinbase USD market does not exist."""


class MarketProviderError(Exception):
    """Coinbase could not provide an authoritative price."""

    def __init__(self, message: str, http_status: int = 502, retry_after: str | None = None):
        super().__init__(message)
        self.http_status = http_status
        self.retry_after = retry_after


def normalize_symbol(raw: str) -> str | None:
    symbol = raw.strip().upper()
    return symbol if SYMBOL_RE.fullmatch(symbol) else None


def _numeric(value: object, field: str, allow_zero: bool = False) -> float:
    try:
        converted = float(value)
    except (ValueError, TypeError, OverflowError) as exc:
        raise MarketProviderError(f"Coinbase returned an invalid {field}") from exc
    if not math.isfinite(converted) or (converted < 0 if allow_zero else converted <= 0):
        raise MarketProviderError(f"Coinbase returned an invalid {field}")
    return converted


def fetch_market(symbol: str) -> dict:
    """Return BTC-USD style ticker fields from Coinbase Exchange's public REST API.

    time is the provider's last-trade timestamp, while retrieved_at is when we
    received the response. volume_24h is in *base asset units*, not dollars.
    """
    symbol = normalize_symbol(symbol)
    if symbol is None:
        raise ValueError("Invalid cryptocurrency symbol")

    product = f"{symbol}-USD"
    try:
        response = _SESSION.get(
            f"{BASE_URL}/products/{product}/ticker",
            timeout=(3, 7),
            allow_redirects=False,
        )
    except requests.Timeout as exc:
        raise MarketProviderError("Coinbase request timed out", http_status=504) from exc
    except requests.RequestException as exc:
        raise MarketProviderError("Coinbase could not be reached", http_status=502) from exc

    if response.status_code == 404:
        raise MarketUnavailable(f"Coinbase Exchange does not offer {product}")
    if response.status_code == 429:
        retry = response.headers.get("Retry-After")
        retry = retry if retry and re.fullmatch(r"[0-9]{1,5}", retry) else None
        raise MarketProviderError("Coinbase rate limit reached", http_status=503, retry_after=retry)
    if response.status_code != 200:
        raise MarketProviderError("Coinbase market request failed", http_status=502)

    try:
        data = response.json()
    except (ValueError, requests.RequestException) as exc:
        raise MarketProviderError("Coinbase returned invalid JSON") from exc
    if not isinstance(data, dict):
        raise MarketProviderError("Coinbase returned an unexpected response")

    price = _numeric(data.get("price"), "price")
    volume = _numeric(data.get("volume"), "volume", allow_zero=True)
    provider_timestamp = data.get("time")
    if not isinstance(provider_timestamp, str) or not provider_timestamp:
        provider_timestamp = None

    return {
        "name": None,  # app.py adds the authoritative catalog name when available
        "symbol": symbol,
        "price": price,
        "source": "Coinbase Exchange",
        "volume_24h": volume,
        "volume_unit": symbol,
        "volume_24h_unit": symbol,
        "quote_currency": "USD",
        "product_id": product,
        "provider_timestamp": provider_timestamp,  # last trade time reported by Coinbase
        "retrieved_at": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
    }
