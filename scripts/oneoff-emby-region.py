from pathlib import Path
import json
from datetime import datetime
from zoneinfo import ZoneInfo

root = Path('.')

# Builder HTML: add the Emby region selectors and load the overlay script.
html_path = root / 'builder/index.html'
html = html_path.read_text(encoding='utf-8')
if 'src="./emby-region.js"' not in html:
    marker = '<script src="./app.js"></script>'
    assert marker in html
    html = html.replace(marker, marker + '\n<script src="./emby-region.js"></script>', 1)

mihomo_old = '''        <div class="subcard">
          <h3>📺 Emby</h3>
          <p class="hint">填写后启用独立 Emby 分流。线路不会写入 GitHub，也不会保存到浏览器本地存储；只有生成远程订阅时才会随配置保存到你的私有 KV。</p>
          <label for="emby-target">私有播放线路</label>
          <input id="emby-target" type="password" autocomplete="off" spellcheck="false" placeholder="粘贴 Emby 播放地址，例如 https://example.com:443">
          <label class="show-row"><input id="show-emby-target" type="checkbox">显示线路</label>
          <div class="group-title">可选来源 · 客户端内手动切换</div>
          <div class="option-grid source-grid">
            <label class="check-item"><input class="emby-source" data-source="airport" type="checkbox" checked>机场</label>
            <label class="check-item"><input class="emby-source" data-source="self" type="checkbox" checked>自建</label>
            <label class="check-item"><input class="emby-source" data-source="backup" type="checkbox" checked>备用</label>
          </div>
        </div>'''
mihomo_new = mihomo_old + '''
        <div class="group-title">地区 · 可多选</div>
        <div class="inline-actions">
          <button id="emby-select-all-regions" type="button" class="secondary mini">全选</button>
          <button id="emby-clear-regions" type="button" class="secondary mini">清空</button>
        </div>
        <div id="emby-region-options"></div>'''
assert mihomo_old in html
html = html.replace(mihomo_old, mihomo_new, 1)

loon_old = '''        <div class="subcard">
          <h3>📺 Emby</h3>
          <p class="hint">填写后启用独立 Emby 分流。线路不会写入 GitHub，也不会保存到浏览器本地存储；生成 Loon 私有配置链接时才会保存到你的私有 KV。</p>
          <label for="loon-emby-target">私有播放线路</label>
          <input id="loon-emby-target" type="password" autocomplete="off" spellcheck="false" placeholder="粘贴 Emby 播放地址，例如 https://example.com:443">
          <label class="show-row"><input id="show-loon-emby-target" type="checkbox">显示线路</label>
          <div class="group-title">可选来源 · Loon 内手动切换</div>
          <div class="option-grid source-grid">
            <label class="check-item"><input class="loon-emby-source" data-source="airport" type="checkbox" checked>机场</label>
            <label class="check-item"><input class="loon-emby-source" data-source="self" type="checkbox" checked>自建</label>
            <label class="check-item"><input class="loon-emby-source" data-source="backup" type="checkbox" checked>备用</label>
          </div>
        </div>'''
loon_new = loon_old + '''
        <div class="group-title">地区 · 可多选</div>
        <div class="inline-actions">
          <button id="loon-emby-select-all-regions" type="button" class="secondary mini">全选</button>
          <button id="loon-emby-clear-regions" type="button" class="secondary mini">清空</button>
        </div>
        <div id="loon-emby-region-options"></div>'''
assert loon_old in html
html = html.replace(loon_old, loon_new, 1)
html_path.write_text(html, encoding='utf-8')

# Cloudflare Worker: store/validate Emby regions and apply them to both clients.
worker_path = root / 'cloudflare/primus-config.js'
worker = worker_path.read_text(encoding='utf-8')
worker = worker.replace('// Primus Config Worker v5', '// Primus Config Worker v6', 1)

old = '''  const sources = uniqueAllowed(value?.sources, SOURCE_ORDER).filter(key => enabledSources.includes(key));
  if (targets.length && !sources.length) throw new Error("Emby 至少选择一个已启用来源");
  return { enabled: targets.length > 0, targets, sources };
}'''
new = '''  const sources = uniqueAllowed(value?.sources, SOURCE_ORDER).filter(key => enabledSources.includes(key));
  const regions = Array.isArray(value?.regions) ? uniqueAllowed(value.regions, Object.keys(REGIONS)) : Object.keys(REGIONS);
  if (targets.length && !sources.length) throw new Error("Emby 至少选择一个已启用来源");
  if (targets.length && !regions.length) throw new Error("Emby 至少选择一个地区");
  return { enabled: targets.length > 0, targets, sources, regions };
}'''
assert old in worker
worker = worker.replace(old, new, 1)
worker = worker.replace('emby: { enabled: false, targets: [], sources: [] },', 'emby: { enabled: false, targets: [], sources: [], regions: [] },', 1)

old = '''        `    type: select`,
        `    use:`,
        `      - "${SOURCE_META[sourceKey].label}"`
      );'''
new = '''        `    type: select`,
        `    use:`,
        `      - "${SOURCE_META[sourceKey].label}"`,
        `    filter: '${combinedRegionRegex(config.emby.regions)}'`
      );'''
assert old in worker
worker = worker.replace(old, new, 1)

old = '''    if (sourceKey === "backup") {
      lines.push(`备用 · 全部 = NameRegex,备用, FilterKey = ".*"`);
    } else if (embyAllSources.has(sourceKey)) {'''
new = '''    if (sourceKey === "backup") {
      const embyFilter = embyAllSources.has("backup") && config.emby?.regions?.length
        ? combinedRegionRegex(config.emby.regions)
        : ".*";
      lines.push(`备用 · 全部 = NameRegex,备用, FilterKey = "${embyFilter}"`);
    } else if (embyAllSources.has(sourceKey)) {'''
assert old in worker
worker = worker.replace(old, new, 1)
worker_path.write_text(worker, encoding='utf-8')

# Version bump because this changes generated configuration behavior.
version_path = root / 'VERSION.json'
version = json.loads(version_path.read_text(encoding='utf-8'))
now = datetime.now(ZoneInfo('Asia/Shanghai')).strftime('%Y-%m-%d %H:%M:%S')
version['mihomo']['version'] = 6
version['mihomo']['updated_at'] = now
version['loon']['version'] = 23
version['loon']['updated_at'] = now
version_path.write_text(json.dumps(version, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

# Production baseline.
baseline_path = root / 'docs/PRODUCTION_BASELINE.md'
baseline = baseline_path.read_text(encoding='utf-8')
baseline = baseline.replace(
    '当前生产支持独立 Emby 分流，属于配置行为，因此从本次变更起版本为 Mihomo v5 / Loon v22。',
    '当前生产支持独立 Emby 分流及独立地区筛选，属于配置行为，因此从本次变更起版本为 Mihomo v6 / Loon v23。'
)
marker = '- 参与来源由 Builder 勾选，客户端内保持手动切换。'
if '- Emby 地区由 Builder 独立多选' not in baseline:
    assert marker in baseline
    baseline = baseline.replace(marker, marker + '\n- Emby 地区由 Builder 独立多选，不复用日用节点地区；Mihomo / Loon 仅在 Emby 来源子组内按所选地区过滤。', 1)
baseline_path.write_text(baseline, encoding='utf-8')

# Changelog.
changelog_path = root / 'docs/CHANGELOG.md'
changelog = changelog_path.read_text(encoding='utf-8')
entry = '''### Mihomo v6 / Loon v23 — Emby 地区筛选

- Emby 新增独立“地区 · 可多选”筛选，不复用日用节点地区。
- Mihomo：Emby 来源子策略组增加地区正则过滤。
- Loon：Emby 来源 Remote Filter 增加地区正则过滤。
- Emby 播放线路仍保持私有，不写入 GitHub 或浏览器 localStorage。
- 版本号更新为 Mihomo v6 / Loon v23。

'''
if '### Mihomo v6 / Loon v23 — Emby 地区筛选' not in changelog:
    changelog = changelog.replace('## 2026-09-28\n\n', '## 2026-09-28\n\n' + entry, 1)
changelog_path.write_text(changelog, encoding='utf-8')

# Pages must publish the overlay JS alongside app.js.
pages_path = root / '.github/workflows/pages.yml'
pages = pages_path.read_text(encoding='utf-8')
marker = '          cp builder/app.js _site/app.js\n'
if 'cp builder/emby-region.js _site/emby-region.js' not in pages:
    assert marker in pages
    pages = pages.replace(marker, marker + '          cp builder/emby-region.js _site/emby-region.js\n', 1)
pages_path.write_text(pages, encoding='utf-8')

# Remove one-off files in the same commit.
Path('scripts/oneoff-emby-region.py').unlink()
Path('.github/workflows/oneoff-emby-region.yml').unlink()
