# Design QA — X-RADS static Demo

**Findings**

No actionable P0, P1, or P2 implementation findings remain.

- [P3] The supplied source files are standalone HTML fragments without their
  original presentation wrapper, linked stylesheet, or a charset declaration.
  Location: source mockup capture only.
  Evidence: the in-app browser opened both source paths, but its local static
  preview used a fallback character encoding and unstyled fragment rendering.
  Impact: this limits pixel-level comparison of the mockup's Chinese copy and
  visual tokens; it does not affect the implementation, which rendered Chinese
  correctly at both QA viewports.
  Follow-up: retain the source mockups as the structural/content truth, or add
  a self-contained, UTF-8 encoded preview wrapper if future pixel-fidelity QA
  is required.

## Comparison target and evidence

- Source visual truth references:
  - repository source-mockup `homepage-layouts.html` (option C, hybrid search and anatomy navigation)
  - repository source-mockup `rads-detail-wireframe.html` (PI-RADS clinical detail)
- Rendered implementation: `http://127.0.0.1:8000/`, served from this project
  root with `python -m http.server 8000`.
- Browser: Codex In-app Browser. Visual observations and screenshots were
  transient session evidence only; no durable screenshot artifact was created
  or retained.
- Desktop viewport: 1440 × 900 CSS px, device scale factor 1; source and
  implementation captures were 1440 × 900 px. No density normalization was
  needed.
- Mobile viewport: 390 × 844 CSS px, device scale factor 1; implementation
  captures were 390 × 844 px. The source mockups do not specify a mobile
  layout, so mobile QA assessed the implementation's responsive behavior rather
  than unsupported pixel equivalence.

## States compared

1. Desktop homepage in Chinese, initial state: all six cards, search, anatomy
   navigator, modality/status filters, and frequent-RADS controls. The source
   option-C structure and the implementation capture were emitted together in
   one in-app-browser comparison input.
2. Desktop PI-RADS detail in Chinese with `anatomy=abdomen-pelvis` and
   `modality=MRI`. The detail wireframe and implementation capture were emitted
   together in one in-app-browser comparison input.
3. Mobile Chinese homepage at 390 × 844, then mobile control/card region after
   a vertical scroll. A right-scroll attempt produced no visible horizontal
   shift.

## Full-view comparison

The homepage preserves option C's primary hierarchy: a prominent search entry,
anatomy navigation, then combined filter and frequent-RADS controls. The
implementation uses a coherent clinical-reference visual system (teal accent,
soft surfaces, concise cards) while retaining the source's intended content
and interaction order. The PI-RADS detail preserves the wireframe's clinical
heading, structured metadata, overview, category table including original
English terms, source/version sidebar, related records, and professional-use
notice.

## Focused-region comparison

The desktop filter/navigation strip and PI-RADS category table were inspected
in the matching browser states. They are key dense regions: controls remain
readable, the selected abdomen/pelvis and MRI state is visually distinct, and
the table visibly retains `Very low`. At mobile width, the focused controls
and first card collapse to a single column without clipped labels, overlap, or
horizontal viewport movement.

## Fidelity-surface review

- Fonts and typography: implementation uses its defined clinical sans-serif
  stack, clear heading hierarchy, readable Chinese/English wrapping, and no
  truncated controls in the tested viewports.
- Spacing and layout rhythm: desktop search, anatomy navigation, filters, and
  card grid are grouped in the source's intended order; mobile stacks these
  regions with usable gaps and card padding.
- Colors and visual tokens: implementation consistently maps brand teal,
  soft blue-gray surfaces, borders, active anatomy state, and released badges.
- Image quality and asset fidelity: neither source target contains required
  logo, illustration, photo, or non-standard icon artwork. The implementation
  introduces no replacement asset or fabricated inline SVG/CSS art.
- Copy and content: Chinese is the default; English localization, original
  English category terms, professional-use boundary, official-source link,
  and metadata are present in the checked states.

## Interaction and console checks

- Chinese default: passed.
- Six cards: passed.
- `前列腺`, `Prostate`, and `PI-RADS` search: each returned the single PI-RADS card.
- Abdomen/pelvis plus MRI: passed; the expected LI-RADS and PI-RADS records remained.
- PI-RADS clinical detail and `Very low`: passed.
- English switch retained open PI-RADS detail and the filtered URL state: passed.
- Browser back and in-page back each restored the abdomen/pelvis + MRI list: passed.
- Card activation moved focus and the viewport to the PI-RADS detail heading:
  passed.
- Related-RADS activation moved focus and the viewport to the new detail
  heading: passed.
- In-page back restored focus to the originating PI-RADS result: passed.
- Browser history into details focused the rendered detail heading, and browser
  back to the list focused the catalog heading fallback: passed.
- The header Detail link was absent from the accessibility tree on the list and
  targeted `#detail-heading` only while a valid detail was rendered: passed.
- `?rads=missing`: passed; rendered the localized not-found state.
- Mobile controls/cards: passed; no visible clipping, overlap, or horizontal shift.
- Browser console errors: none (`[]`).

## Comparison history

1. Initial desktop homepage and PI-RADS-detail comparisons: no actionable
   P0/P1/P2 mismatch found; no QA code/CSS fix was required.
2. Mobile comparison: no actionable P0/P1/P2 responsive mismatch found; no QA
   code/CSS fix was required.
3. Post-fix desktop/mobile interaction pass: localization sentinels, detail
   heading focus/scroll, originating-card focus restoration, browser-history
   focus, conditional Detail navigation, English detail persistence, and an
   empty error console all passed. Evidence remains ephemeral in the in-app
   browser session; no durable screenshots are claimed.

**Open Questions**

The source fragments' missing wrapper/charset prevent a pixel-exact rendered
source preview. This is recorded as P3 source-artifact polish, not an
implementation blocker, because the structural source target was opened and
compared and the complete implementation was browser-rendered at both required
viewports.

**Implementation Checklist**

1. Keep JSON content source-verified and preserve original English terms.
2. Re-run browser QA after any layout, localization, or data-schema change.
3. If source visual files are revised, provide self-contained UTF-8 preview
   documents for future pixel-level comparisons.

**Follow-up Polish**

- [P3] Package source mockup fragments with their intended styles and UTF-8
  metadata for more precise visual-diff review.

final result: passed
