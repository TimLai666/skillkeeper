import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { basename, dirname, extname, join, relative } from "node:path";
import { randomUUID } from "node:crypto";
import { unzipSync } from "fflate";
import type { ManagedPaths } from "../../shared/bootstrap";
import type {
  ArchiveFormat,
  ImportCandidate,
  ImportCommitResult,
  ImportIssue,
  ImportScanResult,
  ImportSourceKind
} from "../../shared/imports";
import { initializeLibraryStore } from "../library/store";
import { createTrackedRepository } from "../git/source-repos";
import type { GitBindingRecord } from "../../shared/library";

const OPTIONAL_SKILL_DIRECTORIES = ["scripts", "assets", "references"] as const;
const SCRIPT_EXTENSIONS = new Set([".sh", ".ps1", ".bat"]);
const SCAN_SKIP_DIRECTORIES = new Set([".git", "node_modules"]);

interface ImportSession {
  id: string;
  sourceKind: ImportSourceKind;
  archiveFormat: ArchiveFormat | null;
  sourcePath: string;
  scanRoot: string;
  extractionPath: string | null;
  candidates: ImportCandidate[];
  gitBindingId: string | null;
}

interface ImportManagerOptions {
  onLibraryMutation?: (message: string) => void;
}

function normalizeArchiveEntryPath(entryPath: string): string {
  const normalized = entryPath.replaceAll("\\", "/").replace(/^\/+/, "");
  const segments = normalized.split("/").filter(Boolean);

  if (normalized.includes(":") || segments.some((segment) => segment === "..")) {
    throw new Error(`Unsafe archive entry path: ${entryPath}`);
  }

  return segments.join("/");
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || "skill";
}

function humanizeName(folderName: string): string {
  return folderName
    .split(/[-_ ]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function detectSourceKind(sourcePath: string): {
  sourceKind: ImportSourceKind;
  archiveFormat: ArchiveFormat | null;
} {
  const stats = statSync(sourcePath);

  if (stats.isDirectory()) {
    return { sourceKind: "folder", archiveFormat: null };
  }

  const lowerPath = sourcePath.toLowerCase();

  if (lowerPath.endsWith(".zip")) {
    return { sourceKind: "archive", archiveFormat: "zip" };
  }

  if (lowerPath.endsWith(".tar.gz") || lowerPath.endsWith(".tgz")) {
    return { sourceKind: "archive", archiveFormat: "tar.gz" };
  }

  throw new Error("Unsupported import source. Expected a folder, .zip, or .tar.gz file.");
}

async function extractZipArchive(archivePath: string, destination: string): Promise<void> {
  const files = unzipSync(new Uint8Array(readFileSync(archivePath)));

  for (const [entryName, content] of Object.entries(files)) {
    const normalized = normalizeArchiveEntryPath(entryName);

    if (!normalized) {
      continue;
    }

    const targetPath = join(destination, normalized);
    mkdirSync(dirname(targetPath), { recursive: true });
    writeFileSync(targetPath, content);
  }
}

async function extractTarArchive(archivePath: string, destination: string): Promise<void> {
  const listedEntries = spawnSync("tar", ["-tzf", archivePath], {
    encoding: "utf8"
  });

  if (listedEntries.status !== 0) {
    throw new Error(listedEntries.stderr || "Failed to inspect the tar.gz archive.");
  }

  for (const entryName of listedEntries.stdout.split(/\r?\n/).filter(Boolean)) {
    normalizeArchiveEntryPath(entryName);
  }

  const extracted = spawnSync("tar", ["-xzf", archivePath, "-C", destination], {
    encoding: "utf8"
  });

  if (extracted.status !== 0) {
    throw new Error(extracted.stderr || "Failed to extract the tar.gz archive.");
  }
}

function collectCandidateIssues(candidateRoot: string): {
  blockingIssues: ImportIssue[];
  warnings: ImportIssue[];
  detectedScripts: string[];
} {
  const blockingIssues: ImportIssue[] = [];
  const warnings: ImportIssue[] = [];
  const detectedScripts: string[] = [];

  if (!existsSync(join(candidateRoot, "SKILL.md"))) {
    blockingIssues.push({
      severity: "blocking",
      code: "missing-skill-md",
      message: "Missing required SKILL.md file.",
      relativePath: "SKILL.md"
    });
  }

  for (const directoryName of OPTIONAL_SKILL_DIRECTORIES) {
    const fullPath = join(candidateRoot, directoryName);
    if (existsSync(fullPath) && !statSync(fullPath).isDirectory()) {
      blockingIssues.push({
        severity: "blocking",
        code: "invalid-optional-directory",
        message: `${directoryName} must be a directory when present.`,
        relativePath: directoryName
      });
    }
  }

  const visit = (currentPath: string) => {
    for (const entry of readdirSync(currentPath, { withFileTypes: true })) {
      const fullPath = join(currentPath, entry.name);
      const relativePath = relative(candidateRoot, fullPath) || entry.name;

      if (entry.isDirectory()) {
        if (!SCAN_SKIP_DIRECTORIES.has(entry.name)) {
          visit(fullPath);
        }
        continue;
      }

      if (SCRIPT_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
        detectedScripts.push(relativePath);
        warnings.push({
          severity: "warning",
          code: "executable-script",
          message: `Executable script detected: ${relativePath}`,
          relativePath
        });
      }
    }
  };

  visit(candidateRoot);

  return { blockingIssues, warnings, detectedScripts };
}

function findCandidateRoots(scanRoot: string): string[] {
  const candidateRoots = new Set<string>();

  const visit = (currentPath: string) => {
    const entries = readdirSync(currentPath, { withFileTypes: true });
    const names = new Set(entries.map((entry) => entry.name));
    const hasSkillMarker = names.has("SKILL.md");
    const hasOptionalStructure = OPTIONAL_SKILL_DIRECTORIES.some((dirName) => names.has(dirName));
    const hasScripts = entries.some(
      (entry) => entry.isFile() && SCRIPT_EXTENSIONS.has(extname(entry.name).toLowerCase())
    );

    if (hasSkillMarker || hasOptionalStructure || hasScripts) {
      candidateRoots.add(currentPath);
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || SCAN_SKIP_DIRECTORIES.has(entry.name)) {
        continue;
      }

      visit(join(currentPath, entry.name));
    }
  };

  visit(scanRoot);

  if (candidateRoots.size === 0) {
    candidateRoots.add(scanRoot);
  }

  return [...candidateRoots].sort((left, right) => left.localeCompare(right));
}

function buildCandidate(scanRoot: string, candidateRoot: string): ImportCandidate {
  const relativePath = relative(scanRoot, candidateRoot) || ".";
  const { blockingIssues, warnings, detectedScripts } = collectCandidateIssues(candidateRoot);

  return {
    id: slugify(relativePath === "." ? basename(candidateRoot) : relativePath),
    name: humanizeName(basename(candidateRoot)),
    rootPath: candidateRoot,
    relativePath,
    canImport: blockingIssues.length === 0,
    blockingIssues,
    warnings,
    detectedScripts
  };
}

function parseSkillDescription(candidateRoot: string): string | null {
  const skillFilePath = join(candidateRoot, "SKILL.md");
  if (!existsSync(skillFilePath)) {
    return null;
  }

  const lines = readFileSync(skillFilePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.find((line) => !line.startsWith("#")) ?? null;
}

export class ImportManager {
  private readonly sessions = new Map<string, ImportSession>();

  constructor(
    private readonly managedPaths: ManagedPaths,
    private readonly options: ImportManagerOptions = {}
  ) {}

  async scanSource(sourcePath: string): Promise<ImportScanResult> {
    const { sourceKind, archiveFormat } = detectSourceKind(sourcePath);
    let scanRoot = sourcePath;
    let extractionPath: string | null = null;

    if (sourceKind === "archive") {
      extractionPath = join(this.managedPaths.cache, "imports", randomUUID());
      mkdirSync(extractionPath, { recursive: true });

      if (archiveFormat === "zip") {
        await extractZipArchive(sourcePath, extractionPath);
      } else {
        await extractTarArchive(sourcePath, extractionPath);
      }

      scanRoot = extractionPath;
    }

    const candidates = findCandidateRoots(scanRoot).map((candidateRoot) =>
      buildCandidate(scanRoot, candidateRoot)
    );
    const sessionId = randomUUID();

    this.sessions.set(sessionId, {
      id: sessionId,
      sourceKind,
      archiveFormat,
      sourcePath,
      scanRoot,
      extractionPath,
      candidates,
      gitBindingId: null
    });

    return {
      sessionId,
      sourceKind,
      archiveFormat,
      sourcePath,
      extractionPath,
      candidates,
      trackedRepository: null
    };
  }

  async scanGitRepository(repoUrl: string): Promise<ImportScanResult> {
    const store = initializeLibraryStore(this.managedPaths);
    let binding: GitBindingRecord;

    try {
      binding = createTrackedRepository(repoUrl, this.managedPaths, store);
    } finally {
      store.close();
    }

    const candidates = findCandidateRoots(binding.repoPath).map((candidateRoot) =>
      buildCandidate(binding.repoPath, candidateRoot)
    );
    const sessionId = randomUUID();

    this.sessions.set(sessionId, {
      id: sessionId,
      sourceKind: "git",
      archiveFormat: null,
      sourcePath: repoUrl,
      scanRoot: binding.repoPath,
      extractionPath: null,
      candidates,
      gitBindingId: binding.id
    });

    return {
      sessionId,
      sourceKind: "git",
      archiveFormat: null,
      sourcePath: repoUrl,
      extractionPath: null,
      candidates,
      trackedRepository: binding
    };
  }

  importCandidates(
    sessionId: string,
    candidateIds: string[],
    acknowledgeWarnings: boolean
  ): ImportCommitResult {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Import session was not found. Scan the source again.");
    }

    const selectedCandidates = session.candidates.filter((candidate) =>
      candidateIds.includes(candidate.id)
    );
    const store = initializeLibraryStore(this.managedPaths);
    const existingSlugs = new Set(store.listSkills().map((skill) => skill.slug));
    const result: ImportCommitResult = {
      imported: [],
      skipped: []
    };

    try {
      for (const candidate of selectedCandidates) {
        if (!candidate.canImport) {
          result.skipped.push({
            candidateId: candidate.id,
            reason: "Candidate failed validation."
          });
          continue;
        }

        if (!acknowledgeWarnings && candidate.warnings.length > 0) {
          result.skipped.push({
            candidateId: candidate.id,
            reason: "Candidate has warnings that must be acknowledged."
          });
          continue;
        }

        const baseSlug = slugify(basename(candidate.rootPath));
        let nextSlug = baseSlug;
        let suffix = 2;

        while (existingSlugs.has(nextSlug)) {
          nextSlug = `${baseSlug}-${suffix}`;
          suffix += 1;
        }

        existingSlugs.add(nextSlug);

        const libraryPath = join(this.managedPaths.skills, nextSlug);
        cpSync(candidate.rootPath, libraryPath, { recursive: true });

        const skillRecord = store.createSkill({
          slug: nextSlug,
          displayName: candidate.name,
          description: parseSkillDescription(candidate.rootPath),
          sourceKind: session.sourceKind,
          sourcePath: session.sourcePath,
          libraryPath,
          status: "ready",
          gitBindingId: session.gitBindingId
        });

        result.imported.push({
          skillId: skillRecord.id,
          slug: skillRecord.slug,
          displayName: skillRecord.displayName,
          libraryPath: skillRecord.libraryPath
        });
      }
    } finally {
      store.close();
    }

    if (result.imported.length > 0) {
      this.options.onLibraryMutation?.("Import skills into library");
    }

    return result;
  }

  disposeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    if (session.extractionPath) {
      rmSync(session.extractionPath, { recursive: true, force: true });
    }

    this.sessions.delete(sessionId);
  }
}
