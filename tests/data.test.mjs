import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const records = JSON.parse(
  await readFile(new URL("../data/rads.json", import.meta.url), "utf8"),
);

const expectedIds = [
  "bi-rads",
  "li-rads",
  "lung-rads",
  "o-rads",
  "pi-rads",
  "ti-rads",
];

const expectedVersions = {
  "bi-rads": "v2025",
  "li-rads": "CT/MRI v2018; US Surveillance and TRA v2024",
  "lung-rads": "v2022",
  "o-rads": "US v2022",
  "pi-rads": "v2.1",
  "ti-rads": "ACR TI-RADS 2017",
};

test("Demo contains the six approved RADS entries", () => {
  assert.deepEqual(records.map(({ id }) => id).sort(), expectedIds);
});

test("every record has complete bilingual and source metadata", () => {
  for (const record of records) {
    assert.match(record.id, /^[a-z0-9-]+$/);
    assert.ok(record.acronym);
    assert.ok(record.name.zh && record.name.en);
    assert.ok(record.summary.zh && record.summary.en);
    assert.ok(record.domain.zh && record.domain.en);
    assert.ok(record.modalities.length > 0);
    assert.ok(record.version);
    assert.ok(record.categoryRange);
    assert.ok(record.categories.length > 0);
    assert.ok(record.categories.every((item) => item.code && item.original && item.meaning?.zh && item.meaning?.en));
    assert.ok(record.originalTerms.every((item) => item.term && item.explanation?.zh && item.explanation?.en));
    assert.equal(record.version, expectedVersions[record.id]);
    assert.match(record.officialUrl, /^https:\/\/www\.acr\.org\//);
    assert.equal(record.lastVerified, "2026-09-16");
  }
});

test("related RADS identifiers resolve", () => {
  const ids = new Set(records.map(({ id }) => id));
  for (const record of records) {
    for (const relatedId of record.related) assert.ok(ids.has(relatedId));
  }
});

test("LI-RADS LR-M preserves the original malignancy qualifier", () => {
  const record = records.find(({ id }) => id === "li-rads");
  const category = record.categories.find(({ code }) => code === "LR-M");
  assert.equal(
    category.original,
    "Probably or definitely malignant, not HCC specific",
  );
});
