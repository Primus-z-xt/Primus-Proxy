# Primus Proxy 项目来源指针

Primus Proxy 当前生产真源：

`https://github.com/Primus-z-xt/Primus-Proxy`

生产分支：

`main`

以后处理 VPS / Mihomo / Loon / Builder / Worker 相关生产问题时：

1. 先读取 `docs/PRODUCTION_BASELINE.md`。
2. 再读取 `VERSION.json`。
3. 最后读取与任务相关的当前 `main` 文件。

Mihomo / Loon 当前版本不要从本项目来源文件硬编码判断，统一以 GitHub `VERSION.json` 为准。

旧的《Primus-Mihomo-Worker-当前生产基线》与《Primus-Proxy-统一生产SOP-v1》只作为历史参考，不再作为恢复或修改依据。
