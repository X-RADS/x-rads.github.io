# X-RADS 本地原文驱动的指南来源整理设计

## 目标

以 `materials-local/articles/RADS/RADS/` 中可用的原始 PDF 为目录纳入
依据，重整公开网站的 RADS 目录。每个公开条目必须可追溯到至少一份本地
原文；公开页面始终链接到相应的 DOI、期刊或机构网页，而不暴露或提交本地
PDF 的路径和内容。

## 已确认规则

1. 没有本地原始 PDF 支撑的现有网站条目从公开目录中移除。
2. 一个体系有多个模态或版本时，每个模态/版本都必须各自列出对应的来源
   题名、版本和外部链接；不得以一个 DOI 代表另一模态的论文。
3. 同名但临床对象、评分算法或管理框架不同的文件必须拆成独立网站条目。
4. 公开来源链接只指向 DOI、期刊、学会或机构页面；本地 PDF、扫描件、
   路径、版权材料和工作笔记不得进入公开 Git 仓库。
5. 既有类别解释只能绑定到其对应的来源版本。没有逐项核对原文的版本保持
   `source-only`，不推断阈值、类别或管理建议。

## 目录准入与条目变化

本次目录以 55 份本地 PDF 为盘点基准：1 份为综述，50 个当前网站体系至少
有一份对应原文，另有 4 份是现有体系的不同模态或框架版本。

移除下列没有对应本地原文的记录：`bi-rads`、`kwak-ti-rads`、`li-rads`、
`pe-rads`、`pi-rads`、`tbi-rads`。

现有 `bone-rads` 被两条独立记录替代：

- `bone-tumor-rads`：Bone-RADS（骨肿瘤），对应 ACR 2023 骨肿瘤风险评分
  文献，适用放射摄影为主的肿瘤风险评估。
- `bone-incidental-rads`：Bone-RADS（孤立骨病变），对应 SSR 2022 偶发
  孤立骨病变 CT/MRI 管理算法。

因此，公开目录预期从 56 条变为 51 条：移除 6 条、拆分 1 条为 2 条。
`综述-RADS.pdf` 作为本地背景综述保留在材料区，但不创建公共目录条目。

## 公共数据契约

`data/rads.json` 继续是公共网站的唯一目录来源。每个记录保留稳定 `id`、
双语名称/简介/领域、`anatomy`、`modalities`、`status`、`related` 等现有字段，
并新增下列来源模型：

```json
{
  "primarySourceId": "ct-mri-2021",
  "sources": [
    {
      "id": "ct-mri-2021",
      "modalities": ["CT", "MRI"],
      "title": "Introducing the Node Reporting and Data System 1.0 (Node-RADS)",
      "version": "Published 2021",
      "officialUrl": "https://doi.org/10.1007/s00330-020-07572-4"
    },
    {
      "id": "us-2025",
      "modalities": ["US"],
      "title": "Ultrasound-based Node-RADS",
      "version": "Published 2025",
      "officialUrl": "https://doi.org/10.22038/ijorl.2025.85674.3883"
    }
  ]
}
```

`sources` 中每项的 `officialUrl` 必须是 HTTPS DOI 或机构/期刊页面，`id` 在
记录内唯一，`modalities` 非空，且属于记录的 `modalities`。`primarySourceId`
必须指向该记录的一个来源。为避免静默兼容造成误导，不再用单一记录级
`officialUrl` 表示所有模态来源。

为防止详情正文跨版本误用，含 `categories` 或 `originalTerms` 的记录新增
`detailSourceId`。它必须指向其内容所依据的 `sources` 项。详情页在类别与
术语上方显示该版本和模态；`source-only` 记录不设此字段，也不渲染未核实的
类别解释。

## 本地来源清单

在外层工作区、但 Git 根目录之外，维护
`content-workbench/rads-local-source-manifest.json`。每项记录本地文件名、
文件相对 `materials-local` 的路径、条目 ID、来源 ID、PDF 题名/DOI 摘要和
人工核对状态。该清单是维护依据，绝不提交到 `repos/x-rads.github.io/`。

公共 JSON 仅保存可公开的书目信息和外部 URL；它不保存绝对路径、本地文件名
或版权文件内容。

## 页面呈现

目录卡片继续按记录的联合 `modalities` 过滤和展示。详情页将“官方来源”从
单链接改为“原始来源与适用模态”列表：每项显示模态、题名、版本及外部链接。
若正文存在 `detailSourceId`，页面明确标出“下列解释适用于”的对应来源，避免
将 O-RADS US 类别套用于 MRI，或将 Node-RADS CT/MRI 分级套用于 US。

Bone-RADS 两个记录各自展示名称、适用对象、模态、来源及独立类别内容；二者
互为相关条目，但不共享同一类别表。

## 核对目标

本次至少完成以下多来源关系：

- Node-RADS：CT/MRI 2021 与 US 2025 分别成为独立来源项。
- NI-RADS：MRI 2025 与 PET/CT 2018 分别成为独立来源项。
- O-RADS：US v2022 与 MRI 2022 分别成为独立来源项；现有类别正文仅绑定
  US 来源。
- Bone-RADS：拆分为骨肿瘤 ACR 2023 与孤立骨病变 SSR 2022。
- Soft Tissue-RADS：公开来源必须与本地 PDF 的最终核准版本一致；在来源
  差异未解决前，不新增类别解释。
- C-TIRADS：2020 英文版与 2021 中文指南的关系必须记录为独立来源或经
  核实的主/补充来源，不能以其中一篇代替另一篇。

## 验收标准

- 公共目录恰有 51 条，且不含六个无本地 PDF 的 ID。
- 每个公共记录包含至少一个有效 `sources` 项和一个有效
  `primarySourceId`；每个来源的模态均被记录支持。
- Node-RADS、NI-RADS、O-RADS 的每种列出模态均有对应来源链接；来源项
  之间 DOI 不混用。
- 两个 Bone-RADS 记录同时存在，适用对象、模态、来源与类别解释互不混淆。
- 当前有类别/术语解释的记录均有有效 `detailSourceId`。
- 公共 Git 仓库中没有 PDF、DOCX、本地路径或本地来源清单。
- 中英文详情页正确显示来源列表和正文适用版本；全套
  `node --test tests/*.test.mjs` 通过。
