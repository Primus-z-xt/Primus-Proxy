
  const MIHOMO_API = "https://config.primusz.top/api/mihomo";
  const LOON_API = "https://config.primusz.top/api/loon";
  const LOON_IMPORT_BASE = "https://www.nsloon.com/openloon/import?sub=";
  const STORAGE_KEY = "primus-proxy-builder-v2";
  const LOON_STORAGE_KEY = "primus-proxy-loon-builder-v1";
  const SOURCE_ORDER = ["airport", "self", "backup"];
  const SOURCE_META = {
    airport: { label: "机场", path: "airport", enableId: "enable-airport", urlId: "airport-url" },
    self: { label: "自建", path: "self", enableId: "enable-self", urlId: "self-url" },
    backup: { label: "备用", path: "backup", enableId: "enable-backup", urlId: "backup-url" }
  };
  const BACKUP_EXCLUDE = "(?i)(Expire|Traffic|Sync|流量|到期|过期|剩余|已用|总量|重置|订阅信息|官网|客服|套餐)";
  const REGION_GROUPS = [
    { title: "东亚 / 东南亚", codes: ["HK","TW","JP","KR","SG","MY","TH","VN","PH","ID"] },
    { title: "北美", codes: ["US","CA"] },
    { title: "欧洲", codes: ["GB","DE","NL","FR","CH","IT"] },
    { title: "大洋洲", codes: ["AU"] },
    { title: "其他", codes: ["IN","TR"] }
  ];
  const REGIONS = {
    HK: { flag: "🇭🇰", label: "香港", regex: "(?i)(🇭🇰|香港|Hong[ _-]?Kong|(^|[^A-Za-z])(HKG|HK)([^A-Za-z]|$))" },
    TW: { flag: "🇹🇼", label: "台湾", regex: "(?i)(🇹🇼|台湾|台灣|Taiwan|Taipei|台北|(^|[^A-Za-z])(TWN|TW|TPE)([^A-Za-z]|$))" },
    JP: { flag: "🇯🇵", label: "日本", regex: "(?i)(🇯🇵|日本|Japan|Tokyo|Osaka|东京|東京|大阪|(^|[^A-Za-z])(JPN|JP|NRT|HND|KIX)([^A-Za-z]|$))" },
    KR: { flag: "🇰🇷", label: "韩国", regex: "(?i)(🇰🇷|韩国|韓國|Korea|Seoul|首尔|首爾|(^|[^A-Za-z])(KOR|KR|ICN)([^A-Za-z]|$))" },
    SG: { flag: "🇸🇬", label: "新加坡", regex: "(?i)(🇸🇬|新加坡|Singapore|(^|[^A-Za-z])(SGP|SIN|SG)([^A-Za-z]|$))" },
    MY: { flag: "🇲🇾", label: "马来西亚", regex: "(?i)(🇲🇾|马来西亚|馬來西亞|Malaysia|Kuala[ _-]?Lumpur|吉隆坡|(^|[^A-Za-z])(MYS|MY|KUL)([^A-Za-z]|$))" },
    TH: { flag: "🇹🇭", label: "泰国", regex: "(?i)(🇹🇭|泰国|泰國|Thailand|Bangkok|曼谷|(^|[^A-Za-z])(THA|TH|BKK)([^A-Za-z]|$))" },
    VN: { flag: "🇻🇳", label: "越南", regex: "(?i)(🇻🇳|越南|Vietnam|Ho[ _-]?Chi[ _-]?Minh|Hanoi|河内|河內|(^|[^A-Za-z])(VNM|VN|SGN|HAN)([^A-Za-z]|$))" },
    PH: { flag: "🇵🇭", label: "菲律宾", regex: "(?i)(🇵🇭|菲律宾|菲律賓|Philippines|Manila|马尼拉|馬尼拉|(^|[^A-Za-z])(PHL|PH|MNL)([^A-Za-z]|$))" },
    ID: { flag: "🇮🇩", label: "印度尼西亚", regex: "(?i)(🇮🇩|印度尼西亚|印尼|Indonesia|Jakarta|雅加达|雅加達|(^|[^A-Za-z])(IDN|ID|CGK)([^A-Za-z]|$))" },
    US: { flag: "🇺🇸", label: "美国", regex: "(?i)(🇺🇸|美国|United[ _-]?States|Los[ _-]?Angeles|San[ _-]?Jose|Seattle|Dallas|Chicago|Portland|Phoenix|Silicon[ _-]?Valley|Santa[ _-]?Clara|洛杉矶|圣何塞|西雅图|达拉斯|芝加哥|波特兰|凤凰城|硅谷|圣克拉拉|(^|[^A-Za-z])(USA|US|LAX|SJC|SEA)([^A-Za-z]|$))" },
    CA: { flag: "🇨🇦", label: "加拿大", regex: "(?i)(🇨🇦|加拿大|Canada|Toronto|Vancouver|Montreal|多伦多|多倫多|温哥华|溫哥華|蒙特利尔|(^|[^A-Za-z])(CAN|CA|YYZ|YVR)([^A-Za-z]|$))" },
    GB: { flag: "🇬🇧", label: "英国", regex: "(?i)(🇬🇧|英国|英國|United[ _-]?Kingdom|Britain|London|伦敦|倫敦|(^|[^A-Za-z])(GBR|UK|GB|LHR)([^A-Za-z]|$))" },
    DE: { flag: "🇩🇪", label: "德国", regex: "(?i)(🇩🇪|德国|德國|Germany|Frankfurt|法兰克福|法蘭克福|(^|[^A-Za-z])(DEU|DE|FRA)([^A-Za-z]|$))" },
    NL: { flag: "🇳🇱", label: "荷兰", regex: "(?i)(🇳🇱|荷兰|荷蘭|Netherlands|Amsterdam|阿姆斯特丹|(^|[^A-Za-z])(NLD|NL|AMS)([^A-Za-z]|$))" },
    FR: { flag: "🇫🇷", label: "法国", regex: "(?i)(🇫🇷|法国|法國|France|Paris|巴黎|(^|[^A-Za-z])(FRA|FR|CDG)([^A-Za-z]|$))" },
    CH: { flag: "🇨🇭", label: "瑞士", regex: "(?i)(🇨🇭|瑞士|Switzerland|Zurich|苏黎世|蘇黎世|(^|[^A-Za-z])(CHE|CH|ZRH)([^A-Za-z]|$))" },
    IT: { flag: "🇮🇹", label: "意大利", regex: "(?i)(🇮🇹|意大利|Italy|Milan|Rome|米兰|米蘭|罗马|羅馬|(^|[^A-Za-z])(ITA|IT|MXP|FCO)([^A-Za-z]|$))" },
    AU: { flag: "🇦🇺", label: "澳大利亚", regex: "(?i)(🇦🇺|澳大利亚|澳洲|Australia|Sydney|Melbourne|悉尼|墨尔本|墨爾本|(^|[^A-Za-z])(AUS|AU|SYD|MEL)([^A-Za-z]|$))" },
    IN: { flag: "🇮🇳", label: "印度", regex: "(?i)(🇮🇳|印度|India|Mumbai|Delhi|孟买|孟買|德里|(^|[^A-Za-z])(IND|IN|BOM|DEL)([^A-Za-z]|$))" },
    TR: { flag: "🇹🇷", label: "土耳其", regex: "(?i)(🇹🇷|土耳其|Turkey|Türkiye|Istanbul|伊斯坦布尔|伊斯坦堡|(^|[^A-Za-z])(TUR|TR|IST)([^A-Za-z]|$))" }
  };

  let mihomoTemplate = "";
  let loonTemplate = "";
  let loonConfig = "";
  let loonGeneratedFingerprint = "";
  let currentSubscriptionUrl = "";

  const output = document.getElementById("output");
  const status = document.getElementById("status");
  const subscriptionUrlInput = document.getElementById("subscription-url");
  const createSubscriptionButton = document.getElementById("create-subscription");
  const copySubscriptionButton = document.getElementById("copy-subscription");
  const importClashButton = document.getElementById("import-clash");
  const importLoonButton = document.getElementById("import-loon");

  function renderLoonRegionOptions() {
    const root = document.getElementById("loon-region-options");
    root.innerHTML = "";
    for (const group of REGION_GROUPS) {
      const title = document.createElement("div");
      title.className = "group-title";
      title.textContent = group.title;
      root.appendChild(title);
      const grid = document.createElement("div");
      grid.className = "option-grid";
      for (const code of group.codes) {
        const region = REGIONS[code];
        const label = document.createElement("label");
        label.className = "check-item";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.className = "loon-daily-region";
        input.dataset.region = code;
        input.checked = code === "SG";
        label.append(input, document.createTextNode(`${region.flag} ${region.label}`));
        grid.appendChild(label);
      }
      root.appendChild(grid);
    }
  }

  function renderRegionOptions() {
    const root = document.getElementById("region-options");
    root.innerHTML = "";
    for (const group of REGION_GROUPS) {
      const title = document.createElement("div");
      title.className = "group-title";
      title.textContent = group.title;
      root.appendChild(title);
      const grid = document.createElement("div");
      grid.className = "option-grid";
      for (const code of group.codes) {
        const region = REGIONS[code];
        const label = document.createElement("label");
        label.className = "check-item";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.className = "daily-region";
        input.dataset.region = code;
        input.checked = code === "SG";
        label.append(input, document.createTextNode(`${region.flag} ${region.label}`));
        grid.appendChild(label);
      }
      root.appendChild(grid);
    }
  }

  async function loadAssets() {
    try {
      const [m, l] = await Promise.all([
        fetch("./template.yaml", { cache: "no-store" }),
        fetch("./Loon-template.lcf", { cache: "no-store" })
      ]);
      if (!m.ok || !l.ok) throw new Error("配置模板载入失败");
      mihomoTemplate = await m.text();
      loonTemplate = await l.text();
      status.textContent = "模板已载入";
    } catch (e) {
      status.textContent = e.message;
    }
  }

  function validUrl(value) {
    try {
      const u = new URL(value.trim());
      return u.protocol === "https:" || u.protocol === "http:";
    } catch (_) {
      return false;
    }
  }

  function yamlEscape(value) {
    return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  }

  function selectedValues(selector, dataKey) {
    return [...document.querySelectorAll(selector)]
      .filter(el => el.checked)
      .map(el => el.dataset[dataKey]);
  }

  function getConfigFromUi() {
    const sources = {};
    for (const key of SOURCE_ORDER) {
      const meta = SOURCE_META[key];
      sources[key] = {
        enabled: document.getElementById(meta.enableId).checked,
        url: document.getElementById(meta.urlId).value.trim()
      };
    }
    return {
      version: 2,
      sources,
      daily_sources: selectedValues(".daily-source", "source").filter(key => sources[key].enabled),
      daily_regions: selectedValues(".daily-region", "region"),
      ai_sources: selectedValues(".ai-source", "source").filter(key => sources[key].enabled)
    };
  }

  function validateConfig(config) {
    const enabled = SOURCE_ORDER.filter(key => config.sources[key].enabled);
    if (!enabled.length) return "至少启用一个节点来源";
    for (const key of enabled) {
      if (!validUrl(config.sources[key].url)) return `${SOURCE_META[key].label}已启用，请填写有效订阅链接`;
    }
    if (!config.daily_sources.length) return "日用节点至少选择一个已启用来源";
    if (!config.daily_regions.length) return "日用节点至少选择一个地区";
    if (!config.ai_sources.length) return "AI 至少选择一个已启用来源";
    return "";
  }

  function providerName(sourceKey, regionCode) {
    return `${SOURCE_META[sourceKey].label} · ${REGIONS[regionCode].label}`;
  }

  function buildProviders(config) {
    const needed = new Map();
    for (const sourceKey of config.daily_sources) {
      for (const regionCode of config.daily_regions) needed.set(`${sourceKey}:${regionCode}`, [sourceKey, regionCode]);
    }
    for (const sourceKey of config.ai_sources) needed.set(`${sourceKey}:US`, [sourceKey, "US"]);

    const lines = [];
    for (const sourceKey of SOURCE_ORDER) {
      if (!config.sources[sourceKey].enabled) continue;
      if (sourceKey === "backup") {
        lines.push(`  备用:`, `    type: http`, `    url: "${yamlEscape(config.sources.backup.url)}"`, `    path: ./proxy_provider/backup.yaml`, `    interval: 600`, `    exclude-filter: '${BACKUP_EXCLUDE}'`, ``);
      }
      for (const regionCode of Object.keys(REGIONS)) {
        if (!needed.has(`${sourceKey}:${regionCode}`)) continue;
        const region = REGIONS[regionCode];
        lines.push(
          `  ${providerName(sourceKey, regionCode)}:`,
          `    type: http`,
          `    url: "${yamlEscape(config.sources[sourceKey].url)}"`,
          `    path: ./proxy_provider/${SOURCE_META[sourceKey].path}-${regionCode.toLowerCase()}.yaml`,
          `    interval: 600`,
          `    filter: '${region.regex}'`
        );
        if (sourceKey === "backup") lines.push(`    exclude-filter: '${BACKUP_EXCLUDE}'`);
        lines.push("");
      }
    }
    return lines.join("\n").trimEnd();
  }

  function buildGroups(config) {
    const dailyProviders = [];
    for (const sourceKey of config.daily_sources) {
      for (const regionCode of config.daily_regions) dailyProviders.push(providerName(sourceKey, regionCode));
    }
    const aiProviders = config.ai_sources.map(sourceKey => providerName(sourceKey, "US"));
    const hasBackup = config.sources.backup.enabled;
    const lines = [
      `  - name: "🌐 全球代理策略"`,
      `    type: select`,
      `    proxies:`,
      `      - "🚀 日用节点"`
    ];
    if (hasBackup) lines.push(`      - "🛟 备用节点"`);
    lines.push(``, `  - name: "🚀 日用节点"`, `    type: select`, `    use:`);
    for (const name of dailyProviders) lines.push(`      - "${name}"`);
    if (hasBackup) lines.push(``, `  - name: "🛟 备用节点"`, `    type: select`, `    use:`, `      - 备用`);
    lines.push(``, `  - name: "🤖 AI"`, `    type: select`, `    use:`);
    for (const name of aiProviders) lines.push(`      - "${name}"`);
    lines.push(
      ``, `  - name: "🍅 番茄"`, `    type: select`, `    proxies:`, `      - DIRECT`, `      - "🌐 全球代理策略"`,
      ``, `  - name: "🎵 抖音"`, `    type: select`, `    proxies:`, `      - DIRECT`, `      - "🌐 全球代理策略"`,
      ``, `  - name: "📕 小红书"`, `    type: select`, `    proxies:`, `      - DIRECT`, `      - "🌐 全球代理策略"`
    );
    return lines.join("\n");
  }

  function renderMihomo(config) {
    if (!mihomoTemplate.includes("__PROXY_PROVIDERS__") || !mihomoTemplate.includes("__PROXY_GROUPS__")) {
      throw new Error("Mihomo 模板缺少动态区块占位符");
    }
    return mihomoTemplate
      .replace("__PROXY_PROVIDERS__", buildProviders(config))
      .replace("__PROXY_GROUPS__", buildGroups(config));
  }

  function saveSelections() {
    const config = getConfigFromUi();
    const safe = {
      enabled: Object.fromEntries(SOURCE_ORDER.map(key => [key, config.sources[key].enabled])),
      daily_sources: config.daily_sources,
      daily_regions: config.daily_regions,
      ai_sources: config.ai_sources
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  }

  function restoreSelections() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch (_) { return; }
    if (!saved) return;
    for (const key of SOURCE_ORDER) {
      if (typeof saved.enabled?.[key] === "boolean") document.getElementById(SOURCE_META[key].enableId).checked = saved.enabled[key];
    }
    if (Array.isArray(saved.daily_sources)) document.querySelectorAll(".daily-source").forEach(el => { el.checked = saved.daily_sources.includes(el.dataset.source); });
    if (Array.isArray(saved.ai_sources)) document.querySelectorAll(".ai-source").forEach(el => { el.checked = saved.ai_sources.includes(el.dataset.source); });
    if (Array.isArray(saved.daily_regions)) document.querySelectorAll(".daily-region").forEach(el => { el.checked = saved.daily_regions.includes(el.dataset.region); });
  }

  function syncSourceUi() {
    for (const key of SOURCE_ORDER) {
      const enabled = document.getElementById(SOURCE_META[key].enableId).checked;
      document.getElementById(SOURCE_META[key].urlId).disabled = !enabled;
      document.querySelectorAll(`[data-source="${key}"]`).forEach(el => { el.disabled = !enabled; });
    }
    saveSelections();
  }

  function generateMihomo() {
    const config = getConfigFromUi();
    const error = validateConfig(config);
    if (error) { status.textContent = error; return; }
    if (!mihomoTemplate) { status.textContent = "模板尚未载入"; return; }
    try {
      output.value = renderMihomo(config);
      saveSelections();
      status.textContent = "Mihomo / Clash 配置已生成";
    } catch (e) {
      status.textContent = e.message;
    }
  }

  async function createSubscription() {
    const config = getConfigFromUi();
    const error = validateConfig(config);
    if (error) { status.textContent = error; return; }

    createSubscriptionButton.disabled = true;
    copySubscriptionButton.disabled = true;
    importClashButton.disabled = true;
    status.textContent = "正在生成 Primus 订阅链接…";

    try {
      const response = await fetch(MIHOMO_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      let data = {};
      try { data = await response.json(); } catch (_) {}
      if (!response.ok) throw new Error(data.error || `后端请求失败 (${response.status})`);
      if (!validUrl(data.subscription_url || "")) throw new Error("后端未返回有效订阅链接");
      currentSubscriptionUrl = data.subscription_url;
      subscriptionUrlInput.value = currentSubscriptionUrl;
      copySubscriptionButton.disabled = false;
      importClashButton.disabled = false;
      saveSelections();
      status.textContent = "Primus 订阅链接已生成";
    } catch (e) {
      currentSubscriptionUrl = "";
      subscriptionUrlInput.value = "";
      status.textContent = `生成订阅链接失败：${e.message}`;
    } finally {
      createSubscriptionButton.disabled = false;
    }
  }


  function getLoonConfigFromUi() {
    const enabledSources = selectedValues(".loon-enabled-source", "source");
    return {
      version: 1,
      enabled_sources: enabledSources,
      daily_sources: selectedValues(".loon-daily-source", "source").filter(key => enabledSources.includes(key)),
      daily_regions: selectedValues(".loon-daily-region", "region"),
      ai_sources: selectedValues(".loon-ai-source", "source").filter(key => enabledSources.includes(key))
    };
  }

  function validateLoonConfig(config) {
    if (!config.enabled_sources.length) return "Loon 至少启用一个节点来源";
    if (!config.daily_sources.length) return "Loon 日用节点至少选择一个已启用来源";
    if (!config.daily_regions.length) return "Loon 日用节点至少选择一个地区";
    if (!config.ai_sources.length) return "Loon AI 至少选择一个已启用来源";
    return "";
  }

  function buildLoonFilters(config) {
    const needed = new Map();
    for (const sourceKey of config.daily_sources) {
      for (const regionCode of config.daily_regions) {
        needed.set(`${sourceKey}:${regionCode}`, [sourceKey, regionCode]);
      }
    }
    for (const sourceKey of config.ai_sources) {
      needed.set(`${sourceKey}:US`, [sourceKey, "US"]);
    }

    const lines = [];
    for (const sourceKey of SOURCE_ORDER) {
      if (!config.enabled_sources.includes(sourceKey)) continue;
      if (sourceKey === "backup") {
        lines.push(`备用 · 全部 = NameRegex,备用, FilterKey = ".*"`);
      }
      for (const regionCode of Object.keys(REGIONS)) {
        if (!needed.has(`${sourceKey}:${regionCode}`)) continue;
        lines.push(`${providerName(sourceKey, regionCode)} = NameRegex,${SOURCE_META[sourceKey].label}, FilterKey = "${REGIONS[regionCode].regex}"`);
      }
    }
    return lines.join("\n");
  }

  function buildLoonGroups(config) {
    const dailyFilters = [];
    for (const sourceKey of config.daily_sources) {
      for (const regionCode of config.daily_regions) {
        dailyFilters.push(providerName(sourceKey, regionCode));
      }
    }

    const aiFilters = config.ai_sources.map(sourceKey => providerName(sourceKey, "US"));
    const hasBackup = config.enabled_sources.includes("backup");
    const globalItems = ["主力节点"];
    if (hasBackup) globalItems.push("备用节点");

    const lines = [
      `全球代理策略 = select,${globalItems.join(",")},img-url = https://raw.githubusercontent.com/Orz-3/mini/master/Color/Global.png`,
      `主力节点 = select,${dailyFilters.join(",")},img-url = https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Server.png`
    ];

    if (hasBackup) {
      lines.push(`备用节点 = select,备用 · 全部,img-url = https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Available.png`);
    }

    lines.push(
      `AI = select,${aiFilters.join(",")},img-url = https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/AI.png`,
      `番茄 = select,DIRECT,全球代理策略,img-url = https://raw.githubusercontent.com/luestr/IconResource/main/App_icon/120px/DragonRead.png`,
      `抖音 = select,DIRECT,全球代理策略,img-url = https://raw.githubusercontent.com/luestr/IconResource/main/App_icon/120px/TikTok.png`,
      `小红书 = select,DIRECT,全球代理策略,img-url = https://raw.githubusercontent.com/luestr/IconResource/main/App_icon/120px/RedPaper.png`
    );

    return lines.join("\n");
  }

  function renderLoon(config) {
    if (!loonTemplate.includes("__REMOTE_FILTERS__") || !loonTemplate.includes("__PROXY_GROUPS__")) {
      throw new Error("Loon 模板缺少动态区块占位符");
    }
    return loonTemplate
      .replace("__REMOTE_FILTERS__", buildLoonFilters(config))
      .replace("__PROXY_GROUPS__", buildLoonGroups(config));
  }

  function loonFingerprint(config) {
    return JSON.stringify({
      enabled_sources: config.enabled_sources,
      daily_sources: config.daily_sources,
      daily_regions: config.daily_regions,
      ai_sources: config.ai_sources
    });
  }

  function saveLoonSelections() {
    const config = getLoonConfigFromUi();
    localStorage.setItem(LOON_STORAGE_KEY, loonFingerprint(config));
  }

  function restoreLoonSelections() {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(LOON_STORAGE_KEY) || "null"); } catch (_) { return; }
    if (!saved) return;
    if (Array.isArray(saved.enabled_sources)) document.querySelectorAll(".loon-enabled-source").forEach(el => { el.checked = saved.enabled_sources.includes(el.dataset.source); });
    if (Array.isArray(saved.daily_sources)) document.querySelectorAll(".loon-daily-source").forEach(el => { el.checked = saved.daily_sources.includes(el.dataset.source); });
    if (Array.isArray(saved.daily_regions)) document.querySelectorAll(".loon-daily-region").forEach(el => { el.checked = saved.daily_regions.includes(el.dataset.region); });
    if (Array.isArray(saved.ai_sources)) document.querySelectorAll(".loon-ai-source").forEach(el => { el.checked = saved.ai_sources.includes(el.dataset.source); });
  }

  function invalidateLoonGeneration(message = "") {
    loonConfig = "";
    loonGeneratedFingerprint = "";
    importLoonButton.disabled = true;
    if (message) status.textContent = message;
  }

  function syncLoonSourceUi(invalidate = true) {
    const enabled = selectedValues(".loon-enabled-source", "source");
    document.querySelectorAll(".loon-daily-source,.loon-ai-source").forEach(el => {
      el.disabled = !enabled.includes(el.dataset.source);
    });
    saveLoonSelections();
    if (invalidate) invalidateLoonGeneration("Loon 选择已变更，请重新生成配置");
  }

  function generateLoon() {
    const config = getLoonConfigFromUi();
    const error = validateLoonConfig(config);
    if (error) { status.textContent = error; return; }
    if (!loonTemplate) { status.textContent = "Loon 模板尚未载入"; return; }

    try {
      loonConfig = renderLoon(config);
      loonGeneratedFingerprint = loonFingerprint(config);
      output.value = loonConfig;
      importLoonButton.disabled = false;
      saveLoonSelections();
      status.textContent = "Loon 配置已生成。下一步先导入配置，再到 Loon App 添加节点资源。";
    } catch (e) {
      invalidateLoonGeneration();
      status.textContent = e.message;
    }
  }

  async function importLoon() {
    const config = getLoonConfigFromUi();
    const error = validateLoonConfig(config);
    if (error) { status.textContent = error; return; }

    if (!loonConfig || loonGeneratedFingerprint !== loonFingerprint(config)) {
      invalidateLoonGeneration();
      status.textContent = "当前选择与已生成配置不一致，请先重新生成 Loon 配置";
      return;
    }

    importLoonButton.disabled = true;
    status.textContent = "正在准备 Loon 配置导入链接…";

    try {
      const response = await fetch(LOON_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });

      let data = {};
      try { data = await response.json(); } catch (_) {}
      if (!response.ok) throw new Error(data.error || `后端请求失败 (${response.status})`);
      if (!validUrl(data.config_url || "")) throw new Error("后端未返回有效 Loon 配置地址");

      status.textContent = "正在打开 Loon 配置导入。导入完成后再添加节点资源。";
      window.location.href = LOON_IMPORT_BASE + encodeURIComponent(data.config_url);
    } catch (e) {
      status.textContent = `Loon 导入准备失败：${e.message}`;
    } finally {
      importLoonButton.disabled = false;
    }
  }

  async function copyText(text, ok) {
    if (!text) { status.textContent = "当前没有可复制的内容"; return; }
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = ok;
    } catch (_) {
      const temp = document.createElement("textarea");
      temp.value = text;
      temp.style.position = "fixed";
      temp.style.opacity = "0";
      document.body.appendChild(temp);
      temp.focus(); temp.select(); document.execCommand("copy"); temp.remove();
      status.textContent = ok;
    }
  }

  function downloadText(text, filename) {
    if (!text) { status.textContent = "当前没有可下载的配置"; return; }
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function importClashVerge() {
    if (!currentSubscriptionUrl) { status.textContent = "请先生成订阅链接"; return; }
    status.textContent = "正在唤起 Clash Verge Rev…";
    window.location.href = `clash://install-config?url=${encodeURIComponent(currentSubscriptionUrl)}`;
  }

  renderRegionOptions();
  renderLoonRegionOptions();
  restoreSelections();
  restoreLoonSelections();
  syncSourceUi();
  syncLoonSourceUi(false);
  loadAssets();

  document.getElementById("generate").addEventListener("click", generateMihomo);
  document.getElementById("copy").addEventListener("click", () => copyText(output.value, "YAML 已复制"));
  document.getElementById("download").addEventListener("click", () => downloadText(output.value, "Primus-Mihomo.yaml"));
  createSubscriptionButton.addEventListener("click", createSubscription);
  copySubscriptionButton.addEventListener("click", () => copyText(currentSubscriptionUrl, "订阅链接已复制"));
  importClashButton.addEventListener("click", importClashVerge);

  document.getElementById("generate-loon").addEventListener("click", generateLoon);
  importLoonButton.addEventListener("click", importLoon);
  document.getElementById("copy-loon").addEventListener("click", () => copyText(loonConfig, "Loon 配置已复制"));
  document.getElementById("download-loon").addEventListener("click", () => downloadText(loonConfig, "Primus-Loon.lcf"));

  document.querySelectorAll(".loon-enabled-source").forEach(el => el.addEventListener("change", () => syncLoonSourceUi(true)));
  document.querySelectorAll(".loon-daily-source,.loon-daily-region,.loon-ai-source").forEach(el => el.addEventListener("change", () => {
    saveLoonSelections();
    invalidateLoonGeneration("Loon 选择已变更，请重新生成配置");
  }));
  document.getElementById("loon-select-all-regions").addEventListener("click", () => {
    document.querySelectorAll(".loon-daily-region").forEach(el => { el.checked = true; });
    saveLoonSelections();
    invalidateLoonGeneration("Loon 地区选择已变更，请重新生成配置");
  });
  document.getElementById("loon-clear-regions").addEventListener("click", () => {
    document.querySelectorAll(".loon-daily-region").forEach(el => { el.checked = false; });
    saveLoonSelections();
    invalidateLoonGeneration("Loon 地区选择已变更，请重新生成配置");
  });

  document.getElementById("show-urls").addEventListener("change", e => {
    for (const key of SOURCE_ORDER) document.getElementById(SOURCE_META[key].urlId).type = e.target.checked ? "text" : "password";
  });
  for (const key of SOURCE_ORDER) document.getElementById(SOURCE_META[key].enableId).addEventListener("change", syncSourceUi);
  document.querySelectorAll(".daily-source,.daily-region,.ai-source").forEach(el => el.addEventListener("change", saveSelections));
  document.getElementById("select-all-regions").addEventListener("click", () => {
    document.querySelectorAll(".daily-region").forEach(el => { el.checked = true; }); saveSelections();
  });
  document.getElementById("clear-regions").addEventListener("click", () => {
    document.querySelectorAll(".daily-region").forEach(el => { el.checked = false; }); saveSelections();
  });

  document.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");
      const isMihomo = btn.dataset.tab === "mihomo";
      document.getElementById("mihomo-panel").classList.toggle("hidden", !isMihomo);
      document.getElementById("loon-panel").classList.toggle("hidden", isMihomo);
      output.value = "";
      status.textContent = isMihomo ? "Mihomo / Clash" : "Loon";
    });
  });
