# Agent 工作指引

本文件适用于整个 Primus Proxy 仓库。README 面向使用者；这里说明代码阅读、修改范围和验证要求。

## 开始前先核对实现

1. 明确用户本次目标与授权范围，核对目标分支、当前提交和工作区已有改动，保留与任务无关的修改。
2. 默认以 GitHub `main` 作为生产代码参考；用户指定其他分支时使用指定分支。先确认本地副本是否与目标分支一致。
3. 阅读与任务相关的实际代码、模板、`VERSION.json` 和发布流程，理解当前生成路径后再修改。
4. 按需查阅 [维护与架构说明](docs/PRODUCTION_BASELINE.md)、[部署 SOP](docs/deployment/Primus-VPS-SUI-SOP.md) 和 [变更记录](docs/CHANGELOG.md)。

README、历史聊天、项目附件和 SOP 都不能替代源码检查。文档与实现冲突时，核实差异并修正说明，不得直接用历史方案覆盖当前代码。仓库代码、文档描述和线上实际部署状态需要分别确认。

## 按任务定位文件

| 任务 | 优先检查 |
| --- | --- |
| 生成器页面、交互与本地配置生成 | `builder/index.html`、`builder/app.js`、`builder/emby-region.js` |
| 远程订阅、接口、KV 兼容与动态输出 | `cloudflare/primus-config.js` |
| Clash / Mihomo 配置 | `mihomo/template.yaml`，以及 Builder / Worker 对应生成函数 |
| Loon 配置 | `loon/template.lcf`、`loon/Primus-Loon.lcf`，以及 Builder / Worker 对应生成函数 |
| 配置版本和网页发布 | `VERSION.json`、`.github/workflows/bump-version.yml`、`.github/workflows/pages.yml` |
| 现有回归测试 | `cloudflare/primus-config.test.mjs` |

## 修改范围与兼容

- 以用户当前要求确定范围。只改 Clash / Mihomo 时，保持 Loon 配置行为；只改 Loon 时同理。共享函数或模板改动需要检查另一端是否受影响。
- 同一功能可能同时存在于 Builder 本地生成、Worker 远程生成和模板中。检查是否需要同步，避免一种生成方式生效、另一种仍旧报错。
- 保留未被任务要求改变的策略、来源与地区筛选、接口和历史订阅兼容。不要为修改配置而重建现有 token 或覆盖无关 KV 记录。
- 当前策略结构是理解实现的背景，不是永久禁止修改的规范；用户明确要求变更时，按新目标实施并同步相关文档。
- 不提交真实上游订阅、带私有 token 的链接、客户端认证信息、密码、私钥、管理路径或私有媒体地址。示例和测试使用虚构数据，敏感备份放在仓库外。

## 验证与版本

按修改影响选择验证，不把所有检查机械地用于每次任务：

- 文档修改：核对使用步骤与代码、相对链接、隐私及变更范围；纯文档变更不升级配置版本。
- 生成逻辑修改：运行现有回归测试 `node cloudflare/primus-config.test.mjs`；补充能覆盖实际风险的用例，比较本地和远程生成结果。
- 修改 Clash / Mihomo 输出时，检查 YAML 可解析、策略组与规则引用有效；涉及内核行为时运行 Mihomo 配置检查，涉及导入或更新时验证客户端实际结果。HTTP 200 不能证明配置可用。
- 只修改一端而涉及共享逻辑时，比较另一端输出，确认未引入行为变化。未完成实机验证的项目应如实说明。
- `VERSION.json` 是配置版本来源：Mihomo 行为变化只升级 Mihomo；Loon 行为变化只升级 Loon；两端都变才都升级。纯 UI / 文档调整不升级配置版本。
- 升级版本时同步对应模板 / 快照的版本头，时间使用北京时间（Asia/Shanghai），并更新必要的变更记录。

## 提交与上线

- 遵循用户已有的提交与发布授权，只提交本次任务相关文件。
- 检查当前工作流的触发条件。GitHub 提交成功、Pages 发布成功、Worker 部署成功是不同结果。
- 当前 Worker 源码提交到 GitHub 后仍需单独部署到 Cloudflare；只有任务涉及 Worker 发布时才执行，并核对目标 Worker、绑定、激活版本与实际输出。纯文档修改无需部署 Worker。
- 完成后说明改了什么、验证了什么，以及已经提交 / 已经部署到哪一步；未执行或失败的检查不要写成通过。
