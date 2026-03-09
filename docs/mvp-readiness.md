# MVP Readiness

Last updated: 2026-03-09

## Acceptance checklist

SkillKeeper treats MVP readiness as a release gate across the full workflow, not just feature-by-feature completeness. The dashboard checklist and the JSON report both evaluate these same items:

- Bootstrap: managed paths, settings, and Git readiness load without blocking failures.
- Import workflow: at least one folder, archive, or Git source can be scanned and imported into the library.
- Library management: imported skills can be listed and opened in detail views.
- Deployment: at least one library skill can be installed to an agent target path.
- Library sync: the managed Library Repo can initialize and complete a sync.
- Conflict recovery: unresolved Library Repo conflicts are surfaced and block release until cleared.

## User-visible polish expectations

This polish pass standardizes two UI expectations:

- Action failures render as a global error panel, so settings, sync, deployment, and import failures are all visible regardless of the active page.
- Empty states use shared copy for the library, detail panel, sync jobs, sync conflicts, deployments, file tree, markdown preview, and Git history.

## Smoke tests

Command:

```bash
bun run readiness:report
```

### Windows

Executed on 2026-03-09 in the current Windows workspace. The generated report is stored at [mvp-readiness-report.json](C:/Users/tingzhen/Documents/GitHub/skillkeeper/docs/mvp-readiness-report.json).

- `bootstrap-and-settings`: passed
- `folder-import`: passed
- `git-clone-scan`: passed
- `deployment-and-library-management`: passed
- `library-sync`: passed

### macOS

Defined workflow:

1. Run `bun install`.
2. Run `bun run readiness:report`.
3. Verify the same five smoke steps pass.
4. Confirm the generated report shows `platform: darwin`.

Status on 2026-03-09: not executed in this Windows-only environment. Release remains blocked until a native macOS run is recorded.

### Linux

Defined workflow:

1. Run `bun install`.
2. Run `bun run readiness:report`.
3. Verify the same five smoke steps pass.
4. Confirm the generated report shows `platform: linux`.

Status on 2026-03-09: not executed in this Windows-only environment. Release remains blocked until a native Linux run is recorded.

## Conflict recovery coverage

Conflict handling is covered by automated integration tests in [service.test.ts](C:/Users/tingzhen/Documents/GitHub/skillkeeper/src/bun/sync/service.test.ts), including:

- detection of unmerged files
- persistence of conflict detail
- clearing conflict state after manual resolution

## PRD metric validation

Measured from the 2026-03-09 Windows readiness report:

- Import time: `14.29 ms` against target `< 10,000 ms`
- Clone + scan time: `534.64 ms` against target `< 60,000 ms`
- Deployment reliability: `20 / 20` successful update attempts = `100%` against target `> 95%`

Current result: all three PRD targets pass in the representative local benchmark.

## Known gaps

- macOS and Linux smoke runs are defined but not yet executed natively.
- The clone benchmark uses a local bare Git remote, so it excludes network latency and credential prompts.
- Deployment reliability currently validates managed file-copy behavior only; it does not exercise live agent execution.
