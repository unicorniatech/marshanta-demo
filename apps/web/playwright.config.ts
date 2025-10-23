import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.WEB_SMOKE_PORT || process.env.PORT || 5173)

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${port}`,
    headless: true
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `npx vite --port ${port}`,
    url: `http://localhost:${port}`,
    timeout: 60_000,
    reuseExistingServer: true,
  },
})
