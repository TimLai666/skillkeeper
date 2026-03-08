## Context

The product uses two Git models: read-only external source repositories and one writable central Library Repo. This change implements the writable path, including auto-sync, while keeping those roles explicit in both the data model and UI behavior.

## Goals / Non-Goals

**Goals:**
- Initialize or connect a single Library Repo that represents the central Skill Library.
- Allow the app to commit and push library changes through the system Git executable.
- Support a global auto-sync toggle that controls automatic commit and push behavior.
- Record sync jobs and outcomes for later display.

**Non-Goals:**
- Push changes back to external source repositories.
- Build the conflict UI itself.
- Implement cloud account or credential storage features.

## Decisions

- Place the Library Repo inside managed app storage so the library files and their sync history stay co-located.
- Treat auto-sync as a global setting that applies only to the central Library Repo, never to imported source repos.
- Capture sync activity as explicit sync job records so later UI views can show status, timestamps, and recent failures.
- Use system Git credentials and environment configuration for all Library Repo network operations.

## Risks / Trade-offs

- [Automatic commit and push can surprise users] -> Keep auto-sync off by default or clearly surfaced in settings and activity views.
- [Library changes may be frequent and noisy] -> Batch commit triggers around meaningful library mutations rather than every file touch.
- [Central repo initialization may fail on partially configured Git environments] -> Detect and persist actionable failure reasons for settings and sync views.
