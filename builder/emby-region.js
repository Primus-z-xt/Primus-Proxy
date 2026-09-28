(() => {
  const EMBY_REGION_DEFAULT = "US";

  function renderEmbyRegionOptions(rootId, className, defaultCode = EMBY_REGION_DEFAULT) {
    const root = document.getElementById(rootId);
    if (!root) return;
    root.innerHTML = "";
    for (const group of REGION_GROUPS) {
      const title = document.createElement("div");
      title.className = "group-title";
      title.textContent = group.title;
      root.appendChild(title);
      const grid = document.createElement("div");
      grid.className = "option-grid region-grid";
      for (const code of group.codes) {
        const label = document.createElement("label");
        label.className = "check-item";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.className = className;
        input.dataset.region = code;
        input.checked = code === defaultCode;
        appendRegionLabel(label, input, code);
        grid.appendChild(label);
      }
      root.appendChild(grid);
    }
  }

  function embyRegions(selector) {
    return selectedValues(selector, "region");
  }

  function requireEmbyRegions(config, label) {
    if (config.emby?.enabled && !Array.isArray(config.emby.regions)) config.emby.regions = [];
    if (config.emby?.enabled && !config.emby.regions.length) return `${label} Emby 至少选择一个地区`;
    return "";
  }

  renderEmbyRegionOptions("emby-region-options", "emby-region");
  renderEmbyRegionOptions("loon-emby-region-options", "loon-emby-region");
  upgradeFlagImages();

  const baseGetConfigFromUi = window.getConfigFromUi;
  const baseBuildGroups = window.buildGroups;
  const baseGetLoonConfigFromUi = window.getLoonConfigFromUi;
  const baseBuildLoonFilters = window.buildLoonFilters;
  const baseRestoreSelections = window.restoreSelections;
  const baseRestoreLoonSelections = window.restoreLoonSelections;
  const baseValidateConfig = window.validateConfig;
  const baseValidateLoonConfig = window.validateLoonConfig;
  const baseLoonFingerprint = window.loonFingerprint;

  window.getConfigFromUi = function () {
    const config = baseGetConfigFromUi();
    config.emby = { ...config.emby, regions: embyRegions(".emby-region") };
    return config;
  };

  window.validateConfig = function (config) {
    const error = baseValidateConfig(config);
    return error || requireEmbyRegions(config, "Emby");
  };

  window.buildGroups = function (config) {
    const result = baseBuildGroups(config);
    if (!config.emby?.enabled || !config.emby.regions?.length) return result;
    const filter = combinedRegionRegex(config.emby.regions);
    return result.replace(/(  - name: "📺 Emby · [^"]+"\n    type: select\n    use:\n      - "[^"]+")/g, `$1\n    filter: '${filter}'`);
  };

  window.saveSelections = function () {
    const config = window.getConfigFromUi();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      enabled: Object.fromEntries(SOURCE_ORDER.map(key => [key, config.sources[key].enabled])),
      daily_sources: config.daily_sources,
      daily_regions: config.daily_regions,
      ai_sources: config.ai_sources,
      emby_sources: config.emby.sources,
      emby_regions: config.emby.regions
    }));
  };

  window.restoreSelections = function () {
    baseRestoreSelections();
    let saved;
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"); } catch (_) { return; }
    if (Array.isArray(saved?.emby_regions)) {
      document.querySelectorAll(".emby-region").forEach(el => { el.checked = saved.emby_regions.includes(el.dataset.region); });
    }
  };

  window.getLoonConfigFromUi = function () {
    const config = baseGetLoonConfigFromUi();
    config.emby = { ...config.emby, regions: embyRegions(".loon-emby-region") };
    return config;
  };

  window.validateLoonConfig = function (config) {
    const error = baseValidateLoonConfig(config);
    return error || requireEmbyRegions(config, "Loon Emby");
  };

  window.buildLoonFilters = function (config) {
    let result = baseBuildLoonFilters(config);
    if (!config.emby?.enabled || !config.emby.regions?.length) return result;
    const filter = combinedRegionRegex(config.emby.regions);
    for (const sourceKey of config.emby.sources) {
      const label = SOURCE_META[sourceKey].label;
      const line = `${label} · 全部 = NameRegex,${label}, FilterKey = ".*"`;
      const replacement = `${label} · 全部 = NameRegex,${label}, FilterKey = "${filter}"`;
      result = result.replace(line, replacement);
    }
    return result;
  };

  window.loonFingerprint = function (config) {
    const base = JSON.parse(baseLoonFingerprint(config));
    base.emby = { ...(base.emby || {}), regions: config.emby.regions };
    return JSON.stringify(base);
  };

  window.saveLoonSelections = function () {
    const config = window.getLoonConfigFromUi();
    localStorage.setItem(LOON_STORAGE_KEY, JSON.stringify({
      enabled_sources: config.enabled_sources,
      daily_sources: config.daily_sources,
      daily_regions: config.daily_regions,
      ai_sources: config.ai_sources,
      emby_sources: config.emby.sources,
      emby_regions: config.emby.regions
    }));
  };

  window.restoreLoonSelections = function () {
    baseRestoreLoonSelections();
    let saved;
    try { saved = JSON.parse(localStorage.getItem(LOON_STORAGE_KEY) || "null"); } catch (_) { return; }
    if (Array.isArray(saved?.emby_regions)) {
      document.querySelectorAll(".loon-emby-region").forEach(el => { el.checked = saved.emby_regions.includes(el.dataset.region); });
    }
  };

  // app.js already ran its initial restore before this file. Apply persisted Emby regions now.
  window.restoreSelections();
  window.restoreLoonSelections();
  window.saveSelections();
  window.saveLoonSelections();

  document.querySelectorAll(".emby-region").forEach(el => el.addEventListener("change", window.saveSelections));
  document.getElementById("emby-select-all-regions")?.addEventListener("click", () => {
    document.querySelectorAll(".emby-region").forEach(el => { el.checked = true; });
    window.saveSelections();
  });
  document.getElementById("emby-clear-regions")?.addEventListener("click", () => {
    document.querySelectorAll(".emby-region").forEach(el => { el.checked = false; });
    window.saveSelections();
  });

  document.querySelectorAll(".loon-emby-region").forEach(el => el.addEventListener("change", () => {
    window.saveLoonSelections();
    invalidateLoonGeneration("Loon Emby 地区选择已变更，请重新生成配置");
  }));
  document.getElementById("loon-emby-select-all-regions")?.addEventListener("click", () => {
    document.querySelectorAll(".loon-emby-region").forEach(el => { el.checked = true; });
    window.saveLoonSelections();
    invalidateLoonGeneration("Loon Emby 地区选择已变更，请重新生成配置");
  });
  document.getElementById("loon-emby-clear-regions")?.addEventListener("click", () => {
    document.querySelectorAll(".loon-emby-region").forEach(el => { el.checked = false; });
    window.saveLoonSelections();
    invalidateLoonGeneration("Loon Emby 地区选择已变更，请重新生成配置");
  });
})();
