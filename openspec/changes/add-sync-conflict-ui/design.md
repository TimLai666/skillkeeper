## Context

The confirmed MVP requires more than passive conflict status. Users need a simple UI that identifies conflicts and guides them toward resolution, but the product explicitly does not include a full three-way merge editor in this version.

## Goals / Non-Goals

**Goals:**
- Detect when the central Library Repo enters a conflicted state.
- Show conflict details and recovery guidance in Sync Center.
- Provide basic recovery actions such as open local folder, retry after manual resolution, and refresh status.
- Expose unresolved conflict status to other summary views.

**Non-Goals:**
- Build a full merge editor or conflict diff tool.
- Resolve conflicts for external source repositories.
- Automatically choose merge results without user involvement.

## Decisions

- Limit conflict handling to the central Library Repo because it is the only writable repository managed by the application.
- Represent conflicts as a sync state with associated file paths and the most recent failed sync job so the UI can explain what happened.
- Offer operational recovery actions instead of embedded merge editing to keep scope aligned with MVP complexity.
- Reuse Sync Center as the single conflict workspace and keep Dashboard limited to summary indicators.

## Risks / Trade-offs

- [Users may expect in-app merging] -> Be explicit in the UI that manual file resolution is required for complex conflicts.
- [Conflict states can be stale if files are edited outside the app] -> Provide refresh and recheck actions tied to the current repo state.
- [Cross-platform folder opening differs by OS] -> Abstract OS-specific folder reveal actions behind the desktop shell.
