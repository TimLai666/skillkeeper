import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createDefaultSettings, resolveManagedPaths, type AppSettings } from "../../shared/bootstrap";
import { initializeLibraryStore } from "../library/store";
import { DeploymentService } from "./service";

const temporaryHomes: string[] = [];

afterEach(() => {
  while (temporaryHomes.length > 0) {
    const home = temporaryHomes.pop();
    if (home) {
      rmSync(home, { recursive: true, force: true });
    }
  }
});

function createFixture() {
  const homeDirectory = mkdtempSync(join(tmpdir(), "skillkeeper-deployment-"));
  temporaryHomes.push(homeDirectory);

  const managedPaths = resolveManagedPaths(homeDirectory);
  mkdirSync(managedPaths.skills, { recursive: true });

  const settings: AppSettings = createDefaultSettings(homeDirectory);
  settings.agentPaths.codexGlobal = join(homeDirectory, "targets", "codex", "skills");
  settings.agentPaths.claudeGlobal = join(homeDirectory, "targets", "claude", "skills");

  const store = initializeLibraryStore(managedPaths);
  const skillPath = join(managedPaths.skills, "daily-brief");
  mkdirSync(skillPath, { recursive: true });
  writeFileSync(join(skillPath, "SKILL.md"), "# Daily Brief\n\nInitial.\n", "utf8");
  writeFileSync(join(skillPath, "prompt.txt"), "v1\n", "utf8");

  const skill = store.createSkill({
    slug: "daily-brief",
    displayName: "Daily Brief",
    description: "Summarizes the day.",
    sourceKind: "manual",
    libraryPath: skillPath,
    status: "ready"
  });

  store.close();

  return { homeDirectory, managedPaths, settings, skill };
}

describe("DeploymentService", () => {
  test("installs and updates a skill independently across Codex and Claude Code", () => {
    const fixture = createFixture();
    const service = new DeploymentService(fixture.managedPaths);

    const codexInstall = service.installSkill(fixture.skill.id, "codex", fixture.settings);
    const claudeInstall = service.installSkill(fixture.skill.id, "claude-code", fixture.settings);

    expect(codexInstall.installStatus).toBe("installed");
    expect(claudeInstall.installStatus).toBe("installed");
    expect(existsSync(join(fixture.settings.agentPaths.codexGlobal, fixture.skill.slug, "SKILL.md"))).toBe(true);
    expect(existsSync(join(fixture.settings.agentPaths.claudeGlobal, fixture.skill.slug, "SKILL.md"))).toBe(true);

    writeFileSync(join(fixture.skill.libraryPath, "prompt.txt"), "v2\n", "utf8");
    const updated = service.updateSkill(fixture.skill.id, "codex", fixture.settings);

    expect(updated.installStatus).toBe("installed");
    expect(
      readFileSync(join(fixture.settings.agentPaths.codexGlobal, fixture.skill.slug, "prompt.txt"), "utf8")
    ).toBe("v2\n");
  });

  test("uninstall removes deployed files but keeps the library skill, and delete removes both skill and bindings", () => {
    const fixture = createFixture();
    const service = new DeploymentService(fixture.managedPaths);

    service.installSkill(fixture.skill.id, "codex", fixture.settings);
    const removed = service.uninstallSkill(fixture.skill.id, "codex");

    expect(removed.installStatus).toBe("removed");
    expect(existsSync(join(fixture.settings.agentPaths.codexGlobal, fixture.skill.slug))).toBe(false);

    const store = initializeLibraryStore(fixture.managedPaths);
    expect(store.getSkillById(fixture.skill.id)?.id).toBe(fixture.skill.id);
    expect(store.listPlatformBindingsForSkill(fixture.skill.id)).toHaveLength(1);
    store.close();

    service.deleteSkill(fixture.skill.id);

    const refreshedStore = initializeLibraryStore(fixture.managedPaths);
    expect(refreshedStore.getSkillById(fixture.skill.id)).toBeNull();
    expect(refreshedStore.listPlatformBindingsForSkill(fixture.skill.id)).toHaveLength(0);
    refreshedStore.close();
    expect(existsSync(fixture.skill.libraryPath)).toBe(false);
  });

  test("rejects deployment when an agent path is blank", () => {
    const fixture = createFixture();
    const service = new DeploymentService(fixture.managedPaths);
    fixture.settings.agentPaths.codexGlobal = " ";

    expect(() => service.installSkill(fixture.skill.id, "codex", fixture.settings)).toThrow(
      "Configure a valid global path for Codex before deployment."
    );
  });
});
