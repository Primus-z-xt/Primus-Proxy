# Primus Proxy

统一维护 Loon 与 Mihomo / Clash 配置。

当前生产版本：

- Mihomo / Clash：`v1`
- Loon：`v18`

## 配置生成器

**入口：**

👉 https://primus-z-xt.github.io/Primus-Proxy/

以后如果忘记网页地址，直接打开本仓库首页，在 README 顶部点这个入口即可。

## 使用方法

### Mihomo / Clash

1. 打开上面的“配置生成器”。
2. 依次粘贴：`自建`、`机场-A`、`备用` 三个订阅链接。
3. 可直接点击 **生成配置**，在浏览器本地生成 YAML。
4. 也可点击 **生成订阅链接**，生成长期可用的 Primus 私有订阅地址。
5. 可复制订阅链接，或点击 **一键导入 Clash Verge Rev**。
6. 本地下载文件名为 `Primus-Mihomo.yaml`；Clash Verge Rev 中订阅显示名为 `Primus`。

当前节点策略：

- 日用：`自建全部 + 机场-A 新加坡`
- AI：仅使用 `机场-A / 自建 / 备用` 中的美国节点
- 备用：整个备用订阅，手动选择
- 番茄 / 抖音 / 小红书：默认直连，可手动切换到全球代理策略
- Apple CN / Microsoft CN / 中国大陆 / 局域网：直连
- 所有代理策略均为手动选择，不使用 `url-test`、`fallback`、`load-balance` 或自动容灾

### Loon

1. 打开“配置生成器”。
2. 切换到 **Loon**。
3. 可直接载入、复制或下载当前 `Primus-Loon.lcf`。
4. 节点订阅继续在 Loon App 内以 `自建 / 机场-A / 备用` 三个资源名称维护。

当前 Loon 配置文件：

https://raw.githubusercontent.com/Primus-z-xt/Primus-Proxy/main/loon/Primus-Loon.lcf

Loon 与 Mihomo 保持相同的主要地区策略：日用使用自建及机场-A 新加坡，AI 仅使用美国节点。

## Mihomo 订阅后端

Mihomo 私有订阅由独立 Cloudflare Worker 提供：

- Worker：`primus-config`
- 域名：`config.primusz.top`
- 存储：Cloudflare KV
- 模板：本仓库 `mihomo/template.yaml`

工作方式：配置生成器把三个上游订阅地址提交到 Worker，Worker 生成随机 token 并保存对应关系到 KV。客户端访问 `https://config.primusz.top/mihomo/<token>` 时，Worker 会读取仓库中的最新 Mihomo 模板并动态生成配置，因此已有 Primus 订阅链接可以自动使用后续更新后的模板。

## 隐私与安全

- 点击 **生成配置**：三个上游订阅地址仅在当前浏览器本地参与生成，不上传、不保存。
- 点击 **生成订阅链接**：三个上游订阅地址会提交到 `config.primusz.top` 并保存到私有 KV，以便远程订阅持续工作。
- Primus 订阅 URL 中只暴露随机 token，但该 URL 本身等同于访问密钥；不要公开分享。
- 上游真实订阅地址不写入 GitHub 仓库，也不写入 GitHub Actions。

## 生产结构

当前生产链路：

`GitHub 仓库 → GitHub Pages Builder → Cloudflare primus-config + KV → Mihomo / Clash`

Loon 配置直接由本仓库统一维护并通过 GitHub Pages / Raw 文件下发。

旧的 Worker / 旧仓库链路不再属于当前生产架构。
