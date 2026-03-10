# SkillKeeper

SkillKeeper 是一個桌面 GUI，用來集中管理 AI agent skills。
目前技術實作是 `Electrobun + React + TypeScript + SQLite`，MVP 主體已覆蓋 import、library management、deployment、sync、conflict UI、dashboard/settings，但整份 PRD 還不是 100% 完成。

## 目前狀態

- MVP 主體已完成，Windows 上已有 `build`、`test`、`readiness` 驗證證據
- PRD 原先偏向 `Go + Wails`，目前正式實作是 `Electrobun`
- `openspec/specs/` 主 baseline 已建立
- macOS / Linux 尚未補原生 smoke evidence

## 快速開始

### 前置需求

- `Bun`
- `Git`

### 安裝

```bash
bun install
```

### 開發啟動

```bash
bun run dev
```

### 建置

```bash
bun run build
```

## 驗證指令

```bash
bun run typecheck
bun test
bun run readiness:report
```

`bun run readiness:report` 會產出 `docs/mvp-readiness-report.json`，目前記錄的是 Windows smoke 與 PRD metric 驗證結果。

## 主要功能

- Folder / zip / tar.gz / Git import
- Skills Library
- Codex / Claude Code deployment
- Library Repo sync
- Conflict UI
- Dashboard / Settings

## 已知限制

- 目前以全域 agent path 為主，未完成專案路徑安裝
- 外部 source repo 為 read-only tracking
- macOS / Linux 尚未做原生 smoke run
- 三平台 smoke evidence 尚未齊全，`MVP Exit Gate` 仍未完成

## 文件入口

目前專案收斂計畫與接手入口請看 [Delivery Plan](docs/delivery-plan.md)。

## 文件連結

- [Delivery Plan](docs/delivery-plan.md)
- [MVP Readiness](docs/mvp-readiness.md)
- [PRD](PRD.md)
