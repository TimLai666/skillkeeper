import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { resolveManagedPaths } from "../../shared/bootstrap";
import { initializeLibraryStore } from "../library/store";
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
}

describe("ImportManager git intake", () => {
  test("clones a repository, scans multiple skills, and imports selected candidates", async () => {
    const root = mkdtempSync(join(tmpdir(), "skillkeeper-git-import-"));
    temporaryRoots.push(root);

    const sourceRepo = join(root, "source-repo");
    mkdirSync(sourceRepo, { recursive: true });
    runGit(["init", "-b", "main"], sourceRepo);
    runGit(["config", "user.name", "SkillKeeper Test"], sourceRepo);
    runGit(["config", "user.email", "skillkeeper@example.test"], sourceRepo);

    mkdirSync(join(sourceRepo, "daily-brief"), { recursive: true });
    mkdirSync(join(sourceRepo, "ops-helper", "scripts"), { recursive: true });
    writeFileSync(join(sourceRepo, "daily-brief", "SKILL.md"), "# Daily Brief\n\nDesc.\n", "utf8");
    writeFileSync(join(sourceRepo, "ops-helper", "SKILL.md"), "# Ops Helper\n\nDesc.\n", "utf8");
    writeFileSync(join(sourceRepo, "ops-helper", "scripts", "run.ps1"), "Write-Host 'test'\n", "utf8");
    runGit(["add", "."], sourceRepo);
    runGit(["commit", "-m", "Add skills"], sourceRepo);

    const managedPaths = resolveManagedPaths(root);
    const manager = new ImportManager(managedPaths);
    const scanResult = await manager.scanGitRepository(sourceRepo);

    expect(scanResult.sourceKind).toBe("git");
    expect(scanResult.trackedRepository?.isReadOnly).toBe(true);
    expect(scanResult.candidates.length).toBe(2);

    const imported = manager.importCandidates(
      scanResult.sessionId,
      scanResult.candidates.map((candidate) => candidate.id),
      true
    );

    expect(imported.imported.length).toBe(2);

    const store = initializeLibraryStore(managedPaths);
    const skills = store.listSkills();
    const bindings = store.listGitBindings();
    expect(bindings.length).toBe(1);
    expect(skills.every((skill) => skill.gitBindingId === bindings[0]?.id)).toBe(true);
    store.close();
  });
});
