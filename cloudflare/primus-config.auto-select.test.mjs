import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const code = await readFile(new URL('./primus-config.js', import.meta.url), 'utf8');
const worker = (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).default;
const templates = {
  'mihomo/template.yaml': await readFile(new URL('../mihomo/template.yaml', import.meta.url), 'utf8'),
  'loon/template.lcf': await readFile(new URL('../loon/template.lcf', import.meta.url), 'utf8'),
  'VERSION.json': await readFile(new URL('../VERSION.json', import.meta.url), 'utf8'),
};
globalThis.fetch = async url => {
  const match = Object.keys(templates).find(path => String(url).endsWith(`/main/${path}`));
  assert.ok(match, 'Worker should fetch only its repository templates/manifest');
  return new Response(templates[match]);
};
const records = new Map();
const env = { MIHOMO_KV: { get: async key => records.get(key), put: async (key, value) => records.set(key, value) } };
const source = url => ({ enabled: true, url });

const base = {
  version: 3,
  sources: {
    airport: source('https://example.com/airport'),
    self: source('https://example.com/sub/client?format=clash'),
    backup: source('https://example.com/backup'),
  },
  daily_sources: ['self', 'airport'],
  daily_regions: ['SG', 'US'],
  ai_sources: ['airport', 'self', 'backup'],
  emby: { enabled: true, targets: ['media.example.com'], sources: ['self', 'backup'], regions: ['US'] },
};

async function render(config, key) {
  records.set(`mihomo:${key}`, JSON.stringify(config));
  const response = await worker.fetch(new Request(`https://example.com/mihomo/${key}`), env);
  assert.equal(response.status, 200);
  return response.text();
}

function groupBlock(yaml, name) {
  const start = yaml.indexOf(`  - name: "${name}"`);
  assert.ok(start >= 0, `group ${name} missing`);
  const next = yaml.indexOf('\n  - name: "', start + 1);
  return yaml.slice(start, next < 0 ? undefined : next);
}

const TEST_URL = 'https://www.gstatic.com/generate_204';

// 1) 未设置 auto_select：必须保持原样（全部 select，向后兼容）
const plain = await render(base, 'plain');
for (const name of ['🚀 日用节点', '🛟 备用节点', '🤖 AI', '📺 Emby']) {
  const block = groupBlock(plain, name);
  assert.match(block, /^    type: select$/m, `${name} should stay select`);
  assert.doesNotMatch(block, /url-test/, `${name} must not be url-test`);
}
assert.ok(!plain.includes(TEST_URL), 'no test url unless enabled');

// 2) 全部开启：四个节点组都变成 url-test
const all = await render(
  { ...base, auto_select: { daily: true, backup: true, ai: true, emby: true } },
  'all'
);
for (const name of ['🚀 日用节点', '🛟 备用节点', '🤖 AI', '📺 Emby']) {
  const block = groupBlock(all, name);
  assert.match(block, /^    type: url-test$/m, `${name} should be url-test`);
  assert.ok(block.includes(`    url: "${TEST_URL}"`), `${name} needs health-check url`);
  assert.match(block, /^    interval: 300$/m);
  assert.match(block, /^    tolerance: 50$/m);
  assert.match(block, /^    lazy: false$/m);
  // 结构未被破坏
  assert.match(block, /^    use:$/m);
}

// 3) 只开一部分：各自独立生效
const partial = await render({ ...base, auto_select: { daily: true, ai: false } }, 'partial');
assert.match(groupBlock(partial, '🚀 日用节点'), /^    type: url-test$/m);
assert.match(groupBlock(partial, '🤖 AI'), /^    type: select$/m);
assert.match(groupBlock(partial, '🛟 备用节点'), /^    type: select$/m);

// 4) 非节点组永远保持 select（切板类组不能被自动测速）
for (const name of ['🌐 全球代理策略', '🍅 番茄', '🎵 抖音', '📕 小红书']) {
  assert.match(groupBlock(all, name), /^    type: select$/m, `${name} must stay select`);
}

// 5) POST 路径：请求体里的 auto_select 要被规范化并保存
const posted = await worker.fetch(
  new Request('https://example.com/api/mihomo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://primus-z-xt.github.io' },
    body: JSON.stringify({ ...base, auto_select: { daily: true } }),
  }),
  env
);
assert.equal(posted.status, 200);
const { subscription_url } = await posted.json();
const token = subscription_url.match(/\/mihomo\/([A-Za-z0-9_-]+)/)[1];
const stored = JSON.parse(records.get(`mihomo:${token}`));
assert.equal(stored.auto_select.daily, true);
assert.equal(stored.auto_select.backup, false);
assert.equal(stored.auto_select.ai, false);
assert.equal(stored.auto_select.emby, false);

// 6) 旧记录（没有 auto_select 字段）仍能渲染
const legacyStored = await render({ ...base, version: 2 }, 'legacy');
assert.ok(legacyStored.includes('__PROXY_') === false);
assert.match(groupBlock(legacyStored, '🚀 日用节点'), /^    type: select$/m);


// ---------------- Loon ----------------
const loonBase = {
  enabled_sources: ['airport', 'self', 'backup'],
  daily_sources: ['self', 'airport'],
  daily_regions: ['US', 'SG'],
  ai_sources: ['self', 'airport'],
  emby: { enabled: true, targets: ['media.example.com'], sources: ['self', 'backup'], regions: ['US'] },
};

async function renderLoon(config, key) {
  records.set('loon:' + key, JSON.stringify(config));
  const response = await worker.fetch(new Request('https://example.com/loon/' + key + '/Primus-Loon.lcf'), env);
  assert.equal(response.status, 200);
  return response.text();
}

function loonGroupLine(lcf, name) {
  const re = new RegExp('^\\s*' + name + ' = .*$', 'm');
  const m = lcf.match(re);
  assert.ok(m, 'loon group ' + name + ' missing');
  return m[0];
}

const loonPlain = await renderLoon(loonBase, "plain");
for (const name of ['主力节点', '备用节点', 'AI', 'Emby']) {
  const line = loonGroupLine(loonPlain, name);
  assert.ok(line.includes(' = select,'), name + ' should stay select');
  assert.ok(!line.includes(',url ='), name + ' must not carry url param');
}

const loonAuto = await renderLoon({ ...loonBase, auto_select: { daily: true, backup: true, ai: true, emby: true } }, 'auto');
for (const name of ['主力节点', '备用节点', 'AI', 'Emby']) {
  const line = loonGroupLine(loonAuto, name);
  assert.ok(line.includes(' = url-test,'), name + ' should be url-test');
  assert.ok(line.includes('url = https://www.gstatic.com/generate_204'), name + ' needs url param');
  assert.ok(line.includes('interval = 600'), name + ' needs interval');
  assert.ok(line.includes('img-url = '), name + ' keeps icon');
}

const loonPartial = await renderLoon({ ...loonBase, auto_select: { ai: true } }, 'partial');
assert.ok(loonGroupLine(loonPartial, 'AI').includes(' = url-test,'));
assert.ok(loonGroupLine(loonPartial, '主力节点').includes(' = select,'));
assert.ok(loonGroupLine(loonPartial, '备用节点').includes(' = select,'));

for (const name of ['全球代理策略', '番茄', '抖音', '小红书']) {
  assert.ok(loonGroupLine(loonAuto, name).includes(' = select,'), name + ' must stay select');
}

const loonPost = await worker.fetch(
  new Request('https://example.com/api/loon', {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://primus-z-xt.github.io" },
    body: JSON.stringify({ ...loonBase, auto_select: { backup: true } }),
  }),
  env
);
assert.equal(loonPost.status, 200);
const loonBody = await loonPost.json();
const loonToken = loonBody.config_url.match(/\/loon\/([A-Za-z0-9_-]+)/)[1];
const loonStored = JSON.parse(records.get('loon:' + loonToken));
assert.equal(loonStored.auto_select.backup, true);
assert.equal(loonStored.auto_select.daily, false);


// ---------------- 静态订阅路由 /s/<token> ----------------
const yamlFixture = 'proxies:\n  - name: test\n    type: vless\n';
records.set('sub:static-fixture-token-2026', yamlFixture);

const subRes = await worker.fetch(new Request('https://example.com/s/static-fixture-token-2026', { headers: { Origin: 'https://primus-z-xt.github.io' } }), env);
assert.equal(subRes.status, 200);
assert.match(subRes.headers.get('Content-Type') || '', /text\/yaml/);
assert.equal(subRes.headers.get('Access-Control-Allow-Origin'), 'https://primus-z-xt.github.io');
assert.equal(await subRes.text(), yamlFixture);

const subMissing = await worker.fetch(new Request('https://example.com/s/aaaaaaaa'), env);
assert.equal(subMissing.status, 404);

const subBadLen = await worker.fetch(new Request('https://example.com/s/short'), env);
assert.equal(subBadLen.status, 404);


// ---------------- 备用大流量正则 ----------------
const embyCfg = {
  version: 3,
  sources: {
    airport: { enabled: true, url: 'https://e.com/a?format=clash' },
    self: { enabled: true, url: 'https://e.com/b?format=clash' },
    backup: { enabled: true, url: 'https://e.com/c?format=clash' },
  },
  daily_sources: ['self'], daily_regions: ['US'], ai_sources: ['self'],
  emby: { enabled: true, targets: ['media.example.com'], sources: ['backup'], regions: ['US'] },
};
records.set('mihomo:emby', JSON.stringify(embyCfg));
const embyYaml = await (await worker.fetch(new Request('https://example.com/mihomo/emby'), env)).text();
const embyStart = embyYaml.indexOf('  - name: "📺 Emby"');
const embyEnd = embyYaml.indexOf('\n  - name: "', embyStart + 1);
const embyBlock = embyYaml.slice(embyStart, embyEnd < 0 ? undefined : embyEnd);
const filterLine = (embyBlock.match(/^    filter: '(.+)'$/m) || [])[1];
assert.ok(filterLine, 'Emby group should carry a filter');

// mihomo 用 RE2 的 (?i) 前缀，JS 里换成 i flag
const embyRe = new RegExp(filterLine.replace('(?i)', ''), 'i');
const shouldMatch = [
  '🛟 🇺🇸 US bb-zen-vl',
  '🛟 🇺🇸 US-ZEN-GOLD-1 [下载]',
  '🛟 🇺🇸 US pp-or-tj',
  '🛟 🇺🇸 US su-rn2-vc',
];
const shouldSkip = [
  '🛟 🇺🇸 US su-aws-vc',
  '🛟 🇺🇸 US mm-or-vc',
];
for (const n of shouldMatch) assert.ok(embyRe.test(n), 'should match: ' + n);
for (const n of shouldSkip) assert.ok(!embyRe.test(n), 'should skip: ' + n);

// ---------------- Builder 空白默认；静态快照为独立手动预设 ----------------
const builderHtml = await readFile(new URL('../builder/index.html', import.meta.url), 'utf8');
const appCode = await readFile(new URL('../builder/app.js', import.meta.url), 'utf8');
const embyBridgeCode = await readFile(new URL('../builder/emby-region.js', import.meta.url), 'utf8');
const airportDefaults = [...builderHtml.matchAll(/<input[^>]*(?:id="(?:enable-airport|loon-enable-airport)"|data-source="airport")[^>]*>/g)];
assert.equal(airportDefaults.length, 8, 'all airport options must be present for future compatibility');
for (const entry of airportDefaults) assert.doesNotMatch(entry[0], /\bchecked\b/, 'airport must be off only by default');
for (const id of ['auto-backup', 'auto-daily', 'auto-ai', 'auto-emby', 'loon-auto-backup', 'loon-auto-daily', 'loon-auto-ai', 'loon-auto-emby']) {
  const el = builderHtml.match(new RegExp('<input[^>]*id="' + id + '"[^>]*>'));
  assert.ok(el, 'missing optional auto-select UI: ' + id);
  assert.doesNotMatch(el[0], /\bchecked\b/, 'auto-select must default off');
}
assert.doesNotMatch(builderHtml, /<input[^>]*\bchecked\b[^>]*>/, 'all initial checkboxes must be off');
assert.equal((appCode.match(/input\.checked = false;/g) || []).length, 2, 'both daily region defaults must be empty');
assert.match(embyBridgeCode, /EMBY_REGION_DEFAULT = ""/, 'Emby regions default off');
assert.match(appCode, /primus-proxy-builder-v3/, 'reset earlier implicit defaults once');
assert.match(appCode, /primus-proxy-loon-builder-v2/, 'reset earlier Loon implicit defaults once');
assert.equal((embyBridgeCode.match(/auto_select: config\.auto_select/g) || []).length, 2, 'Emby extension must persist auto-select in both clients');
assert.match(appCode, /auto_select: config\.auto_select\s*\n\s*\}\);/, 'Loon import fingerprint must include auto-select');

const defaultsConfig = {
  version: 2,
  enabled_sources: ['self', 'backup'],
  daily_sources: ['self'],
  daily_regions: ['US'],
  ai_sources: ['self', 'backup'],
  auto_select: { daily: false, backup: false, ai: false, emby: false },
  emby: { enabled: false, targets: [], sources: [], regions: ['US'] },
};
const defaultLoon = await renderLoon(defaultsConfig, 'default-static-snapshot');
const snapshot = await readFile(new URL('../loon/Primus-Loon.lcf', import.meta.url), 'utf8');
function section(text, name) {
  const marker = '[' + name + ']\n';
  const pos = text.indexOf(marker);
  assert.ok(pos >= 0, name + ' section missing');
  const body = text.slice(pos + marker.length);
  const next = body.search(/\n\[[^\]]+\]\n/);
  return (next < 0 ? body : body.slice(0, next)).trim();
}
for (const name of ['Remote Filter', 'Proxy Group']) {
  assert.equal(section(snapshot, name), section(defaultLoon, name), 'static snapshot differs from Worker for ' + name);
}
assert.match(snapshot, /^# 版本：v31$/m);
assert.doesNotMatch(section(snapshot, 'Remote Filter'), /机场 ·/);
assert.doesNotMatch(section(snapshot, 'Proxy Group'), /Emby =/);

console.log('auto-select tests passed');
