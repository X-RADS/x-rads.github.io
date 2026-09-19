import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const records = JSON.parse(await readFile(new URL("../data/rads.json", import.meta.url), "utf8"));
const sourceById = (record, sourceId) => record.sources.find((source) => source.id === sourceId);

test("catalog admits only local-PDF-supported systems and separates Bone-RADS frameworks", () => {
  const ids = records.map(({ id }) => id);
  assert.equal(new Set(ids).size, 53);
  for (const id of ["bi-rads", "kwak-ti-rads", "pe-rads", "tbi-rads", "bone-rads"]) assert.ok(!ids.includes(id));
  for (const id of ["bone-tumor-rads", "bone-incidental-rads", "li-rads", "pi-rads"]) assert.ok(ids.includes(id));
  const tumor = records.find(({ id }) => id === "bone-tumor-rads");
  const incidental = records.find(({ id }) => id === "bone-incidental-rads");
  assert.deepEqual(tumor.modalities, ["Radiography"]);
  assert.deepEqual(incidental.modalities, ["CT", "MRI"]);
  assert.ok(tumor.related.includes("bone-incidental-rads"));
  assert.ok(incidental.related.includes("bone-tumor-rads"));
});

test("every public record has modality-specific sources and source-bound teaching content", () => {
  for (const record of records) {
    assert.ok(Array.isArray(record.sources) && record.sources.length, `${record.id} sources`);
    assert.ok(sourceById(record, record.primarySourceId), `${record.id} primary source`);
    assert.equal(new Set(record.sources.map(({ id }) => id)).size, record.sources.length, `${record.id} source IDs`);
    for (const source of record.sources) {
      assert.ok(source.modalities.length, `${record.id}/${source.id} modalities`);
      assert.ok(source.modalities.every((modality) => record.modalities.includes(modality)), `${record.id}/${source.id} modality scope`);
      assert.match(source.officialUrl, /^https:\/\//, `${record.id}/${source.id} URL`);
    }
    if (record.categories.length || record.originalTerms.length) assert.ok(sourceById(record, record.detailSourceId), `${record.id} detail source`);
  }
});

test("multi-modality records keep distinct source identities", () => {
  const node = records.find(({ id }) => id === "node-rads");
  assert.deepEqual(sourceById(node, "ct-mri-2021").modalities, ["CT", "MRI"]);
  assert.deepEqual(sourceById(node, "us-2025").modalities, ["US"]);
  assert.notEqual(sourceById(node, "ct-mri-2021").officialUrl, sourceById(node, "us-2025").officialUrl);
  const oRads = records.find(({ id }) => id === "o-rads");
  assert.ok(sourceById(oRads, "us-2022"));
  assert.ok(sourceById(oRads, "mri-2022"));
  assert.equal(oRads.detailSourceId, "us-2022");
});

test("related RADS identifiers resolve", () => {
  const ids = new Set(records.map(({ id }) => id));
  for (const record of records) for (const id of record.related) assert.ok(ids.has(id), `${record.id} -> ${id}`);
});
