## ADDED Requirements

### Requirement: Application provides a Dashboard summary view
The application SHALL provide a Dashboard that summarizes total skills, Git updates, and current sync status.

#### Scenario: User opens Dashboard
- **WHEN** a user opens the Dashboard page
- **THEN** the application displays summary information for total managed skills, available Git updates, and current sync health

### Requirement: Application provides global settings for agent paths and sync behavior
The application SHALL provide a Settings page for configuring global agent paths and Library Repo auto-sync behavior.

#### Scenario: User updates agent paths
- **WHEN** a user edits the Codex or Claude Code global path in Settings and saves a valid path
- **THEN** the application persists the updated path and uses it for later deployment operations

#### Scenario: User updates auto-sync behavior
- **WHEN** a user enables or disables Library Repo auto-sync in Settings
- **THEN** the application persists the setting and uses it to control later automatic commit and push behavior

### Requirement: Application explains Git authentication behavior
The application SHALL explain that Git authentication uses the system Git environment rather than in-app credential storage.

#### Scenario: User views Git settings
- **WHEN** a user opens the Settings page section for Git behavior
- **THEN** the application states that Git authentication and credentials are provided by the host system configuration
