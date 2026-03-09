import { afterEach, describe, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { strToU8, zipSync } from "fflate";
import { resolveManagedPaths } from "../../shared/bootstrap";
import { initializeLibraryStore } from "../library/store";
import { ImportManager } from "./service";

const temporaryHomes: string[] = [];

afterEach(() => {
  while (temporaryHomes.length > 0) {
    const home = temporaryHomes.pop();
    if (home) {
      rmSync(home, { recursive: true, force: true });
    }
  }
});

function createWorkspace() {
  const home = mkdtempSync(join(tmpdir(), "skillkeeper-imports-"));
  temporaryHomes.push(home);
  const managedPaths = resolveManagedPaths(home);
  const manager = new ImportManager(managedPaths);

  return { home, managedPaths, manager };
}

function createSkillDirectory(
  parentDirectory: string,
  name: string,
  options: {
    includeSkillMd?: boolean;
    withScript?: boolean;
  } = {}
) {
  const skillDirectory = join(parentDirectory, name);
  mkdirSync(skillDirectory, { recursive: true });

  if (options.includeSkillMd !== false) {
    writeFileSync(
      join(skillDirectory, "SKILL.md"),
      `# ${name}\n\nDescription for ${name}.\n`,
      "utf8"
    );
  }

  if (options.withScript) {
    mkdirSync(join(skillDirectory, "scripts"), { recursive: true });
    writeFileSync(join(skillDirectory, "scripts", "run.sh"), "#!/bin/sh\necho test\n", "utf8");
  }

  return skillDirectory;
}

describe("ImportManager", () => {
  test("scans folders with multiple skills, invalid candidates, and warnings", async () => {
    const { home, managedPaths, manager } = createWorkspace();
    const sourceRoot = join(home, "import-source");
    mkdirSync(sourceRoot, { recursive: true });

    createSkillDirectory(sourceRoot, "daily-brief");
    createSkillDirectory(sourceRoot, "ops-helper", { withScript: true });

    const invalidCandidate = join(sourceRoot, "broken-helper");
    mkdirSync(join(invalidCandidate, "scripts"), { recursive: true });
    writeFileSync(join(invalidCandidate, "scripts", "tool.ps1"), "Write-Host test", "utf8");

    const result = await manager.scanSource(sourceRoot);
    expect(result.sourceKind).toBe("folder");
    expect(result.candidates.length).toBe(3);

    const validCandidate = result.candidates.find((candidate) => candidate.relativePath === "daily-brief");
    const warningCandidate = result.candidates.find((candidate) => candidate.relativePath === "ops-helper");
    const invalid = result.candidates.find((candidate) => candidate.relativePath === "broken-helper");

    expect(validCandidate?.canImport).toBe(true);
    expect(warningCandidate?.warnings.length).toBeGreaterThan(0);
    expect(invalid?.canImport).toBe(false);

    const blockedImport = manager.importCandidates(
      result.sessionId,
      [warningCandidate!.id],
      false
    );
    expect(blockedImport.skipped[0]?.reason).toContain("warnings");

    const committed = manager.importCandidates(
      result.sessionId,
      [validCandidate!.id, warningCandidate!.id, invalid!.id],
      true
    );

    expect(committed.imported.length).toBe(2);
    expect(committed.skipped.length).toBe(1);
    expect(existsSync(join(managedPaths.skills, "daily-brief"))).toBe(true);
    expect(existsSync(join(managedPaths.skills, "ops-helper"))).toBe(true);

    const store = initializeLibraryStore(managedPaths);
    expect(store.listSkills().length).toBe(2);
    store.close();
  });

  test("imports supported zip archives", async () => {
    const { home, managedPaths, manager } = createWorkspace();
    const sourceRoot = join(home, "zip-source");
    mkdirSync(sourceRoot, { recursive: true });
    createSkillDirectory(sourceRoot, "archive-skill");

    const archivePath = join(home, "skills.zip");
    writeFileSync(
      archivePath,
      zipSync({
        "archive-skill/SKILL.md": strToU8("# archive-skill\n\nArchive skill.\n")
      })
    );

    const result = await manager.scanSource(archivePath);
    expect(result.archiveFormat).toBe("zip");
    expect(result.candidates[0]?.canImport).toBe(true);

    const committed = manager.importCandidates(result.sessionId, [result.candidates[0]!.id], true);
    expect(committed.imported[0]?.slug).toBe("archive-skill");
    expect(existsSync(join(managedPaths.skills, "archive-skill", "SKILL.md"))).toBe(true);
  });

  test("imports supported tar.gz archives", async () => {
    const { home, managedPaths, manager } = createWorkspace();
    const sourceRoot = join(home, "tar-source");
    mkdirSync(sourceRoot, { recursive: true });
    createSkillDirectory(sourceRoot, "tar-skill", { withScript: true });

    const archivePath = join(home, "skills.tar.gz");
    const archiveResult = spawnSync("tar", ["-czf", archivePath, "-C", sourceRoot, "tar-skill"], {
      encoding: "utf8"
    });
    expect(archiveResult.status).toBe(0);

    const result = await manager.scanSource(archivePath);
    expect(result.archiveFormat).toBe("tar.gz");
    expect(result.candidates[0]?.warnings.length).toBe(1);

    const committed = manager.importCandidates(result.sessionId, [result.candidates[0]!.id], true);
    expect(committed.imported.length).toBe(1);
    expect(existsSync(join(managedPaths.skills, "tar-skill", "scripts", "run.sh"))).toBe(true);
  });
});
