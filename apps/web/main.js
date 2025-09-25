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
  apiBaseInput: document.getElementById('apiBaseInput'),
  setApiBaseBtn: document.getElementById('setApiBaseBtn'),
  clearApiBaseBtn: document.getElementById('clearApiBaseBtn'),
  // Auth modal elements
  authOverlay: document.getElementById('authOverlay'),
  authClose: document.getElementById('authClose'),
  tabLogin: document.getElementById('tabLogin'),
  tabSignup: document.getElementById('tabSignup'),
  authEmail: document.getElementById('authEmail'),
  authPassword: document.getElementById('authPassword'),
  authRoleRow: document.getElementById('authRoleRow'),
  authLoginBtn: document.getElementById('authLoginBtn'),
  authSignupBtn: document.getElementById('authSignupBtn'),
  // Marketing
  mkStartOrderBtn: document.getElementById('mkStartOrderBtn'),
  mkHowItWorksBtn: document.getElementById('mkHowItWorksBtn'),
  howOverlay: document.getElementById('howOverlay'),
  howCloseBtn: document.getElementById('howCloseBtn'),
  howSignupBtn: document.getElementById('howSignupBtn'),
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
  trackingOrder: document.getElementById('trackingOrder'),
  trackingStatus: document.getElementById('trackingStatus'),
  trackingCoords: document.getElementById('trackingCoords'),
  stopTrackingBtn: document.getElementById('stopTrackingBtn')
}
els.apiBase.textContent = apiBase
// Prefill API base input if present
if (els.apiBaseInput) {
  els.apiBaseInput.value = localStorage.getItem('apiBase') || ''
}
// Allow setting a custom API base (useful for on-device builds)
els.setApiBaseBtn?.addEventListener('click', () => {
  const v = (els.apiBaseInput?.value || '').trim()
  if (!v) { alert('Enter a full URL, e.g., http://192.168.1.70:4000'); return }
  try {
    const u = new URL(v)
    if (!u.protocol.startsWith('http')) throw new Error('Invalid protocol')
    localStorage.setItem('apiBase', v)
    location.reload()
  } catch (e) {
    alert('Invalid URL for API base')
  }
})
els.clearApiBaseBtn?.addEventListener('click', () => {
  localStorage.removeItem('apiBase')
  location.reload()
})
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

// ---------- Auth Modal wiring ----------
let authMode = 'login' // 'login' | 'signup'
let signupRole = 'client'
function showAuth(mode = 'login') {
  authMode = mode
  if (els.tabLogin && els.tabSignup) {
    els.tabLogin.classList.toggle('active', mode === 'login')
    els.tabSignup.classList.toggle('active', mode === 'signup')
  }
  if (els.authRoleRow) els.authRoleRow.style.display = mode === 'signup' ? '' : 'none'
  if (els.authOverlay) { els.authOverlay.style.display = 'flex'; els.authOverlay.setAttribute('aria-hidden', 'false') }
}
function hideAuth() {
  if (els.authOverlay) { els.authOverlay.style.display = 'none'; els.authOverlay.setAttribute('aria-hidden', 'true') }
}
function selectSignupRole(role) {
  signupRole = role
  document.querySelectorAll('.chip[data-role]')?.forEach(ch => ch.classList.toggle('selected', ch.getAttribute('data-role') === role))
}
// Tabs
els.tabLogin?.addEventListener('click', () => showAuth('login'))
els.tabSignup?.addEventListener('click', () => showAuth('signup'))
els.authClose?.addEventListener('click', hideAuth)
// Role chips
document.querySelectorAll('.chip[data-role]')?.forEach(ch => {
  ch.addEventListener('click', () => selectSignupRole(ch.getAttribute('data-role')))
})
selectSignupRole('client')
// Auth buttons
els.authLoginBtn?.addEventListener('click', async () => {
  const email = (els.authEmail?.value || '').trim()
  const password = els.authPassword?.value || ''
  if (!email) return say('Por favor ingresa tu correo electrónico.')
  if (!password) return say('Por favor ingresa tu contraseña.')
  const r = await api('/auth/login', { method: 'POST', body: { email, password } })
  if (r.ok && r.data.token) {
    localStorage.setItem(tokenKey, r.data.token)
    const me = await api('/me')
    if (me.ok) {
      try { localStorage.setItem(userEmailKey, me.data.user.email || '') } catch (_) {}
      try { currentRole = (me.data.user.role || '').toLowerCase(); localStorage.setItem(userRoleKey, currentRole) } catch (_) {}
      say(`Hola ${me.data.user.email} (rol: ${me.data.user.role})`)
      updateRoleUI(); startRcAuto(); if (currentRole === 'admin') { await loadAdmin() }
      hideAuth()
    }
  } else {
    say(`Inicio de sesión fallido: ${r.status} ${r.data.error || ''}`)
  }
})
els.authSignupBtn?.addEventListener('click', async () => {
  const email = (els.authEmail?.value || '').trim()
  const password = els.authPassword?.value || ''
  const role = signupRole
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return say('Ingresa un correo válido.')
  if (!password || password.length < 6) return say('La contraseña debe tener al menos 6 caracteres.')
  const r = await api('/auth/register', { method: 'POST', body: { email, password, role } })
  if (r.ok) {
    say(`Registro exitoso para ${r.data.email || email} — ahora inicia sesión`)
    showAuth('login')
  } else {
    say(`Registro fallido: ${r.status} ${r.data.error || ''}`)
  }
})

// Auto-open auth for guests on first load
try {
  const token = localStorage.getItem(tokenKey)
  if (!token) {
    // Show login by default
    setTimeout(() => showAuth('login'), 50)
  }
} catch (_) {}

// ---------- Marketing wiring ----------
function showHow() {
  if (els.howOverlay) { els.howOverlay.style.display = 'flex'; els.howOverlay.setAttribute('aria-hidden', 'false') }
}
function hideHow() {
  if (els.howOverlay) { els.howOverlay.style.display = 'none'; els.howOverlay.setAttribute('aria-hidden', 'true') }
}
els.mkStartOrderBtn?.addEventListener('click', async () => {
  // Scroll to Restaurants and auto-load
  try {
    await loadRestaurants()
  } catch (_) {}
  document.getElementById('restaurantsList')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
})
els.mkHowItWorksBtn?.addEventListener('click', () => showHow())
els.howCloseBtn?.addEventListener('click', () => hideHow())
els.howSignupBtn?.addEventListener('click', () => { hideHow(); showAuth('signup'); selectSignupRole('client') })

// ---------- Reveal on scroll ----------
try {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) e.target.classList.add('in')
    })
  }, { rootMargin: '0px 0px -15% 0px', threshold: 0.1 })
  document.querySelectorAll('[data-reveal]')?.forEach(el => io.observe(el))
} catch(_) {}

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

    // Delivery section visibility
    const deliverySection = document.getElementById('deliverySection')
    if (deliverySection) {
      const isDelivery = currentRole === 'delivery'
      deliverySection.style.display = isDelivery ? '' : 'none'
      if (isDelivery) {
        loadDeliveryAssignments().catch(()=>{})
        startDeliverySse()
      } else {
        stopDeliverySse()
        stopDeliveryLocation()
        delUnread = 0
        updateDeliveryBadge()
      }
    }

    // Restaurant Console (staff/admin only)
    const rcSection = document.getElementById('rcSection')
    if (rcSection) {
      rcSection.style.display = isStaff() ? '' : 'none'
    }

    // Marketing (client only)
    const marketing = document.getElementById('marketingSection')
    if (marketing) {
      // Show to guests (no role) and clients; hide for staff/delivery/admin
      const showMk = !currentRole || currentRole === 'client'
      marketing.style.display = showMk ? '' : 'none'
    }

    const rcRestaurantEl = document.getElementById('rcRestaurant')
    const loadBtn = document.getElementById('rcLoadOrdersBtn')
    const rcHint = document.getElementById('rcHint')
    const badge = els.roleBadge
    const roleText = currentRole || 'invitado'
    if (badge) badge.textContent = `rol: ${roleText}`
    if (loadBtn) {
      loadBtn.disabled = !isStaff()
      loadBtn.title = isStaff() ? '' : 'La Consola del restaurante está disponible solo para personal o administrador.'
    }
    if (rcRestaurantEl) {
      rcRestaurantEl.disabled = !isStaff()
      rcRestaurantEl.title = isStaff() ? '' : 'Inicia sesión como personal o admin para seleccionar un restaurante.'
    }
    if (rc.statusFilter) {
      rc.statusFilter.disabled = !isStaff()
      rc.statusFilter.title = isStaff() ? '' : 'Inicia sesión como personal o admin para filtrar pedidos.'
    }
    if (rc.autoRefresh) {
      rc.autoRefresh.disabled = !isStaff()
      rc.autoRefresh.title = isStaff() ? '' : 'Inicia sesión como personal o admin para habilitar auto-actualización.'
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
    if (!r.ok) return say(`No se pudieron cargar los restaurantes (${r.status})`)
    renderRestaurants(r.data.restaurants)
  } catch (e) {
    log(`error restaurantes: ${e.message}`)
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
  els.menuHeader.textContent = `Menú — ${r.name}`
  els.menuList.innerHTML = ''
  try {
    const m = await api(`/restaurants/${r.id}/menu`)
    if (!m.ok) return say(`No se pudo cargar el menú (${m.status})`)
    renderMenu(m.data.items || [])
  } catch (e) {
    log(`error menú: ${e.message}`)
  }
}

function renderMenu(items = []) {
  els.menuList.innerHTML = ''
  lastMenuItems = items
  items.forEach(it => {
    const li = document.createElement('li')
    const add = document.createElement('button')
    add.textContent = `Agregar`
    add.addEventListener('click', () => addToCart(it))
    li.textContent = `${it.name} — ${formatPrice(it.priceCents)} `
    li.appendChild(add)
    els.menuList.appendChild(li)
  })
}

function addToCart(item) {
  if (!selectedRestaurant) return say('Selecciona un restaurante primero')
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
  if (!selectedRestaurant) return say('Selecciona un restaurante antes de realizar un pedido.')
  if (!cart.length) return say('Agrega artículos al carrito primero.')
  const items = cart.map(c => ({ itemId: c.itemId, name: c.name, priceCents: c.priceCents, qty: c.qty }))
  try {
    els.placeOrderBtn.disabled = true
    const r = await api('/orders', { method: 'POST', body: { restaurantId: selectedRestaurant.id, items } })
    if (r.ok) {
      say(`¡Pedido realizado! ID: ${r.data.order.id}, estatus: ${r.data.order.status}`)
      cart = []
      renderCart()
      await refreshOrders()
    } else {
      say(`No se pudo realizar el pedido: ${r.status} ${r.data.error || ''}`)
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
  if (!r.ok) return say(`No se pudieron cargar los pedidos: ${r.status}`)
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
    say(`Transición inválida: ${r.data.error}`)
  } else if (r.status === 401) {
    say('Inicia sesión para realizar esta acción.')
  } else if (r.status === 403) {
    say('Prohibido: se requiere rol de personal o administrador para avanzar pedidos.')
  } else {
    say(`No se pudo actualizar: ${r.status}`)
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
    const [m, u, r, o, p] = await Promise.all([
      api('/admin/metrics'),
      api('/admin/users'),
      api('/admin/restaurants'),
      api('/admin/orders'),
      loadAdminPartners()
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
    // Assign to partner controls
    const ctrl = document.createElement('div')
    ctrl.className = 'row'
    const sel = document.createElement('select')
    const partners = (window.__adminPartners || [])
    partners.forEach(p => {
      const opt = document.createElement('option')
      opt.value = p.id
      opt.textContent = p.name ? `#${p.id} — ${p.name}` : `#${p.id}`
      sel.appendChild(opt)
    })
    const btn = document.createElement('button')
    btn.textContent = 'Assign'
    btn.title = 'Assign this order to the selected delivery partner'
    btn.addEventListener('click', async () => {
      if (!sel.value) { say('Select a partner first'); return }
      btn.disabled = true
      try {
        const r = await assignOrderToPartner(o.id, Number(sel.value))
        if (r) say(`Assigned order #${o.id} to partner #${sel.value}`)
      } finally {
        btn.disabled = false
      }
    })
    ctrl.appendChild(sel)
    ctrl.appendChild(btn)
    li.appendChild(ctrl)
    list.appendChild(li)
  })
}

async function loadAdminPartners() {
  try {
    const r = await api('/admin/delivery-partners')
    if (r.ok) {
      window.__adminPartners = r.data.partners || []
    } else {
      window.__adminPartners = []
    }
    return window.__adminPartners
  } catch (_) {
    window.__adminPartners = []
    return []
  }
}

async function assignOrderToPartner(orderId, partnerId) {
  try {
    const r = await api('/admin/assignments', { method: 'POST', body: { orderId, partnerId } })
    if (!r.ok) { say(`Failed to assign: ${r.status}`); return false }
    return true
  } catch (e) {
    log(`assign error: ${e.message}`)
    return false
  }
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

// ---------- Delivery (partner) ----------
let delEs = null
let delUnread = 0
let delLocTimer = null

async function loadDeliveryAssignments() {
  try {
    const r = await api('/delivery/assignments')
    if (!r.ok) return say(`Failed to load assignments: ${r.status}`)
    renderDeliveryAssignments(r.data.assignments || [])
  } catch (e) { log(`delivery load error: ${e.message}`) }
}

function renderDeliveryAssignments(rows = []) {
  const list = document.getElementById('delAssignments')
  if (!list) return
  list.innerHTML = ''
  rows.forEach(a => {
    const li = document.createElement('li')
    const title = document.createElement('div')
    title.textContent = `Assignment #${a.id} — Order #${a.orderId} — ${a.status}`
    li.appendChild(title)
    const row = document.createElement('div')
    row.className = 'row'
    const accept = document.createElement('button')
    accept.textContent = 'Accept'
    accept.disabled = a.status !== 'Assigned'
    accept.addEventListener('click', async () => {
      accept.disabled = true
      try { await acceptAssignment(a.id); await loadDeliveryAssignments() } finally { accept.disabled = false }
    })
    const picked = document.createElement('button')
    picked.textContent = 'Picked Up'
    picked.disabled = a.status !== 'Accepted'
    picked.addEventListener('click', async () => {
      picked.disabled = true
      try { await updateAssignmentStatus(a.id, 'PickedUp'); await loadDeliveryAssignments() } finally { picked.disabled = false }
    })
    const delivered = document.createElement('button')
    delivered.textContent = 'Delivered'
    delivered.disabled = !(a.status === 'PickedUp')
    delivered.addEventListener('click', async () => {
      delivered.disabled = true
      try { await updateAssignmentStatus(a.id, 'Delivered'); await loadDeliveryAssignments() } finally { delivered.disabled = false }
    })
    row.appendChild(accept)
    row.appendChild(picked)
    row.appendChild(delivered)
    li.appendChild(row)
    list.appendChild(li)
  })
}

async function acceptAssignment(id) {
  const r = await api(`/delivery/assignments/${encodeURIComponent(id)}/accept`, { method: 'POST' })
  if (!r.ok) say(`Failed to accept: ${r.status}`)
}

async function updateAssignmentStatus(id, status) {
  const r = await api(`/delivery/assignments/${encodeURIComponent(id)}/status`, { method: 'POST', body: { status } })
  if (!r.ok) say(`Failed to set status: ${r.status}`)
}

function updateDeliveryBadge() {
  const b = document.getElementById('delBell')
  if (b) b.textContent = String(delUnread)
}

function startDeliverySse() {
  stopDeliverySse()
  if (currentRole !== 'delivery') return
  const token = localStorage.getItem(tokenKey)
  if (!token) return
  const url = `${apiBase}/delivery/events?token=${encodeURIComponent(token)}`
  delEs = new EventSource(url)
  delEs.onmessage = (ev) => {
    try {
      const evt = JSON.parse(ev.data)
      delUnread += 1
      updateDeliveryBadge()
      const msg = evt.message || evt.type
      say(`[DELIVERY] ${msg}`)
      const list = document.getElementById('delNotifications')
      if (list) {
        const li = document.createElement('li')
        li.textContent = `${new Date(evt.ts || Date.now()).toLocaleTimeString()} — ${evt.type}: ${msg}`
        list.prepend(li)
      }
      if (evt.type === 'assignment_created') loadDeliveryAssignments().catch(()=>{})
    } catch (_) {}
  }
  delEs.addEventListener('ping', () => {})
  delEs.onerror = () => { setTimeout(() => startDeliverySse(), 3000) }
}

function stopDeliverySse() {
  if (delEs) { try { delEs.close() } catch (_) {} delEs = null }
}

function stopDeliveryLocation() {
  if (delLocTimer) { clearInterval(delLocTimer); delLocTimer = null }
}

function startDeliveryLocation() {
  stopDeliveryLocation()
  if (currentRole !== 'delivery') return
  const checkbox = document.getElementById('delShareLocation')
  if (!checkbox?.checked) return
  const send = async (coords) => {
    try {
      const lat = Number(coords?.latitude ?? 18.936)
      const lng = Number(coords?.longitude ?? -99.223)
      await api('/delivery/location', { method: 'POST', body: { lat, lng } })
    } catch (_) {}
  }
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(p => send(p.coords), () => send(null), { enableHighAccuracy: true, maximumAge: 10000 })
  } else {
    send(null)
  }
  delLocTimer = setInterval(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(p => send(p.coords), () => send(null), { enableHighAccuracy: true, maximumAge: 10000 })
    } else {
      send(null)
    }
  }, 10000)
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
document.getElementById('delRefreshBtn')?.addEventListener('click', () => { loadDeliveryAssignments().catch(()=>{}) })
document.getElementById('delShareLocation')?.addEventListener('change', () => { if (document.getElementById('delShareLocation').checked) startDeliveryLocation(); else stopDeliveryLocation() })

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
      btn.textContent = `Avanzar → ${next}`
      btn.addEventListener('click', async () => {
        btn.disabled = true
        try { await advanceOrder(o.id, next); await rcLoadOrders() } finally { btn.disabled = false }
      })
      li.appendChild(btn)
    }
    // When order is ready for pickup, allow staff/admin to track driver's live location
    if (o.status === 'ReadyForPickup') {
      const trackBtn = document.createElement('button')
      trackBtn.textContent = 'Rastrear repartidor'
      trackBtn.title = 'Abrir ubicación en vivo del repartidor para este pedido'
      trackBtn.addEventListener('click', () => trackOrder(o.id))
      li.appendChild(trackBtn)
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
      stopDeliverySse()
      stopDeliveryLocation()
      delUnread = 0
      updateDeliveryBadge()
      say('Sesión cerrada')
    } else {
      say(`Cerrar sesión falló: ${r.status} ${r.data.error || ''}`)
    }
  } catch (e) {
    log(`error cerrar sesión: ${e.message}`)
  }
})

// Welcome message
try {
  const onboarded = localStorage.getItem('onboarded')
  if (!onboarded) {
    say('Welcome to Marshanta!')
    say('How to order: 1) Load restaurants, 2) Pick a restaurant and add items, 3) Place order, 4) Pay and track delivery.')
    say('Crea una cuenta o inicia sesión para continuar.')
    localStorage.setItem('onboarded', '1')
  } else {
    const lastEmail = localStorage.getItem(userEmailKey)
    if (lastEmail) say(`¡Bienvenido de nuevo, ${lastEmail}!`)
    else say('¡Bienvenido de nuevo!')
  }
} catch (_) {
  // storage may be unavailable; proceed without persistence
  say('¡Bienvenido a Marshanta!')
}

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js').then(() => log('SW registered')).catch(e => log(`SW error: ${e.message}`))
}
