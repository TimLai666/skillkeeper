## Context

By this point the app can bootstrap, store library records, import skills, and track repositories. Users still need a coherent management surface that makes those capabilities usable and keeps metadata edits safely separate from original skill content.

## Goals / Non-Goals

**Goals:**
- Build the Skills Library list view for managed skills.
- Build the Skill Detail view with metadata, file tree, `SKILL.md` preview, and Git history.
- Allow editing of app-managed metadata fields such as display name and description.
- Surface source, Git status, installed agents, and last update in consistent UI fields.

**Non-Goals:**
- Edit the original `SKILL.md` or source repository files.
- Build Dashboard summaries or Sync Center conflict workflows.
- Add advanced search, filtering, or tagging beyond MVP needs.

## Decisions

- Use the Skills Library list as the primary navigation entry point for day-to-day management workflows.
- Treat metadata edits as SkillKeeper-owned overlay data stored in SQLite so imported source content remains unchanged.
- Read file trees and `SKILL.md` preview from the library-managed copy rather than from external source paths to keep the UI deterministic.
- Show Git history and source status as read-only context driven by tracked repository metadata.

## Risks / Trade-offs

- [Rendering large file trees may be slow] -> Lazy-load tree nodes or cap initial depth for MVP responsiveness.
- [Users may expect metadata edits to rewrite SKILL.md] -> Label editable fields as app metadata and keep source preview explicitly read-only.
- [Git history on non-Git skills may be empty] -> Provide a clear empty state rather than hiding the section.
