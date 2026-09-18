import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("README documents preview, testing, source policy, and Pages deployment", async () => {
  const readme = await readFile(new URL("README.md", root), "utf8");
  for (const heading of ["Local preview", "Tests", "Content maintenance", "Source and copyright policy", "GitHub Pages"]) {
    assert.match(readme, new RegExp(`^## ${escapeRegExp(heading)}$`, "m"));
  }
});

test("index exposes every required application landmark", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  for (const id of [
    "language-switcher",
    "search-input",
    "anatomy-filter",
    "modality-filter",
    "status-filter",
    "catalog-results",
    "detail-view",
    "page-status",
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /<script[^>]+type=["']module["'][^>]+src=["']\.\/js\/app\.mjs["']/);
});

test("GitHub Pages publishes without Jekyll processing", async () => {
  assert.equal(await readFile(new URL(".nojekyll", root), "utf8"), "");
});

test("site shell includes the professional-use notice and anatomy navigator", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.match(html, /data-i18n=["']professionalNotice["']/);
  for (const region of ["head-neck", "chest", "abdomen-pelvis", "musculoskeletal-whole-body"]) {
    assert.match(html, new RegExp(`data-anatomy=["']${region}["']`));
  }
});

test("site shell presents Jingyu Zhong in a team section before the footer", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.match(html, /<section id="team" class="team" aria-labelledby="team-heading">/);
  assert.match(html, /<h2 id="team-heading"[^>]*data-i18n="teamTitle"/);
  assert.match(html, /assets\/team\/jingyu-zhong\.jpg/);
  assert.match(html, /<h3 data-i18n="teamMemberName">钟京渝，医学博士<\/h3>/);
  assert.match(html, /<p class="team-affiliation" data-i18n="teamMemberAffiliation">上海交通大学医学院附属同仁医院<\/p>/);
  assert.match(html, /class="team-contact" href="mailto:wal_zjy@163\.com"[^>]*data-i18n-aria-label="teamEmailLabel"/);
  assert.match(html, /<svg[^>]*aria-hidden="true"/);
  assert.doesNotMatch(html, /class="team-contact"[^>]*>wal_zjy@163\.com/);
  assert.ok(html.indexOf('id="team"') < html.indexOf("<footer"));
});

test("regional anatomy filtering combines with search, modality, and status", async () => {
  const app = await import("../js/app.mjs");
  const records = JSON.parse(await readFile(new URL("data/rads.json", root), "utf8"));
  assert.deepEqual(
    app.filterCatalog(records, { anatomy: "chest", modality: "CT", status: "non-acr" }).map(r => r.id),
    ["cac-drs", "cad-rads", "co-rads", "covid-rads", "ild-rads", "ilf-rads", "lu-rads", "vp-rads"],
  );
  assert.deepEqual(
    app.filterCatalog(records, { anatomy: "abdomen-pelvis", modality: "US", status: "non-acr" }).map(r => r.id),
    ["apendic-rads", "gb-rads", "gi-rads", "su-rads"],
  );
  assert.match(app.renderCatalog(records, new URL("https://example.test/?lang=zh&status=non-acr")), /非 ACR/);
  assert.match(app.renderCatalog(records, new URL("https://example.test/?lang=en&status=non-acr")), /Non-ACR/);
  assert.deepEqual(app.filterCatalog(records, { anatomy: "abdomen-pelvis", modality: "MRI", query: "prostate", status: "released" }).map(r => r.id), ["pi-rads"]);
  assert.deepEqual(app.filterCatalog(records, { anatomy: "musculoskeletal-whole-body", modality: "MRI", status: "non-acr" }).map(r => r.id), ["bti-rads", "met-rads", "mski-rads", "my-rads", "node-rads", "ns-rads", "onco-rads", "or-rads", "ot-rads"]);
  assert.deepEqual(app.filterCatalog(records, { anatomy: "thyroid" }).map(r => r.id), ["ti-rads", "eu-ti-rads", "k-ti-rads", "kwak-ti-rads"]);
});

test("works-in-progress catalog entries have localized status labels", async () => {
  const { renderCatalog } = await import("../js/app.mjs");
  const records = JSON.parse(await readFile(new URL("data/rads.json", root), "utf8"));
  const entry = { ...records.find(({ id }) => id === "pi-rads"), id: "bone-rads", acronym: "Bone-RADS", status: "works-in-progress" };
  assert.match(renderCatalog([entry], new URL("https://example.test/?lang=zh")), /进行中/);
  assert.match(renderCatalog([entry], new URL("https://example.test/?lang=en")), /Works in progress/);
});

test("loading rejects non-OK responses, broken JSON, and empty or malformed catalogs", async () => {
  const { loadCatalog } = await import("../js/app.mjs");
  const records = JSON.parse(await readFile(new URL("data/rads.json", root), "utf8"));
  assert.deepEqual(await loadCatalog(async path => {
    assert.equal(path, "./data/rads.json");
    return { ok: true, json: async () => records };
  }), records);
  for (const response of [
    { ok: false, status: 404 },
    { ok: true, json: async () => { throw new SyntaxError("Invalid JSON"); } },
    { ok: true, json: async () => [] },
    { ok: true, json: async () => ({}) },
    { ok: true, json: async () => [{ id: "incomplete" }] },
  ]) await assert.rejects(loadCatalog(async () => response));
});

test("localized cards retain English names and encode context-preserving detail URLs", async () => {
  const { renderCatalog } = await import("../js/app.mjs");
  const records = JSON.parse(await readFile(new URL("data/rads.json", root), "utf8"));
  const url = new URL("https://example.test/demo/?query=prostate&anatomy=abdomen-pelvis&modality=MRI&status=released&lang=zh");
  const html = renderCatalog(records, url);
  assert.match(html, /前列腺影像报告和数据系统/);
  assert.match(html, /Prostate Imaging Reporting and Data System/);
  assert.match(html, /v2\.1/);
  assert.match(html, /query=prostate&amp;anatomy=abdomen-pelvis&amp;modality=MRI&amp;status=released&amp;lang=zh&amp;rads=pi-rads/);
  assert.doesNotMatch(html, /BI-RADS/);
  url.searchParams.set("query", "<script>");
  assert.match(renderCatalog(records, url), /没有找到匹配条目/);
  url.searchParams.set("lang", "en");
  assert.match(renderCatalog(records, url), /No matching entries/);
});

test("clinical detail preserves categories, terms, source metadata and filtered back navigation", async () => {
  const { renderDetail } = await import("../js/app.mjs");
  const records = JSON.parse(await readFile(new URL("data/rads.json", root), "utf8"));
  const url = new URL("https://example.test/?lang=zh&query=MRI&rads=pi-rads");
  const html = renderDetail(records, url);
  for (const text of ["前列腺影像报告和数据系统", "Prostate Imaging Reporting and Data System", "Very low", "临床显著癌的可能性极低", "DWI", "v2.1", "2026-09-16", "AdMeTech", "尚未核对"])
    assert.ok(html.includes(text), `Detail missing ${text}`);
  assert.match(html, /<table/);
  assert.match(html, /<h2 id="detail-heading" tabindex="-1">/);
  assert.match(html, /发布日期：<\/strong> 尚未核对/);
  assert.match(html, /rel="noopener noreferrer"/);
  assert.match(html, /href="\/\?lang=zh&amp;query=MRI"/);
  assert.match(html, /rads=li-rads/);
  url.searchParams.set("lang", "en");
  assert.match(renderDetail(records, url), /Clinical overview/);
  assert.match(renderDetail(records, url), /Release date:<\/strong> Not verified/);
  url.searchParams.set("rads", "unknown");
  assert.match(renderDetail(records, url), /Entry not found/);
});

test("published non-ACR entries point readers to the primary paper for untranscribed category definitions", async () => {
  const { renderDetail } = await import("../js/app.mjs");
  const records = JSON.parse(await readFile(new URL("data/rads.json", root), "utf8"));
  const zh = renderDetail(records, new URL("https://example.test/?rads=co-rads"));
  assert.match(zh, /分类定义请查阅原始发表文献。/);
  assert.match(zh, /https:\/\/doi\.org\/10\.1148\/radiol\.2020201473/);
  const en = renderDetail(records, new URL("https://example.test/?lang=en&rads=co-rads"));
  assert.match(en, /See the original publication for category definitions\./);
});

test("partial bilingual detail fields use the requested-language sentinel", async () => {
  const { renderDetail } = await import("../js/app.mjs");
  const records = JSON.parse(await readFile(new URL("data/rads.json", root), "utf8"));
  const base = records.find(({ id }) => id === "pi-rads");
  const zhMissing = {
    ...base,
    name: { en: "English name only" },
    summary: { en: "English summary only" },
    domain: { en: "English domain only" },
    categories: [{ code: "1", original: "Very low", meaning: { en: "English meaning only" } }],
    originalTerms: [{ term: "DWI", explanation: { en: "English explanation only" } }],
  };
  const zh = renderDetail([zhMissing], new URL("https://example.test/?rads=pi-rads"));
  assert.match(zh, /<h2 id="detail-heading" tabindex="-1">尚未核对<\/h2>/);
  assert.match(zh, /English name only/);
  for (const substitution of ["English summary only", "English domain only", "English meaning only", "English explanation only"]) {
    assert.doesNotMatch(zh, new RegExp(substitution));
  }
  assert.ok(zh.match(/尚未核对/g).length >= 5);

  const enMissing = {
    ...base,
    name: { zh: "仅中文名称" },
    summary: { zh: "仅中文摘要" },
    domain: { zh: "仅中文领域" },
    categories: [{ code: "1", original: "Very low", meaning: { zh: "仅中文含义" } }],
    originalTerms: [{ term: "DWI", explanation: { zh: "仅中文解释" } }],
  };
  const en = renderDetail([enMissing], new URL("https://example.test/?lang=en&rads=pi-rads"));
  for (const substitution of ["仅中文名称", "仅中文摘要", "仅中文领域", "仅中文含义", "仅中文解释"]) {
    assert.doesNotMatch(en, new RegExp(substitution));
  }
  assert.ok(en.match(/Not verified/g).length >= 5);
});

test("detail navigation exposes focus targets and chooses transition focus", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.match(html, /<a id="detail-nav"[^>]+href="#detail-heading"[^>]+hidden/);
  assert.match(html, /<h2 id="catalog-heading"[^>]+tabindex="-1"/);
  const { chooseNavigationFocus } = await import("../js/app.mjs");
  assert.deepEqual(chooseNavigationFocus("", "pi-rads", "pi-rads"), { target: "detail", radsId: "pi-rads" });
  assert.deepEqual(chooseNavigationFocus("pi-rads", "", "pi-rads"), { target: "result", radsId: "pi-rads" });
  assert.deepEqual(chooseNavigationFocus("pi-rads", "", ""), { target: "catalog", radsId: "" });
  assert.equal(chooseNavigationFocus("pi-rads", "pi-rads", "pi-rads"), null);
});

test("record content is escaped instead of interpreted as markup", async () => {
  const { renderCatalog, renderDetail } = await import("../js/app.mjs");
  const records = JSON.parse(await readFile(new URL("data/rads.json", root), "utf8"));
  records[0].name.zh = '<img src=x onerror="alert(1)">';
  records[0].officialUrl = 'javascript:alert(1)';
  const url = new URL("https://example.test/?rads=bi-rads");
  assert.doesNotMatch(renderCatalog(records, url), /<img/);
  assert.match(renderDetail(records, url), /&lt;img/);
  assert.doesNotMatch(renderDetail(records, url), /href="javascript:/);
});

test("detail uses localized missing-data fallbacks and ends with its professional notice", async () => {
  const { renderDetail } = await import("../js/app.mjs");
  const records = JSON.parse(await readFile(new URL("data/rads.json", root), "utf8"));
  const incomplete = {
    ...records.find(({ id }) => id === "pi-rads"),
    organization: "",
    status: "",
    version: null,
    domain: {},
    modalities: [],
    categoryRange: "",
    categories: [],
    originalTerms: [],
    officialUrl: null,
    related: [],
    lastVerified: null,
  };
  const zh = renderDetail([incomplete], new URL("https://example.test/?rads=pi-rads"));
  assert.ok(zh.match(/尚未核对/g).length >= 9);
  assert.ok(zh.indexOf('class="detail-sidebar"') < zh.indexOf('class="notice"'));
  const en = renderDetail([incomplete], new URL("https://example.test/?lang=en&rads=pi-rads"));
  assert.ok(en.match(/Not verified/g).length >= 9);
});

test("detail metadata precedes the clinical overview and category content in source order", async () => {
  const { renderDetail } = await import("../js/app.mjs");
  const records = JSON.parse(await readFile(new URL("data/rads.json", root), "utf8"));
  const html = renderDetail(records, new URL("https://example.test/?rads=pi-rads"));
  const overview = html.indexOf("临床概览");
  const categories = html.indexOf("评分分级");
  for (const metadata of ["机构", "正式发布", "当前版本", "适用领域", "影像模态", "分级范围"]) {
    assert.ok(html.indexOf(metadata) < overview, `${metadata} should precede the overview`);
  }
  assert.ok(overview < categories);
});

test("failure rendering remains localized for a changed URL state", async () => {
  const { renderLoadFailure } = await import("../js/app.mjs");
  assert.match(renderLoadFailure(new URL("https://example.test/?query=mri")), /目录暂时无法载入/);
  assert.match(renderLoadFailure(new URL("https://example.test/?query=mri&lang=en")), /could not be loaded/);
});

test("shell accessibility labels are wired for both languages", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  for (const key of ["wordmarkLabel", "primaryNavigationLabel", "heroNoteLabel", "resultsRegionLabel"]) {
    assert.match(html, new RegExp(`data-i18n-aria-label=["']${key}["']`));
  }
});
