import { existsSync, mkdirSync } from "node:fs";
import { basename, join } from "node:path";
import { spawnSync } from "node:child_process";
import type { ManagedPaths } from "../../shared/bootstrap";
import type { GitBindingRecord, UpstreamStatus } from "../../shared/library";
import { initializeLibraryStore, type LibraryStore } from "../library/store";

function normalizeStdout(output: string | Buffer | null | undefined): string {
  if (typeof output === "string") {
    return output;
  }

  if (!output) {
    return "";
  }

  return output.toString("utf8");
}

function runGit(args: string[], cwd?: string) {
  return spawnSync("git", args, {
    cwd,
    encoding: "utf8"
  });
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/\.git$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || "repository";
}

function deriveRepoSlug(repoUrl: string): string {
  const normalized = repoUrl.replace(/[\\/]+$/, "");
  return slugify(basename(normalized));
}

function ensureUniqueRepoPath(rootDirectory: string, repoSlug: string): string {
  let nextPath = join(rootDirectory, repoSlug);
  let suffix = 2;

  while (existsSync(nextPath)) {
    nextPath = join(rootDirectory, `${repoSlug}-${suffix}`);
    suffix += 1;
  }

  return nextPath;
}

function detectDefaultBranch(repoPath: string): string | null {
  const symbolicRef = runGit(["symbolic-ref", "--short", "HEAD"], repoPath);
  if (symbolicRef.status === 0) {
    return normalizeStdout(symbolicRef.stdout).trim() || null;
  }

  const revParse = runGit(["rev-parse", "--abbrev-ref", "HEAD"], repoPath);
  return revParse.status === 0 ? normalizeStdout(revParse.stdout).trim() || null : null;
}

export function inspectUpstreamStatus(repoPath: string): UpstreamStatus {
  const unresolved = runGit(["ls-files", "--unmerged"], repoPath);
  if (normalizeStdout(unresolved.stdout).trim().length > 0) {
    return "conflict";
  }

  runGit(["fetch", "--all", "--prune"], repoPath);

  const upstreamBranch = runGit(
    ["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"],
    repoPath
  );

  if (upstreamBranch.status !== 0) {
    return "unknown";
  }

  const divergence = runGit(["rev-list", "--left-right", "--count", "HEAD...@{u}"], repoPath);
  if (divergence.status !== 0) {
    return "unknown";
  }

  const [aheadCount, behindCount] = normalizeStdout(divergence.stdout)
    .trim()
    .split(/\s+/)
    .map((value) => Number.parseInt(value, 10));

  if ((aheadCount ?? 0) > 0 && (behindCount ?? 0) > 0) {
    return "conflict";
  }

  if ((aheadCount ?? 0) > 0) {
    return "ahead";
  }

  if ((behindCount ?? 0) > 0) {
    return "behind";
  }

  return "synced";
}

export function cloneRepository(repoUrl: string, managedPaths: ManagedPaths): {
  repoPath: string;
  remoteUrl: string;
  defaultBranch: string | null;
  upstreamStatus: UpstreamStatus;
} {
  mkdirSync(managedPaths.repos, { recursive: true });
  const repoPath = ensureUniqueRepoPath(managedPaths.repos, deriveRepoSlug(repoUrl));
  const cloneResult = runGit(["clone", repoUrl, repoPath]);

  if (cloneResult.status !== 0) {
    throw new Error(normalizeStdout(cloneResult.stderr).trim() || "Git clone failed.");
  }

  return {
    repoPath,
    remoteUrl: repoUrl,
    defaultBranch: detectDefaultBranch(repoPath),
    upstreamStatus: inspectUpstreamStatus(repoPath)
  };
}

export function createTrackedRepository(
  repoUrl: string,
  managedPaths: ManagedPaths,
  store?: LibraryStore
): GitBindingRecord {
  const localStore = store ?? initializeLibraryStore(managedPaths);
  const shouldClose = store == null;

  try {
    const clone = cloneRepository(repoUrl, managedPaths);
    return localStore.upsertGitBinding({
      repoPath: clone.repoPath,
      remoteUrl: clone.remoteUrl,
      defaultBranch: clone.defaultBranch,
      isReadOnly: true,
      upstreamStatus: clone.upstreamStatus
    });
  } finally {
    if (shouldClose) {
      localStore.close();
    }
  }
}

export function refreshTrackedRepositoryStatus(
  gitBindingId: string,
  managedPaths: ManagedPaths
): GitBindingRecord {
  const store = initializeLibraryStore(managedPaths);

  try {
    const binding = store.getGitBindingById(gitBindingId);
    if (!binding) {
      throw new Error("Tracked repository was not found.");
    }

    return store.upsertGitBinding({
      id: binding.id,
      repoPath: binding.repoPath,
      remoteUrl: binding.remoteUrl,
      defaultBranch: detectDefaultBranch(binding.repoPath),
      isReadOnly: true,
      upstreamStatus: inspectUpstreamStatus(binding.repoPath)
    });
  } finally {
    store.close();
  }
}
