from pathlib import Path

path = Path('builder/index.html')
html = path.read_text(encoding='utf-8')

old = '''        </div>
        <div class="group-title">地区 · 可多选</div>
        <div class="inline-actions">
          <button id="emby-select-all-regions" type="button" class="secondary mini">全选</button>
          <button id="emby-clear-regions" type="button" class="secondary mini">清空</button>
        </div>
        <div id="emby-region-options"></div>

        <div class="actions">'''
new = '''          <div class="group-title">地区 · 可多选</div>
          <div class="inline-actions">
            <button id="emby-select-all-regions" type="button" class="secondary mini">全选</button>
            <button id="emby-clear-regions" type="button" class="secondary mini">清空</button>
          </div>
          <div id="emby-region-options"></div>
        </div>

        <div class="actions">'''
assert html.count(old) == 1, f'Mihomo Emby layout marker count={html.count(old)}'
html = html.replace(old, new, 1)

old = '''        </div>
        <div class="group-title">地区 · 可多选</div>
        <div class="inline-actions">
          <button id="loon-emby-select-all-regions" type="button" class="secondary mini">全选</button>
          <button id="loon-emby-clear-regions" type="button" class="secondary mini">清空</button>
        </div>
        <div id="loon-emby-region-options"></div>

        <div class="actions">'''
new = '''          <div class="group-title">地区 · 可多选</div>
          <div class="inline-actions">
            <button id="loon-emby-select-all-regions" type="button" class="secondary mini">全选</button>
            <button id="loon-emby-clear-regions" type="button" class="secondary mini">清空</button>
          </div>
          <div id="loon-emby-region-options"></div>
        </div>

        <div class="actions">'''
assert html.count(old) == 1, f'Loon Emby layout marker count={html.count(old)}'
html = html.replace(old, new, 1)

path.write_text(html, encoding='utf-8')
