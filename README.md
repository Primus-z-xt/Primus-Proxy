# Primus Proxy

统一维护 Loon 与 Mihomo / Clash 配置。

## 配置生成器

**入口：**

👉 https://primus-z-xt.github.io/Primus-Proxy/

以后如果忘记网页地址，直接打开本仓库首页，在 README 顶部点这个入口即可。

## 使用方法

### Mihomo / Clash

1. 打开上面的“配置生成器”。
2. 依次粘贴：`自建`、`机场-A`、`备用` 三个订阅链接。
3. 点击 **生成配置**。
4. 复制 YAML，或下载 `config.yaml`。
5. 导入 Clash Verge Rev / FlClash / Mihomo 使用。

订阅链接只在当前浏览器本地参与生成，不上传、不保存。

### Loon

1. 打开“配置生成器”。
2. 切换到 **Loon**。
3. 可直接载入、复制或下载当前 `Primus-Loon.lcf`。

当前 Loon 配置文件：

https://raw.githubusercontent.com/Primus-z-xt/Primus-Proxy/main/loon/Primus-Loon.lcf

## 简要说明

- 普通代理：手动选择主力或备用。
- AI：只使用各来源中的美国节点。
- 番茄 / 抖音 / 小红书：可手动选择直连或代理。
- 不使用自动测速、自动切换或自动容灾。

## 迁移状态

旧 `Primus-Loon` 仓库暂时保留作为备用。待本仓库完成实际使用验证后，再切换为唯一生产仓库。
