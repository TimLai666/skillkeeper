import React from "react";
import { createRoot } from "react-dom/client";
import { Electroview } from "electrobun/view";
import type { BootstrapState } from "../shared/bootstrap";
import type { ShellRPCSchema } from "../shared/bootstrap-rpc";

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

  React.useEffect(() => {
    let active = true;

    rpc.request.getBootstrapState()
      .then((nextState) => {
        if (active) {
          setState(nextState);
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
      const nextState = await rpc.request.refreshBootstrapState();
      setState(nextState);
      setTransportError(null);
    } catch (error) {
      setTransportError(
        error instanceof Error ? error.message : "Failed to refresh bootstrap state."
      );
    } finally {
      setRefreshing(false);
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
                <dd>{state.settings.agentPaths.codexGlobal}</dd>
              </div>
              <div>
                <dt>Claude Code path</dt>
                <dd>{state.settings.agentPaths.claudeGlobal}</dd>
              </div>
              <div>
                <dt>Auto-sync</dt>
                <dd>{state.settings.sync.autoSyncEnabled ? "Enabled" : "Disabled"}</dd>
              </div>
            </dl>
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
