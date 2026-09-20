# SDD ledger — plan: docs/superpowers/plans/2026-09-19-local-pdf-source-normalization.md

Setup: isolated branch `rads/local-pdf-source-normalization` created from `36f9f96`.

Setup: baseline `node --test tests/*.test.mjs` passed: 31 tests, 0 failures.

Setup: Ruling: the supplied SDD Bash workspace helper cannot create files under this Windows sandbox, even after Git Bash invocation; use this equivalent worktree-local ledger instead — cost if wrong: progress files may remain untracked scratch, but implementation commits remain the durable record.

Pre-flight: Task 1 produces the private manifest consumed by Task 3; it remains outside the public Git root, while Task 2 produces the public source contract consumed by Tasks 3 and 4. The plan and spec agree on 53 public records, four removals, source arrays, and two Bone-RADS records.

Task 1: started. Added verified LI-RADS CT/MRI v2018 and PI-RADS v2.1 entries plus the four unsupported website IDs to the private manifest.

Task 1: complete. Private manifest now maps all 56 public source instances to extant local PDFs; the review PDF and locally retained PE-RADS PDF remain outside the public catalog.

Task 2: complete. Added tests for the 53-record local-PDF boundary, four removals, two Bone-RADS frameworks, source identity, modality scope, and source-bound teaching content.

Task 3: complete. Migrated all public records to source arrays; split Bone-RADS; retained LI-RADS CT/MRI v2018 and PI-RADS v2.1; added distinct Node-RADS, NI-RADS, and O-RADS source records by modality/version.

Task 4: complete. Detail pages render every source and label the exact source supporting categories and key terms; added source-list and scope-note styling.

Task 5: complete. README and local WORKSPACE handoff updated; browser verified the 53-item catalog, separate Bone-RADS cards, O-RADS dual-source detail, and removal of the stale BI-RADS shortcut. Final full suite passed: 32 tests, 0 failures. Public-source/private-manifest reconciliation passed: 56 sources, 56 local PDFs, no local paths in public JSON.
