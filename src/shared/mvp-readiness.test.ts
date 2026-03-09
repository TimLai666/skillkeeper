import { describe, expect, test } from "bun:test";
import type { BootstrapState } from "./bootstrap";
import type { LibrarySkillSummary } from "./library-management";
import type { LibrarySyncStatus } from "./library-sync";
import {
  buildMvpReadinessChecklist,
  evaluatePrdMetrics,
  getEmptyStateContent
} from "./mvp-readiness";

const bootstrapState: BootstrapState = {
  status: "ready",
  dataRoot: "/tmp/.skillkeeper",
  managedPaths: {
    root: "/tmp/.skillkeeper",
    library: "/tmp/.skillkeeper/library",
    skills: "/tmp/.skillkeeper/library/skills",
    repos: "/tmp/.skillkeeper/repos",
    cache: "/tmp/.skillkeeper/cache",
    logs: "/tmp/.skillkeeper/logs",
    settings: "/tmp/.skillkeeper/settings.json",
    database: "/tmp/.skillkeeper/db.sqlite"
  },
  settings: {
    agentPaths: {
      codexGlobal: "/tmp/.agents/skills",
      claudeGlobal: "/tmp/.claude/skills"
    },
    git: {
      authMode: "system"
    },
    sync: {
      autoSyncEnabled: true
    }
  },
  settingsLoadedFromDisk: true,
  git: {
    available: true,
    executablePath: "/usr/bin/git",
    version: "git version 2.50.0",
    diagnostic: null
  },
  issues: []
};

const trackedSkill: LibrarySkillSummary = {
  skill: {
    id: "skill-1",
    slug: "daily-brief",
    displayName: "Daily Brief",
    description: "Summarizes the day.",
    sourceKind: "git",
    sourcePath: "https://example.com/skills.git",
    libraryPath: "/tmp/.skillkeeper/library/skills/daily-brief",
    status: "ready",
    gitBindingId: "git-1",
    createdAt: "2026-03-09T00:00:00.000Z",
    updatedAt: "2026-03-09T00:00:00.000Z",
    lastSeenAt: "2026-03-09T00:00:00.000Z"
  },
  gitBinding: {
    id: "git-1",
    repoPath: "/tmp/repo",
    remoteUrl: "https://example.com/skills.git",
    defaultBranch: "main",
    isReadOnly: true,
    upstreamStatus: "synced",
    createdAt: "2026-03-09T00:00:00.000Z",
    updatedAt: "2026-03-09T00:00:00.000Z"
  },
  deployments: [
    {
      id: "binding-1",
      skillId: "skill-1",
      platform: "codex",
      installPath: "/tmp/.agents/skills/daily-brief",
      installStatus: "installed",
      installedAt: "2026-03-09T00:00:00.000Z",
      updatedAt: "2026-03-09T00:00:00.000Z"
    }
  ],
  installedAgents: ["codex"]
};

const healthySyncStatus: LibrarySyncStatus = {
  repo: {
    repoPath: "/tmp/.skillkeeper/library",
    remoteUrl: "https://example.com/library.git",
    defaultBranch: "main",
    isInitialized: true
  },
  conflict: {
    hasConflict: false,
    conflictedFiles: [],
    lastFailureDetail: null,
    updatedAt: "2026-03-09T00:00:00.000Z"
  },
  recentJobs: [
    {
      id: "job-1",
      targetScope: "library",
      targetId: "/tmp/.skillkeeper/library",
      status: "succeeded",
      startedAt: "2026-03-09T00:00:00.000Z",
      completedAt: "2026-03-09T00:00:02.000Z",
      detail: "Manual library sync"
    }
  ]
};

describe("MVP readiness helpers", () => {
  test("builds a complete acceptance checklist for a healthy workflow", () => {
    const checklist = buildMvpReadinessChecklist(
      bootstrapState,
      [trackedSkill],
      healthySyncStatus
    );

    expect(checklist.map((item) => item.status)).toEqual([
      "complete",
      "complete",
      "complete",
      "complete",
      "complete",
      "complete"
    ]);
    expect(checklist[0]?.id).toBe("bootstrap");
    expect(checklist[5]?.id).toBe("conflict-recovery");
  });

  test("flags pending and blocked checklist items when setup is incomplete", () => {
    const checklist = buildMvpReadinessChecklist(bootstrapState, [], {
      repo: {
        repoPath: "/tmp/.skillkeeper/library",
        remoteUrl: null,
        defaultBranch: "main",
        isInitialized: true
      },
      conflict: {
        hasConflict: true,
        conflictedFiles: ["skills/daily-brief/SKILL.md"],
        lastFailureDetail: "Merge conflict detected.",
        updatedAt: "2026-03-09T00:00:00.000Z"
      },
      recentJobs: [
        {
          id: "job-2",
          targetScope: "library",
          targetId: "/tmp/.skillkeeper/library",
          status: "failed",
          startedAt: "2026-03-09T00:00:00.000Z",
          completedAt: "2026-03-09T00:00:02.000Z",
          detail: "Merge conflict detected."
        }
      ]
    });

    expect(checklist.find((item) => item.id === "import")?.status).toBe("pending");
    expect(checklist.find((item) => item.id === "deployment")?.status).toBe("pending");
    expect(checklist.find((item) => item.id === "sync")?.status).toBe("blocked");
    expect(checklist.find((item) => item.id === "conflict-recovery")?.status).toBe("blocked");
  });

  test("evaluates PRD metrics against accepted thresholds", () => {
    expect(
      evaluatePrdMetrics({
        importMs: 1200,
        cloneMs: 5400,
        deploymentAttempts: 20,
        deploymentSuccesses: 20
      }).allPassed
    ).toBe(true);

    const failed = evaluatePrdMetrics({
      importMs: 12000,
      cloneMs: 61000,
      deploymentAttempts: 20,
      deploymentSuccesses: 18
    });

    expect(failed.allPassed).toBe(false);
    expect(failed.metrics.importTargetMet).toBe(false);
    expect(failed.metrics.cloneTargetMet).toBe(false);
    expect(failed.metrics.deploymentTargetMet).toBe(false);
  });

  test("returns reusable empty-state copy for MVP pages", () => {
    expect(getEmptyStateContent("library-skills")).toEqual({
      title: "No skills in the library yet",
      detail: "Import a folder, archive, or Git repository to start managing skills."
    });

    expect(getEmptyStateContent("sync-conflicts").detail).toContain(
      "No unresolved library sync conflicts"
    );
  });
});
