## Context

The desktop shell change creates the app data root, but there is still no durable model for skills or related workflows. The PRD requires a central Skill Library, SQLite persistence, deployment bindings, sync jobs, and settings that later UI flows can query consistently.

## Goals / Non-Goals

**Goals:**
- Define the initial SQLite schema needed for MVP library workflows.
- Create the on-disk library layout for stored skills and related repository clones.
- Provide data access services for reading and mutating library entities.
- Define status fields that later changes can reuse instead of inventing their own flags.

**Non-Goals:**
- Import skill content from folders, archives, or Git repositories.
- Deploy skills into agent directories.
- Implement auto-sync or conflict handling behavior.

## Decisions

- Use SQLite as the single source of truth for app-managed metadata while skill files live on disk under the library directory.
- Separate physical file storage from relational metadata so the app can track deleted, failed, or partially installed items without losing file-level context.
- Represent source repositories, library skills, platform bindings, and sync jobs as distinct tables to keep later changes narrowly scoped.
- Use app-generated identifiers for library skills rather than deriving identity from folder names so imported names can change safely.

## Risks / Trade-offs

- [Schema may evolve quickly during early MVP work] -> Start with explicit migrations and avoid coupling UI state directly to raw table layouts.
- [File storage and DB rows can drift] -> Add reconciliation utilities and persist absolute library paths for validation.
- [Multiple future changes rely on the same statuses] -> Define stable enum-like states early and reuse them consistently across later specs.
