# Primus Proxy

为 **Clash / Mihomo** 和 **Loon** 生成个人代理配置，将机场、自建和备用节点按用途与地区整理，支持日用、AI 及可选的 Emby / Plex 分流。

**[打开配置生成器 →](https://primus-z-xt.github.io/Primus-Proxy/)**

节点订阅需自行提供；生成后在客户端内手动选择节点。

## Clash / Mihomo 怎么用

1. 在生成器选择 **Mihomo / Clash**，启用需要的“机场 / 自建 / 备用”，填写对应订阅链接。
2. 选择日用节点的来源与地区；AI 地区固定美国，按需选择来源。
3. 需要媒体分流时填写 Emby / Plex 设置，不使用时留空。
4. 点击 **生成订阅链接**，复制到客户端或点击 **一键导入 Clash Verge Rev**。只需要本地文件时，点击 **生成配置** 后下载 YAML。

自建来源使用 S-UI 时，请填写带 `format=clash` 的 Clash 格式订阅。

## Loon 怎么用

1. 切换到 **Loon**，选择启用来源、日用地区和 AI 来源，按需填写媒体设置。
2. 点击 **生成 Loon 配置**，再点击 **一键导入 Loon 配置**。
3. 在 Loon App 内单独添加节点订阅资源，名称与启用来源对应，必须使用 **机场 / 自建 / 备用**。

Loon 配置与节点资源分开维护，生成器不接收 Loon 的节点订阅链接。

## Emby / Plex 与后续调整

- Emby 可单独选择来源和地区。Clash 中直接选节点；备用来源只纳入符合所选地区的大流量节点。
- Plex 固定源站是可选项，需要时同时填写域名和源 IP，复用 Emby 策略。
- 修改生成器中的来源、地区或媒体设置后，重新生成并导入配置。在客户端内更换已列出的节点，无需重新生成。

## 使用提醒

- 本地“生成配置”不会上传填写的订阅链接和媒体设置。
- 生成远程订阅或一键导入 Loon 时，相关配置会发送到 `config.primusz.top` 保存；其中 Loon 不包含节点订阅链接。
- 私有配置链接等同访问密钥，请勿公开分享，也不要把真实节点订阅或媒体线路提交到 GitHub。

## 更多资料

- [维护与架构说明](./docs/PRODUCTION_BASELINE.md)
- [VPS / S-UI 部署、迁移与故障排查](./docs/deployment/Primus-VPS-SUI-SOP.md)
- [变更记录](./docs/CHANGELOG.md) · [当前配置版本](./VERSION.json)

> **给 AI / Agent：** 修改前请先阅读 [AGENTS.md](./AGENTS.md)，并检查目标分支中的实际代码与配置。README 主要介绍功能和使用方法，具体行为以代码为准。
