# Non-ACR RADS Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the 35 unique, published non-ACR RADS frameworks in Word table 2 to the X-RADS catalog, without duplicating the existing Bone-RADS record.

**Architecture:** Keep the static JSON catalog as the single content source. Non-ACR entries use the existing `non-acr` status, retain the table's domain, modality, category range and bilingual entry overview, and link only to a primary society page, publisher landing page, or DOI. The data contract distinguishes ACR-hosted sources from non-ACR primary sources without representing source status as clinical validation.

**Tech Stack:** Static JSON, native ES modules, Node.js built-in test runner.

**Spec:** User-confirmed table-2 design in this task: include all 35 unique new entries; retain Bone-RADS as an existing ACR works-in-progress entry; preserve source-faithful, non-prescriptive clinical text.

## Global Constraints

- Do not add the local Word source document or any restricted material to the public repository.
- Treat `non-acr` as publisher/oversight classification, not a claim of validation or clinical endorsement.
- Use only primary society, publisher, or DOI destinations in `officialUrl`.
- Keep the website bilingual and preserve original English acronyms.
- Do not invent management thresholds or category definitions not verified in the primary source.

---

### Task 1: Establish a source-aware data contract

**Files:**
- Modify: `tests/data.test.mjs`
- Modify: `README.md`

**Interfaces:**
- Consumes: records in `data/rads.json`.
- Produces: an executable rule that ACR records retain ACR URLs and non-ACR records use HTTPS primary publication/society sources.

- [x] **Step 1: Write the failing test**

Assert exactly 44 unique catalog IDs, 35 non-ACR IDs, and source hosts appropriate to each entry status.

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/data.test.mjs`

Expected: FAIL because the new IDs and non-ACR source contract are absent.

- [x] **Step 3: Write minimal implementation**

Update the data-contract expectations and README source policy. Do not weaken required bilingual metadata, HTTPS, or unique-ID checks.

- [x] **Step 4: Run test to verify it passes**

Run: `node --test tests/data.test.mjs`

Expected: PASS after task 2 adds the records.

### Task 2: Add source-verified non-ACR records

**Files:**
- Modify: `data/rads.json`

**Interfaces:**
- Consumes: the data contract from task 1 and published table-2 framework facts.
- Produces: 35 unique `non-acr` records with `id`, bilingual name/summary/domain, organization, anatomy, modalities, publication version/year, category range, source URL, verification date, and empty clinical-detail arrays when the primary source was not parsed into category-level teaching text.

- [x] **Step 1: Add published framework records**

Add these exact IDs: `a-rads`, `aem-rads`, `apendic-rads`, `ax-rads`, `bti-rads`, `cac-drs`, `cad-rads`, `cln-rads`, `co-x-rads`, `co-rads`, `covid-rads`, `eu-ti-rads`, `fap-rads`, `gb-rads`, `gi-rads`, `ild-rads`, `ilf-rads`, `k-ti-rads`, `kwak-ti-rads`, `ln-rads`, `lu-rads`, `met-rads`, `mi-rads`, `mski-rads`, `my-rads`, `node-rads`, `ns-rads`, `onco-rads`, `or-rads`, `ot-rads`, `plaque-rads`, `psma-rads`, `sstr-rads`, `su-rads`, and `vp-rads`.

- [x] **Step 2: Preserve existing Bone-RADS**

Do not add a second `bone-rads` record. Retain its existing `works-in-progress` status and ACR source.

- [x] **Step 3: Run data tests**

Run: `node --test tests/data.test.mjs`

Expected: PASS with 44 records and all related IDs resolving.

### Task 3: Verify catalog discoverability

**Files:**
- Modify: `js/app.mjs`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: non-ACR record anatomy and status values.
- Produces: regional anatomy navigation and localized status labels that return the published non-ACR records.

- [x] **Step 1: Write failing rendering/filter tests**

Assert a known non-ACR item is returned by its anatomy region, status filtering, and Chinese/English card rendering.

- [x] **Step 2: Run test to verify it fails**

Run: `node --test tests/site.test.mjs`

Expected: FAIL if its anatomy value is omitted from the matching region.

- [x] **Step 3: Write minimal implementation**

Extend `anatomyGroups` only for the anatomy values introduced by task 2. Retain the existing localized `non-acr` status label.

- [x] **Step 4: Run full verification**

Run: `node --test tests/*.test.mjs`

Expected: all tests pass.

### Task 4: Review published result

**Files:**
- Modify: `README.md`

- [x] **Step 1: Document source and scope policy**

State that non-ACR entries are sourced from the original publication or issuing society and that inclusion is not a clinical validation claim.

- [x] **Step 2: Perform static preview review**

Run the existing local preview and inspect a non-ACR list card and detail page in Chinese and English.

- [ ] **Step 3: Commit only scoped files**

Commit the catalog, tests, app mapping, README, and this plan after all checks pass.
