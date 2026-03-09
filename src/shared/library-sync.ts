import type { SyncJobRecord } from "./library";

export interface LibraryRepoState {
  repoPath: string;
  remoteUrl: string | null;
  defaultBranch: string;
  isInitialized: boolean;
}

export interface LibrarySyncStatus {
  repo: LibraryRepoState;
  recentJobs: SyncJobRecord[];
}
