## ADDED Requirements

### Requirement: Repository maintains stable main specs for implemented capabilities
The repository SHALL maintain main specs under `openspec/specs/` for the implemented SkillKeeper capabilities instead of relying only on completed or archived change artifacts.

#### Scenario: Main spec baseline is created
- **WHEN** the main spec sync work is completed
- **THEN** `openspec/specs/` contains stable specs for the implemented desktop shell, local library model, skill import, git import tracking, agent deployment, library management UI, library sync, sync conflict UI, dashboard settings UI, and MVP readiness capabilities

### Requirement: Main specs reflect implemented behavior rather than superseded planning assumptions
The main specs SHALL describe the implemented SkillKeeper behavior and SHALL NOT reintroduce superseded PRD assumptions such as `Go + Wails` as the active implementation model.

#### Scenario: Main specs are reviewed against the current codebase
- **WHEN** a maintainer compares `openspec/specs/` with the implemented repository behavior
- **THEN** the specs match the observable product behavior, current agent support, and current validation status

### Requirement: Completed changes are archived after main spec sync verification
Completed active changes SHALL be archived only after their stable observable requirements are represented in the main spec baseline and checked for consistency.

#### Scenario: Completed changes are retired
- **WHEN** completed active changes are prepared for archive
- **THEN** their corresponding requirements are already represented in `openspec/specs/`, mismatches have been reviewed, and `openspec list --json` no longer shows completed active changes after archive
