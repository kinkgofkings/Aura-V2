import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Prevent unhandled third-party Firebase or network errors from blanking the screen
if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => {
    if (
      event?.message?.includes("invalid-api-key") ||
      event?.error?.message?.includes("invalid-api-key") ||
      event?.message?.includes("auth/")
    ) {
      console.warn("[Aura Safe Mode] Suppressed Firebase auth error:", event.message);
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason;
    const msg = typeof reason === "string" ? reason : reason?.message || "";
    if (msg.includes("invalid-api-key") || msg.includes("auth/")) {
      console.warn("[Aura Safe Mode] Suppressed Firebase unhandled rejection:", msg);
      event.preventDefault();
    }
  });
}

// Handle Service Worker cleanly and ensure preview is never stuck offline
if (typeof window !== "undefined") {
  // Only skip the service worker in a local dev preview. Production hosts,
  // including Cloud Run, must keep it registered or a closed phone cannot
  // receive call or message alerts.
  const isLocalPreview =
    window.self !== window.top ||
    ((window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
      Boolean(import.meta.env.DEV));

  if (isLocalPreview) {
    // In preview iframe / dev environment, unregister service workers and purge caches to prevent stale offline locks
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
    }
    if (typeof caches !== "undefined") {
      caches.keys().then((keys) => {
        for (const key of keys) {
          caches.delete(key);
        }
      });
    }
  } else if ("serviceWorker" in navigator) {
    // Production PWA mode on custom domain
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("Service worker registration note:", err);
    });
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
