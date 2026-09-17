# X-RADS Clinical Imaging Reference Demo

X-RADS is a static, bilingual (Chinese/English) reference catalog for common
clinical imaging reporting and data systems. It supports professional education
and reference only; it is not diagnostic software, medical advice, or a
substitute for current official guidance and local institutional policy.

## Local preview

From the repository root, start a static server:

```bash
python -m http.server 8000
```

Open `http://localhost:8000/` in a browser. The Demo has no package install,
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
status, version/release metadata, category definitions, original terms,
official source URL, related record IDs, and a `lastVerified` date. Preserve
the existing JSON schema and use valid JSON when adding or updating records.

For each change, confirm the official source, retain original English clinical
terms where provided, update `lastVerified`, check related IDs, preview the
filtered catalog and detail page, and run the test command above. Do not
invent, infer, or present unverified clinical guidance as authoritative.

## Source and copyright policy

Only commit concise, independently maintained catalog metadata and content
that the project is authorized to publish. Do not commit `Materials/`,
unauthorized full-text publications, source documents, figures, screenshots,
artwork, logos, or other copyrighted assets. Link to official public sources
instead of copying their protected content, and ensure every addition has an
appropriate publication right or permission.

## GitHub Pages

After the Demo is accepted and the organization grants access, create the
public repository `X-RADS/x-rads.github.io`. Push the reviewed local `main`
branch to that repository, then enable GitHub Pages with the deployment source
set to the `main` branch and `/ (root)` folder. The `.nojekyll` file is
included so GitHub Pages serves the static files without Jekyll processing.

Consider a custom domain only after the Demo has been accepted and its Pages
deployment has been verified. This task does not create or push a remote
repository.
