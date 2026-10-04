// Primus Config Worker v6
// Dynamic source + daily region selection for Mihomo and Loon.
// Mihomo remains backward compatible with legacy KV records created by v1/v2.

const MIHOMO_TEMPLATE_URL = "https://raw.githubusercontent.com/Primus-z-xt/Primus-Proxy/main/mihomo/template.yaml";
const LOON_TEMPLATE_URL = "https://raw.githubusercontent.com/Primus-z-xt/Primus-Proxy/main/loon/template.lcf";
const VERSION_URL = "https://raw.githubusercontent.com/Primus-z-xt/Primus-Proxy/main/VERSION.json";
const ALLOWED_ORIGIN = "https://primus-z-xt.github.io";
const SOURCE_ORDER = ["airport", "self", "backup"];
const SOURCE_META = {
  airport: { label: "机场", path: "airport" },
  self: { label: "自建", path: "self" },
  backup: { label: "备用", path: "backup" }
};
const BACKUP_EXCLUDE = "(?i)(Expire|Traffic|Sync|流量|到期|过期|剩余|已用|总量|重置|订阅信息|官网|客服|套餐)";
const BACKUP_LARGE_TRAFFIC_REGEX = "(?i)(HOT|mm-or-tj|su-alg-vlr|su-or-vlr|pp-or-vlr|bb-zen-vlr|su-rn2-tj|su-rn2?-v[cl]|su-or-vc|pp-or-v[cl]|mm-rn-vc|bb-zen-vc)";
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

function applyVersionMetadata(template, manifest, product) {
  const meta = manifest?.[product];
  const version = Number(meta?.version);
  const updatedAt = String(meta?.updated_at || "").trim();
  if (!Number.isInteger(version) || version < 1 || !updatedAt) return template;
  return template
    .replace(/^# 版本：v.*$/m, `# 版本：v${version}`)
    .replace(/^# 更新日期：.*$/m, `# 更新日期：${updatedAt}`);
}

async function fetchVersionManifest() {
  try {
    const response = await fetch(VERSION_URL, { cf: { cacheTtl: 0, cacheEverything: false } });
    if (!response.ok) return null;
    return await response.json();
  } catch (_) {
    return null;
  }
}

function shortHash(value) {
  let hash = 2166136261;
  const text = String(value || "");
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function providerCachePath(sourceKey, regionCode, url) {
  return `./proxy_provider/${SOURCE_META[sourceKey].path}-${shortHash(url)}-${String(regionCode || "all").toLowerCase()}.yaml`;
}

function uniqueAllowed(values, allowed) {
  const result = [];
  for (const value of Array.isArray(values) ? values : []) {
    if (allowed.includes(value) && !result.includes(value)) result.push(value);
  }
  return result;
}

function normalizePrivateTarget(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  } catch (_) {
    return "";
  }
}

function normalizePlex(value) {
  const rawDomain = String(value?.domain || "").trim();
  const rawIp = String(value?.ip || "").trim().replace(/^\[|\]$/g, "");
  const requested = Boolean(value?.enabled) || rawDomain || rawIp;
  if (!requested) return { enabled: false, domain: "", ip: "" };
  if (!rawDomain || !rawIp) throw new Error("Plex 域名和源 IP 必须同时填写");

  const domain = normalizePrivateTarget(rawDomain);
  if (!domain || isIPv4(domain) || isIPv6(domain)) throw new Error("Plex 域名格式无效");
  if (!isIPv4(rawIp) && !isIPv6(rawIp)) throw new Error("Plex 源 IP 格式无效");
  return { enabled: true, domain, ip: rawIp };
}

function normalizeEmby(value, enabledSources) {
  const rawTargets = Array.isArray(value?.targets) ? value.targets : [];
  const targets = [];
  for (const item of rawTargets) {
    const target = normalizePrivateTarget(item);
    if (!target) throw new Error("Emby 播放线路格式无效");
    if (!targets.includes(target)) targets.push(target);
  }
  const sources = uniqueAllowed(value?.sources, SOURCE_ORDER).filter(key => enabledSources.includes(key));
  const regions = Array.isArray(value?.regions) ? uniqueAllowed(value.regions, Object.keys(REGIONS)) : Object.keys(REGIONS);
  const plex = normalizePlex(value?.plex);
  const enabled = targets.length > 0 || plex.enabled;
  if (enabled && !sources.length) throw new Error("Emby 至少选择一个已启用来源");
  if (enabled && !regions.length) throw new Error("Emby 至少选择一个地区");
  return { enabled, targets, sources, regions, plex };
}

function isIPv4(value) {
  const parts = String(value).split(".");
  return parts.length === 4 && parts.every(part => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255);
}

function isIPv6(value) {
  return String(value).includes(":") && /^[0-9a-f:]+$/i.test(String(value));
}

function buildPrivateRuleLines(targets, policy) {
  return (targets || []).map(target => {
    if (isIPv4(target)) return `IP-CIDR,${target}/32,${policy},no-resolve`;
    if (isIPv6(target)) return `IP-CIDR6,${target}/128,${policy},no-resolve`;
    return `DOMAIN-SUFFIX,${target},${policy}`;
  });
}

function injectPrivateRules(template, rules) {
  return template.replace(/^(\s*)# __PRIVATE_RULES__$/m, (_, indent) => {
    if (!rules.length) return `${indent}# 私有 Emby / Plex 分流未启用`;
    return rules.map(rule => `${indent}${rule}`).join("\n");
  });
}

function injectPrivateHosts(template, lines) {
  return template.replace(/^# __PRIVATE_HOSTS__$/m, () => {
    if (!lines.length) return "# 私有 Plex 固定解析未启用";
    return lines.join("\n");
  });
}

function buildMihomoPlexHostLines(plex) {
  if (!plex?.enabled) return [];
  return [
    "hosts:",
    `  "${yamlEscape(plex.domain)}": "${yamlEscape(plex.ip)}"`
  ];
}

function buildLoonPlexHostLines(plex) {
  if (!plex?.enabled) return [];
  return [`${plex.domain} = ${plex.ip}`];
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

  const emby = normalizeEmby(body?.emby, enabledKeys);
  return { version: 3, sources, daily_sources: dailySources, daily_regions: dailyRegions, ai_sources: aiSources, emby };
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
    emby: { enabled: false, targets: [], sources: [], regions: [], plex: { enabled: false, domain: "", ip: "" } },
    _legacy: true,
    _enabled: enabled
  };
}

function normalizeStored(record) {
  if (Number(record?.version) >= 2 && record?.sources) {
    try { return normalizeNewPayload(record); } catch (_) {}
  }
  return normalizeLegacy(record || {});
}

function providerName(sourceKey, regionCode) {
  return `${SOURCE_META[sourceKey].label} · ${REGIONS[regionCode].label}`;
}

function buildProvidersLegacy(config) {
  const needed = new Map();
  for (const sourceKey of config.daily_sources) {
    // Legacy v1 behavior was: 自建全部 + 机场新加坡.
    // Preserve that exactly for old KV tokens instead of incorrectly filtering 自建 by SG.
    if (config._legacy && sourceKey === "self") continue;
    for (const regionCode of config.daily_regions) needed.set(`${sourceKey}:${regionCode}`, [sourceKey, regionCode]);
  }
  for (const sourceKey of config.ai_sources) needed.set(`${sourceKey}:US`, [sourceKey, "US"]);

  const lines = [];

  if (config._legacy && config.sources.self?.enabled) {
    lines.push(
      `  自建:`,
      `    type: http`,
      `    url: "${yamlEscape(config.sources.self.url)}"`,
      `    path: ${providerCachePath("self", "all", config.sources.self.url)}`,
      `    interval: 600`,
      ``
    );
  }

  for (const sourceKey of SOURCE_ORDER) {
    if (!config.sources[sourceKey]?.enabled) continue;
    if (sourceKey === "backup") {
      lines.push(`  备用:`, `    type: http`, `    url: "${yamlEscape(config.sources.backup.url)}"`, `    path: ${providerCachePath("backup", "all", config.sources.backup.url)}`, `    interval: 600`, `    exclude-filter: '${BACKUP_EXCLUDE}'`, ``);
    }
    for (const regionCode of Object.keys(REGIONS)) {
      if (!needed.has(`${sourceKey}:${regionCode}`)) continue;
      const region = REGIONS[regionCode];
      lines.push(
        `  ${providerName(sourceKey, regionCode)}:`,
        `    type: http`,
        `    url: "${yamlEscape(config.sources[sourceKey].url)}"`,
        `    path: ${providerCachePath(sourceKey, regionCode, config.sources[sourceKey].url)}`,
        `    interval: 600`,
        `    filter: '${region.regex}'`
      );
      if (sourceKey === "backup") lines.push(`    exclude-filter: '${BACKUP_EXCLUDE}'`);
      lines.push("");
    }
  }
  return lines.join("\n").trimEnd();
}

function buildGroupsLegacy(config) {
  const dailyProviders = [];
  for (const sourceKey of config.daily_sources) {
    if (config._legacy && sourceKey === "self") {
      dailyProviders.push("自建");
      continue;
    }
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


function combinedRegionRegex(codes) {
  const parts = codes
    .map(code => REGIONS[code]?.regex || "")
    .filter(Boolean)
    .map(pattern => pattern.replace(/^\(\?i\)/, ""));
  return `(?i)(${parts.join("|")})`;
}

function buildProviders(config) {
  if (config._legacy) return buildProvidersLegacy(config);

  const lines = [];
  for (const sourceKey of SOURCE_ORDER) {
    if (!config.sources[sourceKey]?.enabled) continue;
    const meta = SOURCE_META[sourceKey];
    lines.push(
      `  ${meta.label}:`,
      `    type: http`,
      `    url: "${yamlEscape(config.sources[sourceKey].url)}"`,
      `    path: ${providerCachePath(sourceKey, "all", config.sources[sourceKey].url)}`,
      `    interval: 600`
    );
    if (sourceKey === "backup") lines.push(`    exclude-filter: '${BACKUP_EXCLUDE}'`);
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function selfFirst(keys) {
  return [...keys].sort((a, b) => (a === "self" ? -1 : b === "self" ? 1 : 0));
}


function regexBody(pattern) {
  return String(pattern || "").replace(/^\(\?i\)\(/, "").replace(/\)$/, "");
}

function backupLargeTrafficRegionRegex(codes) {
  const largeBody = regexBody(BACKUP_LARGE_TRAFFIC_REGEX);
  const parts = codes
    .map(code => REGIONS[code]?.regex || "")
    .filter(Boolean)
    .map(pattern => `(?:${regexBody(pattern)}).*(?:${largeBody})`);
  return `(?i)(${parts.join("|")})`;
}

function buildGroups(config) {
  if (config._legacy) return buildGroupsLegacy(config);

  const dailyProviders = selfFirst(config.daily_sources).map(key => SOURCE_META[key].label);
  const aiProviders = selfFirst(config.ai_sources).map(key => SOURCE_META[key].label);
  const hasBackup = Boolean(config.sources.backup?.enabled);
  const dailyFilter = combinedRegionRegex(config.daily_regions);
  const aiFilter = REGIONS.US.regex;

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
  lines.push(`    filter: '${dailyFilter}'`);

  if (hasBackup) {
    lines.push(
      ``,
      `  - name: "🛟 备用节点"`,
      `    type: select`,
      `    use:`,
      `      - "备用"`,
      ``,
      `  - name: "🛟 备用大流量"`,
      `    type: select`,
      `    use:`,
      `      - "备用"`,
      `    filter: '${BACKUP_LARGE_TRAFFIC_REGEX}'`
    );
  }

  lines.push(
    ``,
    `  - name: "🤖 AI"`,
    `    type: select`,
    `    use:`
  );
  for (const name of aiProviders) lines.push(`      - "${name}"`);
  lines.push(`    filter: '${aiFilter}'`);

  if (config.emby?.enabled) {
    lines.push(
      ``,
      `  - name: "📺 Emby"`,
      `    type: select`,
      `    proxies:`
    );
    for (const sourceKey of selfFirst(config.emby.sources)) {
      lines.push(sourceKey === "backup"
        ? `      - "📺 Emby · 备用大流量"`
        : `      - "📺 Emby · ${SOURCE_META[sourceKey].label}"`);
    }
    for (const sourceKey of config.emby.sources) {
      if (sourceKey === "backup") {
        lines.push(
          ``,
          `  - name: "📺 Emby · 备用大流量"`,
          `    type: select`,
          `    use:`,
          `      - "备用"`,
          `    filter: '${backupLargeTrafficRegionRegex(config.emby.regions)}'`
        );
        continue;
      }
      lines.push(
        ``,
        `  - name: "📺 Emby · ${SOURCE_META[sourceKey].label}"`,
        `    type: select`,
        `    use:`,
        `      - "${SOURCE_META[sourceKey].label}"`,
        `    filter: '${combinedRegionRegex(config.emby.regions)}'`
      );
    }
  }

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

function sameArray(a, b) {
  return Array.isArray(a) && a.length === b.length && a.every((value, index) => value === b[index]);
}

function isLegacyDefault(config) {
  return sameArray(config.daily_sources, ["self", "airport"])
    && sameArray(config.daily_regions, ["SG"])
    && sameArray(config.ai_sources, ["airport", "self", "backup"])
    && SOURCE_ORDER.every(key => config.sources[key]?.enabled && validUrl(config.sources[key]?.url));
}

function renderTemplate(template, config) {
  if (template.includes("__PROXY_PROVIDERS__") && template.includes("__PROXY_GROUPS__")) {
    const rendered = template
      .replace("__PROXY_PROVIDERS__", buildProviders(config))
      .replace("__PROXY_GROUPS__", buildGroups(config));
    const privateRules = config.emby?.enabled ? buildPrivateRuleLines(config.emby.targets, "📺 Emby") : [];
    if (config.emby?.plex?.enabled) privateRules.push(`DOMAIN,${config.emby.plex.domain},📺 Emby`);
    const withRules = injectPrivateRules(rendered, privateRules);
    return injectPrivateHosts(withRules, buildMihomoPlexHostLines(config.emby?.plex));
  }

  // Zero-downtime rollout: before main switches to the v2 template, keep legacy
  // tokens and the v1 Builder working against the old three-placeholder template.
  if (template.includes("__SELF_URL__") && template.includes("__AIRPORT_A_URL__") && template.includes("__BACKUP_URL__")) {
    if (!isLegacyDefault(config)) throw new Error("Mihomo v2 模板尚未发布到 main");
    return template
      .replaceAll("__SELF_URL__", yamlEscape(config.sources.self.url))
      .replaceAll("__AIRPORT_A_URL__", yamlEscape(config.sources.airport.url))
      .replaceAll("__BACKUP_URL__", yamlEscape(config.sources.backup.url));
  }

  throw new Error("GitHub Mihomo 模板格式无法识别");
}


function normalizeLoonPayload(body) {
  const enabledSources = uniqueAllowed(body?.enabled_sources, SOURCE_ORDER);
  if (!enabledSources.length) throw new Error("Loon 至少启用一个节点来源");

  const dailySources = uniqueAllowed(body?.daily_sources, SOURCE_ORDER).filter(key => enabledSources.includes(key));
  const dailyRegions = uniqueAllowed(body?.daily_regions, Object.keys(REGIONS));
  const aiSources = uniqueAllowed(body?.ai_sources, SOURCE_ORDER).filter(key => enabledSources.includes(key));

  if (!dailySources.length) throw new Error("Loon 日用节点至少选择一个已启用来源");
  if (!dailyRegions.length) throw new Error("Loon 日用节点至少选择一个地区");
  if (!aiSources.length) throw new Error("Loon AI 至少选择一个已启用来源");

  const emby = normalizeEmby(body?.emby, enabledSources);
  return {
    version: 2,
    enabled_sources: enabledSources,
    daily_sources: dailySources,
    daily_regions: dailyRegions,
    ai_sources: aiSources,
    emby
  };
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
  const embyAllSources = new Set(config.emby?.enabled ? config.emby.sources : []);

  const lines = [];
  for (const sourceKey of SOURCE_ORDER) {
    if (!config.enabled_sources.includes(sourceKey)) continue;

    if (sourceKey === "backup") {
      lines.push(`备用 · 全部 = NameRegex,备用, FilterKey = ".*"`);
      lines.push(`备用 · 大流量 = NameRegex,备用, FilterKey = "${BACKUP_LARGE_TRAFFIC_REGEX}"`);
      if (embyAllSources.has("backup")) {
        lines.push(`备用 · Emby大流量 = NameRegex,备用, FilterKey = "${backupLargeTrafficRegionRegex(config.emby.regions)}"`);
      }
    } else if (embyAllSources.has(sourceKey)) {
      lines.push(`${SOURCE_META[sourceKey].label} · 全部 = NameRegex,${SOURCE_META[sourceKey].label}, FilterKey = "${combinedRegionRegex(config.emby.regions)}"`);
    }

    for (const regionCode of Object.keys(REGIONS)) {
      if (!needed.has(`${sourceKey}:${regionCode}`)) continue;
      const name = providerName(sourceKey, regionCode);
      lines.push(`${name} = NameRegex,${SOURCE_META[sourceKey].label}, FilterKey = "${REGIONS[regionCode].regex}"`);
    }
  }

  return lines.join("\n");
}

function buildLoonGroups(config) {
  const dailyFilters = [];
  for (const sourceKey of selfFirst(config.daily_sources)) {
    for (const regionCode of config.daily_regions) {
      dailyFilters.push(providerName(sourceKey, regionCode));
    }
  }

  const aiFilters = selfFirst(config.ai_sources).map(sourceKey => providerName(sourceKey, "US"));
  const hasBackup = config.enabled_sources.includes("backup");

  const globalItems = ["主力节点"];
  if (hasBackup) globalItems.push("备用节点");

  const lines = [
    `全球代理策略 = select,${globalItems.join(",")},img-url = https://raw.githubusercontent.com/Orz-3/mini/master/Color/Global.png`,
    `主力节点 = select,${dailyFilters.join(",")},img-url = https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Server.png`
  ];

  if (hasBackup) {
    lines.push(`备用节点 = select,备用 · 全部,img-url = https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Available.png`);
    lines.push(`备用大流量 = select,备用 · 大流量,img-url = https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Available.png`);
  }

  lines.push(
    `AI = select,${aiFilters.join(",")},img-url = https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/AI.png`
  );

  if (config.emby?.enabled) {
    const embyFilters = selfFirst(config.emby.sources).map(sourceKey => sourceKey === "backup" ? "备用 · Emby大流量" : `${SOURCE_META[sourceKey].label} · 全部`);
    lines.push(`Emby = select,${embyFilters.join(",")},img-url = https://raw.githubusercontent.com/Koolson/Qure/master/IconSet/Color/Media.png`);
  }

  lines.push(
    `番茄 = select,DIRECT,全球代理策略,img-url = https://raw.githubusercontent.com/luestr/IconResource/main/App_icon/120px/DragonRead.png`,
    `抖音 = select,DIRECT,全球代理策略,img-url = https://raw.githubusercontent.com/luestr/IconResource/main/App_icon/120px/TikTok.png`,
    `小红书 = select,DIRECT,全球代理策略,img-url = https://raw.githubusercontent.com/luestr/IconResource/main/App_icon/120px/RedPaper.png`
  );

  return lines.join("\n");
}

function renderLoonTemplate(template, config) {
  if (!template.includes("__REMOTE_FILTERS__") || !template.includes("__PROXY_GROUPS__")) {
    throw new Error("GitHub Loon 模板缺少动态区块占位符");
  }
  const rendered = template
    .replace("__REMOTE_FILTERS__", buildLoonFilters(config))
    .replace("__PROXY_GROUPS__", buildLoonGroups(config));
  const privateRules = config.emby?.enabled ? buildPrivateRuleLines(config.emby.targets, "Emby") : [];
  if (config.emby?.plex?.enabled) privateRules.push(`DOMAIN,${config.emby.plex.domain},Emby`);
  const withRules = injectPrivateRules(rendered, privateRules);
  return injectPrivateHosts(withRules, buildLoonPlexHostLines(config.emby?.plex));
}

async function handleLoonPost(request, env) {
  const origin = request.headers.get("Origin") || "";
  let body;
  try {
    body = await request.json();
  } catch (_) {
    return json({ error: "请求体必须是 JSON" }, 400, origin);
  }

  let config;
  try {
    config = normalizeLoonPayload(body);
  } catch (e) {
    return json({ error: e.message }, 400, origin);
  }

  const token = crypto.randomUUID().replaceAll("-", "");
  await env.MIHOMO_KV.put(`loon:${token}`, JSON.stringify(config));

  return json({
    config_url: `https://config.primusz.top/loon/${token}/Primus-Loon.lcf`
  }, 200, origin);
}

async function handleLoonGet(token, env) {
  const raw = await env.MIHOMO_KV.get(`loon:${token}`);
  if (!raw) {
    return new Response("Loon config not found", {
      status: 404,
      headers: { "Cache-Control": "no-store" }
    });
  }

  let record;
  try {
    record = JSON.parse(raw);
  } catch (_) {
    return new Response("Invalid Loon config data", {
      status: 500,
      headers: { "Cache-Control": "no-store" }
    });
  }

  let config;
  try {
    config = normalizeLoonPayload(record);
  } catch (e) {
    return new Response(`Invalid Loon config: ${e.message}`, {
      status: 500,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const [templateResponse, versionManifest] = await Promise.all([
    fetch(LOON_TEMPLATE_URL, { cf: { cacheTtl: 0, cacheEverything: false } }),
    fetchVersionManifest()
  ]);
  if (!templateResponse.ok) {
    return new Response("Failed to fetch Loon template", {
      status: 502,
      headers: { "Cache-Control": "no-store" }
    });
  }

  try {
    const template = applyVersionMetadata(await templateResponse.text(), versionManifest, "loon");
    const lcf = renderLoonTemplate(template, config);
    return new Response(lcf, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": "attachment; filename=Primus-Loon.lcf",
        "Cache-Control": "no-store"
      }
    });
  } catch (e) {
    return new Response(`Loon config render failed: ${e.message}`, {
      status: 500,
      headers: { "Cache-Control": "no-store" }
    });
  }
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

  const [templateResponse, versionManifest] = await Promise.all([
    fetch(MIHOMO_TEMPLATE_URL, { cf: { cacheTtl: 0, cacheEverything: false } }),
    fetchVersionManifest()
  ]);
  if (!templateResponse.ok) return new Response("Failed to fetch template", { status: 502, headers: { "Cache-Control": "no-store" } });

  try {
    const template = applyVersionMetadata(await templateResponse.text(), versionManifest, "mihomo");
    const yaml = renderTemplate(template, config);
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
    if (request.method === "POST" && url.pathname === "/api/loon") return handleLoonPost(request, env);

    const mihomoMatch = url.pathname.match(/^\/mihomo\/([A-Za-z0-9_-]+)$/);
    if (request.method === "GET" && mihomoMatch) return handleGet(mihomoMatch[1], env);

    const loonMatch = url.pathname.match(/^\/loon\/([A-Za-z0-9_-]+)(?:\/Primus-Loon\.lcf)?$/);
    if (request.method === "GET" && loonMatch) return handleLoonGet(loonMatch[1], env);

    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }
};
