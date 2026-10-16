import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const code = await readFile(new URL('./primus-config.js', import.meta.url), 'utf8');
const worker = (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).default;
const templates = {
  'mihomo/template.yaml': await readFile(new URL('../mihomo/template.yaml', import.meta.url), 'utf8'),
  'loon/template.lcf': await readFile(new URL('../loon/template.lcf', import.meta.url), 'utf8'),
  'VERSION.json': await readFile(new URL('../VERSION.json', import.meta.url), 'utf8'),
};
const originalFetch = globalThis.fetch;
globalThis.fetch = async url => {
  const match = Object.keys(templates).find(path => String(url).endsWith(`/main/${path}`));
  assert.ok(match, 'Worker should fetch only its repository templates/manifest');
  return new Response(templates[match]);
};
const records = new Map();
const env = { MIHOMO_KV: { get: async key => records.get(key), put: async (key, value) => records.set(key, value) } };
const source = url => ({ enabled: true, url });
const modern = {
  version: 3,
  sources: { airport: source('https://example.com/airport'), self: source('https://example.com/sub/client?format=clash'), backup: source('https://example.com/backup') },
  daily_sources: ['self', 'airport'], daily_regions: ['SG', 'US'], ai_sources: ['airport', 'self', 'backup'],
  emby: { enabled: true, targets: ['media.example.com'], sources: ['self', 'backup'], regions: ['US'], plex: { enabled: true, domain: 'plex.example.com', ip: '192.0.2.10' } },
};
async function get(path) { return worker.fetch(new Request(`https://example.com${path}`), env); }
try {
  records.set('mihomo:modern', JSON.stringify(modern));
  const response = await get('/mihomo/modern');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('X-Primus-Worker-Revision'), '2026-10-sui-integration');
  const yaml = await response.text();
  for (const value of ['format=clash', '机场:', '自建:', '备用:', '🌐 全球代理策略', '📺 Emby', 'DOMAIN,plex.example.com,📺 Emby', '"plex.example.com": "192.0.2.10"']) assert.ok(yaml.includes(value), value);
  assert.ok(!yaml.includes('__PROXY_'));
  const providers = yaml.split(/^proxy-providers:/m)[1].split(/^rule-providers:/m)[0];
  assert.equal((providers.match(/    type: http/g) || []).length, 3, 'one provider per source');
  for (const legacy of [
    { self_url: 'https://example.com/self?format=clash', airport_a_url: 'https://example.com/airport', backup_url: 'https://example.com/backup' },
    { ...modern, version: 2 },
  ]) {
    records.set('mihomo:legacy', JSON.stringify(legacy));
    assert.equal((await get('/mihomo/legacy')).status, 200);
  }
  const loon = { enabled_sources: ['airport', 'self', 'backup'], daily_sources: ['self', 'airport'], daily_regions: ['US', 'SG'], ai_sources: ['self', 'airport', 'backup'], emby: modern.emby };
  records.set('loon:existing', JSON.stringify(loon));
  const loonResponse = await get('/loon/existing/Primus-Loon.lcf');
  assert.equal(loonResponse.status, 200);
  assert.equal(loonResponse.headers.get('X-Primus-Worker-Revision'), '2026-10-sui-integration');
  const lcf = await loonResponse.text();
  for (const value of ['自建 · 美国', '机场 · 美国', 'use-in-proxy=true', 'DOMAIN,plex.example.com,Emby', 'resource-parser =', 'Prevent_DNS_Leaks']) assert.ok(lcf.includes(value), value);
  assert.ok(!lcf.includes('example.com/sub/client'), 'Loon keeps private resource URLs separate');
  assert.ok(!lcf.includes('__REMOTE_FILTERS__') && !lcf.includes('__PROXY_GROUPS__'));
  assert.equal((await get('/mihomo/missing')).status, 404);
  assert.equal((await get('/loon/missing')).status, 404);
  for (const kind of ['mihomo', 'loon']) {
    const body = kind === 'mihomo' ? modern : loon;
    const created = await worker.fetch(new Request(`https://example.com/api/${kind}`, { method: 'POST', body: JSON.stringify(body) }), env);
    assert.equal(created.status, 200);
    const result = await created.json();
    assert.ok(result.subscription_url || result.config_url);
  }
  assert.equal((await worker.fetch(new Request('https://example.com/api/mihomo', { method: 'POST', body: '{}' }), env)).status, 400);
  console.log('PASS: modern/legacy KV, Mihomo/Loon rendering, provider/group preservation, Plex hosts, deployment marker, create and missing-record behavior');
} finally { globalThis.fetch = originalFetch; }
