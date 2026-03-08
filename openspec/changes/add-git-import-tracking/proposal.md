## Why

Git-backed skills are a core product use case, but the MVP treats source repositories differently from the central library sync repository. This change is needed to import from external Git repositories, preserve upstream awareness, and keep those sources read-only by default.

## What Changes

- Add Git repository import from a user-provided repository URL.
- Clone external repositories into managed storage and scan them for skills.
- Track repository-level upstream metadata and status for imported skills.
- Keep external source repositories read-only by default inside the application.

## Capabilities

### New Capabilities
- `git-import-tracking`: External Git repository import, repository-level tracking, and upstream status visibility.

### Modified Capabilities

## Impact

- Adds the first remote import workflow.
- Introduces repository-level status data consumed by library and sync UI.
- Keeps a strict boundary between external source repos and the central sync repo.
