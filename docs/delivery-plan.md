# Delivery Plan

## How to Use This Plan

這份文件是 SkillKeeper 的專案收斂與交接入口，不是版本規劃表。  
任何 agent 在開始工作前，先看這份文件，再對照 `openspec list --json`、相關 change artifacts、與 `docs/mvp-readiness.md`。

更新這份文件時，至少同步更新：

- `Current Focus`
- `Blockers`
- `Next Deliverable`
- `Last Verified State`

如果目前 milestone 的 `Exit Criteria` 尚未滿足，不要把專案主焦點切到下一個 milestone。

## Current Focus

- 目前所在 milestone：`Baseline 收斂`
- 目前 active change：`sync-main-spec-baseline`
- 技術基線：`Electrobun + React + TypeScript + SQLite`
- PRD 差異：PRD 曾提 `Go + Wails`，但目前實作與後續規格都以 `Electrobun` 為準
- 現況摘要：
  - MVP 主體程式已完成
  - `openspec/specs/` 仍為空，主 baseline 尚未建立
  - Windows 有 readiness 證據
  - macOS / Linux 尚未補原生 smoke evidence
  - `README.MD` 已改為摘要入口，完整收斂資訊由本文件承接

## Blockers

- `openspec/specs/` 尚未同步主 baseline，後續 change 缺少穩定 requirements source
- 多個 completed changes 仍是 active 狀態，尚未在主 specs 建立後 archive
- macOS / Linux 沒有原生 smoke evidence，MVP 還不能完全收口

## Next Deliverable

- 建立 `openspec/specs/` 主 baseline，覆蓋已完成能力
- 比對 completed/archived change specs 與 main specs 是否一致
- archive 剩餘 completed active changes
- 補一份 PRD 實現度對照表

## Milestones

### Baseline 收斂

**Goal**

把目前已完成的 MVP 功能收斂成可維護的 baseline，避免後續開發只依賴 scattered change artifacts。

**Current State**

- active change 是 `sync-main-spec-baseline`
- `openspec/specs/` 目前為空
- README 已是摘要入口，但主規格與 archive 清理尚未完成

**In Scope**

- 建立 main specs
- 比對已完成 change 的 stable observable requirements
- archive completed active changes
- 維護 README 與 delivery plan 的可讀性和一致性

**Out of Scope**

- 新 runtime features
- 額外 agent support
- plugin / marketplace 類能力

**Blockers**

- 尚未完成 main spec sync
- 尚未清空 completed active changes

**Next Deliverable**

- `openspec/specs/` populated
- `openspec list --json` 只保留真正未完成的 change

**Exit Criteria**

- `openspec/specs/` 已建立並覆蓋已完成能力
- completed active changes 已 archive
- README / delivery plan / readiness docs 三者一致

**Related OpenSpec Changes**

- `sync-main-spec-baseline`
- `bootstrap-desktop-shell`
- `add-local-library-model`
- `add-skill-import-folder-archive`
- `add-git-import-tracking`
- `add-agent-deployment`
- `add-library-management-ui`
- `add-library-sync-repo`
- `add-sync-conflict-ui`
- `add-dashboard-settings-ui`
- `archive/2026-03-09-polish-mvp-acceptance`

### MVP Exit Gate

**Goal**

把目前「功能可用」提升成「MVP 可正式驗收」。

**Current State**

- Windows readiness 已有證據
- macOS / Linux 尚未原生驗證
- PRD 實現度尚未整理成明確對照表

**In Scope**

- macOS smoke run
- Linux smoke run
- 人工 GUI smoke
- PRD 實現度對照表

**Out of Scope**

- 新功能擴充
- 架構重寫

**Blockers**

- 缺少 macOS / Linux 原生環境驗證
- 缺少正式 PRD gap list

**Next Deliverable**

- 三平台 smoke evidence
- PRD 實現度矩陣

**Exit Criteria**

- Windows / macOS / Linux 都有原生 smoke evidence
- PRD 每個重要需求都有完成度標記

**Related OpenSpec Changes**

- `archive/2026-03-09-polish-mvp-acceptance`
- `sync-main-spec-baseline`

### 運行穩定化

**Goal**

補齊最容易造成使用摩擦的穩定性與操作邊界問題。

**Current State**

- 主要功能已存在，但安裝目標、錯誤診斷、手動驗收證據仍可更完整

**In Scope**

- agent path 模型補強
- sync / deployment diagnostics
- 更穩定的 smoke / regression 流程

**Out of Scope**

- 新 agent 類型
- marketplace / plugin 生態

**Blockers**

- 需要先完成 `Baseline 收斂` 與 `MVP Exit Gate`

**Next Deliverable**

- 穩定化 change proposal 與驗收標準

**Exit Criteria**

- 核心錯誤路徑有清楚 diagnostics
- 驗收流程可重跑且不依賴個人記憶

**Related OpenSpec Changes**

- 待 `Baseline 收斂` 後新增

### 能力擴充

**Goal**

在 baseline 穩定後，再擴充更多 agents 與更廣的 integration surface。

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

- 依賴前面里程碑完成

**Next Deliverable**

- 擴充能力的 change proposal

**Exit Criteria**

- 新能力能透過既有 main specs 與 OpenSpec flow 擴充，不破壞 baseline

**Related OpenSpec Changes**

- 待後續新增

### 生態化功能

**Goal**

只在核心穩定後再進入 plugin、marketplace、分享與生態層能力。

**Current State**

- 尚未開始

**In Scope**

- plugin system
- skills marketplace
- 可能的 team / sharing 能力

**Out of Scope**

- 核心 baseline 收斂工作

**Blockers**

- 必須先完成前三個里程碑

**Next Deliverable**

- 生態層需求澄清與 proposal

**Exit Criteria**

- 有清楚的權限、同步、安裝與分發模型，不污染既有 library / deployment / sync 邊界

**Related OpenSpec Changes**

- 待後續新增

## Last Verified State

Verification date: 2026-03-10

- `bun run typecheck`
  - 最新結果：pass
- `bun test`
  - 最新結果：pass，`32 pass / 0 fail`
- `bun run build`
  - 最新結果：pass
- `bun run readiness:report`
  - 最新已知報告：2026-03-09 Windows report
  - 結果：Windows smoke pass；PRD 指標 pass
