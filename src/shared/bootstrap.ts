import path from "node:path";

export type BootstrapStatus = "ready" | "warning" | "error";
export type SupportedPlatform = "win32" | "darwin" | "linux";

export type ManagedPathKey =
  | "root"
  | "library"
  | "skills"
  | "repos"
  | "cache"
  | "logs"
  | "settings"
  | "database";

export type ManagedPaths = Record<ManagedPathKey, string>;

export interface AppSettings {
  agentPaths: {
    codexGlobal: string;
    claudeGlobal: string;
  };
  git: {
    authMode: "system";
  };
  sync: {
    autoSyncEnabled: boolean;
  };
}

export interface GitReadiness {
  available: boolean;
  executablePath: string | null;
  version: string | null;
  diagnostic: string | null;
}

export interface BootstrapState {
  status: BootstrapStatus;
  dataRoot: string;
  managedPaths: ManagedPaths;
  settings: AppSettings;
  settingsLoadedFromDisk: boolean;
  git: GitReadiness;
  issues: string[];
}

function getPathModule(platform: SupportedPlatform) {
  return platform === "win32" ? path.win32 : path.posix;
}

export function normalizePlatform(platform: NodeJS.Platform): SupportedPlatform {
  return platform === "win32" ? "win32" : platform === "darwin" ? "darwin" : "linux";
}

export function resolveDataRoot(
  homeDirectory: string,
  platform: SupportedPlatform = normalizePlatform(process.platform)
): string {
  return getPathModule(platform).join(homeDirectory, ".skillkeeper");
}

export function resolveManagedPaths(
  homeDirectory: string,
  platform: SupportedPlatform = normalizePlatform(process.platform)
): ManagedPaths {
  const pathModule = getPathModule(platform);
  const root = resolveDataRoot(homeDirectory, platform);
  const library = pathModule.join(root, "library");
  const skills = pathModule.join(library, "skills");
  const repos = pathModule.join(root, "repos");
  const cache = pathModule.join(root, "cache");
  const logs = pathModule.join(root, "logs");
  const settings = pathModule.join(root, "settings.json");
  const database = pathModule.join(root, "db.sqlite");

  return {
    root,
    library,
    skills,
    repos,
    cache,
    logs,
    settings,
    database
  };
}

export function createDefaultSettings(
  homeDirectory: string,
  platform: SupportedPlatform = normalizePlatform(process.platform)
): AppSettings {
  const pathModule = getPathModule(platform);

  return {
    agentPaths: {
      codexGlobal: pathModule.join(homeDirectory, ".agents", "skills"),
      claudeGlobal: pathModule.join(homeDirectory, ".claude", "skills")
    },
    git: {
      authMode: "system"
    },
    sync: {
      autoSyncEnabled: false
    }
  };
}

export function listBootstrapDirectories(paths: ManagedPaths): string[] {
  return [
    paths.root,
    paths.library,
    paths.skills,
    paths.repos,
    paths.cache,
    paths.logs,
    path.dirname(paths.settings),
    path.dirname(paths.database)
  ];
}
