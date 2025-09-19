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

async function createOrderViaApi() {
  const rr = await fetch(`${API_URL}/restaurants`)
  if (!rr.ok) throw new Error('restaurants')
  const restaurants = (await rr.json()).restaurants
  const r = restaurants[0]
  const mr = await fetch(`${API_URL}/restaurants/${r.id}/menu`)
  if (!mr.ok) throw new Error('menu')
  const items = (await mr.json()).items
  const item = items[0]
  const create = await fetch(`${API_URL}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restaurantId: r.id, items: [{ itemId: item.id, name: item.name, priceCents: item.priceCents, qty: 1 }] }) })
  if (create.status !== 201) throw new Error('create order')
  const order = (await create.json()).order
  return { order, restaurant: r }
}

function randEmail(prefix) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random()*1e6)}@e2e.local`
}

test.describe('Staff RC advance flow', () => {
  let api
  test.beforeAll(async () => { api = await ensureApi() })
  test.afterAll(async () => { api?.stop() })

  test('staff advances order through statuses', async ({ page, baseURL }) => {
    // Seed an order via API
    const { order, restaurant } = await createOrderViaApi()

    await page.goto(baseURL + '/')

    const email = randEmail('staff')
    await page.getByPlaceholder('email').fill(email)
    await page.getByPlaceholder('password').fill('secretpw')
    await page.locator('#role').selectOption('staff')
    await page.getByRole('button', { name: 'Register' }).click()

    await page.getByRole('button', { name: 'Login' }).click()
    await expect(page.locator('#roleBadge')).toContainText('staff')

    // Select restaurant in RC and load orders
    await page.locator('#rcRestaurant').selectOption(String(restaurant.id))
    await page.getByRole('button', { name: 'Load Orders' }).click()
    await expect(page.locator('#rcOrdersList')).toContainText(`#${order.id}`)

    // Advance through statuses
    const seq = ['Accepted', 'Preparing', 'ReadyForPickup']
    for (const next of seq) {
      // Target this order's list item
      const item = page.locator(`#rcOrdersList li:has-text("#${order.id}")`).first()
      await expect(item).toBeVisible()
      const btn = item.getByRole('button', { name: new RegExp(`^Advance\\s*→\\s*${next}$`) })
      await btn.waitFor({ state: 'visible' })
      await btn.click()
      await expect(page.locator('#rcOrdersList')).toContainText(next)
    }
  })
})
