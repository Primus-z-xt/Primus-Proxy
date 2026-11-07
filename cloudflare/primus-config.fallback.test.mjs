import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const code = await read('cloudflare/primus-config.js');
const app = await read('builder/app.js');
const worker = (await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'))).default;
const templates = Object.fromEntries(await Promise.all(['mihomo/template.yaml', 'loon/template.lcf', 'VERSION.json'].map(async p => [p, await read(p)])));
const realFetch = globalThis.fetch;
globalThis.fetch = async url => {
  const p = Object.keys(templates).find(p => String(url).endsWith('/main/' + p));
  assert.ok(p);
  return new Response(templates[p]);
};
const records = new Map();
const env = {MIHOMO_KV: {get: async k => records.get(k), put: async (k, v) => records.set(k, v)}};
const keys = ['daily', 'backup', 'ai', 'emby'];
const names = {mihomo: ['🚀 日用节点', '🛟 备用节点', '🤖 AI', '📺 Emby'], loon: ['主力节点', '备用节点', 'AI', 'Emby']};
const base = {
  version: 3,
  sources: Object.fromEntries(['airport', 'self', 'backup'].map(k => [k, {enabled: true, url: 'https://example.com/' + k}])),
  enabled_sources: ['airport', 'self', 'backup'], daily_sources: ['self', 'airport'], daily_regions: ['US'], ai_sources: ['self'],
  emby: {targets: ['media.example.com'], sources: ['self', 'backup'], regions: ['US']}
};
function block(text, kind, name) {
  if (kind === 'loon') return text.split('\n').find(l => l.startsWith(name + ' = '));
  const start = text.indexOf('  - name: "' + name + '"');
  assert.ok(start >= 0);
  const end = text.indexOf('\n  - name:', start + 1);
  return text.slice(start, end < 0 ? undefined : end);
}
async function create(kind, extra) {
  const res = await worker.fetch(new Request('https://example.com/api/' + kind, {method: 'POST', body: JSON.stringify({...base, ...extra})}), env);
  assert.equal(res.status, 200);
  const body = await res.json();
  const url = body.subscription_url || body.config_url;
  const token = new URL(url).pathname.split('/')[2];
  const stored = JSON.parse(records.get(kind + ':' + token));
  const output = await worker.fetch(new Request(url), env);
  assert.equal(output.status, 200);
  return {stored, text: await output.text()};
}

try {
  function rendererHelpers(source) {
    const mihomoStart = source.indexOf('const AUTO_TEST_URL');
    const mihomoEnd = source.indexOf('function buildGroups(', mihomoStart);
    const loonStart = source.indexOf('const LOON_AUTO_SUFFIX');
    const loonEnd = source.indexOf('function buildLoonGroups(', loonStart);
    return vm.runInNewContext(source.slice(mihomoStart, mihomoEnd) + source.slice(loonStart, loonEnd) + '\n({groupTypeLines, loonGroup})');
  }
  const local = rendererHelpers(app), remote = rendererHelpers(code);
  for (const [auto, fallback] of [[false, false], [true, false], [false, true], [true, true]]) {
    assert.equal(JSON.stringify(local.groupTypeLines(auto, fallback)), JSON.stringify(remote.groupTypeLines(auto, fallback)));
    assert.equal(local.loonGroup(auto, '自建 · 美国,备用 · 全部', fallback), remote.loonGroup(auto, '自建 · 美国,备用 · 全部', fallback));
  }
  for (const kind of ['mihomo', 'loon']) {
    for (const enabled of [null, ...keys]) {
      const {stored, text} = await create(kind, enabled ? {fallback: {[enabled]: true}} : {});
      for (const [i, key] of keys.entries()) {
        assert.equal(stored.fallback[key], key === enabled);
        const group = block(text, kind, names[kind][i]);
        const type = key === enabled ? 'fallback' : 'select';
        assert.ok(kind === 'mihomo' ? group.includes('    type: ' + type) : group.includes(' = ' + type + ','));
        if (key === enabled) {
          assert.ok(group.includes('https://www.gstatic.com/generate_204'));
          assert.doesNotMatch(group, /tolerance/);
          assert.ok(group.includes(kind === 'mihomo' ? 'timeout: 5000' : 'max-timeout = 5000'));
        }
      }
    }
    const all = Object.fromEntries(keys.map(k => [k, true]));
    const {stored, text} = await create(kind, {fallback: all, auto_select: all});
    for (const [i, key] of keys.entries()) {
      assert.equal(stored.auto_select[key], false, 'API flags must not conflict');
      assert.ok(block(text, kind, names[kind][i]).includes('fallback'));
    }
    const malformed = await create(kind, {fallback: {daily: 'false', ai: 1}});
    assert.equal(malformed.stored.fallback.daily, false);
    assert.equal(malformed.stored.fallback.ai, false);
    if (kind === 'mihomo') assert.match(block(text, kind, names[kind][0]), /use:\n      - "自建"\n      - "机场"/);
    else assert.match(block(text, kind, names[kind][0]), /fallback,自建 · 美国,机场 · 美国/);
  }

  // Exercise the browser switch handlers: enabling one mode must clear the other
  // before selection persistence runs, while unrelated cards remain independent.
  const start = app.indexOf('  function bindGroupModeSwitches(');
  const end = app.indexOf('\n  bindGroupModeSwitches();', start);
  const controls = new Map();
  for (const prefix of ['', 'loon-']) for (const key of keys) for (const mode of ['auto', 'fallback']) {
    controls.set(prefix + mode + '-' + key, {checked: false, handlers: [], addEventListener(_event, handler) {this.handlers.push(handler);}});
  }
  const context = vm.createContext({document: {getElementById: id => controls.get(id)}, currentSubscriptionUrl: 'old', subscriptionUrlInput: {value: 'old'}, copySubscriptionButton: {disabled: false}, importClashButton: {disabled: false}});
  vm.runInContext(app.slice(start, end), context);
  vm.runInContext('bindGroupModeSwitches(); bindGroupModeSwitches("loon-");', context);
  for (const prefix of ['', 'loon-']) for (const key of keys) {
    const auto = controls.get(prefix + 'auto-' + key), fallback = controls.get(prefix + 'fallback-' + key);
    auto.checked = true; fallback.checked = true; fallback.handlers.forEach(h => h());
    assert.equal(auto.checked, false);
    auto.checked = true; auto.handlers.forEach(h => h());
    assert.equal(fallback.checked, false);
    auto.checked = false;
  }
  assert.equal(context.currentSubscriptionUrl, '');
  const html = await read('builder/index.html');
  for (const prefix of ['', 'loon-']) for (const key of keys) {
    const input = html.match(new RegExp('<input[^>]*id="' + prefix + 'fallback-' + key + '"[^>]*>'));
    assert.ok(input);
    assert.doesNotMatch(input[0], /\bchecked\b/);
  }
  const bridge = await read('builder/emby-region.js');
  assert.equal((bridge.match(/fallback: config\.fallback/g) || []).length, 2, 'media extension must persist both clients');
  assert.match(app, /fallback: config\.fallback,\s*auto_select: config\.auto_select\s*\n\s*\}\);/, 'Loon fingerprint must invalidate imports when fallback changes');
  for (const text of [app, code, templates['loon/template.lcf'], await read('loon/Primus-Loon.lcf')]) {
    assert.doesNotMatch(text, /(?:http|https):\/\/cp\.cloudflare\.com\/generate_204/);
  }
  console.log('PASS: per-card fallback, opt-in defaults, API persistence, source order, mutually exclusive modes, browser handlers and HTTPS probes');
} finally { globalThis.fetch = realFetch; }
