import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { createDefaultSettings, resolveManagedPaths } from "../../shared/bootstrap";
import { LibrarySyncService } from "../sync/service";
import { ImportManager } from "./service";

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

describe("ImportManager auto-sync", () => {
  test("auto-sync commits and pushes library mutations only when enabled", async () => {
    const root = mkdtempSync(join(tmpdir(), "skillkeeper-auto-sync-"));
    temporaryRoots.push(root);
    const managedPaths = resolveManagedPaths(root);
    mkdirSync(managedPaths.skills, { recursive: true });
    const sourcePath = join(root, "source-skill");
    mkdirSync(sourcePath, { recursive: true });
    writeFileSync(join(sourcePath, "SKILL.md"), "# Imported Skill\n\nDesc.\n", "utf8");

    const remoteRoot = join(root, "remote.git");
    mkdirSync(remoteRoot, { recursive: true });
    runGit(["init", "--bare"], remoteRoot);

    const syncService = new LibrarySyncService(managedPaths);
    const repo = syncService.initializeLibraryRepo(remoteRoot);
    runGit(["config", "user.name", "SkillKeeper"], repo.repoPath);
    runGit(["config", "user.email", "skillkeeper@example.test"], repo.repoPath);

    const settings = createDefaultSettings(root);
    settings.sync.autoSyncEnabled = true;

    const manager = new ImportManager(managedPaths, {
      onLibraryMutation: (message) => syncService.syncAfterMutationIfEnabled(settings, message)
    });

    const scan = await manager.scanSource(sourcePath);
    manager.importCandidates(scan.sessionId, scan.candidates.map((candidate) => candidate.id), false);

    const remoteLog = spawnSync("git", ["log", "--oneline", "-n", "1", "refs/heads/main"], {
      cwd: remoteRoot,
      encoding: "utf8"
    });

    expect(remoteLog.stdout).toContain("Import skills into library");

    settings.sync.autoSyncEnabled = false;
    writeFileSync(join(sourcePath, "notes.txt"), "second import\n", "utf8");
    const scanSecond = await manager.scanSource(sourcePath);
    manager.importCandidates(
      scanSecond.sessionId,
      scanSecond.candidates.map((candidate) => candidate.id),
      false
    );

    const headBeforeManual = readFileSync(join(repo.repoPath, ".git", "HEAD"), "utf8");
    expect(headBeforeManual).toContain("refs/heads/main");
  });
});
