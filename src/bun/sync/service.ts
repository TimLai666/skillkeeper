import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import type { AppSettings, ManagedPaths } from "../../shared/bootstrap";
import type { SyncJobRecord } from "../../shared/library";
import type { LibraryRepoState, LibrarySyncStatus } from "../../shared/library-sync";
import { initializeLibraryStore } from "../library/store";

const LIBRARY_REPO_SETTING_KEY = "sync.libraryRepo";
const LIBRARY_CONFLICT_SETTING_KEY = "sync.libraryConflict";

function normalizeStdout(output: string | Buffer | null | undefined): string {
  if (typeof output === "string") {
    return output;
  }

  if (!output) {
    return "";
  }

  return output.toString("utf8");
}

function runGit(args: string[], cwd: string) {
  return spawnSync("git", args, {
    cwd,
    encoding: "utf8"
  });
}

function ensureGitSuccess(result: ReturnType<typeof spawnSync>, fallbackMessage: string): string {
  if (result.status !== 0) {
    throw new Error(normalizeStdout(result.stderr).trim() || fallbackMessage);
  }

  return normalizeStdout(result.stdout).trim();
}

function defaultRepoState(managedPaths: ManagedPaths): LibraryRepoState {
  return {
    repoPath: managedPaths.library,
    remoteUrl: null,
    defaultBranch: "main",
    isInitialized: false
  };
}

function defaultConflictState(): LibrarySyncStatus["conflict"] {
  return {
    hasConflict: false,
    conflictedFiles: [],
    lastFailureDetail: null,
    updatedAt: null
  };
}

function detectDefaultBranch(repoPath: string): string {
  const symbolicRef = runGit(["symbolic-ref", "--short", "HEAD"], repoPath);
  if (symbolicRef.status === 0) {
    return normalizeStdout(symbolicRef.stdout).trim() || "main";
  }

  const revParse = runGit(["rev-parse", "--abbrev-ref", "HEAD"], repoPath);
  if (revParse.status === 0) {
    return normalizeStdout(revParse.stdout).trim() || "main";
  }

  return "main";
}

export class LibrarySyncService {
  constructor(private readonly managedPaths: ManagedPaths) {}

  getLibraryRepoState(): LibraryRepoState {
    const store = initializeLibraryStore(this.managedPaths);

    try {
      return (
        store.getSetting<LibraryRepoState>(LIBRARY_REPO_SETTING_KEY)?.value ??
        defaultRepoState(this.managedPaths)
      );
    } finally {
      store.close();
    }
  }

  getLibrarySyncStatus(): LibrarySyncStatus {
    const store = initializeLibraryStore(this.managedPaths);

    try {
      return {
        repo:
          store.getSetting<LibraryRepoState>(LIBRARY_REPO_SETTING_KEY)?.value ??
          defaultRepoState(this.managedPaths),
        conflict:
          store.getSetting<LibrarySyncStatus["conflict"]>(LIBRARY_CONFLICT_SETTING_KEY)?.value ??
          defaultConflictState(),
        recentJobs: store.listSyncJobsByScope("library")
      };
    } finally {
      store.close();
    }
  }

  refreshConflictStatus(): LibrarySyncStatus {
    const repo = this.getLibraryRepoState();
    const conflict = repo.isInitialized
      ? this.inspectConflictState(repo.repoPath)
      : defaultConflictState();
    const store = initializeLibraryStore(this.managedPaths);

    try {
      store.setSetting(LIBRARY_CONFLICT_SETTING_KEY, conflict);
    } finally {
      store.close();
    }

    return this.getLibrarySyncStatus();
  }

  initializeLibraryRepo(remoteUrl?: string | null): LibraryRepoState {
    mkdirSync(this.managedPaths.library, { recursive: true });

    if (!existsSync(this.managedPaths.library)) {
      throw new Error("Library directory is unavailable.");
    }

    if (!existsSync(join(this.managedPaths.library, ".git"))) {
      ensureGitSuccess(
        runGit(["init", "-b", "main"], this.managedPaths.library),
        "Failed to initialize the Library Repo."
      );
    }

    const normalizedRemoteUrl = remoteUrl?.trim() || null;
    if (normalizedRemoteUrl) {
      const remoteCheck = runGit(["remote", "get-url", "origin"], this.managedPaths.library);
      if (remoteCheck.status === 0) {
        ensureGitSuccess(
          runGit(["remote", "set-url", "origin", normalizedRemoteUrl], this.managedPaths.library),
          "Failed to update the Library Repo remote."
        );
      } else {
        ensureGitSuccess(
          runGit(["remote", "add", "origin", normalizedRemoteUrl], this.managedPaths.library),
          "Failed to connect the Library Repo remote."
        );
      }
    }

    const repoState: LibraryRepoState = {
      repoPath: this.managedPaths.library,
      remoteUrl:
        normalizedRemoteUrl ??
        (runGit(["remote", "get-url", "origin"], this.managedPaths.library).status === 0
          ? normalizeStdout(
              runGit(["remote", "get-url", "origin"], this.managedPaths.library).stdout
            ).trim()
          : null),
      defaultBranch:
        detectDefaultBranch(this.managedPaths.library),
      isInitialized: true
    };

    const store = initializeLibraryStore(this.managedPaths);
    try {
      store.setSetting(LIBRARY_REPO_SETTING_KEY, repoState);
    } finally {
      store.close();
    }

    return repoState;
  }

  fetchLibraryRepo(): void {
    const repo = this.getLibraryRepoState();
    if (!repo.isInitialized) {
      throw new Error("Library Repo is not initialized.");
    }
    if (!repo.remoteUrl) {
      return;
    }

    ensureGitSuccess(runGit(["fetch", "origin"], repo.repoPath), "Failed to fetch the Library Repo.");
  }

  pullLibraryRepo(): void {
    const repo = this.getLibraryRepoState();
    if (!repo.isInitialized) {
      throw new Error("Library Repo is not initialized.");
    }
    if (!repo.remoteUrl) {
      return;
    }

    const remoteBranch = runGit(
      ["ls-remote", "--heads", "origin", repo.defaultBranch],
      repo.repoPath
    );
    if (remoteBranch.status !== 0 || !normalizeStdout(remoteBranch.stdout).trim()) {
      return;
    }

    ensureGitSuccess(
      runGit(["pull", "--rebase", "origin", repo.defaultBranch], repo.repoPath),
      "Failed to pull the Library Repo."
    );
  }

  commitLibraryRepo(message: string): boolean {
    const repo = this.getLibraryRepoState();
    if (!repo.isInitialized) {
      throw new Error("Library Repo is not initialized.");
    }
    ensureGitSuccess(runGit(["add", "."], repo.repoPath), "Failed to stage Library Repo changes.");
    const status = ensureGitSuccess(
      runGit(["status", "--porcelain"], repo.repoPath),
      "Failed to inspect Library Repo status."
    );

    if (!status.trim()) {
      return false;
    }

    ensureGitSuccess(runGit(["commit", "-m", message], repo.repoPath), "Failed to commit Library Repo changes.");
    return true;
  }

  pushLibraryRepo(): void {
    const repo = this.getLibraryRepoState();
    if (!repo.isInitialized) {
      throw new Error("Library Repo is not initialized.");
    }
    if (!repo.remoteUrl) {
      return;
    }

    ensureGitSuccess(
      runGit(["push", "-u", "origin", repo.defaultBranch], repo.repoPath),
      "Failed to push the Library Repo."
    );
  }

  syncLibraryRepo(message: string): SyncJobRecord {
    const repo = this.getLibraryRepoState();
    const store = initializeLibraryStore(this.managedPaths);
    const job = store.createSyncJob({
      targetScope: "library",
      targetId: repo.repoPath,
      status: repo.isInitialized ? "running" : "failed",
      detail: repo.isInitialized ? message : "Library Repo is not initialized.",
      completedAt: repo.isInitialized ? null : new Date().toISOString()
    });
    store.close();

    if (!repo.isInitialized) {
      return job;
    }

    try {
      this.fetchLibraryRepo();
      this.pullLibraryRepo();
      this.commitLibraryRepo(message);
      this.pushLibraryRepo();

      const updateStore = initializeLibraryStore(this.managedPaths);
      try {
        const updated =
          updateStore.updateSyncJob(job.id, {
            status: "succeeded",
            completedAt: new Date().toISOString(),
            detail: message
          }) ?? job;
        this.refreshConflictStatus();
        return updated;
      } finally {
        updateStore.close();
      }
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Library sync failed.";
      const updateStore = initializeLibraryStore(this.managedPaths);
      try {
        const updated =
          updateStore.updateSyncJob(job.id, {
            status: "failed",
            completedAt: new Date().toISOString(),
            detail
          }) ?? job;
        this.persistConflictFailure(detail, repo.isInitialized ? repo.repoPath : null);
        return updated;
      } finally {
        updateStore.close();
      }
    }
  }

  syncAfterMutationIfEnabled(settings: AppSettings, message: string): SyncJobRecord | null {
    if (!settings.sync.autoSyncEnabled) {
      return null;
    }

    return this.syncLibraryRepo(message);
  }

  private inspectConflictState(repoPath: string): LibrarySyncStatus["conflict"] {
    const unmerged = runGit(["diff", "--name-only", "--diff-filter=U"], repoPath);
    const conflictedFiles = normalizeStdout(unmerged.stdout)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const store = initializeLibraryStore(this.managedPaths);
    const lastFailedJob = store.listSyncJobsByScope("library").find((job) => job.status === "failed");
    store.close();

    return {
      hasConflict: conflictedFiles.length > 0,
      conflictedFiles,
      lastFailureDetail: conflictedFiles.length > 0 ? lastFailedJob?.detail ?? null : null,
      updatedAt: new Date().toISOString()
    };
  }

  private persistConflictFailure(detail: string, repoPath: string | null): void {
    const conflict = repoPath ? this.inspectConflictState(repoPath) : defaultConflictState();
    const store = initializeLibraryStore(this.managedPaths);

    try {
      store.setSetting(LIBRARY_CONFLICT_SETTING_KEY, {
        ...conflict,
        lastFailureDetail: detail,
        updatedAt: new Date().toISOString()
      });
    } finally {
      store.close();
    }
  }
}
