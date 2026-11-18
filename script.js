import { APP_CONFIG } from './config.js?v=20261118-live';
import { formatUsdPrice, formatVolume, classifyFreshness, appendPriceObservation, priceChartGeometry } from './data-state.js?v=20261118-live';
import { ApiError, getAssetDirectory, loadAssetDirectory, lookupAsset } from './api.js?v=20261118-live';
import { DEMO_ASSETS, TEAM_ASSETS } from './data/demo-assets.js?v=20261118-live';

const $ = (id) => document.getElementById(id);
const isDemo = APP_CONFIG.mode === 'demo';
const usesNolanApi = !isDemo && APP_CONFIG.apiContract === 'nolan-v1';
const AUTO_REFRESH_MS = 30000;
const excludedQueries = new Set(['xmr', 'monero']);
let directory = isDemo ? getAssetDirectory() : teamDirectory([]);
const timestamp = new Intl.DateTimeFormat('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
const chartTime = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'UTC' });
const state = { response: null, controller: null, requestId: 0, selectedSymbol: '', lastQuery: '', errorCode: '', directoryLoaded: !usesNolanApi, loading: false, cooldownUntil: 0, rateLimitedUntil: 0, autoRefreshQuery: 'BTC', nextRefreshAt: Infinity };
state.directoryFilter = 'all';
state.sort = 'directory';
const WATCHLIST_KEY = 'eti300w-watchlist-v1';
let watchlist = readWatchlist();
// Table values are either labeled demo fixtures or responses actually requested.
// Loading the database directory never supplies a market price to this cache.
const marketCache = new Map();
const priceHistories = new Map();
if (isDemo) DEMO_ASSETS.forEach((data) => marketCache.set(data.symbol, { data, mode: 'demo', marketStatus: 'available' }));
const form = $('search-form');
const input = $('asset-search');
const list = $('asset-list');
const dialog = $('json-dialog');

// Team catalog entries are UI targets, not invented database records.
function teamDirectory(records) {
  const actual = new Map();
  for (const record of records) {
    if (record.symbol.toUpperCase() === 'XMR') {
      excludedQueries.add(record.name.trim().toLowerCase());
      continue;
    }
    actual.set(record.symbol.toUpperCase(), record);
  }
  return TEAM_ASSETS.map((asset) => actual.has(asset.symbol)
    ? { ...actual.get(asset.symbol), name: asset.name, backendAvailable: true }
    : { ...asset, backendAvailable: false });
}

function readWatchlist() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(WATCHLIST_KEY) || '[]');
    return new Set(Array.isArray(saved) ? saved.filter((value) => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value)).map((value) => value.toUpperCase()) : []);
  } catch {
    return new Set();
  }
}

function saveWatchlist() {
  try {
    window.localStorage.setItem(WATCHLIST_KEY, JSON.stringify([...watchlist].sort()));
    return true;
  } catch {
    return false;
  }
}

function updateRefreshControl() {
  const now = Date.now();
  const remaining = Math.max(0, state.rateLimitedUntil - now);
  const cooldown = Math.max(0, state.cooldownUntil - now);
  $('refresh-asset').disabled = !state.response || state.loading || cooldown > 0 || remaining > 0;
  $('refresh-asset').textContent = isDemo ? 'Reload sample' : 'Refresh now';
  $('search-form').querySelector('[type="submit"]').disabled = remaining > 0;
  $('error-action').disabled = remaining > 0;
  list.querySelectorAll('button[data-asset]').forEach((button) => { button.disabled = remaining > 0; });
  const refreshMessage = remaining > 0
    ? `The API asked us to wait. Try again in ${Math.ceil(remaining / 1000)} seconds.`
    : '';
  $('refresh-status').textContent = refreshMessage;
  $('error-refresh-status').textContent = refreshMessage;
  $('refresh-status').hidden = remaining <= 0;
  $('error-refresh-status').hidden = remaining <= 0;
}

function applyRateLimit(error) {
  if (error?.status !== 429 && !(error?.status === 503 && Number.isFinite(error.retryAfterMs))) return;
  const delay = Number.isFinite(error.retryAfterMs) ? Math.min(300000, Math.max(0, error.retryAfterMs)) : 30000;
  state.rateLimitedUntil = Date.now() + delay;
}

function renderFreshness() {
  if (!state.response) return;
  const freshness = classifyFreshness(state.response.data, { staleAfterMs: APP_CONFIG.staleAfterMs });
  $('detail-badge').textContent = freshness.badge;
  $('detail-badge').dataset.kind = freshness.kind;
  $('freshness-label').textContent = freshness.label;
  $('freshness-description').textContent = freshness.description;
  const time = $('detail-timestamp');
  time.hidden = !freshness.timestamp;
  if (freshness.timestamp) {
    time.dateTime = freshness.timestamp;
    time.textContent = `${timestamp.format(new Date(freshness.timestamp))} UTC`;
  } else {
    time.removeAttribute('datetime');
    time.textContent = '';
  }
}

function renderPriceChart(response) {
  const { data } = response;
  const available = response.marketStatus !== 'unavailable' && Number.isFinite(data.market.priceUsd) && data.market.priceUsd >= 0;
  let history = priceHistories.get(data.symbol) || [];
  if (available) {
    // These are receipt-time observations from this visit, never historical candles.
    const reportedReceipt = Date.parse(data.retrievedAt);
    const receivedAt = Number.isFinite(reportedReceipt) ? reportedReceipt : Date.now();
    history = appendPriceObservation(history, data.market.priceUsd, receivedAt);
    priceHistories.set(data.symbol, history);
  }
  const geometry = priceChartGeometry(history);
  const svg = $('price-chart');
  svg.toggleAttribute('hidden', geometry.count === 0);
  svg.setAttribute('aria-label', `${data.name} USD price observations received during this visit. ${data.simulated ? 'Fixed simulated sample.' : 'Receipt times do not establish provider freshness.'}`);
  $('chart-empty').hidden = geometry.count > 0;
  $('chart-empty').textContent = 'No price observations yet.';
  $('chart-line').setAttribute('d', geometry.linePath);
  $('chart-area').setAttribute('d', geometry.areaPath);
  const point = $('chart-point');
  point.toggleAttribute('hidden', !geometry.lastPoint);
  if (geometry.lastPoint) {
    point.setAttribute('cx', geometry.lastPoint.x);
    point.setAttribute('cy', geometry.lastPoint.y);
  }
  $('chart-high').textContent = `High ${formatUsdPrice(geometry.high)}`;
  $('chart-low').textContent = `Low ${formatUsdPrice(geometry.low)}`;
  $('chart-start').textContent = geometry.start === null ? '—' : `${chartTime.format(new Date(geometry.start))} UTC`;
  $('chart-end').textContent = geometry.end === null ? '—' : `${chartTime.format(new Date(geometry.end))} UTC`;
  const count = geometry.count;
  $('chart-status').textContent = !available
    ? count ? `Latest quote unavailable · ${count} earlier ${count === 1 ? 'quote' : 'quotes'}` : 'Market quote unavailable'
    : data.simulated ? `${count} sample ${count === 1 ? 'observation' : 'observations'} · Fixed values`
      : `${count} ${count === 1 ? 'quote' : 'quotes'} · Times received in UTC`;
}

function setSymbolMark(element, symbol) {
  const marks = { BTC: '₿', ETH: 'Ξ', SOL: '◎', USDC: '$', ADA: '₳', AVAX: '▲', LINK: '⬡', LTC: 'Ł', XRP: 'X', DOGE: 'Ð', XMR: 'M' };
  element.dataset.symbol = symbol;
  element.textContent = marks[symbol] || symbol;
}

function renderApiExamples(assets) {
  if (!usesNolanApi) return;
  const examples = assets.filter((asset) => asset.backendAvailable !== false).slice(0, 3);
  const help = $('search-help');
  const key = examples.map((asset) => asset.symbol).join(',');
  if (help.dataset.examples === key) return;
  help.dataset.examples = key;
  help.replaceChildren();
  if (!examples.length) {
    help.textContent = 'Choose a team catalog asset. API support appears after the database catalog loads.';
    return;
  }
  help.append('Try ');
  examples.forEach((asset, index) => {
    if (index) help.append(index === examples.length - 1 ? examples.length === 2 ? ' or ' : ', or ' : ', ');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'example-link';
    button.dataset.asset = asset.symbol;
    button.textContent = asset.symbol;
    help.append(button);
  });
  help.append('.');
}

function directoryFocus() {
  const active = document.activeElement;
  if (!list.contains(active)) return null;
  const button = active.closest('button');
  if (!button) return null;
  return {
    symbol: button.dataset.watchSymbol || button.dataset.asset,
    kind: button.classList.contains('watch-button') ? 'watch' : button.classList.contains('row-quote-button') ? 'quote' : 'asset',
    index: [...list.children].indexOf(button.closest('tr')),
  };
}

function restoreDirectoryFocus(previous) {
  if (!previous) return;
  const rows = [...list.querySelectorAll('tr[data-symbol]')];
  const row = rows.find((item) => item.dataset.symbol === previous.symbol) || rows[Math.min(previous.index, rows.length - 1)];
  const selector = previous.kind === 'watch' ? '.watch-button' : previous.kind === 'quote' ? '.row-quote-button' : '.asset-row';
  const fallback = document.querySelector(`[data-directory-filter="${state.directoryFilter}"]`) || $('reset-filter');
  const preferred = row?.querySelector(selector);
  const target = preferred && !preferred.disabled ? preferred : row?.querySelector('.watch-button') || fallback;
  target?.focus({ preventScroll: true });
}

function updateDirectorySelection() {
  list.querySelectorAll('tr[data-symbol]').forEach((row) => {
    const selected = row.dataset.symbol === state.selectedSymbol;
    row.dataset.selected = String(selected);
    row.querySelector('.asset-row')?.setAttribute('aria-pressed', String(selected));
  });
}

function tableNote(text) {
  const note = document.createElement('span');
  note.className = 'table-note';
  note.textContent = text;
  return note;
}

function renderDirectory(query = '') {
  const previousFocus = directoryFocus();
  const term = query.trim().replace(/\s+/g, ' ').toLowerCase();
  const watchedCount = directory.filter((asset) => watchlist.has(asset.symbol)).length;
  const matches = directory.filter((asset) => (state.directoryFilter !== 'watchlist' || watchlist.has(asset.symbol)) &&
    (asset.symbol.toLowerCase().includes(term) || asset.name.toLowerCase().includes(term)));
  if (state.sort !== 'directory') {
    const direction = state.sort === 'name-desc' ? -1 : 1;
    matches.sort((a, b) => direction * (a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.symbol.localeCompare(b.symbol)));
  }
  list.replaceChildren();
  for (const asset of matches) {
    const item = document.createElement('tr');
    item.className = 'market-row';
    item.dataset.symbol = asset.symbol;
    item.dataset.selected = String(asset.symbol === state.selectedSymbol);
    const watchCell = document.createElement('td');
    watchCell.className = 'table-watch';
    const watchButton = document.createElement('button');
    watchButton.type = 'button';
    watchButton.className = 'watch-button';
    watchButton.dataset.watchSymbol = asset.symbol;
    const watched = watchlist.has(asset.symbol);
    watchButton.textContent = watched ? '★' : '☆';
    watchButton.setAttribute('aria-pressed', String(watched));
    watchButton.title = `${watched ? 'Remove' : 'Add'} ${asset.name} ${watched ? 'from' : 'to'} watchlist`;
    watchButton.setAttribute('aria-label', watchButton.title);
    watchCell.append(watchButton);
    const assetCell = document.createElement('td');
    assetCell.className = 'table-asset';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'asset-row';
    button.dataset.asset = asset.symbol;
    button.setAttribute('aria-pressed', String(asset.symbol === state.selectedSymbol));
    button.setAttribute('aria-label', `Look up ${asset.name} (${asset.symbol})`);
    button.disabled = state.rateLimitedUntil > Date.now();
    const mark = document.createElement('span');
    mark.className = 'asset-symbol-mark';
    mark.setAttribute('aria-hidden', 'true');
    setSymbolMark(mark, asset.symbol);
    const label = document.createElement('span');
    label.className = 'asset-row-label';
    const name = document.createElement('span');
    name.className = 'asset-row-name';
    name.textContent = asset.name;
    const symbol = document.createElement('span');
    symbol.className = 'asset-row-symbol';
    symbol.textContent = asset.symbol;
    label.append(name, symbol);
    button.append(mark, label);
    assetCell.append(button);
    const priceCell = document.createElement('td');
    priceCell.className = 'table-price';
    const volumeCell = document.createElement('td');
    volumeCell.className = 'table-volume';
    const cached = marketCache.get(asset.symbol);
    if (usesNolanApi && asset.backendAvailable === false) {
      priceCell.append('—', tableNote('Awaiting API'));
      volumeCell.append('—', tableNote('Unavailable'));
    } else if (cached) {
      const freshness = classifyFreshness(cached.data, { staleAfterMs: APP_CONFIG.staleAfterMs });
      const volume = formatVolume(cached.data.market);
      priceCell.append(formatUsdPrice(cached.data.market.priceUsd), tableNote(freshness.badge));
      volumeCell.append(volume.display, tableNote(volume.available ? volume.unitLabel : 'Unavailable'));
      const receivedAt = cached.data.retrievedAt;
      const receivedDate = receivedAt ? new Date(receivedAt) : null;
      priceCell.title = receivedDate && Number.isFinite(receivedDate.getTime())
        ? `Response received ${timestamp.format(receivedDate)} UTC. ${freshness.description}` : freshness.description;
      volumeCell.title = volume.exact;
    } else {
      priceCell.append('—', tableNote('View price'));
      volumeCell.append('—', tableNote('Not requested'));
    }
    const actionCell = document.createElement('td');
    actionCell.className = 'table-action';
    const action = document.createElement('button');
    action.type = 'button';
    action.className = 'row-quote-button';
    action.dataset.asset = asset.symbol;
    action.textContent = usesNolanApi && asset.backendAvailable === false ? 'Status' : cached ? 'Details' : 'View';
    action.setAttribute('aria-label', `${usesNolanApi && asset.backendAvailable === false ? 'View API support status for' : cached ? 'View details for' : 'Request price for'} ${asset.name}`);
    action.disabled = state.rateLimitedUntil > Date.now();
    actionCell.append(action);
    item.append(watchCell, assetCell, priceCell, volumeCell, actionCell);
    list.append(item);
  }
  $('asset-count').textContent = String(matches.length);
  $('summary-asset-count').textContent = String(directory.length);
  $('watchlist-count').textContent = String(watchedCount);
  $('asset-sort').value = state.sort;
  $('asset-name-column').setAttribute('aria-sort', state.sort === 'name-asc' ? 'ascending' : state.sort === 'name-desc' ? 'descending' : 'none');
  $('clear-search').hidden = input.value.length === 0;
  document.querySelectorAll('[data-directory-filter]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.directoryFilter === state.directoryFilter));
  });
  $('directory-empty').hidden = matches.length > 0;
  $('directory-empty-message').textContent = state.directoryFilter === 'watchlist' && watchedCount === 0
    ? 'Your watchlist is empty. Use the stars beside assets to add them.'
    : state.directoryFilter === 'watchlist' ? 'No watchlist assets match your search.'
      : !directory.length ? usesNolanApi ? 'The database catalog has not loaded yet.' : 'Search by a full name or ticker to look up an asset.'
        : 'No assets match your search. Try another name or ticker.';
  $('reset-filter').textContent = state.directoryFilter === 'watchlist' ? 'Browse all assets' : 'Clear search';
  restoreDirectoryFocus(previousFocus);
  return matches;
}

function announce(message) { $('search-status').textContent = message; }

function setApiNotice(message) {
  if (isDemo) return;
  const copy = document.createElement('p');
  copy.textContent = message;
  $('mode-notice').replaceChildren(copy);
}

function setPanelState(panelState) {
  $('loading-state').hidden = panelState !== 'loading';
  $('asset-content').hidden = panelState !== 'ready';
  $('error-state').hidden = panelState !== 'error';
  $('detail-panel').setAttribute('aria-busy', String(panelState === 'loading'));
}

function clearSelection() {
  state.response = null;
  state.selectedSymbol = '';
  updateDirectorySelection();
}

function showError(error, query) {
  clearSelection();
  state.errorCode = error.code || 'UNKNOWN';
  const code = state.errorCode.toUpperCase();
  const noMatch = /NOT_FOUND|INVALID_SYMBOL/.test(code);
  const empty = /^(EMPTY_QUERY|INVALID_QUERY)$/.test(code) && !query.trim();
  $('error-eyebrow').textContent = noMatch || empty ? 'Search results' : 'Connection error';
  $('error-title').textContent = noMatch ? 'No cryptocurrency found' : empty ? 'Enter a name or ticker' : 'Unable to load data';
  $('error-description').textContent = noMatch
    ? isDemo ? `We couldn’t find “${query}”. Try a name like Ethereum or a ticker like BTC, or choose from the demo directory.`
      : `No cryptocurrency matched “${query}”. ${usesNolanApi ? 'Use a full name or ticker from the team catalog.' : 'Try another full cryptocurrency name or ticker.'}`
    : empty ? 'Enter a cryptocurrency name or ticker, or choose an asset from the directory.'
      : error instanceof ApiError ? error.message : 'The asset could not be loaded. Please try again.';
  if (noMatch || empty || code === 'CONFIGURATION_ERROR') state.autoRefreshQuery = '';
  const supported = directory.filter((asset) => asset.backendAvailable !== false);
  const suggestion = supported.find((asset) => asset.symbol === 'BTC') || supported[0] || directory[0];
  $('error-action').textContent = noMatch || empty ? `Look up ${suggestion?.name || 'Bitcoin'}` : 'Try again';
  $('error-action').dataset.action = noMatch || empty ? 'suggestion' : 'retry';
  $('error-action').dataset.suggestedSymbol = suggestion?.symbol || 'BTC';
  input.setAttribute('aria-invalid', String(noMatch || empty));
  setApiNotice('The latest lookup did not return a quote. Review the message below and search again.');
  setPanelState('error');
  announce(`${$('error-title').textContent} ${$('error-description').textContent}`);
}

function showAwaitingSupport(asset) {
  state.controller?.abort();
  state.requestId += 1;
  state.controller = null;
  state.loading = false;
  state.lastQuery = asset.symbol;
  state.autoRefreshQuery = '';
  clearSelection();
  state.selectedSymbol = asset.symbol;
  updateDirectorySelection();
  $('error-eyebrow').textContent = 'Team catalog';
  $('error-title').textContent = 'Awaiting backend support';
  $('error-description').textContent = `${asset.name} (${asset.symbol}) is in the requested team catalog, but the database API has not returned this asset. Category: ${asset.category}. No market request was sent.`;
  const suggestion = directory.find((item) => item.backendAvailable === true);
  $('error-action').textContent = suggestion ? `Look up ${suggestion.name}` : 'Reload database catalog';
  $('error-action').dataset.action = suggestion ? 'suggestion' : 'catalog';
  $('error-action').dataset.suggestedSymbol = suggestion?.symbol || '';
  input.removeAttribute('aria-invalid');
  setPanelState('error');
  updateRefreshControl();
  announce(`${asset.name}: awaiting backend support. No market request was sent.`);
}

function renderAsset(response, { announceResult = true } = {}) {
  const { data, mode } = response;
  const simulated = data.simulated;
  marketCache.set(data.symbol, response);
  if (response.contract === 'nolan-v1') {
    state.directoryLoaded = true;
    $('directory-caption').textContent = 'Team catalog. Only API-supported assets can return prices.';
    if (response.directory) {
      directory = teamDirectory(response.directory);
      renderApiExamples(directory);
    }
  }
  $('detail-symbol').textContent = data.symbol;
  $('detail-name').textContent = data.name;
  setSymbolMark($('detail-icon'), data.symbol);
  const price = formatUsdPrice(data.market.priceUsd);
  const volume = formatVolume(data.market);
  const marketAvailable = response.marketStatus !== 'unavailable' && data.market.priceUsd !== null;
  $('detail-price').textContent = price;
  $('detail-volume').textContent = volume.display;
  $('volume-unit').textContent = volume.unitLabel === 'USD' ? '(USD)' : volume.unitLabel ? `(${volume.unitLabel})` : '';
  $('detail-price').setAttribute('aria-label', marketAvailable ? `Price: ${price}${simulated ? ', simulated' : ''}` : 'Price unavailable');
  $('detail-volume').setAttribute('aria-label', `24-hour volume: ${volume.exact}${simulated ? ', simulated' : ''}`);
  $('price-caption').textContent = !marketAvailable ? 'Market quote unavailable' : simulated ? 'Simulated price' : 'Last-traded price';
  $('volume-caption').textContent = volume.exact;
  $('market-notice').hidden = marketAvailable;
  $('market-notice').textContent = !marketAvailable
    ? `Market data is unavailable. ${response.marketError?.message || 'The API did not return a usable quote.'} The database profile is shown below.` : '';
  $('detail-category').textContent = data.category || 'Not provided by the API';
  $('detail-description').textContent = data.description || 'A description was not provided by the API.';
  $('detail-category').classList.toggle('missing-field', !data.category);
  $('detail-description').classList.toggle('missing-field', !data.description);
  renderFreshness();
  renderPriceChart(response);
  $('profile-source-copy').textContent = simulated && mode === 'demo'
    ? 'Sample asset profiles.'
    : response.contract === 'nolan-v1' ? 'Asset profiles are returned by the database API.' : `Asset profile source: ${data.sources.profile}.`;
  $('market-source-copy').textContent = simulated && mode === 'demo'
    ? 'Fixed sample quotes.'
    : !marketAvailable ? 'Market quote unavailable.' : simulated ? 'Simulated quotes.'
      : data.sources.market === 'Coinbase Exchange' ? 'Quotes come from Coinbase Exchange.' : `Quote source: ${data.sources.market || 'Not provided by the API'}.`;
  $('profile-source-tag').textContent = mode === 'demo' ? 'Sample data' : response.contract === 'nolan-v1' ? 'Database' : 'Via API';
  $('market-source-tag').textContent = !marketAvailable ? 'Unavailable' : simulated ? 'Simulated' : 'Via API';
  if (!isDemo) {
    setApiNotice(simulated ? 'The middleware marked this response as simulated.'
      : response.warnings?.length ? 'API response received. Some profile and market information is unavailable; those fields are marked below.'
        : 'Data retrieved through Flask. The selected asset refreshes every 30 seconds while this tab is visible. Check its source and timestamp.');
  }
  state.selectedSymbol = data.symbol;
  renderDirectory(input.value);
  setPanelState('ready');
  if (announceResult || !marketAvailable) announce(`${data.name} (${data.symbol}) loaded. ${simulated ? 'Simulated data. ' : ''}${marketAvailable ? `Price ${price}. 24-hour volume ${volume.exact}.` : 'Market data unavailable. Database profile shown.'}`);
}

async function search(query, { scroll = false, refresh = false, automatic = false } = {}) {
  const term = query.trim().replace(/\s+/g, ' ').toLowerCase();
  if (excludedQueries.has(term)) {
    state.controller?.abort();
    state.requestId += 1;
    state.controller = null;
    state.loading = false;
    state.autoRefreshQuery = '';
    showError(new ApiError('NOT_FOUND', 'This asset is not included in the team catalog.'), query);
    updateRefreshControl();
    return;
  }
  if (state.rateLimitedUntil > Date.now()) {
    if (!automatic) announce(`The API asked us to wait. Try again in ${Math.ceil((state.rateLimitedUntil - Date.now()) / 1000)} seconds.`);
    updateRefreshControl();
    return;
  }
  if (usesNolanApi && !state.directoryLoaded) {
    if (!automatic) state.lastQuery = query.trim();
    if (!state.loading) initializeNolanDirectory();
    else if (!automatic) announce('The database catalog is loading. Please wait before selecting an asset.');
    return;
  }
  const catalogAsset = directory.find((asset) => asset.symbol.toLowerCase() === term || asset.name.toLowerCase() === term);
  if (usesNolanApi && !catalogAsset) {
    state.controller?.abort();
    state.requestId += 1;
    state.controller = null;
    state.loading = false;
    showError(new ApiError(term ? 'NOT_FOUND' : 'EMPTY_QUERY', 'Choose an asset from the team catalog.'), query);
    updateRefreshControl();
    return;
  }
  if (usesNolanApi && catalogAsset?.backendAvailable === false) {
    showAwaitingSupport(catalogAsset);
    if (scroll && window.matchMedia('(max-width: 1000px)').matches) $('detail-panel').scrollIntoView({ block: 'start' });
    return;
  }
  if (state.loading && query.trim().toLowerCase() === state.lastQuery.toLowerCase()) return;
  const sameAsset = state.response && [state.response.data.symbol, state.response.data.name].some((value) => value.toLowerCase() === term);
  if ((refresh || sameAsset) && (state.loading || state.cooldownUntil > Date.now())) {
    if (!automatic) announce('Please wait for the refresh cooldown to finish.');
    return;
  }
  state.controller?.abort();
  const requestId = ++state.requestId;
  const controller = new AbortController();
  state.controller = controller;
  state.lastQuery = query.trim();
  state.autoRefreshQuery = catalogAsset?.symbol || query.trim();
  state.loading = true;
  state.cooldownUntil = Date.now() + (APP_CONFIG.refreshCooldownMs || 5000);
  input.removeAttribute('aria-invalid');
  if (automatic && state.response) {
    // Keep the selected profile, chart and keyboard focus during a background refresh.
    $('detail-panel').setAttribute('aria-busy', 'true');
  } else {
    clearSelection();
    setPanelState('loading');
  }
  updateRefreshControl();
  if (!automatic) {
    setApiNotice('Requesting an asset snapshot through the configured middleware route…');
    announce('Retrieving asset profile.');
  }
  if (scroll && window.matchMedia('(max-width: 1000px)').matches) $('detail-panel').scrollIntoView({ block: 'start' });
  try {
    // The displayed team name can differ from the database name; resolve by its actual symbol.
    let lookupQuery = usesNolanApi && catalogAsset ? catalogAsset.symbol : query;
    if (isDemo && query.trim()) {
      const matches = directory.filter((asset) => asset.symbol.toLowerCase().includes(query.trim().toLowerCase()) || asset.name.toLowerCase().includes(query.trim().toLowerCase()));
      if (matches.length === 1) lookupQuery = matches[0].symbol;
    }
    const response = await lookupAsset(lookupQuery, { signal: controller.signal });
    if (requestId !== state.requestId) return;
    if (response.data.symbol === 'XMR') throw new ApiError('NOT_FOUND', 'This asset is not included in the team catalog.');
    state.response = response;
    state.autoRefreshQuery = response.data.symbol;
    applyRateLimit(response.marketError);
    renderAsset(response, { announceResult: !automatic });
  } catch (error) {
    if (requestId !== state.requestId || controller.signal.aborted) return;
    applyRateLimit(error);
    showError(error, query);
  } finally {
    if (requestId === state.requestId) {
      state.loading = false;
      state.controller = null;
      state.nextRefreshAt = Date.now() + AUTO_REFRESH_MS;
      updateRefreshControl();
    }
  }
}

$('refresh-asset').addEventListener('click', () => search(state.selectedSymbol || state.lastQuery, { refresh: true }));
function maybeAutoRefresh() {
  if (document.hidden || state.loading || !state.autoRefreshQuery || Date.now() < state.nextRefreshAt ||
    Date.now() < state.cooldownUntil || Date.now() < state.rateLimitedUntil) return;
  if (usesNolanApi && !state.directoryLoaded) initializeNolanDirectory();
  else search(state.autoRefreshQuery, { refresh: true, automatic: true });
}
setInterval(() => {
  updateRefreshControl();
  maybeAutoRefresh();
}, 1000);
function updateDisplayedFreshness() {
  renderFreshness();
  // Reclassify saved table snapshots without requesting new data.
  renderDirectory(input.value);
}
setInterval(updateDisplayedFreshness, 30000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    updateDisplayedFreshness();
    maybeAutoRefresh();
  }
  updateRefreshControl();
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  renderDirectory(input.value);
  search(input.value, { scroll: true });
});
input.addEventListener('input', () => {
  input.removeAttribute('aria-invalid');
  const matches = renderDirectory(input.value);
  announce(`${matches.length} catalog ${matches.length === 1 ? 'match' : 'matches'}. Press Enter to look up the asset.`);
});
document.addEventListener('click', (event) => {
  const watchButton = event.target.closest('button[data-watch-symbol]');
  if (watchButton) {
    const symbol = watchButton.dataset.watchSymbol;
    const asset = directory.find((item) => item.symbol === symbol);
    if (!asset) return;
    const removed = watchlist.has(symbol);
    if (removed) watchlist.delete(symbol);
    else watchlist.add(symbol);
    const saved = saveWatchlist();
    renderDirectory(input.value);
    announce(`${asset.name} ${removed ? 'removed from' : 'added to'} your watchlist.${saved ? '' : ' Saved for this visit; browser storage is unavailable.'}`);
    return;
  }
  const filterButton = event.target.closest('button[data-directory-filter]');
  if (filterButton) {
    const filter = filterButton.dataset.directoryFilter;
    if (!['all', 'watchlist'].includes(filter)) return;
    state.directoryFilter = filter;
    const matches = renderDirectory(input.value);
    announce(`${matches.length} ${filter === 'watchlist' ? 'watchlist' : 'catalog'} assets shown.`);
    return;
  }
  const button = event.target.closest('button[data-asset]');
  if (!button) return;
  input.value = '';
  renderDirectory();
  search(button.dataset.asset, { scroll: true });
});
$('asset-sort').addEventListener('change', (event) => {
  state.sort = ['directory', 'name-asc', 'name-desc'].includes(event.target.value) ? event.target.value : 'directory';
  renderDirectory(input.value);
  announce(state.sort === 'directory' ? 'Catalog order restored.' : `Assets sorted by name, ${state.sort === 'name-asc' ? 'A to Z' : 'Z to A'}.`);
});
$('clear-search').addEventListener('click', () => {
  input.value = '';
  const matches = renderDirectory();
  input.focus();
  announce(`Search cleared. ${matches.length} assets shown.`);
});
$('reset-filter').addEventListener('click', () => {
  state.directoryFilter = 'all';
  input.value = '';
  renderDirectory();
  input.focus();
  announce('Showing all available catalog assets.');
});
window.addEventListener('storage', (event) => {
  if (event.key !== WATCHLIST_KEY && event.key !== null) return;
  watchlist = readWatchlist();
  renderDirectory(input.value);
});
$('error-action').addEventListener('click', () => {
  if (usesNolanApi && (!state.directoryLoaded || $('error-action').dataset.action === 'catalog')) {
    initializeNolanDirectory();
    return;
  }
  if ($('error-action').dataset.action === 'suggestion') { input.value = ''; renderDirectory(); search($('error-action').dataset.suggestedSymbol); }
  else search(state.lastQuery);
});
document.addEventListener('keydown', (event) => {
  if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey || dialog.open) return;
  const target = event.target;
  if (target instanceof HTMLElement && (target.matches('input, textarea, select') || target.isContentEditable)) return;
  event.preventDefault();
  input.focus();
});

$('view-json').addEventListener('click', () => {
  if (!state.response) return;
  $('json-title').textContent = `${state.response.data.symbol} · Raw response`;
  $('json-code').textContent = JSON.stringify(state.response.raw, null, 2);
  const isSplitResponse = state.response.contract === 'nolan-v1';
  $('json-description').textContent = isSplitResponse
    ? 'This page combines two API responses. The original database catalog and market response are preserved below. A failed non-JSON market request is represented by null.'
    : 'The response used to display this asset.';
  $('json-mode-label').textContent = state.response.mode === 'demo' ? 'Simulated demo response' : isSplitResponse ? 'Two API responses' : 'API response';
  $('json-endpoint-description').textContent = state.response.mode === 'demo'
    ? 'Local sample data. No API endpoint was called.'
    : isSplitResponse ? 'Combined in the browser. A single combined JSON endpoint is not available in this backend version.' : 'JSON returned by the configured API route.';
  $('json-endpoint').hidden = !state.response.endpointUrl;
  if (state.response.endpointUrl) $('json-endpoint').href = state.response.endpointUrl;
  else $('json-endpoint').removeAttribute('href');
  for (const [kind, id] of [['profile', 'json-profile-endpoint'], ['market', 'json-market-endpoint']]) {
    const url = state.response.endpointUrls?.[kind];
    $(id).hidden = !url;
    if (url) $(id).href = url;
    else $(id).removeAttribute('href');
  }
  $('copy-status').textContent = '';
  $('copy-json').textContent = 'Copy JSON';
  dialog.showModal();
  document.body.classList.add('dialog-open');
});
$('close-json').addEventListener('click', () => dialog.close());
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  $('view-json').focus({ preventScroll: true });
});
dialog.addEventListener('keydown', (event) => {
  if (event.key !== 'Tab') return;
  // Keep focus within the modal, including WebViews whose native dialog
  // behavior allows Tab to leave the document at either boundary.
  const controls = [...dialog.querySelectorAll('button, a[href], [tabindex="0"]')]
    .filter((control) => !control.disabled && control.getClientRects().length > 0);
  const first = controls[0];
  const last = controls.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last?.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first?.focus();
  }
});
dialog.addEventListener('click', (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
$('copy-json').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText($('json-code').textContent);
    $('copy-json').textContent = 'Copied';
    $('copy-status').textContent = 'JSON copied to clipboard.';
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents($('json-code'));
    selection.removeAllRanges();
    selection.addRange(range);
    $('copy-status').textContent = 'Clipboard unavailable. JSON selected; use your browser’s copy command.';
    $('json-output').focus();
  }
});

if (!isDemo) {
  $('directory-title').textContent = 'Crypto market prices';
  $('directory-empty-message').textContent = usesNolanApi ? 'No matching assets in the database catalog.' : 'Use the search field to look up an asset.';
  $('directory-caption').textContent = usesNolanApi ? 'Loading database profiles…' : 'Search using the configured API.';
  $('profile-source-copy').textContent = 'Asset profiles are returned by the database API.';
  $('market-source-copy').textContent = 'Quotes come from Coinbase Exchange.';
  $('profile-source-tag').textContent = 'Awaiting response';
  $('market-source-tag').textContent = 'Awaiting response';
  renderApiExamples([]);
  setApiNotice('Middleware mode. Requests use the configured API route. Data source and timestamp will appear with a successful response.');
} else {
  $('directory-title').textContent = 'Sample crypto prices';
  $('directory-caption').textContent = 'Fixed sample prices and volumes. No live market connection.';
  $('profile-source-copy').textContent = 'Sample asset profiles.';
  $('market-source-copy').textContent = 'Fixed sample quotes.';
  $('profile-source-tag').textContent = 'Sample data';
  $('market-source-tag').textContent = 'Simulated';
  $('faq-live-answer').textContent = 'This preview uses fixed sample prices and volumes. It has no live market connection. The sample label beside each asset identifies these demonstration values.';
  $('faq-missing-answer').textContent = 'This preview contains sample asset profiles. In the live website, fields absent from the database or market API remain unavailable.';
  $('faq-refresh-answer').textContent = 'The selected asset reloads on page load and every 30 seconds while this tab is visible. You can also reload it manually. Sample prices remain fixed.';
}

async function initializeNolanDirectory() {
  if (state.rateLimitedUntil > Date.now()) return;
  state.controller?.abort();
  const requestIdAtStart = ++state.requestId;
  const controller = new AbortController();
  state.controller = controller;
  state.loading = true;
  setPanelState('loading');
  updateRefreshControl();
  $('directory-caption').textContent = 'Loading database profiles…';
  try {
    const assets = await loadAssetDirectory({ signal: controller.signal });
    if (requestIdAtStart !== state.requestId || controller.signal.aborted) return;
    directory = teamDirectory(assets);
    renderApiExamples(directory);
    renderDirectory(input.value);
    const supported = directory.filter((asset) => asset.backendAvailable === true);
    if (!supported.length) throw new ApiError('EMPTY_CATALOG', 'No team-catalog assets are available from the database API yet. The catalog remains visible, but prices require backend support.');
    state.directoryLoaded = true;
    $('directory-caption').textContent = 'Team catalog. Only API-supported assets can return prices.';
    if (state.requestId === requestIdAtStart) {
      const firstSymbol = supported.some((asset) => asset.symbol === 'BTC') ? 'BTC' : supported[0].symbol;
      state.loading = false;
      search(state.lastQuery || firstSymbol);
    }
  } catch (error) {
    if (requestIdAtStart !== state.requestId || controller.signal.aborted) return;
    applyRateLimit(error);
    $('directory-caption').textContent = 'The database catalog could not be loaded.';
    showError(error, '');
  } finally {
    if (state.requestId === requestIdAtStart) {
      state.loading = false;
      state.controller = null;
      state.nextRefreshAt = Date.now() + AUTO_REFRESH_MS;
      updateRefreshControl();
    }
  }
}

renderDirectory();
if (usesNolanApi) initializeNolanDirectory();
else search('BTC');
