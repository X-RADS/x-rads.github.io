# X-RADS Clinical Imaging Reference

X-RADS is a static, bilingual (Chinese/English) reference catalog for common
clinical imaging reporting and data systems. It supports professional education
and reference only; it is not diagnostic software, medical advice, or a
substitute for current official guidance and local institutional policy.

## Repository boundary

This repository is the sole public X-RADS website. The parent local workspace
is not a Git repository and holds original articles, Word documents, drafts,
and restricted assets outside this repository. Do not add those materials to
this public project; publish concise, independently maintained metadata and
official-source links only.

## Catalog scope

The catalog currently contains 53 records, each supported by a locally
retained original PDF:

- 8 released systems.
- 2 works-in-progress systems, including Soft Tissue-RADS and the ACR
  Bone-RADS bone-tumor framework.
- 2 systems in development: BT-RADS and KI-RADS.
- 41 published non-ACR systems, including the separate SSR Bone-RADS
  incidental-solitary-bone-lesion framework.

The status label describes release state or publisher/oversight context:

- `released` — a released ACR record.
- `works-in-progress` — an ACR project still identified as in progress.
- `in-development` — an ACR system being developed without a released clinical
  catalog record.
- `non-acr` — a non-ACR system linked to its issuing society, publisher page,
  or original publication DOI. This does not imply clinical validation or
  endorsement.

Each list card presents the acronym, bilingual name, application domain,
modalities, status, and publication/version information. Detail pages list
each source by its applicable modality and version, then preserve the
verification date. If a published non-ACR record has not
been transcribed into category-level teaching text, the detail page directs the
reader to the original publication rather than supplying inferred definitions.

## Local preview

From the repository root, start a static server:

```bash
python -m http.server 8000
```

Open `http://127.0.0.1:8000/` in a browser. The site has no package install,
build step, backend, or external runtime asset dependency.

## Tests

Run the static-site checks from the repository root:

```bash
node --test tests/*.test.mjs
```

The tests cover the required page landmarks, catalog loading and filtering,
localized rendering, detail navigation, safe content rendering, and deployment
metadata.

## Content maintenance

Catalog records live in `data/rads.json`. Each record uses a stable `id`,
acronym, localized `name`, `summary`, and `domain` fields, anatomy, modalities,
status, version/release metadata, category and original-term arrays, a
`sources` list, `primarySourceId`, related record IDs, and a `lastVerified`
date. Each source identifies its applicable modalities, title, version, and
official URL; `detailSourceId` identifies the source supporting any rendered
category or terminology explanation.

For each change, confirm the official source, retain original English clinical
terms where provided, update `lastVerified`, check related IDs, preview the
filtered catalog and detail page, and run the test command above. ACR records
must link to the ACR source; non-ACR records must link to the issuing society,
publisher landing page, or DOI of the original publication. For a
publication-level record, use empty category and original-term arrays instead
of inventing unverified definitions. `non-acr` describes publisher or
oversight, not clinical validation or endorsement. Do not invent, infer, or
present unverified clinical guidance as authoritative.

For a new record, also confirm that its anatomy value is exposed through the
catalog navigator or has a deliberate fallback, and verify the affected list
and detail views in Chinese and English. The `workflow-quality` navigator
group is used for workflow and quality systems such as AE-RADS, Info-RADS, and
RI-RADS.

When changing `js/app.mjs`, update the `?v=` token on its script URL in
`index.html` to the first 12 characters of the file's SHA-256 hash after
normalizing CRLF to LF. This prevents an updated page from using cached
application code and outdated translations. The tests check this token.

## Source and copyright policy

Only commit concise, independently maintained catalog metadata and content
that the project is authorized to publish. Do not commit local source folders,
unauthorized full-text publications, source documents, figures, screenshots,
artwork, logos, or other copyrighted assets. Link to official public sources
instead of copying their protected content, and ensure every addition has an
appropriate publication right or permission.

## GitHub Pages

The public repository is `X-RADS/x-rads.github.io`. After review, push the
local `main` branch only when explicitly authorized. GitHub Pages serves the
`main` branch and `/ (root)` folder; `.nojekyll` ensures the static files are
served without Jekyll processing. Local merging does not publish changes; check
the remote and deployment state separately before telling readers that the
online site has changed.
