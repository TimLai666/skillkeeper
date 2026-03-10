## 1. CI Release Gate

- [ ] 1.1 Add a GitHub Actions workflow that runs `bun install`, `bun run typecheck`, `bun test`, and `bun run readiness:report` on `windows-latest`, `macos-latest`, and `ubuntu-latest`.
- [ ] 1.2 Upload the readiness evidence from each successful platform run as a distinct artifact named for the platform.
- [ ] 1.3 Verify the workflow contract is fail-fast for smoke failures and preserves the existing verification entrypoints.

## 2. Readiness Evidence

- [ ] 2.1 Update `bun run readiness:report` so it emits platform-aware JSON suitable for local use and CI artifact upload.
- [ ] 2.2 Remove hardcoded "not executed from this Windows environment" messaging from generated readiness output and replace it with execution-context-aware reporting.
- [ ] 2.3 Verify the readiness artifacts remain machine-readable and distinguishable across Windows, macOS, and Linux.

## 3. PRD Matrix

- [ ] 3.1 Add `docs/prd-implementation-matrix.md` with authoritative per-requirement classifications: `Implemented`, `Partially Implemented`, `Not Implemented`, and `Deliberately Diverged`.
- [ ] 3.2 Cover the known high-risk PRD areas explicitly: implementation stack divergence, missing project-path installs, read-only external source repos, three-platform smoke evidence, and success metrics.
- [ ] 3.3 Verify every PRD classification cites repo evidence and states the gap when the requirement is not fully implemented.

## 4. Documentation and Handoff

- [ ] 4.1 Update `docs/mvp-readiness.md` to describe the CI matrix, readiness artifacts, and MVP exit criteria.
- [ ] 4.2 Update `docs/delivery-plan.md` so `MVP Exit Gate` becomes the active focus with CI and PRD-matrix blockers.
- [ ] 4.3 Keep `README.MD` concise and aligned with the updated readiness and delivery documents.

## 5. Verification

- [ ] 5.1 Verify the new workflow and docs are consistent with `package.json`, `openspec/specs/mvp-readiness/spec.md`, and the current implementation.
- [ ] 5.2 Confirm `openspec list --json` reflects the new `mvp-exit-gate` active change after Baseline closure.
