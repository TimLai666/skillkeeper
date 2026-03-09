import { existsSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { Database } from "bun:sqlite";
import { listBootstrapDirectories, type ManagedPaths } from "../../shared/bootstrap";
import type {
  GitBindingRecord,
  LibrarySettingRecord,
  PlatformBindingRecord,
  SkillRecord,
  SyncJobRecord
} from "../../shared/library";
import { libraryMigrations } from "./migrations";

interface CreateSkillInput {
  slug: string;
  displayName: string;
  description?: string | null;
  sourceKind: SkillRecord["sourceKind"];
  sourcePath?: string | null;
  libraryPath: string;
  status?: SkillRecord["status"];
  gitBindingId?: string | null;
}

interface UpsertGitBindingInput {
  id?: string;
  repoPath: string;
  remoteUrl?: string | null;
  defaultBranch?: string | null;
  isReadOnly?: boolean;
  upstreamStatus?: GitBindingRecord["upstreamStatus"];
}

interface CreatePlatformBindingInput {
  id?: string;
  skillId: string;
  platform: PlatformBindingRecord["platform"];
  installPath: string;
  installStatus?: PlatformBindingRecord["installStatus"];
  installedAt?: string | null;
}

interface CreateSyncJobInput {
  id?: string;
  targetScope: SyncJobRecord["targetScope"];
  targetId?: string | null;
  status?: SyncJobRecord["status"];
  startedAt?: string;
  completedAt?: string | null;
  detail?: string | null;
}

function nowIso(): string {
  return new Date().toISOString();
}

function mapSkillRecord(row: Record<string, unknown>): SkillRecord {
  return {
    id: String(row.id),
    slug: String(row.slug),
    displayName: String(row.display_name),
    description: row.description == null ? null : String(row.description),
    sourceKind: row.source_kind as SkillRecord["sourceKind"],
    sourcePath: row.source_path == null ? null : String(row.source_path),
    libraryPath: String(row.library_path),
    status: row.status as SkillRecord["status"],
    gitBindingId: row.git_binding_id == null ? null : String(row.git_binding_id),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    lastSeenAt: String(row.last_seen_at)
  };
}

function mapGitBindingRecord(row: Record<string, unknown>): GitBindingRecord {
  return {
    id: String(row.id),
    repoPath: String(row.repo_path),
    remoteUrl: row.remote_url == null ? null : String(row.remote_url),
    defaultBranch: row.default_branch == null ? null : String(row.default_branch),
    isReadOnly: Boolean(row.is_read_only),
    upstreamStatus: row.upstream_status as GitBindingRecord["upstreamStatus"],
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at)
  };
}

function mapPlatformBindingRecord(row: Record<string, unknown>): PlatformBindingRecord {
  return {
    id: String(row.id),
    skillId: String(row.skill_id),
    platform: row.platform as PlatformBindingRecord["platform"],
    installPath: String(row.install_path),
    installStatus: row.install_status as PlatformBindingRecord["installStatus"],
    installedAt: row.installed_at == null ? null : String(row.installed_at),
    updatedAt: String(row.updated_at)
  };
}

function mapSyncJobRecord(row: Record<string, unknown>): SyncJobRecord {
  return {
    id: String(row.id),
    targetScope: row.target_scope as SyncJobRecord["targetScope"],
    targetId: row.target_id == null ? null : String(row.target_id),
    status: row.status as SyncJobRecord["status"],
    startedAt: String(row.started_at),
    completedAt: row.completed_at == null ? null : String(row.completed_at),
    detail: row.detail == null ? null : String(row.detail)
  };
}

export class LibraryStore {
  constructor(
    readonly database: Database,
    readonly managedPaths: ManagedPaths
  ) {}

  static open(managedPaths: ManagedPaths): LibraryStore {
    for (const directory of listBootstrapDirectories(managedPaths)) {
      mkdirSync(directory, { recursive: true });
    }

    const database = new Database(managedPaths.database);
    database.exec("PRAGMA foreign_keys = ON;");
    applyLibraryMigrations(database);
    return new LibraryStore(database, managedPaths);
  }

  close(): void {
    this.database.close(false);
  }

  createSkill(input: CreateSkillInput): SkillRecord {
    const id = randomUUID();
    const timestamp = nowIso();
    const skill: SkillRecord = {
      id,
      slug: input.slug,
      displayName: input.displayName,
      description: input.description ?? null,
      sourceKind: input.sourceKind,
      sourcePath: input.sourcePath ?? null,
      libraryPath: input.libraryPath,
      status: input.status ?? "draft",
      gitBindingId: input.gitBindingId ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastSeenAt: timestamp
    };

    this.database
      .query(
        `INSERT INTO skills (
          id, slug, display_name, description, source_kind, source_path,
          library_path, status, git_binding_id, created_at, updated_at, last_seen_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        skill.id,
        skill.slug,
        skill.displayName,
        skill.description,
        skill.sourceKind,
        skill.sourcePath,
        skill.libraryPath,
        skill.status,
        skill.gitBindingId,
        skill.createdAt,
        skill.updatedAt,
        skill.lastSeenAt
      );

    return skill;
  }

  getSkillById(id: string): SkillRecord | null {
    const row = this.database
      .query("SELECT * FROM skills WHERE id = ?")
      .get(id) as Record<string, unknown> | null;

    return row ? mapSkillRecord(row) : null;
  }

  listSkills(): SkillRecord[] {
    const rows = this.database
      .query("SELECT * FROM skills ORDER BY created_at ASC")
      .all() as Record<string, unknown>[];

    return rows.map(mapSkillRecord);
  }

  updateSkillMetadata(
    id: string,
    updates: { displayName?: string; description?: string | null; status?: SkillRecord["status"] }
  ): SkillRecord | null {
    const current = this.getSkillById(id);

    if (!current) {
      return null;
    }

    const next: SkillRecord = {
      ...current,
      displayName: updates.displayName ?? current.displayName,
      description: updates.description === undefined ? current.description : updates.description,
      status: updates.status ?? current.status,
      updatedAt: nowIso()
    };

    this.database
      .query(
        "UPDATE skills SET display_name = ?, description = ?, status = ?, updated_at = ? WHERE id = ?"
      )
      .run(next.displayName, next.description, next.status, next.updatedAt, id);

    return this.getSkillById(id);
  }

  deleteSkill(id: string): void {
    this.database.query("DELETE FROM skills WHERE id = ?").run(id);
  }

  reconcileSkillFileState(id: string): SkillRecord | null {
    const current = this.getSkillById(id);

    if (!current) {
      return null;
    }

    const nextStatus = existsSync(current.libraryPath) ? current.status : "missing_files";
    return this.updateSkillMetadata(id, { status: nextStatus });
  }

  upsertGitBinding(input: UpsertGitBindingInput): GitBindingRecord {
    const existing = this.database
      .query("SELECT * FROM git_bindings WHERE repo_path = ?")
      .get(input.repoPath) as Record<string, unknown> | null;

    const timestamp = nowIso();
    const record: GitBindingRecord = {
      id: input.id ?? (existing ? String(existing.id) : randomUUID()),
      repoPath: input.repoPath,
      remoteUrl: input.remoteUrl ?? (existing?.remote_url as string | null) ?? null,
      defaultBranch:
        input.defaultBranch ?? (existing?.default_branch as string | null) ?? null,
      isReadOnly: input.isReadOnly ?? (existing ? Boolean(existing.is_read_only) : true),
      upstreamStatus:
        input.upstreamStatus ??
        (existing?.upstream_status as GitBindingRecord["upstreamStatus"] | undefined) ??
        "unknown",
      createdAt: existing ? String(existing.created_at) : timestamp,
      updatedAt: timestamp
    };

    this.database
      .query(
        `INSERT INTO git_bindings (
          id, repo_path, remote_url, default_branch, is_read_only,
          upstream_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(repo_path) DO UPDATE SET
          remote_url = excluded.remote_url,
          default_branch = excluded.default_branch,
          is_read_only = excluded.is_read_only,
          upstream_status = excluded.upstream_status,
          updated_at = excluded.updated_at`
      )
      .run(
        record.id,
        record.repoPath,
        record.remoteUrl,
        record.defaultBranch,
        record.isReadOnly ? 1 : 0,
        record.upstreamStatus,
        record.createdAt,
        record.updatedAt
      );

    const row = this.database
      .query("SELECT * FROM git_bindings WHERE repo_path = ?")
      .get(input.repoPath) as Record<string, unknown>;

    return mapGitBindingRecord(row);
  }

  listGitBindings(): GitBindingRecord[] {
    const rows = this.database
      .query("SELECT * FROM git_bindings ORDER BY created_at ASC")
      .all() as Record<string, unknown>[];

    return rows.map(mapGitBindingRecord);
  }

  getGitBindingById(id: string): GitBindingRecord | null {
    const row = this.database
      .query("SELECT * FROM git_bindings WHERE id = ?")
      .get(id) as Record<string, unknown> | null;

    return row ? mapGitBindingRecord(row) : null;
  }

  createPlatformBinding(input: CreatePlatformBindingInput): PlatformBindingRecord {
    return this.upsertPlatformBinding(input);
  }

  listPlatformBindingsForSkill(skillId: string): PlatformBindingRecord[] {
    const rows = this.database
      .query("SELECT * FROM platform_bindings WHERE skill_id = ? ORDER BY updated_at ASC")
      .all(skillId) as Record<string, unknown>[];

    return rows.map(mapPlatformBindingRecord);
  }

  getLatestPlatformBindingForSkillPlatform(
    skillId: string,
    platform: PlatformBindingRecord["platform"]
  ): PlatformBindingRecord | null {
    const row = this.database
      .query(
        `SELECT * FROM platform_bindings
         WHERE skill_id = ? AND platform = ?
         ORDER BY updated_at DESC
         LIMIT 1`
      )
      .get(skillId, platform) as Record<string, unknown> | null;

    return row ? mapPlatformBindingRecord(row) : null;
  }

  clearPlatformBindingsForSkillPlatform(
    skillId: string,
    platform: PlatformBindingRecord["platform"]
  ): void {
    this.database
      .query("DELETE FROM platform_bindings WHERE skill_id = ? AND platform = ?")
      .run(skillId, platform);
  }

  upsertPlatformBinding(input: CreatePlatformBindingInput): PlatformBindingRecord {
    const existing = input.id
      ? (this.database
          .query("SELECT * FROM platform_bindings WHERE id = ?")
          .get(input.id) as Record<string, unknown> | null)
      : (this.database
          .query(
            `SELECT * FROM platform_bindings
             WHERE skill_id = ? AND platform = ? AND install_path = ?`
          )
          .get(input.skillId, input.platform, input.installPath) as Record<string, unknown> | null);

    const timestamp = nowIso();
    const binding: PlatformBindingRecord = {
      id: input.id ?? (existing ? String(existing.id) : randomUUID()),
      skillId: input.skillId,
      platform: input.platform,
      installPath: input.installPath,
      installStatus:
        input.installStatus ??
        (existing?.install_status as PlatformBindingRecord["installStatus"] | undefined) ??
        "installed",
      installedAt:
        input.installedAt === undefined
          ? ((existing?.installed_at as string | null | undefined) ?? timestamp)
          : input.installedAt ?? timestamp,
      updatedAt: timestamp
    };

    this.database
      .query(
        `INSERT INTO platform_bindings (
          id, skill_id, platform, install_path, install_status, installed_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          skill_id = excluded.skill_id,
          platform = excluded.platform,
          install_path = excluded.install_path,
          install_status = excluded.install_status,
          installed_at = excluded.installed_at,
          updated_at = excluded.updated_at`
      )
      .run(
        binding.id,
        binding.skillId,
        binding.platform,
        binding.installPath,
        binding.installStatus,
        binding.installedAt,
        binding.updatedAt
      );

    const row = this.database
      .query("SELECT * FROM platform_bindings WHERE id = ?")
      .get(binding.id) as Record<string, unknown>;

    return mapPlatformBindingRecord(row);
  }

  createSyncJob(input: CreateSyncJobInput): SyncJobRecord {
    const syncJob: SyncJobRecord = {
      id: input.id ?? randomUUID(),
      targetScope: input.targetScope,
      targetId: input.targetId ?? null,
      status: input.status ?? "pending",
      startedAt: input.startedAt ?? nowIso(),
      completedAt: input.completedAt ?? null,
      detail: input.detail ?? null
    };

    this.database
      .query(
        `INSERT INTO sync_jobs (
          id, target_scope, target_id, status, started_at, completed_at, detail
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        syncJob.id,
        syncJob.targetScope,
        syncJob.targetId,
        syncJob.status,
        syncJob.startedAt,
        syncJob.completedAt,
        syncJob.detail
      );

    return syncJob;
  }

  updateSyncJob(
    id: string,
    updates: {
      status: SyncJobRecord["status"];
      completedAt?: string | null;
      detail?: string | null;
    }
  ): SyncJobRecord | null {
    const current = this.database
      .query("SELECT * FROM sync_jobs WHERE id = ?")
      .get(id) as Record<string, unknown> | null;

    if (!current) {
      return null;
    }

    const next: SyncJobRecord = {
      id: String(current.id),
      targetScope: current.target_scope as SyncJobRecord["targetScope"],
      targetId: current.target_id == null ? null : String(current.target_id),
      status: updates.status,
      startedAt: String(current.started_at),
      completedAt:
        updates.completedAt === undefined
          ? (current.completed_at == null ? null : String(current.completed_at))
          : updates.completedAt,
      detail: updates.detail === undefined ? (current.detail == null ? null : String(current.detail)) : updates.detail
    };

    this.database
      .query("UPDATE sync_jobs SET status = ?, completed_at = ?, detail = ? WHERE id = ?")
      .run(next.status, next.completedAt, next.detail, id);

    return next;
  }

  listSyncJobs(): SyncJobRecord[] {
    const rows = this.database
      .query("SELECT * FROM sync_jobs ORDER BY started_at DESC")
      .all() as Record<string, unknown>[];

    return rows.map(mapSyncJobRecord);
  }

  listSyncJobsByScope(targetScope: SyncJobRecord["targetScope"]): SyncJobRecord[] {
    const rows = this.database
      .query("SELECT * FROM sync_jobs WHERE target_scope = ? ORDER BY started_at DESC")
      .all(targetScope) as Record<string, unknown>[];

    return rows.map(mapSyncJobRecord);
  }

  setSetting<T>(key: string, value: T): LibrarySettingRecord<T> {
    const record: LibrarySettingRecord<T> = {
      key,
      value,
      updatedAt: nowIso()
    };

    this.database
      .query(
        `INSERT INTO settings (key, value_json, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           value_json = excluded.value_json,
           updated_at = excluded.updated_at`
      )
      .run(record.key, JSON.stringify(record.value), record.updatedAt);

    return record;
  }

  getSetting<T>(key: string): LibrarySettingRecord<T> | null {
    const row = this.database
      .query("SELECT * FROM settings WHERE key = ?")
      .get(key) as Record<string, unknown> | null;

    if (!row) {
      return null;
    }

    return {
      key: String(row.key),
      value: JSON.parse(String(row.value_json)) as T,
      updatedAt: String(row.updated_at)
    };
  }

  listTableNames(): string[] {
    const rows = this.database
      .query(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
      )
      .all() as { name: string }[];

    return rows.map((row) => row.name);
  }
}

export function applyLibraryMigrations(database: Database): void {
  database.exec(
    "CREATE TABLE IF NOT EXISTS schema_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE, applied_at TEXT NOT NULL);"
  );

  const getMigration = database.query(
    "SELECT id FROM schema_migrations WHERE id = ?"
  );
  const insertMigration = database.query(
    "INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)"
  );

  for (const migration of libraryMigrations) {
    const applied = getMigration.get(migration.id);

    if (applied) {
      continue;
    }

    database.exec(migration.sql);
    insertMigration.run(migration.id, migration.name, nowIso());
  }
}

export function initializeLibraryStore(managedPaths: ManagedPaths): LibraryStore {
  return LibraryStore.open(managedPaths);
}
