import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { resolveManagedPaths } from "../../shared/bootstrap";
import { bootstrapApplication, detectSystemGit } from "./runtime";

const temporaryRoots: string[] = [];

afterEach(() => {
  while (temporaryRoots.length > 0) {
    const root = temporaryRoots.pop();
    if (root) {
      rmSync(root, { recursive: true, force: true });
    }
  }
});

function createHomeDirectory(): string {
  const root = mkdtempSync(join(tmpdir(), "skillkeeper-bootstrap-"));
  temporaryRoots.push(root);
  return root;
}

describe("bootstrapApplication", () => {
  test("resolves expected managed paths for supported platforms", () => {
    expect(resolveManagedPaths("C:\\Users\\tingzhen", "win32").root).toBe(
      "C:\\Users\\tingzhen\\.skillkeeper"
    );
    expect(resolveManagedPaths("/Users/tingzhen", "darwin").root).toBe(
      "/Users/tingzhen/.skillkeeper"
    );
    expect(resolveManagedPaths("/home/tingzhen", "linux").root).toBe(
      "/home/tingzhen/.skillkeeper"
    );
  });

  test("creates the expected local data root and default settings", () => {
    const homeDirectory = createHomeDirectory();
    const state = bootstrapApplication({
      homeDirectory,
      detectGit: () => ({
        available: true,
        executablePath: "/usr/bin/git",
        version: "git version 2.50.0",
        diagnostic: null
      })
    });

    expect(state.status).toBe("ready");
    expect(existsSync(state.managedPaths.root)).toBe(true);
    expect(existsSync(state.managedPaths.library)).toBe(true);
    expect(existsSync(state.managedPaths.skills)).toBe(true);
    expect(existsSync(state.managedPaths.repos)).toBe(true);
    expect(existsSync(state.managedPaths.cache)).toBe(true);
    expect(existsSync(state.managedPaths.logs)).toBe(true);
    expect(existsSync(state.managedPaths.database)).toBe(true);
    expect(existsSync(state.managedPaths.settings)).toBe(true);
    expect(state.settingsLoadedFromDisk).toBe(false);
  });

  test("loads existing settings on subsequent bootstrap", () => {
    const homeDirectory = createHomeDirectory();

    bootstrapApplication({
      homeDirectory,
      detectGit: () => ({
        available: true,
        executablePath: "/usr/bin/git",
        version: "git version 2.50.0",
        diagnostic: null
      })
    });

    const state = bootstrapApplication({
      homeDirectory,
      detectGit: () => ({
        available: true,
        executablePath: "/usr/bin/git",
        version: "git version 2.50.0",
        diagnostic: null
      })
    });

    expect(state.settingsLoadedFromDisk).toBe(true);
    expect(
      JSON.parse(readFileSync(state.managedPaths.settings, "utf8")).sync.autoSyncEnabled
    ).toBe(false);
  });

  test("reports warning state when git is missing", () => {
    const homeDirectory = createHomeDirectory();
    const state = bootstrapApplication({
      homeDirectory,
      detectGit: () => ({
        available: false,
        executablePath: null,
        version: null,
        diagnostic: "Git executable was not found in PATH."
      })
    });

    expect(state.status).toBe("warning");
    expect(state.git.available).toBe(false);
    expect(state.issues).toContain("Git executable was not found in PATH.");
  });

  test("reports error state when initialization fails", () => {
    const state = bootstrapApplication({
      homeDirectory: String.fromCharCode(0),
      detectGit: () => ({
        available: true,
        executablePath: "/usr/bin/git",
        version: "git version 2.50.0",
        diagnostic: null
      })
    });

    expect(state.status).toBe("error");
    expect(state.issues.length).toBeGreaterThan(0);
  });
});

describe("detectSystemGit", () => {
  test("returns missing state when git version check fails", () => {
    const git = detectSystemGit({}, () => ({
        error: new Error("spawn git ENOENT"),
        status: null,
        stdout: "",
        stderr: ""
      } as ReturnType<typeof import("node:child_process").spawnSync>));

    expect(git.available).toBe(false);
    expect(git.diagnostic).toContain("ENOENT");
  });
});
