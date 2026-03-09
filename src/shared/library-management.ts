import type { GitBindingRecord, PlatformBindingRecord, SkillRecord } from "./library";

export interface FileTreeEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeEntry[];
}

export interface GitHistoryEntry {
  commitHash: string;
  summary: string;
}

export interface LibrarySkillSummary {
  skill: SkillRecord;
  gitBinding: GitBindingRecord | null;
  deployments: PlatformBindingRecord[];
  installedAgents: string[];
}

export interface SkillDetail {
  skill: SkillRecord;
  gitBinding: GitBindingRecord | null;
  deployments: PlatformBindingRecord[];
  fileTree: FileTreeEntry[];
  skillMarkdownPreview: string;
  gitHistory: GitHistoryEntry[];
}

export interface SkillDeletionResult {
  skillId: string;
}
