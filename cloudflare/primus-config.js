// Primus Config Worker v2
// Dynamic source + daily region selection for Mihomo.
// Backward compatible with legacy KV records created by v1.

const TEMPLATE_URL = "https://raw.githubusercontent.com/Primus-z-xt/Primus-Proxy/main/mihomo/template.yaml";
const ALLOWED_ORIGIN = "https://primus-z-xt.github.io";
const SOURCE_ORDER = ["airport", "self", "backup"];
const SOURCE_META = {
  airport: { label: "机场", path: "airport" },
  self: { label: "自建", path: "self" },
  backup: { label: "备用", path: "backup" }
};
const BACKUP_EXCLUDE = "(?i)(Expire|Traffic|Sync|流量|到期|过期|剩余|已用|总量|重置|订阅信息|官网|客服|套餐)";
const REGIONS = {
  HK: { label: "香港", regex: "(?i)(🇭🇰|香港|Hong[ _-]?Kong|(^|[^A-Za-z])(HKG|HK)([^A-Za-z]|$))" },
  TW: { label: "台湾", regex: "(?i)(🇹🇼|台湾|台灣|Taiwan|Taipei|台北|(^|[^A-Za-z])(TWN|TW|TPE)([^A-Za-z]|$))" },
  JP: { label: "日本", regex: "(?i)(🇯🇵|日本|Japan|Tokyo|Osaka|东京|東京|大阪|(^|[^A-Za-z])(JPN|JP|NRT|HND|KIX)([^A-Za-z]|$))" },
  KR: { label: "韩国", regex: "(?i)(🇰🇷|韩国|韓國|Korea|Seoul|首尔|首爾|(^|[^A-Za-z])(KOR|KR|ICN)([^A-Za-z]|$))" },
  SG: { label: "新加坡", regex: "(?i)(🇸🇬|新加坡|Singapore|(^|[^A-Za-z])(SGP|SIN|SG)([^A-Za-z]|$))" },
  MY: { label: "马来西亚", regex: "(?i)(🇲🇾|马来西亚|馬來西亞|Malaysia|Kuala[ _-]?Lumpur|吉隆坡|(^|[^A-Za-z])(MYS|MY|KUL)([^A-Za-z]|$))" },
  TH: { label: "泰国", regex: "(?i)(🇹🇭|泰国|泰國|Thailand|Bangkok|曼谷|(^|[^A-Za-z])(THA|TH|BKK)([^A-Za-z]|$))" },
  VN: { label: "越南", regex: "(?i)(🇻🇳|越南|Vietnam|Ho[ _-]?Chi[ _-]?Minh|Hanoi|河内|河內|(^|[^A-Za-z])(VNM|VN|SGN|HAN)([^A-Za-z]|$))" },
  PH: { label: "菲律宾", regex: "(?i)(🇵🇭|菲律宾|菲律賓|Philippines|Manila|马尼拉|馬尼拉|(^|[^A-Za-z])(PHL|PH|MNL)([^A-Za-z]|$))" },
  ID: { label: "印度尼西亚", regex: "(?i)(🇮🇩|印度尼西亚|印尼|Indonesia|Jakarta|雅加达|雅加達|(^|[^A-Za-z])(IDN|ID|CGK)([^A-Za-z]|$))" },
  US: { label: "美国", regex: "(?i)(🇺🇸|美国|United[ _-]?States|Los[ _-]?Angeles|San[ _-]?Jose|Seattle|Dallas|Chicago|Portland|Phoenix|Silicon[ _-]?Valley|Santa[ _-]?Clara|洛杉矶|圣何塞|西雅图|达拉斯|芝加哥|波特兰|凤凰城|硅谷|圣克拉拉|(^|[^A-Za-z])(USA|US|LAX|SJC|SEA)([^A-Za-z]|$))" },
  CA: { label: "加拿大", regex: "(?i)(🇨🇦|加拿大|Canada|Toronto|Vancouver|Montreal|多伦多|多倫多|温哥华|溫哥華|蒙特利尔|(^|[^A-Za-z])(CAN|CA|YYZ|YVR)([^A-Za-z]|$))" },
  GB: { label: "英国", regex: "(?i)(🇬🇧|英国|英國|United[ _-]?Kingdom|Britain|London|伦敦|倫敦|(^|[^A-Za-z])(GBR|UK|GB|LHR)([^A-Za-z]|$))" },
  DE: { label: "德国", regex: "(?i)(🇩🇪|德国|德國|Germany|Frankfurt|法兰克福|法蘭克福|(^|[^A-Za-z])(DEU|DE|FRA)([^A-Za-z]|$))" },
  NL: { label: "荷兰", regex: "(?i)(🇳🇱|荷兰|荷蘭|Netherlands|Amsterdam|阿姆斯特丹|(^|[^A-Za-z])(NLD|NL|AMS)([^A-Za-z]|$))" },
  FR: { label: "法国", regex: "(?i)(🇫🇷|法国|法國|France|Paris|巴黎|(^|[^A-Za-z])(FRA|FR|CDG)([^A-Za-z]|$))" },
  CH: { label: "瑞士", regex: "(?i)(🇨🇭|瑞士|Switzerland|Zurich|苏黎世|蘇黎世|(^|[^A-Za-z])(CHE|CH|ZRH)([^A-Za-z]|$))" },
  IT: { label: "意大利", regex: "(?i)(🇮🇹|意大利|Italy|Milan|Rome|米兰|米蘭|罗马|羅馬|(^|[^A-Za-z])(ITA|IT|MXP|FCO)([^A-Za-z]|$))" },
  AU: { label: "澳大利亚", regex: "(?i)(🇦🇺|澳大利亚|澳洲|Australia|Sydney|Melbourne|悉尼|墨尔本|墨爾本|(^|[^A-Za-z])(AUS|AU|SYD|MEL)([^A-Za-z]|$))" },
  IN: { label: "印度", regex: "(?i)(🇮🇳|印度|India|Mumbai|Delhi|孟买|孟買|德里|(^|[^A-Za-z])(IND|IN|BOM|DEL)([^A-Za-z]|$))" },
  TR: { label: "土耳其", regex: "(?i)(🇹🇷|土耳其|Turkey|Türkiye|Istanbul|伊斯坦布尔|伊斯坦堡|(^|[^A-Za-z])(TUR|TR|IST)([^A-Za-z]|$))" }
};

function corsHeaders(origin = "") {
  return {
    "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function json(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(origin), "Cache-Control": "no-store" }
  });
}

function validUrl(value) {
  try {
    const u = new URL(String(value || "").trim());
    return u.protocol === "https:" || u.protocol === "http:";
  } catch (_) {
    return false;
  }
}

function yamlEscape(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function uniqueAllowed(values, allowed) {
  const result = [];
  for (const value of Array.isArray(values) ? values : []) {
    if (allowed.includes(value) && !result.includes(value)) result.push(value);
  }
  return result;
}

function normalizeNewPayload(body) {
  const sources = {};
  for (const key of SOURCE_ORDER) {
    const incoming = body?.sources?.[key] || {};
    sources[key] = {
      enabled: Boolean(incoming.enabled),
      url: String(incoming.url || "").trim()
    };
  }

  const enabledKeys = SOURCE_ORDER.filter(key => sources[key].enabled);
  for (const key of enabledKeys) {
    if (!validUrl(sources[key].url)) throw new Error(`${SOURCE_META[key].label}已启用，请填写有效订阅链接`);
  }
  if (!enabledKeys.length) throw new Error("至少启用一个节点来源");

  const dailySources = uniqueAllowed(body.daily_sources, SOURCE_ORDER).filter(key => sources[key].enabled);
  const dailyRegions = uniqueAllowed(body.daily_regions, Object.keys(REGIONS));
  const aiSources = uniqueAllowed(body.ai_sources, SOURCE_ORDER).filter(key => sources[key].enabled);

  if (!dailySources.length) throw new Error("日用节点至少选择一个已启用来源");
  if (!dailyRegions.length) throw new Error("日用节点至少选择一个地区");
  if (!aiSources.length) throw new Error("AI 至少选择一个已启用来源");

  return { version: 2, sources, daily_sources: dailySources, daily_regions: dailyRegions, ai_sources: aiSources };
}

function normalizeLegacy(record) {
  const selfUrl = String(record?.self_url || "").trim();
  const airportUrl = String(record?.airport_url || record?.airport_a_url || "").trim();
  const backupUrl = String(record?.backup_url || "").trim();
  const sources = {
    airport: { enabled: validUrl(airportUrl), url: airportUrl },
    self: { enabled: validUrl(selfUrl), url: selfUrl },
    backup: { enabled: validUrl(backupUrl), url: backupUrl }
  };
  const enabled = SOURCE_ORDER.filter(key => sources[key].enabled);
  return {
    version: 2,
    sources,
    daily_sources: ["self", "airport"].filter(key => sources[key].enabled),
    daily_regions: ["SG"],
    ai_sources: ["airport", "self", "backup"].filter(key => sources[key].enabled),
    _legacy: true,
    _enabled: enabled
  };
}

function normalizeStored(record) {
  if (record?.version === 2 && record?.sources) {
    try { return normalizeNewPayload(record); } catch (_) {}
  }
  return normalizeLegacy(record || {});
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
    if (!config.sources[sourceKey]?.enabled) continue;
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
  const hasBackup = Boolean(config.sources.backup?.enabled);
  const lines = [
    `  - name: "🌐 全球代理策略"`,
    `    type: select`,
    `    proxies:`,
    `      - "🚀 日用节点"`
  ];
  if (hasBackup) lines.push(`      - "🛟 备用节点"`);
  lines.push(
    ``,
    `  - name: "🚀 日用节点"`,
    `    type: select`,
    `    use:`
  );
  for (const name of dailyProviders) lines.push(`      - "${name}"`);
  if (hasBackup) {
    lines.push(``, `  - name: "🛟 备用节点"`, `    type: select`, `    use:`, `      - 备用`);
  }
  lines.push(``, `  - name: "🤖 AI"`, `    type: select`, `    use:`);
  for (const name of aiProviders) lines.push(`      - "${name}"`);
  lines.push(
    ``,
    `  - name: "🍅 番茄"`,
    `    type: select`,
    `    proxies:`,
    `      - DIRECT`,
    `      - "🌐 全球代理策略"`,
    ``,
    `  - name: "🎵 抖音"`,
    `    type: select`,
    `    proxies:`,
    `      - DIRECT`,
    `      - "🌐 全球代理策略"`,
    ``,
    `  - name: "📕 小红书"`,
    `    type: select`,
    `    proxies:`,
    `      - DIRECT`,
    `      - "🌐 全球代理策略"`
  );
  return lines.join("\n");
}

function renderTemplate(template, config) {
  if (!template.includes("__PROXY_PROVIDERS__") || !template.includes("__PROXY_GROUPS__")) {
    throw new Error("GitHub Mihomo 模板缺少动态区块占位符");
  }
  return template
    .replace("__PROXY_PROVIDERS__", buildProviders(config))
    .replace("__PROXY_GROUPS__", buildGroups(config));
}

async function handlePost(request, env) {
  const origin = request.headers.get("Origin") || "";
  let body;
  try { body = await request.json(); } catch (_) { return json({ error: "请求体必须是 JSON" }, 400, origin); }

  let config;
  try {
    if (body?.version === 2 || body?.sources) config = normalizeNewPayload(body);
    else {
      const legacy = normalizeLegacy(body || {});
      if (!legacy._enabled.length) throw new Error("请至少提供一个有效订阅链接");
      config = legacy;
      delete config._legacy;
      delete config._enabled;
    }
  } catch (e) {
    return json({ error: e.message }, 400, origin);
  }

  const token = crypto.randomUUID().replaceAll("-", "");
  await env.MIHOMO_KV.put(`mihomo:${token}`, JSON.stringify(config));
  return json({ subscription_url: `https://config.primusz.top/mihomo/${token}` }, 200, origin);
}

async function handleGet(token, env) {
  const raw = await env.MIHOMO_KV.get(`mihomo:${token}`);
  if (!raw) return new Response("Subscription not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  let record;
  try { record = JSON.parse(raw); } catch (_) { return new Response("Invalid subscription data", { status: 500, headers: { "Cache-Control": "no-store" } }); }
  const config = normalizeStored(record);
  if (!config.daily_sources.length || !config.ai_sources.length) return new Response("Subscription has no usable sources", { status: 500, headers: { "Cache-Control": "no-store" } });

  const templateResponse = await fetch(TEMPLATE_URL, { cf: { cacheTtl: 0, cacheEverything: false } });
  if (!templateResponse.ok) return new Response("Failed to fetch template", { status: 502, headers: { "Cache-Control": "no-store" } });

  try {
    const yaml = renderTemplate(await templateResponse.text(), config);
    return new Response(yaml, {
      status: 200,
      headers: {
        "Content-Type": "text/yaml; charset=utf-8",
        "Content-Disposition": "attachment; filename=Primus",
        "Cache-Control": "no-store"
      }
    });
  } catch (e) {
    return new Response(`Config render failed: ${e.message}`, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
    if (request.method === "POST" && url.pathname === "/api/mihomo") return handlePost(request, env);

    const match = url.pathname.match(/^\/mihomo\/([A-Za-z0-9_-]+)$/);
    if (request.method === "GET" && match) return handleGet(match[1], env);

    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
};
