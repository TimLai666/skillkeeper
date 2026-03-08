## Why

SkillKeeper needs a core library management experience so users can inspect managed skills after import and before deployment. Without a dedicated library UI, the central model and import flows remain invisible and hard to operate.

## What Changes

- Add the Skills Library list view and Skill Detail view.
- Show metadata, source, Git status, installed agents, and last update information.
- Add metadata editing for app-managed fields without modifying original skill files.
- Show file tree, `SKILL.md` preview, and Git history context.

## Capabilities

### New Capabilities
- `library-management-ui`: Skills Library and Skill Detail interfaces for browsing and editing managed skills.

### Modified Capabilities

## Impact

- Adds the main day-to-day skill management surface.
- Consumes library records, Git tracking state, and deployment bindings.
- Defines how app-managed metadata edits are presented and saved.
