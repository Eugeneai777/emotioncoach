import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installErrorTracker } from "./lib/frontendErrorTracker";
import { installApiErrorTracker } from "./lib/apiErrorTracker";
import { installStabilityCollector } from "./lib/stabilityDataCollector";
import { installMonitorReporter } from "./lib/monitorReporter";
import { CHUNK_RELOAD_KEY } from "./utils/lazyRetry";

// Install global frontend error tracker
installErrorTracker();
// Install API error tracker
installApiErrorTracker();
// Install stability data collector
installStabilityCollector();
// Install monitor data reporter (batched DB persistence)
installMonitorReporter();

/**
 * Unified chunk-error auto-reload logic.
 * Uses the same sessionStorage key as lazyRetry to avoid double-reload conflicts.
 */
function isChunkError(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes('failed to fetch dynamically imported module') ||
    m.includes('importing a module script failed') ||
    m.includes('loading chunk') ||
    m.includes('loading css chunk') ||
    m.includes('load failed')
  );
}

function tryAutoReload(errorMessage: string | undefined): void {
  if (!isChunkError(errorMessage)) return;
  try {
    const raw = sessionStorage.getItem(CHUNK_RELOAD_KEY);
    const reloadedPaths: Record<string, number> = raw ? JSON.parse(raw) : {};
    const currentPath = window.location.pathname;
    if (reloadedPaths[currentPath]) return; // already tried
    reloadedPaths[currentPath] = Date.now();
    sessionStorage.setItem(CHUNK_RELOAD_KEY, JSON.stringify(reloadedPaths));
    const url = new URL(window.location.href);
    url.searchParams.set('_cb', Date.now().toString());
    window.location.replace(url.toString());
  } catch {
    // fallback: simple reload
    window.location.reload();
  }
}

// Catch synchronous chunk errors (e.g. <script> tag failures)
window.addEventListener("error", (e) => {
  tryAutoReload(e.message);
});

// Catch async chunk errors (dynamic import() returns rejected Promise)
window.addEventListener("unhandledrejection", (e) => {
  const reason = e.reason;
  const message = reason instanceof Error ? reason.message : String(reason ?? '');
  tryAutoReload(message);
});

// Clear reload flags on successful page load so future deploys can trigger again
window.addEventListener("load", () => {
  try { sessionStorage.removeItem(CHUNK_RELOAD_KEY); } catch { /* ignore */ }
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
