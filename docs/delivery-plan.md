# Delivery Plan

## How to Use This Plan

This file is the handoff and coordination entrypoint for SkillKeeper.
Before touching code, read this plan, then confirm it matches `openspec list --json`, the active change artifacts, and [MVP Readiness](./mvp-readiness.md).

When you update this file, always refresh:

- `Current Focus`
- `Blockers`
- `Next Deliverable`
- `Last Verified State`

Do not move the project to the next milestone until the current milestone exit criteria are fully satisfied.

## Current Focus

- Current milestone: `MVP Exit Gate`
- Active change: `mvp-exit-gate`
- Technical baseline: `Electrobun + React + TypeScript + SQLite`
- PRD divergence: the PRD referenced `Go + Wails`; the implemented stack remains `Electrobun`
- Current state:
  - MVP feature work is implemented and the main specs baseline exists
  - Baseline closure work is archived
  - Windows has local readiness evidence
  - macOS and Linux still need authoritative native smoke evidence through CI
  - The repo still needs a formal PRD implementation matrix

## Blockers

- Cross-platform GitHub Actions release gate is not implemented yet
- macOS and Linux native smoke evidence is not recorded yet
- `docs/prd-implementation-matrix.md` does not exist yet
- MVP exit criteria are not documented as a single completed gate yet

## Next Deliverable

- Implement the `mvp-exit-gate` change
- Add the CI matrix and readiness artifacts
- Add the PRD implementation matrix
- Refresh readiness and delivery docs after the gate is wired

## Milestones

### MVP Exit Gate

**Goal**

Turn the existing MVP implementation into a release-grade, evidence-backed gate that can answer whether MVP is truly complete.

**Current State**

- `mvp-exit-gate` is the active change
- Main specs exist and previous MVP implementation changes are archived
- Windows has local readiness evidence
- Cross-platform CI evidence and PRD completion tracking are still missing

**In Scope**

- GitHub Actions smoke matrix for Windows, macOS, and Linux
- Platform-specific readiness artifacts
- PRD implementation matrix
- Updated readiness and delivery documentation

**Out of Scope**

- New product features
- Additional agents
- Plugin, marketplace, or team features

**Blockers**

- No CI release gate
- No authoritative PRD completion matrix
- No native CI evidence for macOS or Linux

**Next Deliverable**

- A complete `mvp-exit-gate` implementation with CI, artifacts, and docs

**Exit Criteria**

- The GitHub Actions matrix runs the MVP smoke flow on all three target platforms
- Each successful platform run preserves a readiness artifact
- The PRD implementation matrix exists and cites repo evidence
- Readiness and delivery docs point to the same exit-gate process

**Related OpenSpec Changes**

- `mvp-exit-gate`
- `archive/2026-03-10-sync-main-spec-baseline`
- `archive/2026-03-09-polish-mvp-acceptance`

### Run Stabilization

**Goal**

After the exit gate is complete, improve diagnostics and repeatability for the existing workflows.

**Current State**

- Not started

**In Scope**

- Better deployment and sync diagnostics
- More repeatable smoke and regression flows
- Validation improvements that do not change product scope

**Out of Scope**

- New feature surfaces
- New agent support

**Blockers**

- `MVP Exit Gate` must be complete first

**Next Deliverable**

- A stabilization change proposal after MVP exit is closed

**Exit Criteria**

- Common failures have readable diagnostics
- Regression validation is easier to rerun consistently

**Related OpenSpec Changes**

- To be created after MVP Exit Gate

### Capability Expansion

**Goal**

Expand beyond the current MVP only after the release gate and stabilization work are complete.

**Current State**

- Not started

**In Scope**

- Additional agents
- MCP-related integration support
- Deeper adapter abstractions

**Out of Scope**

- Marketplace
- Team collaboration features

**Blockers**

- Stable release gate and stabilization baseline are required first

**Next Deliverable**

- A capability-expansion proposal after stabilization

**Exit Criteria**

- New capabilities are added through main specs and OpenSpec changes, not ad hoc implementation

**Related OpenSpec Changes**

- To be created later

## Last Verified State

Verification date: 2026-03-10

- `openspec list --json`
  - Result: `mvp-exit-gate` is the only active change after Baseline closure
- `openspec status --change sync-main-spec-baseline --json`
  - Result: archived change was complete before closure
- `bun run typecheck`
  - Result: pass
- `bun test`
  - Result: pass, `32 pass / 0 fail`
- `bun run build`
  - Result: pass
- `bun run readiness:report`
  - Result: Windows readiness report passes local smoke and PRD metrics
