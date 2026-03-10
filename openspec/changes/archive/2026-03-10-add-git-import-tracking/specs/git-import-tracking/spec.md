## ADDED Requirements

### Requirement: Application imports skills from Git repositories
The application SHALL allow users to import skills from a Git repository by providing a repository URL.

#### Scenario: Repository URL is cloned successfully
- **WHEN** a user submits a reachable Git repository URL
- **THEN** the application clones the repository into managed storage and scans it for importable skills

### Requirement: Application tracks source repositories at repository scope
The application SHALL track upstream metadata and status once per imported source repository rather than once per skill.

#### Scenario: Multiple skills come from one source repository
- **WHEN** a cloned repository contains more than one imported skill
- **THEN** the application links each skill to the same repository tracking record

### Requirement: Application treats external source repositories as read-only
The application SHALL not initiate commit or push operations against imported external repositories by default.

#### Scenario: User views an imported external repository
- **WHEN** the application presents repository actions for a Git-imported source
- **THEN** the available actions exclude app-driven commit and push operations

### Requirement: Application exposes upstream state for tracked repositories
The application SHALL surface upstream state for tracked repositories, including ahead, behind, and conflict conditions.

#### Scenario: Repository is behind its upstream
- **WHEN** a tracked repository has upstream commits that are not present locally
- **THEN** the application displays the repository as behind and makes refresh or pull actions available
