import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { AppSettings, ManagedPaths } from "../../shared/bootstrap";
import type { PlatformBindingRecord, PlatformName } from "../../shared/library";
import { initializeLibraryStore } from "../library/store";

interface DeploymentServiceOptions {
  onLibraryMutation?: (message: string) => void;
}

function getPlatformLabel(platform: PlatformName): string {
  return platform === "codex" ? "Codex" : "Claude Code";
}

function resolveAgentRoot(settings: AppSettings, platform: PlatformName): string {
  return platform === "codex"
    ? settings.agentPaths.codexGlobal.trim()
    : settings.agentPaths.claudeGlobal.trim();
}

export class DeploymentService {
  constructor(
    private readonly managedPaths: ManagedPaths,
    private readonly options: DeploymentServiceOptions = {}
  ) {}

  installSkill(
    skillId: string,
    platform: PlatformName,
    settings: AppSettings
  ): PlatformBindingRecord {
    return this.copySkill(skillId, platform, settings, false);
  }

  updateSkill(
    skillId: string,
    platform: PlatformName,
    settings: AppSettings
  ): PlatformBindingRecord {
    return this.copySkill(skillId, platform, settings, true);
  }

  uninstallSkill(skillId: string, platform: PlatformName): PlatformBindingRecord {
    const store = initializeLibraryStore(this.managedPaths);

    try {
      const binding = store.getLatestPlatformBindingForSkillPlatform(skillId, platform);
      if (!binding) {
        throw new Error(`Skill is not installed for ${getPlatformLabel(platform)}.`);
      }

      rmSync(binding.installPath, { recursive: true, force: true });
      return store.upsertPlatformBinding({
        id: binding.id,
        skillId,
        platform,
        installPath: binding.installPath,
        installStatus: "removed",
        installedAt: binding.installedAt
      });
    } finally {
      store.close();
    }
  }

  deleteSkill(skillId: string): { skillId: string } {
    const store = initializeLibraryStore(this.managedPaths);

    try {
      const skill = store.getSkillById(skillId);
      if (!skill) {
        throw new Error("Skill was not found in the library.");
      }

      for (const binding of store.listPlatformBindingsForSkill(skillId)) {
        rmSync(binding.installPath, { recursive: true, force: true });
      }

      rmSync(skill.libraryPath, { recursive: true, force: true });
      store.deleteSkill(skillId);
      this.options.onLibraryMutation?.("Delete skill from library");
      return { skillId };
    } finally {
      store.close();
    }
  }

  private copySkill(
    skillId: string,
    platform: PlatformName,
    settings: AppSettings,
    requireExistingBinding: boolean
  ): PlatformBindingRecord {
    const agentRoot = resolveAgentRoot(settings, platform);
    if (!agentRoot) {
      throw new Error(`Configure a valid global path for ${getPlatformLabel(platform)} before deployment.`);
    }

    const store = initializeLibraryStore(this.managedPaths);

    try {
      const skill = store.getSkillById(skillId);
      if (!skill) {
        throw new Error("Skill was not found in the library.");
      }

      if (!existsSync(skill.libraryPath)) {
        throw new Error("Skill files are missing from the library.");
      }

      const currentBinding = store.getLatestPlatformBindingForSkillPlatform(skillId, platform);
      if (requireExistingBinding && (!currentBinding || currentBinding.installStatus === "removed")) {
        throw new Error(`Skill is not installed for ${getPlatformLabel(platform)}.`);
      }

      const installPath = join(agentRoot, skill.slug);

      try {
        mkdirSync(agentRoot, { recursive: true });
        rmSync(installPath, { recursive: true, force: true });
        cpSync(skill.libraryPath, installPath, { recursive: true });
      } catch (error) {
        store.clearPlatformBindingsForSkillPlatform(skillId, platform);
        store.upsertPlatformBinding({
          id: currentBinding?.id,
          skillId,
          platform,
          installPath,
          installStatus: "failed",
          installedAt: currentBinding?.installedAt ?? null
        });

        const message = error instanceof Error ? error.message : "Skill deployment failed.";
        throw new Error(message);
      }

      store.clearPlatformBindingsForSkillPlatform(skillId, platform);
      return store.upsertPlatformBinding({
        id: currentBinding?.id,
        skillId,
        platform,
        installPath,
        installStatus: "installed",
        installedAt: currentBinding?.installedAt ?? null
      });
    } finally {
      store.close();
    }
  }
}
