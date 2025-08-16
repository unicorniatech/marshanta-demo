/* global L */
const apiBase = localStorage.getItem('apiBase') || (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:4000' : '')
const tokenKey = 'authToken'

const els = {
  installBtn: document.getElementById('installBtn'),
  chat: document.getElementById('chat'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  role: document.getElementById('role'),
  registerBtn: document.getElementById('registerBtn'),
  loginBtn: document.getElementById('loginBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  log: document.getElementById('log'),
  apiBase: document.getElementById('apiBase'),
  loadRestaurantsBtn: document.getElementById('loadRestaurantsBtn'),
  restaurantsList: document.getElementById('restaurantsList'),
  menuHeader: document.getElementById('menuHeader'),
  menuList: document.getElementById('menuList'),
  cartList: document.getElementById('cartList'),
  cartTotal: document.getElementById('cartTotal'),
  clearCartBtn: document.getElementById('clearCartBtn'),
  reviewOrderBtn: document.getElementById('reviewOrderBtn'),
  placeOrderBtn: document.getElementById('placeOrderBtn'),
  refreshOrdersBtn: document.getElementById('refreshOrdersBtn'),
  ordersList: document.getElementById('ordersList'),
  trackingOrder: document.getElementById('trackingOrder'),
  trackingStatus: document.getElementById('trackingStatus'),
  trackingCoords: document.getElementById('trackingCoords'),
  stopTrackingBtn: document.getElementById('stopTrackingBtn')
}

// ---------- Payments (Story 2.4) ----------
async function startPaymentFlow(orderId) {
  try {
    // 1) Request intent
    const intent = await api('/payments/intent', { method: 'POST', body: { orderId } })
    if (!intent.ok) return say(`Payment intent failed: ${intent.status} ${intent.data.error || ''}`)
    const { clientSecret, amountCents } = intent.data
    say(`Payment intent created for order #${orderId}: ${formatPrice(amountCents)}`)

    // 2) Simulate confirmation (success)
    const confirm = await api('/payments/confirm', { method: 'POST', body: { orderId, clientSecret, outcome: 'succeeded' } })
    if (!confirm.ok) return say(`Payment confirm failed: ${confirm.status} ${confirm.data.error || ''}`)
    say(`Payment ${confirm.data.paymentStatus} for order #${orderId}`)
    await refreshOrders()
  } catch (e) {
    log(`payment error: ${e.message}`)
  }
}

els.apiBase.textContent = apiBase

let deferredPrompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  els.installBtn.hidden = false
})

els.installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return
  deferredPrompt.prompt()
  await deferredPrompt.userChoice
  deferredPrompt = null
  els.installBtn.hidden = true
})

function log(msg) {
  els.log.textContent += `\n${msg}`
}

function say(msg) {
  const p = document.createElement('p')
  p.textContent = msg
  els.chat.appendChild(p)
}

// ---------- Story 2.2 state ----------
let selectedRestaurant = null
let cart = [] // [{ restaurantId, itemId, name, priceCents, qty }]

function formatPrice(cents) {
  const v = (cents || 0) / 100
  return v.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

async function api(path, { method = 'GET', body } = {}) {
  if (!apiBase) throw new Error('API base not configured')
  const headers = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem(tokenKey)
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${apiBase}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

async function loadRestaurants() {
  try {
    const r = await api('/restaurants')
    if (!r.ok) return say(`Could not load restaurants (${r.status})`)
    renderRestaurants(r.data.restaurants)
  } catch (e) {
    log(`restaurants error: ${e.message}`)
  }
}

function renderRestaurants(rows = []) {
  els.restaurantsList.innerHTML = ''
  rows.forEach(r => {
    const li = document.createElement('li')
    const btn = document.createElement('button')
    btn.textContent = `${r.name} — ${r.address}`
    btn.addEventListener('click', () => selectRestaurant(r))
    li.appendChild(btn)
    els.restaurantsList.appendChild(li)
  })
}

async function selectRestaurant(r) {
  selectedRestaurant = r
  els.menuHeader.textContent = `Menu — ${r.name}`
  els.menuList.innerHTML = ''
  try {
    const m = await api(`/restaurants/${r.id}/menu`)
    if (!m.ok) return say(`Could not load menu (${m.status})`)
    renderMenu(m.data.items || [])
  } catch (e) {
    log(`menu error: ${e.message}`)
  }
}

function renderMenu(items = []) {
  els.menuList.innerHTML = ''
  items.forEach(it => {
    const li = document.createElement('li')
    const add = document.createElement('button')
    add.textContent = `Add`
    add.addEventListener('click', () => addToCart(it))
    li.textContent = `${it.name} — ${formatPrice(it.priceCents)} `
    li.appendChild(add)
    els.menuList.appendChild(li)
  })
}

function addToCart(item) {
  if (!selectedRestaurant) return say('Select a restaurant first')
  const key = `${selectedRestaurant.id}:${item.id}`
  const existing = cart.find(c => `${c.restaurantId}:${c.itemId}` === key)
  if (existing) existing.qty += 1
  else cart.push({ restaurantId: selectedRestaurant.id, itemId: item.id, name: item.name, priceCents: item.priceCents, qty: 1 })
  renderCart()
}

function renderCart() {
  els.cartList.innerHTML = ''
  let total = 0
  cart.forEach(c => {
    const li = document.createElement('li')
    const lineTotal = c.priceCents * c.qty
    total += lineTotal
    const minus = document.createElement('button')
    minus.textContent = '-'
    minus.addEventListener('click', () => {
      c.qty -= 1
      if (c.qty <= 0) cart = cart.filter(x => x !== c)
      renderCart()
    })
    const plus = document.createElement('button')
    plus.textContent = '+'
    plus.addEventListener('click', () => { c.qty += 1; renderCart() })
    li.textContent = `${c.name} x${c.qty} — ${formatPrice(lineTotal)} `
    li.appendChild(minus)
    li.appendChild(plus)
    els.cartList.appendChild(li)
  })
  els.cartTotal.textContent = formatPrice(total)
}

// ---------- Orders (Story 3.1) ----------
function summarizeCart() {
  if (!selectedRestaurant) return 'No restaurant selected.'
  if (!cart.length) return 'Cart is empty.'
  const lines = cart.map(c => `• ${c.name} x${c.qty} = ${formatPrice(c.priceCents * c.qty)}`)
  const total = cart.reduce((acc, c) => acc + c.priceCents * c.qty, 0)
  return `Order @ ${selectedRestaurant.name}\n${lines.join('\n')}\nTotal: ${formatPrice(total)}`
}

async function placeOrder() {
  if (!selectedRestaurant) return say('Please select a restaurant before placing an order.')
  if (!cart.length) return say('Add items to the cart first.')
  const items = cart.map(c => ({ itemId: c.itemId, name: c.name, priceCents: c.priceCents, qty: c.qty }))
  const r = await api('/orders', { method: 'POST', body: { restaurantId: selectedRestaurant.id, items } })
  if (r.ok) {
    say(`Order placed! ID: ${r.data.order.id}, status: ${r.data.order.status}`)
    cart = []
    renderCart()
    await refreshOrders()
  } else {
    say(`Failed to place order: ${r.status} ${r.data.error || ''}`)
  }
}

async function refreshOrders() {
  const r = await api('/orders')
  if (!r.ok) return say(`Failed to load orders: ${r.status}`)
  renderOrders(r.data.orders || [])
}

function renderOrders(rows = []) {
  els.ordersList.innerHTML = ''
  rows.forEach(o => {
    const li = document.createElement('li')
    const title = document.createElement('div')
    title.textContent = `#${o.id} — R${o.restaurantId} — ${o.status}`
    li.appendChild(title)
    const items = document.createElement('div')
    items.className = 'muted'
    items.textContent = (o.items || []).map(i => `${i.name} x${i.qty}`).join(', ')
    li.appendChild(items)
    const pay = document.createElement('div')
    pay.className = 'muted'
    pay.textContent = `Payment: ${o.paymentStatus || 'Unpaid'}`
    li.appendChild(pay)
    const next = nextStatus(o.status)
    if (next) {
      const btn = document.createElement('button')
      btn.textContent = `Advance → ${next}`
      btn.addEventListener('click', () => advanceOrder(o.id, next))
      li.appendChild(btn)
    }
    if (!o.paymentStatus || o.paymentStatus === 'Unpaid' || o.paymentStatus === 'Failed') {
      const payBtn = document.createElement('button')
      payBtn.textContent = 'Pay'
      payBtn.addEventListener('click', () => startPaymentFlow(o.id))
      li.appendChild(payBtn)
    }
    const track = document.createElement('button')
    track.textContent = 'Track'
    track.addEventListener('click', () => trackOrder(o.id))
    li.appendChild(track)
    els.ordersList.appendChild(li)
  })
}

function nextStatus(cur) {
  switch (cur) {
    case 'Submitted': return 'Accepted'
    case 'Accepted': return 'Preparing'
    case 'Preparing': return 'ReadyForPickup'
    default: return null
  }
}

async function advanceOrder(id, next) {
  const r = await api(`/orders/${id}/status`, { method: 'POST', body: { next } })
  if (r.ok) {
    await refreshOrders()
  } else if (r.status === 409) {
    say(`Invalid transition: ${r.data.error}`)
  } else if (r.status === 401) {
    say('Please login to perform this action.')
  } else if (r.status === 403) {
    say('Forbidden: staff or admin role required to advance orders.')
  } else {
    say(`Failed to update: ${r.status}`)
  }
}

// ---------- Tracking (SSE) ----------
let es = null
let trackingId = null
let map = null
let mapMarker = null

function trackOrder(orderId) {
  stopTracking()
  if (!apiBase) return say('API base not configured')
  trackingId = orderId
  els.trackingOrder.textContent = `#${orderId}`
  els.trackingStatus.textContent = 'Connecting...'
  els.trackingCoords.textContent = ''
  ensureMap()
  const url = `${apiBase}/tracking/${orderId}/stream`
  es = new EventSource(url)
  es.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data)
      if (data.type === 'hello') {
        els.trackingStatus.textContent = `Status: ${data.status}`
      } else if (data.type === 'location') {
        els.trackingCoords.textContent = `Lat ${data.lat.toFixed(6)}, Lng ${data.lng.toFixed(6)} @ ${new Date(data.ts).toLocaleTimeString()}`
        updateMap(data.lat, data.lng)
      } else if (data.type === 'complete') {
        els.trackingStatus.textContent = 'Arrived (simulation complete)'
        stopTracking()
      }
    } catch (_) {
      // ignore malformed SSE chunk
    }
  }
  es.onerror = () => {
    els.trackingStatus.textContent = 'Connection error'
  }
}

function stopTracking() {
  if (es) {
    es.close()
    es = null
  }
  if (trackingId) {
    trackingId = null
  }
  els.trackingStatus.textContent = 'Not tracking.'
  els.trackingOrder.textContent = '—'
  els.trackingCoords.textContent = ''
  resetMap()
}

function ensureMap() {
  if (typeof L === 'undefined') return
  const el = document.getElementById('map')
  if (!el) return
  if (!map) {
    map = L.map(el).setView([18.936, -99.223], 14)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map)
  }
}

function updateMap(lat, lng) {
  if (!map) return
  const pos = [lat, lng]
  if (!mapMarker) {
    mapMarker = L.marker(pos).addTo(map)
  } else {
    mapMarker.setLatLng(pos)
  }
  map.setView(pos, map.getZoom() || 14)
}

function resetMap() {
  if (mapMarker) {
    map.removeLayer(mapMarker)
    mapMarker = null
  }
}

// ---------- UI wiring ----------
els.loadRestaurantsBtn?.addEventListener('click', loadRestaurants)
els.clearCartBtn?.addEventListener('click', () => { cart = []; renderCart() })
els.reviewOrderBtn?.addEventListener('click', () => say(summarizeCart()))
els.placeOrderBtn?.addEventListener('click', placeOrder)
els.refreshOrdersBtn?.addEventListener('click', refreshOrders)
els.stopTrackingBtn?.addEventListener('click', stopTracking)

// ---------- Restaurant Console ----------
// Elements
const rc = {
  restaurant: document.getElementById('rcRestaurant'),
  loadBtn: document.getElementById('rcLoadOrdersBtn'),
  list: document.getElementById('rcOrdersList')
}

async function initRestaurantConsole() {
  try {
    const r = await api('/restaurants')
    if (!r.ok) return
    rc.restaurant.innerHTML = ''
    ;(r.data.restaurants || []).forEach(x => {
      const opt = document.createElement('option')
      opt.value = x.id
      opt.textContent = `${x.name}`
      rc.restaurant.appendChild(opt)
    })
  } catch (_) {
    // ignore errors during initial load
  }
}

async function rcLoadOrders() {
  const rid = rc.restaurant.value
  if (!rid) return
  const r = await api(`/orders?restaurantId=${encodeURIComponent(rid)}`)
  if (!r.ok) return say(`Failed to load orders for restaurant ${rid}: ${r.status}`)
  renderRcOrders(r.data.orders || [])
}

function renderRcOrders(rows = []) {
  rc.list.innerHTML = ''
  rows.forEach(o => {
    const li = document.createElement('li')
    const title = document.createElement('div')
    title.textContent = `#${o.id} — ${o.status} — Payment: ${o.paymentStatus || 'Unpaid'}`
    li.appendChild(title)
    const items = document.createElement('div')
    items.className = 'muted'
    items.textContent = (o.items || []).map(i => `${i.name} x${i.qty}`).join(', ')
    li.appendChild(items)
    const next = nextStatus(o.status)
    if (next) {
      const btn = document.createElement('button')
      btn.textContent = `Advance → ${next}`
      btn.addEventListener('click', async () => { await advanceOrder(o.id, next); await rcLoadOrders() })
      li.appendChild(btn)
    }
    rc.list.appendChild(li)
  })
}

rc.loadBtn?.addEventListener('click', rcLoadOrders)
initRestaurantConsole()

els.registerBtn.addEventListener('click', async () => {
  try {
    const email = els.email.value.trim()
    const password = els.password.value
    const role = (els.role?.value) || 'client'
    const r = await api('/auth/register', { method: 'POST', body: { email, password, role } })
    if (r.ok) {
      say(`Registered ${r.data.email}`)
    } else {
      say(`Register failed: ${r.status} ${r.data.error || ''}`)
    }
  } catch (e) {
    log(`register error: ${e.message}`)
  }
})

els.loginBtn.addEventListener('click', async () => {
  try {
    const email = els.email.value.trim()
    const password = els.password.value
    const r = await api('/auth/login', { method: 'POST', body: { email, password } })
    if (r.ok && r.data.token) {
      localStorage.setItem(tokenKey, r.data.token)
      say('Logged in')
      const me = await api('/me')
      if (me.ok) say(`Hello ${me.data.user.email} (role: ${me.data.user.role})`)
    } else {
      say(`Login failed: ${r.status} ${r.data.error || ''}`)
    }
  } catch (e) {
    log(`login error: ${e.message}`)
  }
})

els.logoutBtn.addEventListener('click', async () => {
  try {
    const r = await api('/auth/logout', { method: 'POST' })
    if (r.ok) {
      localStorage.removeItem(tokenKey)
      say('Logged out')
    } else {
      say(`Logout failed: ${r.status} ${r.data.error || ''}`)
    }
  } catch (e) {
    log(`logout error: ${e.message}`)
  }
})

// Welcome message
if (!localStorage.getItem('onboarded')) {
  say('Welcome to Marshanta! Create an account or login to continue.')
  localStorage.setItem('onboarded', '1')
} else {
  say('Welcome back!')
}

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then(() => log('SW registered')).catch(e => log(`SW error: ${e.message}`))
}
