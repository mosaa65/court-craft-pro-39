// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

// Previous config (before offline/PWA support) was simply:
//   export default defineConfig({ tanstackStart: { server: { entry: "server" } } });
export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [
      // Only build the service worker for the browser bundle, never the SSR/server bundle.
      (VitePWA({
        strategies: "generateSW",
        registerType: "autoUpdate",
        injectRegister: null,
        filename: "sw.js",
        outDir: "dist/client",
        devOptions: { enabled: false },
        manifest: false, // we ship public/manifest.webmanifest ourselves
        workbox: {
          globPatterns: ["**/*.{html,js,css,ico,png,jpg,jpeg,svg,webp,woff2}"],
          navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: ({ url, request }) => request.mode === "navigate" && !url.pathname.startsWith("/api/"),
              handler: "NetworkFirst",
              options: {
                cacheName: "html-navigations",
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
                plugins: [
                  {
                    // Offline: fall back to any cached page (prefer the home shell) so the
                    // app boots instead of showing the browser's "no internet" page.
                    handlerDidError: async () => {
                      const cache = await caches.open("html-navigations");
                      const home = await cache.match("/");
                      if (home) return home;
                      const keys = await cache.keys();
                      if (keys.length) return (await cache.match(keys[0])) ?? Response.error();
                      return Response.error();
                    },
                  },
                ],
              },
            },

            {
              urlPattern: ({ url, request, sameOrigin }) =>
                request.destination === "image" ||
                (sameOrigin && !url.pathname.startsWith("/api/") && ["style", "script", "font"].includes(request.destination)),
              handler: "CacheFirst",
              options: {
                cacheName: "static-assets",
                expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }) as unknown as Array<Record<string, unknown>>).map((p) => ({
        ...p,
        applyToEnvironment: (env: { name: string }) => env.name === "client",
      })) as never,
    ],
  },
});
