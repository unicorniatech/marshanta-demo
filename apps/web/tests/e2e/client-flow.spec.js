import { test, expect } from '@playwright/test'
import { spawn } from 'node:child_process'

const API_PORT = 4000
const API_URL = `http://127.0.0.1:${API_PORT}`

async function wait(ms) { return new Promise(r => setTimeout(r, ms)) }

async function ensureApi() {
  // Try health first
  try {
    const res = await fetch(`${API_URL}/healthz`)
    if (res.ok) return { stop: () => {} }
  } catch (_) {}
  // Start API in memory driver
  const child = spawn('node', ['src/index.js'], {
    cwd: new URL('../../../api', import.meta.url).pathname.replace(/\/$/, ''),
    env: { ...process.env, PORT: String(API_PORT), NODE_ENV: 'test', DB_DRIVER: 'memory' },
    stdio: 'inherit'
  })
  let exited = false
  child.on('exit', () => { exited = true })
  // wait for health
  let ok = false; let attempts = 0
  while (!ok && attempts < 40) {
    await wait(250)
    try { const r = await fetch(`${API_URL}/healthz`); ok = r.ok } catch (_) {}
    attempts++
  }
  if (!ok) throw new Error('API failed to start')
  return { stop: () => { if (!exited) child.kill('SIGTERM') } }
}

function randEmail(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random()*1e6)}@e2e.local`
}

test.describe('Client order & pay flow', () => {
  let api
  test.beforeAll(async () => { api = await ensureApi() })
  test.afterAll(async () => { api?.stop() })

  test('register/login client, place order, pay, see Succeeded', async ({ page, baseURL }) => {
    await page.goto(baseURL + '/')

    const email = randEmail('client')
    await page.getByPlaceholder('email').fill(email)
    await page.getByPlaceholder('password').fill('secretpw')
    await page.locator('#role').selectOption('client')
    await page.getByRole('button', { name: 'Register' }).click()

    await page.getByRole('button', { name: 'Login' }).click()
    await expect(page.locator('#roleBadge')).toContainText('client')

    // Load restaurants and open first menu
    await page.getByRole('button', { name: 'Show Restaurants' }).click()
    await page.locator('#restaurantsList button').first().click()

    // Add first menu item and place order
    await page.locator('#menuList button', { hasText: 'Add' }).first().click()
    await page.getByRole('button', { name: 'Place Order' }).click()

    // Pay
    await page.locator('#ordersList >> text=Pay').first().click()

    // Expect payment status Succeeded badge in orders
    await expect(page.locator('#ordersList')).toContainText('Succeeded')
  })
})
