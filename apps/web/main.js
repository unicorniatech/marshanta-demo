/* global L */
let apiBase = localStorage.getItem('apiBase') || (location.hostname === 'localhost' || location.hostname === '127.0.0.1' ? 'http://localhost:4000' : '')
const tokenKey = 'authToken'
const userEmailKey = 'lastUserEmail'
const userRoleKey = 'lastUserRole'

// Basic API helper used across the app
async function api(path, opts = {}) {
  const url = `${(apiBase || '').replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`
  const headers = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem(tokenKey)
  if (token) headers['Authorization'] = `Bearer ${token}`
  try {
    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    })
    const ct = res.headers.get('content-type') || ''
    const data = ct.includes('application/json') ? await res.json().catch(()=>({})) : await res.text().catch(()=>(''))
    return { ok: res.ok, status: res.status, data }
  } catch (e) {
    return { ok: false, status: 0, data: { error: e?.message || String(e) } }
  }
}

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
  howCloseX: document.getElementById('howCloseX'),
  howCloseBtn: document.getElementById('howCloseBtn'),
  howSignupBtn: document.getElementById('howSignupBtn'),
  roleBadge: document.getElementById('roleBadge'),
  headerActions: document.getElementById('headerActions'),
  // API modal elements
  apiOverlay: document.getElementById('apiOverlay'),
  apiModalInput: document.getElementById('apiModalInput'),
  apiModalSave: document.getElementById('apiModalSave'),
  apiModalClear: document.getElementById('apiModalClear'),
  apiModalClose: document.getElementById('apiModalClose'),
  // Core UI lists/buttons
  loadRestaurantsBtn: document.getElementById('loadRestaurantsBtn'),
  restaurantsList: document.getElementById('restaurantsList'),
  menuHeader: document.getElementById('menuHeader'),
  menuList: document.getElementById('menuList'),
  cartList: document.getElementById('cartList'),
  cartTotal: document.getElementById('cartTotal'),
  clearCartBtn: document.getElementById('clearCartBtn'),
  reviewOrderBtn: document.getElementById('reviewOrderBtn'),
  placeOrderBtn: document.getElementById('placeOrderBtn'),
  ordersList: document.getElementById('ordersList'),
  refreshOrdersBtn: document.getElementById('refreshOrdersBtn'),
  trackingOrder: document.getElementById('trackingOrder'),
  trackingStatus: document.getElementById('trackingStatus'),
  trackingCoords: document.getElementById('trackingCoords'),
  stopTrackingBtn: document.getElementById('stopTrackingBtn'),
  // Footer nav
  homeNavBtn: document.getElementById('homeNavBtn'),
  restNavBtn: document.getElementById('restNavBtn'),
  cartNavBtn: document.getElementById('cartNavBtn'),
  ordersNavBtn: document.getElementById('ordersNavBtn')
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
    try { updateServerStatus() } catch (_) {}
    location.reload()
  } catch (e) {
    alert('Invalid URL for API base')
  }
})
els.clearApiBaseBtn?.addEventListener('click', () => {
  localStorage.removeItem('apiBase')
  try { updateServerStatus() } catch (_) {}
  location.reload()
})
// Global error surface (helps detect early JS errors on device)
window.addEventListener('error', (e) => {
  try { console.error('JS error:', e?.message || e) } catch(_) {}
  try { toast(`Error JS: ${e?.message || e}`, 'error') } catch(_) {}
})
window.addEventListener('unhandledrejection', (e) => {
  try { console.error('Unhandled rejection:', e?.reason || e) } catch(_) {}
  try { toast(`Promesa sin manejar: ${(e?.reason && e.reason.message) || e}`, 'error') } catch(_) {}
})

// Initialize role UI badge and RC controls when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  try {
    updateRoleUI();
    updateInstallVisibility();
    adjustHeaderForApi();
    // Ensure API modal wiring after DOM is ready
    const ss = document.getElementById('serverStatus')
    if (ss) ss.addEventListener('click', () => openApiModal())
    // If no apiBase set and running in Capacitor, auto-prompt API modal
    if ((!apiBase || apiBase.trim() === '') && isNativeApp()) {
      openApiModal()
    }
    // Footer nav wiring
    els.homeNavBtn?.addEventListener('click', () => {
      try {
        document.querySelector('main')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } catch (_) {}
      try {
        // Ensure auth buttons are not submitting a form
        if (els.authLoginBtn) els.authLoginBtn.type = 'button'
        if (els.authSignupBtn) els.authSignupBtn.type = 'button'
        // Prevent default submit if wrapped in a form
        const authForm = els.authLoginBtn?.closest?.('form') || els.authSignupBtn?.closest?.('form')
        if (authForm) authForm.addEventListener('submit', (ev) => { try { ev.preventDefault() } catch(_) {} })
      } catch (_) {}
    })
    els.restNavBtn?.addEventListener('click', async () => {
      try { await loadRestaurants() } catch (_) {}
      try { document.getElementById('restaurantsList')?.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch (_) {}
    })
    els.cartNavBtn?.addEventListener('click', () => {
      try { document.getElementById('cartList')?.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch (_) {}
    })
    els.ordersNavBtn?.addEventListener('click', () => {
      try { document.getElementById('ordersList')?.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'start' }) } catch (_) {}
    })
  } catch (_) {}
})

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
els.authLoginBtn?.addEventListener('click', async (ev) => {
  try { ev?.preventDefault?.() } catch(_) {}
  const email = (els.authEmail?.value || '').trim()
  const password = els.authPassword?.value || ''
  if (!email) return say('Por favor ingresa tu correo electrónico.')
  if (!password) return say('Por favor ingresa tu contraseña.')
  if (!apiBase) { say('Configura la API Base (IP de tu computadora) en la sección Bienvenido.'); try { document.getElementById('apiBaseInput')?.scrollIntoView({ behavior: 'smooth' }) } catch (_) {} return }
  toast('Iniciando sesión…')
  const r = await api('/auth/login', { method: 'POST', body: { email, password } })
  if (r.ok && r.data && r.data.token) {
    try { localStorage.setItem(tokenKey, r.data.token) } catch(_) {}
    let me
    try {
      me = await api('/me')
    } catch (e) {
      try { toast(`Error al consultar perfil: ${e?.message || e}`, 'warn') } catch(_) {}
      me = { ok: false, status: 0, data: {} }
    }
    try { toast(`/me → ${me.status || (me.ok ? 200 : 0)}`, me.ok ? 'success' : 'warn') } catch(_) {}
    const user = (me && me.ok && me.data && typeof me.data === 'object' && me.data.user) ? me.data.user : null
    if (user) {
      try { localStorage.setItem(userEmailKey, user.email || '') } catch (_) {}
      try { currentRole = (user.role || '').toLowerCase(); localStorage.setItem(userRoleKey, currentRole) } catch (_) {}
      say(`Hola ${user.email || ''} ${user.role ? `(rol: ${user.role})` : ''}`)
      updateRoleUI(); startRcAuto(); if (currentRole === 'admin') { await loadAdmin() }
      hideAuth()
    } else {
      // Proceed even if /me fails or returns unexpected shape
      try { toast('Sesión iniciada. No se pudo validar el perfil todavía.', 'warn') } catch(_) {}
      updateRoleUI(); startRcAuto(); hideAuth()
    }
  } else {
    if (r.status === 0) {
      say('No se pudo conectar con la API. Verifica la API Base e internet.')
      try { document.getElementById('apiBaseInput')?.scrollIntoView({ behavior: 'smooth' }) } catch (_) {}
    } else {
      say(`Inicio de sesión fallido: ${r.status} ${(r.data && (r.data.error || r.data.message)) || ''}`)
    }
  }
})
els.authSignupBtn?.addEventListener('click', async () => {
  const email = (els.authEmail?.value || '').trim()
  const password = els.authPassword?.value || ''
  const role = signupRole
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return say('Ingresa un correo válido.')
  if (!password || password.length < 6) return say('La contraseña debe tener al menos 6 caracteres.')
  if (!apiBase) {say('Configura la API Base (IP de tu computadora) en la sección Bienvenido.'); try { document.getElementById('apiBaseInput')?.scrollIntoView({ behavior: 'smooth' }) } catch (_) {} return }
  const r = await api('/auth/register', { method: 'POST', body: { email, password, role } })
  if (r.ok) {
    try { localStorage.setItem(userEmailKey, r.data.email || email) } catch (_) {}
    say('Cuenta creada. Ahora inicia sesión.')
    showAuth('login')
  } else {
    if (r.status === 0) {
      say('No se pudo conectar con la API. Verifica la API Base e internet.')
      try { document.getElementById('apiBaseInput')?.scrollIntoView({ behavior: 'smooth' }) } catch (_) {}
    } else {
      say(`Registro fallido: ${r.status} ${r.data.error || ''}`)
    }
  }
})

// Do not auto-open auth for guests; let Marketing drive conversions
try {
  const token = localStorage.getItem(tokenKey)
  if (!token) {
    // Clear any stale role so marketing is visible on device even after previous sessions
    try { localStorage.removeItem(userRoleKey) } catch (_) {}
  }
} catch (_) {}

// ---------- API Modal wiring ----------
function openApiModal() {
  try {
    if (!els.apiOverlay) return
    if (els.apiModalInput) els.apiModalInput.value = localStorage.getItem('apiBase') || ''
    els.apiOverlay.style.display = 'flex'
    els.apiOverlay.setAttribute('aria-hidden', 'false')
  } catch (_) {}
}
function closeApiModal() {
  if (!els.apiOverlay) return
  els.apiOverlay.style.display = 'none'
  els.apiOverlay.setAttribute('aria-hidden', 'true')
}
els.apiModalSave?.addEventListener('click', () => {
  let raw = (els.apiModalInput?.value || '')
  // Sanitize: normalize Unicode, strip zero-width chars, remove all whitespace, drop trailing slashes
  let v = (raw.normalize ? raw.normalize('NFKC') : raw)
  v = v.replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, '').replace(/\/+$/, '')
  if (!v) { alert('Ingresa una URL válida, p.ej. http://192.168.1.70:4000'); return }
  // If scheme is missing, default to http
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(v)) v = `http://${v}`
  // Validate only URL and protocol
  let parsed; let isValid = false
  try {
    parsed = new URL(v)
    isValid = !!parsed && (parsed.protocol === 'http:' || parsed.protocol === 'https:')
  } catch (_) { isValid = false }
  if (!isValid) { alert('URL inválida para el API Base'); return }

  // Persist normalized value without trailing slash and refresh UI/status
  const saveVal = (parsed?.href || v).replace(/\/+$/, '')
  try { localStorage.setItem('apiBase', saveVal) } catch (_) {}
  apiBase = saveVal
  updateServerStatus().catch(()=>{})
  try { adjustHeaderForApi() } catch (_) {}
  try { closeApiModal() } catch (_) {}
})
els.apiModalClear?.addEventListener('click', () => {
  localStorage.removeItem('apiBase')
  apiBase = ''
  updateServerStatus().catch(()=>{})
  adjustHeaderForApi()
  closeApiModal()
})
els.apiModalClose?.addEventListener('click', () => closeApiModal())
// Fallback: delegate click in case element was not present at parse time
document.addEventListener('click', (e) => {
  const t = e.target
  if (t && t.id === 'serverStatus') openApiModal()
})
// Header button also opens API modal
document.getElementById('apiOpenBtn')?.addEventListener('click', () => openApiModal())
// Add test button to verify connectivity
document.getElementById('apiModalTest')?.addEventListener('click', async () => {
  try {
    const v = (els.apiModalInput?.value || '').trim() || apiBase
    if (!v) { alert('Primero ingresa la URL del API'); return }
    const url = `${v.replace(/\/$/, '')}/health`
    const res = await fetch(url)
    const json = await res.json().catch(()=>({}))
    alert(`GET ${url}\nstatus: ${res.status}\nbody: ${JSON.stringify(json)}`)
  } catch (e) {
    alert(`Error de red: ${(e && e.message) || e}`)
  }
})
// Expose opener for any external trigger if needed
try { window.openApiModal = openApiModal } catch(_) {}

// Global delegated close for any [data-close]
document.addEventListener('click', (e) => {
  try {
    const t = e.target
    const closer = t?.closest?.('[data-close]')
    if (closer) {
      if (els.howOverlay && els.howOverlay.style.display === 'flex') hideHow()
      if (els.apiOverlay && els.apiOverlay.style.display === 'flex') closeApiModal()
      if (els.authOverlay && els.authOverlay.style.display === 'flex') hideAuth()
    }
  } catch(_) {}
})

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
els.howCloseX?.addEventListener('click', () => hideHow())
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

// ---------- API health badge ----------
async function updateServerStatus() {
  try {
    const el = document.getElementById('serverStatus')
    if (!el) return
    if (!apiBase) {
      el.textContent = 'api: configurar'
      el.classList.remove('ok')
      el.classList.add('bad')
      try { el.title = 'apiBase: (no configurado)'; } catch(_) {}
      try { document.getElementById('apiOpenBtn')?.classList.remove('compact') } catch(_) {}
      try { el.style.display = '' } catch(_) {}
      return
    }
    el.textContent = 'api: comprobando…'
    el.classList.remove('ok', 'bad')
    try { el.title = `apiBase: ${apiBase}` } catch(_) {}
    const tryCheckPath = async (p) => {
      const r = await api(p)
      if (r.ok && r.data && (r.data.ok || r.status === 200)) return { ok: true }
      return { ok: false, status: r.status }
    }
    let res = await tryCheckPath('/healthz')
    if (!res.ok) {
      await new Promise(r => setTimeout(r, 500))
      res = await tryCheckPath('/healthz')
    }
    if (!res.ok) {
      await new Promise(r => setTimeout(r, 200))
      res = await tryCheckPath('/health')
      if (!res.ok) {
        await new Promise(r => setTimeout(r, 500))
        res = await tryCheckPath('/health')
      }
    }
    if (res.ok) {
      el.textContent = 'api: en línea'
      el.classList.add('ok')
    } else if (res.status === 0) {
      el.textContent = 'api: sin conexión'
      el.classList.add('bad')
    } else {
      el.textContent = `api: error ${res.status}`
      el.classList.add('bad')
    }
    adjustHeaderForApi()
  } catch (_) {
    const el = document.getElementById('serverStatus')
    if (el) { el.textContent = 'api: sin conexión'; el.classList.add('bad') }
  }
}
updateServerStatus()
try { setInterval(() => { try { updateServerStatus() } catch(_) {} }, 5000) } catch(_) {}

function log(msg) {
  els.log.textContent += `\n${msg}`
}

function say(msg) {
  const p = document.createElement('p')
  p.textContent = msg
  els.chat.appendChild(p)
}

// Lightweight toast helper (non-blocking notifications)
function toast(message, type = 'info') {
  try {
    let host = document.getElementById('toastHost')
    if (!host) {
      host = document.createElement('div')
      host.id = 'toastHost'
      host.style.position = 'fixed'
      host.style.right = '16px'
      host.style.bottom = '16px'
      host.style.zIndex = '2000'
      host.style.display = 'flex'
      host.style.flexDirection = 'column'
      host.style.gap = '8px'
      document.body.appendChild(host)
    }
    const t = document.createElement('div')
    t.textContent = message
    t.style.padding = '10px 12px'
    t.style.borderRadius = '10px'
    t.style.fontSize = '14px'
    t.style.boxShadow = '0 8px 24px rgba(0,0,0,0.35)'
    t.style.color = '#0b1220'
    // color by type
    if (type === 'success') { t.style.background = '#a7f3d0' } // green-200
    else if (type === 'error') { t.style.background = '#fecaca' } // red-200
    else if (type === 'warn') { t.style.background = '#fde68a' } // amber-300
    else { t.style.background = '#bfdbfe' } // blue-200
    host.appendChild(t)
    setTimeout(() => { try { host.removeChild(t) } catch(_) {} }, 2800)
  } catch(_) {}
}

// ---------- Story 2.2 state ----------
let selectedRestaurant = null
let cart = [] // [{ restaurantId, itemId, name, priceCents, qty }]
let lastMenuItems = []
// If there is no token, treat as guest regardless of any stored role
let currentRole = ''
try {
  const hasToken = !!localStorage.getItem(tokenKey)
  currentRole = (hasToken && apiBase) ? (localStorage.getItem(userRoleKey) || '').toLowerCase() : ''
} catch (_) { currentRole = '' }

function isStaff() {
  return currentRole === 'staff' || currentRole === 'admin'
}

function isAdmin() {
  return currentRole === 'admin'
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

    // Restaurant Console (admin only)
    const rcSection = document.getElementById('rcSection')
    if (rcSection) {
      rcSection.style.display = isAdmin() ? '' : 'none'
    }

    // Marketing (guest + client only)
    const marketing = document.getElementById('marketingSection')
    if (marketing) {
      const showMk = !currentRole || currentRole === 'client'
      marketing.style.display = showMk ? '' : 'none'
    }

    // Welcome + Debug visibility (hide for guests/clients for a pure marketing landing)
    const welcome = document.getElementById('welcomeSection')
    const debug = document.getElementById('debugSection')
    const isOperationalRole = currentRole === 'staff' || currentRole === 'admin' || currentRole === 'delivery'
    if (welcome) welcome.style.display = isOperationalRole ? '' : 'none'
    if (debug) debug.style.display = isOperationalRole ? '' : 'none'

    // Install section visibility: only show on web (not Capacitor/native), not already installed, and only AFTER login (client role)
    updateInstallVisibility()

    const rcRestaurantEl = document.getElementById('rcRestaurant')
    const loadBtn = document.getElementById('rcLoadOrdersBtn')
    const rcHint = document.getElementById('rcHint')
    const badge = els.roleBadge
    const roleText = currentRole || 'invitado'
    if (badge) badge.textContent = `rol: ${roleText}`
    if (loadBtn) {
      loadBtn.disabled = !isAdmin()
      loadBtn.title = isAdmin() ? '' : 'La Consola del restaurante está disponible solo para administradores.'
    }
    if (rcRestaurantEl) {
      rcRestaurantEl.disabled = !isAdmin()
      rcRestaurantEl.title = isAdmin() ? '' : 'Inicia sesión como administrador para seleccionar un restaurante.'
    }
    if (rc.statusFilter) {
      rc.statusFilter.disabled = !isAdmin()
      rc.statusFilter.title = isAdmin() ? '' : 'Inicia sesión como administrador para filtrar pedidos.'
    }
    if (rc.autoRefresh) {
      rc.autoRefresh.disabled = !isAdmin()
      rc.autoRefresh.title = isAdmin() ? '' : 'Inicia sesión como administrador para habilitar auto-actualización.'
      if (!isAdmin()) {
        rc.autoRefresh.checked = false
        stopRcAuto()
      }
    }
    if (rcHint) rcHint.style.display = isAdmin() ? 'none' : ''
  } catch (_) {}
}

function isNativeApp() {
  try { return !!window.Capacitor } catch (_) { return false }
}

function isPwaStandalone() {
  try { return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true } catch (_) { return false }
}

function updateInstallVisibility() {
  const el = document.getElementById('installSection')
  if (!el) return
  const loggedIn = !!localStorage.getItem(tokenKey)
  const installed = isNativeApp() || isPwaStandalone()
  const show = loggedIn && currentRole === 'client' && !installed
  el.style.display = show ? '' : 'none'
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

function renderRestaurants(rows = []) {
  els.restaurantsList.className = 'list'
  els.restaurantsList.innerHTML = ''
  rows.forEach(r => {
    const li = document.createElement('li')
    li.className = 'mb-2'
    const card = document.createElement('div')
    card.className = 'flex items-center justify-between gap-3 bg-surface border border-border rounded-xl p-3 shadow-card'
    const info = document.createElement('div')
    const title = document.createElement('div')
    title.className = 'font-semibold text-text-primary'
    title.textContent = r.name
    const addr = document.createElement('div')
    addr.className = 'text-sm text-text-secondary'
    addr.textContent = r.address || ''
    info.appendChild(title)
    info.appendChild(addr)
    const btn = document.createElement('button')
    btn.className = 'bg-primary text-white px-4 py-2 rounded-lg shadow-md'
    btn.textContent = 'Ver menú'
    btn.addEventListener('click', () => selectRestaurant(r))
    card.appendChild(info)
    card.appendChild(btn)
    li.appendChild(card)
    els.restaurantsList.appendChild(li)
  })
}

function rcSetLoading(loading) {
  const list = document.getElementById('rcOrdersList')
  if (!list) return
  list.innerHTML = ''
  if (loading) {
    for (let i = 0; i < 3; i++) {
      const li = document.createElement('li')
      const card = document.createElement('div')
      card.className = 'item-card'
      const left = document.createElement('div')
      left.className = 'muted'
      left.textContent = 'Cargando…'
      card.appendChild(left)
      li.appendChild(card)
      list.appendChild(li)
    }
  }
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
  els.menuList.className = 'list'
  els.menuList.innerHTML = ''
  lastMenuItems = items
  items.forEach(it => {
    const li = document.createElement('li')
    li.className = 'mb-2'
    const card = document.createElement('div')
    card.className = 'flex items-center justify-between gap-3 bg-surface border border-border rounded-xl p-3 shadow-card'
    const info = document.createElement('div')
    const title = document.createElement('div')
    title.className = 'font-medium text-text-primary'
    title.textContent = it.name
    const price = document.createElement('div')
    price.className = 'text-sm font-semibold text-text-primary'
    price.textContent = formatPrice(it.priceCents)
    info.appendChild(title)
    info.appendChild(price)
    const add = document.createElement('button')
    add.className = 'bg-primary text-white px-4 py-2 rounded-lg shadow-md'
    add.textContent = 'Agregar'
    add.addEventListener('click', () => addToCart(it))
    card.appendChild(info)
    card.appendChild(add)
    li.appendChild(card)
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
    li.className = 'mb-2'
    const card = document.createElement('div')
    card.className = 'flex items-center justify-between gap-3 bg-surface border border-border rounded-xl p-3 shadow-card'
    const info = document.createElement('div')
    const title = document.createElement('div')
    title.className = 'font-medium text-text-primary'
    title.textContent = `${c.qty}× ${c.name}`
    const price = document.createElement('div')
    price.className = 'text-sm font-semibold text-text-primary'
    price.textContent = formatPrice(c.priceCents * c.qty)
    info.appendChild(title)
    info.appendChild(price)
    const remove = document.createElement('button')
    remove.className = 'bg-primary text-white px-3 py-2 rounded-lg shadow-md'
    remove.textContent = 'Quitar'
    remove.addEventListener('click', () => {
      cart = cart.filter(x => !(x.restaurantId === c.restaurantId && x.itemId === c.itemId))
      renderCart()
    })
    card.appendChild(info)
    card.appendChild(remove)
    li.appendChild(card)
    els.cartList.appendChild(li)
    total += (c.priceCents || 0) * (c.qty || 0)
  })
  els.cartTotal.textContent = formatPrice(total)
}

els.clearCartBtn?.addEventListener('click', () => {
  cart = []
  renderCart()
})

els.reviewOrderBtn?.addEventListener('click', () => {
  say('Revisando pedido...')
})

els.placeOrderBtn?.addEventListener('click', async () => {
  if (!selectedRestaurant) return say('Selecciona un restaurante primero')
  if (cart.length === 0) return say('Tu carrito está vacío.')
  const payload = {
    restaurantId: selectedRestaurant.id,
    items: cart.map(c => ({ itemId: c.itemId, name: c.name, priceCents: c.priceCents, qty: c.qty }))
  }
  try {
    const r = await api('/orders', { method: 'POST', body: payload })
    if (!r.ok) return say(`No se pudo crear el pedido (${r.status})`)
    say(`Pedido creado (#${r.data.id || '—'})`)
    cart = []
    renderCart()
    await refreshOrders()
  } catch (e) {
    say(`Error creando pedido: ${e?.message || e}`)
  }
})

els.loadRestaurantsBtn?.addEventListener('click', async () => {
  await loadRestaurants()
})

async function loadRestaurants() {
  try {
    const r = await api('/restaurants')
    if (!r.ok) return say(`No se pudo cargar restaurantes (${r.status})`)
    renderRestaurants(r.data.restaurants || [])
    // Populate RC restaurant selector if present
    const rcRestaurantEl = document.getElementById('rcRestaurant')
    if (rcRestaurantEl) {
      rcRestaurantEl.innerHTML = ''
      ;(r.data.restaurants || []).forEach(rr => {
        const opt = document.createElement('option')
        opt.value = rr.id
        opt.textContent = rr.name
        rcRestaurantEl.appendChild(opt)
      })
    }
  } catch (e) {
    say(`Error cargando restaurantes: ${e?.message || e}`)
  }
}

els.refreshOrdersBtn?.addEventListener('click', async () => {
  await refreshOrders()
})

async function refreshOrders() {
  try {
    const r = await api('/orders')
    if (!r.ok) return say(`No se pudieron cargar pedidos (${r.status})`)
    renderOrders(r.data.orders || [])
  } catch (e) {
    say(`Error cargando pedidos: ${e?.message || e}`)
  }
}

function renderOrders(orders = []) {
  els.ordersList.innerHTML = ''
  orders.forEach(o => {
    const li = document.createElement('li')
    li.className = 'mb-2'
    const card = document.createElement('div')
    card.className = 'flex items-center justify-between gap-3 bg-surface border border-border rounded-xl p-3 shadow-card'
    const info = document.createElement('div')
    const title = document.createElement('div')
    title.className = 'font-medium text-text-primary'
    title.textContent = `#${o.id} — ${o.restaurantName || ''}`
    const meta = document.createElement('div')
    meta.className = 'text-sm text-text-secondary'
    meta.textContent = `Estatus: ${o.status} — Pago: ${o.paymentStatus}`
    info.appendChild(title)
    info.appendChild(meta)
    const see = document.createElement('button')
    see.className = 'bg-primary text-white px-3 py-2 rounded-lg shadow-md'
    see.textContent = 'Ver'
    see.addEventListener('click', () => say(`Pedido #${o.id} — ${o.status}`))
    card.appendChild(info)
    card.appendChild(see)
    li.appendChild(card)
    els.ordersList.appendChild(li)
  })
}

// ---------- Restaurant Console (Admin) ----------
const rc = {
  list: document.getElementById('rcOrdersList'),
  statusFilter: document.getElementById('rcStatusFilter'),
  autoRefresh: document.getElementById('rcAutoRefresh'),
  interval: null
}

document.getElementById('rcLoadOrdersBtn')?.addEventListener('click', async () => {
  const rSel = document.getElementById('rcRestaurant')
  const rid = rSel?.value
  if (!rid) return say('Selecciona un restaurante para la consola.')
  await rcLoadOrders(rid)
})

rc.statusFilter?.addEventListener('change', () => {
  const rSel = document.getElementById('rcRestaurant')
  const rid = rSel?.value
  if (!rid) return
  rcLoadOrders(rid)
})

rc.autoRefresh?.addEventListener('change', () => {
  if (rc.autoRefresh.checked) startRcAuto()
  else stopRcAuto()
})

async function rcLoadOrders(restaurantId) {
  rcSetLoading(true)
  try {
    const r = await api(`/orders?restaurantId=${encodeURIComponent(restaurantId)}`)
    if (!r.ok) { say(`No se pudieron cargar pedidos (${r.status})`); rcSetLoading(false); return }
    let rows = r.data.orders || []
    const f = rc.statusFilter?.value || 'all'
    if (f && f !== 'all') rows = rows.filter(x => (x.status || '') === f)
    renderRcOrders(rows)
  } catch (e) {
    say(`Error consola restaurante: ${e?.message || e}`)
  } finally {
    rcSetLoading(false)
  }
}

function renderRcOrders(rows = []) {
  if (!rc.list) return
  rc.list.innerHTML = ''
  rows.forEach(o => {
    const li = document.createElement('li')
    li.className = 'mb-2'
    const card = document.createElement('div')
    card.className = 'flex items-center justify-between gap-3 bg-surface border border-border rounded-xl p-3 shadow-card'
    const info = document.createElement('div')
    const title = document.createElement('div')
    title.className = 'font-medium text-text-primary'
    title.textContent = `#${o.id} — ${o.customer || ''}`
    const meta = document.createElement('div')
    meta.className = 'text-sm text-text-secondary'
    meta.textContent = `Estatus: ${o.status} — Pago: ${o.paymentStatus}`
    info.appendChild(title)
    info.appendChild(meta)

    const actions = document.createElement('div')
    actions.className = 'flex items-center gap-2'
    ;['Accepted','Preparing','ReadyForPickup'].forEach(st => {
      const b = document.createElement('button')
      b.className = 'bg-primary text-white px-3 py-2 rounded-lg shadow-md'
      b.textContent = st
      b.addEventListener('click', async () => {
        try {
          const r = await api(`/orders/${o.id}/status`, { method: 'POST', body: { status: st } })
          if (!r.ok) return say(`No se pudo actualizar (${r.status})`)
          await rcLoadOrders(document.getElementById('rcRestaurant')?.value)
        } catch (e) {
          say(`Error actualizando: ${e?.message || e}`)
        }
      })
      actions.appendChild(b)
    })

    card.appendChild(info)
    card.appendChild(actions)
    li.appendChild(card)
    rc.list.appendChild(li)
  })
}

function startRcAuto() {
  if (rc.interval) return
  try {
    rc.interval = setInterval(() => {
      const rid = document.getElementById('rcRestaurant')?.value
      if (rid) rcLoadOrders(rid)
    }, 5000)
  } catch (_) {}
}

function stopRcAuto() {
  try {
    clearInterval(rc.interval)
  } catch (_) {}
  rc.interval = null
}

// ---------- Delivery (dev/demo) ----------
let delSse = null
let delUnread = 0
function updateDeliveryBadge() {
  const b = document.getElementById('delBell')
  if (b) b.textContent = String(delUnread || 0)
}
async function loadDeliveryAssignments() {
  try {
    const r = await api('/delivery/assignments')
    if (!r.ok) return
    const list = document.getElementById('delAssignments')
    if (!list) return
    list.innerHTML = ''
    ;(r.data.assignments || []).forEach(a => {
      const li = document.createElement('li')
      const row = document.createElement('div')
      row.className = 'flex items-center justify-between gap-3 bg-surface border border-border rounded-xl p-3 shadow-card'
      const info = document.createElement('div')
      const title = document.createElement('div')
      title.className = 'font-medium text-text-primary'
      title.textContent = `Asignación #${a.id} — Pedido #${a.orderId}`
      const meta = document.createElement('div')
      meta.className = 'text-sm text-text-secondary'
      meta.textContent = `Estatus: ${a.status}`
      info.appendChild(title)
      info.appendChild(meta)
      const actions = document.createElement('div')
      actions.className = 'flex items-center gap-2'
      const btn = document.createElement('button')
      btn.className = 'bg-primary text-white px-3 py-2 rounded-lg shadow-md'
      btn.textContent = 'Ver'
      btn.addEventListener('click', () => say(`Asignación #${a.id} — ${a.status}`))
      actions.appendChild(btn)
      row.appendChild(info)
      row.appendChild(actions)
      li.appendChild(row)
      list.appendChild(li)
    })
  } catch (_) {}
}
function startDeliverySse() {
  stopDeliverySse()
  const token = localStorage.getItem(tokenKey)
  if (!token || !apiBase) return
  const url = `${apiBase}/delivery/events?token=${encodeURIComponent(token)}`
  delSse = new EventSource(url)
  delSse.onmessage = (ev) => {
    try {
      const evt = JSON.parse(ev.data)
      delUnread += 1
      updateDeliveryBadge()
      say(`[DELIVERY] ${evt.message || evt.type}`)
      const list = document.getElementById('delNotifications')
      if (list) {
        const li = document.createElement('li')
        li.textContent = `${new Date(evt.ts || Date.now()).toLocaleTimeString()} — ${evt.type}: ${evt.message || evt.type}`
        list.prepend(li)
      }
      if (evt.type === 'assignment_created') loadDeliveryAssignments().catch(()=>{})
    } catch (_) {}
  }
  delSse.addEventListener('ping', () => {})
  delSse.onerror = () => { setTimeout(() => startDeliverySse(), 3000) }
}
function stopDeliverySse() {
  if (delSse) { try { delSse.close() } catch (_) {} delSse = null }
}

// ---------- Tracking (SSE) ----------
let es = null
let trackingId = null
let map = null
let mapMarker = null

function trackOrder(orderId) {
  stopTracking()
  if (!apiBase) return say('API base no configurado')
  trackingId = orderId
  els.trackingOrder.textContent = `#${orderId}`
  els.trackingStatus.textContent = 'Conectando...'
  els.trackingCoords.textContent = ''
  ensureMap()
  const token = localStorage.getItem(tokenKey