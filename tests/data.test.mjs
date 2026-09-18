import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const records = JSON.parse(
  await readFile(new URL("../data/rads.json", import.meta.url), "utf8"),
);

const expectedIds = [
  "a-rads",
  "aem-rads",
  "apendic-rads",
  "ax-rads",
  "bi-rads",
  "bt-rads",
  "bone-rads",
  "bti-rads",
  "cac-drs",
  "cad-rads",
  "c-rads",
  "c-lung-rads",
  "c-ti-rads",
  "cln-rads",
  "co-rads",
  "co-x-rads",
  "covid-rads",
  "eu-ti-rads",
  "fap-rads",
  "gb-rads",
  "gi-rads",
  "ild-rads",
  "ilf-rads",
  "k-ti-rads",
  "ki-rads",
  "kwak-ti-rads",
  "li-rads",
  "ln-rads",
  "lu-rads",
  "lung-rads",
  "met-rads",
  "mi-rads",
  "moi-rads",
  "mski-rads",
  "my-rads",
  "ni-rads",
  "node-rads",
  "ns-rads",
  "onco-rads",
  "o-rads",
  "or-rads",
  "ot-rads",
  "pi-rads",
  "plaque-rads",
  "psma-rads",
  "pe-rads",
  "ri-rads",
  "st-rads",
  "sstr-rads",
  "su-rads",
  "ti-rads",
  "tbi-rads",
  "vi-rads",
  "vp-rads",
  "ae-rads",
  "info-rads",
];

const expectedNewRecords = {
  "ae-rads": { status: "non-acr", officialUrl: "https://doi.org/10.1186/s12880-025-01670-9" },
  "bt-rads": { status: "in-development", officialUrl: "https://btrads.com/publications/" },
  "c-lung-rads": { status: "non-acr", officialUrl: "https://doi.org/10.1038/s41591-024-03211-3" },
  "c-ti-rads": { status: "non-acr", officialUrl: "https://doi.org/10.3760/cma.j.cn131148-20210205-00092" },
  "info-rads": { status: "non-acr", officialUrl: "https://doi.org/10.1016/j.jacr.2020.09.049" },
  "ki-rads": { status: "in-development", officialUrl: "https://doi.org/10.1148/radiol.240308" },
  "moi-rads": { status: "non-acr", officialUrl: "https://doi.org/10.1007/s00256-020-03601-x" },
  "pe-rads": { status: "released", officialUrl: "https://doi.org/10.1016/j.chest.2026.06.006" },
  "ri-rads": { status: "non-acr", officialUrl: "https://doi.org/10.1016/j.ejrad.2019.108661", categoryRange: "RI-RADS A–D, X" },
  "st-rads": { status: "works-in-progress", officialUrl: "https://doi.org/10.1007/s00256-026-05134-1" },
  "tbi-rads": { status: "in-development", officialUrl: "https://doi.org/10.18885/CI.0000000841" },
  "vi-rads": { status: "released", officialUrl: "https://doi.org/10.1016/j.eururo.2018.04.029" },
};

const nonAcrIds = new Set([
  "a-rads", "aem-rads", "apendic-rads", "ax-rads", "bti-rads", "cac-drs", "cad-rads", "cln-rads", "co-rads", "co-x-rads", "covid-rads", "eu-ti-rads", "fap-rads", "gb-rads", "gi-rads", "ild-rads", "ilf-rads", "k-ti-rads", "kwak-ti-rads", "ln-rads", "lu-rads", "met-rads", "mi-rads", "mski-rads", "my-rads", "node-rads", "ns-rads", "onco-rads", "or-rads", "ot-rads", "plaque-rads", "psma-rads", "sstr-rads", "su-rads", "vp-rads",
]);

const expectedVersions = {
  "bi-rads": "v2025",
  "bone-rads": "Bone-RADS v2023",
  "c-rads": "C-RADS v2023",
  "li-rads": "CT/MRI v2018; US Surveillance and TRA v2024",
  "lung-rads": "v2022",
  "ni-rads": "NI-RADS MRI v2025; PET/CT 2018",
  "o-rads": "US v2022",
  "pi-rads": "v2.1",
  "ti-rads": "ACR TI-RADS 2017",
};

const expectedStatuses = {
  "bone-rads": "works-in-progress",
  "bi-rads": "released",
  "c-rads": "released",
  "li-rads": "released",
  "lung-rads": "released",
  "ni-rads": "released",
  "o-rads": "released",
  "pi-rads": "released",
  "ti-rads": "released",
  "bt-rads": "in-development",
  "ki-rads": "in-development",
  "pe-rads": "released",
  "st-rads": "works-in-progress",
  "tbi-rads": "in-development",
  "vi-rads": "released",
};

const expectedVerificationDates = {
  "bi-rads": "2026-09-16",
  "bone-rads": "2026-09-18",
  "c-rads": "2026-09-18",
  "li-rads": "2026-09-16",
  "lung-rads": "2026-09-16",
  "ni-rads": "2026-09-18",
  "o-rads": "2026-09-16",
  "pi-rads": "2026-09-16",
  "ti-rads": "2026-09-16",
};

test("catalog includes the published table-2 systems without duplicating Bone-RADS", () => {
  assert.deepEqual(records.map(({ id }) => id).sort(), [...expectedIds].sort());
  assert.equal(records.filter(({ id }) => id === "bone-rads").length, 1);
  assert.deepEqual(Object.fromEntries(records.filter(({ status }) => status !== "non-acr").map(({ id, status }) => [id, status])), expectedStatuses);
  assert.deepEqual(records.filter(({ id }) => nonAcrIds.has(id)).map(({ id }) => id).sort(), [...nonAcrIds].sort());
  assert.ok(records.filter(({ id }) => nonAcrIds.has(id)).every(({ status }) => status === "non-acr"));
});

test("catalog records the source-verified status and primary source for the newly added systems", () => {
  for (const [id, expected] of Object.entries(expectedNewRecords)) {
    const record = records.find((item) => item.id === id);
    assert.ok(record, `${id} is missing`);
    assert.equal(record.status, expected.status, `${id} status`);
    assert.equal(record.officialUrl, expected.officialUrl, `${id} primary source`);
    if (expected.categoryRange) assert.equal(record.categoryRange, expected.categoryRange, `${id} category range`);
  }
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
    assert.ok(Array.isArray(record.categories));
    assert.ok(record.categories.every((item) => item.code && item.original && item.meaning?.zh && item.meaning?.en));
    assert.ok(record.originalTerms.every((item) => item.term && item.explanation?.zh && item.explanation?.en));
    if (expectedNewRecords[record.id]) {
      assert.equal(record.status, expectedNewRecords[record.id].status);
      assert.equal(record.officialUrl, expectedNewRecords[record.id].officialUrl);
    } else if (nonAcrIds.has(record.id)) {
      assert.match(record.version, /^Published \d{4}$/);
      assert.match(record.officialUrl, /^https:\/\/doi\.org\//);
      assert.equal(record.lastVerified, "2026-09-18");
    } else {
      assert.equal(record.version, expectedVersions[record.id]);
      assert.match(record.officialUrl, /^https:\/\/www\.acr\.org\//);
      assert.equal(record.lastVerified, expectedVerificationDates[record.id]);
    }
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
