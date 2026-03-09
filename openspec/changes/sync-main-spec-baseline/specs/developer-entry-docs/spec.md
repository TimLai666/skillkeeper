## ADDED Requirements

### Requirement: Repository provides a usable developer entry document
The repository SHALL include a README that explains what SkillKeeper is, what implementation stack it currently uses, and what scope of the MVP is already available.

#### Scenario: Developer opens the repository for the first time
- **WHEN** a developer reads `README.MD`
- **THEN** they can identify the product purpose, current implementation stack, MVP coverage, and the fact that PRD scope is not yet 100 percent complete

### Requirement: README documents how to run and verify the application
The README SHALL list the required local tooling and the supported commands for installing dependencies, running the app, building the app, and verifying the current codebase.

#### Scenario: Developer needs to boot or validate the project
- **WHEN** a developer follows the commands documented in `README.MD`
- **THEN** the documented commands match the actual `package.json` scripts for install, development, build, typecheck, test, and readiness reporting

### Requirement: README documents current limits and supporting references
The README SHALL state the current implementation limits and link to the repository documents that explain readiness and product requirements.

#### Scenario: Developer checks current limitations
- **WHEN** a developer reads the README limitations and references sections
- **THEN** they can see the current path limitation, read-only source repo rule, pending macOS/Linux smoke validation, pending main-spec baseline work, and links to MVP readiness and PRD documents
