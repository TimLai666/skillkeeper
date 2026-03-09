## 1. Developer Entry Docs

- [ ] 1.1 Expand `README.MD` with product overview, current status, quick start, verification commands, major features, known limits, and document links.
- [ ] 1.2 Verify the README commands and status statements match `package.json`, `docs/mvp-readiness.md`, and the current implementation posture.

## 2. Main Spec Baseline

- [ ] 2.1 Create stable main spec directories under `openspec/specs/` for the completed implemented capabilities.
- [ ] 2.2 Sync stable, observable requirements from completed change specs into the main specs without reintroducing superseded `Go + Wails` assumptions.
- [ ] 2.3 Compare each completed change delta against the new main specs and record any mismatch that needs follow-up before archive.

## 3. Archive Follow-Through

- [ ] 3.1 Archive the remaining completed active changes after their requirements are represented in the main spec baseline.
- [ ] 3.2 Verify `openspec/specs/` is populated and `openspec list --json` no longer shows completed active changes.
