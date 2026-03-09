import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { bootstrapApplication, saveAppSettings } from "../bootstrap/runtime";
import { createDefaultSettings, resolveManagedPaths } from "../../shared/bootstrap";
import { ImportManager } from "../imports/service";
import { DeploymentService } from "../deployment/service";
import { LibraryManagementService } from "../library/management";
import { initializeLibraryStore } from "../library/store";
import { LibrarySyncService } from "../sync/service";
import { buildMvpReadinessChecklist, evaluatePrdMetrics } from "../../shared/mvp-readiness";

interface SmokeStepResult {
  name: string;
  passed: boolean;
  detail: string;
}

interface ReadinessReport {
  generatedAt: string;
  environment: {
    platform: NodeJS.Platform;
    bun: string;
    gitVersion: string | null;
  };
  smoke: {
    platform: "windows";
    steps: SmokeStepResult[];
  };
  benchmarks: {
    folderImportMs: number;
    localCloneScanMs: number;
    deploymentAttempts: number;
    deploymentSuccesses: number;
  };
  evaluation: ReturnType<typeof evaluatePrdMetrics>;
  checklist: ReturnType<typeof buildMvpReadinessChecklist>;
  knownGaps: string[];
}

function runGit(args: string[], cwd?: string) {
  return spawnSync("git", args, {
    cwd,
    encoding: "utf8"
  });
}

function createSkillDirectory(parentDirectory: string, name: string) {
  const skillDirectory = join(parentDirectory, name);
  mkdirSync(skillDirectory, { recursive: true });
  writeFileSync(join(skillDirectory, "SKILL.md"), `# ${name}\n\nDescription for ${name}.\n`, "utf8");
  writeFileSync(join(skillDirectory, "prompt.txt"), "v1\n", "utf8");
  return skillDirectory;
}

function createTrackedRemote(rootDirectory: string): string {
  const sourceRepo = join(rootDirectory, "source-repo");
  const remoteRepo = join(rootDirectory, "remote-repo.git");

  mkdirSync(sourceRepo, { recursive: true });
  runGit(["init", "-b", "main"], sourceRepo);
  runGit(["config", "user.name", "SkillKeeper"], sourceRepo);
  runGit(["config", "user.email", "skillkeeper@example.test"], sourceRepo);
  createSkillDirectory(sourceRepo, "git-skill");
  runGit(["add", "."], sourceRepo);
  runGit(["commit", "-m", "Seed skills"], sourceRepo);

  runGit(["init", "--bare", remoteRepo]);
  runGit(["remote", "add", "origin", remoteRepo], sourceRepo);
  runGit(["push", "-u", "origin", "main"], sourceRepo);

  return remoteRepo;
}

async function main() {
  const root = mkdtempSync(join(tmpdir(), "skillkeeper-mvp-readiness-"));

  try {
    const bootstrapState = bootstrapApplication({ homeDirectory: root });
    const managedPaths = resolveManagedPaths(root);
    const smokeSteps: SmokeStepResult[] = [];

    const settings = createDefaultSettings(root);
    settings.agentPaths.codexGlobal = join(root, "targets", "codex", "skills");
    settings.agentPaths.claudeGlobal = join(root, "targets", "claude", "skills");
    settings.sync.autoSyncEnabled = true;
    const savedSettings = saveAppSettings(managedPaths, settings);
    smokeSteps.push({
      name: "bootstrap-and-settings",
      passed:
        bootstrapState.status !== "error" &&
        JSON.parse(readFileSync(managedPaths.settings, "utf8")).sync.autoSyncEnabled === true,
      detail: "Bootstrapped managed paths and persisted auto-sync plus agent settings."
    });

    const importSource = join(root, "folder-source");
    mkdirSync(importSource, { recursive: true });
    createSkillDirectory(importSource, "daily-brief");
    const importManager = new ImportManager(managedPaths);
    const folderImportStart = performance.now();
    const folderScan = await importManager.scanSource(importSource);
    const folderImport = importManager.importCandidates(
      folderScan.sessionId,
      folderScan.candidates.map((candidate) => candidate.id),
      true
    );
    const folderImportMs = performance.now() - folderImportStart;
    smokeSteps.push({
      name: "folder-import",
      passed: folderImport.imported.length === 1,
      detail: `Imported ${folderImport.imported.length} skill from folder source.`
    });

    const remoteRepo = createTrackedRemote(root);
    const cloneStart = performance.now();
    const gitScan = await importManager.scanGitRepository(remoteRepo);
    const localCloneScanMs = performance.now() - cloneStart;
    smokeSteps.push({
      name: "git-clone-scan",
      passed: gitScan.candidates.length > 0 && gitScan.trackedRepository != null,
      detail: `Cloned local remote and scanned ${gitScan.candidates.length} candidate skill(s).`
    });

    const deploymentService = new DeploymentService(managedPaths);
    const managementService = new LibraryManagementService(managedPaths);
    const importedSkill = folderImport.imported[0];
    if (!importedSkill) {
      throw new Error("Folder import did not produce an imported skill.");
    }

    const codexBinding = deploymentService.installSkill(importedSkill.skillId, "codex", savedSettings);
    const claudeBinding = deploymentService.installSkill(
      importedSkill.skillId,
      "claude-code",
      savedSettings
    );
    const detail = managementService.getSkillDetail(importedSkill.skillId);
    smokeSteps.push({
      name: "deployment-and-library-management",
      passed:
        codexBinding.installStatus === "installed" &&
        claudeBinding.installStatus === "installed" &&
        detail.fileTree.length > 0,
      detail: "Installed the imported skill to Codex and Claude Code and loaded library detail."
    });

    const syncService = new LibrarySyncService(managedPaths);
    syncService.initializeLibraryRepo(null);
    runGit(["config", "user.name", "SkillKeeper"], managedPaths.library);
    runGit(["config", "user.email", "skillkeeper@example.test"], managedPaths.library);
    const syncJob = syncService.syncLibraryRepo("Windows smoke sync");
    smokeSteps.push({
      name: "library-sync",
      passed: syncJob.status === "succeeded",
      detail: `Library repo sync finished with status ${syncJob.status}.`
    });

    const deploymentAttempts = 20;
    let deploymentSuccesses = 0;
    for (let attempt = 0; attempt < deploymentAttempts; attempt += 1) {
      try {
        deploymentService.updateSkill(importedSkill.skillId, "codex", savedSettings);
        deploymentService.updateSkill(importedSkill.skillId, "claude-code", savedSettings);
        deploymentSuccesses += 1;
      } catch {
        // Count as a failed deployment attempt.
      }
    }

    const finalBootstrapState = bootstrapApplication({ homeDirectory: root });
    const finalSyncStatus = syncService.getLibrarySyncStatus();
    const store = initializeLibraryStore(managedPaths);
    const librarySkills = managementService.listSkillSummaries();
    store.close();

    const evaluation = evaluatePrdMetrics({
      importMs: folderImportMs,
      cloneMs: localCloneScanMs,
      deploymentAttempts,
      deploymentSuccesses
    });

    const report: ReadinessReport = {
      generatedAt: new Date().toISOString(),
      environment: {
        platform: process.platform,
        bun: Bun.version,
        gitVersion: finalBootstrapState.git.version
      },
      smoke: {
        platform: "windows",
        steps: smokeSteps
      },
      benchmarks: {
        folderImportMs,
        localCloneScanMs,
        deploymentAttempts,
        deploymentSuccesses
      },
      evaluation,
      checklist: buildMvpReadinessChecklist(finalBootstrapState, librarySkills, finalSyncStatus),
      knownGaps: [
        "macOS and Linux smoke tests are defined separately but were not executed from this Windows environment.",
        "The clone benchmark uses a local bare Git remote, so it excludes network latency and credential prompts.",
        "Deployment reliability measures managed file-copy operations only, not live agent invocation."
      ]
    };

    const outputDirectory = join(process.cwd(), "docs");
    mkdirSync(outputDirectory, { recursive: true });
    const outputPath = join(outputDirectory, "mvp-readiness-report.json");
    writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

await main();
