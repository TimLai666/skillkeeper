## ADDED Requirements

### Requirement: Application imports skills from folders and archives
The application SHALL allow users to import skills from local folders, `zip` archives, and `tar.gz` archives into the central Skill Library.

#### Scenario: User imports from a local folder
- **WHEN** a user selects a local folder that contains one or more valid skills
- **THEN** the application scans the folder and offers the detected skills for import into the library

#### Scenario: User imports from a supported archive
- **WHEN** a user selects a `zip` or `tar.gz` archive that contains one or more valid skills
- **THEN** the application extracts the archive safely, scans for skills, and offers the detected skills for import

### Requirement: Application validates skill structure during import
The application SHALL reject import candidates that do not contain `SKILL.md` or do not satisfy the required skill folder structure.

#### Scenario: Candidate is missing SKILL.md
- **WHEN** a scanned candidate folder does not contain `SKILL.md`
- **THEN** the application marks the candidate as invalid and prevents it from being imported

### Requirement: Application warns about executable scripts
The application SHALL warn users when an import candidate contains executable script files with `.sh`, `.ps1`, or `.bat` extensions.

#### Scenario: Candidate contains executable scripts
- **WHEN** a scanned import candidate contains one or more files with `.sh`, `.ps1`, or `.bat` extensions
- **THEN** the application displays a warning and allows the user to decide whether to continue importing that candidate
