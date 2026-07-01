import { defineConfig, devices } from '@playwright/test'

/**
 * E2E config for the Kuya Bong / Realief Expert app.
 *
 * The suite is BACKEND-AGNOSTIC by design: the UI is identical whether the store
 * runs on the local mock or on the manggaleh BaaS (the integration only swaps
 * store-action bodies). So the same specs serve two purposes:
 *   - default (no manggaleh env)  → app builds in mock mode; only the offline
 *     smoke specs run, the manggaleh specs skip. Safe for CI without secrets.
 *   - with manggaleh env + creds  → app builds in manggaleh mode; the full suite
 *     runs against the live dev/staging tenant (the real integration test).
 *
 * Enable manggaleh mode by exporting the same VITE_* vars used by the app
 * (see .env.e2e.example) before running `npm run test:e2e`.
 */

// VITE_* vars are baked into the build, so they must be present for the webServer
// build step. Forward whatever the caller exported (empty → mock-mode build).
const viteEnv = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => k.startsWith('VITE_')),
) as Record<string, string>

const PORT = Number(process.env.E2E_PORT ?? 4173)

export default defineConfig({
  testDir: './e2e',
  // One worker: the specs share a single manggaleh tenant, and booking specs
  // create appointments — serial execution keeps them from colliding.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL: `http://localhost:${PORT}`,
    // In sandboxed environments outbound HTTPS goes through an agent proxy. The
    // browser must use it too so the app's calls to the manggaleh API get out;
    // localhost (the preview server) is bypassed. No-op when HTTPS_PROXY is unset.
    ...(process.env.HTTPS_PROXY
      ? { proxy: { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } }
      : {}),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // The app is a mobile-first PWA; test at a phone viewport so the bottom nav
    // (the mobile-only navigation) is the one exercised.
    viewport: { width: 390, height: 800 },
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 800 },
        launchOptions: {
          // Required when running as root in a sandboxless container/CI.
          args: ['--no-sandbox'],
          // Honor a pre-provisioned Chromium (PW_CHROMIUM_PATH) so the pinned
          // Playwright version doesn't try to download a browser build. Falls
          // back to Playwright's own resolution when the var is unset.
          ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
        },
      },
    },
  ],

  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: viteEnv,
  },
})
