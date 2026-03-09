import React from "react";
import { createRoot } from "react-dom/client";
import { Electroview } from "electrobun/view";
import type { AppSettings, BootstrapState } from "../shared/bootstrap";
import type { ShellRPCSchema } from "../shared/bootstrap-rpc";
import type {
  FileTreeEntry,
  LibrarySkillSummary,
  SkillDetail
} from "../shared/library-management";
import type { LibrarySyncStatus } from "../shared/library-sync";
import type { ImportCommitResult, ImportScanResult } from "../shared/imports";
import type { GitBindingRecord, PlatformName } from "../shared/library";

const rpc = Electroview.defineRPC<ShellRPCSchema>({
  handlers: {
    requests: {},
    messages: {}
  }
});

function App(): React.JSX.Element {
  const [state, setState] = React.useState<BootstrapState | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [transportError, setTransportError] = React.useState<string | null>(null);
  const [manualImportPath, setManualImportPath] = React.useState("");
  const [gitRepositoryUrl, setGitRepositoryUrl] = React.useState("");
  const [scanResult, setScanResult] = React.useState<ImportScanResult | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = React.useState<string[]>([]);
  const [importing, setImporting] = React.useState(false);
  const [scanning, setScanning] = React.useState(false);
  const [scanError, setScanError] = React.useState<string | null>(null);
  const [importResult, setImportResult] = React.useState<ImportCommitResult | null>(null);
  const [trackedRepositories, setTrackedRepositories] = React.useState<GitBindingRecord[]>([]);
  const [librarySkills, setLibrarySkills] = React.useState<LibrarySkillSummary[]>([]);
  const [savingSettings, setSavingSettings] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState<LibrarySyncStatus | null>(null);
  const [syncRemoteUrl, setSyncRemoteUrl] = React.useState("");
  const [savingSyncSettings, setSavingSyncSettings] = React.useState(false);
  const [syncingLibraryRepo, setSyncingLibraryRepo] = React.useState(false);
  const [actionInFlight, setActionInFlight] = React.useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = React.useState<string | null>(null);
  const [selectedSkillDetail, setSelectedSkillDetail] = React.useState<SkillDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [savingMetadata, setSavingMetadata] = React.useState(false);
  const [metadataDraft, setMetadataDraft] = React.useState({
    displayName: "",
    description: ""
  });
  const [agentPaths, setAgentPaths] = React.useState<AppSettings["agentPaths"]>({
    codexGlobal: "",
    claudeGlobal: ""
  });

  React.useEffect(() => {
    if (state) {
      setAgentPaths(state.settings.agentPaths);
    }
  }, [state]);

  React.useEffect(() => {
    if (syncStatus) {
      setSyncRemoteUrl(syncStatus.repo.remoteUrl ?? "");
    }
  }, [syncStatus]);

  React.useEffect(() => {
    if (librarySkills.length === 0) {
      setSelectedSkillId(null);
      setSelectedSkillDetail(null);
      return;
    }

    if (!selectedSkillId || !librarySkills.some((entry) => entry.skill.id === selectedSkillId)) {
      setSelectedSkillId(librarySkills[0]?.skill.id ?? null);
    }
  }, [librarySkills, selectedSkillId]);

  React.useEffect(() => {
    if (!selectedSkillId) {
      setSelectedSkillDetail(null);
      return;
    }

    let active = true;
    setDetailLoading(true);

    rpc.request
      .getSkillDetail({ skillId: selectedSkillId })
      .then((detail) => {
        if (active) {
          setSelectedSkillDetail(detail);
          setMetadataDraft({
            displayName: detail.skill.displayName,
            description: detail.skill.description ?? ""
          });
        }
      })
      .catch((error) => {
        if (active) {
          setScanError(error instanceof Error ? error.message : "Failed to load skill detail.");
          setSelectedSkillDetail(null);
        }
      })
      .finally(() => {
        if (active) {
          setDetailLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedSkillId]);

  React.useEffect(() => {
    let active = true;

    Promise.all([
      rpc.request.getBootstrapState(),
      rpc.request.listTrackedRepositories(),
      rpc.request.listLibrarySkills(),
      rpc.request.getLibrarySyncStatus()
    ])
      .then(([nextState, repositories, skills, nextSyncStatus]) => {
        if (active) {
          setState(nextState);
          setTrackedRepositories(repositories);
          setLibrarySkills(skills);
          setSyncStatus(nextSyncStatus);
          setTransportError(null);
        }
      })
      .catch((error) => {
        if (active) {
          setTransportError(
            error instanceof Error ? error.message : "Failed to load bootstrap state."
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function refreshState() {
    setRefreshing(true);

    try {
      const [nextState, repositories, skills, nextSyncStatus] = await Promise.all([
        rpc.request.refreshBootstrapState(),
        rpc.request.listTrackedRepositories(),
        rpc.request.listLibrarySkills(),
        rpc.request.getLibrarySyncStatus()
      ]);
      setState(nextState);
      setTrackedRepositories(repositories);
      setLibrarySkills(skills);
      setSyncStatus(nextSyncStatus);
      setTransportError(null);
    } catch (error) {
      setTransportError(
        error instanceof Error ? error.message : "Failed to refresh bootstrap state."
      );
    } finally {
      setRefreshing(false);
    }
  }

  async function pickSource(kind: "folder" | "archive") {
    try {
      const response = await rpc.request.pickImportSource({ kind });
      if (response.selectedPath) {
        setManualImportPath(response.selectedPath);
        await scanSource(response.selectedPath);
      }
    } catch (error) {
      setScanError(
        error instanceof Error ? error.message : "Failed to open the import picker."
      );
    }
  }

  async function scanSource(sourcePath: string) {
    if (!sourcePath.trim()) {
      setScanError("Provide a folder or archive path before scanning.");
      return;
    }

    setScanning(true);
    setScanError(null);
    setImportResult(null);

    try {
      const nextScanResult = await rpc.request.scanImportSource({ sourcePath });
      setScanResult(nextScanResult);
      setSelectedCandidateIds(
        nextScanResult.candidates.filter((candidate) => candidate.canImport).map((candidate) => candidate.id)
      );
    } catch (error) {
      setScanError(
        error instanceof Error ? error.message : "Failed to scan the import source."
      );
      setScanResult(null);
      setSelectedCandidateIds([]);
    } finally {
      setScanning(false);
    }
  }

  async function scanGitRepository(repositoryUrl: string) {
    if (!repositoryUrl.trim()) {
      setScanError("Provide a repository URL before cloning.");
      return;
    }

    setScanning(true);
    setScanError(null);
    setImportResult(null);

    try {
      const nextScanResult = await rpc.request.scanGitRepository({ repositoryUrl });
      setScanResult(nextScanResult);
      setTrackedRepositories(await rpc.request.listTrackedRepositories());
      setSelectedCandidateIds(
        nextScanResult.candidates.filter((candidate) => candidate.canImport).map((candidate) => candidate.id)
      );
    } catch (error) {
      setScanError(
        error instanceof Error ? error.message : "Failed to clone and scan the repository."
      );
      setScanResult(null);
      setSelectedCandidateIds([]);
    } finally {
      setScanning(false);
    }
  }

  async function commitImport() {
    if (!scanResult) {
      return;
    }

    setImporting(true);
    setScanError(null);

    try {
      const acknowledgeWarnings = scanResult.candidates.some(
        (candidate) =>
          selectedCandidateIds.includes(candidate.id) && candidate.warnings.length > 0
      );
      const result = await rpc.request.importCandidates({
        sessionId: scanResult.sessionId,
        candidateIds: selectedCandidateIds,
        acknowledgeWarnings
      });

      setImportResult(result);
      await refreshState();
    } catch (error) {
      setScanError(
        error instanceof Error ? error.message : "Failed to import selected skills."
      );
    } finally {
      setImporting(false);
    }
  }

  function toggleCandidate(candidateId: string) {
    setSelectedCandidateIds((currentIds) =>
      currentIds.includes(candidateId)
        ? currentIds.filter((id) => id !== candidateId)
        : [...currentIds, candidateId]
    );
  }

  async function refreshTrackedRepository(gitBindingId: string) {
    try {
      const refreshedBinding = await rpc.request.refreshTrackedRepositoryStatus({ gitBindingId });
      setTrackedRepositories((current) =>
        current.map((binding) => (binding.id === refreshedBinding.id ? refreshedBinding : binding))
      );
    } catch (error) {
      setScanError(
        error instanceof Error ? error.message : "Failed to refresh repository status."
      );
    }
  }

  async function savePaths() {
    setSavingSettings(true);
    setScanError(null);

    try {
      await rpc.request.updateAgentPaths(agentPaths);
      await refreshState();
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Failed to save agent paths.");
    } finally {
      setSavingSettings(false);
    }
  }

  async function initializeLibraryRepo() {
    setSavingSyncSettings(true);
    setScanError(null);

    try {
      await rpc.request.initializeLibraryRepo({
        remoteUrl: syncRemoteUrl.trim() || null
      });
      await refreshState();
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Failed to initialize the Library Repo.");
    } finally {
      setSavingSyncSettings(false);
    }
  }

  async function saveAutoSyncSetting(autoSyncEnabled: boolean) {
    setSavingSyncSettings(true);
    setScanError(null);

    try {
      await rpc.request.updateAutoSyncSetting({ autoSyncEnabled });
      await refreshState();
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Failed to update auto-sync.");
    } finally {
      setSavingSyncSettings(false);
    }
  }

  async function runManualLibrarySync() {
    setSyncingLibraryRepo(true);
    setScanError(null);

    try {
      await rpc.request.syncLibraryRepo({ message: "Manual library sync" });
      await refreshState();
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Failed to sync the Library Repo.");
    } finally {
      setSyncingLibraryRepo(false);
    }
  }

  async function saveMetadata() {
    if (!selectedSkillDetail) {
      return;
    }

    setSavingMetadata(true);
    setScanError(null);

    try {
      const detail = await rpc.request.updateSkillMetadata({
        skillId: selectedSkillDetail.skill.id,
        displayName: metadataDraft.displayName,
        description: metadataDraft.description.trim() || null
      });

      setSelectedSkillDetail(detail);
      setLibrarySkills(await rpc.request.listLibrarySkills());
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Failed to save metadata.");
    } finally {
      setSavingMetadata(false);
    }
  }

  async function runDeploymentAction(
    action:
      | { type: "install"; skillId: string; platform: PlatformName }
      | { type: "update"; skillId: string; platform: PlatformName }
      | { type: "uninstall"; skillId: string; platform: PlatformName }
      | { type: "delete"; skillId: string }
  ) {
    const actionKey =
      action.type === "delete"
        ? `${action.type}:${action.skillId}`
        : `${action.type}:${action.skillId}:${action.platform}`;

    setActionInFlight(actionKey);
    setScanError(null);

    try {
      if (action.type === "install") {
        await rpc.request.installSkill({ skillId: action.skillId, platform: action.platform });
      } else if (action.type === "update") {
        await rpc.request.updateInstalledSkill({
          skillId: action.skillId,
          platform: action.platform
        });
      } else if (action.type === "uninstall") {
        await rpc.request.uninstallSkill({
          skillId: action.skillId,
          platform: action.platform
        });
      } else {
        await rpc.request.deleteLibrarySkill({ skillId: action.skillId });
      }

      await refreshState();
    } catch (error) {
      setScanError(error instanceof Error ? error.message : "Skill action failed.");
    } finally {
      setActionInFlight(null);
    }
  }

  const tone = state?.status ?? "ready";

  function renderFileTree(entries: FileTreeEntry[]): React.JSX.Element {
    return (
      <ul className="tree-list">
        {entries.map((entry) => (
          <li key={entry.path}>
            <span className={`tree-entry tree-entry-${entry.type}`}>
              {entry.type === "directory" ? "Folder" : "File"}: {entry.name}
            </span>
            {entry.children && entry.children.length > 0 && renderFileTree(entry.children)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <main className={`app-shell tone-${tone}`}>
      <section className="hero-card">
        <p className="eyebrow">SkillKeeper Boot Pipeline</p>
        <h1>Desktop shell is online.</h1>
        <p className="lede">
          This bootstrap view verifies local app storage, default settings, and Git
          readiness before the rest of the product lands.
        </p>
        <div className="hero-actions">
          <button type="button" onClick={refreshState} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh Bootstrap State"}
          </button>
          {state && <span className="status-pill">{state.status}</span>}
        </div>
      </section>

      {loading && (
        <section className="panel">
          <h2>Starting SkillKeeper</h2>
          <p>Resolving the local data root, loading settings, and checking system Git.</p>
        </section>
      )}

      {transportError && (
        <section className="panel panel-error">
          <h2>Renderer bootstrap failed</h2>
          <p>{transportError}</p>
        </section>
      )}

      {state && (
        <div className="panel-grid">
          <section className={`panel ${state.status === "error" ? "panel-error" : state.status === "warning" ? "panel-warning" : "panel-success"}`}>
            <h2>Application readiness</h2>
            <p>
              {state.status === "ready" && "Boot completed successfully and Git is available."}
              {state.status === "warning" && "Boot completed, but Git still needs attention."}
              {state.status === "error" && "Boot failed before SkillKeeper could finish setup."}
            </p>
            <ul className="issues-list">
              {state.issues.length === 0 && <li>No startup issues detected.</li>}
              {state.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h2>Managed paths</h2>
            <dl className="kv-grid">
              <div>
                <dt>Data root</dt>
                <dd>{state.dataRoot}</dd>
              </div>
              <div>
                <dt>Settings</dt>
                <dd>{state.managedPaths.settings}</dd>
              </div>
              <div>
                <dt>Database placeholder</dt>
                <dd>{state.managedPaths.database}</dd>
              </div>
              <div>
                <dt>Library skills</dt>
                <dd>{state.managedPaths.skills}</dd>
              </div>
            </dl>
          </section>

          <section className="panel">
            <h2>Git readiness</h2>
            <dl className="kv-grid">
              <div>
                <dt>Available</dt>
                <dd>{state.git.available ? "Yes" : "No"}</dd>
              </div>
              <div>
                <dt>Executable</dt>
                <dd>{state.git.executablePath ?? "Not found"}</dd>
              </div>
              <div>
                <dt>Version</dt>
                <dd>{state.git.version ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>Diagnostic</dt>
                <dd>{state.git.diagnostic ?? "None"}</dd>
              </div>
            </dl>
          </section>

          <section className="panel">
            <h2>Baseline settings</h2>
            <dl className="kv-grid">
              <div>
                <dt>Loaded from disk</dt>
                <dd>{state.settingsLoadedFromDisk ? "Yes" : "Created on first launch"}</dd>
              </div>
              <div>
                <dt>Codex path</dt>
                <dd>
                  <input
                    value={agentPaths.codexGlobal}
                    onChange={(event) =>
                      setAgentPaths((current) => ({
                        ...current,
                        codexGlobal: event.target.value
                      }))
                    }
                  />
                </dd>
              </div>
              <div>
                <dt>Claude Code path</dt>
                <dd>
                  <input
                    value={agentPaths.claudeGlobal}
                    onChange={(event) =>
                      setAgentPaths((current) => ({
                        ...current,
                        claudeGlobal: event.target.value
                      }))
                    }
                  />
                </dd>
              </div>
              <div>
                <dt>Auto-sync</dt>
                <dd>
                  <label className="toggle-row">
                    <input
                      type="checkbox"
                      checked={state.settings.sync.autoSyncEnabled}
                      onChange={(event) => saveAutoSyncSetting(event.target.checked)}
                      disabled={savingSyncSettings}
                    />
                    <span>{state.settings.sync.autoSyncEnabled ? "Enabled" : "Disabled"}</span>
                  </label>
                </dd>
              </div>
            </dl>
            <div className="import-controls">
              <button type="button" onClick={savePaths} disabled={savingSettings}>
                {savingSettings ? "Saving..." : "Save Agent Paths"}
              </button>
            </div>
          </section>

          <section className="panel">
            <h2>Library Sync Repo</h2>
            <dl className="kv-grid">
              <div>
                <dt>Repo path</dt>
                <dd>{syncStatus?.repo.repoPath ?? state.managedPaths.library}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{syncStatus?.repo.isInitialized ? "Initialized" : "Not initialized"}</dd>
              </div>
              <div>
                <dt>Branch</dt>
                <dd>{syncStatus?.repo.defaultBranch ?? "main"}</dd>
              </div>
              <div>
                <dt>Remote URL</dt>
                <dd>
                  <input
                    value={syncRemoteUrl}
                    onChange={(event) => setSyncRemoteUrl(event.target.value)}
                    placeholder="Optional remote URL for cross-device sync"
                  />
                </dd>
              </div>
            </dl>
            <div className="import-controls">
              <button type="button" onClick={initializeLibraryRepo} disabled={savingSyncSettings}>
                {savingSyncSettings ? "Saving..." : "Init / Connect Library Repo"}
              </button>
              <button
                type="button"
                onClick={runManualLibrarySync}
                disabled={syncingLibraryRepo || !syncStatus?.repo.isInitialized}
              >
                {syncingLibraryRepo ? "Syncing..." : "Manual Sync"}
              </button>
            </div>
            <div className="sync-jobs">
              <h3>Recent Sync Jobs</h3>
              {syncStatus && syncStatus.recentJobs.length > 0 ? (
                <ul className="history-list">
                  {syncStatus.recentJobs.slice(0, 5).map((job) => (
                    <li key={job.id}>
                      <code>{job.status}</code> {job.detail ?? "No detail"} · {job.startedAt}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No library sync jobs yet.</p>
              )}
            </div>
          </section>

          <section className="panel panel-wide">
            <h2>Skill import intake</h2>
            <p>
              Scan a folder or archive, review valid and invalid candidates, then
              import the selected skills into the managed library.
            </p>
            <div className="import-controls">
              <button type="button" onClick={() => pickSource("folder")}>
                Choose Folder
              </button>
              <button type="button" onClick={() => pickSource("archive")}>
                Choose Archive
              </button>
            </div>
            <div className="manual-path-row">
              <input
                value={manualImportPath}
                onChange={(event) => setManualImportPath(event.target.value)}
                placeholder="Paste a folder, .zip, or .tar.gz path"
              />
              <button type="button" onClick={() => scanSource(manualImportPath)} disabled={scanning}>
                {scanning ? "Scanning..." : "Scan Source"}
              </button>
            </div>

            <div className="manual-path-row">
              <input
                value={gitRepositoryUrl}
                onChange={(event) => setGitRepositoryUrl(event.target.value)}
                placeholder="Paste a Git repository URL or local repo path"
              />
              <button
                type="button"
                onClick={() => scanGitRepository(gitRepositoryUrl)}
                disabled={scanning}
              >
                {scanning ? "Cloning..." : "Clone & Scan Repository"}
              </button>
            </div>

            {scanError && <p className="error-copy">{scanError}</p>}

            {scanResult && (
              <div className="scan-results">
                <div className="scan-summary">
                  <span>{scanResult.sourceKind}</span>
                  <span>{scanResult.archiveFormat ?? "folder"}</span>
                  <span>{scanResult.candidates.length} candidate(s)</span>
                  {scanResult.trackedRepository && (
                    <span>{scanResult.trackedRepository.upstreamStatus}</span>
                  )}
                </div>
                {scanResult.candidates.map((candidate) => (
                  <article
                    key={`${scanResult.sessionId}-${candidate.id}`}
                    className={`candidate-card ${candidate.canImport ? "" : "candidate-card-invalid"}`}
                  >
                    <label className="candidate-header">
                      <input
                        type="checkbox"
                        checked={selectedCandidateIds.includes(candidate.id)}
                        disabled={!candidate.canImport}
                        onChange={() => toggleCandidate(candidate.id)}
                      />
                      <span>
                        <strong>{candidate.name}</strong>
                        <small>{candidate.relativePath}</small>
                      </span>
                    </label>
                    {candidate.blockingIssues.length > 0 && (
                      <ul className="candidate-issues">
                        {candidate.blockingIssues.map((issue) => (
                          <li key={`${candidate.id}-${issue.code}-${issue.relativePath ?? "root"}`}>
                            Blocked: {issue.message}
                          </li>
                        ))}
                      </ul>
                    )}
                    {candidate.warnings.length > 0 && (
                      <ul className="candidate-warnings">
                        {candidate.warnings.map((issue) => (
                          <li key={`${candidate.id}-${issue.code}-${issue.relativePath ?? "root"}`}>
                            Warning: {issue.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}

                <div className="import-controls">
                  <button
                    type="button"
                    onClick={commitImport}
                    disabled={importing || selectedCandidateIds.length === 0}
                  >
                    {importing ? "Importing..." : "Import Selected Skills"}
                  </button>
                </div>
              </div>
            )}

            {importResult && (
              <div className="import-result">
                <p>Imported: {importResult.imported.length}</p>
                <p>Skipped: {importResult.skipped.length}</p>
              </div>
            )}

            {trackedRepositories.length > 0 && (
              <div className="tracked-repos">
                <h3>Tracked source repositories</h3>
                {trackedRepositories.map((binding) => (
                  <article key={binding.id} className="candidate-card">
                    <div className="repo-row">
                      <div>
                        <strong>{binding.remoteUrl ?? binding.repoPath}</strong>
                        <small>{binding.repoPath}</small>
                      </div>
                      <span className="status-pill">{binding.upstreamStatus}</span>
                    </div>
                    <p className="repo-meta">
                      Branch: {binding.defaultBranch ?? "unknown"} · Read-only source repo ·
                      Commit/push disabled in SkillKeeper
                    </p>
                    <div className="import-controls">
                      <button type="button" onClick={() => refreshTrackedRepository(binding.id)}>
                        Refresh Status
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="panel panel-wide">
            <h2>Library skills</h2>
            {librarySkills.length === 0 && <p>No skills have been imported yet.</p>}
            {librarySkills.length > 0 && (
              <div className="library-layout">
                <div className="library-list">
                  <div className="library-table library-table-head">
                    <span>Name</span>
                    <span>Description</span>
                    <span>Source</span>
                    <span>Git</span>
                    <span>Installed Agents</span>
                    <span>Last Update</span>
                  </div>
                  {librarySkills.map((entry) => (
                    <button
                      key={entry.skill.id}
                      type="button"
                      className={`library-table library-table-row ${
                        selectedSkillId === entry.skill.id ? "library-table-row-active" : ""
                      }`}
                      onClick={() => setSelectedSkillId(entry.skill.id)}
                    >
                      <span>{entry.skill.displayName}</span>
                      <span>{entry.skill.description ?? "No description"}</span>
                      <span>{entry.skill.sourceKind}</span>
                      <span>{entry.gitBinding?.upstreamStatus ?? "Not tracked"}</span>
                      <span>
                        {entry.installedAgents.length > 0
                          ? entry.installedAgents.join(", ")
                          : "Not installed"}
                      </span>
                      <span>{entry.skill.updatedAt}</span>
                    </button>
                  ))}
                </div>

                <div className="detail-stack">
                  {detailLoading && <p>Loading skill detail...</p>}
                  {!detailLoading && !selectedSkillDetail && <p>Select a skill to view details.</p>}
                  {selectedSkillDetail && (
                    <>
                      <section className="candidate-card">
                        <div className="repo-row">
                          <div>
                            <strong>{selectedSkillDetail.skill.displayName}</strong>
                            <small>{selectedSkillDetail.skill.slug}</small>
                          </div>
                          <span className="status-pill">{selectedSkillDetail.skill.status}</span>
                        </div>
                        <p className="repo-meta">
                          Source: {selectedSkillDetail.skill.sourceKind} · Updated:{" "}
                          {selectedSkillDetail.skill.updatedAt}
                        </p>
                      </section>

                      <section className="candidate-card">
                        <h3>Metadata</h3>
                        <div className="detail-form">
                          <label>
                            <span>Display name</span>
                            <input
                              value={metadataDraft.displayName}
                              onChange={(event) =>
                                setMetadataDraft((current) => ({
                                  ...current,
                                  displayName: event.target.value
                                }))
                              }
                            />
                          </label>
                          <label>
                            <span>Description</span>
                            <textarea
                              value={metadataDraft.description}
                              onChange={(event) =>
                                setMetadataDraft((current) => ({
                                  ...current,
                                  description: event.target.value
                                }))
                              }
                            />
                          </label>
                        </div>
                        <div className="import-controls">
                          <button type="button" onClick={saveMetadata} disabled={savingMetadata}>
                            {savingMetadata ? "Saving..." : "Save Metadata"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              runDeploymentAction({
                                type: "delete",
                                skillId: selectedSkillDetail.skill.id
                              })
                            }
                            disabled={actionInFlight != null}
                          >
                            Delete Skill
                          </button>
                        </div>
                      </section>

                      <section className="detail-two-column">
                        <article className="candidate-card">
                          <h3>Installed Agents</h3>
                          {(["codex", "claude-code"] as PlatformName[]).map((platform) => {
                            const deployment = selectedSkillDetail.deployments
                              .filter((item) => item.platform === platform)
                              .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
                            const installed = deployment?.installStatus === "installed";

                            return (
                              <div key={platform} className="deployment-column">
                                <strong>{platform === "codex" ? "Codex" : "Claude Code"}</strong>
                                <small>{deployment?.installStatus ?? "Not installed"}</small>
                                <div className="import-controls">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      runDeploymentAction({
                                        type: installed ? "update" : "install",
                                        skillId: selectedSkillDetail.skill.id,
                                        platform
                                      })
                                    }
                                    disabled={actionInFlight != null}
                                  >
                                    {installed
                                      ? `Update ${platform === "codex" ? "Codex" : "Claude"}`
                                      : `Install to ${platform === "codex" ? "Codex" : "Claude"}`}
                                  </button>
                                  {deployment && deployment.installStatus !== "removed" && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        runDeploymentAction({
                                          type: "uninstall",
                                          skillId: selectedSkillDetail.skill.id,
                                          platform
                                        })
                                      }
                                      disabled={actionInFlight != null}
                                    >
                                      Uninstall
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                          {selectedSkillDetail.deployments.length === 0 && (
                            <p>No installed agents for this skill yet.</p>
                          )}
                        </article>

                        <article className="candidate-card">
                          <h3>Source Repository</h3>
                          {selectedSkillDetail.gitBinding ? (
                            <>
                              <p className="repo-meta">
                                {selectedSkillDetail.gitBinding.remoteUrl ??
                                  selectedSkillDetail.gitBinding.repoPath}
                              </p>
                              <p className="repo-meta">
                                Status: {selectedSkillDetail.gitBinding.upstreamStatus} · Branch:{" "}
                                {selectedSkillDetail.gitBinding.defaultBranch ?? "unknown"}
                              </p>
                            </>
                          ) : (
                            <p>No Git tracking data for this skill.</p>
                          )}
                        </article>
                      </section>

                      <section className="detail-two-column">
                        <article className="candidate-card">
                          <h3>File Tree</h3>
                          {selectedSkillDetail.fileTree.length > 0 ? (
                            renderFileTree(selectedSkillDetail.fileTree)
                          ) : (
                            <p>No files found in the library copy.</p>
                          )}
                        </article>

                        <article className="candidate-card">
                          <h3>SKILL.md Preview</h3>
                          {selectedSkillDetail.skillMarkdownPreview ? (
                            <pre className="markdown-preview">
                              {selectedSkillDetail.skillMarkdownPreview}
                            </pre>
                          ) : (
                            <p>No SKILL.md found in the library copy.</p>
                          )}
                        </article>
                      </section>

                      <section className="candidate-card">
                        <h3>Git History</h3>
                        {selectedSkillDetail.gitHistory.length > 0 ? (
                          <ul className="history-list">
                            {selectedSkillDetail.gitHistory.map((entry) => (
                              <li key={entry.commitHash}>
                                <code>{entry.commitHash}</code> {entry.summary}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>No Git history available for this skill.</p>
                        )}
                      </section>
                    </>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Missing root element for SkillKeeper renderer.");
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
