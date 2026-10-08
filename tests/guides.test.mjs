import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderDetail } from "../js/app.mjs";

const records = JSON.parse(await readFile(new URL("../data/rads.json", import.meta.url), "utf8"));
const expected = {
  "li-rads": ["ct-mri-v2018"], "lung-rads": ["primary"],
  "o-rads": ["us-2022", "mri-2022"], "ti-rads": ["primary"],
  "c-rads": ["primary"], "ni-rads": ["mri-2025", "pet-ct-2018"],
  "bone-tumor-rads": ["acr-2023"],
};

test("seven requested systems have nine separately source-bound bilingual scoring guides", () => {
  for (const [id, sourceIds] of Object.entries(expected)) {
    const record = records.find(r => r.id === id);
    assert.deepEqual(record.detailedGuides?.map(g => g.sourceId), sourceIds, id);
    for (const guide of record.detailedGuides) {
      assert.ok(record.sources.some(s => s.id === guide.sourceId));
      assert.ok(guide.examinations.length && guide.tables.length && guide.scoringRules.steps.length && guide.management.length && guide.cautions.length);
      for (const lang of ["zh", "en"]) {
        for (const value of [guide.title, guide.scope, guide.sourcePages, ...guide.scoringRules.steps, ...guide.management, ...guide.cautions,
          ...guide.examinations.map(e => e.purpose)]) assert.ok(value[lang]?.trim(), `${id}/${guide.sourceId}/${lang}`);
        for (const table of guide.tables) {
          assert.ok(table.title[lang] && table.columns[lang].length);
          for (const row of table.rows) {
            assert.equal(row[lang].length, table.columns[lang].length);
            assert.ok(row[lang].every(cell => typeof cell === "string" && cell.trim()));
          }
        }
      }
    }
  }
  assert.equal(records.filter(r => r.detailedGuides).length, 52);
  assert.equal(records.find(r => r.id === "pi-rads").detailedGuide.sourceId, "v2-1");
});

test("guides preserve clinically important thresholds and exception branches", () => {
  const text = id => JSON.stringify(records.find(r => r.id === id).detailedGuides);
  for (const value of ["10–19", "≥50%", "≤6", "LR-4", "LR-5", "gadoxetate"]) assert.ok(text("li-rads").includes(value), value);
  for (const value of ["<4", "≥4", ">1.5", "4B", "4X", "12", "airway"]) assert.ok(text("lung-rads").includes(value), value);
  for (const value of ["≥10", "≥4", "CS 3–4", "30–40", "T2 dark/DWI dark", "myometrium"]) assert.ok(text("o-rads").includes(value), value);
  for (const value of ["2.5", "1.5", "1.0", "0.5", "≥7", "20%", "2 mm"]) assert.ok(text("ti-rads").includes(value), value);
  for (const value of ["C2a", "C2b", "6–9", "≥30", "E1/E2", "E0"]) assert.ok(text("c-rads").includes(value), value);
  for (const value of ["2a", "2b", "perineural", "discordance", "FDG"]) assert.ok(text("ni-rads").includes(value), value);
  for (const value of ["1–2", "3–4", "5–6", "≥7", "1/3", "2/3", "Primary cancer", "SSR"]) assert.ok(text("bone-tumor-rads").includes(value), value);
});

test("all nine guides render complete tables, page references and distinct headings in both languages", () => {
  for (const id of Object.keys(expected)) for (const lang of ["zh", "en"]) {
    const html = renderDetail(records, new URL(`https://example.test/?rads=${id}&lang=${lang}`));
    const guides = records.find(r => r.id === id).detailedGuides;
    assert.ok(guides?.length, id);
    for (const guide of guides) {
      assert.ok(html.includes(guide.title[lang]));
      assert.ok(html.includes(guide.sourcePages[lang]));
      for (const table of guide.tables) assert.ok(html.includes(table.title[lang]));
    }
    assert.match(html, /class="guide-table-scroll"/);
    assert.match(html, /<caption>/);
    const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
    assert.equal(ids.length, new Set(ids).size);
    assert.doesNotMatch(html, /materials-local|undefined/);
  }
});

test("guide table cells are escaped and a guide with an unresolved source is omitted", () => {
  const record = structuredClone(records.find(r => r.id === "li-rads"));
  assert.ok(record.detailedGuides);
  record.detailedGuides[0].tables[0].rows[0].zh[0] = '<img src=x onerror="alert(1)">';
  const html = renderDetail([record], new URL("https://example.test/?rads=li-rads"));
  assert.ok(html.includes("&lt;img"));
  assert.doesNotMatch(html, /<img/);
  record.detailedGuides[0].sourceId = "missing-source";
  assert.ok(!renderDetail([record], new URL("https://example.test/?rads=li-rads")).includes(record.detailedGuides[0].title.zh));
});

test("source footnotes retain small-cyst, PET timing and unassessable-region exceptions", () => {
  const lung = records.find(r => r.id === "lung-rads").detailedGuides[0];
  assert.ok(JSON.stringify(lung.management).includes("most recent LDCT"));
  const us = records.find(r => r.id === "o-rads").detailedGuides[0];
  assert.ok(JSON.stringify(us.management).includes("bilocular ≤3 cm"));
  const mri = records.find(r => r.id === "ni-rads").detailedGuides[0];
  for (const marker of ["P-unknown primary", "P-x", "N-x"]) assert.ok(JSON.stringify(mri.tables).includes(marker));
  assert.ok(mri.scope.en.includes("not during treatment"));
  assert.ok(JSON.stringify(mri.tables).includes("otherwise unassessable"));
  const neck = records.find(r => r.id === "ni-rads");
  assert.ok(neck.modalities.includes("CT"));
  assert.deepEqual(neck.sources.find(s => s.id === "pet-ct-2018").modalities, ["CT", "PET/CT"]);
});
