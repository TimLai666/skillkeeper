# SkillKeeper

SkillKeeper 是一個桌面 GUI，用來集中管理 AI agent skills。

目前實作技術為 `Electrobun + React + TypeScript + SQLite`。MVP 主體已覆蓋 import、library management、deployment、sync、conflict UI、dashboard/settings，但 PRD 並非 100% 全數落地。

## 目前狀態

- MVP 主體已完成，Windows 有 build、test、readiness 驗證證據
- PRD 原本提議 `Go + Wails`，目前正式實作改為 `Electrobun`
- Windows 已驗證；macOS / Linux 尚未補原生 smoke evidence

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

`bun run readiness:report` 會產出 `docs/mvp-readiness-report.json`，用來記錄 Windows smoke 與 PRD 指標驗證結果。

## 主要功能

- Folder / zip / tar.gz / Git import
- Skills Library
- Codex / Claude Code deployment
- Library Repo sync
- Conflict UI
- Dashboard / Settings

## 已知限制

- 目前以全域 agent path 為主，尚未完成專案路徑安裝
- 外部 source repo 採 read-only tracking
- macOS / Linux 尚未補原生 smoke run
- `openspec/specs/` 的穩定 baseline 尚未同步完成

## 文件

- [MVP Readiness](docs/mvp-readiness.md)
- [PRD](PRD.md)
