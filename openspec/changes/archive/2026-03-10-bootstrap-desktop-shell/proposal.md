## Why

SkillKeeper needs a stable desktop application foundation before any library, Git, or deployment features can be built. The MVP requires a cross-platform shell, persistent local settings, predictable startup behavior, and a way to detect whether the host machine can run Git-backed workflows.

## What Changes

- Establish the desktop application scaffold using Electrobun, React, TypeScript, and SQLite-ready local storage.
- Initialize the default `~/.skillkeeper` directory and baseline settings on first launch.
- Detect the system Git executable during startup and expose readiness state to the application.
- Define the initial application lifecycle for boot, config load, environment checks, and error reporting.

## Capabilities

### New Capabilities
- `desktop-shell`: Desktop bootstrap, startup lifecycle, local app data initialization, and Git readiness detection.

### Modified Capabilities

## Impact

- Adds the base runtime structure for the desktop application.
- Introduces startup contracts used by all later change sets.
- Establishes the first local persistence and environment detection flow.
