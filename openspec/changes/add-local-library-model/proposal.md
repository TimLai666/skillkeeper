## Why

SkillKeeper needs a persistent model for the central Skill Library before imported skills, deployment bindings, or sync jobs can be tracked safely. Without a local data model, later changes would duplicate state across files and UI flows.

## What Changes

- Define the initial SQLite schema for skills, source repositories, platform bindings, sync jobs, and settings-backed metadata.
- Introduce the central Skill Library storage layout under `~/.skillkeeper/library`.
- Add application services for creating, loading, and updating core library records.
- Define stable identifiers and lifecycle states for library skills and related bindings.

## Capabilities

### New Capabilities
- `local-library-model`: Local Skill Library persistence, identifiers, and repository/platform relationship records.

### Modified Capabilities

## Impact

- Establishes the data contracts used by imports, deployment, sync, and UI views.
- Introduces the first durable schema and migration boundary.
- Creates shared persistence services that later changes will depend on.
