# Main Spec Sync Audit

Date: 2026-03-10
Change: `sync-main-spec-baseline`

## Source-to-Baseline Mapping

- `bootstrap-desktop-shell/specs/desktop-shell/spec.md` -> `openspec/specs/desktop-shell/spec.md`
- `add-local-library-model/specs/local-library-model/spec.md` -> `openspec/specs/local-library-model/spec.md`
- `add-skill-import-folder-archive/specs/skill-import/spec.md` -> `openspec/specs/skill-import/spec.md`
- `add-git-import-tracking/specs/git-import-tracking/spec.md` -> `openspec/specs/git-import-tracking/spec.md`
- `add-agent-deployment/specs/agent-deployment/spec.md` -> `openspec/specs/agent-deployment/spec.md`
- `add-library-management-ui/specs/library-management-ui/spec.md` -> `openspec/specs/library-management-ui/spec.md`
- `add-library-sync-repo/specs/library-sync/spec.md` -> `openspec/specs/library-sync/spec.md`
- `add-sync-conflict-ui/specs/sync-conflict-ui/spec.md` -> `openspec/specs/sync-conflict-ui/spec.md`
- `add-dashboard-settings-ui/specs/dashboard-settings-ui/spec.md` -> `openspec/specs/dashboard-settings-ui/spec.md`
- `archive/2026-03-09-polish-mvp-acceptance/specs/mvp-readiness/spec.md` -> `openspec/specs/mvp-readiness/spec.md`

## Comparison Result

- Compared each completed change delta against the new main baseline.
- Preserved only stable, observable requirements.
- Rejected no requirements and found no follow-up mismatches before archive.
- Did not reintroduce superseded PRD implementation assumptions such as `Go + Wails`.
