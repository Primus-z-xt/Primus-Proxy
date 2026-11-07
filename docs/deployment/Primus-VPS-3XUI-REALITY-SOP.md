# Debian 12 / 3x-ui REALITY 部署与验收

维护日期：2026-11-07。先读仓库 `AGENTS.md`。本文件不包含真实面板路径、订阅 token、UUID 或私钥。

## 本轮状态

- Debian 12，运行内核 `6.1.0-54-amd64`，发行包 `6.1.190-1`，已重启进入新内核。
- 保留原有 3x-ui 3.11.0、面板账户、随机管理端口和路径；文件备份及一致性 SQLite 备份已保存至服务器 root 专用目录。
- Xray 固定为官方 26.10.31；ZIP SHA-256 与官方 `.dgst` 一致。官方 systemd 服务已启用，面板本机 HTTPS 返回 200，复用已有有效 TLS 证书。
- 用户选择自行添加入站，不创建本次部署 API 令牌。按用户要求已恢复面板 HTTPS 网络监听，保留随机管理端口与原路径；用户授权重设的密码已通过本机正常登录验证并单独交付。公网域名/代理与实际客户端访问仍需另验，不在仓库记录凭据。
- 面板内置候选 `www.cloudflare.com:443`、SNI `www.cloudflare.com`：VPS 已验证 TLS 1.3、H2 和证书。此项不代表真实 REALITY 鉴权或国内链路已通过。
- 入站尚待用户保存；系统就绪不能写成节点已连通。HY2、媒体定向和其他旧业务不属于本轮自动恢复范围。

## 端口和随机值

| 用途 | 选择原则 |
| --- | --- |
| 面板管理 | 保留安装时的随机高位端口与 HTTPS；直连域名需仅 DNS，或独立配置正确的反向代理端口映射 |
| REALITY 客户端入口 | 优先 TCP 443；仅在实测支持其他端口且确有必要时调整 |
| REALITY 目标站 | 目标真实 HTTPS 端口 443，与入站端口独立，不随意随机 |
| SSH | 保留现有可用端口；未来变更须先验证新通道与恢复入口 |
| Xray / 面板内部控制 | 保留自动分配或默认端口，只能本机访问 |
| 自动订阅 | 独立 HTTPS 地址的标准 443；不与 REALITY 业务入口混用橙云 |
| ACME HTTP-01 | 对外验证固定 80；仅改内部端口不改变 CA 访问端口。DNS-01 不需开放 80 |
| 未来 HY2 | 优先 UDP 443，可与 TCP 443 共存；分别验收占用、证书和连通性 |

UUID、密钥对、Short ID、管理路径与凭据使用强随机值。目标与 SNI 必须配对，不能各自随机。

## 手动添加入站

1. 通过已交付的 HTTPS 入口登录面板，新增入站：`🇺🇸 US-DC9-REALITY`、VLESS、TCP/RAW、443。
2. 用户 UUID 使用面板生成；Flow `xtls-rprx-vision`，VLESS 加密 `none`。不启用额外混淆、复用或尚未验收的新功能。
3. 安全 REALITY；从面板内置候选选择 `www.cloudflare.com:443`、SNI `www.cloudflare.com`，再次运行面板检测。
4. 密钥对、Short ID 由面板生成；客户端指纹 chrome。私钥仅留在服务器，不导出至公开仓库。REALITY 不需要自己域名的 TLS 私钥。
5. 保存后读取面板生成的 Core 配置与日志，再执行下面的真实客户端验收。

## Primus 接入与发布

Mihomo 每个 REALITY VLESS 节点的 `reality-opts` 下需要 `support-x25519mlkem768: true`，指纹 chrome。该键不能放在 YAML 根级。Primus v15 在所有 Provider 的 `override.override-expr` 中条件覆写，本地、Worker 与历史 KV 渲染相同；后续订阅更新仍应用。非 REALITY 节点不注入这些字段。

两端表单初始全部关闭。用户至少选择节点来源、日用来源/地区和 AI 来源；AI 保持美国规则。测速按需开启。旧远程订阅仍保留原选择；机场接口和朋友备用不删除。Loon 必须在实际 App 版本独立测试，不能套用 Mihomo 字段。

GitHub、Pages 和 Worker 发布分别验证；发布原 Worker 时保留绑定、路由与 KV。只有新节点真实验收通过，才切换已有订阅的自建上游。公开 Loon v30 静态预设继续保留，不将空白表单生成成无节点配置。

## 验收与回退

1. 核对运行内核、面板/Core 版本、服务和监听；确认重启后 SSH 可用。
2. 用户保存后检查 TCP 443 监听、本机 REALITY 鉴权和承载 HTTPS 请求。
3. 从用户网络验证 TCP 建连、REALITY 鉴权及出口。TCP 失败先看双端抓包，不反复重装或更换 SNI。
4. 在 Mihomo 导入最终完整 Primus 配置、更新 Provider、选择新节点并验证分流；HTTP 200 和语法检查均不等于节点可用。
5. Loon 独立实测，朋友节点保留；HY2 和媒体业务另行验收。检查证书续期与服务重启。
6. 保留数据库、原 Core、Worker 备份；故障回退对应组件，不把存在已知风险的旧版本当作长期基线。

## 依据

- [不翻车完整教程](https://bufanche.com/guides/3x-ui-full-setup/)、[新版 Xray 故障说明](https://bufanche.com/guides/xray-upgrade-not-blocked/)，教程旧版本号按官方当前稳定版校正。
- [3x-ui 3.11.0](https://github.com/MHSanaei/3x-ui/releases/tag/v3.11.0)、[内置目标候选](https://github.com/MHSanaei/3x-ui/blob/v3.11.0/internal/web/service/reality_scan.go)。
- [Xray 26.10.31](https://github.com/XTLS/Xray-core/releases/tag/v26.10.31)、[握手要求](https://github.com/XTLS/Xray-core/issues/7259)、[Mihomo Provider 覆写](https://wiki.metacubex.one/config/proxy-providers/)。
- [Debian 内核修复状态](https://security-tracker.debian.org/tracker/CVE-2026-98432)。
