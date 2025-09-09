/* global L */
const apiBase = localStorage.getItem('apiBase') || (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:4000' : '')
const tokenKey = 'authToken'
const userEmailKey = 'lastUserEmail'
const userRoleKey = 'lastUserRole'

const els = {
  installBtn: document.getElementById('installBtn'),
  chat: document.getElementById('chat'),
  chatInput: document.getElementById('chatInput'),
  chatSendBtn: document.getElementById('chatSendBtn'),
  email: document.getElementById('email'),
  password: document.getElementById('password'),
  role: document.getElementById('role'),
  registerBtn: document.getElementById('registerBtn'),
  loginBtn: document.getElementById('loginBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  log: document.getElementById('log'),
  apiBase: document.getElementById('apiBase'),
  roleBadge: document.getElementById('roleBadge'),
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
// Initialize role UI badge and RC controls on load
updateRoleUI()

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
let lastMenuItems = []
let currentRole = (localStorage.getItem(userRoleKey) || '').toLowerCase()

function isStaff() {
  return currentRole === 'staff' || currentRole === 'admin'
}

function updateRoleUI() {
  try {
    // Admin section visibility
    const adminSection = document.getElementById('adminSection')
    if (adminSection) {
      const isAdmin = currentRole === 'admin'
      adminSection.style.display = isAdmin ? '' : 'none'
      if (isAdmin) {
        // Load admin data and ensure SSE is connected
        loadAdmin().catch(() => {})
        startAdminSse()
      } else {
        // Hide admin: stop SSE and reset unread
        stopAdminSse()
        adminUnread = 0
        updateAdminBadge()
      }
    }

    const rcRestaurantEl = document.getElementById('rcRestaurant')
    const loadBtn = document.getElementById('rcLoadOrdersBtn')
    const rcHint = document.getElementById('rcHint')
    const badge = els.roleBadge
    const roleText = currentRole || 'guest'
    if (badge) badge.textContent = `role: ${roleText}`
    if (loadBtn) {
      loadBtn.disabled = !isStaff()
      loadBtn.title = isStaff() ? '' : 'Restaurant Console is available to staff or admin only.'
    }
    if (rcRestaurantEl) {
      rcRestaurantEl.disabled = !isStaff()
      rcRestaurantEl.title = isStaff() ? '' : 'Login as staff or admin to select a restaurant.'
    }
    if (rc.statusFilter) {
      rc.statusFilter.disabled = !isStaff()
      rc.statusFilter.title = isStaff() ? '' : 'Login as staff or admin to filter orders.'
    }
    if (rc.autoRefresh) {
      rc.autoRefresh.disabled = !isStaff()
      rc.autoRefresh.title = isStaff() ? '' : 'Login as staff or admin to enable auto-refresh.'
      if (!isStaff()) {
        rc.autoRefresh.checked = false
        stopRcAuto()
      }
    }
    if (rcHint) rcHint.style.display = isStaff() ? 'none' : ''
  } catch (_) {}
}

function formatPrice(cents) {
  const v = (cents || 0) / 100
  return v.toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

function createBadge(text, cls) {
  const span = document.createElement('span')
  span.className = `badge ${cls || ''}`.trim()
  span.textContent = text
  return span
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
  lastMenuItems = items
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
  persistCart()
}

// ---------- Orders (Story 3.1) ----------
function summarizeCart() {
  if (!selectedRestaurant) return 'No restaurant selected.'
  if (!cart.length) return 'Cart is empty.'
  const lines = cart.map(c => `• ${c.name} x${c.qty} = ${formatPrice(c.priceCents * c.qty)}`)
  const subtotal = cart.reduce((acc, c) => acc + c.priceCents * c.qty, 0)
  const taxes = Math.round(subtotal * 0.08)
  const fees = Math.round(subtotal * 0.03)
  const total = subtotal + taxes + fees
  return `Order @ ${selectedRestaurant.name}\n${lines.join('\n')}\nSubtotal: ${formatPrice(subtotal)}\nTaxes: ${formatPrice(taxes)}\nFees: ${formatPrice(fees)}\nTotal: ${formatPrice(total)}`
}

async function placeOrder() {
  if (!selectedRestaurant) return say('Please select a restaurant before placing an order.')
  if (!cart.length) return say('Add items to the cart first.')
  const items = cart.map(c => ({ itemId: c.itemId, name: c.name, priceCents: c.priceCents, qty: c.qty }))
  try {
    els.placeOrderBtn.disabled = true
    const r = await api('/orders', { method: 'POST', body: { restaurantId: selectedRestaurant.id, items } })
    if (r.ok) {
      say(`Order placed! ID: ${r.data.order.id}, status: ${r.data.order.status}`)
      cart = []
      renderCart()
      await refreshOrders()
    } else {
      say(`Failed to place order: ${r.status} ${r.data.error || ''}`)
    }
  } finally {
    els.placeOrderBtn.disabled = false
  }
}

// ---------- Persistence ----------
function currentUserKey() {
  const email = localStorage.getItem(userEmailKey) || 'guest'
  return `cart:${email}`
}

function persistCart() {
  try {
    const key = currentUserKey()
    const data = { restaurant: selectedRestaurant ? { id: selectedRestaurant.id, name: selectedRestaurant.name } : null, cart }
    localStorage.setItem(key, JSON.stringify(data))
  } catch (_) {}
}

function restoreCart() {
  try {
    const key = currentUserKey()
    const raw = localStorage.getItem(key)
    if (!raw) return
    const data = JSON.parse(raw)
    if (data && Array.isArray(data.cart)) {
      cart = data.cart
      renderCart()
    }
  } catch (_) {}
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
    title.textContent = `#${o.id} — R${o.restaurantId}`
    const st = createBadge(o.status, `status status-${o.status}`)
    st.style.marginLeft = '8px'
    title.appendChild(st)
    li.appendChild(title)
    const items = document.createElement('div')
    items.className = 'muted'
    items.textContent = (o.items || []).map(i => `${i.name} x${i.qty}`).join(', ')
    li.appendChild(items)
    const payBadge = createBadge(o.paymentStatus || 'Unpaid', `status pay-${o.paymentStatus || 'Unpaid'}`)
    li.appendChild(payBadge)
    const next = nextStatus(o.status)
    if (next && isStaff()) {
      const btn = document.createElement('button')
      btn.textContent = `Advance → ${next}`
      btn.addEventListener('click', async () => {
        btn.disabled = true
        try { await advanceOrder(o.id, next) } finally { btn.disabled = false }
      })
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

// ---------- Admin (read-only) ----------
async function loadAdmin() {
  if (currentRole !== 'admin') return
  try {
    const [m, u, r, o] = await Promise.all([
      api('/admin/metrics'),
      api('/admin/users'),
      api('/admin/restaurants'),
      api('/admin/orders')
    ])
    if (m.ok) renderAdminMetrics(m.data.metrics)
    if (u.ok) renderAdminUsers(u.data.users || [])
    if (r.ok) renderAdminRestaurants(r.data.restaurants || [])
    if (o.ok) renderAdminOrders(o.data.orders || [])
  } catch (e) {
    log(`admin load error: ${e.message}`)
  }
}

function renderAdminMetrics(metrics = {}) {
  const { usersTotal = 0, restaurantsTotal = 0, ordersTotal = 0, revenueCents = 0 } = metrics
  const u = document.getElementById('admUsers')
  const r = document.getElementById('admRestaurants')
  const o = document.getElementById('admOrders')
  const rev = document.getElementById('admRevenue')
  if (u) u.textContent = String(usersTotal)
  if (r) r.textContent = String(restaurantsTotal)
  if (o) o.textContent = String(ordersTotal)
  if (rev) rev.textContent = formatPrice(Number(revenueCents) || 0)
}

function renderAdminUsers(rows = []) {
  const list = document.getElementById('admUsersList')
  if (!list) return
  list.innerHTML = ''
  rows.forEach(x => {
    const li = document.createElement('li')
    li.textContent = `#${x.id} — ${x.email} (${x.role})`
    list.appendChild(li)
  })
}

function renderAdminRestaurants(rows = []) {
  const list = document.getElementById('admRestaurantsList')
  if (!list) return
  list.innerHTML = ''
  rows.forEach(x => {
    const li = document.createElement('li')
    li.textContent = `#${x.id} — ${x.name}`
    list.appendChild(li)
  })
}

function renderAdminOrders(rows = []) {
  const list = document.getElementById('admOrdersList')
  if (!list) return
  list.innerHTML = ''
  rows.forEach(o => {
    const li = document.createElement('li')
    const st = createBadge(o.status, `status status-${o.status}`)
    const pb = createBadge(o.paymentStatus || 'Unpaid', `status pay-${o.paymentStatus || 'Unpaid'}`)
    li.textContent = `#${o.id} — R${o.restaurantId} `
    li.appendChild(st)
    li.appendChild(pb)
    list.appendChild(li)
  })
}

// Admin notifications (SSE)
let adminEs = null
let adminUnread = 0

function showAdminToast(msg) {
  say(`[ADMIN] ${msg}`)
}

function updateAdminBadge() {
  const u = document.getElementById('admUsers') // reuse badge row to show count subtly
  if (!u) return
  const badge = document.getElementById('admBell')
  if (badge) badge.textContent = String(adminUnread)
}

function startAdminSse() {
  try { stopAdminSse() } catch (_) {}
  if (currentRole !== 'admin') return
  const token = localStorage.getItem(tokenKey)
  if (!token) return
  const url = `${apiBase}/admin/events?token=${encodeURIComponent(token)}`
  adminEs = new EventSource(url)
  adminEs.onmessage = (ev) => {
    try {
      const evt = JSON.parse(ev.data)
      adminUnread += 1
      updateAdminBadge()
      const m = evt.message || evt.type
      showAdminToast(m)
      // Append to a simple list if present
      const list = document.getElementById('admNotifications')
      if (list) {
        const li = document.createElement('li')
        li.textContent = `${new Date(evt.ts || Date.now()).toLocaleTimeString()} — ${evt.type}: ${m}`
        list.prepend(li)
      }
    } catch (_) {}
  }
  adminEs.addEventListener('ping', () => {/* heartbeat */})
  adminEs.onerror = () => {
    // attempt a lightweight reconnect after a delay
    setTimeout(() => { startAdminSse() }, 3000)
  }
}

function stopAdminSse() {
  if (adminEs) { try { adminEs.close() } catch (_) {} adminEs = null }
}

// ---------- UI wiring ----------
els.loadRestaurantsBtn?.addEventListener('click', loadRestaurants)
els.clearCartBtn?.addEventListener('click', () => { cart = []; renderCart() })
els.reviewOrderBtn?.addEventListener('click', () => say(summarizeCart()))
els.placeOrderBtn?.addEventListener('click', placeOrder)
els.refreshOrdersBtn?.addEventListener('click', refreshOrders)
els.stopTrackingBtn?.addEventListener('click', stopTracking)
els.chatSendBtn?.addEventListener('click', onChatSend)
els.chatInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') onChatSend() })
document.getElementById('admRefreshBtn')?.addEventListener('click', () => { loadAdmin().catch(()=>{}) })

function onChatSend() {
  const text = (els.chatInput?.value || '').trim()
  if (!text) return
  els.chatInput.value = ''
  say(`You: ${text}`)
  handleChatCommand(text)
}

async function handleChatCommand(text) {
  const t = text.toLowerCase()
  if (t.startsWith('show restaurants') || t === 'restaurants' || t === 'show menus' || t === 'show menu') {
    await loadRestaurants()
    say('Loaded restaurants. Tap one above or type "menu <name>"')
    return
  }
  if (t.startsWith('menu ')) {
    const name = t.replace(/^menu\s+/, '').trim()
    const r = await api('/restaurants')
    if (r.ok) {
      const found = (r.data.restaurants || []).find(x => x.name.toLowerCase().includes(name))
      if (found) {
        await selectRestaurant(found)
        say(`Showing menu for ${found.name}`)
      } else {
        say(`Could not find restaurant matching "${name}"`)
      }
    } else {
      say('Failed to load restaurants')
    }
    return
  }
  if (t.startsWith('add ')) {
    // patterns: add 2 tacos | add tacos | add 3 "taco al pastor"
    const m = t.match(/^add\s+(\d+)\s+(.+)$/) || t.match(/^add\s+(.+)$/)
    let qty = 1
    let itemName = ''
    if (m) {
      if (m.length === 3) { qty = parseInt(m[1], 10) || 1; itemName = m[2] } else { itemName = m[1] }
      const it = (lastMenuItems || []).find(x => x.name.toLowerCase().includes(itemName))
      if (!it) return say(`Item not found: ${itemName}`)
      for (let i = 0; i < qty; i++) addToCart(it)
      say(`Added ${qty} x ${it.name}`)
    } else {
      say('Try: add 2 tacos')
    }
    return
  }
  if (t.startsWith('remove ') || t.startsWith('delete ')) {
    const m = t.match(/^(?:remove|delete)\s+(\d+)\s+(.+)$/) || t.match(/^(?:remove|delete)\s+(.+)$/)
    let qty = 1
    let itemName = ''
    if (m) {
      if (m.length === 3) { qty = parseInt(m[1], 10) || 1; itemName = m[2] } else { itemName = m[1] }
      const idx = cart.findIndex(c => c.name.toLowerCase().includes(itemName))
      if (idx === -1) return say(`Item not in cart: ${itemName}`)
      cart[idx].qty -= qty
      if (cart[idx].qty <= 0) cart.splice(idx, 1)
      renderCart()
      say(`Removed ${qty} x ${itemName}`)
    } else {
      say('Try: remove 1 tacos')
    }
    return
  }
  if (t === 'clear cart') {
    cart = []
    renderCart()
    say('Cart cleared')
    return
  }
  if (t === 'summary' || t === 'review') {
    say(summarizeCart())
    return
  }
  if (t === 'place order' || t === 'order') {
    await placeOrder()
    return
  }
  say("I didn't understand. Try: 'show restaurants', 'menu <name>', 'add 2 tacos', 'summary', 'place order'.")
}

// ---------- Restaurant Console ----------
// Elements
const rc = {
  restaurant: document.getElementById('rcRestaurant'),
  loadBtn: document.getElementById('rcLoadOrdersBtn'),
  statusFilter: document.getElementById('rcStatusFilter'),
  autoRefresh: document.getElementById('rcAutoRefresh'),
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
    updateRoleUI()
  } catch (_) {
    // ignore errors during initial load
  }
}

async function rcLoadOrders() {
  const rid = rc.restaurant.value
  if (!isStaff()) {
    return say('Restaurant Console is available to staff or admin only. Please login as staff/admin.')
  }
  if (!rid) {
    return say('Please select a restaurant to load orders.')
  }
  try {
    rc.loadBtn.disabled = true
    const r = await api(`/orders?restaurantId=${encodeURIComponent(rid)}`)
    if (!r.ok) return say(`Failed to load orders for restaurant ${rid}: ${r.status}`)
    const all = r.data.orders || []
    const f = (rc.statusFilter?.value || 'all')
    const rows = f === 'all' ? all : all.filter(x => x.status === f)
    renderRcOrders(rows)
  } finally {
    rc.loadBtn.disabled = !isStaff()
  }
}

let rcAutoTimer = null

function stopRcAuto() {
  if (rcAutoTimer) {
    clearInterval(rcAutoTimer)
    rcAutoTimer = null
  }
}

function startRcAuto() {
  stopRcAuto()
  if (!isStaff()) return
  if (!rc.autoRefresh?.checked) return
  rcAutoTimer = setInterval(() => {
    rcLoadOrders().catch(() => {})
  }, 5000)
}

function renderRcOrders(rows = []) {
  rc.list.innerHTML = ''
  rows.forEach(o => {
    const li = document.createElement('li')
    const title = document.createElement('div')
    title.textContent = `#${o.id}`
    const st = createBadge(o.status, `status status-${o.status}`)
    st.style.marginLeft = '8px'
    const pb = createBadge(o.paymentStatus || 'Unpaid', `status pay-${o.paymentStatus || 'Unpaid'}`)
    pb.style.marginLeft = '6px'
    title.appendChild(st)
    title.appendChild(pb)
    li.appendChild(title)
    const items = document.createElement('div')
    items.className = 'muted'
    items.textContent = (o.items || []).map(i => `${i.name} x${i.qty}`).join(', ')
    li.appendChild(items)
    const next = nextStatus(o.status)
    if (next) {
      const btn = document.createElement('button')
      btn.textContent = `Advance → ${next}`
      btn.addEventListener('click', async () => {
        btn.disabled = true
        try { await advanceOrder(o.id, next); await rcLoadOrders() } finally { btn.disabled = false }
      })
      li.appendChild(btn)
    }
    rc.list.appendChild(li)
  })
}

rc.loadBtn?.addEventListener('click', rcLoadOrders)
initRestaurantConsole()

// RC filter + auto-refresh wiring
rc.statusFilter?.addEventListener('change', () => { if (isStaff()) rcLoadOrders() })
rc.autoRefresh?.addEventListener('change', () => { if (rc.autoRefresh.checked) startRcAuto(); else stopRcAuto() })

els.registerBtn.addEventListener('click', async () => {
  try {
    const email = els.email.value.trim()
    const password = els.password.value
    const role = (els.role?.value) || 'client'
    // Basic validation
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return say('Please enter a valid email.')
    if (!password || password.length < 6) return say('Password must be at least 6 characters.')
    if (!['client','staff','admin'].includes(role)) return say('Invalid role selected.')
    const r = await api('/auth/register', { method: 'POST', body: { email, password, role } })
    if (r.ok) {
      const emailShown = r.data.email || email
      try { localStorage.setItem(userEmailKey, emailShown) } catch (_) {}
      say(`Registered ${emailShown}`)
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
    if (!email) return say('Please enter your email.')
    if (!password) return say('Please enter your password.')
    const r = await api('/auth/login', { method: 'POST', body: { email, password } })
    if (r.ok && r.data.token) {
      localStorage.setItem(tokenKey, r.data.token)
      say('Logged in')
      const me = await api('/me')
      if (me.ok) {
        try { localStorage.setItem(userEmailKey, me.data.user.email || '') } catch (_) {}
        try { currentRole = (me.data.user.role || '').toLowerCase(); localStorage.setItem(userRoleKey, currentRole) } catch (_) {}
        say(`Hello ${me.data.user.email} (role: ${me.data.user.role})`)
        updateRoleUI()
        startRcAuto()
        if (currentRole === 'admin') {
          await loadAdmin()
        }
      }
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
      try { localStorage.removeItem(userRoleKey); currentRole = ''; updateRoleUI() } catch (_) {}
      stopRcAuto()
      stopAdminSse()
      adminUnread = 0
      updateAdminBadge()
      say('Logged out')
    } else {
      say(`Logout failed: ${r.status} ${r.data.error || ''}`)
    }
  } catch (e) {
    log(`logout error: ${e.message}`)
  }
})

// Welcome message
try {
  const onboarded = localStorage.getItem('onboarded')
  if (!onboarded) {
    say('Welcome to Marshanta!')
    say('How to order: 1) Load restaurants, 2) Pick a restaurant and add items, 3) Place order, 4) Pay and track delivery.')
    say('Create an account or login to continue.')
    localStorage.setItem('onboarded', '1')
  } else {
    const lastEmail = localStorage.getItem(userEmailKey)
    if (lastEmail) say(`Welcome back, ${lastEmail}!`)
    else say('Welcome back!')
  }
} catch (_) {
  // storage may be unavailable; proceed without persistence
  say('Welcome to Marshanta!')
}

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then(() => log('SW registered')).catch(e => log(`SW error: ${e.message}`))
}
