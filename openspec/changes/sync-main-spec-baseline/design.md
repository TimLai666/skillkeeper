## Context

SkillKeeper now has a working MVP codebase, Windows readiness evidence, and a set of completed OpenSpec changes. However, the repository still has three workflow gaps: the README is not a stable summary entrypoint, there is no persistent delivery plan for humans and agents, and `openspec/specs/` has no stable baseline specs. That makes the implementation harder to run, review, and extend because future contributors must reconstruct intent from completed or archived changes.

## Goals / Non-Goals

**Goals:**
- Turn `README.MD` into a concise developer entrypoint for local setup and verification.
- Add `docs/delivery-plan.md` as the persistent collaboration and handoff document.
- Define a single change that will sync stable, already-implemented product behavior into `openspec/specs/`.
- Make archive sequencing explicit so completed active changes can be retired after the main spec baseline exists.

**Non-Goals:**
- Introduce new runtime product features.
- Re-open the technical decision to use `Electrobun` instead of the PRD's earlier `Go + Wails` direction.
- Claim macOS or Linux native validation before those smoke runs actually happen.

## Decisions

- Treat the README as a short entry document, not the full execution tracker, so it stays readable and points maintainers to the longer delivery plan.
- Add `docs/delivery-plan.md` as the authoritative handoff document with fixed sections for current focus, blockers, next deliverable, exit criteria, related changes, and last verified state.
- Model the next step as one change, `sync-main-spec-baseline`, rather than archiving or syncing specs ad hoc. This keeps the main-spec migration traceable and reviewable.
- Preserve only stable, observable behavior when syncing to `openspec/specs/`; do not copy temporary implementation details, test-only mechanics, or superseded PRD technology assumptions.
- Include README work, delivery-plan work, and main-spec baseline work in the same change because they jointly establish the repository's durable collaboration entrypoints.

## Risks / Trade-offs

- [Main specs may drift from completed change deltas if synced carelessly] -> Restrict the sync to already-implemented, user-visible behavior and compare each capability against its completed change spec before archiving.
- [Repository entry docs can diverge from actual repo state] -> Keep the delivery plan tied to `openspec list --json`, readiness docs, and the current active change.
- [README can become misleading if it overstates platform support] -> Document Windows as validated and macOS/Linux as pending native smoke evidence.
- [One umbrella change can become fuzzy] -> Keep the change tightly scoped to repository entry docs and main-spec baseline work, with no runtime feature additions.
