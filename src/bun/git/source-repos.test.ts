import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { resolveManagedPaths } from "../../shared/bootstrap";
import { createTrackedRepository, refreshTrackedRepositoryStatus } from "./source-repos";

const temporaryRoots: string[] = [];

afterEach(() => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (root) {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

function createWorkspace() {
  const root = mkdtempSync(join(tmpdir(), "skillkeeper-git-"));
  temporaryRoots.push(root);
  return { root, managedPaths: resolveManagedPaths(root) };
}

function runGit(args: string[], cwd: string) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8"
  });

  expect(result.status).toBe(0);
  return result;
}

function createCommittedRepo(root: string, name: string) {
  const repoPath = join(root, name);
  mkdirSync(repoPath, { recursive: true });
  runGit(["init", "-b", "main"], repoPath);
  runGit(["config", "user.name", "SkillKeeper Test"], repoPath);
  runGit(["config", "user.email", "skillkeeper@example.test"], repoPath);
  return repoPath;
}

describe("source repository tracking", () => {
  test("clones a repository and records initial tracking metadata", () => {
    const { root, managedPaths } = createWorkspace();
    const sourceRepo = createCommittedRepo(root, "source-repo");

    mkdirSync(join(sourceRepo, "daily-brief"), { recursive: true });
    writeFileSync(join(sourceRepo, "daily-brief", "SKILL.md"), "# Daily Brief\n\nDesc.\n", "utf8");
    runGit(["add", "."], sourceRepo);
    runGit(["commit", "-m", "Initial skills"], sourceRepo);

    const binding = createTrackedRepository(sourceRepo, managedPaths);

    expect(binding.repoPath).not.toBe(sourceRepo);
    expect(binding.remoteUrl).toBe(sourceRepo);
    expect(binding.defaultBranch).toBe("main");
    expect(["synced", "unknown"]).toContain(binding.upstreamStatus);
    expect(binding.isReadOnly).toBe(true);
  });

  test("refreshes a tracked repository to behind when upstream advances", () => {
    const { root, managedPaths } = createWorkspace();
    const sourceRepo = createCommittedRepo(root, "upstream-repo");

    mkdirSync(join(sourceRepo, "ops-helper"), { recursive: true });
    writeFileSync(join(sourceRepo, "ops-helper", "SKILL.md"), "# Ops Helper\n\nDesc.\n", "utf8");
    runGit(["add", "."], sourceRepo);
    runGit(["commit", "-m", "Initial commit"], sourceRepo);

    const binding = createTrackedRepository(sourceRepo, managedPaths);

    writeFileSync(join(sourceRepo, "ops-helper", "README.md"), "new change\n", "utf8");
    runGit(["add", "."], sourceRepo);
    runGit(["commit", "-m", "Advance upstream"], sourceRepo);

    const refreshed = refreshTrackedRepositoryStatus(binding.id, managedPaths);
    expect(refreshed.upstreamStatus).toBe("behind");
  });
});
