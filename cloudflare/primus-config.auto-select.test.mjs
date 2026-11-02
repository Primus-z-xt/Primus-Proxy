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

const TEST_URL = 'https://cp.cloudflare.com/generate_204';

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

console.log('auto-select tests passed');
