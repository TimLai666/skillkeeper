## 1. Conflict State Detection

- [x] 1.1 Extend Library Repo sync tracking to identify conflicted states and conflicted file paths.
- [x] 1.2 Persist unresolved conflict status and the most recent related sync job details.

## 2. Sync Center Recovery Flow

- [x] 2.1 Add Sync Center views for conflicted state, conflicted files, and recent sync failure details.
- [x] 2.2 Add recovery actions to open the local repo folder, refresh status, and retry after manual resolution.
- [x] 2.3 Expose unresolved conflict summary state for Dashboard indicators.

## 3. Verification

- [x] 3.1 Verify a conflicted Library Repo displays the conflicted files and supported recovery actions.
- [x] 3.2 Verify conflict state clears after manual resolution and a successful refresh or retry.
