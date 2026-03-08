## 1. Git Repository Intake

- [ ] 1.1 Add a Git repository import flow that accepts a repository URL and clones it through the system Git executable.
- [ ] 1.2 Store cloned source repositories under managed local storage and link them to imported skills.
- [ ] 1.3 Reuse the shared skill scanner to detect import candidates from cloned repositories.

## 2. Repository Tracking

- [ ] 2.1 Persist repository-level upstream metadata and tracking relationships in the local database.
- [ ] 2.2 Implement status refresh for ahead, behind, conflict, and unknown states using fetch and local inspection.
- [ ] 2.3 Restrict app-driven write operations so external source repositories remain read-only by default.

## 3. Verification

- [ ] 3.1 Verify a repository containing multiple valid skills can be cloned, scanned, and selectively imported.
- [ ] 3.2 Verify the UI shows repository tracking state without offering commit or push actions for external repos.
