## MODIFIED Requirements

### Requirement: MVP supports smoke-tested operation on all target platforms
The application SHALL pass smoke tests on Windows, macOS, and Linux through a GitHub Actions matrix that runs the repository verification entrypoints on native runners.

#### Scenario: CI smoke matrix executes
- **WHEN** the MVP release-gate workflow runs on `windows-latest`, `macos-latest`, and `ubuntu-latest`
- **THEN** each platform job runs `bun install`, `bun run typecheck`, `bun test`, and `bun run readiness:report`

#### Scenario: A smoke step fails
- **WHEN** any required smoke command fails on a platform runner
- **THEN** that platform job fails and the MVP gate does not pass

### Requirement: MVP readiness evidence is preserved per platform
The application SHALL preserve machine-readable readiness evidence for each successful platform run.

#### Scenario: A platform smoke job succeeds
- **WHEN** a platform completes the release-gate workflow successfully
- **THEN** the workflow uploads a readiness artifact named for that platform and containing the generated readiness evidence

### Requirement: MVP aligns with committed success metrics
The application SHALL maintain a repo-tracked PRD implementation matrix that records the completion state and evidence for the PRD requirements, including the accepted success metrics.

#### Scenario: Maintainer reviews MVP completion
- **WHEN** a maintainer reviews MVP readiness for release
- **THEN** the repo contains a PRD implementation matrix that classifies each requirement, cites evidence, and highlights remaining gaps or deliberate divergences
