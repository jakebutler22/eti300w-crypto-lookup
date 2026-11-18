import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { TEAM_ASSETS } from '../data/demo-assets.js';
import { classifyFreshness, formatUsdPrice, formatVolume } from '../data-state.js';

// Execute the actual, unmodified UI functions without a browser dependency.
// The small DOM below models identity, focus and image error events; Safari
// separately verifies layout and real image loading.
const source = await readFile(new URL('../script.js', import.meta.url), 'utf8');
function productionFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Missing production function ${name}`);
  const end = source.indexOf('\n}', start);
  assert.notEqual(end, -1, `Missing closing brace for ${name}`);
  return source.slice(start, end + 2);
}

class TextNode {
  constructor(text) { this.textContent = String(text); this.parentNode = null; }
}

class Element {
  constructor(tag, ownerDocument) {
    this.tagName = tag.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.parentNode = null;
    this.childNodes = [];
    this.dataset = {};
    this.attributes = new Map();
    this.listeners = new Map();
    this.className = '';
    this.hidden = false;
    this.disabled = false;
    this.value = '';
    this.classList = {
      contains: (name) => this.className.split(/\s+/).includes(name),
      add: (...names) => { this.className = [...new Set([...this.className.split(/\s+/).filter(Boolean), ...names])].join(' '); },
      toggle: (name, force) => {
        const classes = new Set(this.className.split(/\s+/).filter(Boolean));
        const add = force ?? !classes.has(name);
        if (add) classes.add(name); else classes.delete(name);
        this.className = [...classes].join(' ');
        return add;
      },
    };
  }
  get children() { return this.childNodes.filter((node) => node instanceof Element); }
  get firstChild() { return this.childNodes[0] || null; }
  get firstElementChild() { return this.children[0] || null; }
  get textContent() { return this.childNodes.map((node) => node.textContent).join(''); }
  set textContent(value) { this.replaceChildren(String(value)); }
  append(...nodes) { for (const node of nodes) this.insertBefore(node, null); }
  appendChild(node) { this.append(node); return node; }
  insertBefore(value, reference) {
    const node = value instanceof Element || value instanceof TextNode ? value : new TextNode(value);
    if (node === reference) return node;
    if (reference !== null && reference.parentNode !== this) throw new Error('Reference is not a child');
    if (node.parentNode) node.parentNode.removeChild(node);
    const index = reference === null ? this.childNodes.length : this.childNodes.indexOf(reference);
    this.childNodes.splice(index, 0, node);
    node.parentNode = this;
    return node;
  }
  removeChild(node) {
    const index = this.childNodes.indexOf(node);
    if (index === -1) throw new Error('Node is not a child');
    if (node instanceof Element && node.contains(this.ownerDocument.activeElement)) {
      this.ownerDocument.activeElement = this.ownerDocument.body;
    }
    this.childNodes.splice(index, 1);
    node.parentNode = null;
    return node;
  }
  remove() { this.parentNode?.removeChild(this); }
  replaceChildren(...nodes) {
    for (const node of [...this.childNodes]) this.removeChild(node);
    this.append(...nodes);
  }
  contains(node) { return node === this || this.children.some((child) => child.contains(node)); }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  removeAttribute(name) { this.attributes.delete(name); }
  matches(selector) {
    if (selector.startsWith('.')) return this.classList.contains(selector.slice(1));
    const match = selector.match(/^([a-z]+)?(?:\[data-([a-z-]+)(?:="([^"]*)")?\])?$/i);
    if (!match) throw new Error(`Unsupported test selector: ${selector}`);
    if (match[1] && this.tagName !== match[1].toUpperCase()) return false;
    if (!match[2]) return true;
    const key = match[2].replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    return Object.hasOwn(this.dataset, key) && (match[3] === undefined || this.dataset[key] === match[3]);
  }
  querySelectorAll(selector) {
    return this.children.flatMap((child) => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) { return this.matches(selector) ? this : this.parentNode?.closest(selector) || null; }
  focus() { this.ownerDocument.activeElement = this; }
  addEventListener(type, callback, options = {}) {
    const entries = this.listeners.get(type) || [];
    entries.push({ callback, once: options.once });
    this.listeners.set(type, entries);
  }
  emit(type) {
    for (const entry of [...(this.listeners.get(type) || [])]) {
      if (entry.once) this.listeners.set(type, this.listeners.get(type).filter((item) => item !== entry));
      entry.callback.call(this, { type, target: this });
    }
  }
}

function page() {
  let imageCount = 0;
  const document = {
    createElement(tag) { if (tag === 'img') imageCount += 1; return new Element(tag, this); },
    querySelector(selector) { return this.body.querySelector(selector); },
    querySelectorAll(selector) { return this.body.querySelectorAll(selector); },
  };
  document.body = document.createElement('body');
  document.activeElement = document.body;
  const ids = new Map();
  for (const id of [
    'asset-count', 'summary-asset-count', 'watchlist-count', 'asset-sort',
    'asset-name-column', 'clear-search', 'directory-empty', 'directory-empty-message',
    'reset-filter', 'detail-icon',
  ]) {
    ids.set(id, document.createElement('span'));
    document.body.append(ids.get(id));
  }
  const list = document.createElement('tbody');
  const input = document.createElement('input');
  document.body.append(list, input);
  for (const filter of ['all', 'watchlist']) {
    const button = document.createElement('button');
    button.dataset.directoryFilter = filter;
    document.body.append(button);
  }
  const globals = {
    document, list, input, $: (id) => ids.get(id),
    directory: TEAM_ASSETS.map((asset) => ({ ...asset, backendAvailable: true })),
    directoryRows: new Map(), failedLogos: new Set(), watchlist: new Set(),
    marketCache: new Map(), rowFailures: new Map(),
    state: { directoryFilter: 'all', sort: 'directory', selectedSymbol: 'BTC', directoryLoaded: true, batchLoading: false, rateLimitedUntil: 0 },
    usesNolanApi: true, APP_CONFIG: { staleAfterMs: 300000 },
    timestamp: new Intl.DateTimeFormat('en-US', { timeZone: 'UTC' }),
    classifyFreshness, formatUsdPrice, formatVolume,
  };
  const context = vm.createContext(globals);
  vm.runInContext([
    'setSymbolMark', 'directoryFocus', 'restoreDirectoryFocus',
    'updateDirectorySelection', 'tableNote', 'createDirectoryRow', 'renderDirectory',
  ].map(productionFunction).join('\n\n'), context);
  return {
    ...globals, ids, context,
    render: (query = '') => context.renderDirectory(query),
    mark: (element, symbol) => context.setSymbolMark(element, symbol),
    imageCount: () => imageCount,
    row: (symbol) => list.children.find((row) => row.dataset.symbol === symbol),
  };
}

function quote(symbol, price = 123) {
  return {
    marketStatus: 'available',
    data: {
      symbol, simulated: false, retrievedAt: new Date().toISOString(),
      market: { priceUsd: price, volume24h: 456, volumeUnit: symbol, asOf: new Date().toISOString() },
    },
  };
}

test('all quote and freshness updates preserve existing table rows and images', () => {
  const ui = page();
  ui.render();
  const originals = new Map(ui.list.children.map((row) => [row.dataset.symbol, { row, image: row.querySelector('img') }]));
  assert.equal(originals.size, 27);
  assert.equal(ui.imageCount(), 27);
  const focused = ui.row('ETH').querySelector('.row-quote-button');
  focused.focus();
  for (const { symbol } of TEAM_ASSETS) {
    ui.marketCache.set(symbol, quote(symbol));
    ui.render();
  }
  ui.render(); // The separate freshness tick must not recreate image elements.
  for (const [symbol, original] of originals) {
    assert.equal(ui.row(symbol), original.row, `${symbol} row was replaced`);
    assert.equal(ui.row(symbol).querySelector('img'), original.image, `${symbol} image was replaced`);
  }
  assert.equal(ui.imageCount(), 27, 'Quote progress must not create more image requests');
  assert.equal(ui.document.activeElement, focused);
  assert.match(ui.row('BTC').querySelector('.table-price').textContent, /\$123\.00/);
  assert.match(ui.row('BTC').querySelector('.table-volume').textContent, /456/);
});

test('sorting and filtering retain cached row logos and watch controls', () => {
  const ui = page();
  ui.render();
  const btc = ui.row('BTC');
  const image = btc.querySelector('img');
  const watch = btc.querySelector('.watch-button');
  watch.focus();
  ui.context.state.sort = 'name-asc';
  ui.render();
  assert.equal(ui.row('BTC'), btc);
  assert.equal(ui.document.activeElement, watch);
  const names = ui.list.children.map((row) => row.querySelector('.asset-row-name').textContent);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })));
  ui.render('ETH');
  assert.equal(ui.row('BTC'), undefined);
  ui.render('');
  assert.equal(ui.row('BTC'), btc);
  assert.equal(btc.querySelector('img'), image);
  ui.context.watchlist.add('BTC');
  ui.context.state.directoryFilter = 'watchlist';
  ui.render();
  assert.equal(ui.list.children.length, 1);
  assert.equal(ui.row('BTC'), btc);
  assert.equal(watch.getAttribute('aria-pressed'), 'true');
  assert.equal(ui.imageCount(), 27);
});

test('reused rows still receive updated names, selected state and support status', () => {
  const ui = page();
  ui.render();
  const btc = ui.row('BTC');
  const index = ui.context.directory.findIndex((asset) => asset.symbol === 'BTC');
  ui.context.directory[index] = { ...ui.context.directory[index], name: 'Updated Bitcoin', backendAvailable: false };
  ui.context.state.selectedSymbol = 'ETH';
  ui.render();
  assert.equal(ui.row('BTC'), btc);
  assert.equal(btc.querySelector('.asset-row-name').textContent, 'Updated Bitcoin');
  assert.equal(btc.querySelector('.asset-row').getAttribute('aria-label'), 'Look up Updated Bitcoin (BTC)');
  assert.equal(btc.dataset.selected, 'false');
  assert.equal(ui.row('ETH').dataset.selected, 'true');
  assert.match(btc.querySelector('.table-price').textContent, /Awaiting API/);
  assert.equal(btc.querySelector('.row-quote-button').textContent, 'Status');
});

test('refreshing the same detail asset preserves its image element', () => {
  const ui = page();
  const mark = ui.ids.get('detail-icon');
  ui.mark(mark, 'BTC');
  const image = mark.querySelector('img');
  ui.mark(mark, 'BTC');
  ui.mark(mark, 'BTC');
  assert.equal(mark.querySelector('img'), image);
  assert.equal(ui.imageCount(), 1);
});

test('a failed logo stays as a stable fallback instead of requesting it repeatedly', () => {
  const ui = page();
  ui.render();
  const btc = ui.row('BTC');
  const mark = btc.querySelector('.asset-symbol-mark');
  mark.querySelector('img').emit('error');
  assert.equal(mark.textContent, 'BTC');
  assert.equal(mark.querySelector('img'), null);
  const before = ui.imageCount();
  ui.mark(mark, 'BTC');
  ui.render();
  ui.render('ETH');
  ui.render('');
  ui.mark(ui.ids.get('detail-icon'), 'BTC');
  assert.equal(ui.imageCount(), before, 'Known failed URLs must not be retried by renders or another view');
  assert.equal(ui.row('BTC'), btc);
  assert.equal(mark.textContent, 'BTC');
  assert.equal(ui.ids.get('detail-icon').textContent, 'BTC');
});

test('a delayed failure from the previous detail asset cannot overwrite the current logo', () => {
  const ui = page();
  const mark = ui.ids.get('detail-icon');
  ui.mark(mark, 'BTC');
  const oldImage = mark.querySelector('img');
  ui.mark(mark, 'ETH');
  const current = mark.querySelector('img');
  oldImage.emit('error');
  assert.equal(mark.dataset.symbol, 'ETH');
  assert.equal(mark.querySelector('img'), current);
  assert.equal(current.src, './assets/coins/eth.svg');
  assert.equal(mark.textContent, '');
});

test('an old error remains harmless after switching back to the same symbol', () => {
  const ui = page();
  const mark = ui.ids.get('detail-icon');
  ui.mark(mark, 'BTC');
  const original = mark.querySelector('img');
  ui.mark(mark, 'ETH');
  ui.mark(mark, 'BTC');
  const current = mark.querySelector('img');
  assert.notEqual(current, original);
  original.emit('error');
  assert.equal(mark.querySelector('img'), current);
  assert.equal(ui.context.failedLogos.has('BTC'), false, 'An obsolete node does not establish failure of the current image');
});
