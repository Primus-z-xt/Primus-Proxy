# Primus Proxy

统一维护 **Mihomo / Clash** 与 **Loon** 的个人代理配置、策略组、远程订阅入口和生产版本。

> **生产真源：** GitHub `main`  
> **配置版本：** 以仓库根目录 [VERSION.json](./VERSION.json) 为唯一来源  
> **生产基线：** [docs/PRODUCTION_BASELINE.md](./docs/PRODUCTION_BASELINE.md)  
> **变更记录：** [docs/CHANGELOG.md](./docs/CHANGELOG.md)

## 配置生成器

**入口：** https://primus-z-xt.github.io/Primus-Proxy/

Builder 会直接读取 `VERSION.json` 显示当前 Mihomo / Loon 版本。版本号不再写死在网页里。

---

## Mihomo / Clash

### 使用方法

1. 打开配置生成器并保持在 **Mihomo / Clash**。
2. 在“节点来源”中按需启用 `机场 / 自建 / 备用`，只为已启用来源填写订阅链接。
3. 在“🚀 日用节点”中选择来源，并多选需要的国家 / 地区。
4. “🤖 AI”地区固定为美国，只选择要参与 AI 的来源。
5. 点击 **生成配置** 可在浏览器本地生成 YAML。
6. 需要远程订阅时，点击 **生成订阅链接**；可复制链接或 **一键导入 Clash Verge Rev**。
7. 本地下载文件名为 `Primus-Mihomo.yaml`；Clash Verge Rev 中远程配置显示名为 `Primus`。

当前生产架构坚持：

- 每个来源只加载一个 Provider。
- 地区筛选由 Proxy Group `filter` 完成。
- Provider 缓存路径包含上游 URL 哈希。
- 全部手动 `select`。
- 不使用 `url-test / fallback / load-balance`。
- AI 固定美国。
- 最终流量进入 `🌐 全球代理策略`。

---

## Loon

Loon 与 Mihomo 使用相同的“来源 + 地区”选择逻辑，但 **Loon 配置文件不保存真实节点订阅 URL**。

### 正确使用顺序

1. 在配置生成器切换到 **Loon**。
2. 选择启用来源：`机场 / 自建 / 备用`。
3. 设置“日用节点”的来源与地区。
4. AI 固定美国，只选择参与 AI 的来源。
5. 点击 **生成 Loon 配置**。
6. 点击 **一键导入 Loon 配置**。
7. 最后在 Loon App 中添加节点订阅资源。
8. 资源名称必须严格使用：`机场 / 自建 / 备用`。

如果修改了来源或地区，Builder 会使此前生成结果失效，需要重新生成，避免导入旧配置。

### Loon 文件

- 默认生产快照：`loon/Primus-Loon.lcf`
- 动态模板：`loon/template.lcf`

---

## 私有 Emby 分流

Builder 现在支持独立的 `📺 Emby` 分类。

- 填写 Emby 私有播放地址后才启用该分流。
- 可以选择允许参与 Emby 的来源：`机场 / 自建 / 备用`。
- Mihomo / Clash 中会生成独立的 `📺 Emby` 策略组，可在客户端内手动切换来源；每个来源内部仍可手动选择具体节点。
- Loon 中会生成独立的 `Emby` 策略组，可在 Loon 内手动切换 `机场 / 自建 / 备用`。
- 私有播放地址只提取主机名用于分流；仓库永远不保存真实播放线路。
- 本地“生成配置”时，播放线路只存在于当前页面和生成后的本地配置中，不写入浏览器本地存储。
- 生成远程 Mihomo 订阅或 Loon 私有配置时，播放线路才会随该私有配置保存到 Cloudflare KV。
- 公开的 `loon/Primus-Loon.lcf` 只保留通用 Emby 策略组，不包含任何真实播放线路。

> 使用远程 Emby 分流前，需要把当前 GitHub 中的 `cloudflare/primus-config.js` 重新部署到 Cloudflare Worker。

---

## 版本管理

`VERSION.json` 是唯一版本来源。

版本升级采用**半自动**方式：

- UI / README / 文档调整：不升级配置版本。
- Mihomo 配置行为变化：Mihomo +1。
- Loon 配置行为变化：Loon +1。
- 两边都变：两边都 +1。

GitHub Actions 中提供：

`Bump Config Version`

手动选择 `mihomo / loon / both` 后，会自动：

1. 版本 +1。
2. 写入北京时间到秒。
3. 同步模板和默认快照的兼容性版本头。
4. 提交到 `main`。
5. 触发 Builder 重新发布。

---

## Cloudflare 动态后端

私有订阅由独立 Cloudflare Worker 提供：

- Worker：`primus-config`
- 域名：`config.primusz.top`
- 存储：Cloudflare KV `MIHOMO_KV`
- Worker 源码：`cloudflare/primus-config.js`
- Mihomo：`POST /api/mihomo` → `GET /mihomo/<token>`
- Loon：`POST /api/loon` → `GET /loon/<token>/Primus-Loon.lcf`

Builder 会把已启用的 Mihomo 上游订阅 URL、日用来源、地区和 AI 来源提交到 Worker。Worker 只在 KV 中保存这些数据与随机 token；客户端请求 token URL 时，再读取仓库中的最新模板动态生成配置。

新版 Worker 还会读取 `VERSION.json`，因此远程动态配置的版本头也会自动跟随版本文件。

> 注意：修改 GitHub 中的 `cloudflare/primus-config.js` 不等于已经部署 Cloudflare Worker。当前仍需在 Cloudflare 侧手动部署 Worker 代码变更。

---

## 隐私与安全

- **生成配置**：真实订阅 URL 只在当前浏览器内参与生成，不上传。
- **生成订阅链接**：已启用的 Mihomo 上游订阅 URL 与策略选择会提交到 `config.primusz.top` 并保存到私有 KV。
- Primus token URL 本身等同访问密钥，请勿公开分享。
- 真实上游订阅 URL 不写入 GitHub 仓库或 GitHub Actions。
- Loon 动态配置不向后端提交节点订阅 URL。

---

## 生产结构

```text
GitHub main
  ├─ VERSION.json                 唯一版本来源
  ├─ docs/
  │  ├─ PRODUCTION_BASELINE.md    当前生产基线
  │  ├─ CHANGELOG.md              重要变更记录
  │  └─ PROJECT_SOURCE_POINTER.md 项目来源最小指针
  ├─ builder/                     GitHub Pages 配置生成器
  ├─ mihomo/                      Mihomo 动态模板
  ├─ loon/                        Loon 生产快照与动态模板
  ├─ cloudflare/                  primus-config Worker 源码
  └─ .github/workflows/           Pages + 版本管理

GitHub Pages
      ↓
Cloudflare primus-config + KV
      ↓
Mihomo / Clash Verge Rev

Loon：
GitHub Pages / Worker 动态配置
      ↓
Loon App
      ↓
节点资源在 App 内单独维护
```

旧的项目附件、旧 TXT 基线、旧 SOP 仅作为历史资料。后续恢复、修改和排障一律优先读取 GitHub `main`。
