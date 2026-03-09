import React from "react";
import { createRoot } from "react-dom/client";
import { Electroview } from "electrobun/view";
import type { AppSettings, BootstrapState } from "../shared/bootstrap";
import type { ShellRPCSchema } from "../shared/bootstrap-rpc";
import type { LibrarySkillSummary } from "../shared/deployment";
import type { ImportCommitResult, ImportScanResult } from "../shared/imports";
import type { GitBindingRecord, PlatformBindingRecord, PlatformName } from "../shared/library";

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
  const [actionInFlight, setActionInFlight] = React.useState<string | null>(null);
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
    let active = true;

    Promise.all([
      rpc.request.getBootstrapState(),
      rpc.request.listTrackedRepositories(),
      rpc.request.listLibrarySkills()
    ])
      .then(([nextState, repositories, skills]) => {
        if (active) {
          setState(nextState);
          setTrackedRepositories(repositories);
          setLibrarySkills(skills);
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
      const [nextState, repositories, skills] = await Promise.all([
        rpc.request.refreshBootstrapState(),
        rpc.request.listTrackedRepositories(),
        rpc.request.listLibrarySkills()
      ]);
      setState(nextState);
      setTrackedRepositories(repositories);
      setLibrarySkills(skills);
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

  function getDeployment(
    skillSummary: LibrarySkillSummary,
    platform: PlatformName
  ): PlatformBindingRecord | undefined {
    return skillSummary.deployments
      .filter((deployment) => deployment.platform === platform)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
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
                <dd>{state.settings.sync.autoSyncEnabled ? "Enabled" : "Disabled"}</dd>
              </div>
            </dl>
            <div className="import-controls">
              <button type="button" onClick={savePaths} disabled={savingSettings}>
                {savingSettings ? "Saving..." : "Save Agent Paths"}
              </button>
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
            {librarySkills.map((entry) => {
              const codexDeployment = getDeployment(entry, "codex");
              const claudeDeployment = getDeployment(entry, "claude-code");
              const codexInstalled = codexDeployment?.installStatus === "installed";
              const claudeInstalled = claudeDeployment?.installStatus === "installed";

              return (
                <article key={entry.skill.id} className="candidate-card">
                  <div className="repo-row">
                    <div>
                      <strong>{entry.skill.displayName}</strong>
                      <small>{entry.skill.slug}</small>
                    </div>
                    <span className="status-pill">{entry.skill.status}</span>
                  </div>
                  <p className="repo-meta">
                    Source: {entry.skill.sourceKind} · Updated: {entry.skill.updatedAt}
                  </p>
                  <div className="skill-deployments">
                    <div className="deployment-column">
                      <strong>Codex</strong>
                      <small>{codexDeployment?.installStatus ?? "not installed"}</small>
                      <div className="import-controls">
                        <button
                          type="button"
                          onClick={() =>
                            runDeploymentAction({
                              type: codexInstalled ? "update" : "install",
                              skillId: entry.skill.id,
                              platform: "codex"
                            })
                          }
                          disabled={actionInFlight != null}
                        >
                          {codexInstalled ? "Update Codex" : "Install to Codex"}
                        </button>
                        {codexDeployment && codexDeployment.installStatus !== "removed" && (
                          <button
                            type="button"
                            onClick={() =>
                              runDeploymentAction({
                                type: "uninstall",
                                skillId: entry.skill.id,
                                platform: "codex"
                              })
                            }
                            disabled={actionInFlight != null}
                          >
                            Uninstall
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="deployment-column">
                      <strong>Claude Code</strong>
                      <small>{claudeDeployment?.installStatus ?? "not installed"}</small>
                      <div className="import-controls">
                        <button
                          type="button"
                          onClick={() =>
                            runDeploymentAction({
                              type: claudeInstalled ? "update" : "install",
                              skillId: entry.skill.id,
                              platform: "claude-code"
                            })
                          }
                          disabled={actionInFlight != null}
                        >
                          {claudeInstalled ? "Update Claude" : "Install to Claude"}
                        </button>
                        {claudeDeployment && claudeDeployment.installStatus !== "removed" && (
                          <button
                            type="button"
                            onClick={() =>
                              runDeploymentAction({
                                type: "uninstall",
                                skillId: entry.skill.id,
                                platform: "claude-code"
                              })
                            }
                            disabled={actionInFlight != null}
                          >
                            Uninstall
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="import-controls">
                    <button
                      type="button"
                      onClick={() => runDeploymentAction({ type: "delete", skillId: entry.skill.id })}
                      disabled={actionInFlight != null}
                    >
                      Delete Skill
                    </button>
                  </div>
                </article>
              );
            })}
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
