## Why

The MVP includes conflict visibility and a basic conflict handling experience for library synchronization. Without a focused conflict workflow, sync failures would be opaque and users would have no guided path to recover.

## What Changes

- Add conflict detection and presentation for the central Library Repo.
- Provide a minimal Sync Center workflow for reviewing conflicted files and current sync status.
- Offer guided recovery actions without building a full merge editor.
- Persist conflict status so Dashboard and Sync Center can surface unresolved issues.

## Capabilities

### New Capabilities
- `sync-conflict-ui`: Conflict visibility and guided conflict recovery for the central Library Repo.

### Modified Capabilities

## Impact

- Adds the MVP recovery path for failed sync operations.
- Defines the product's limit for conflict handling in v1.
- Depends on Library Repo sync state and recent sync job records.
