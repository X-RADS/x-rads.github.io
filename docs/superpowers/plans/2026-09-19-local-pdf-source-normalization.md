# X-RADS Local PDF Source Normalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public RADS catalog from the local PDF inventory, expose source links by modality and version, remove unsupported entries, and split distinct Bone-RADS frameworks.

**Architecture:** Keep `data/rads.json` as the public catalog source, but replace record-level source ambiguity with a `sources` array, `primarySourceId`, and optional `detailSourceId`. Store the private PDF-to-source crosswalk outside the Git repository under `content-workbench/`; the public site renders only bibliographic metadata and HTTPS external links.

**Tech Stack:** Static JSON, native ES modules, CSS, Node.js built-in test runner, Poppler PDF text extraction for local source verification.

**Spec:** `docs/superpowers/specs/2026-09-19-local-pdf-source-normalization-design.md`

## Global Constraints

- Treat `materials-local/articles/RADS/RADS/` as the catalog inclusion authority; retain only entries with a local original PDF.
- Keep original PDFs, local filenames, absolute paths, source manifest, and copyrighted source text outside `repos/x-rads.github.io/`.
- Every public source link must be an HTTPS DOI, journal, society, or institution page that identifies its exact guide version and modality.
- Do not infer category thresholds, clinical recommendations, or cross-modality equivalence; render source-only records when the local article was not transcribed into verified teaching detail.
- Preserve bilingual content, URL-state navigation, escaped rendering, accessibility labels, and the no-build GitHub Pages deployment model.
- Do not push; keep unrelated changes untouched and commit only task-scoped files.

## Review Focus

- A record lists CT, MRI, and US but one modality lacks a corresponding `sources` item; tests must reject it.
- A detail category table belongs to one source version but `detailSourceId` is omitted or points to another version; tests must reject it.
- A `sources` link is duplicated across distinct modality-specific documents; tests must retain both independently identified sources rather than flattening them.
- A removed ID survives in `related`, navigation, or expected-catalog assertions; tests must reject unresolved relations and deleted IDs.
- Public files accidentally contain a private PDF name or `materials-local` path; repository-content checks must reject it.

---

### Task 1: Create the private local-PDF crosswalk

**Files:**
- Create: `C:/Users/SunsServer/Project/X-RADS/content-workbench/rads-local-source-manifest.json`
- Verify: `C:/Users/SunsServer/Project/X-RADS/materials-local/articles/RADS/RADS/*.pdf`

**Interfaces:**
- Consumes: local PDF filenames, first-page titles, DOI/version text, and the proposed public record/source IDs.
- Produces: a private JSON array of `{ recordId, sourceId, pdfRelativePath, title, modalities, version, officialUrl, verificationStatus }` objects.

- [ ] **Step 1: Record the fixed inventory decisions**

Create one manifest object for every guide PDF, excluding `综述-RADS.pdf`. Map `ACR-LI-RADS.pdf` to `li-rads` / `ct-mri-v2018` and `ACR-PI-RADS.pdf` to `pi-rads` / `v2-1`. Mark `bi-rads`, `kwak-ti-rads`, `pe-rads`, and `tbi-rads` as `excludedNoLocalPdf` in a separate `excludedWebsiteIds` array.

- [ ] **Step 2: Record deliberate multi-source mappings**

Use these exact record/source pairs in the manifest:

```json
[
  { "recordId": "node-rads", "sourceId": "ct-mri-2021", "pdfRelativePath": "Non-ACR-Node-RADS-CT_MRI.pdf" },
  { "recordId": "node-rads", "sourceId": "us-2025", "pdfRelativePath": "Non-ACR-Node-RADS-US.pdf" },
  { "recordId": "ni-rads", "sourceId": "mri-2025", "pdfRelativePath": "ACR-NI-RADS-MRI.pdf" },
  { "recordId": "ni-rads", "sourceId": "pet-ct-2018", "pdfRelativePath": "ACR-NI-RADS-PETCT.pdf" },
  { "recordId": "o-rads", "sourceId": "us-2022", "pdfRelativePath": "ACR-O-RADS-US.pdf" },
  { "recordId": "o-rads", "sourceId": "mri-2022", "pdfRelativePath": "ACR-O-RADS-MRI.pdf" },
  { "recordId": "bone-tumor-rads", "sourceId": "acr-2023", "pdfRelativePath": "ACR-Bone-RADS.pdf" },
  { "recordId": "bone-incidental-rads", "sourceId": "ssr-2022", "pdfRelativePath": "Non-ACR-Bone‐RADS.pdf" }
]
```

- [ ] **Step 3: Extract and cross-check source identity**

For every manifest PDF, use `pdfinfo` plus `pdftotext -f 1 -l 1 -layout` to record its displayed title, version/year, modality scope, and DOI or official page. Require an exact DOI text match when the PDF contains one; otherwise retain an institution/journal page only after the title and version match its first page.

- [ ] **Step 4: Verify private/public separation**

Run:

```powershell
git -C C:/Users/SunsServer/Project/X-RADS/repos/x-rads.github.io ls-files | Select-String -Pattern 'materials-local|content-workbench|\.pdf$|\.docx$'
```

Expected: no output. Confirm the manifest is outside the Git root before continuing.

### Task 2: Define the source-aware public data contract with failing tests

**Files:**
- Modify: `tests/data.test.mjs`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: public records with `sources`, `primarySourceId`, and optional `detailSourceId`.
- Produces: test-enforced source identity, modality coverage, source-detail binding, the 53-record inventory, and split Bone-RADS IDs.

- [ ] **Step 1: Write failing catalog-contract tests**

Replace the current single-`officialUrl` expectations with a helper:

```js
const sourceById = (record, sourceId) => record.sources.find((source) => source.id === sourceId);
```

Assert every record has a non-empty `sources` array, unique source IDs, an existing `primarySourceId`, and only `https://` source URLs. Assert each source has at least one modality and every source modality exists in `record.modalities`.

- [ ] **Step 2: Add exact inventory and split-framework assertions**

Assert 53 unique IDs; assert the absence of `bi-rads`, `kwak-ti-rads`, `pe-rads`, `tbi-rads`, and `bone-rads`; assert the presence of `bone-tumor-rads` and `bone-incidental-rads`. Assert their names, modality sets, source IDs, and mutual related links differ.

- [ ] **Step 3: Add multi-source and content-binding assertions**

Assert Node-RADS owns `ct-mri-2021` (`CT`, `MRI`) and `us-2025` (`US`), NI-RADS owns MRI and PET/CT sources, and O-RADS owns US and MRI sources. Assert all records with category/term text have a valid `detailSourceId`; assert O-RADS details bind to `us-2022` and LI-RADS details bind to `ct-mri-v2018`.

- [ ] **Step 4: Run the focused tests and confirm the pre-change failure**

Run:

```powershell
node --test tests/data.test.mjs tests/site.test.mjs
```

Expected: FAIL because current records do not have `sources`, their inventory is 56, and the old `bone-rads` still exists.

### Task 3: Normalize the public catalog from the verified local source manifest

**Files:**
- Modify: `data/rads.json`

**Interfaces:**
- Consumes: the private manifest from Task 1 and the contract tests from Task 2.
- Produces: 53 public records using `sources`, `primarySourceId`, and `detailSourceId` where appropriate.

- [ ] **Step 1: Apply the source shape to every retained record**

For each retained record, replace the record-level `officialUrl` with `sources` entries copied from its verified manifest row and set `primarySourceId`. Use an original-publication DOI when present in the local PDF; otherwise use the matching ACR, journal, publisher, or society page. Do not include `pdfRelativePath` in `data/rads.json`.

- [ ] **Step 2: Remove unsupported entries and reconcile references**

Delete the four unsupported records. Remove their IDs from every `related` array and retain only references resolving to the new 53-record set.

- [ ] **Step 3: Split Bone-RADS into two clinically distinct records**

Replace `bone-rads` with `bone-tumor-rads` using the ACR 2023 article and `bone-incidental-rads` using the SSR 2022 CT/MRI article. Preserve the existing 0–4 risk-score educational table only on `bone-tumor-rads` with `detailSourceId: "acr-2023"`; make the incidental-lesion record source-only until its CT/MRI algorithm is transcribed and independently checked.

- [ ] **Step 4: Scope existing detailed records to their source versions**

Set `detailSourceId` for every record with categories or original terms. Preserve O-RADS US category text only on `us-2022`; add the MRI source as a distinct source item without copying US categories. Retain LI-RADS only for local CT/MRI v2018 and remove unbacked US 2024 coverage; bind PI-RADS detail text to `v2-1`.

- [ ] **Step 5: Resolve source discrepancies from the local PDF text**

Use the manifest evidence to make Soft Tissue-RADS link to the source that matches the local accepted manuscript or document its final-version replacement; make C-TIRADS distinguish its 2020 English source from any separately supported 2021 Chinese guideline; retain GI-RADS only after verifying its publisher DOI against the PDF title and citation.

- [ ] **Step 6: Run the data contract tests**

Run:

```powershell
node --test tests/data.test.mjs
```

Expected: PASS with 53 records, valid source mappings, no dangling related IDs, and no detail text without a source binding.

### Task 4: Render source lists and source-scoped detail explanations

**Files:**
- Modify: `js/app.mjs`
- Modify: `assets/styles.css`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: `record.sources`, `record.primarySourceId`, and optional `record.detailSourceId`.
- Produces: localized detail HTML that lists each external source by modality/version and identifies the source for detailed categories.

- [ ] **Step 1: Write failing rendering tests**

Add fixtures for Node-RADS and O-RADS. Assert Node-RADS renders two separately labeled external links, one for `CT, MRI` and one for `US`; assert O-RADS renders US and MRI sources while the category section states that its explanation applies to US v2022. Assert rendered source URLs accept only `http`/`https` through the existing `safeHttpUrl` guard.

- [ ] **Step 2: Implement source lookup and localized labels**

Add `getSourceById(record, sourceId)` and localized strings for “Primary sources and applicable modalities” and “The explanations below apply to”. Build source-list markup from `record.sources`, escaping title, version, and modalities before interpolating them into HTML.

- [ ] **Step 3: Replace the single-source detail panel**

In `renderDetail`, render a source list in the sidebar instead of the former one-link source card. When `detailSourceId` resolves, render its title, version, and modality label immediately before categories and original terms. If it does not resolve, return source-only detail content rather than a category table.

- [ ] **Step 4: Style the new content without changing layout hierarchy**

Add scoped source-list styles in `assets/styles.css`: readable multi-line entries, visible external links, compact modality/version metadata, and a visually distinct detail-source note. Preserve mobile wrapping, contrast, and keyboard focus styles.

- [ ] **Step 5: Run focused site tests**

Run:

```powershell
node --test tests/site.test.mjs
```

Expected: PASS, including existing URL-state, localization, escaping, and accessibility checks plus the new multi-source assertions.

### Task 5: Update maintenance documentation and perform final verification

**Files:**
- Modify: `README.md`
- Modify: `WORKSPACE.md` outside the Git root
- Modify: `docs/superpowers/plans/2026-09-19-local-pdf-source-normalization.md`

**Interfaces:**
- Consumes: the finalized 53-record catalog and private source-manifest location.
- Produces: public maintenance guidance describing source arrays and private handoff guidance describing the local-PDF admission policy.

- [ ] **Step 1: Update public documentation**

Change the README catalog total to 53. Document that `sources` contains per-modality/version public links, `primarySourceId` identifies the primary source, and `detailSourceId` identifies the evidence for any rendered category text. State that local PDFs and the local manifest remain outside the public repository.

- [ ] **Step 2: Update local handoff documentation**

Update outer `WORKSPACE.md` with the 57-PDF inventory basis, 53 public records, 4 excluded unsupported records, two Bone-RADS frameworks, and the private manifest location. Do not put manifest content into the public README.

- [ ] **Step 3: Run content-boundary and full tests**

Run:

```powershell
git -C C:/Users/SunsServer/Project/X-RADS/repos/x-rads.github.io ls-files | Select-String -Pattern 'materials-local|content-workbench|\.pdf$|\.docx$'
node --test tests/*.test.mjs
```

Expected: the first command has no output and the test suite passes with zero failures.

- [ ] **Step 4: Preview representative detail pages**

Run `python -m http.server 8000` from the website Git root. In Chinese and English, inspect Node-RADS, O-RADS, both Bone-RADS records, LI-RADS, and PI-RADS. Confirm each visible source link, modality label, category-source note, and back navigation is correct.

- [ ] **Step 5: Commit scoped changes without pushing**

Run:

```powershell
git -C C:/Users/SunsServer/Project/X-RADS/repos/x-rads.github.io add -- data/rads.json js/app.mjs assets/styles.css tests/data.test.mjs tests/site.test.mjs README.md docs/superpowers/plans/2026-09-19-local-pdf-source-normalization.md
git -C C:/Users/SunsServer/Project/X-RADS/repos/x-rads.github.io commit -m "feat: normalize RADS sources by modality"
```

Do not stage `WORKSPACE.md` or the private source manifest, because neither is inside the public repository. Do not push.
