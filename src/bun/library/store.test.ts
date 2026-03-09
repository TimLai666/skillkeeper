import { afterEach, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveManagedPaths } from "../../shared/bootstrap";
import { initializeLibraryStore } from "./store";

const temporaryHomes: string[] = [];

afterEach(() => {
  while (temporaryHomes.length > 0) {
    const home = temporaryHomes.pop();
    if (home) {
      rmSync(home, { recursive: true, force: true });
    }
  }
});

function createManagedPaths() {
  const home = mkdtempSync(join(tmpdir(), "skillkeeper-library-"));
  temporaryHomes.push(home);
  return resolveManagedPaths(home);
}

describe("LibraryStore", () => {
  test("creates the expected schema on clean initialization", () => {
    const managedPaths = createManagedPaths();
    const store = initializeLibraryStore(managedPaths);

    expect(store.listTableNames()).toEqual([
      "git_bindings",
      "platform_bindings",
      "schema_migrations",
      "settings",
      "skills",
      "sync_jobs"
    ]);

    store.close();
  });

  test("persists library records and related bindings", () => {
    const managedPaths = createManagedPaths();
    const store = initializeLibraryStore(managedPaths);

    const gitBinding = store.upsertGitBinding({
      repoPath: join(managedPaths.repos, "source-repo"),
      remoteUrl: "https://example.com/skills.git",
      defaultBranch: "main",
      isReadOnly: true,
      upstreamStatus: "synced"
    });

    const skillDirectory = join(managedPaths.skills, "daily-brief");
    mkdirSync(skillDirectory, { recursive: true });

    const skill = store.createSkill({
      slug: "daily-brief",
      displayName: "Daily Brief",
      description: "Summarizes the day.",
      sourceKind: "folder",
      sourcePath: "C:/imports/daily-brief",
      libraryPath: skillDirectory,
      status: "ready",
      gitBindingId: gitBinding.id
    });

    const platformBinding = store.createPlatformBinding({
      skillId: skill.id,
      platform: "codex",
      installPath: "C:/Users/test/.agents/skills/daily-brief"
    });

    const syncJob = store.createSyncJob({
      targetScope: "library",
      status: "succeeded",
      completedAt: new Date().toISOString(),
      detail: "Initial import indexed."
    });

    const setting = store.setSetting("library.defaultSort", {
      field: "updated_at",
      direction: "desc"
    });

    expect(store.getSkillById(skill.id)?.gitBindingId).toBe(gitBinding.id);
    expect(store.listSkills()).toHaveLength(1);
    expect(store.listGitBindings()).toHaveLength(1);
    expect(store.listPlatformBindingsForSkill(skill.id)[0]?.id).toBe(platformBinding.id);
    expect(store.listSyncJobs()[0]?.id).toBe(syncJob.id);
    expect(store.getSetting<typeof setting.value>(setting.key)?.value.direction).toBe("desc");

    store.close();
  });

  test("reconciles a missing skill directory without deleting the record", () => {
    const managedPaths = createManagedPaths();
    const store = initializeLibraryStore(managedPaths);

    const skillPath = join(managedPaths.skills, "missing-skill");
    const skill = store.createSkill({
      slug: "missing-skill",
      displayName: "Missing Skill",
      sourceKind: "manual",
      libraryPath: skillPath,
      status: "ready"
    });

    const reconciled = store.reconcileSkillFileState(skill.id);

    expect(reconciled?.status).toBe("missing_files");
    expect(store.getSkillById(skill.id)?.status).toBe("missing_files");

    store.close();
  });
});
