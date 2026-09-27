# Changelog

本文件只记录会影响生产架构、配置行为或维护方式的重要变化。UI 微调不要求逐条记录。

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
