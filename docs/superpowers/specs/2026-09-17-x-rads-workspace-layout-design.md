# X-RADS 组织与本地工作区结构设计

## 目标

将 X-RADS 作为未来承载多个项目的 GitHub Organization 与本地工作区；当前阶段只启用一个公开的网站仓库，避免为单人维护过早拆分内容仓库。

## 已确认边界

- 当前仅由项目维护者本人维护。
- 原始 PDF、DOCX、投稿文稿、授权状态不明的插图和其他原始材料继续保留在本地，不上传 GitHub。
- GitHub 公开内容仅包括网站代码、已核对的结构化条目、必要的书目信息、官方来源链接、自制或授权明确的网页素材，以及维护规范。
- 当前 GitHub 远端尚未配置；本设计不创建仓库、不推送代码，也不发布网站。

## GitHub Organization 结构

```text
X-RADS (Organization)
└── x-rads.github.io             public, active now
    ├── static website code
    ├── verified public RADS data
    ├── citation metadata and official links
    ├── authorized web assets
    └── maintenance and source policy

Future repositories, only when needed:
├── rads-tools                   scoring / calculator tools
├── rads-content                 draft and review workflow
└── rads-research                literature indexes and research notes
```

`x-rads.github.io` is the single source of truth for public website content at this stage. A separate content repository is deferred until contribution, review, or scoring-tool complexity makes it useful.

## Local workspace structure

```text
X-RADS/
├── repos/
│   └── x-rads.github.io/        Git repository; current website project
├── materials-local/             never pushed to GitHub
│   ├── articles/                original PDFs and DOCX files
│   ├── manuscripts/             submissions and drafts
│   └── licensed-assets/         restricted or pending-rights assets
├── content-workbench/           local scratch data, source-verification notes
└── archive/                     local historical exports and snapshots
```

The present `Materials/` directory moves to `materials-local/articles/`. Its two current files remain byte-for-byte local material and are not placed in the nested Git repository.

## Migration rules

1. Preserve the existing Git history, `main` branch, website files, tests, and local preview behavior by relocating the repository itself to `repos/x-rads.github.io/`.
2. Do not alter the public website data schema or copy any original-material text, figures, or artwork into the repository.
3. Add a repository-level organization note documenting the public/private boundary and future repository names.
4. Add a local workspace README outside the nested repository explaining that it is not a GitHub upload target.
5. Verify the nested repository's test suite and `git status`; verify that `materials-local/` is outside its Git top-level.

## Acceptance criteria

- `C:\Users\SunsServer\Project\X-RADS\repos\x-rads.github.io` is the Git top-level and retains `main` history.
- The nested repository contains website code but no `Materials/` folder or original PDF/DOCX files.
- `C:\Users\SunsServer\Project\X-RADS\materials-local\articles` contains the two original materials.
- `content-workbench/`, `archive/`, and the material subdirectories exist locally.
- `node --test tests/*.test.mjs` passes from the nested repository.
- No GitHub remote is added, changed, or pushed during this migration.
