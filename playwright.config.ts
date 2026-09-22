import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:5173',
    actionTimeout: 15_000,
    viewport: { width: 1280, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'off',
  },
  webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true },
})
