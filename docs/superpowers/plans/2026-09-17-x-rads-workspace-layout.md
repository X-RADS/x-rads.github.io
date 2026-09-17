# X-RADS Workspace Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current X-RADS repository root into a local multi-project workspace while preserving the website Git repository, Git history, local materials, and no-remote boundary.

**Architecture:** The existing Git repository is relocated intact to `repos/x-rads.github.io/`; the former root becomes a non-Git local workspace. Original material files move outside the nested repository to `materials-local/articles/`, while local-only workbench and archive directories are created beside it. A repository document describes the GitHub Organization structure; a workspace document describes the local-only boundary.

**Tech Stack:** Git, PowerShell filesystem operations, native HTML/CSS/JavaScript, Node.js test runner.

**Spec:** `docs/superpowers/specs/2026-09-17-x-rads-workspace-layout-design.md`

## Global Constraints

- Current maintenance is single-maintainer; do not create a separate content repository.
- Do not create, configure, push to, or publish a GitHub remote during this migration.
- Original PDF, DOCX, submission, and restricted/pending-rights assets stay local and outside `repos/x-rads.github.io/`.
- Preserve the nested repository's existing `main` history, website files, tests, and `Materials/` ignore rule.
- Preserve `.worktrees/`, `.superpowers/`, and `tmp/` as local workspace artifacts; do not move them into the nested website repository.
- Do not delete non-empty paths or force-remove worktrees. Stop only the confirmed local HTTP preview process before moving its working directory.
- Run the complete `node --test tests/*.test.mjs` suite from the nested repository after relocation.

---

## File structure

| Path after migration | Responsibility |
|---|---|
| `repos/x-rads.github.io/` | Nested Git repository for the public website. |
| `materials-local/articles/` | Original locally retained PDF/DOCX reference material. |
| `materials-local/manuscripts/` | Local-only submissions and drafts. |
| `materials-local/licensed-assets/` | Local-only restricted or pending-rights assets. |
| `content-workbench/` | Local source-verification notes and temporary content work. |
| `archive/` | Local historical exports and snapshots. |
| `WORKSPACE.md` | Non-Git local workspace guidance. |
| `repos/x-rads.github.io/docs/organization-structure.md` | Public repository note for the X-RADS Organization layout and source boundary. |

### Task 1: Capture a rollback-safe preflight state

**Files:**
- Create: sibling safety worktree `C:\Users\SunsServer\Project\X-RADS-layout-backup`
- Modify: none
- Test: Git identity, clean status, remote absence, and backup worktree verification

**Interfaces:**
- Consumes: current `C:\Users\SunsServer\Project\X-RADS` repository on `main`.
- Produces: a read-only rollback checkout at commit `f9a8c76` before filesystem relocation.

- [ ] **Step 1: Stop only the confirmed local preview server**

Run from `C:\Users\SunsServer\Project` after checking its command line:

```powershell
$listener = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($listener) {
  $process = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
  if ($process.CommandLine -match 'python\.exe.*-m http\.server 8000.*127\.0\.0\.1') {
    Stop-Process -Id $listener.OwningProcess
  } else {
    throw 'Port 8000 is not the confirmed X-RADS preview process.'
  }
}
```

Expected: no unidentified process is stopped.

- [ ] **Step 2: Verify exact current repository state**

Run:

```powershell
$git = 'C:\Users\SunsServer\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'
& $git -c safe.directory='C:/Users/SunsServer/Project/X-RADS' status --short --branch
& $git -c safe.directory='C:/Users/SunsServer/Project/X-RADS' rev-parse HEAD
& $git -c safe.directory='C:/Users/SunsServer/Project/X-RADS' remote -v
```

Expected: clean `main`, `f9a8c76` at `HEAD`, and no remote output.

- [ ] **Step 3: Create an isolated rollback worktree**

Run from `C:\Users\SunsServer\Project` only after confirming the target does not exist:

```powershell
$git = 'C:\Users\SunsServer\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'
$backup = 'C:\Users\SunsServer\Project\X-RADS-layout-backup'
if (Test-Path -LiteralPath $backup) { throw 'Backup worktree path already exists.' }
& $git -c safe.directory='C:/Users/SunsServer/Project/X-RADS' worktree add $backup -b backup/x-rads-before-workspace-layout f9a8c76
```

Expected: `X-RADS-layout-backup` contains a clean checkout at `f9a8c76`.

- [ ] **Step 4: Verify the backup before moving files**

Run:

```powershell
& $git -c safe.directory='C:/Users/SunsServer/Project/X-RADS-layout-backup' -C 'C:\Users\SunsServer\Project\X-RADS-layout-backup' status --short --branch
& $git -c safe.directory='C:/Users/SunsServer/Project/X-RADS-layout-backup' -C 'C:\Users\SunsServer\Project\X-RADS-layout-backup' rev-parse HEAD
```

Expected: clean `backup/x-rads-before-workspace-layout` at `f9a8c76`.

### Task 2: Relocate the repository and local material boundary

**Files:**
- Move: `.git`, `.gitignore`, `.nojekyll`, `README.md`, `assets/`, `data/`, `design-qa.md`, `docs/`, `index.html`, `js/`, `tests/` to `repos/x-rads.github.io/`
- Move: `Materials/` to `materials-local/articles/`
- Create: `materials-local/manuscripts/`, `materials-local/licensed-assets/`, `content-workbench/`, `archive/`
- Preserve at workspace root: `.worktrees/`, `.superpowers/`, `tmp/`
- Test: target inventory and nested Git top-level

**Interfaces:**
- Consumes: the preflight backup and the exact source inventory above.
- Produces: `C:\Users\SunsServer\Project\X-RADS` as the workspace root and `C:\Users\SunsServer\Project\X-RADS\repos\x-rads.github.io` as the Git repository root.

- [ ] **Step 1: Build and validate empty destination directories**

Run from `C:\Users\SunsServer\Project`:

```powershell
$workspace = 'C:\Users\SunsServer\Project\X-RADS'
$repo = Join-Path $workspace 'repos\x-rads.github.io'
$materials = Join-Path $workspace 'materials-local'
foreach ($path in @($repo, $materials, (Join-Path $workspace 'content-workbench'), (Join-Path $workspace 'archive'))) {
  if (Test-Path -LiteralPath $path) { throw "Destination already exists: $path" }
}
New-Item -ItemType Directory -Path $repo, $materials, (Join-Path $workspace 'content-workbench'), (Join-Path $workspace 'archive') | Out-Null
```

Expected: only the four new empty workspace directories exist.

- [ ] **Step 2: Relocate only the enumerated Git repository items**

Run from `C:\Users\SunsServer\Project`, not inside `X-RADS`:

```powershell
$workspace = 'C:\Users\SunsServer\Project\X-RADS'
$repo = Join-Path $workspace 'repos\x-rads.github.io'
$items = @('.git', '.gitignore', '.nojekyll', 'README.md', 'assets', 'data', 'design-qa.md', 'docs', 'index.html', 'js', 'tests')
foreach ($item in $items) {
  $source = Join-Path $workspace $item
  if (-not (Test-Path -LiteralPath $source)) { throw "Missing migration source: $source" }
}
foreach ($item in $items) {
  Move-Item -LiteralPath (Join-Path $workspace $item) -Destination $repo
}
```

Expected: `repos/x-rads.github.io/.git` exists; `.worktrees/`, `.superpowers/`, `tmp/`, and `Materials/` are still at the workspace root.

- [ ] **Step 3: Move original materials outside the nested repository**

Run:

```powershell
$workspace = 'C:\Users\SunsServer\Project\X-RADS'
$materials = Join-Path $workspace 'materials-local'
$source = Join-Path $workspace 'Materials'
$articles = Join-Path $materials 'articles'
if (-not (Test-Path -LiteralPath $source)) { throw 'Missing local Materials directory.' }
if (Test-Path -LiteralPath $articles) { throw 'Articles destination already exists.' }
Move-Item -LiteralPath $source -Destination $articles
New-Item -ItemType Directory -Path (Join-Path $materials 'manuscripts'), (Join-Path $materials 'licensed-assets') | Out-Null
```

Expected: `materials-local/articles` directly contains `RADS_诊断学_20251228-XY.docx` and `RADS进展-插图.pdf`.

- [ ] **Step 4: Verify the new boundaries before documentation changes**

Run:

```powershell
$git = 'C:\Users\SunsServer\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'
$repo = 'C:\Users\SunsServer\Project\X-RADS\repos\x-rads.github.io'
& $git -c safe.directory='C:/Users/SunsServer/Project/X-RADS/repos/x-rads.github.io' -C $repo rev-parse --show-toplevel
Test-Path -LiteralPath 'C:\Users\SunsServer\Project\X-RADS\repos\x-rads.github.io\Materials'
Get-ChildItem -LiteralPath 'C:\Users\SunsServer\Project\X-RADS\materials-local\articles' -File | Select-Object Name,Length
```

Expected: the Git top-level is the nested repository, `Materials` inside it is absent, and exactly the two original material files are listed outside it.

### Task 3: Add guidance, test the nested repository, and restart preview

**Files:**
- Create: `WORKSPACE.md`
- Create: `repos/x-rads.github.io/docs/organization-structure.md`
- Modify: none
- Test: Node suite, Git status/remotes, material exclusion, and HTTP preview

**Interfaces:**
- Consumes: the nested Git repository and local-only folder layout from Task 2.
- Produces: maintainable public/private guidance and a verified local website preview from the nested repository.

- [ ] **Step 1: Create the local workspace guidance**

Create `C:\Users\SunsServer\Project\X-RADS\WORKSPACE.md` with exactly this content:

```markdown
# X-RADS Local Workspace

This directory is a local workspace, not a Git repository and not a GitHub upload target.

- `repos/x-rads.github.io/` is the public website Git repository.
- `materials-local/` contains original source material and must remain local.
- `content-workbench/` contains local verification notes and temporary work.
- `archive/` contains local exports and snapshots.

Do not copy original PDF, DOCX, submission drafts, or restricted artwork into the public website repository.
```

- [ ] **Step 2: Create the repository organization guidance**

Create `repos/x-rads.github.io/docs/organization-structure.md` with exactly this content:

```markdown
# X-RADS Organization Structure

The active public repository is `X-RADS/x-rads.github.io`. It contains the static website, verified public RADS data, bibliographic metadata, official-source links, authorized assets, and maintenance documentation.

Original source PDFs, DOCX files, submission drafts, and restricted or unverified assets remain outside this repository in the local `materials-local/` workspace directory.

Future repositories are created only when a separate lifecycle exists:

- `rads-tools` for scoring or calculation tools.
- `rads-content` for a draft/review workflow when multiple contributors require it.
- `rads-research` for literature indexes and research notes, without full-text material.
```

- [ ] **Step 3: Run the complete nested repository verification**

Run from `C:\Users\SunsServer\Project\X-RADS\repos\x-rads.github.io`:

```powershell
node --test tests/*.test.mjs
$git = 'C:\Users\SunsServer\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'
& $git -c safe.directory='C:/Users/SunsServer/Project/X-RADS/repos/x-rads.github.io' status --short --branch
& $git -c safe.directory='C:/Users/SunsServer/Project/X-RADS/repos/x-rads.github.io' remote -v
```

Expected: all 27 tests pass, intended documentation files are the only uncommitted files, and no remote is output.

- [ ] **Step 4: Commit only the repository documentation**

Run from the nested repository:

```powershell
& $git -c safe.directory='C:/Users/SunsServer/Project/X-RADS/repos/x-rads.github.io' add -- docs/organization-structure.md
& $git -c safe.directory='C:/Users/SunsServer/Project/X-RADS/repos/x-rads.github.io' diff --cached --check
& $git -c safe.directory='C:/Users/SunsServer/Project/X-RADS/repos/x-rads.github.io' commit -m 'docs: add organization structure guidance'
```

Expected: only the nested repository guidance is committed; `WORKSPACE.md` remains local and untracked because its parent is not a Git repository.

- [ ] **Step 5: Start and verify a preview from the nested repository**

Run from `C:\Users\SunsServer\Project\X-RADS\repos\x-rads.github.io`:

```powershell
$server = Start-Process -FilePath 'C:\Users\SunsServer\miniconda3\python.exe' -ArgumentList @('-m', 'http.server', '8000', '--bind', '127.0.0.1') -WorkingDirectory 'C:\Users\SunsServer\Project\X-RADS\repos\x-rads.github.io' -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 1
$response = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8000/' -TimeoutSec 5
if ($response.StatusCode -ne 200 -or $response.Content -notmatch '<title>X-RADS 临床影像参考</title>') { throw 'Nested-repository preview verification failed.' }
```

Expected: local preview serves the existing X-RADS page from the nested repository.

---

## Plan self-review

### Spec coverage

- Single active public repository: Task 3 documents `X-RADS/x-rads.github.io`.
- Original files local only: Task 2 relocates `Materials/` outside the nested Git root and Task 3 documents the boundary.
- Future repositories deferred: Task 3 names their trigger conditions without creating them.
- Preserve history and local preview: Tasks 1–3 create a backup, move `.git` intact, run the existing test suite, and verify HTTP serving.
- No remote action: Global Constraints and Tasks 1/3 explicitly verify no remote and avoid remote commands.

### Placeholder scan

No `TODO`, `TBD`, or unspecified implementation steps remain.

### Interface consistency

All task paths use `C:\Users\SunsServer\Project\X-RADS\repos\x-rads.github.io` after Task 2, while original materials consistently use `C:\Users\SunsServer\Project\X-RADS\materials-local\articles`.
