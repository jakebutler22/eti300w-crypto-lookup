import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { TEAM_ASSETS } from '../data/demo-assets.js';

const directory = new URL('../assets/coins/', import.meta.url);

test('every catalog coin has a unique, self-contained local SVG logo', async () => {
  const expected = TEAM_ASSETS.map(({ symbol }) => `${symbol.toLowerCase()}.svg`).sort();
  const actual = (await readdir(directory)).filter((name) => name.endsWith('.svg')).sort();
  assert.equal(expected.length, 27);
  assert.deepEqual(actual, expected);
  const hashes = new Set();
  for (const name of expected) {
    const source = await readFile(new URL(name, directory), 'utf8');
    assert.match(source, /^\s*<svg\b[^>]*xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(source, /viewBox="0 0 24 24"/);
    assert.match(source, /<path\b/);
    assert.match(source, /<\/svg>\s*$/);
    assert.doesNotMatch(source, /<(?:script|foreignObject|image)\b|\bon\w+\s*=|(?:href|src)\s*=/i, name);
    assert.doesNotMatch(source, /<!DOCTYPE|<!ENTITY/i, name);
    hashes.add(createHash('sha256').update(source).digest('hex'));
  }
  assert.equal(hashes.size, expected.length, 'Each coin must have its own mark, not a repeated placeholder.');
});

test('redistributed logo assets retain the upstream MIT notice and pinned provenance', async () => {
  const license = await readFile(new URL('LICENSE.txt', directory), 'utf8');
  assert.match(license, /MIT License/);
  assert.match(license, /Copyright \(c\) 2024 0xa3k5/);
  assert.match(license, /Permission is hereby granted, free of charge/);
  const sources = await readFile(new URL('../docs/coin-logo-sources.md', import.meta.url), 'utf8');
  assert.match(sources, /e6d3c8f6adcfa04bb76bb6a871556a8e7589862e/);
  for (const { symbol } of TEAM_ASSETS) {
    assert.ok(sources.includes(`../assets/coins/${symbol.toLowerCase()}.svg`), `${symbol} needs a source entry`);
  }
});
