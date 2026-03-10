## 1. Developer Entry Docs

- [x] 1.1 Rewrite `README.MD` as a concise entrypoint with product overview, current status, quick start, verification commands, major features, known limits, and links to supporting documents.
- [x] 1.2 Create `docs/delivery-plan.md` with fixed collaboration sections for current focus, blockers, next deliverable, exit criteria, related OpenSpec changes, and last verified state.
- [x] 1.3 Verify the README and delivery plan match `package.json`, `docs/mvp-readiness.md`, `openspec list --json`, and the current implementation posture.

## 2. Main Spec Baseline

- [ ] 2.1 Create stable main spec directories under `openspec/specs/` for the completed implemented capabilities.
- [ ] 2.2 Sync stable, observable requirements from completed change specs into the main specs without reintroducing superseded `Go + Wails` assumptions.
- [ ] 2.3 Compare each completed change delta against the new main specs and record any mismatch that needs follow-up before archive.

## 3. Archive Follow-Through

- [ ] 3.1 Archive the remaining completed active changes after their requirements are represented in the main spec baseline.
- [ ] 3.2 Verify `openspec/specs/` is populated and `openspec list --json` no longer shows completed active changes.
