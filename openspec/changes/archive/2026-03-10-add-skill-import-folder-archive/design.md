## Context

The MVP requires users to import skills from folders and archives before any Git or deployment workflows matter. Import behavior also sets the security and validation posture for all later intake paths.

## Goals / Non-Goals

**Goals:**
- Support folder import and archive import for `zip` and `tar.gz`.
- Scan a selected source for multiple valid skills.
- Block invalid structures and warn on executable scripts.
- Materialize imported skills into the central library storage.

**Non-Goals:**
- Import directly from remote Git repositories.
- Modify source files in place after import.
- Execute scripts or validate their runtime behavior.

## Decisions

- Normalize folder and archive sources into a shared scanner pipeline so validation logic stays identical regardless of source type.
- Detect skills by locating directories that contain `SKILL.md` and meet the required structure, then present the candidate list to the user before import.
- Copy imported content into the library rather than referencing the original folder path so later deployment and sync workflows operate on managed files.
- Treat `.sh`, `.ps1`, and `.bat` as warning-level findings, while missing `SKILL.md` or invalid structure remain blocking errors.

## Risks / Trade-offs

- [Archive extraction can expose path traversal or invalid file names] -> Use safe extraction rules that reject unsafe paths before scanning.
- [Recursive scanning can produce false positives in nested folders] -> Require a valid skill root and present discovered candidates for explicit user choice.
- [Copying imported files increases disk usage] -> Favor isolation and deterministic library ownership over minimal storage.
