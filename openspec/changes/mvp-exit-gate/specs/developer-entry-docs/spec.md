## MODIFIED Requirements

### Requirement: README documents current limits and supporting references
The README SHALL keep a concise summary of MVP status and link maintainers to the delivery plan, MVP readiness guide, and PRD implementation matrix.

#### Scenario: Developer checks current release status
- **WHEN** a developer reads `README.MD`
- **THEN** they can see that MVP exit depends on the documented readiness gate and can follow links to the delivery plan, readiness guide, and PRD implementation matrix

### Requirement: Repository provides a persistent delivery plan for collaboration and handoff
The repository SHALL keep `docs/delivery-plan.md` aligned with the active OpenSpec change and the current release blockers.

#### Scenario: MVP Exit Gate becomes the active focus
- **WHEN** Baseline closure is complete and `mvp-exit-gate` is opened
- **THEN** `docs/delivery-plan.md` identifies `MVP Exit Gate` as the current focus, names the CI and PRD-matrix blockers, and points maintainers at the active change

### Requirement: Repository documents the MVP exit gate
The repository SHALL document how MVP readiness is evaluated, where CI smoke evidence is produced, and where PRD completion is tracked.

#### Scenario: Another agent needs release-gate context
- **WHEN** an agent reads the delivery and readiness docs
- **THEN** they can identify the CI workflow, the readiness artifacts, the MVP exit criteria, and the PRD implementation matrix without reconstructing the process from past changes
