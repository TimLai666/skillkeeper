## Context

SkillKeeper now has a working MVP codebase, Windows readiness evidence, and a set of completed OpenSpec changes. However, the repository still has two workflow gaps: `README.MD` is effectively empty, and `openspec/specs/` has no stable baseline specs. That makes the implementation harder to run, review, and extend because future contributors must reconstruct intent from completed or archived changes.

## Goals / Non-Goals

**Goals:**
- Turn `README.MD` into the primary developer entrypoint for local setup and verification.
- Define a single change that will sync stable, already-implemented product behavior into `openspec/specs/`.
- Make archive sequencing explicit so completed active changes can be retired after the main spec baseline exists.

**Non-Goals:**
- Introduce new runtime product features.
- Re-open the technical decision to use `Electrobun` instead of the PRD's earlier `Go + Wails` direction.
- Claim macOS or Linux native validation before those smoke runs actually happen.

## Decisions

- Treat the README as a developer document, not marketing copy, so it can prioritize setup, commands, verification, and known limits.
- Model the next step as one change, `sync-main-spec-baseline`, rather than archiving or syncing specs ad hoc. This keeps the main-spec migration traceable and reviewable.
- Preserve only stable, observable behavior when syncing to `openspec/specs/`; do not copy temporary implementation details, test-only mechanics, or superseded PRD technology assumptions.
- Include README work and main-spec baseline work in the same change because both serve the same operational purpose: establishing stable repo entrypoints for future contributors.

## Risks / Trade-offs

- [Main specs may drift from completed change deltas if synced carelessly] -> Restrict the sync to already-implemented, user-visible behavior and compare each capability against its completed change spec before archiving.
- [README can become misleading if it overstates platform support] -> Document Windows as validated and macOS/Linux as pending native smoke evidence.
- [One umbrella change can become fuzzy] -> Keep the change tightly scoped to documentation and main-spec baseline work, with no runtime feature additions.
