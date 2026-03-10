## Why

The MVP needs shared top-level navigation and configuration surfaces so users can understand overall system health and configure core paths and sync behavior. Dashboard and Settings complete the basic product shell around library, deployment, and sync workflows.

## What Changes

- Add Dashboard summaries for total skills, Git updates, and sync status.
- Add Settings for Codex path, Claude Code path, Git auth model explanation, and Library Repo auto-sync.
- Surface boot and environment status in the top-level shell where appropriate.
- Define the stable top-level navigation between library, sync, dashboard, and settings areas.

## Capabilities

### New Capabilities
- `dashboard-settings-ui`: Dashboard and Settings pages for top-level system visibility and configuration.

### Modified Capabilities

## Impact

- Completes the MVP page set around core workflows.
- Introduces the main location for path and sync configuration.
- Consumes state from bootstrap, library, deployment, and sync subsystems.
