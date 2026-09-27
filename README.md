# Primus Proxy

统一维护 **Mihomo / Clash** 与 **Loon** 的个人代理配置、策略组和远程订阅入口。

> 当前生产版本：**Mihomo v4 · Loon v21**

## 配置生成器

**入口：** https://primus-z-xt.github.io/Primus-Proxy/


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

- 默认生产配置：`loon/Primus-Loon.lcf`
- 动态模板：`loon/template.lcf`

---

## Cloudflare 动态后端

私有订阅由独立 Cloudflare Worker 提供：

- Worker：`primus-config`
- 域名：`config.primusz.top`
- 存储：Cloudflare KV
- Worker 源码：`cloudflare/primus-config.js`
- Mihomo：`POST /api/mihomo` → `GET /mihomo/<token>`
- Loon：`POST /api/loon` → `GET /loon/<token>/Primus-Loon.lcf`

### Mihomo

Builder 会把已启用的上游订阅 URL、日用来源、地区和 AI 来源提交到 Worker。Worker 只在 KV 中保存这些数据与随机 token；客户端请求 token URL 时，再读取仓库中的最新 Mihomo 模板动态生成配置。


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
GitHub
  ├─ builder/          GitHub Pages 配置生成器
  ├─ mihomo/           Mihomo 动态模板
  ├─ loon/             Loon 生产配置与动态模板
  └─ cloudflare/       primus-config Worker 源码

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
