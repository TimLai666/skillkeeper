## Context

The PRD requires deployment to Codex and Claude Code using global directories. The confirmed behavior is to copy skills into agent folders, keep uninstall separate from delete, and allow path configuration through settings without supporting project-scoped targets in MVP.

## Goals / Non-Goals

**Goals:**
- Install managed skills into Codex and Claude Code global directories.
- Update existing deployed copies from the library.
- Uninstall deployed copies without deleting the library record.
- Delete a skill from the library through a distinct action that also clears deployment bindings.

**Non-Goals:**
- Use symlink or junction based deployment.
- Support project-scoped deployment targets.
- Support agents other than Codex and Claude Code in MVP.

## Decisions

- Copy skill directories during install and update so deployed agents remain isolated from library mutations and platform-specific link behavior.
- Model deployment state per agent binding so one library skill can be installed in one, both, or neither supported agents.
- Keep uninstall and delete as separate commands to avoid accidental loss of library data during routine agent cleanup.
- Persist configurable global paths for each supported agent in settings while providing sensible defaults.

## Risks / Trade-offs

- [Copied deployments can drift from the library until updated] -> Track deployment timestamps and surface stale status in the UI.
- [Global path permissions may vary across OSes] -> Validate destination paths before copying and report actionable errors.
- [Deleting a library skill may leave unexpected agent remnants if paths were changed manually] -> Remove tracked bindings and verify target paths during delete workflows.
