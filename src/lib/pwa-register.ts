const SW_URL = "/sw.js";

function isBlockedContext(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  if (window.self !== window.top) return true;
  if (new URL(window.location.href).searchParams.get("sw") === "off") return true;

  const h = window.location.hostname;
  return (
    h.startsWith("id-preview--") ||
    h.startsWith("preview--") ||
    h === "lovableproject.com" ||
    h.endsWith(".lovableproject.com") ||
    h === "lovableproject-dev.com" ||
    h.endsWith(".lovableproject-dev.com") ||
    h === "beta.lovable.dev" ||
    h.endsWith(".beta.lovable.dev")
  );
}

async function unregisterAppWorkers() {
  if (!("serviceWorker" in navigator)) return;
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.allSettled(
    regs
      .filter((r) => (r.active?.scriptURL ?? r.installing?.scriptURL ?? r.waiting?.scriptURL ?? "").endsWith(SW_URL))
      .map((r) => r.unregister()),
  );
}

/** Routes kept ready for offline navigation. */
const OFFLINE_ROUTES = ["/", "/calendar", "/bookings", "/manage", "/courts", "/customers", "/finance", "/more", "/notifications"];

/** Warms the navigation cache so the app opens even with no network. */
export async function primeOfflineShell() {
  if (typeof caches === "undefined" || typeof navigator === "undefined" || !navigator.onLine) return;
  try {
    const cache = await caches.open("html-navigations");
    await Promise.allSettled(
      OFFLINE_ROUTES.map(async (path) => {
        const response = await fetch(path, { credentials: "same-origin", cache: "reload" });
        if (response.ok) await cache.put(path, response.clone());
      }),
    );
  } catch {
    /* best-effort */
  }
}

/** Registers the offline service worker in production only. Safe to call from useEffect. */
export function registerOfflineWorker() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (isBlockedContext()) {
    void unregisterAppWorkers();
    return;
  }
  void navigator.serviceWorker
    .register(SW_URL, { scope: "/" })
    .then(() => navigator.serviceWorker.ready)
    .then(() => primeOfflineShell())
    .catch(() => {
      /* offline support is best-effort */
    });
  window.addEventListener("online", () => void primeOfflineShell());
}

