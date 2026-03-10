## ADDED Requirements

### Requirement: Application lists managed skills in the library
The application SHALL present a Skills Library view that lists managed skills and their current summary metadata.

#### Scenario: User opens the Skills Library view
- **WHEN** the application has one or more managed skills in the central library
- **THEN** the Skills Library view shows each skill's name, description, source, Git status, installed agents, and last update

### Requirement: Application shows detailed skill information
The application SHALL provide a Skill Detail view with library-managed file and status information for a selected skill.

#### Scenario: User opens a managed skill
- **WHEN** a user selects a skill from the Skills Library view
- **THEN** the application shows metadata, file tree, `SKILL.md` preview, and Git history for the library-managed skill

### Requirement: Application edits app-managed metadata without rewriting source files
The application SHALL persist editable metadata fields separately from the original skill files.

#### Scenario: User edits the display name or description
- **WHEN** a user saves changes to editable metadata fields for a managed skill
- **THEN** the application updates the app-managed metadata record and leaves the original skill files unchanged
