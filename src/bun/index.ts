import { BrowserView, BrowserWindow, Utils } from "electrobun";
import { spawn } from "node:child_process";
import type { ShellRPCSchema } from "../shared/bootstrap-rpc";
import { bootstrapApplication, saveAppSettings } from "./bootstrap/runtime";
import type { LibrarySkillSummary } from "../shared/library-management";
import { DeploymentService } from "./deployment/service";
import { ImportManager } from "./imports/service";
import { LibraryManagementService } from "./library/management";
import { initializeLibraryStore } from "./library/store";
import { refreshTrackedRepositoryStatus } from "./git/source-repos";
import { LibrarySyncService } from "./sync/service";

let bootstrapState = bootstrapApplication();
let librarySyncService = new LibrarySyncService(bootstrapState.managedPaths);
const syncAfterMutation = (message: string) => {
  librarySyncService.syncAfterMutationIfEnabled(bootstrapState.settings, message);
};
let importManager = new ImportManager(bootstrapState.managedPaths, {
  onLibraryMutation: syncAfterMutation
});
let deploymentService = new DeploymentService(bootstrapState.managedPaths, {
  onLibraryMutation: syncAfterMutation
});
let libraryManagementService = new LibraryManagementService(bootstrapState.managedPaths);

function listLibrarySkills(): LibrarySkillSummary[] {
  return libraryManagementService.listSkillSummaries();
}

function openFolderInShell(targetPath: string): void {
  if (process.platform === "win32") {
    spawn("explorer", [targetPath], { detached: true, stdio: "ignore" }).unref();
    return;
  }

  if (process.platform === "darwin") {
    spawn("open", [targetPath], { detached: true, stdio: "ignore" }).unref();
    return;
  }

  spawn("xdg-open", [targetPath], { detached: true, stdio: "ignore" }).unref();
}

const rpc = BrowserView.defineRPC<ShellRPCSchema>({
  handlers: {
    requests: {
      getBootstrapState: () => bootstrapState,
      refreshBootstrapState: () => {
        bootstrapState = bootstrapApplication();
        librarySyncService = new LibrarySyncService(bootstrapState.managedPaths);
        importManager = new ImportManager(bootstrapState.managedPaths, {
          onLibraryMutation: syncAfterMutation
        });
        deploymentService = new DeploymentService(bootstrapState.managedPaths, {
          onLibraryMutation: syncAfterMutation
        });
        libraryManagementService = new LibraryManagementService(bootstrapState.managedPaths);
        return bootstrapState;
      },
      pickImportSource: async (params?: unknown) => {
        const { kind } = params as { kind: "folder" | "archive" };
        const selectedPaths = await Utils.openFileDialog({
          canChooseFiles: kind === "archive",
          canChooseDirectory: kind === "folder",
          allowsMultipleSelection: false,
          allowedFileTypes: kind === "archive" ? "zip,tar.gz,tgz" : "*"
        });

        const selectedPath = selectedPaths.map((item) => item.trim()).find(Boolean) ?? null;
        return { selectedPath };
      },
      scanImportSource: async (params?: unknown) => {
        const { sourcePath } = params as { sourcePath: string };
        return importManager.scanSource(sourcePath);
      },
      scanGitRepository: async (params?: unknown) => {
        const { repositoryUrl } = params as { repositoryUrl: string };
        return importManager.scanGitRepository(repositoryUrl);
      },
      importCandidates: async (params?: unknown) => {
        const {
          sessionId,
          candidateIds,
          acknowledgeWarnings
        } = params as {
          sessionId: string;
          candidateIds: string[];
          acknowledgeWarnings: boolean;
        };

        return importManager.importCandidates(sessionId, candidateIds, acknowledgeWarnings);
      },
      listTrackedRepositories: () => {
        const store = initializeLibraryStore(bootstrapState.managedPaths);

        try {
          return store.listGitBindings();
        } finally {
          store.close();
        }
      },
      refreshTrackedRepositoryStatus: (params?: unknown) => {
        const { gitBindingId } = params as { gitBindingId: string };
        return refreshTrackedRepositoryStatus(gitBindingId, bootstrapState.managedPaths);
      },
      listLibrarySkills: () => listLibrarySkills(),
      getSkillDetail: (params?: unknown) => {
        const { skillId } = params as { skillId: string };
        return libraryManagementService.getSkillDetail(skillId);
      },
      updateSkillMetadata: (params?: unknown) => {
        const { skillId, displayName, description } = params as {
          skillId: string;
          displayName: string;
          description: string | null;
        };
        return libraryManagementService.updateSkillMetadata(skillId, {
          displayName,
          description
        });
      },
      getLibrarySyncStatus: () => librarySyncService.getLibrarySyncStatus(),
      refreshConflictStatus: () => librarySyncService.refreshConflictStatus(),
      openLibraryRepoFolder: () => {
        const repo = librarySyncService.getLibraryRepoState();
        openFolderInShell(repo.repoPath);
        return { repoPath: repo.repoPath };
      },
      initializeLibraryRepo: (params?: unknown) => {
        const { remoteUrl } = params as { remoteUrl: string | null };
        return librarySyncService.initializeLibraryRepo(remoteUrl);
      },
      syncLibraryRepo: (params?: unknown) => {
        const { message } = params as { message: string };
        return librarySyncService.syncLibraryRepo(message);
      },
      updateAutoSyncSetting: (params?: unknown) => {
        const { autoSyncEnabled } = params as { autoSyncEnabled: boolean };
        bootstrapState.settings = saveAppSettings(bootstrapState.managedPaths, {
          ...bootstrapState.settings,
          sync: {
            ...bootstrapState.settings.sync,
            autoSyncEnabled
          }
        });

        return bootstrapState.settings;
      },
      updateAgentPaths: (params?: unknown) => {
        const { codexGlobal, claudeGlobal } = params as {
          codexGlobal: string;
          claudeGlobal: string;
        };

        bootstrapState.settings = saveAppSettings(bootstrapState.managedPaths, {
          ...bootstrapState.settings,
          agentPaths: {
            codexGlobal,
            claudeGlobal
          }
        });

        return bootstrapState.settings;
      },
      installSkill: (params?: unknown) => {
        const { skillId, platform } = params as {
          skillId: string;
          platform: "codex" | "claude-code";
        };
        return deploymentService.installSkill(skillId, platform, bootstrapState.settings);
      },
      updateInstalledSkill: (params?: unknown) => {
        const { skillId, platform } = params as {
          skillId: string;
          platform: "codex" | "claude-code";
        };
        return deploymentService.updateSkill(skillId, platform, bootstrapState.settings);
      },
      uninstallSkill: (params?: unknown) => {
        const { skillId, platform } = params as {
          skillId: string;
          platform: "codex" | "claude-code";
        };
        return deploymentService.uninstallSkill(skillId, platform);
      },
      deleteLibrarySkill: (params?: unknown) => {
        const { skillId } = params as { skillId: string };
        return deploymentService.deleteSkill(skillId);
      }
    },
    messages: {}
  }
});

new BrowserWindow({
  title: "SkillKeeper",
  frame: {
    x: 0,
    y: 0,
    width: 1180,
    height: 780
  },
  url: "views://main/index.html",
  titleBarStyle: "default",
  rpc
});
