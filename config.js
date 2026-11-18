// Nolan's supplied Flask routes, through the presentation server's /api proxy.
// Keep demo mode until that proxy and the real database are available.
// No production addresses or secrets belong here.
export const APP_CONFIG = {
  mode: "demo",
  apiBaseUrl: "/api",
  apiContract: "nolan-v1",
  catalogPath: "/db/cryptos",
  marketPath: "/live",
  // Optional future combined response; select apiContract: "combined-v1" to use it.
  lookupPath: "/cryptocurrencies",
  requestTimeoutMs: 20000,
  // Keep a real database profile visible when its market request is unavailable.
  allowPartialMarket: true,
  refreshCooldownMs: 5000,
  staleAfterMs: 300000,
};
