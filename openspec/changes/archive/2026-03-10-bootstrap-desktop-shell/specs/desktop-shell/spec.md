## ADDED Requirements

### Requirement: Desktop application bootstraps local state
The application SHALL initialize a local SkillKeeper data root on first launch before rendering feature workflows.

#### Scenario: First launch creates default data root
- **WHEN** the application starts on a machine without an existing SkillKeeper data directory
- **THEN** the application creates the default local data root and baseline files needed for later features

### Requirement: Desktop application exposes startup readiness
The application SHALL expose a startup readiness state that indicates whether boot completed successfully or failed.

#### Scenario: Boot completes successfully
- **WHEN** the application resolves paths, initializes local files, and loads default settings without error
- **THEN** the renderer receives a ready state that allows feature pages to load

### Requirement: Desktop application detects system Git availability
The application SHALL detect whether a usable system Git executable is available during startup.

#### Scenario: Git executable is available
- **WHEN** the host machine has a callable Git executable
- **THEN** the application records Git as available and exposes the executable path or equivalent readiness details

#### Scenario: Git executable is unavailable
- **WHEN** the host machine does not have a callable Git executable
- **THEN** the application records Git as unavailable and exposes a diagnostic message for the UI
