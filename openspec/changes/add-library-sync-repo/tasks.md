## 1. Library Repo Management

- [ ] 1.1 Implement initialization and connection flows for the single central Library Repo.
- [ ] 1.2 Add system Git operations for fetch, pull, commit, and push against the Library Repo.
- [ ] 1.3 Persist Library Repo metadata and sync job records in the local database.

## 2. Auto-Sync

- [ ] 2.1 Add a global auto-sync setting that applies only to the Library Repo.
- [ ] 2.2 Trigger automatic commit and push after supported library mutations when auto-sync is enabled.
- [ ] 2.3 Record sync outcomes, timestamps, and failure details for each auto-sync attempt.

## 3. Verification

- [ ] 3.1 Verify library changes can be committed and pushed through the central Library Repo without affecting external source repos.
- [ ] 3.2 Verify disabling auto-sync prevents automatic commit and push while preserving manual sync actions.
