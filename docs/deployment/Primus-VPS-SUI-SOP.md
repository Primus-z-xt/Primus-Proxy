# VPS / S-UI 部署与维护

维护基线：2026-10-28，Debian 12、S-UI 1.6.6 / 内嵌 sing-box 1.14.4。版本是本次实测记录，不是永久的最新版要求；部署前核对官方发布与迁移说明。

先读 [AGENTS.md](../../AGENTS.md)。配置生成架构见 [维护说明](../PRODUCTION_BASELINE.md)，Mihomo / Loon 配置版本以 [VERSION.json](../../VERSION.json) 为准。本文件使用参数，不保存真实地址、订阅身份、私密路径或凭据。

## 1. 架构与参数

| 入口 | DNS / 协议 | 职责 |
| --- | --- | --- |
| `NODE_HOST` | 灰云，TCP 443 / UDP 443 | Reality / Hysteria2 节点直连 |
| `PANEL_HOST` | 橙云，HTTPS 2053 | S-UI 面板 |
| `SUB_HOST` | 橙云，HTTPS 2096 | S-UI 原生订阅 |
| `WORKER_HOST` | 现有 Worker 自定义域名 | 读取模板与私有 KV，生成客户端配置 |

节点流量由 S-UI 内嵌 sing-box 转发。Worker 和普通 Cloudflare 橙云不承载这些 Reality / HY2 节点连接。面板、订阅可走橙云：2053、2096 是受支持的 HTTPS 端口。共用 SAN 证书不代表共用连接地址。

准备非敏感参数：`VPS_IPV4`、`NODE_HOST`、`PANEL_HOST`、`SUB_HOST`、`WORKER_HOST`、固定的 `SUI_VERSION`；需要 Plex 时增加 `PLEX_DOMAIN`、`PLEX_TARGET_IP`、实际 `PLEX_SCHEME` 与 `PLEX_PORT`。端口以现有业务为准，不能把 Plex 端口一律视为 443 或 32400。

面板路径、客户端名称/订阅 ID、UUID、HY2 密码、Reality 私钥和 Worker token 放在仓库外的受保护文件或交互输入中。维护现有资产时保留节点名称、认证信息和旧订阅 token；新资产独立生成凭据。

## 2. 连接、初检与备份

有 Termark 时先读取其 skill，使用保存的资产和凭据；不要求用户发送密码或私钥。Windows PowerShell 的复杂远程命令使用单引号 here-string：

```powershell
termark assets list --json
@'
cat /etc/os-release
uname -r
uptime
free -h
df -hT
systemctl --failed --no-pager
ss -lntup
nft list ruleset
sshd -T
'@ | termark exec <ASSET_ID> --stdin
```

确认资产身份、现有服务、网络接口、时间同步、端口、证书、数据库和防火墙。有已有部署就进入维护流程，不再次运行初始化安装器。按资源余量、并发和日志增长判断容量，不因 1 GB 内存就直接建议扩容。

重要变更前设置 `umask 077`，建立权限 700 的备份目录，保存：

- 一致性 SQLite 备份；使用当前版本 `sui backup` 或 SQLite backup API，不在运行中仅复制主数据库而忽略 WAL。
- 当前二进制、systemd 单元及 drop-in、证书、SSH、网络、journal 与 nftables 配置。
- 有效防火墙、软件版本、变更前订阅输出和必要的回滚命令。

例如在已确认命令支持的版本上：

```sh
umask 077
BACKUP_DIR="/root/primus-backup/$(date -u +%Y%m%dT%H%M%SZ)"
install -d -m 700 "$BACKUP_DIR"
/usr/local/s-ui/sui backup -output "$BACKUP_DIR/s-ui.db"
nft list ruleset > "$BACKUP_DIR/firewall-before.nft"
```

检查备份可读和数据库完整性。备份含认证和私钥，不提交 Git。本机备份用于操作回退；异地备份按用户需求选择，不默认新增服务。

**管理连接可能经过正在维护的 HY2。** 停止 s-ui 或重启机器前，把完整的修改、启动、检查和必要回退放进服务器端独立的 systemd 维护任务，日志保存到备份目录；不能依赖会随节点断开的交互 SSH 来完成恢复。

## 3. 首次安装与两个节点

仅在目标确认为新环境且已获安装授权时执行。安装依赖按实际缺失补齐，不为普通部署额外安装抓包、压测或优化工具。固定版本，审阅官方安装器，并验证发行包官方 SHA256；失败时保留原环境。

```sh
curl -fL "https://raw.githubusercontent.com/alireza0/s-ui/v${SUI_VERSION}/install.sh" -o /root/s-ui-install.sh
less /root/s-ui-install.sh
bash /root/s-ui-install.sh "v$SUI_VERSION"
/usr/local/s-ui/sui -v
systemctl enable --now s-ui
```

数据库通常是 `/usr/local/s-ui/db/s-ui.db`，基础配置在 `settings.config`。当前版本的核心嵌入 s-ui，由 `s-ui.service` 管理；不要假定存在独立 sing-box 服务。优先通过面板持久字段配置，不编辑临时导出的核心 JSON。

| 配置 | Reality | Hysteria2 |
| --- | --- | --- |
| 入站 | VLESS，TCP/RAW，监听 TCP 443 | Hysteria2，监听 UDP 443 |
| 服务端 TLS | Reality 模板，新密钥对与 Short ID | 可信证书覆盖 `NODE_HOST` |
| 客户端 | UUID、Vision、公钥、Short ID、SNI、Chrome 指纹 | 密码、SNI=`NODE_HOST`，正常证书校验 |
| 公布地址 | `NODE_HOST:443` | `NODE_HOST:443` |

Reality 的 Handshake Server/SNI 使用已验证、从 VPS 可达的目标；历史部署验证过 `www.icloud.com:443`，不保证未来一直适用。伪装目标的 443 与 VPS 本地监听的 443 是不同连接。

保留 HY2 默认 QUIC 参数和未指定带宽的行为，不填夸大带宽，不启用 insecure。TLS 探测、TCP 监听或 ping 不能代替两个协议各自的真实代理测试。

## 4. HTTPS 与自动续期

面板与订阅分别启用 HTTPS、各自域名、2053/2096；设置随机私密面板路径及 `/sub/` 订阅路径。面板 HTTPS 正常不代表订阅也已启用。

既有方案用 Certbot standalone HTTP-01 签发覆盖 PANEL/SUB/NODE 的 SAN 证书。先确认 DNS、TCP 80 可达且未被占用；在现有橙云、WAF 和重定向配置下测试，不擅自关闭保护。全局 SSL 模式调整需评估其他源站影响；优先 Full (strict)，以授权和实际兼容性为准。

```sh
certbot certonly --standalone --dry-run --agree-tos --register-unsafely-without-email \
  -d "$PANEL_HOST" -d "$SUB_HOST" -d "$NODE_HOST"
# 演练成功后移除 --dry-run 正式签发；使用邮件通知时填写用户授权邮箱。
```

面板、订阅与 HY2 填入实际 lineage 的 `fullchain.pem` / `privkey.pem`，通常位于 `/etc/letsencrypt/live/<PANEL_HOST>/`，也可能带 `-0001` 后缀。检查 SAN、有效期、证书链和私钥权限。

保留 `certbot.timer`；部署 hook 在成功续期后执行 `systemctl try-restart s-ui.service`，让证书重新加载。用 `certbot renew --dry-run --run-deploy-hooks` 验证续期与 hook；如本轮未执行，不能把定时器存在写成演练通过。HTTP-01 持续依赖 TCP 80 和验证路径可达，成功续期的重启也可能短暂断开节点。

## 5. 可选 Plex 固定源站

目标是只改指定域名的出站 IP，保留应用端口、HTTP Host 与 TLS SNI。保留已有 `sniff` 和 DNS 接管，在可能提前结束路由的规则之前添加精确域名覆写：

```json
{
  "route": {
    "rules": [
      { "action": "sniff" },
      { "protocol": ["dns"], "action": "hijack-dns" },
      {
        "domain": ["<PLEX_DOMAIN>"],
        "action": "route-options",
        "override_address": "<PLEX_TARGET_IP>"
      }
    ]
  }
}
```

这是需合并的片段，不覆盖已有 DNS、路由或其他配置。面板 Route Options 的覆盖端口留空；`hijack-dns` 本身不建立固定映射。

仅覆盖实际经过本 VPS、可从请求域名或 HTTP Host/TLS SNI 识别的流量。纯 IP、ECH 或不可识别协议可能无法匹配；DIRECT、其他机场流量不受本 VPS 控制。保留既有 Mihomo hosts 和 Loon `use-in-proxy=true`，它们仍服务于其他来源和客户端分流。

验收先确认源站实际协议/端口和直连可达，再分别通过两节点请求无 Token 的 `/identity`，确认 Plex 应用响应、正常证书校验和真实出站目标。用客户端本地 SOCKS5 解析配合临时错误公网解析做对照，并核对流量确实进入节点。抓包仅限目标、限时，不记录或公开完整用户流量；不得用 `-k` 或默认网站 200 掩盖失败。

2026-10-17 曾完成两协议及错误 DNS 对照；2026-10-28 固定源站 TCP 443/32400 直接连接也超时，本次 Plex 未通过。保留规则，不能沿用旧通过记录，也不能仅据此判定新核心回归。

## 6. 订阅、Worker 与客户端

S-UI 当前版本以启用的客户端名称作为订阅标识，客户端应关联两个入站：

```text
Clash/Mihomo: https://<SUB_HOST>:2096/sub/<CLIENT_ID>?format=clash
sing-box:    https://<SUB_HOST>:2096/sub/<CLIENT_ID>?format=json
通用链接:    https://<SUB_HOST>:2096/sub/<CLIENT_ID>
```

保存实际导出到私有目录：检查不是 HTML/错误页，核对两个节点的 server、端口、认证、Flow、SNI 和证书校验，再做核心配置校验与实际加载。**最终输出优先于数据库中间模板判断**：2026-10-28 的 `out_json.server` 虽为面板域名，实际四个客户端的最终输出均正确使用 `NODE_HOST`，因此没有修改它。

本机源站 HTTPS 测试可用 curl 的 `--resolve` 指向 `127.0.0.1`，保留原域名证书校验；之后还要测试真实 Cloudflare 路径。源站管理端口收紧后，不能把非 Cloudflare 来源直连被拒当成服务故障。管理页正常登录重定向需与错误页区分。

Primus 生成路径见 [维护说明](../PRODUCTION_BASELINE.md)：

- Mihomo 自建来源使用 Clash 格式订阅；Loon 策略与节点资源分离，App 中的资源名必须与 `机场 / 自建 / 备用` 过滤器一致。Loon 通用订阅需验证解析器及实机支持。
- Worker KV 绑定 `MIHOMO_KV`。更新上游只改受影响记录的 legacy `self_url` 或现代 `sources.self.url`；保留原键/token、schema、机场/备用及媒体设置，不自动启用禁用来源。
- 修改前备份目标 KV 原值、生产 Worker 版本及源码。GitHub main、Pages 和 Worker 是不同发布对象；仅更新文档或 VPS 时无需部署 Worker。
- 如修改生成逻辑，按 AGENTS 运行现有回归测试并分别验证两端输出；配置版本按影响升级，不因文档变更增加版本。

导入/更新后分别测试两节点与实际出口；格式解析成功不等于手机联网。原生测试模板若因 `GEOIP,Private,DIRECT` 提前解析而绕行，先看匹配日志；曾验证 `no-resolve` 修正有效，但不能据此覆盖正式 Primus 分流模板。

## 7. 维护、安全与升级

### SSH 和防火墙

先验证保存的密钥和备用控制台，再将密码认证关闭。现有 root 公钥流程可保留 `PermitRootLogin prohibit-password`，不必为了加固临时引入未经验证的新管理员路径。用 `sshd -t`、`sshd -T` 验证配置优先级，平滑 reload 后建立新连接，再取消定时回滚。

防火墙保留回环、已建立/关联连接和必要 ICMP；节点 TCP/UDP 443、SSH 与 HTTP-01 放行。使用橙云的面板/订阅源站端口只允许 [Cloudflare 官方 IPv4](https://www.cloudflare.com/ips-v4/) / [IPv6](https://www.cloudflare.com/ips-v6/) 来源；应用前获取并验证网段，维护其更新。此限制不能替代面板登录认证。

先 `nft -c -f` 检查完整事务，安排服务器端定时回滚，再原子替换本次管理的表，保留其他业务规则。不要清空全机规则或分步先落默认 DROP。验证新 SSH、两节点、真实面板/订阅后持久化并取消回滚；重启复核。

### 升级与回退

1. 保存一致性数据库、旧二进制和自定义服务配置，记录订阅输出、版本和可复现测试。
2. 检查官方 release/迁移说明，下载固定版本并校验官方摘要。不要把当前测试版本固化为未来最新版。
3. 经服务器端独立任务停服、备份停服数据库、更新二进制、启动并检查；保留自定义 systemd 加固。数据库修改仅在确认版本结构、备份和停服后进行。
4. 失败时先保存故障库及 WAL/SHM，再恢复兼容的旧二进制和数据库；运行中不覆盖数据库。整库回退可能覆盖期间新增用户/流量，需说明影响。
5. 系统更新先刷新索引，查看计划，保留现有配置，不因更新移除无关包。新内核需维护窗口重启；检查启动文件、网卡配置和服务自启后执行，回来复测。

系统包更新不保证一键降级；保留旧内核和服务商控制台。节点升级的短暂中断应提前告知，但不要重复询问用户已经授权的正常步骤。

### 日志和性能

日常 s-ui 日志可用 `warn`，排障时限时提升等级；不要只为降低错误数量而隐藏实际故障。本次 journal 限制示例：

```ini
[Journal]
SystemMaxUse=200M
RuntimeMaxUse=32M
MaxRetentionSec=14day
```

写入 `/etc/systemd/journald.conf.d/` 并加载，按容量和审计需求调整。服务异常应查根因；例如残留不存在的 eth1，应修配置并验证重启，而非只清除失败标记。

UDP 缓冲提高有 [quic-go 官方实验](https://quic-go.net/docs/quic/optimizations/) 与 [Hysteria 性能指南](https://hysteria.network/docs/advanced/Performance/)依据，建议值分别约 7 MiB、16 MiB；它们不是所有线路的默认调参清单。累计 `UdpRcvbufErrors` 只证明历史丢包，应比较相同负载下的增量、吞吐、延迟和内存。2026-10-28 原 212992 字节上限的错误计数在观察期未增长，因此保留参数；未改 MTU、带宽、QUIC 窗口或拥塞策略。TCP BBR + fq 原已启用，不能与 HY2 的 QUIC 控制混为一谈。

## 8. 验收与排障

| 验收层 | 需要的证据 |
| --- | --- |
| 系统 | 资源、NTP、实际内核、失败服务、开机持久化 |
| 入口 | SSH 新连接、DNS、TLS、真实 Cloudflare 面板与订阅 |
| 节点 | 两协议分别认证与 HTTPS 转发、出口、重连和订阅更新 |
| 业务 | Plex 正确源站/端口、Host/SNI、应用响应；普通网站对照 |
| 客户端 | 最终配置和原有策略可用；Loon 资源独立验证 |
| 恢复 | 一致性备份可用、回滚路径、定时器妥善处理、重启复核 |

Reality 故障先区分 TCP 握手与认证：SYN 到达、SYN-ACK 发出却没有 ACK，尚未进入 Reality；不要据此换 UUID 或重建节点。HY2 要独立测 UDP 和真实客户端。订阅导入失败检查格式和实际字段；源站和 Cloudflare 路径分开测。Plex 不通先检查直连源站，再检查嗅探和规则，不直接重装代理。

新机迁移先准备系统与节点，协调 DNS 指向和 HTTP-01 验证，完成 TLS、原生节点及业务验收后再切生产上游；保留旧 Worker/KV token、DNS 原值和旧机恢复入口。Agent 报告应区分服务器回环测试、用户线路端到端测试、配置解析和实际客户端结果，明确未通过项目。只提交脱敏文档与代码，扫描 diff，不上传数据库、私钥、KV 导出或私密订阅。

## 9. 2026-10-28 已执行与未执行

- Debian 12：更新 21 个包、新装 3 个包、移除 0 个包；重启到 `6.1.0-54-amd64`（内核包 `6.1.190-1`），无失败服务。
- S-UI 升至 1.6.6 / sing-box 1.14.4。官方发行说明含 QUIC 空闲会话内存泄漏修复；包摘要校验通过。
- 仅公钥 SSH、管理端口 Cloudflare 来源限制、warn 日志、journal 容量限制和 eth1 配置修复均已验证；证书定时续期机制保留，本轮未重新做续期演练。
- 四个客户端、三种格式，共 12 份订阅在升级前后及重启后逐字一致；节点、TLS、出站和客户端认证字段保持原样。
- 重启后面板/订阅经 Cloudflare HTTP 200，两节点服务器侧回环认证与 HTTPS 转发通过；不能宣称用户 TCP 直连问题已修复或全部设备已验收。
- Plex 源站不可达，未通过；规则保留。UDP 参数未改，本机一致性备份保留，未新增异地备份。
- 本次文档整理不改生成代码、Worker/KV、配置版本或服务器状态。

来源：[S-UI 1.6.6](https://github.com/alireza0/s-ui/releases/tag/v1.6.6)、[sing-box 路由动作](https://sing-box.sagernet.org/configuration/route/rule_action/)、[Cloudflare 代理端口](https://developers.cloudflare.com/fundamentals/reference/network-ports/)。
