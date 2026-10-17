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
    // Production PWA mode: proactive OTA background updates and icon sync
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Immediate check for newer sw.js on launch
        registration.update().catch(() => {});

        // Re-check for OTA updates whenever the phone is unlocked or user switches back to the app
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => {});
          }
        });
        window.addEventListener("focus", () => {
          registration.update().catch(() => {});
        });

        // Periodic background update check every 15 minutes
        setInterval(() => {
          registration.update().catch(() => {});
        }, 15 * 60 * 1000);

        // When a newer version of sw.js is installed, tell it to take over immediately
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                newWorker.postMessage({ type: "SKIP_WAITING" });
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn("Service worker registration note:", err);
      });

    // When the new worker takes control, refresh smoothly once to apply all new assets
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
