# Primus Proxy 当前生产基线

> 本文件是当前生产架构说明。**实际代码与配置以 `main` 分支为唯一生产真源。**
>
> 当前 Mihomo / Loon 版本号与更新时间，以仓库根目录 `VERSION.json` 为唯一版本来源。

## 1. 生产真源

仓库：

`Primus-z-xt/Primus-Proxy`

生产分支：

`main`

关键文件：

- `VERSION.json`：Mihomo / Loon 唯一版本来源
- `builder/index.html`：GitHub Pages UI
- `builder/app.js`：Builder 生成逻辑
- `mihomo/template.yaml`：Mihomo 动态模板
- `loon/template.lcf`：Loon 动态模板
- `loon/Primus-Loon.lcf`：Loon 默认生产快照
- `cloudflare/primus-config.js`：Cloudflare Worker 源码
- `.github/workflows/pages.yml`：GitHub Pages 发布
- `.github/workflows/bump-version.yml`：半自动版本升级

旧的项目附件、旧 TXT 基线、旧 SOP 只作为历史资料，不再覆盖 GitHub `main` 的当前状态。

## 2. 版本管理

版本文件：

`VERSION.json`

规则：

- 修改 Builder UI、README、文档：不升级 Mihomo / Loon 配置版本。
- 修改 Mihomo Provider、策略组、规则、DNS、模板行为：Mihomo 版本 +1。
- 修改 Loon 策略、规则、插件、General 或模板行为：Loon 版本 +1。
- 同时影响两端：两边都 +1。
- `updated_at` 使用北京时间，格式为 `YYYY-MM-DD HH:mm:ss`。
- 版本号不按 commit 自动增长，避免 UI 调整把配置版本变成 commit 计数器。

推荐使用 GitHub Actions：

`Bump Config Version`

手动选择 `mihomo / loon / both`，工作流会自动：

1. 对目标版本 +1。
2. 写入北京时间到秒。
3. 同步模板与 Loon 默认快照中的兼容性版本头。
4. 提交到 `main`。
5. 由 Pages 工作流继续发布。

Builder 页面和新版 Worker运行时都会读取 `VERSION.json`，因此显示版本与动态生成配置会自动跟随版本文件。

## 3. Mihomo 当前生产架构

节点来源固定为三类：

- `机场`
- `自建`
- `备用`

核心原则：

- 每个来源只加载一次 Proxy Provider。
- 不再为“机场 · 美国 / 备用 · 美国”等地区重复创建 Provider。
- 地区筛选放在 Proxy Group 的 `filter` 中完成。
- Provider 缓存路径包含上游 URL 短哈希，避免更换订阅地址后复用旧缓存。
- `备用` Provider 保留订阅信息类节点排除规则。
- 新增 `🛟 备用大流量`：只包含备用订阅中“大流量组”对应节点；普通 `🛟 备用节点` 仍保留备用全部有效节点。
- 所有策略均为人工 `select`。
- 不使用 `url-test`、`fallback`、`load-balance` 或自动延迟选路。
- AI 地区固定美国，来源可选。
- 最终 `MATCH` 进入 `🌐 全球代理策略`。

该架构用于避免同名节点被多个 Provider 重复加载后，在 Clash Verge Rev 中出现 `ambiguous`。

## 4. Loon 当前生产架构

Loon 与 Mihomo 使用相同的“来源 + 地区”选择思路，但节点 URL 不写入 Loon 配置。

使用要求：

- 节点资源由用户在 Loon App 内单独添加。
- 资源名称必须严格为：`机场 / 自建 / 备用`。
- 日用节点：来源可选 + 地区多选。
- AI：固定美国 + 来源可选。
- 全部使用手动选择。
- 不使用自动测速切换、fallback。

当前生产插件由 `loon/template.lcf` 为准，包括：

- YouTube_remove_ads
- Block_HTTPDNS
- BlockAdvertisers
- Prevent_DNS_Leaks
- Node_detection_tool
- nodecheck

## 5. 私有 Emby 分流

当前生产支持独立 Emby 分流及独立地区筛选，并支持 Plex 私有固定源站复用 Emby 策略；当前配置版本为 Mihomo v10 / Loon v27。

隐私原则：

- GitHub 只保存 Emby 功能代码，不保存真实播放线路。
- Builder 的 Emby 线路输入框默认隐藏。
- Emby 线路不写入 localStorage。
- 本地生成配置时，线路只进入用户本地生成结果。
- 生成远程 Mihomo / Loon 私有配置时，线路保存在 `MIHOMO_KV` 对应的私有 token 记录中。
- 公开 Loon 快照不包含真实线路。

策略结构：

- Mihomo：`📺 Emby` 中机场/自建继续进入对应来源子组；备用进入独立的 `📺 Emby · 备用大流量`。
- Loon：`Emby` 中机场/自建继续使用对应地区过滤器；备用使用 `备用 · Emby大流量`。
- 参与来源由 Builder 勾选，客户端内保持手动切换。
- Emby 地区由 Builder 独立多选，不复用日用节点地区；机场/自建按所选地区过滤，备用则同时满足“大流量节点”与 Emby 所选地区两个条件。
- Emby 私有地址只用于生成 DOMAIN-SUFFIX / IP-CIDR / IP-CIDR6 规则。
- Plex 不新增独立策略组：Builder 可在 Emby 区域填写 Plex 域名与源 IP，最终固定解析到源 IP，并将 Plex 域名规则直接指向现有 Emby 策略组。
- Plex 域名与源 IP不写入 GitHub，也不写入浏览器 localStorage；本地生成仅进入本地配置，远程配置仅保存在私有 KV。
- Mihomo 使用动态 `hosts` 映射；Loon 使用动态 `[Host]` 映射。

Worker 兼容要求：

- GitHub 模板中的私有规则注入点以注释形式存在，旧 Worker 读取新模板时不会破坏现有订阅。
- 要让远程 Emby 订阅真正生效，必须把当前 `cloudflare/primus-config.js` 手动部署到 Cloudflare。

## 6. Builder

生产入口：

`https://primus-z-xt.github.io/Primus-Proxy/`

Mihomo：

- 本地生成 YAML 时，上游 URL 只在当前浏览器内使用。
- 点击“生成订阅链接”时，才把启用的上游 URL 与策略选择提交到 Worker。
- 支持 Clash Verge Rev 一键导入。

Loon：

- Builder 只提交来源/地区选择，不提交真实节点订阅 URL。
- 支持生成、下载和一键导入 Loon 配置。
- 修改来源或地区后，旧生成结果自动失效，必须重新生成。

UI 行为不属于配置版本。UI 调整不应升级 Mihomo / Loon 版本。

## 7. Cloudflare Worker

Worker：

`primus-config`

生产域名：

`https://config.primusz.top`

KV：

`MIHOMO_KV`

接口：

- `POST /api/mihomo`
- `GET /mihomo/<token>`
- `POST /api/loon`
- `GET /loon/<token>/Primus-Loon.lcf`

Worker 从 GitHub `main` 读取最新模板；新版 Worker同时读取 `VERSION.json`，把版本信息写入动态输出。

Mihomo 仍兼容历史 KV token。

注意：

**GitHub 中修改 `cloudflare/primus-config.js` 不等于已经部署到 Cloudflare。**
在没有新增自动部署流程之前，Worker 代码变更仍需在 Cloudflare 侧手动部署。

## 8. GitHub Pages

`.github/workflows/pages.yml` 发布：

- `builder/index.html` → `/index.html`
- `builder/app.js` → `/app.js`
- `VERSION.json` → `/VERSION.json`
- `mihomo/template.yaml` → `/template.yaml`
- `loon/template.lcf` → `/Loon-template.lcf`
- `loon/Primus-Loon.lcf` → `/Primus-Loon.lcf`

Pages 发布成功后，Builder 会直接读取最新 `VERSION.json`。

## 9. 隐私与安全

- 真实上游订阅 URL 不写入 GitHub。
- Mihomo 本地生成不会上传订阅 URL。
- 只有主动生成远程 Mihomo 订阅时，URL 才保存到私有 KV。
- Primus token URL 本身等同访问密钥，不公开分享。
- Loon 动态配置不保存真实节点 URL。

## 10. 后续修改读取顺序

以后处理 Primus Proxy 生产问题时，优先按以下顺序读取：

1. `docs/PRODUCTION_BASELINE.md`
2. `VERSION.json`
3. 与任务相关的当前 `main` 文件
4. 必要时再查看 `docs/CHANGELOG.md`

不要以旧项目附件中的历史代码覆盖 GitHub 当前生产实现。
