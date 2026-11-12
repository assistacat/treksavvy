const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const html = readFileSync(join(__dirname, 'public/export-map.html'), 'utf8');
const source = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map(match => match[1]).join('\n');

function page(fetch) {
  let onLoad;
  const scripts = [];
  const map = { textContent: '' };
  const document = {
    createElement: () => ({}),
    head: { appendChild: script => scripts.push(script) },
    getElementById: () => map,
  };
  vm.runInNewContext(source, {
    fetch, document, console, encodeURIComponent,
    window: { addEventListener: (_, callback) => { onLoad = callback; } },
  });
  return { load: () => onLoad(), scripts, map };
}

test('loads Maps with the separately configured browser key', async () => {
  const calls = [];
  const p = page(async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => ({ browserApiKey: 'browser key&test' }) };
  });
  await p.load();
  assert.equal(calls[0].url, '/api/maps-config');
  assert.equal(calls[0].options.cache, 'no-store');
  assert.equal(p.scripts.length, 1);
  const url = new URL(p.scripts[0].src);
  assert.equal(url.origin, 'https://maps.googleapis.com');
  assert.equal(url.searchParams.get('key'), 'browser key&test');
  assert.equal(url.searchParams.get('callback'), 'initMap');
  p.scripts[0].onerror();
  assert.match(p.map.textContent, /Map unavailable/);
});

for (const [name, fetch] of [
  ['missing configuration', async () => ({ ok: false })],
  ['empty browser key', async () => ({ ok: true, json: async () => ({}) })],
  ['network failure', async () => { throw new Error('offline'); }],
]) {
  test(`shows a useful error without loading Google on ${name}`, async () => {
    const p = page(fetch);
    await p.load();
    assert.equal(p.scripts.length, 0);
    assert.match(p.map.textContent, /Map unavailable/);
  });
}
