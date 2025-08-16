// Minimal API smoke test: start app on a test port and hit key endpoints
import http from 'node:http'

const port = process.env.SMOKE_PORT ? Number(process.env.SMOKE_PORT) : 4100

async function wait(ms) { return new Promise(r => setTimeout(r, ms)) }

async function getJson(url) {
  const res = await fetch(url)
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

async function main() {
  process.env.NODE_ENV = 'test'
  const mod = await import('../src/index.js')
  const app = mod.default || mod
  const server = http.createServer(app)
  await new Promise(resolve => server.listen(port, resolve))
  const base = `http://127.0.0.1:${port}`
  try {
    // health
    const h = await getJson(`${base}/healthz`)
    if (!h.ok) throw new Error(`healthz failed: ${h.status}`)

    // restaurants list should return seeded data
    const r = await getJson(`${base}/restaurants`)
    if (!r.ok || !Array.isArray(r.data.restaurants)) throw new Error('restaurants failed')

    // create a simple order
    const rest = r.data.restaurants[0]
    const menu = await getJson(`${base}/restaurants/${rest.id}/menu`)
    if (!menu.ok || !Array.isArray(menu.data.items) || menu.data.items.length === 0) throw new Error('menu failed')
    const item = menu.data.items[0]
    const create = await fetch(`${base}/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restaurantId: rest.id, items: [{ itemId: item.id, name: item.name, priceCents: item.priceCents, qty: 1 }] }) })
    if (!create.ok) throw new Error(`create order failed: ${create.status}`)

    console.log('API smoke: OK')
    process.exitCode = 0
  } catch (e) {
    console.error('API smoke failed:', e.message)
    process.exitCode = 1
  } finally {
    server.close()
    await wait(50)
  }
}

main()
