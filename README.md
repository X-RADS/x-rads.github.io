# X-RADS Clinical Imaging Reference

X-RADS is a static, bilingual (Chinese/English) reference catalog for common
clinical imaging reporting and data systems. It supports professional education
and reference only; it is not diagnostic software, medical advice, or a
substitute for current official guidance and local institutional policy.

## Catalog scope

The catalog currently contains 44 records:

- 8 released ACR RADS records.
- 1 ACR works-in-progress record: Bone-RADS.
- 35 published non-ACR systems drawn from table 2 of the locally retained
  source article.

The status label describes release state or publisher/oversight context:

- `released` — a released ACR record.
- `works-in-progress` — an ACR project still identified as in progress.
- `non-acr` — a non-ACR system linked to its issuing society, publisher page,
  or original publication DOI. This does not imply clinical validation or
  endorsement.

Each list card presents the acronym, bilingual name, application domain,
modalities, status, and publication/version information. Detail pages preserve
the source URL and verification date. If a published non-ACR record has not
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
status, version/release metadata, category and original-term arrays, official
source URL, related record IDs, and a `lastVerified` date. Preserve the
existing JSON schema and use valid JSON when adding or updating records.

For each change, confirm the official source, retain original English clinical
terms where provided, update `lastVerified`, check related IDs, preview the
filtered catalog and detail page, and run the test command above. ACR records
must link to the ACR source; non-ACR records must link to the issuing society,
publisher landing page, or DOI of the original publication. For a
publication-level record, use empty category and original-term arrays instead
of inventing unverified definitions. `non-acr` describes publisher or
oversight, not clinical validation or endorsement. Do not invent, infer, or
present unverified clinical guidance as authoritative.

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
served without Jekyll processing. Local merging does not publish changes.
