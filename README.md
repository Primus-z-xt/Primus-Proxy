# Primus Proxy

统一维护 Primus 的 Loon 与 Mihomo / Clash 配置。

## 目录

- `loon/Primus-Loon.lcf`：Loon 当前生产配置
- `mihomo/template.yaml`：Mihomo / Clash 配置模板
- `builder/index.html`：浏览器本地配置生成器
- `.github/workflows/pages.yml`：GitHub Pages 自动部署

## 设计原则

- 节点来源保持独立：自建 / 机场-A / 备用
- 所有策略均为手动 `select`
- 不使用 `url-test`、`fallback`、`load-balance` 或自动容灾
- 普通代理：全球代理策略 → 主力节点 / 备用节点
- 主力节点：自建 · 全部 / 机场-A · 香港
- AI：仅使用各真实来源中的美国节点
- 番茄 / 抖音 / 小红书：DIRECT / 全球代理策略
- Apple CN / Microsoft CN / LAN / CN → DIRECT
- 4ktop.com → DIRECT
- 最终 MATCH → 全球代理策略

## 迁移状态

`Primus-Loon` 暂时保留为冗余仓库。待本仓库的 Loon、Mihomo 和 Builder 完成验证后，再切换为唯一生产仓库。
