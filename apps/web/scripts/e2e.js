// Minimal Playwright E2E: start static server and verify homepage
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'

const PORT = process.env.WEB_E2E_PORT ? Number(process.env.WEB_E2E_PORT) : 5175

function wait(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  const server = spawn('npx', ['--yes', 'http-server', '-c-1', '-p', String(PORT), '.'], {
    cwd: new URL('..', import.meta.url).pathname.replace(/\/scripts\/$/, '/'),
    stdio: 'inherit'
  })

  let exited = false
  server.on('exit', () => { exited = true })

  try {
    await wait(1000)
    const browser = await chromium.launch()
    const page = await browser.newPage()
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' })

    // Assertions: title and header content
    const title = await page.title()
    if (!title.toLowerCase().includes('marshanta')) throw new Error('Title should include Marshanta')
    const header = await page.locator('header').textContent()
    if (!header?.toLowerCase().includes('marshanta')) throw new Error('Header should contain Marshanta')

    console.log('Web E2E: OK')
    await browser.close()
    process.exitCode = 0
  } catch (e) {
    console.error('Web E2E failed:', e.message)
    process.exitCode = 1
  } finally {
    if (!exited) server.kill('SIGTERM')
    await wait(200)
  }
}

main()
