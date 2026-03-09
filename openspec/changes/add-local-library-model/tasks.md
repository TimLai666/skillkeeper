## 1. Storage Layout

- [x] 1.1 Create the default library subdirectories under `~/.skillkeeper` for skills, repositories, cache, and logs.
- [x] 1.2 Define the SQLite database file location and migration entry point.

## 2. Core Data Model

- [x] 2.1 Create the initial tables for skills, git bindings, platform bindings, sync jobs, and settings.
- [x] 2.2 Define library skill identifiers, timestamps, source fields, and status fields used by later changes.
- [x] 2.3 Implement data access services for creating, reading, updating, and deleting library records.

## 3. Verification

- [x] 3.1 Verify a clean install creates the expected directory layout and schema.
- [x] 3.2 Verify library records remain consistent when related file paths are missing or deleted.
