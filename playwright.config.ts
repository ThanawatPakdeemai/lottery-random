import { defineConfig } from '@playwright/test';
const port = Number(process.env.E2E_PORT || 4173);
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './tests/e2e',
  snapshotPathTemplate: '{testDir}/../../test-results/reference/{arg}{ext}',
  fullyParallel: true,
  workers: 2,
  use: { baseURL, reducedMotion: 'reduce', launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } },
  webServer: {
    command: `bun run preview -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
  },
});
