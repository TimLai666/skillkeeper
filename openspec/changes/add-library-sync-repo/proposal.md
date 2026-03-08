## Why

Cross-device sync is a core product goal, but it must not be conflated with the external source repositories used for import. This change creates the dedicated central Library Repo and the auto-sync behavior that keeps the Skill Library portable across devices.

## What Changes

- Create and manage a single central Library Repo for the Skill Library.
- Support commit, pull, fetch, and push operations for the Library Repo.
- Add an application-level auto-sync mode that can automatically commit and push library changes.
- Record sync jobs and sync outcomes for later UI display.

## Capabilities

### New Capabilities
- `library-sync`: Central Library Repo management and cross-device synchronization.

### Modified Capabilities

## Impact

- Adds the product's cross-device synchronization model.
- Introduces a new writable Git boundary distinct from external source repositories.
- Creates state that Sync Center and Dashboard will consume.
