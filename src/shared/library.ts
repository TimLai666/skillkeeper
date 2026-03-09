export type SkillSourceKind = "folder" | "archive" | "git" | "manual";
export type SkillStatus = "draft" | "ready" | "missing_files" | "deleted";
export type UpstreamStatus = "unknown" | "ahead" | "behind" | "conflict" | "synced";
export type PlatformName = "codex" | "claude-code";
export type PlatformInstallStatus = "installed" | "stale" | "failed" | "removed";
export type SyncJobStatus = "pending" | "running" | "succeeded" | "failed" | "conflicted";

export interface GitBindingRecord {
  id: string;
  repoPath: string;
  remoteUrl: string | null;
  defaultBranch: string | null;
  isReadOnly: boolean;
  upstreamStatus: UpstreamStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SkillRecord {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  sourceKind: SkillSourceKind;
  sourcePath: string | null;
  libraryPath: string;
  status: SkillStatus;
  gitBindingId: string | null;
  createdAt: string;
  updatedAt: string;
  lastSeenAt: string;
}

export interface PlatformBindingRecord {
  id: string;
  skillId: string;
  platform: PlatformName;
  installPath: string;
  installStatus: PlatformInstallStatus;
  installedAt: string | null;
  updatedAt: string;
}

export interface SyncJobRecord {
  id: string;
  targetScope: "library" | "source-repo";
  targetId: string | null;
  status: SyncJobStatus;
  startedAt: string;
  completedAt: string | null;
  detail: string | null;
}

export interface LibrarySettingRecord<T = unknown> {
  key: string;
  value: T;
  updatedAt: string;
}
