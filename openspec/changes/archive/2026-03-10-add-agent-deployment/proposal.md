## Why

SkillKeeper's value depends on turning library skills into usable agent-installed skills. This change defines how the MVP deploys managed skills into Codex and Claude Code without conflating deployment removal with library deletion.

## What Changes

- Add deployment support for Codex and Claude Code global skill directories.
- Copy library skills into agent directories for install and update flows.
- Track installed agent bindings and deployment timestamps.
- Separate uninstall behavior from permanent library deletion.

## Capabilities

### New Capabilities
- `agent-deployment`: Install, update, uninstall, and delete workflows for Codex and Claude Code.

### Modified Capabilities

## Impact

- Adds the first path from managed library content to live agent usage.
- Introduces platform binding state and agent path configuration.
- Creates the behavioral distinction between uninstall and delete.
