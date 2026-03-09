import type { BootstrapState } from "./bootstrap";
import type { LibrarySkillSummary } from "./library-management";
import type { LibrarySyncStatus } from "./library-sync";

export interface DashboardSummary {
  totalSkills: number;
  gitUpdates: number;
  syncLabel: string;
  hasEnvironmentWarning: boolean;
}

export function computeDashboardSummary(
  bootstrapState: BootstrapState,
  librarySkills: LibrarySkillSummary[],
  syncStatus: LibrarySyncStatus | null
): DashboardSummary {
  const gitUpdates = librarySkills.filter((skill) => {
    const status = skill.gitBinding?.upstreamStatus;
    return status === "behind" || status === "ahead" || status === "conflict";
  }).length;

  let syncLabel = syncStatus?.repo.isInitialized ? "Idle" : "Not initialized";
  if (syncStatus?.conflict.hasConflict) {
    syncLabel = "Conflict";
  } else if (syncStatus?.recentJobs[0]?.status === "failed") {
    syncLabel = "Failed";
  } else if (syncStatus?.recentJobs[0]?.status === "succeeded") {
    syncLabel = "Healthy";
  }

  return {
    totalSkills: librarySkills.length,
    gitUpdates,
    syncLabel,
    hasEnvironmentWarning: bootstrapState.status !== "ready"
  };
}

export function validateSettingsInput(input: {
  codexGlobal: string;
  claudeGlobal: string;
}): Record<"codexGlobal" | "claudeGlobal", string | null> {
  return {
    codexGlobal: input.codexGlobal.trim() ? null : "Codex path is required.",
    claudeGlobal: input.claudeGlobal.trim() ? null : "Claude Code path is required."
  };
}
