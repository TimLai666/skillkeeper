## ADDED Requirements

### Requirement: Application manages a single central Library Repo
The application SHALL manage one writable Git repository that represents the central Skill Library for cross-device synchronization.

#### Scenario: Library Repo is initialized
- **WHEN** the application enables library sync on a device without an existing central Library Repo
- **THEN** the application initializes or connects the single managed Library Repo used for cross-device synchronization

### Requirement: Application syncs the Library Repo with Git operations
The application SHALL support fetch, pull, commit, and push operations for the central Library Repo.

#### Scenario: User runs a manual library sync
- **WHEN** a user requests a manual sync for the central Library Repo
- **THEN** the application performs the supported Git operations needed to refresh or publish library changes

### Requirement: Application limits auto-sync to the central Library Repo
The application SHALL apply automatic commit and push behavior only to the central Library Repo.

#### Scenario: Auto-sync is enabled
- **WHEN** auto-sync is enabled and a library mutation completes successfully
- **THEN** the application automatically commits and pushes the change to the central Library Repo

#### Scenario: External source repository is present
- **WHEN** the application manages one or more Git-imported external source repositories
- **THEN** automatic commit and push behavior is not applied to those source repositories
