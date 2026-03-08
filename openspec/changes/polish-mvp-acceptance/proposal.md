## Why

The preceding changes establish MVP functionality, but the release still needs a final pass that aligns observable behavior, error handling, and performance with the product commitments in the PRD. This change captures the cross-cutting acceptance bar so implementation does not stop at feature completeness alone.

## What Changes

- Define the MVP readiness capability that covers cross-flow validation and release-quality checks.
- Add explicit acceptance criteria for import, deployment, sync, and conflict recovery flows.
- Add smoke-test expectations for Windows, macOS, and Linux.
- Align error handling and timing expectations with the PRD success metrics.

## Capabilities

### New Capabilities
- `mvp-readiness`: Cross-flow acceptance criteria, smoke tests, and PRD-aligned release quality thresholds.

### Modified Capabilities

## Impact

- Adds the release gate for the MVP.
- Connects feature-level changes to measurable acceptance criteria.
- Creates a final verification target before archiving the MVP work.
