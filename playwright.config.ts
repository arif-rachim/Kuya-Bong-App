import { defineConfig, devices } from '@playwright/test'

/**
 * E2E config. The app runs in manggaleh mode (VITE_USE_MANGGALEH=true); the
 * backend is mocked per-test via Playwright route interception (see
 * e2e/mockManggaleh.ts), so tests are fully offline and never touch real data.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:5199',
    trace: 'on-first-retry',
    launchOptions: { executablePath: '/opt/pw-browsers/chromium' },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 5199 --strictPort',
    url: 'http://localhost:5199',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      VITE_USE_MANGGALEH: 'true',
      VITE_MANGGALEH_TENANT: 'realief-expert',
      VITE_MANGGALEH_ENV: 'dev',
      VITE_MANGGALEH_API_KEY: 'mgpk_test',
      VITE_MANGGALEH_OTP: 'true',
    },
  },
})
