# Changelog

## 2026-10-05

### Mihomo v10 / Loon v27 — Plex 固定源站复用 Emby

- Builder 的 Emby 区域新增可选 Plex 域名与源 IP 输入。
- Plex 不新增独立策略组，规则直接指向现有 Emby 策略，因此可继续在 Emby 内手动选择机场 / 自建 / 备用节点。
- Mihomo 动态注入 `hosts` 固定解析；Loon 动态注入 `[Host]` 固定解析，避免 Plex 域名继续命中朋友的中转 IP。
- Plex 域名与源 IP 不写入 GitHub，也不写入浏览器 localStorage；生成远程配置时仅进入私有 KV。
- Worker 代码同步更新，Cloudflare 侧需手动重新部署。

## 2026-10-04

### Mihomo v9 / Loon v26 — Emby 备用大流量叠加地区筛选

- Emby 选择备用来源时，改为“大流量节点 ∩ Emby 所选地区”。
- 普通 `备用大流量` 分组保持不变，仍显示全部大流量节点。
- Mihomo 新增独立 `📺 Emby · 备用大流量` 子组；Loon 新增 `备用 · Emby大流量` 过滤器。
- 机场/自建的 Emby 地区筛选逻辑保持不变。
- Worker 代码同步更新，Cloudflare 侧仍需手动重新部署。

### Mihomo v8 / Loon v25 — 备用大流量分组

- 根据备用订阅现有“大流量组”节点命名特征新增独立 `备用大流量` 分组。
- 普通 `备用节点` 仍显示备用订阅全部有效节点，不受影响。
- Emby 选择备用来源时，不再使用 `备用 · 全部` 或 Emby 地区筛选，改为直接使用 `备用大流量`。
- Emby 的机场/自建来源仍继续使用 Builder 中独立选择的 Emby 地区。
- Loon 与 Mihomo 同步实现；Worker 需手动重新部署。

### Mihomo v7 / Loon v24 — Emby 修复与来源排序

- 修复 Builder 本地生成时 Emby 地区筛选未完整写入的问题。
- 自建来源在日用、AI、Emby 等混合来源策略中优先排列。
- Loon Emby 策略组补充图标。

本文件只记录会影响生产架构、配置行为或维护方式的重要变化。UI 微调不要求逐条记录。

## 2026-09-28

### Mihomo v6 / Loon v23 — Emby 地区筛选

- Emby 新增独立“地区 · 可多选”筛选，不复用日用节点地区。
- Mihomo：Emby 来源子策略组增加地区正则过滤。
- Loon：Emby 来源 Remote Filter 增加地区正则过滤。
- Emby 播放线路仍保持私有，不写入 GitHub 或浏览器 localStorage。
- 版本号更新为 Mihomo v6 / Loon v23。

### Mihomo v5 / Loon v22 — 私有 Emby 分流

- 新增独立 Emby 分类。
- Builder 可输入私有 Emby 播放地址，并选择 `机场 / 自建 / 备用` 作为可切换来源。
- Mihomo 新增 `📺 Emby` 顶层策略组和按来源拆分的手动子策略组。
- Loon 新增 `Emby` 策略组及来源全节点过滤器。
- Emby 播放地址不写入 GitHub，也不写入浏览器 localStorage。
- 本地生成时，私有地址只进入本地配置；生成远程配置时才保存到私有 KV。
- 模板使用注释型私有规则注入点，保证旧 Worker 拉取新模板时仍保持有效。
- Worker 源码升级以支持 Emby 私有目标和来源选择；Cloudflare 侧需要手动重新部署 Worker。
- `VERSION.json` 更新为 Mihomo v5 / Loon v22。



## 2026-09-27

### 版本管理与生产基线

- 新增 `VERSION.json`，作为 Mihomo / Loon 唯一版本来源。
- Builder 改为动态读取版本文件显示版本，并把版本信息写入本地生成配置。
- Worker 源码加入版本文件读取能力；部署新版 Worker 后，远程动态配置也会跟随 `VERSION.json`。
- 新增半自动 `Bump Config Version` 工作流：只在配置行为变化时人工触发版本 +1，并自动写入北京时间。
- GitHub `main` 正式作为唯一生产真源。
- 旧项目 TXT / SOP 降级为历史资料。

### Mihomo v4

- 每个来源仅加载一个 Provider。
- 地区筛选迁移到 Proxy Group `filter`。
- Provider 缓存路径加入上游 URL 哈希。
- 解决重复地区 Provider 导致的同名节点 `ambiguous`。
- 保留手动 select、AI 固定美国、备用独立选择等生产原则。

### Loon v21

- 保持机场 / 自建 / 备用三类资源结构。
- 加入 `nodecheck.lpx`。
- 已按当前 Loon 兼容性复核，旧配置语法继续可用。

### Builder UI

- 重做桌面和移动端响应式布局。
- 地区卡片不再因少量选项横向拉伸。
- Windows / 手机统一使用 SVG 国旗资源。
- 修复台湾地区国旗在移动端不显示。
- 统一圆角矩形复选框和居中圆润对勾。
- 移除卡片左上角紫色装饰线。

> 上述 UI 修改不改变 Mihomo / Loon 配置行为，因此不单独升级配置版本。
