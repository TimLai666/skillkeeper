# Delivery Plan

## How to Use This Plan

這份文件是 SkillKeeper 的協作與接手入口，不是產品宣傳，也不是版本規劃。
其他 agent 接手時，先讀這份文件，再交叉檢查 `openspec list --json`、相關 change artifacts、以及 `docs/mvp-readiness.md`。

每次更新這份文件時，至少同步更新以下區塊：

- `Current Focus`
- `Blockers`
- `Next Deliverable`
- `Last Verified State`

如果當前 milestone 的 `Exit Criteria` 尚未滿足，不要把專案主焦點切到下一個 milestone。

## Current Focus

- 目前所在 milestone：`Baseline 收斂` 收尾
- 目前 active change：`sync-main-spec-baseline`
- 技術基線：`Electrobun + React + TypeScript + SQLite`
- PRD 差異：PRD 曾提 `Go + Wails`，目前實作與主規格都以 `Electrobun` 為準
- 目前現況：
  - MVP 主體功能已完成
  - `openspec/specs/` 主 baseline 已建立
  - 已完成 changes 已同步並封存，只剩 `sync-main-spec-baseline` 待封存
  - Windows 有 readiness 證據
  - macOS / Linux 尚缺原生 smoke evidence

## Blockers

- `sync-main-spec-baseline` 尚未封存，Baseline 收斂尚未完全結束
- macOS / Linux 缺少原生 smoke evidence，MVP 無法正式宣告完成
- PRD 實現度對照表尚未整理完成

## Next Deliverable

- archive `sync-main-spec-baseline`
- 建立下一個 change 來處理 `MVP Exit Gate`
- 補一份 PRD 實現度對照表並安排 macOS / Linux smoke evidence

## Milestones

### Baseline 收斂

**Goal**

把已完成的 MVP 主體收斂成穩定 baseline，讓後續工作不再依賴 scattered change artifacts。

**Current State**

- active change 為 `sync-main-spec-baseline`
- `openspec/specs/` 已建立 10 個主 capability specs
- 已完成 active changes 已封存到 `openspec/changes/archive/`
- README 與交接文件已可作為接手入口

**In Scope**

- 建立 main specs
- 同步已完成 change 的 stable observable requirements
- archive completed active changes
- 收斂 README 與 delivery plan 的交接資訊

**Out of Scope**

- 新增 runtime features
- 擴充 agent support
- plugin / marketplace 能力

**Blockers**

- `sync-main-spec-baseline` 本身尚未封存

**Next Deliverable**

- `sync-main-spec-baseline` archive 完成
- 交接主焦點切到 `MVP Exit Gate`

**Exit Criteria**

- `openspec/specs/` 已有穩定的主 capability specs
- completed active changes 已完成 archive
- README / delivery plan / readiness docs 一致

**Related OpenSpec Changes**

- `sync-main-spec-baseline`
- `archive/2026-03-10-bootstrap-desktop-shell`
- `archive/2026-03-10-add-local-library-model`
- `archive/2026-03-10-add-skill-import-folder-archive`
- `archive/2026-03-10-add-git-import-tracking`
- `archive/2026-03-10-add-agent-deployment`
- `archive/2026-03-10-add-library-management-ui`
- `archive/2026-03-10-add-library-sync-repo`
- `archive/2026-03-10-add-sync-conflict-ui`
- `archive/2026-03-10-add-dashboard-settings-ui`
- `archive/2026-03-09-polish-mvp-acceptance`

### MVP Exit Gate

**Goal**

把「功能大致可用」提升到「MVP 可正式宣告完成」。

**Current State**

- Windows readiness 已有證據
- macOS / Linux 尚未做原生驗證
- PRD 對照表仍未整理，需逐條確認完成度

**In Scope**

- macOS smoke run
- Linux smoke run
- 人工 GUI smoke
- PRD 實現度對照表

**Out of Scope**

- 新產品功能
- 架構重寫

**Blockers**

- 缺少 macOS / Linux 原生 smoke evidence
- 缺少完整 PRD gap list

**Next Deliverable**

- 三平台 smoke evidence
- PRD 對照表

**Exit Criteria**

- Windows / macOS / Linux 都有 smoke evidence
- PRD 已逐條標示已完成、部分完成、未完成、刻意偏離

**Related OpenSpec Changes**

- `archive/2026-03-09-polish-mvp-acceptance`
- `sync-main-spec-baseline`

### 運行穩定化

**Goal**

在 baseline 穩定後，補齊最容易影響實際使用的缺口與 diagnostics。

**Current State**

- 主要功能已存在，但仍缺一些回歸驗證與錯誤可觀察性

**In Scope**

- agent path 模型補強
- sync / deployment diagnostics
- 可重跑的 smoke / regression 流程

**Out of Scope**

- 新 agent 類型
- marketplace / plugin 生態

**Blockers**

- 需先完成 `Baseline 收斂` 與 `MVP Exit Gate`

**Next Deliverable**

- 穩定化 change proposal

**Exit Criteria**

- 常見失敗具備可讀 diagnostics
- 驗證流程固定且可重跑

**Related OpenSpec Changes**

- 待 `Baseline 收斂` 完成後建立

### 能力擴充

**Goal**

在 baseline 穩定後，再擴增 agents、integration surface 與 adapter abstraction。

**Current State**

- 尚未開始

**In Scope**

- additional agents
- MCP tools support
- 更完整的 adapter abstraction

**Out of Scope**

- marketplace
- team / ecosystem 功能

**Blockers**

- 需要先有穩定 baseline 與驗證流程

**Next Deliverable**

- 能力擴充 change proposal

**Exit Criteria**

- 新能力需透過 main specs 與 OpenSpec flow 擴增，不可繞過 baseline

**Related OpenSpec Changes**

- 待後續建立

### 生態化功能

**Goal**

只在核心穩定後，再做 plugin、marketplace、或更高層協作功能。

**Current State**

- 尚未開始

**In Scope**

- plugin system
- skills marketplace
- 可能的 team / sharing 能力

**Out of Scope**

- 核心 baseline 收斂工作

**Blockers**

- 需要先完成穩定 baseline 與 release gate

**Next Deliverable**

- 生態功能 proposal

**Exit Criteria**

- 新功能不破壞 library / deployment / sync 邊界

**Related OpenSpec Changes**

- 待後續建立

## Last Verified State

Verification date: 2026-03-10

- `bun run typecheck`
  - 最新一次結果：pass
- `bun test`
  - 最新一次結果：pass，`32 pass / 0 fail`
- `bun run build`
  - 最新一次結果：pass
- `bun run readiness:report`
  - 最新一次報告仍為 2026-03-09 Windows report
  - 結果：Windows smoke pass，PRD metrics pass
- `openspec list --json`
  - 最新一次結果：只剩 `sync-main-spec-baseline` 為 active change
