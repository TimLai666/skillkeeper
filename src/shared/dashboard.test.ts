import { describe, expect, test } from "bun:test";
import type { BootstrapState } from "./bootstrap";
import { computeDashboardSummary, validateSettingsInput } from "./dashboard";
import type { LibrarySkillSummary } from "./library-management";
import type { LibrarySyncStatus } from "./library-sync";

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

describe("dashboard helpers", () => {
  test("computes dashboard summaries from library and sync state", () => {
    const librarySkills: LibrarySkillSummary[] = [
      {
        skill: {
          id: "1",
          slug: "daily-brief",
          displayName: "Daily Brief",
          description: null,
          sourceKind: "git",
          sourcePath: "https://example.com/repo.git",
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
          remoteUrl: "https://example.com/repo.git",
          defaultBranch: "main",
          isReadOnly: true,
          upstreamStatus: "behind",
          createdAt: "2026-03-09T00:00:00.000Z",
          updatedAt: "2026-03-09T00:00:00.000Z"
        },
        deployments: [],
        installedAgents: []
      }
    ];

    const syncStatus: LibrarySyncStatus = {
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
          completedAt: "2026-03-09T00:01:00.000Z",
          detail: "Manual sync"
        }
      ]
    };

    expect(computeDashboardSummary(bootstrapState, librarySkills, syncStatus)).toEqual({
      totalSkills: 1,
      gitUpdates: 1,
      syncLabel: "Healthy",
      hasEnvironmentWarning: false
    });
  });

  test("validates required settings paths without storing credentials", () => {
    expect(
      validateSettingsInput({
        codexGlobal: " ",
        claudeGlobal: "/tmp/.claude/skills"
      })
    ).toEqual({
      codexGlobal: "Codex path is required.",
      claudeGlobal: null
    });
  });
});
