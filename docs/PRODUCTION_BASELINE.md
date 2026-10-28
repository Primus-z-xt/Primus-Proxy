# Primus Proxy 维护与架构

默认参考 GitHub `main` 的实际实现；线上状态另查部署。开始修改前读 [AGENTS.md](../AGENTS.md)，使用方法见 [README](../README.md)，VPS 安装、升级和排障见 [部署 SOP](deployment/Primus-VPS-SUI-SOP.md)。旧聊天和附件只作历史参考。

## 文件与发布对象

| 文件 | 职责 |
| --- | --- |
| `VERSION.json` | Mihomo / Loon 配置版本及北京时间更新时间 |
| `builder/index.html`、`app.js`、`emby-region.js` | 页面、本地生成及媒体选择交互 |
| `mihomo/template.yaml` | Mihomo 模板 |
| `loon/template.lcf`、`loon/Primus-Loon.lcf` | Loon 模板及默认快照 |
| `cloudflare/primus-config.js` | 远程配置、KV 兼容与接口 |
| `cloudflare/primus-config.test.mjs` | 现有生成逻辑回归测试 |
| `.github/workflows/pages.yml` | Builder / 模板静态发布 |
| `.github/workflows/bump-version.yml` | 人工选择目标的配置版本升级 |

GitHub 提交、Pages 发布、Cloudflare Worker 部署是三个结果。当前工作流没有自动部署 Worker；纯 VPS 或文档维护无需重新部署它。文档变更不触发当前 Pages 路径过滤器。

## 配置生成与客户端

Builder 入口：https://primus-z-xt.github.io/Primus-Proxy/

| 客户端 | 生成与节点来源 |
| --- | --- |
| Mihomo | 本地生成 YAML，或提交启用来源/策略到 Worker 生成私有订阅；每个来源仅一个 Provider，地区在策略组过滤 |
| Loon | 生成策略配置；App 单独添加名为 `机场 / 自建 / 备用` 的节点资源，生成器不接收这些资源 URL |

两端均以手动选择为当前实现，日用来源/地区可选，AI 固定美国且来源可选。最终策略、过滤器名称和插件以模板与生成函数为准。

Mihomo Provider 缓存路径包含上游 URL 短哈希，避免地址变化沿用旧缓存；备用排除订阅信息节点，使用 `🛟 ` 前缀区分来源。不按地区重复创建 Provider，以免同名节点 `ambiguous`。不显示独立备用大流量顶层组，普通备用节点保持完整。

Loon 的配置与资源共同决定最终行为；配置文件不包含节点 URL 是设计选择，不能为“补节点”而把凭据嵌入公开模板。当前插件以 `loon/template.lcf` 为准，不在此重复维护清单。

## Emby / Plex

- Emby 有独立来源与地区选择，不复用日用地区；客户端内保持手动切换。
- Mihomo 的 Emby 直接列节点，没有来源子组；备用同时满足所选地区和大流量筛选。
- Loon 的 Emby 保留机场/自建地区过滤器及 `备用 · Emby大流量`。
- 可选 Plex 域名与固定源 IP 复用 Emby 策略，不另建策略组。Mihomo 注入 `hosts`，Loon 注入带 `use-in-proxy=true` 的 `[Host]`。
- 私有线路仅生成 DOMAIN-SUFFIX / IP-CIDR / IP-CIDR6 等对应规则；具体渲染以 Builder 与 Worker 的实现为准。

VPS 服务端 Plex 定向是另一层：只影响经过该 VPS 且域名可识别的请求，不能替代客户端分流，也不能控制其他机场。原理、端口、验收与本次未通过状态集中在部署 SOP，避免在多处复制。

## Worker 与 KV

生产 Worker：`primus-config`；域名：`https://config.primusz.top`；绑定：`MIHOMO_KV`。

| 接口 | 用途 |
| --- | --- |
| `POST /api/mihomo` | 保存 Mihomo 私有来源与策略 |
| `GET /mihomo/<token>` | 生成 Mihomo 配置 |
| `POST /api/loon` | 保存 Loon 策略及可选媒体设置 |
| `GET /loon/<token>/Primus-Loon.lcf` | 生成 Loon 配置 |

Worker 从 main 读取模板与版本文件，成功响应的 `X-Primus-Worker-Revision` 用于核对部署代码，不能替代实际加载验证。

保留历史 Mihomo token 与 KV 结构兼容。迁移自建上游只改命中的 legacy `self_url` 或现代 `sources.self.url`，不重建 token、不清空 Namespace、不改变机场/备用与客户端选择。Mihomo 自建源使用 `format=clash`；Loon 资源另行更新。

模板的私有规则注入点采用注释形式以兼容旧 Worker。生成逻辑如有变更，检查 Builder、Worker 与模板是否都需要同步，运行现有回归测试，并验证未要求修改的客户端行为。

## 隐私与版本

本地生成不上传来源 URL 和媒体设置；主动生成远程 Mihomo 订阅才将启用来源等配置保存到私有 KV。Loon 一键导入会发送策略及可选媒体设置，但不包含节点资源 URL。Emby/Plex 私有输入不写入 localStorage、Git 或公开快照；私有 token URL 等同访问密钥。

版本以 `VERSION.json` 为唯一来源：

- 改 Mihomo 行为只升级 Mihomo，改 Loon 行为只升级 Loon，两端都改才都升级。
- UI、文档或 VPS 软件维护不增加客户端配置版本。
- `updated_at` 使用 `Asia/Shanghai`、`YYYY-MM-DD HH:mm:ss`。
- `Bump Config Version` 工作流按选择同步版本文件、模板及 Loon 快照版本头；不按 commit 自动计数。

## Pages

`pages.yml` 发布 Builder 三个文件及 `VERSION.json`，并将三个配置文件映射为 `/template.yaml`、`/Loon-template.lcf`、`/Primus-Loon.lcf`。Builder 读取版本文件；Worker 代码仍需单独发布。版本更新后的实际部署以运行结果确认。

## VPS 当前维护记录

2026-10-28：Debian 12，S-UI 1.6.6 / sing-box 1.14.4；node 灰云直连、面板/订阅橙云分离。已完成公钥专用 SSH、系统与内核更新、管理端口 Cloudflare 来源限制、日志限制及无效网卡配置修复。

本次两协议服务器侧 HTTPS 转发与 12 份订阅回归通过；Plex 固定源站当时不可达，用户网络 TCP 直连与全部设备未重新验收。UDP 参数保持原值。具体证据、适用边界与恢复方法见 [部署 SOP](deployment/Primus-VPS-SUI-SOP.md#9-2026-10-28-已执行与未执行)。
