## ADDED Requirements

### Requirement: Application detects sync conflicts for the central Library Repo
The application SHALL detect when the central Library Repo enters a conflicted state after a sync operation.

#### Scenario: Pull or merge results in conflicts
- **WHEN** a sync operation against the central Library Repo produces Git conflicts
- **THEN** the application records the repository as conflicted and captures the affected file paths

### Requirement: Application presents conflict recovery guidance
The application SHALL present a Sync Center workflow that shows conflict details and supported recovery actions.

#### Scenario: User opens Sync Center while conflicts exist
- **WHEN** the central Library Repo has unresolved conflicts
- **THEN** Sync Center shows the conflicted files, recent sync failure context, and recovery actions supported by the MVP

### Requirement: Application exposes unresolved conflict summary state
The application SHALL expose unresolved conflict status to summary views outside Sync Center.

#### Scenario: Dashboard summarizes current sync health
- **WHEN** unresolved sync conflicts exist in the central Library Repo
- **THEN** the application displays a conflict indicator in summary views until the conflict is resolved
