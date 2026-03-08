import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import type { AppSettings, BootstrapState, GitReadiness } from "../../shared/bootstrap";
import {
  createDefaultSettings,
  listBootstrapDirectories,
  resolveManagedPaths
} from "../../shared/bootstrap";

export interface BootstrapRuntimeOptions {
  homeDirectory?: string;
  env?: NodeJS.ProcessEnv;
  detectGit?: (env: NodeJS.ProcessEnv) => GitReadiness;
}

type SpawnResult = ReturnType<typeof spawnSync>;
type SpawnCommand = (
  command: string,
  args: string[],
  options: {
    encoding: BufferEncoding;
    env: NodeJS.ProcessEnv;
  }
) => SpawnResult;

function normalizeCommandOutput(output: string | Buffer | null | undefined): string {
  if (typeof output === "string") {
    return output;
  }

  if (output == null) {
    return "";
  }

  return output.toString("utf8");
}

function ensureBootstrapFiles(homeDirectory: string): {
  managedPaths: ReturnType<typeof resolveManagedPaths>;
  settings: AppSettings;
  settingsLoadedFromDisk: boolean;
} {
  const managedPaths = resolveManagedPaths(homeDirectory);

  for (const directory of listBootstrapDirectories(managedPaths)) {
    mkdirSync(directory, { recursive: true });
  }

  if (!existsSync(managedPaths.database)) {
    writeFileSync(managedPaths.database, "");
  }

  const defaultSettings = createDefaultSettings(homeDirectory);

  if (!existsSync(managedPaths.settings)) {
    writeFileSync(
      managedPaths.settings,
      `${JSON.stringify(defaultSettings, null, 2)}\n`,
      "utf8"
    );

    return {
      managedPaths,
      settings: defaultSettings,
      settingsLoadedFromDisk: false
    };
  }

  const settings = JSON.parse(
    readFileSync(managedPaths.settings, "utf8")
  ) as AppSettings;

  return {
    managedPaths,
    settings,
    settingsLoadedFromDisk: true
  };
}

export function detectSystemGit(
  env: NodeJS.ProcessEnv = process.env,
  runCommand: SpawnCommand = spawnSync
): GitReadiness {
  const versionCheck = runCommand("git", ["--version"], {
    encoding: "utf8",
    env
  });

  if (versionCheck.error || versionCheck.status !== 0) {
    return {
      available: false,
      executablePath: null,
      version: null,
      diagnostic:
        versionCheck.error?.message ||
        normalizeCommandOutput(versionCheck.stderr).trim() ||
        "Git executable was not found in PATH."
    };
  }

  const locatorCommand = process.platform === "win32" ? "where" : "which";
  const locationCheck = runCommand(locatorCommand, ["git"], {
    encoding: "utf8",
    env
  });

  const executablePath =
    locationCheck.status === 0
      ? normalizeCommandOutput(locationCheck.stdout)
          .split(/\r?\n/)
          .map((line) => line.trim())
          .find(Boolean) ?? null
      : null;

  return {
    available: true,
    executablePath,
    version: normalizeCommandOutput(versionCheck.stdout).trim() || null,
    diagnostic: null
  };
}

export function bootstrapApplication(
  options: BootstrapRuntimeOptions = {}
): BootstrapState {
  const homeDirectory = options.homeDirectory ?? homedir();
  const env = options.env ?? process.env;
  const detectGit = options.detectGit ?? detectSystemGit;

  try {
    const { managedPaths, settings, settingsLoadedFromDisk } =
      ensureBootstrapFiles(homeDirectory);
    const git = detectGit(env);
    const issues = git.available ? [] : [git.diagnostic ?? "Git is unavailable."];

    return {
      status: git.available ? "ready" : "warning",
      dataRoot: managedPaths.root,
      managedPaths,
      settings,
      settingsLoadedFromDisk,
      git,
      issues
    };
  } catch (error) {
    const managedPaths = resolveManagedPaths(homeDirectory);
    const fallbackSettings = createDefaultSettings(homeDirectory);
    const message =
      error instanceof Error ? error.message : "Unknown bootstrap failure.";

    return {
      status: "error",
      dataRoot: managedPaths.root,
      managedPaths,
      settings: fallbackSettings,
      settingsLoadedFromDisk: false,
      git: {
        available: false,
        executablePath: null,
        version: null,
        diagnostic: "Bootstrap did not complete, so Git readiness could not be checked."
      },
      issues: [message]
    };
  }
}
