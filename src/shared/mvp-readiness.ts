import type { BootstrapState } from "./bootstrap";
import type { LibrarySkillSummary } from "./library-management";
import type { LibrarySyncStatus } from "./library-sync";

export type ReadinessStatus = "complete" | "pending" | "blocked";

export interface MvpReadinessChecklistItem {
  id:
    | "bootstrap"
    | "import"
    | "library-management"
    | "deployment"
    | "sync"
    | "conflict-recovery";
  label: string;
  status: ReadinessStatus;
  detail: string;
}

export interface PrdMetricEvaluation {
  allPassed: boolean;
  metrics: {
    importMs: number;
    importTargetMs: number;
    importTargetMet: boolean;
    cloneMs: number;
    cloneTargetMs: number;
    cloneTargetMet: boolean;
    deploymentSuccessRate: number;
    deploymentTargetRate: number;
    deploymentTargetMet: boolean;
  };
}

export type EmptyStateKey =
  | "library-skills"
  | "skill-detail"
  | "sync-jobs"
  | "sync-conflicts"
  | "deployments"
  | "file-tree"
  | "skill-markdown"
  | "git-history";

export interface EmptyStateContent {
  title: string;
  detail: string;
}

export function buildMvpReadinessChecklist(
  bootstrapState: BootstrapState,
  librarySkills: LibrarySkillSummary[],
  syncStatus: LibrarySyncStatus | null
): MvpReadinessChecklistItem[] {
  const hasSkills = librarySkills.length > 0;
  const hasDeployment = librarySkills.some((skill) => skill.installedAgents.length > 0);
  const hasValidAgentPaths =
    Boolean(bootstrapState.settings.agentPaths.codexGlobal.trim()) &&
    Boolean(bootstrapState.settings.agentPaths.claudeGlobal.trim());
  const lastSyncJob = syncStatus?.recentJobs[0] ?? null;

  return [
    {
      id: "bootstrap",
      label: "Bootstrap",
      status:
        bootstrapState.status === "error"
          ? "blocked"
          : bootstrapState.status === "warning"
            ? "pending"
            : "complete",
      detail:
        bootstrapState.status === "ready"
          ? "App storage, default settings, and Git readiness resolved successfully."
          : bootstrapState.issues[0] ?? "Bootstrap still needs attention before release."
    },
    {
      id: "import",
      label: "Import Workflow",
      status: hasSkills ? "complete" : "pending",
      detail: hasSkills
        ? `${librarySkills.length} skill${librarySkills.length === 1 ? "" : "s"} imported into the managed library.`
        : "Import a folder, archive, or Git repository to validate intake."
    },
    {
      id: "library-management",
      label: "Library Management",
      status: hasSkills ? "complete" : "pending",
      detail: hasSkills
        ? "Library list and detail workflows have managed skill data to inspect."
        : "Import at least one skill to validate metadata, file tree, and history views."
    },
    {
      id: "deployment",
      label: "Deployment",
      status:
        !hasValidAgentPaths ? "blocked" : hasDeployment ? "complete" : "pending",
      detail: !hasValidAgentPaths
        ? "Configure both Codex and Claude Code global paths before deployment."
        : hasDeployment
          ? "At least one skill is installed to a target agent path."
          : "Deploy a library skill to Codex or Claude Code to complete validation."
    },
    {
      id: "sync",
      label: "Library Sync",
      status:
        syncStatus?.conflict.hasConflict || lastSyncJob?.status === "failed"
          ? "blocked"
          : syncStatus?.repo.isInitialized && lastSyncJob?.status === "succeeded"
            ? "complete"
            : "pending",
      detail:
        syncStatus?.conflict.hasConflict
          ? syncStatus.conflict.lastFailureDetail ?? "Resolve the Library Repo conflict before release."
          : lastSyncJob?.status === "succeeded"
            ? "Library Repo has completed at least one successful sync."
            : syncStatus?.repo.isInitialized
              ? "Run a sync job to validate fetch, commit, and push behavior."
              : "Initialize the Library Repo before validating sync."
    },
    {
      id: "conflict-recovery",
      label: "Conflict Recovery",
      status: syncStatus?.conflict.hasConflict ? "blocked" : "complete",
      detail: syncStatus?.conflict.hasConflict
        ? `${syncStatus.conflict.conflictedFiles.length} conflicted file${
            syncStatus.conflict.conflictedFiles.length === 1 ? "" : "s"
          } still require manual resolution.`
        : "No unresolved Library Repo conflicts are blocking release."
    }
  ];
}

export function evaluatePrdMetrics(input: {
  importMs: number;
  cloneMs: number;
  deploymentAttempts: number;
  deploymentSuccesses: number;
}): PrdMetricEvaluation {
  const importTargetMs = 10_000;
  const cloneTargetMs = 60_000;
  const deploymentTargetRate = 0.95;
  const deploymentSuccessRate =
    input.deploymentAttempts === 0 ? 0 : input.deploymentSuccesses / input.deploymentAttempts;

  const metrics = {
    importMs: input.importMs,
    importTargetMs,
    importTargetMet: input.importMs < importTargetMs,
    cloneMs: input.cloneMs,
    cloneTargetMs,
    cloneTargetMet: input.cloneMs < cloneTargetMs,
    deploymentSuccessRate,
    deploymentTargetRate,
    deploymentTargetMet: deploymentSuccessRate > deploymentTargetRate
  };

  return {
    allPassed:
      metrics.importTargetMet &&
      metrics.cloneTargetMet &&
      metrics.deploymentTargetMet,
    metrics
  };
}

export function getEmptyStateContent(key: EmptyStateKey): EmptyStateContent {
  switch (key) {
    case "library-skills":
      return {
        title: "No skills in the library yet",
        detail: "Import a folder, archive, or Git repository to start managing skills."
      };
    case "skill-detail":
      return {
        title: "No skill selected",
        detail: "Choose a library skill to inspect metadata, files, deployment state, and Git history."
      };
    case "sync-jobs":
      return {
        title: "No library sync jobs yet",
        detail: "Initialize the Library Repo and run a sync to populate the release log."
      };
    case "sync-conflicts":
      return {
        title: "Conflict queue is clear",
        detail: "No unresolved library sync conflicts are blocking the MVP right now."
      };
    case "deployments":
      return {
        title: "No installed agents yet",
        detail: "Install this skill to Codex or Claude Code to validate deployment."
      };
    case "file-tree":
      return {
        title: "No library files found",
        detail: "The managed library copy is empty or missing."
      };
    case "skill-markdown":
      return {
        title: "No SKILL.md preview available",
        detail: "This library copy does not currently expose a readable SKILL.md file."
      };
    case "git-history":
      return {
        title: "No Git history available",
        detail: "This skill is not linked to a tracked Git repository yet."
      };
  }
}
