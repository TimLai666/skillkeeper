## Why

The product cannot function as a skill manager until users can bring local skill content into the library. Folder and archive import define the first real user-facing workflow and establish the validation rules that protect the library from malformed content.

## What Changes

- Add folder import for locally selected directories.
- Add archive import for `zip` and `tar.gz` packages.
- Scan import sources for one or more valid skills and let the user choose what to import.
- Validate structure, require `SKILL.md`, and warn on executable scripts.

## Capabilities

### New Capabilities
- `skill-import`: Folder and archive import, multi-skill scanning, structural validation, and script warnings.

### Modified Capabilities

## Impact

- Introduces the first end-user library mutation flow.
- Defines how invalid content is blocked and how risky content is surfaced.
- Depends on the desktop shell and local library data model.
