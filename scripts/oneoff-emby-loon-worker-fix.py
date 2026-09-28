from pathlib import Path
path = Path('cloudflare/primus-config.js')
text = path.read_text(encoding='utf-8')
old = '      lines.push(`${SOURCE_META[sourceKey].label} · 全部 = NameRegex,${SOURCE_META[sourceKey].label}, FilterKey = ".*"`);'
new = '      lines.push(`${SOURCE_META[sourceKey].label} · 全部 = NameRegex,${SOURCE_META[sourceKey].label}, FilterKey = "${combinedRegionRegex(config.emby.regions)}"`);'
assert text.count(old) == 1, f'expected one Loon Emby filter line, got {text.count(old)}'
path.write_text(text.replace(old, new, 1), encoding='utf-8')
