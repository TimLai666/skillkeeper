export interface LibraryMigration {
  id: number;
  name: string;
  sql: string;
}

export const libraryMigrations: LibraryMigration[] = [
  {
    id: 1,
    name: "001_initial_library_model",
    sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS git_bindings (
        id TEXT PRIMARY KEY,
        repo_path TEXT NOT NULL UNIQUE,
        remote_url TEXT,
        default_branch TEXT,
        is_read_only INTEGER NOT NULL DEFAULT 1,
        upstream_status TEXT NOT NULL DEFAULT 'unknown',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS skills (
        id TEXT PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL,
        description TEXT,
        source_kind TEXT NOT NULL,
        source_path TEXT,
        library_path TEXT NOT NULL,
        status TEXT NOT NULL,
        git_binding_id TEXT REFERENCES git_bindings(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS platform_bindings (
        id TEXT PRIMARY KEY,
        skill_id TEXT NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
        platform TEXT NOT NULL,
        install_path TEXT NOT NULL,
        install_status TEXT NOT NULL,
        installed_at TEXT,
        updated_at TEXT NOT NULL
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_bindings_skill_platform_path
        ON platform_bindings(skill_id, platform, install_path);

      CREATE TABLE IF NOT EXISTS sync_jobs (
        id TEXT PRIMARY KEY,
        target_scope TEXT NOT NULL,
        target_id TEXT,
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        detail TEXT
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `
  }
];
