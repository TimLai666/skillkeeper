import type { ElectrobunRPCSchema } from "electrobun";
import type { AppSettings, BootstrapState } from "./bootstrap";
import type { LibrarySkillSummary, SkillDeletionResult, SkillDetail } from "./library-management";
import type { LibraryRepoState, LibrarySyncStatus } from "./library-sync";
import type {
  ImportCommitResult,
  ImportDialogKind,
  ImportScanResult
} from "./imports";
import type { GitBindingRecord, PlatformBindingRecord, PlatformName } from "./library";

export type ShellRPCSchema = ElectrobunRPCSchema & {
  bun: {
    requests: {
      getBootstrapState: {
        params: undefined;
        response: BootstrapState;
      };
      refreshBootstrapState: {
        params: undefined;
        response: BootstrapState;
      };
      pickImportSource: {
        params: {
          kind: ImportDialogKind;
        };
        response: {
          selectedPath: string | null;
        };
      };
      scanImportSource: {
        params: {
          sourcePath: string;
        };
        response: ImportScanResult;
      };
      scanGitRepository: {
        params: {
          repositoryUrl: string;
        };
        response: ImportScanResult;
      };
      importCandidates: {
        params: {
          sessionId: string;
          candidateIds: string[];
          acknowledgeWarnings: boolean;
        };
        response: ImportCommitResult;
      };
      listTrackedRepositories: {
        params: undefined;
        response: GitBindingRecord[];
      };
      refreshTrackedRepositoryStatus: {
        params: {
          gitBindingId: string;
        };
        response: GitBindingRecord;
      };
      listLibrarySkills: {
        params: undefined;
        response: LibrarySkillSummary[];
      };
      getSkillDetail: {
        params: {
          skillId: string;
        };
        response: SkillDetail;
      };
      updateSkillMetadata: {
        params: {
          skillId: string;
          displayName: string;
          description: string | null;
        };
        response: SkillDetail;
      };
      getLibrarySyncStatus: {
        params: undefined;
        response: LibrarySyncStatus;
      };
      initializeLibraryRepo: {
        params: {
          remoteUrl: string | null;
        };
        response: LibraryRepoState;
      };
      syncLibraryRepo: {
        params: {
          message: string;
        };
        response: import("./library").SyncJobRecord;
      };
      updateAutoSyncSetting: {
        params: {
          autoSyncEnabled: boolean;
        };
        response: AppSettings;
      };
      updateAgentPaths: {
        params: {
          codexGlobal: string;
          claudeGlobal: string;
        };
        response: AppSettings;
      };
      installSkill: {
        params: {
          skillId: string;
          platform: PlatformName;
        };
        response: PlatformBindingRecord;
      };
      updateInstalledSkill: {
        params: {
          skillId: string;
          platform: PlatformName;
        };
        response: PlatformBindingRecord;
      };
      uninstallSkill: {
        params: {
          skillId: string;
          platform: PlatformName;
        };
        response: PlatformBindingRecord;
      };
      deleteLibrarySkill: {
        params: {
          skillId: string;
        };
        response: SkillDeletionResult;
      };
    };
    messages: {};
  };
  webview: {
    requests: {};
    messages: {};
  };
};
