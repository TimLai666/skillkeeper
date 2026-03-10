## ADDED Requirements

### Requirement: Application stores skills in a central library
The application SHALL maintain a central Skill Library that records every managed skill before it is deployed to an agent.

#### Scenario: Skill record is created in the library
- **WHEN** a later workflow imports a valid skill into SkillKeeper
- **THEN** the application stores a library record that uniquely identifies the skill and its source metadata

### Requirement: Application persists library metadata in SQLite
The application SHALL persist library metadata in a local SQLite database under the SkillKeeper data root.

#### Scenario: Local database initializes on first use
- **WHEN** SkillKeeper starts without an existing library database
- **THEN** the application creates the SQLite database and required schema for MVP library workflows

### Requirement: Application tracks repository and platform relationships separately
The application SHALL store source repository bindings and agent deployment bindings as records separate from the core skill record.

#### Scenario: Skill has source and deployment relationships
- **WHEN** a managed skill is linked to a source repository and installed into one or more agents
- **THEN** the application stores repository and platform binding records without duplicating the core skill identity
