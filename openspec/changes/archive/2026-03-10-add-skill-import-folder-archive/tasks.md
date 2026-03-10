## 1. Import Pipeline

- [x] 1.1 Implement folder selection and archive selection entry points for the desktop UI and shell layer.
- [x] 1.2 Add safe extraction for `zip` and `tar.gz` sources into temporary working directories.
- [x] 1.3 Implement a shared scanner that discovers multiple candidate skills from folder and archive sources.

## 2. Validation and Persistence

- [x] 2.1 Add validation that requires `SKILL.md` and rejects invalid skill structures.
- [x] 2.2 Add script detection for `.sh`, `.ps1`, and `.bat` with warning-level findings.
- [x] 2.3 Copy selected skills into the central library and create corresponding library records.

## 3. Verification

- [x] 3.1 Verify a source containing multiple valid skills is presented as selectable import candidates.
- [x] 3.2 Verify invalid structures are blocked and script-bearing skills show a warning that can be acknowledged.
