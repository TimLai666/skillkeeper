## 1. Desktop Foundation

- [x] 1.1 Create the Electrobun desktop app scaffold with a React and TypeScript renderer entry point.
- [x] 1.2 Add startup services for resolving the app data root and ensuring the default `~/.skillkeeper` directory structure exists.
- [x] 1.3 Add baseline settings loading and default settings creation during first launch.

## 2. Environment Readiness

- [x] 2.1 Implement system Git detection and capture executable path plus diagnostic failure information.
- [x] 2.2 Expose boot status and Git readiness from the shell layer to the renderer.
- [x] 2.3 Add a minimal shell UI state for startup success, startup failure, and missing Git.

## 3. Verification

- [x] 3.1 Verify startup on Windows, macOS, and Linux creates the expected local data root.
- [x] 3.2 Verify the app reports a clear state when Git is missing or not executable.
