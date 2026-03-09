import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import type { ManagedPaths } from "../../shared/bootstrap";
import type { SkillDetail, LibrarySkillSummary, FileTreeEntry, GitHistoryEntry } from "../../shared/library-management";
import { initializeLibraryStore } from "./store";

function buildFileTree(rootPath: string, currentPath = rootPath): FileTreeEntry[] {
  if (!existsSync(currentPath) || !statSync(currentPath).isDirectory()) {
    return [];
  }

  return readdirSync(currentPath, { withFileTypes: true })
    .sort((left, right) => {
      if (left.isDirectory() !== right.isDirectory()) {
        return left.isDirectory() ? -1 : 1;
      }

      return left.name.localeCompare(right.name);
    })
    .map((entry) => {
      const entryPath = join(currentPath, entry.name);
      const treeEntry: FileTreeEntry = {
        name: entry.name,
        path: relative(rootPath, entryPath).replaceAll("\\", "/") || entry.name,
        type: entry.isDirectory() ? "directory" : "file"
      };

      if (entry.isDirectory()) {
        treeEntry.children = buildFileTree(rootPath, entryPath);
      }

      return treeEntry;
    });
}

function readSkillMarkdown(skillPath: string): string {
  const markdownPath = join(skillPath, "SKILL.md");
  return existsSync(markdownPath) ? readFileSync(markdownPath, "utf8") : "";
}

function readGitHistory(repoPath: string): GitHistoryEntry[] {
  const result = spawnSync("git", ["log", "--oneline", "-n", "10"], {
    cwd: repoPath,
    encoding: "utf8"
  });

  if (result.status !== 0) {
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [commitHash, ...summaryParts] = line.split(" ");
      return {
        commitHash,
        summary: summaryParts.join(" ")
      };
    });
}

export class LibraryManagementService {
  constructor(private readonly managedPaths: ManagedPaths) {}

  listSkillSummaries(): LibrarySkillSummary[] {
    const store = initializeLibraryStore(this.managedPaths);

    try {
      return store.listSkills().map((skill) => {
        const deployments = store.listPlatformBindingsForSkill(skill.id);
        const gitBinding = skill.gitBindingId ? store.getGitBindingById(skill.gitBindingId) : null;

        return {
          skill,
          gitBinding,
          deployments,
          installedAgents: deployments
            .filter((deployment) => deployment.installStatus === "installed")
            .map((deployment) => deployment.platform)
        };
      });
    } finally {
      store.close();
    }
  }

  getSkillDetail(skillId: string): SkillDetail {
    const store = initializeLibraryStore(this.managedPaths);

    try {
      const skill = store.getSkillById(skillId);
      if (!skill) {
        throw new Error("Skill was not found in the library.");
      }

      const gitBinding = skill.gitBindingId ? store.getGitBindingById(skill.gitBindingId) : null;
      const deployments = store.listPlatformBindingsForSkill(skill.id);

      return {
        skill,
        gitBinding,
        deployments,
        fileTree: buildFileTree(skill.libraryPath),
        skillMarkdownPreview: readSkillMarkdown(skill.libraryPath),
        gitHistory: gitBinding ? readGitHistory(gitBinding.repoPath) : []
      };
    } finally {
      store.close();
    }
  }

  updateSkillMetadata(
    skillId: string,
    updates: { displayName: string; description: string | null }
  ): SkillDetail {
    const store = initializeLibraryStore(this.managedPaths);

    try {
      const updated = store.updateSkillMetadata(skillId, {
        displayName: updates.displayName.trim(),
        description: updates.description
      });

      if (!updated) {
        throw new Error("Skill was not found in the library.");
      }
    } finally {
      store.close();
    }

    return this.getSkillDetail(skillId);
  }
}
