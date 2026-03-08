## 1. Desktop Foundation

- [ ] 1.1 Create the Electrobun desktop app scaffold with a React and TypeScript renderer entry point.
- [ ] 1.2 Add startup services for resolving the app data root and ensuring the default `~/.skillkeeper` directory structure exists.
- [ ] 1.3 Add baseline settings loading and default settings creation during first launch.

## 2. Environment Readiness

- [ ] 2.1 Implement system Git detection and capture executable path plus diagnostic failure information.
- [ ] 2.2 Expose boot status and Git readiness from the shell layer to the renderer.
- [ ] 2.3 Add a minimal shell UI state for startup success, startup failure, and missing Git.

## 3. Verification

- [ ] 3.1 Verify startup on Windows, macOS, and Linux creates the expected local data root.
- [ ] 3.2 Verify the app reports a clear state when Git is missing or not executable.
