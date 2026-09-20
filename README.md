# Primus Proxy

统一维护 Loon 与 Mihomo / Clash 配置。

当前生产版本：

- Mihomo / Clash：`v2`
- Loon：`v20`

## 配置生成器

**入口：**

👉 https://primus-z-xt.github.io/Primus-Proxy/


## 使用方法

### Mihomo / Clash

1. 打开上面的“配置生成器”。
2. 在“节点来源”中按需启用 `机场`、`自建`、`备用`，只需要为已启用来源填写订阅链接。
3. 在“🚀 日用节点”中选择要参与日用的来源，并多选需要的国家 / 地区。
4. “🤖 AI”地区固定为美国，仅选择要参与 AI 的来源。
5. 点击 **生成配置**，可在浏览器本地生成 YAML；也可点击 **生成订阅链接**，生成长期可用的 Primus 私有订阅地址。
6. 可复制订阅链接，或点击 **一键导入 Clash Verge Rev**。
7. 本地下载文件名为 `Primus-Mihomo.yaml`；Clash Verge Rev 中订阅显示名为 `Primus`.

当前节点策略：

- 节点来源统一命名为：`机场 / 自建 / 备用`
- 日用：来源可选，地区可多选；默认 `机场 + 自建`，地区默认 `新加坡`
- AI：地区固定 `美国`，来源可选；默认 `机场 + 自建 + 备用`
- 备用：启用 `备用` 来源后，保留整个备用订阅作为人工备用组
- 某个来源停用后，相关 Provider 和策略引用不会出现在最终 Mihomo 配置中
- 番茄 / 抖音 / 小红书：默认直连，可手动切换到全球代理策略
- 所有代理策略均为手动选择，不使用 `url-test`、`fallback`、`load-balance` 或自动容灾

配置生成器会记住“来源启用 / 日用来源 / 日用地区 / AI 来源”的选择，但不会把真实订阅 URL 保存到浏览器本地存储。

### Loon

Loon 与 Mihomo 采用同一套“来源 + 地区”选择逻辑，但 **Loon 不在配置文件里保存节点订阅 URL**。

正确顺序必须是：

1. 打开“配置生成器”，切换到 **Loon**。
2. 先选择要启用的来源：`机场 / 自建 / 备用`。
3. 在“日用节点”中选择来源和一个或多个地区。
4. AI 地区固定为美国，只选择要参与 AI 的来源。
5. 点击 **生成 Loon 配置**，先生成并检查当前配置。
6. 点击 **一键导入 Loon 配置**，先把配置文件导入 Loon。
7. **最后**再到 Loon App 中添加节点订阅资源；资源名称必须严格使用 `机场 / 自建 / 备用`。
8. 没有启用的来源不需要在 Loon 里添加。

如果来源或地区在生成后被修改，Builder 会自动让“一键导入 Loon 配置”失效，必须重新生成，避免导入旧配置。

当前默认 Loon 配置文件：

https://raw.githubusercontent.com/Primus-z-xt/Primus-Proxy/main/loon/Primus-Loon.lcf

动态模板：

https://raw.githubusercontent.com/Primus-z-xt/Primus-Proxy/main/loon/template.lcf

## Mihomo 订阅后端

Mihomo 私有订阅由独立 Cloudflare Worker 提供：

- Worker：`primus-config`
- 域名：`config.primusz.top`
- 存储：Cloudflare KV
- 模板：本仓库 `mihomo/template.yaml`
- Worker 源码：本仓库 `cloudflare/primus-config.js`
- Mihomo 动态接口：`/api/mihomo` → `/mihomo/<token>`
- Loon 动态接口：`/api/loon` → `/loon/<token>`

工作方式：配置生成器把已启用的上游订阅地址、日用来源、日用地区和 AI 来源提交到 Worker。Worker 生成随机 token 并保存到 KV。客户端访问 `https://config.primusz.top/mihomo/<token>` 时，Worker 会读取仓库中的最新 Mihomo 模板，并按该 token 保存的选择动态生成 Provider 与策略组。

新版 Worker 向后兼容旧 KV 记录：旧 token 仍按旧生产默认值解析为“日用：自建 + 机场新加坡；AI：机场 + 自建 + 备用美国”，因此升级 Worker 不需要重建现有 token。

如果上游订阅 URL 或地区 / 来源选择需要变化，目前仍采用重新生成订阅链接的方式获得新 token。

## 隐私与安全

- 点击 **生成配置**：已启用的上游订阅地址仅在当前浏览器本地参与生成，不上传、不保存。
- 点击 **生成订阅链接**：已启用的上游订阅地址及策略选择会提交到 `config.primusz.top` 并保存到私有 KV，以便远程订阅持续工作。
- Primus 订阅 URL 中只暴露随机 token，但该 URL 本身等同于访问密钥；不要公开分享。
- 上游真实订阅地址不写入 GitHub 仓库，也不写入 GitHub Actions。

## 生产结构

当前生产链路：

`GitHub 仓库 → GitHub Pages Builder → Cloudflare primus-config + KV → Mihomo / Clash`

Loon 配置直接由本仓库统一维护并通过 GitHub Pages / Raw 文件下发。


## Loon 动态配置说明

Loon 的 token 只保存“启用来源 / 日用来源 / 日用地区 / AI 来源”等配置选择，不保存任何节点订阅 URL。节点订阅仍由用户在 Loon App 中手动维护。

之所以要求“先导入配置，再添加节点”，是为了把配置结构和节点资源彻底分开：配置文件只负责 Remote Filter、策略组和规则；节点资源后续按 `机场 / 自建 / 备用` 的固定名称加入后，会自动被对应筛选器引用。
