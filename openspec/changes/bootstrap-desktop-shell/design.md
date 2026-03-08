## Context

SkillKeeper currently has product requirements but no application code or runtime contract. Every later capability depends on a desktop shell that can start reliably, know where app data lives, and determine whether the host has a usable Git installation.

## Goals / Non-Goals

**Goals:**
- Define the Electrobun desktop shell and React renderer boundary.
- Initialize `~/.skillkeeper` and baseline settings during startup.
- Detect system Git and persist readiness state for the UI.
- Provide a startup error surface that later pages can reuse.

**Non-Goals:**
- Implement skill import, deployment, or sync behavior.
- Define final database schema beyond bootstrap needs.
- Build full UI pages beyond a minimal shell and readiness state.

## Decisions

- Use Electrobun as the desktop host and React + TypeScript for the renderer so the MVP stays aligned with the selected stack.
- Treat startup as an ordered boot pipeline: resolve data directory, ensure folders exist, create default settings if missing, detect Git, then expose boot state to the UI.
- Store bootstrap settings in `settings.json` under `~/.skillkeeper` so later changes can add richer persisted config without changing the data root.
- Model Git readiness as explicit state rather than best-effort shelling on each feature invocation; this keeps downstream UI behavior deterministic.

## Risks / Trade-offs

- [Cross-platform path handling differs across OSes] -> Centralize path resolution in the shell layer and test Windows, macOS, and Linux startup flows.
- [Electrobun is less mature than more established shells] -> Keep the shell responsibilities thin and isolate app logic behind explicit startup services.
- [System Git may be installed but unusable due to PATH or auth issues] -> Record both presence and diagnostic failure details so later flows can message clearly.
