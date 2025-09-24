// @ts-check
import { defineConfig } from '@playwright/test'

const PORT = process.env.WEB_E2E_PORT ? Number(process.env.WEB_E2E_PORT) : 5176

export default defineConfig({
  timeout: 60_000,
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    headless: true,
  },
  webServer: {
    command: `npx --yes http-server -c-1 -a 127.0.0.1 -p ${PORT} .`,
    port: PORT,
    timeout: 20_000,
    reuseExistingServer: true,
  },
  testDir: 'tests/e2e',
})
