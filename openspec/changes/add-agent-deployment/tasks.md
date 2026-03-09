## 1. Agent Path Support

- [x] 1.1 Add default global path resolution for Codex and Claude Code across supported operating systems.
- [x] 1.2 Persist configurable global agent paths in settings and validate them before deployment.

## 2. Deployment Workflows

- [x] 2.1 Implement install and update flows that copy a library skill into the selected agent directory.
- [x] 2.2 Persist platform binding records, deployment timestamps, and deployment status for each installed agent.
- [x] 2.3 Implement uninstall so it removes the deployed copy but leaves the library skill intact.
- [x] 2.4 Implement delete so it removes the library skill and clears related platform bindings.

## 3. Verification

- [x] 3.1 Verify one library skill can be installed into Codex, Claude Code, or both independently.
- [x] 3.2 Verify uninstall leaves the library record intact and delete removes both the record and tracked bindings.
