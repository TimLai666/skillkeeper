import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createDefaultSettings, resolveManagedPaths } from "../../shared/bootstrap";
import { LibrarySyncService } from "./service";

const temporaryRoots: string[] = [];

afterEach(() => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (root) {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

function runGit(args: string[], cwd: string) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8"
  });

  expect(result.status).toBe(0);
  return result.stdout.trim();
}

function createFixture() {
  const root = mkdtempSync(join(tmpdir(), "skillkeeper-library-sync-"));
  temporaryRoots.push(root);
  const managedPaths = resolveManagedPaths(root);
  mkdirSync(managedPaths.skills, { recursive: true });
  const settings = createDefaultSettings(root);
  return { root, managedPaths, settings };
}

describe("LibrarySyncService", () => {
  test("initializes and syncs the managed library repo without touching external source repos", () => {
    const fixture = createFixture();
    const remoteRoot = join(fixture.root, "remote.git");
    const sourceRepo = join(fixture.root, "source-repo");
    mkdirSync(remoteRoot, { recursive: true });
    mkdirSync(sourceRepo, { recursive: true });
    runGit(["init", "--bare"], remoteRoot);
    runGit(["init", "-b", "main"], sourceRepo);
    runGit(["config", "user.name", "Source Repo"], sourceRepo);
    runGit(["config", "user.email", "source@example.test"], sourceRepo);
    writeFileSync(join(sourceRepo, "README.md"), "source\n", "utf8");
    runGit(["add", "."], sourceRepo);
    runGit(["commit", "-m", "Source commit"], sourceRepo);
    const sourceHeadBefore = runGit(["rev-parse", "HEAD"], sourceRepo);

    const syncService = new LibrarySyncService(fixture.managedPaths);
    const repo = syncService.initializeLibraryRepo(remoteRoot);
    runGit(["config", "user.name", "SkillKeeper"], repo.repoPath);
    runGit(["config", "user.email", "skillkeeper@example.test"], repo.repoPath);
    writeFileSync(join(fixture.managedPaths.skills, "daily-brief.txt"), "sync me\n", "utf8");

    const syncJob = syncService.syncLibraryRepo("Sync library changes");
    const remoteLog = spawnSync("git", ["log", "--oneline", "-n", "1", "refs/heads/main"], {
      cwd: remoteRoot,
      encoding: "utf8"
    });

    expect(syncJob.status).toBe("succeeded");
    expect(remoteLog.stdout).toContain("Sync library changes");
    expect(runGit(["rev-parse", "HEAD"], sourceRepo)).toBe(sourceHeadBefore);
  });

  test("respects disabled auto-sync while preserving manual sync", () => {
    const fixture = createFixture();
    const remoteRoot = join(fixture.root, "remote.git");
    mkdirSync(remoteRoot, { recursive: true });
    runGit(["init", "--bare"], remoteRoot);

    const syncService = new LibrarySyncService(fixture.managedPaths);
    const repo = syncService.initializeLibraryRepo(remoteRoot);
    runGit(["config", "user.name", "SkillKeeper"], repo.repoPath);
    runGit(["config", "user.email", "skillkeeper@example.test"], repo.repoPath);

    fixture.settings.sync.autoSyncEnabled = false;
    writeFileSync(join(fixture.managedPaths.skills, "notes.txt"), "manual only\n", "utf8");
    const autoSyncResult = syncService.syncAfterMutationIfEnabled(
      fixture.settings,
      "Mutation happened"
    );

    expect(autoSyncResult).toBeNull();
    const remoteLogBefore = spawnSync("git", ["log", "--oneline", "-n", "1", "refs/heads/main"], {
      cwd: remoteRoot,
      encoding: "utf8"
    });
    expect(remoteLogBefore.stdout.trim()).toBe("");

    const manualJob = syncService.syncLibraryRepo("Manual sync");
    const remoteLogAfter = spawnSync("git", ["log", "--oneline", "-n", "1", "refs/heads/main"], {
      cwd: remoteRoot,
      encoding: "utf8"
    });

    expect(manualJob.status).toBe("succeeded");
    expect(remoteLogAfter.stdout).toContain("Manual sync");
  });
});
