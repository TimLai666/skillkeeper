import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { resolveManagedPaths } from "../../shared/bootstrap";
import { LibraryManagementService } from "./management";
import { initializeLibraryStore } from "./store";

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

function createManagedPaths() {
  const root = mkdtempSync(join(tmpdir(), "skillkeeper-library-management-"));
  temporaryRoots.push(root);
  return resolveManagedPaths(root);
}

describe("LibraryManagementService", () => {
  test("updates app-managed metadata without modifying SKILL.md", () => {
    const managedPaths = createManagedPaths();
    const store = initializeLibraryStore(managedPaths);

    const skillPath = join(managedPaths.skills, "daily-brief");
    mkdirSync(join(skillPath, "scripts"), { recursive: true });
    writeFileSync(join(skillPath, "SKILL.md"), "# Daily Brief\n\nOriginal description.\n", "utf8");
    writeFileSync(join(skillPath, "scripts", "run.sh"), "echo test\n", "utf8");

    const skill = store.createSkill({
      slug: "daily-brief",
      displayName: "Daily Brief",
      description: "Original metadata",
      sourceKind: "manual",
      libraryPath: skillPath,
      status: "ready"
    });

    store.close();

    const service = new LibraryManagementService(managedPaths);
    const updated = service.updateSkillMetadata(skill.id, {
      displayName: "Daily Brief Custom",
      description: "Custom metadata"
    });

    expect(updated.skill.displayName).toBe("Daily Brief Custom");
    expect(updated.skill.description).toBe("Custom metadata");
    expect(updated.fileTree.some((entry) => entry.name === "SKILL.md")).toBe(true);
    expect(updated.skillMarkdownPreview).toContain("Original description.");
    expect(readFileSync(join(skillPath, "SKILL.md"), "utf8")).toContain("Original description.");
  });

  test("returns clear empty state data for non-git and non-deployed skills", () => {
    const managedPaths = createManagedPaths();
    const store = initializeLibraryStore(managedPaths);

    const skillPath = join(managedPaths.skills, "solo-skill");
    mkdirSync(skillPath, { recursive: true });
    writeFileSync(join(skillPath, "SKILL.md"), "# Solo Skill\n\nStandalone.\n", "utf8");

    const skill = store.createSkill({
      slug: "solo-skill",
      displayName: "Solo Skill",
      description: null,
      sourceKind: "folder",
      sourcePath: "C:/imports/solo-skill",
      libraryPath: skillPath,
      status: "ready"
    });

    store.close();

    const service = new LibraryManagementService(managedPaths);
    const detail = service.getSkillDetail(skill.id);

    expect(detail.gitBinding).toBeNull();
    expect(detail.gitHistory).toHaveLength(0);
    expect(detail.deployments).toHaveLength(0);
  });

  test("lists summaries and includes git status, installed agents, and git history for tracked skills", () => {
    const managedPaths = createManagedPaths();
    const repoPath = join(temporaryRoots[temporaryRoots.length - 1]!, "source-repo");
    mkdirSync(repoPath, { recursive: true });
    runGit(["init", "-b", "main"], repoPath);
    runGit(["config", "user.name", "SkillKeeper Test"], repoPath);
    runGit(["config", "user.email", "skillkeeper@example.test"], repoPath);
    writeFileSync(join(repoPath, "README.md"), "repo\n", "utf8");
    runGit(["add", "."], repoPath);
    runGit(["commit", "-m", "Initial commit"], repoPath);

    const store = initializeLibraryStore(managedPaths);
    const gitBinding = store.upsertGitBinding({
      repoPath,
      remoteUrl: "https://example.com/skills.git",
      defaultBranch: "main",
      isReadOnly: true,
      upstreamStatus: "synced"
    });

    const skillPath = join(managedPaths.skills, "tracked-skill");
    mkdirSync(skillPath, { recursive: true });
    writeFileSync(join(skillPath, "SKILL.md"), "# Tracked Skill\n\nTracked.\n", "utf8");

    const skill = store.createSkill({
      slug: "tracked-skill",
      displayName: "Tracked Skill",
      description: "Tracked metadata",
      sourceKind: "git",
      sourcePath: gitBinding.remoteUrl,
      libraryPath: skillPath,
      status: "ready",
      gitBindingId: gitBinding.id
    });

    store.createPlatformBinding({
      skillId: skill.id,
      platform: "codex",
      installPath: "C:/Users/test/.agents/skills/tracked-skill"
    });
    store.close();

    const service = new LibraryManagementService(managedPaths);
    const summaries = service.listSkillSummaries();
    const detail = service.getSkillDetail(skill.id);

    expect(summaries).toHaveLength(1);
    expect(summaries[0]?.gitBinding?.upstreamStatus).toBe("synced");
    expect(summaries[0]?.installedAgents).toEqual(["codex"]);
    expect(detail.gitHistory[0]?.summary).toContain("Initial commit");
    expect(detail.deployments[0]?.platform).toBe("codex");
  });
});
