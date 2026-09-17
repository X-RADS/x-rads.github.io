import assert from "node:assert/strict";
import test from "node:test";
import {
  getRecordById,
  localizeRecord,
  normalizeText,
  readState,
  searchAndFilter,
  writeState,
} from "../js/catalog.mjs";

const records = [
  {
    id: "pi-rads",
    acronym: "PI-RADS",
    name: { zh: "前列腺影像报告和数据系统", en: "Prostate Imaging Reporting and Data System" },
    summary: { zh: "前列腺 MRI 风险分层", en: "Prostate MRI risk stratification" },
    organization: "ACR / ESUR / AdMeTech Foundation",
    status: "released",
    anatomy: "pelvis",
    domain: { zh: "前列腺癌", en: "Prostate cancer" },
    modalities: ["MRI"],
    version: "v2.1",
    releaseDate: "2019",
    categoryRange: "1–5",
    categories: [{ code: "1", original: "Very low", meaning: { zh: "极低", en: "Very low" } }],
    originalTerms: [],
    officialUrl: "https://www.acr.org/example",
    lastVerified: "2026-09-16",
    related: [],
  },
];

test("normalizes modality text with locale-independent lowercase", () => {
  assert.equal(normalizeText("MRI"), "mri");
});

test("search matches acronym, Chinese name, English name, and modality", () => {
  for (const query of ["PI-RADS", "前列腺", "Prostate", "MRI"]) {
    assert.equal(searchAndFilter(records, { query, anatomy: "", modality: "", status: "" }).length, 1);
  }
});

test("filters combine with AND semantics", () => {
  assert.equal(searchAndFilter(records, { query: "prostate", anatomy: "pelvis", modality: "MRI", status: "released" }).length, 1);
  assert.equal(searchAndFilter(records, { query: "prostate", anatomy: "chest", modality: "MRI", status: "released" }).length, 0);
});

test("localization preserves original English fields", () => {
  const item = localizeRecord(records[0], "zh");
  assert.equal(item.displayName, "前列腺影像报告和数据系统");
  assert.equal(item.englishName, "Prostate Imaging Reporting and Data System");
  assert.equal(item.categories[0].original, "Very low");
});

test("localization leaves missing requested-language display fields empty", () => {
  const partial = {
    ...records[0],
    name: { en: "English name only" },
    summary: { en: "English summary only" },
    domain: { en: "English domain only" },
    categories: [{ code: "1", original: "Very low", meaning: { en: "English meaning only" } }],
    originalTerms: [{ term: "DWI", explanation: { en: "English explanation only" } }],
  };
  const item = localizeRecord(partial, "zh");
  assert.equal(item.displayName, "");
  assert.equal(item.englishName, "English name only");
  assert.equal(item.displaySummary, "");
  assert.equal(item.displayDomain, "");
  assert.equal(item.categories[0].displayMeaning, "");
  assert.equal(item.originalTerms[0].displayExplanation, "");
});

test("English localization does not substitute Chinese display fields", () => {
  const partial = {
    ...records[0],
    name: { zh: "仅中文名称" },
    summary: { zh: "仅中文摘要" },
    domain: { zh: "仅中文领域" },
    categories: [{ code: "1", original: "Very low", meaning: { zh: "仅中文含义" } }],
    originalTerms: [{ term: "DWI", explanation: { zh: "仅中文解释" } }],
  };
  const item = localizeRecord(partial, "en");
  assert.equal(item.displayName, "");
  assert.equal(item.displaySummary, "");
  assert.equal(item.displayDomain, "");
  assert.equal(item.categories[0].displayMeaning, "");
  assert.equal(item.originalTerms[0].displayExplanation, "");
});

test("lookup returns null for an unknown identifier", () => {
  assert.equal(getRecordById(records, "unknown"), null);
});

test("URL state defaults to Chinese and preserves existing filters", () => {
  const initial = readState(new URL("https://example.test/?query=mri&modality=MRI"));
  assert.deepEqual(initial, { lang: "zh", query: "mri", anatomy: "", modality: "MRI", status: "", rads: "" });
  const next = writeState(new URL("https://example.test/?query=mri"), { lang: "en", rads: "pi-rads" });
  assert.equal(next.searchParams.get("query"), "mri");
  assert.equal(next.searchParams.get("lang"), "en");
  assert.equal(next.searchParams.get("rads"), "pi-rads");
});
