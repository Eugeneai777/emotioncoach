import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Auto-reload once when a dynamically imported chunk is missing (stale deploy)
const RELOAD_KEY = "__chunk_reload";
window.addEventListener("error", (e) => {
  if (
    e.message?.includes("Failed to fetch dynamically imported module") ||
    e.message?.includes("Importing a module script failed")
  ) {
    const alreadyReloaded = sessionStorage.getItem(RELOAD_KEY);
    if (!alreadyReloaded) {
      sessionStorage.setItem(RELOAD_KEY, "1");
      window.location.reload();
    }
  }
});
// Clear the flag on successful load so future deploys can trigger it again
window.addEventListener("load", () => sessionStorage.removeItem(RELOAD_KEY));

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
