## Context

The MVP needs to ingest skills from Git while avoiding accidental writes back to external upstream repositories. The product model separates external source repos from the central Library Repo used for cross-device sync, so this design must keep those responsibilities explicit.

## Goals / Non-Goals

**Goals:**
- Clone user-specified Git repositories into managed storage.
- Scan cloned repositories for one or more valid skills.
- Persist repository metadata and expose upstream status such as ahead, behind, and conflict.
- Prevent application-driven commit and push operations against external source repositories by default.

**Non-Goals:**
- Auto-sync the central Library Repo.
- Resolve Git conflicts for external repositories inside this change.
- Support app-managed credentials beyond the system Git environment.

## Decisions

- Use the system Git executable for clone, fetch, and status operations so behavior stays close to the user's native Git environment.
- Track Git bindings at the repository level and link imported skills back to the containing repository to avoid duplicating network operations.
- Store cloned external repositories under managed app storage so the UI can refresh status without re-prompting for source locations.
- Treat external repositories as read-only in the application; only fetch and pull are allowed in the MVP unless a future change explicitly expands permissions.

## Risks / Trade-offs

- [Remote repositories may be large or slow to clone] -> Surface clone progress and error states clearly in the UI.
- [Repository status semantics vary for detached HEAD or unusual remotes] -> Normalize MVP status to the supported set and mark unsupported states explicitly.
- [Users may expect push support for imported repos] -> Keep the UI language explicit that source repositories are tracked, not authored, inside SkillKeeper.
