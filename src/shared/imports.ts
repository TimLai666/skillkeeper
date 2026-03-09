import type { GitBindingRecord } from "./library";

export type ImportSourceKind = "folder" | "archive" | "git";
export type ArchiveFormat = "zip" | "tar.gz";
export type ImportDialogKind = "folder" | "archive";
export type ImportIssueSeverity = "warning" | "blocking";

export interface ImportIssue {
  severity: ImportIssueSeverity;
  code:
    | "missing-skill-md"
    | "invalid-optional-directory"
    | "executable-script"
    | "archive-path-traversal"
    | "unknown-source";
  message: string;
  relativePath: string | null;
}

export interface ImportCandidate {
  id: string;
  name: string;
  rootPath: string;
  relativePath: string;
  canImport: boolean;
  blockingIssues: ImportIssue[];
  warnings: ImportIssue[];
  detectedScripts: string[];
}

export interface ImportScanResult {
  sessionId: string;
  sourceKind: ImportSourceKind;
  archiveFormat: ArchiveFormat | null;
  sourcePath: string;
  extractionPath: string | null;
  candidates: ImportCandidate[];
  trackedRepository: GitBindingRecord | null;
}

export interface ImportedSkillRecord {
  skillId: string;
  slug: string;
  displayName: string;
  libraryPath: string;
}

export interface ImportCommitResult {
  imported: ImportedSkillRecord[];
  skipped: {
    candidateId: string;
    reason: string;
  }[];
}
