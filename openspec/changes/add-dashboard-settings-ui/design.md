## Context

The product already requires Dashboard and Settings in the PRD, but their contents depend on earlier changes exposing library counts, sync state, agent path settings, and Git environment readiness. This change assembles those pieces into top-level application pages.

## Goals / Non-Goals

**Goals:**
- Build a Dashboard that summarizes total skills, Git updates, and sync health.
- Build a Settings page for global agent paths, Git auth behavior explanation, and auto-sync.
- Provide clear navigation into the rest of the MVP experience.
- Surface configuration errors in the same place users expect to fix them.

**Non-Goals:**
- Implement advanced analytics or historical reporting.
- Store Git credentials directly in the application.
- Replace specialized Sync Center or Skill Detail flows.

## Decisions

- Keep Dashboard focused on current operational summaries rather than detailed activity logs.
- Put path configuration and auto-sync under Settings because both change application-wide behavior.
- Describe Git authentication as system-managed so the UI does not imply in-app secret storage.
- Reuse shared summary cards and status indicators for consistency across Dashboard and other sections.

## Risks / Trade-offs

- [Dashboard can become a dumping ground for status widgets] -> Restrict MVP to the three confirmed summary areas.
- [Settings may expose invalid paths that break deployment later] -> Validate paths inline and surface errors before saving.
- [Users may look for credential storage in Settings] -> Make the system Git credential model explicit in copy and empty states.
