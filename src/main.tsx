import {StrictMode} from "react";
import {createRoot} from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Handle Service Worker cleanly and ensure preview is never stuck offline
if (typeof window !== "undefined") {
  const isPreviewOrDev =
    window.self !== window.top ||
    window.location.hostname.includes("run.app") ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    Boolean(import.meta.env.DEV);

  if (isPreviewOrDev) {
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
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("Service worker registration note:", err);
      });
    });
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
