## Context

SkillKeeper has completed MVP implementation work, a populated `openspec/specs/` baseline, and archived feature changes. The remaining uncertainty is release confidence: the repo has only Windows readiness evidence, no CI-backed native validation for macOS or Linux, and no authoritative PRD implementation matrix. The delivery plan already identifies these as the blockers between "MVP mostly built" and "MVP can be declared complete."

## Goals / Non-Goals

**Goals:**
- Turn MVP readiness into a CI-backed release gate for Windows, macOS, and Linux.
- Keep `bun run readiness:report` as the only smoke/report entrypoint while making it suitable for CI artifacts.
- Produce a repo-tracked PRD implementation matrix with status, rationale, gaps, and evidence.
- Update repo-facing docs so the MVP exit gate is easy to understand and hand off.

**Non-Goals:**
- Add or redesign user-facing product features.
- Reverse the implementation choice of `Electrobun + React + TypeScript + SQLite`.
- Add project-path deployment support, additional agents, plugins, or marketplace behavior.
- Replace existing local verification commands with a different smoke runner.

## Decisions

- Use one GitHub Actions workflow with a three-platform matrix: `windows-latest`, `macos-latest`, `ubuntu-latest`.
- Each CI job runs the existing commands in fixed order: `bun install`, `bun run typecheck`, `bun test`, `bun run readiness:report`.
- CI is a fail-fast release gate. Any failing step fails the platform job.
- Each successful platform run uploads readiness artifacts named `mvp-readiness-windows`, `mvp-readiness-macos`, and `mvp-readiness-linux`.
- GitHub-hosted runners count as the authoritative native smoke environments for MVP exit evidence.
- `bun run readiness:report` remains the only smoke/report entrypoint and must emit platform-aware JSON so CI artifacts are distinguishable without inventing a second command.
- Add `docs/prd-implementation-matrix.md` as the authoritative PRD completion document. Every requirement row must include a status, short reason, evidence reference, and explicit gap when incomplete.
- Update `docs/mvp-readiness.md` to document the CI gate, evidence artifacts, and release-gate rules instead of only describing manual Windows evidence and pending native runs.
- Update `docs/delivery-plan.md` so the active focus shifts from Baseline closure to `MVP Exit Gate`.

## Risks / Trade-offs

- [Cross-platform CI may expose platform-specific defects immediately] -> Treat CI failures as expected gate findings; the change is designed to surface them, not mask them.
- [Readiness reporting may drift between local runs and CI runs] -> Keep one entrypoint (`bun run readiness:report`) and make CI consume exactly that output.
- [PRD matrix can become subjective] -> Require every classification to include a concrete evidence reference and an explicit gap statement where applicable.
- [GitHub Actions setup may become overly broad] -> Keep the workflow limited to MVP gate commands and artifact upload; do not add unrelated deployment or packaging steps.
