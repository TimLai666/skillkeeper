## ADDED Requirements

### Requirement: Repository provides a concise developer entry document
The repository SHALL include a README that explains what SkillKeeper is, what implementation stack it currently uses, what scope of the MVP is already available, and where to find the persistent delivery plan.

#### Scenario: Developer opens the repository for the first time
- **WHEN** a developer reads `README.MD`
- **THEN** they can identify the product purpose, current implementation stack, MVP coverage, the fact that PRD scope is not yet 100 percent complete, and the link to `docs/delivery-plan.md`

### Requirement: README documents how to run and verify the application
The README SHALL list the required local tooling and the supported commands for installing dependencies, running the app, building the app, and verifying the current codebase.

#### Scenario: Developer needs to boot or validate the project
- **WHEN** a developer follows the commands documented in `README.MD`
- **THEN** the documented commands match the actual `package.json` scripts for install, development, build, typecheck, test, and readiness reporting

### Requirement: README documents current limits and supporting references
The README SHALL state the current implementation limits and link to the repository documents that explain readiness and product requirements.

#### Scenario: Developer checks current limitations
- **WHEN** a developer reads the README limitations and references sections
- **THEN** they can see the current path limitation, read-only source repo rule, pending macOS/Linux smoke validation, pending main-spec baseline work, and links to the delivery plan, MVP readiness, and PRD documents

### Requirement: Repository provides a persistent delivery plan for collaboration and handoff
The repository SHALL include `docs/delivery-plan.md` as the authoritative collaboration document for current focus, blockers, next deliverable, exit criteria, related OpenSpec changes, and the last verified state.

#### Scenario: Another agent needs to continue work
- **WHEN** an agent or maintainer reads `docs/delivery-plan.md`
- **THEN** they can identify the current milestone, the active change, the current blockers, the next concrete deliverable, the exit criteria for the current milestone, and the commands most recently used to verify project state
