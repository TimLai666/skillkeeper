## ADDED Requirements

### Requirement: Application deploys skills to supported agents
The application SHALL install managed library skills into the global skill directories for supported agents.

#### Scenario: User installs a skill into Codex
- **WHEN** a user installs a managed skill into Codex
- **THEN** the application copies the skill into the configured Codex global skill directory and records the deployment binding

#### Scenario: User installs a skill into Claude Code
- **WHEN** a user installs a managed skill into Claude Code
- **THEN** the application copies the skill into the configured Claude Code global skill directory and records the deployment binding

### Requirement: Application updates deployed skill copies from the library
The application SHALL update a deployed skill by copying the current library version into the target agent directory.

#### Scenario: User updates an installed skill
- **WHEN** a user requests an update for an already installed skill
- **THEN** the application refreshes the deployed agent copy from the current library contents

### Requirement: Application separates uninstall from delete
The application SHALL treat uninstall and delete as separate user actions with different outcomes.

#### Scenario: User uninstalls a deployed skill
- **WHEN** a user uninstalls a skill from an agent
- **THEN** the application removes the deployed copy from that agent and keeps the library skill record

#### Scenario: User deletes a library skill
- **WHEN** a user deletes a skill from SkillKeeper
- **THEN** the application removes the library-managed skill and clears related deployment bindings
