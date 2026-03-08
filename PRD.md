# SkillKeeper PRD

Product Requirements Document

## 1. Product Overview

**Product Name**
SkillKeeper

**Product Description**
SkillKeeper 是一個 GUI 工具，用於集中管理 AI Agent Skills。
它允許使用者從資料夾、壓縮檔或 Git 倉庫匯入 skills，並將這些 skills 同步與部署到不同 AI agent（例如 Codex、Claude Code）。

SkillKeeper 同時提供：

* skills 統一管理
* Git 同步
* 多 agent 發佈
* 多裝置共用 skills

**一句話定位**

SkillKeeper — A GUI manager for AI agent skills with Git synchronization and multi-agent deployment.

---

# 2. Problem Statement

目前 AI Agent Skills 的管理存在以下問題：

### 2.1 Skills 分散

不同 agent 使用不同目錄，例如：

```
.agents/skills
.claude/skills
```

使用者需要手動管理多個資料夾。

---

### 2.2 缺乏 GUI 管理工具

目前 skills 大多透過：

* CLI
* 手動複製資料夾

管理體驗不佳。

---

### 2.3 Git 同步不方便

若想：

* 分享 skills
* 多裝置同步
* 跟 upstream 更新

通常需要手動 Git 操作。

---

### 2.4 Skills 沒有統一管理中心

目前沒有工具可以：

* 查看所有 skills
* 檢查 skill 狀態
* 更新 skills
* 發佈到不同 agent

---

# 3. Product Goals

SkillKeeper 的目標：

1. 提供 **GUI skills 管理工具**
2. 提供 **skills 中央庫 (Skill Library)**
3. 提供 **Git 同步**
4. 支援 **多 agent 發佈**
5. 支援 **多裝置共用 skills**

---

# 4. Target Users

### 4.1 AI Agent 開發者

需要：

* 管理自己的 skills
* 維護 skills repo

---

### 4.2 AI Power Users

需要：

* 安裝與更新 skills
* 同步 skills

---

### 4.3 團隊使用者

需要：

* 分享 skills
* 同步 skills

---

# 5. Core Concepts

## 5.1 Skill Library

SkillKeeper 內部維護一個 **中央 Skill Library**。

所有 skills 都先匯入 Library，再部署到 agent。

```
SkillKeeper Library
        ↓
Agent Deployment
```

---

## 5.2 Skill

一個 skill 是一個資料夾：

```
skill-name/
  SKILL.md
  scripts/
  assets/
  references/
```

`SKILL.md` 為 skill 描述與入口。

---

## 5.3 Platform Adapter

不同 agent 有不同 skills 目錄。

SkillKeeper 使用 **Adapter** 發佈 skills。

例如：

| Agent       | Path             |
| ----------- | ---------------- |
| Codex       | `.agents/skills` |
| Claude Code | `.claude/skills` |

---

# 6. Core Features

## 6.1 Skill Import

支援三種匯入方式：

### 6.1.1 Folder Import

使用者選擇資料夾。

```
Import Skill Folder
```

SkillKeeper 檢查：

* 是否存在 `SKILL.md`
* skill 結構是否有效

---

### 6.1.2 Archive Import

支援：

```
zip
tar.gz
```

流程：

1. 解壓
2. 掃描 skills
3. 選擇匯入

---

### 6.1.3 Git Import

使用者輸入：

```
Git repository URL
```

SkillKeeper：

```
git clone
scan skills
import
```

並記錄 upstream。

---

# 7. Skill Management

SkillKeeper GUI 允許：

* 查看 skills
* 編輯 metadata
* 查看 skill files
* 查看 Git status

每個 skill 顯示：

```
Name
Description
Source
Git Status
Installed Agents
Last Update
```

---

# 8. Agent Deployment

SkillKeeper 可以將 skills 發佈到 agent。

---

## 8.1 Codex Support

支援：

```
.agents/skills
~/.agents/skills
```

功能：

* install skill
* update skill
* uninstall skill

---

## 8.2 Claude Code Support

支援：

```
.claude/skills
~/.claude/skills
```

功能：

* install skill
* update skill
* uninstall skill

---

# 9. Git Integration

SkillKeeper 支援 Git。

---

## 9.1 Git Operations

支援：

```
clone
pull
push
fetch
commit
```

---

## 9.2 Upstream Tracking

每個 skill 可追蹤 upstream repo。

SkillKeeper 顯示：

```
ahead
behind
conflict
```

---

# 10. Multi-Device Sync

多裝置使用流程：

```
Device A
commit + push

Device B
pull
sync skills
```

透過 Git repo 同步 skills。

---

# 11. Skill Validation

匯入時執行：

* `SKILL.md` 檢查
* 檔案結構檢查
* 腳本警告

若 skill 含 script：

```
.sh
.ps1
.bat
```

顯示安全警告。

---

# 12. Local Data Structure

SkillKeeper 本機目錄：

```
~/.skillkeeper
```

結構：

```
.skillkeeper/
  db.sqlite
  library/
    skills/
  repos/
  cache/
  logs/
  settings.json
```

---

# 13. Database Schema

SQLite

主要表：

```
skills
git_bindings
platform_bindings
sync_jobs
settings
```

---

# 14. UI Structure

主要 UI：

### Dashboard

顯示：

```
total skills
git updates
sync status
```

---

### Skills Library

表格：

```
Name
Source
Git Status
Installed Agents
```

---

### Skill Detail

顯示：

```
metadata
file tree
SKILL.md preview
Git history
```

---

### Sync Center

顯示：

```
Git repos
sync status
conflicts
```

---

### Settings

設定：

```
Codex path
Claude path
Git auth
```

---

# 15. Technical Architecture

建議技術：

Backend：

```
Go
```

GUI：

```
Wails
```

架構：

```
UI
 ↓
Core API
 ↓
Library
Adapters
Git
Sync
```

---

# 16. MVP Scope

V1 功能：

* skill library
* folder import
* zip import
* Git import
* Codex deployment
* Claude deployment
* Git sync

---

# 17. Non-Goals (V1)

V1 不包含：

* skills marketplace
* cloud account system
* team permissions
* plugin store

---

# 18. Success Metrics

成功指標：

```
skill import < 10s
git clone < 60s
deployment success > 95%
```

---

# 19. Future Features

未來版本：

### v0.2

* auto sync
* conflict UI

### v0.3

* MCP tools support
* additional agents

### v1.0

* plugin system
* skills marketplace

---

# 20. Version Plan

```
v0.1  skill library
v0.2  git sync
v0.3  agent adapters
v1.0  stable
```
