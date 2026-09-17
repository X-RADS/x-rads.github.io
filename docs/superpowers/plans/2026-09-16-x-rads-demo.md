# X RADS 双语临床查阅 Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a directly deployable bilingual static Demo where radiologists can search, filter, and inspect six representative RADS entries.

**Architecture:** A single static page loads validated JSON and renders the catalog and detail view in the browser. Pure ES modules keep search, localization, and rendering separate; URL query parameters preserve language, filters, and the selected RADS without requiring a server-side router.

**Tech Stack:** HTML5, CSS3, browser JavaScript ES modules, JSON, Node.js built-in test runner, Python static file server for local preview, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-16-x-rads-demo-design.md`

## Global Constraints

- Use one public repository, intended to become `X-RADS/x-rads.github.io`.
- Use no frontend framework, package manager dependency, database, account system, backend, or build step.
- Default to Chinese and provide a complete English interface.
- Preserve English full names, original category codes, and original terminology in the Chinese interface.
- Do not request, accept, upload, store, or process patient information.
- Do not commit files from `Materials/` to the public repository.
- Include six Demo entries: BI-RADS, LI-RADS, Lung-RADS, O-RADS, PI-RADS, and TI-RADS.
- Mark the site as a professional reference and teaching aid, not a substitute for current official guidance or institutional policy.
- Only use self-authored CSS and layout; do not copy ACR illustrations, manuals, tables, or proprietary atlas content.
- Record `2026-09-16` as the initial human verification date for official links and release labels.

## File Map

- `.gitignore` — exclude local source materials, preview artifacts, and visual brainstorming files.
- `.nojekyll` — tell GitHub Pages to publish the static files unchanged.
- `index.html` — accessible page shell, navigation, filters, catalog container, detail container, and templates.
- `assets/styles.css` — responsive typography, layout, cards, filters, category tables, and mobile behavior.
- `data/rads.json` — six bilingual structured RADS records and source metadata.
- `js/catalog.mjs` — pure normalization, search, filtering, localization, lookup, and URL-state helpers.
- `js/app.mjs` — DOM rendering, event handling, language switching, navigation state, and error states.
- `tests/catalog.test.mjs` — unit tests for search, filters, localization, lookup, and URL state.
- `tests/data.test.mjs` — schema and source-integrity tests for `data/rads.json`.
- `tests/site.test.mjs` — static shell and public-file smoke tests.
- `README.md` — scope, local preview, test, maintenance, copyright, and GitHub Pages instructions.

---

### Task 1: Create the static shell and repository hygiene

**Files:**
- Create: `.gitignore`
- Create: `.nojekyll`
- Create: `index.html`
- Create: `assets/styles.css`
- Create: `tests/site.test.mjs`

**Interfaces:**
- Consumes: none.
- Produces: DOM IDs `language-switcher`, `search-input`, `anatomy-filter`, `modality-filter`, `status-filter`, `catalog-results`, `detail-view`, and `page-status`; module entry point `js/app.mjs`.

- [ ] **Step 1: Write the failing static-shell test**

```javascript
// tests/site.test.mjs
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

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
```

- [ ] **Step 2: Run the test and confirm the missing shell fails**

Run: `node --test tests/site.test.mjs`

Expected: FAIL because `index.html` and `.nojekyll` do not exist.

- [ ] **Step 3: Add repository exclusions**

Create `.gitignore` with exactly:

```gitignore
Materials/
tmp/
.superpowers/
.DS_Store
Thumbs.db
```

Create an empty `.nojekyll` file.

- [ ] **Step 4: Implement the accessible HTML shell**

Create `index.html` with `lang="zh-CN"`, a skip link, semantic `header`, `main`, and `footer`, the required IDs, labels for every input, an `aria-live="polite"` status region, an initially hidden detail view, and:

```html
<link rel="stylesheet" href="./assets/styles.css">
<script type="module" src="./js/app.mjs"></script>
```

Use navigation labels for both modes through JavaScript rather than duplicating two separate documents. Add a footer notice that the site is for professional reference and teaching and that current official guidance and institutional policy take precedence.

- [ ] **Step 5: Implement the responsive visual foundation**

Create `assets/styles.css` using CSS custom properties and the system font stack:

```css
:root {
  --ink: #172033;
  --muted: #647084;
  --surface: #ffffff;
  --surface-soft: #f4f7fa;
  --line: #dce3ea;
  --brand: #176b87;
  --brand-dark: #0f4f66;
  --accent: #d9f0f4;
  --warning: #8a5a00;
  color-scheme: light;
  font-family: Inter, "Noto Sans SC", "Microsoft YaHei", system-ui, sans-serif;
}
```

Use a maximum content width of `1180px`, a two-column hero at desktop widths, responsive filter controls, three-column catalog cards above `900px`, two columns from `640px` to `899px`, and one column below `640px`. Give all controls a visible `:focus-visible` outline and keep body text at least `16px`.

- [ ] **Step 6: Run the static-shell test**

Run: `node --test tests/site.test.mjs`

Expected: PASS.

- [ ] **Step 7: Commit the shell**

```bash
git add .gitignore .nojekyll index.html assets/styles.css tests/site.test.mjs
git commit -m "feat: add X-RADS static site shell"
```

---

### Task 2: Add validated bilingual RADS data

**Files:**
- Create: `data/rads.json`
- Create: `tests/data.test.mjs`

**Interfaces:**
- Consumes: none.
- Produces: JSON array of `RadsRecord` objects consumed by `js/app.mjs` and `js/catalog.mjs`.

`RadsRecord` uses this exact shape:

```typescript
type LocalizedText = { zh: string; en: string };
type Category = { code: string; original: string; meaning: LocalizedText };
type RadsRecord = {
  id: string;
  acronym: string;
  name: LocalizedText;
  summary: LocalizedText;
  organization: string;
  status: "released" | "in-development" | "non-acr";
  anatomy: string;
  domain: LocalizedText;
  modalities: string[];
  version: string;
  releaseDate: string | null;
  categoryRange: string;
  categories: Category[];
  originalTerms: Array<{ term: string; explanation: LocalizedText }>;
  officialUrl: string;
  lastVerified: "2026-09-16";
  related: string[];
};
```

- [ ] **Step 1: Write the failing data-contract test**

```javascript
// tests/data.test.mjs
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
    assert.ok(record.categories.every((item) => item.code && item.original));
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
```

- [ ] **Step 2: Run the data test and confirm it fails**

Run: `node --test tests/data.test.mjs`

Expected: FAIL because `data/rads.json` does not exist.

- [ ] **Step 3: Create the six records from official ACR entry pages**

Use these exact official entry URLs:

- BI-RADS: `https://www.acr.org/Clinical-Resources/Clinical-Tools-and-Reference/Reporting-and-Data-Systems/BI-RADS`
- LI-RADS: `https://www.acr.org/Clinical-Resources/Clinical-Tools-and-Reference/Reporting-and-Data-Systems/LI-RADS`
- Lung-RADS: `https://www.acr.org/Clinical-Resources/Clinical-Tools-and-Reference/Reporting-and-Data-Systems/Lung-RADS`
- O-RADS: `https://www.acr.org/Clinical-Resources/Clinical-Tools-and-Reference/Reporting-and-Data-Systems/O-RADS/Ultrasound`
- PI-RADS: `https://www.acr.org/Clinical-Resources/Clinical-Tools-and-Reference/Reporting-and-Data-Systems/PI-RADS`
- TI-RADS: `https://www.acr.org/Clinical-Resources/Clinical-Tools-and-Reference/Reporting-and-Data-Systems/TI-RADS`

Use these release labels in the Demo:

- BI-RADS: `v2025`.
- LI-RADS: `CT/MRI v2018; US Surveillance and TRA v2024`.
- Lung-RADS: `v2022`.
- O-RADS: `US v2022`.
- PI-RADS: `v2.1`.
- TI-RADS: `ACR TI-RADS 2017`.

Summarize category codes and meanings in original language plus concise Chinese and English explanations. Do not reproduce management tables, detailed thresholds, official artwork, or long passages from the source pages.

- [ ] **Step 4: Run the data-contract test**

Run: `node --test tests/data.test.mjs`

Expected: PASS with 3 passing tests.

- [ ] **Step 5: Commit the data set**

```bash
git add data/rads.json tests/data.test.mjs
git commit -m "data: add six bilingual RADS demo records"
```

---

### Task 3: Implement catalog search, filters, localization, and URL state

**Files:**
- Create: `js/catalog.mjs`
- Create: `tests/catalog.test.mjs`

**Interfaces:**
- Consumes: `RadsRecord[]` from `data/rads.json`.
- Produces:
  - `normalizeText(value: string): string`
  - `searchAndFilter(records: RadsRecord[], filters: CatalogFilters): RadsRecord[]`
  - `getRecordById(records: RadsRecord[], id: string): RadsRecord | null`
  - `localizeRecord(record: RadsRecord, language: "zh" | "en"): LocalizedRadsRecord`
  - `readState(url: URL): AppState`
  - `writeState(url: URL, patch: Partial<AppState>): URL`

Use these exact state shapes:

```typescript
type CatalogFilters = {
  query: string;
  anatomy: string;
  modality: string;
  status: string;
};

type AppState = CatalogFilters & {
  lang: "zh" | "en";
  rads: string;
};
```

- [ ] **Step 1: Write failing unit tests**

```javascript
// tests/catalog.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import {
  getRecordById,
  localizeRecord,
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
```

- [ ] **Step 2: Run the tests and confirm the module is missing**

Run: `node --test tests/catalog.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `js/catalog.mjs`.

- [ ] **Step 3: Implement the pure catalog functions**

In `js/catalog.mjs`, normalize with Unicode NFKC and lowercase matching. Build one searchable string from acronym, both names, both summaries, both domain labels, organization, modalities, version, category codes, and original terms. Apply query, anatomy, modality, and status with AND semantics. Return a new array without mutating input.

For `readState`, allow only `zh` and `en`, defaulting to `zh`. For `writeState`, delete parameters whose values are empty and return a new `URL` instance.

- [ ] **Step 4: Run unit tests**

Run: `node --test tests/catalog.test.mjs`

Expected: PASS with 5 passing tests.

- [ ] **Step 5: Commit catalog behavior**

```bash
git add js/catalog.mjs tests/catalog.test.mjs
git commit -m "feat: add bilingual RADS search and URL state"
```

---

### Task 4: Render the hybrid homepage and clinical detail view

**Files:**
- Create: `js/app.mjs`
- Modify: `index.html`
- Modify: `assets/styles.css`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: `data/rads.json` and all exports from `js/catalog.mjs`.
- Produces: interactive catalog, bilingual UI, combined filters, detail view, and URL-preserved navigation.

- [ ] **Step 1: Extend the smoke test for visible Demo copy and templates**

Add to `tests/site.test.mjs`:

```javascript
test("site shell includes the professional-use notice and anatomy navigator", async () => {
  const html = await readFile(new URL("index.html", root), "utf8");
  assert.match(html, /data-i18n=["']professionalNotice["']/);
  assert.match(html, /data-anatomy=["']head-neck["']/);
  assert.match(html, /data-anatomy=["']chest["']/);
  assert.match(html, /data-anatomy=["']abdomen-pelvis["']/);
  assert.match(html, /data-anatomy=["']musculoskeletal-whole-body["']/);
});
```

- [ ] **Step 2: Run the smoke test and confirm the new assertions fail**

Run: `node --test tests/site.test.mjs`

Expected: FAIL because the notice and anatomy controls are not yet present.

- [ ] **Step 3: Implement application loading and failure states**

In `js/app.mjs`, load `./data/rads.json` with `fetch`. While loading, show localized loading text in `page-status`. On non-OK response, invalid JSON, or empty data, show a localized error message and leave the catalog empty. Log the caught technical error only to `console.error`.

- [ ] **Step 4: Implement the approved hybrid homepage**

Render:

- a prominent keyword input;
- anatomy buttons for `head-neck`, `chest`, `abdomen-pelvis`, and `musculoskeletal-whole-body`;
- modality and status selects;
- a result count;
- frequently used RADS chips;
- responsive result cards with acronym, localized name, English full name on Chinese pages, modality, status, and version.

Every filter change updates the URL through `history.replaceState`, rerenders results, and preserves the selected language.

- [ ] **Step 5: Implement the approved clinical quick-reference detail view**

Selecting a card sets `rads=<id>` in the URL and renders:

- localized title, English full name, and acronym;
- organization, status, version, application domain, modalities, and category range;
- localized summary;
- category table with code, original English term, and localized explanation;
- original terms section;
- current official-source link with `rel="noopener noreferrer"`;
- last verification date;
- related RADS links;
- professional-use notice;
- a back action that removes only the `rads` parameter and preserves all filters.

If the URL requests an unknown `rads` value, show a localized not-found message and a back action; do not crash.

- [ ] **Step 6: Implement language switching without context loss**

The Chinese/English switch changes only the `lang` parameter. It must preserve query, anatomy, modality, status, and selected RADS. Update `document.documentElement.lang`, all `data-i18n` labels, input placeholders, option labels, result cards, detail content, empty-state messages, and page title.

- [ ] **Step 7: Complete responsive and accessibility styling**

Add styles for the hybrid hero, anatomy navigator, filter toolbar, catalog grid, badges, category table, side metadata panel, link states, empty/error states, and mobile single-column detail layout. Ensure keyboard focus is visible and interactive card controls use actual `button` or `a` elements.

- [ ] **Step 8: Run all automated tests**

Run: `node --test tests/*.test.mjs`

Expected: PASS with all data, catalog, and site tests passing.

- [ ] **Step 9: Commit the working interaction**

```bash
git add index.html assets/styles.css js/app.mjs tests/site.test.mjs
git commit -m "feat: build bilingual X-RADS catalog demo"
```

---

### Task 5: Document, visually verify, and prepare GitHub Pages handoff

**Files:**
- Create: `README.md`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: the completed static Demo.
- Produces: verified local preview and instructions for repository creation and GitHub Pages publishing.

- [ ] **Step 1: Add a failing README coverage test**

Add to `tests/site.test.mjs`:

```javascript
test("README documents preview, testing, source policy, and Pages deployment", async () => {
  const readme = await readFile(new URL("README.md", root), "utf8");
  for (const heading of ["Local preview", "Tests", "Content maintenance", "Source and copyright policy", "GitHub Pages"]) {
    assert.match(readme, new RegExp(`## ${heading}`));
  }
});
```

- [ ] **Step 2: Run the smoke test and confirm README is missing**

Run: `node --test tests/site.test.mjs`

Expected: FAIL because `README.md` does not exist.

- [ ] **Step 3: Write concise operating documentation**

Document:

- project purpose and medical-use boundary;
- local preview with `python -m http.server 8000`;
- tests with `node --test tests/*.test.mjs`;
- the JSON record schema and update workflow;
- prohibition on committing `Materials/` or unauthorized full text and artwork;
- creation of the public `X-RADS/x-rads.github.io` repository;
- pushing `main` and enabling Pages from the `main` branch root;
- optional custom domain only after the Demo is accepted.

- [ ] **Step 4: Run all automated tests from a clean command**

Run: `node --test tests/*.test.mjs`

Expected: all tests PASS with exit code 0.

- [ ] **Step 5: Start a local static server**

Run: `python -m http.server 8000`

Expected: server listens on port 8000 and `http://localhost:8000/` returns `index.html`.

- [ ] **Step 6: Perform visual and interaction QA**

Verify at desktop width `1440 × 900` and mobile width `390 × 844`:

1. Chinese loads by default.
2. All six cards appear.
3. Searching `前列腺`, `Prostate`, and `PI-RADS` finds PI-RADS.
4. MRI and abdomen/pelvis filters combine correctly.
5. PI-RADS opens the clinical detail view.
6. Original term `Very low` remains visible in Chinese mode.
7. Switching to English preserves the open PI-RADS detail.
8. Browser back and the in-page back action return to the preserved filtered list.
9. Unknown `?rads=missing` shows the not-found state.
10. Mobile layout has no horizontal scrolling, clipped controls, or overlapping text.

- [ ] **Step 7: Run final repository checks**

Run: `git status --short`

Expected: only intended Demo and documentation files are tracked or modified; `Materials/`, `tmp/`, and `.superpowers/` do not appear because `.gitignore` excludes them.

- [ ] **Step 8: Commit documentation and QA readiness**

```bash
git add README.md tests/site.test.mjs
git commit -m "docs: add X-RADS maintenance and deployment guide"
```

- [ ] **Step 9: Stop before remote publication if the organization is unavailable**

Do not create or push to a repository under another owner unless the authenticated GitHub account can access the `X-RADS` organization. If access is unavailable, return the complete local Demo, the intended repository name `X-RADS/x-rads.github.io`, and the exact remaining organization-access blocker.
