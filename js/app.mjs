import { getRecordById, localizeRecord, readState, searchAndFilter, writeState } from "./catalog.mjs";

const strings = {
  zh: {
    skipLink: "跳至主要内容", wordmarkLabel: "X-RADS 首页", primaryNavigationLabel: "主要导航", heroNoteLabel: "参考说明", resultsRegionLabel: "目录结果", "nav.catalog": "查阅", "nav.detail": "详情", heroTitle: "快速找到需要的报告与数据系统", heroLede: "按简称、器官、疾病、模态或分级查阅 RADS。", heroNoteTitle: "专业查阅", heroNote: "先按部位定位，再用筛选缩小范围；详情保留原始英文术语和官方来源。", searchLabel: "搜索条目", searchPlaceholder: "搜索简称、器官、疾病、模态或分级", catalogTitle: "RADS 临床查阅", anatomyLabel: "人体部位导航", allAnatomy: "全部", "anatomy.head-neck": "头颈部", "anatomy.chest": "胸部", "anatomy.abdomen-pelvis": "腹部与盆腔", "anatomy.musculoskeletal-whole-body": "骨肌与全身", modalityLabel: "影像模态", statusLabel: "条目状态", frequentLabel: "常用 RADS", allModalities: "全部模态", allStatuses: "全部状态", released: "正式发布", "in-development": "开发中", "non-acr": "非 ACR", loading: "正在载入参考目录…", loadError: "目录暂时无法载入，请稍后重试。", resultCount: (n) => `共 ${n} 条`, noResults: "没有找到匹配条目。", viewDetail: "查看临床速查", back: "← 返回筛选结果", notFound: "未找到该条目。", organization: "机构", version: "当前版本", releaseDate: "发布日期：", domain: "适用领域", modalities: "影像模态", categoryRange: "分级范围", overview: "临床概览", categories: "评分分级", code: "分级", originalTerm: "原始英文术语", meaning: "临床含义", keyTerms: "关键术语与检查要求", officialSource: "官方来源", openSource: "查看官方原文", noSource: "尚未核对", lastVerified: "上次核对", related: "相关 RADS", professionalNotice: "本站内容仅供专业查阅和教学参考；临床使用应以当前官方版本和所在机构规范为准。", pageTitle: "X-RADS 临床影像参考",
  },
  en: {
    skipLink: "Skip to main content", wordmarkLabel: "X-RADS home", primaryNavigationLabel: "Primary navigation", heroNoteLabel: "Reference note", resultsRegionLabel: "Catalog results", "nav.catalog": "Browse", "nav.detail": "Detail", heroTitle: "Find the reporting and data system you need", heroLede: "Browse RADS by acronym, organ, disease, modality, or category.", heroNoteTitle: "Professional reference", heroNote: "Start by anatomy, then narrow results with filters. Detail pages retain original English terms and official sources.", searchLabel: "Search entries", searchPlaceholder: "Search acronym, organ, disease, modality, or category", catalogTitle: "RADS clinical reference", anatomyLabel: "Anatomy navigator", allAnatomy: "All", "anatomy.head-neck": "Head & neck", "anatomy.chest": "Chest", "anatomy.abdomen-pelvis": "Abdomen & pelvis", "anatomy.musculoskeletal-whole-body": "Musculoskeletal & whole body", modalityLabel: "Modality", statusLabel: "Entry status", frequentLabel: "Frequently used", allModalities: "All modalities", allStatuses: "All statuses", released: "Released", "in-development": "In development", "non-acr": "Non-ACR", loading: "Loading reference catalog…", loadError: "The catalog could not be loaded. Please try again later.", resultCount: (n) => `${n} entries`, noResults: "No matching entries.", viewDetail: "Open clinical reference", back: "← Back to filtered results", notFound: "Entry not found.", organization: "Organization", version: "Current version", releaseDate: "Release date:", domain: "Application domain", modalities: "Modalities", categoryRange: "Category range", overview: "Clinical overview", categories: "Categories", code: "Code", originalTerm: "Original English term", meaning: "Clinical meaning", keyTerms: "Key terms and examination conditions", officialSource: "Official source", openSource: "Open official source", noSource: "Not verified", lastVerified: "Last verified", related: "Related RADS", professionalNotice: "This site is for professional reference and teaching only. Current official guidance and institutional policy take precedence in clinical use.", pageTitle: "X-RADS Clinical Reference",
  },
};

const anatomyGroups = { "head-neck": ["thyroid"], chest: ["breast", "lung"], "abdomen-pelvis": ["liver", "ovary", "prostate"], "musculoskeletal-whole-body": [] };
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
const text = (lang, key, ...args) => { const value = strings[lang][key] ?? key; return typeof value === "function" ? value(...args) : value; };
const safeHttpUrl = (value) => { try { const url = new URL(String(value)); return /^https?:$/.test(url.protocol) ? url.href : ""; } catch { return ""; } };
const isPresent = (value) => !(value == null || value === "" || (Array.isArray(value) && value.length === 0));
const withFallback = (lang, value) => isPresent(value) ? value : text(lang, "noSource");
const statusLabel = (lang, status) => Object.hasOwn(strings[lang], status) ? text(lang, status) : text(lang, "noSource");

export function filterCatalog(records, filters = {}) {
  const anatomy = filters.anatomy || "";
  const regionalRecords = anatomy ? records.filter((record) => (anatomyGroups[anatomy] || [anatomy]).includes(record.anatomy)) : records;
  return searchAndFilter(regionalRecords, { ...filters, anatomy: "" });
}

export async function loadCatalog(fetcher = fetch) {
  const response = await fetcher("./data/rads.json");
  if (!response?.ok) throw new Error(`Catalog request failed${response?.status ? ` (${response.status})` : ""}`);
  const records = await response.json();
  if (!Array.isArray(records) || !records.length || records.some((record) => !record?.id || !record?.name?.zh || !record?.name?.en || !Array.isArray(record.modalities))) throw new Error("Catalog is empty or malformed");
  return records;
}

const relativeUrl = (url) => `${url.pathname}${url.search}${url.hash}`;
const detailUrl = (url, id) => relativeUrl(writeState(url, { rads: id }));

export function chooseNavigationFocus(previousRads, nextRads, returnRadsId = "") {
  if (previousRads === nextRads) return null;
  if (nextRads) return { target: "detail", radsId: nextRads };
  if (returnRadsId) return { target: "result", radsId: returnRadsId };
  return { target: "catalog", radsId: "" };
}

export function renderCatalog(records, url) {
  const state = readState(url); const results = filterCatalog(records, state);
  if (!results.length) return `<p class="empty-state">${escapeHtml(text(state.lang, "noResults"))}</p>`;
  return results.map((record) => {
    const item = localizeRecord(record, state.lang); const englishName = state.lang === "zh" ? `<p class="english-name">${escapeHtml(item.englishName)}</p>` : "";
    const modalities = Array.isArray(record.modalities) ? record.modalities : [];
    return `<article class="catalog-card"><p class="card-acronym">${escapeHtml(withFallback(state.lang, record.acronym))}</p><h3>${escapeHtml(withFallback(state.lang, item.displayName))}</h3>${englishName}<p class="card-domain">${escapeHtml(withFallback(state.lang, item.displayDomain))}</p><div class="badge-row">${modalities.length ? modalities.map((modality) => `<span class="badge">${escapeHtml(withFallback(state.lang, modality))}</span>`).join("") : `<span class="badge">${escapeHtml(text(state.lang, "noSource"))}</span>`}<span class="badge status">${escapeHtml(statusLabel(state.lang, record.status))}</span></div><p class="english-name">${escapeHtml(withFallback(state.lang, record.version))}</p><a class="card-link" href="${escapeHtml(detailUrl(url, record.id))}" data-rads="${escapeHtml(record.id)}">${escapeHtml(text(state.lang, "viewDetail"))}</a></article>`;
  }).join("");
}

export function renderLoadFailure(url) {
  const state = readState(url);
  return `<p class="error-state">${escapeHtml(text(state.lang, "loadError"))}</p>`;
}

export function renderDetail(records, url) {
  const state = readState(url); const back = escapeHtml(relativeUrl(writeState(url, { rads: "" }))); const record = getRecordById(records, state.rads);
  if (!record) return `<a class="detail-back" href="${back}" data-back-detail>${escapeHtml(text(state.lang, "back"))}</a><p class="empty-state">${escapeHtml(text(state.lang, "notFound"))}</p>`;
  const item = localizeRecord(record, state.lang); const source = safeHttpUrl(record.officialUrl); const modalities = Array.isArray(record.modalities) ? record.modalities : [];
  const primaryMeta = [["organization", record.organization], ["statusLabel", statusLabel(state.lang, record.status)], ["version", record.version], ["domain", item.displayDomain], ["modalities", modalities.join(", ")], ["categoryRange", record.categoryRange]].map(([label, value]) => `<div class="metadata-item"><strong>${escapeHtml(text(state.lang, label))}</strong>${escapeHtml(withFallback(state.lang, value))}</div>`).join("");
  const rows = item.categories.length ? item.categories.map((category) => `<tr><td>${escapeHtml(withFallback(state.lang, category.code))}</td><td>${escapeHtml(withFallback(state.lang, category.original))}</td><td>${escapeHtml(withFallback(state.lang, category.displayMeaning))}</td></tr>`).join("") : `<tr><td colspan="3">${escapeHtml(text(state.lang, "noSource"))}</td></tr>`;
  const terms = item.originalTerms.length ? item.originalTerms.map((term) => `<li><strong>${escapeHtml(withFallback(state.lang, term.term))}</strong> — ${escapeHtml(withFallback(state.lang, term.displayExplanation))}</li>`).join("") : `<li>${escapeHtml(text(state.lang, "noSource"))}</li>`;
  const relatedLinks = (record.related || []).map((id) => { const peer = getRecordById(records, id); return peer ? `<a href="${escapeHtml(detailUrl(url, id))}" data-rads="${escapeHtml(id)}">${escapeHtml(withFallback(state.lang, peer.acronym))}</a>` : ""; }).join("");
  const related = relatedLinks || `<p>${escapeHtml(text(state.lang, "noSource"))}</p>`;
  const sourceLink = source ? `<a class="source-link" href="${escapeHtml(source)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text(state.lang, "openSource"))}</a>` : `<p>${escapeHtml(text(state.lang, "noSource"))}</p>`;
  const releaseDate = withFallback(state.lang, record.releaseDate);
  return `<a class="detail-back" href="${back}" data-back-detail>${escapeHtml(text(state.lang, "back"))}</a><div class="detail-title-row"><div><p class="eyebrow">${escapeHtml(withFallback(state.lang, record.anatomy))} › ${escapeHtml(withFallback(state.lang, record.acronym))}</p><h2 id="detail-heading" tabindex="-1">${escapeHtml(withFallback(state.lang, item.displayName))}</h2><p class="detail-subtitle">${escapeHtml(withFallback(state.lang, item.englishName))} · <strong>${escapeHtml(withFallback(state.lang, record.acronym))}</strong></p></div></div><div class="metadata-grid">${primaryMeta}</div><div class="detail-layout"><div class="detail-main"><section><h3>${escapeHtml(text(state.lang, "overview"))}</h3><p>${escapeHtml(withFallback(state.lang, item.displaySummary))}</p></section><section><h3>${escapeHtml(text(state.lang, "categories"))}</h3><table class="category-table"><thead><tr><th>${escapeHtml(text(state.lang, "code"))}</th><th>${escapeHtml(text(state.lang, "originalTerm"))}</th><th>${escapeHtml(text(state.lang, "meaning"))}</th></tr></thead><tbody>${rows}</tbody></table></section><section><h3>${escapeHtml(text(state.lang, "keyTerms"))}</h3><ul class="term-list">${terms}</ul></section></div><aside class="detail-sidebar"><section><h3>${escapeHtml(text(state.lang, "version"))}</h3><p>${escapeHtml(withFallback(state.lang, record.version))}</p><p><strong>${escapeHtml(text(state.lang, "releaseDate"))}</strong> ${escapeHtml(releaseDate)}</p></section><section><h3>${escapeHtml(text(state.lang, "officialSource"))}</h3>${sourceLink}</section><section><h3>${escapeHtml(text(state.lang, "lastVerified"))}</h3><p>${escapeHtml(withFallback(state.lang, record.lastVerified))}</p></section></aside></div><section class="detail-related"><h3>${escapeHtml(text(state.lang, "related"))}</h3><div class="related-links">${related}</div></section><p class="notice">${escapeHtml(text(state.lang, "professionalNotice"))}</p>`;
}

function setStaticCopy(state) {
  document.documentElement.lang = state.lang === "zh" ? "zh-CN" : "en"; document.title = text(state.lang, "pageTitle");
  document.querySelectorAll("[data-i18n]").forEach((element) => { element.textContent = text(state.lang, element.dataset.i18n); });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => { element.placeholder = text(state.lang, element.dataset.i18nPlaceholder); });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => { element.setAttribute("aria-label", text(state.lang, element.dataset.i18nAriaLabel)); });
  const language = document.querySelector("#language-switcher"); language.textContent = state.lang === "zh" ? "EN" : "中文"; language.setAttribute("aria-pressed", String(state.lang === "en")); language.setAttribute("aria-label", state.lang === "zh" ? "Switch to English" : "切换至中文");
}

function options(records, state) {
  const modalities = [...new Set(records.flatMap((record) => record.modalities))].sort(); const statuses = [...new Set(records.map((record) => record.status))];
  const option = (value, label, selected) => `<option value="${escapeHtml(value)}"${selected ? " selected" : ""}>${escapeHtml(label)}</option>`;
  return { modality: option("", text(state.lang, "allModalities"), !state.modality) + modalities.map((value) => option(value, value, state.modality === value)).join(""), status: option("", text(state.lang, "allStatuses"), !state.status) + statuses.map((value) => option(value, text(state.lang, value), state.status === value)).join("") };
}

function startApp() {
  const element = { search: document.querySelector("#search-input"), anatomy: document.querySelector("#anatomy-filter"), modality: document.querySelector("#modality-filter"), status: document.querySelector("#status-filter"), results: document.querySelector("#catalog-results"), detail: document.querySelector("#detail-view"), detailNav: document.querySelector("#detail-nav"), catalogHeading: document.querySelector("#catalog-heading"), pageStatus: document.querySelector("#page-status"), language: document.querySelector("#language-switcher") };
  let records = [];
  let loadFailure = false;
  let renderedRads = readState(new URL(window.location.href)).rads;
  const focusRenderedTarget = (focusTarget) => {
    if (!focusTarget) return;
    let target = null;
    if (focusTarget.target === "detail") target = document.querySelector("#detail-heading") || element.detail;
    if (focusTarget.target === "result") target = [...element.results.querySelectorAll("[data-rads]")].find((link) => link.dataset.rads === focusTarget.radsId) || element.catalogHeading;
    if (focusTarget.target === "catalog") target = element.catalogHeading;
    if (!target) return;
    target.focus({ preventScroll: focusTarget.target === "detail" });
    if (focusTarget.target === "detail") target.scrollIntoView({ block: "start" });
  };
  const render = (previousRads = renderedRads, returnRadsId = history.state?.returnRadsId || "") => {
    const url = new URL(window.location.href); const state = readState(url); setStaticCopy(state); element.search.value = state.query; element.anatomy.querySelectorAll("[data-anatomy]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.anatomy === state.anatomy)));
    if (loadFailure) { element.results.innerHTML = renderLoadFailure(url); element.detail.hidden = true; element.detailNav.hidden = true; element.pageStatus.textContent = text(state.lang, "loadError"); renderedRads = state.rads; return; }
    const choices = options(records, state); element.modality.innerHTML = choices.modality; element.status.innerHTML = choices.status; element.results.innerHTML = renderCatalog(records, url); element.pageStatus.textContent = text(state.lang, "resultCount", filterCatalog(records, state).length); element.detail.hidden = !state.rads;
    const hasDetail = Boolean(state.rads && getRecordById(records, state.rads));
    element.detailNav.hidden = !hasDetail;
    if (state.rads) element.detail.innerHTML = renderDetail(records, url);
    const focusTarget = chooseNavigationFocus(previousRads, state.rads, returnRadsId);
    renderedRads = state.rads;
    focusRenderedTarget(focusTarget);
  };
  const navigate = (patch, push = false, returnRadsId = history.state?.returnRadsId || "") => {
    const previousRads = readState(new URL(window.location.href)).rads;
    const nextUrl = writeState(new URL(window.location.href), patch);
    history[push ? "pushState" : "replaceState"](returnRadsId ? { returnRadsId } : {}, "", nextUrl);
    render(previousRads, returnRadsId);
  };
  const showError = (error) => { console.error(error); loadFailure = true; render(); };
  element.search.addEventListener("input", () => navigate({ query: element.search.value, rads: "" })); element.modality.addEventListener("change", () => navigate({ modality: element.modality.value, rads: "" })); element.status.addEventListener("change", () => navigate({ status: element.status.value, rads: "" }));
  element.anatomy.addEventListener("click", (event) => { const button = event.target.closest("[data-anatomy]"); if (button) navigate({ anatomy: button.dataset.anatomy, rads: "" }); });
  document.addEventListener("click", (event) => { const card = event.target.closest("[data-rads]"); if (card) { event.preventDefault(); const state = readState(new URL(window.location.href)); const returnRadsId = state.rads ? history.state?.returnRadsId || state.rads : card.dataset.rads; navigate({ rads: card.dataset.rads }, true, returnRadsId); return; } const back = event.target.closest("[data-back-detail]"); if (back) { event.preventDefault(); const state = readState(new URL(window.location.href)); navigate({ rads: "" }, true, history.state?.returnRadsId || state.rads); return; } const chip = event.target.closest("[data-rads-query]"); if (chip) navigate({ query: chip.dataset.radsQuery, rads: "" }); });
  element.language.addEventListener("click", () => navigate({ lang: readState(new URL(window.location.href)).lang === "zh" ? "en" : "zh" })); window.addEventListener("popstate", (event) => render(renderedRads, event.state?.returnRadsId || ""));
  const state = readState(new URL(window.location.href)); setStaticCopy(state); element.pageStatus.textContent = text(state.lang, "loading"); loadCatalog().then((data) => { records = data; render(); }).catch(showError);
}

if (typeof document !== "undefined") startApp();
