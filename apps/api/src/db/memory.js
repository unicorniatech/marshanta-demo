// In-memory DB driver for Sprint 1
// Provides minimal persistence for auth, restaurants, menus, and listing

let userId = 1
let restaurantId = 1
let deliveryPartnerId = 1
let orderId = 1

const users = [] // { id, email, passwordHash, name, phone, role }
const restaurants = [] // { id, name, address, phone }
const menus = new Map() // restaurantId -> [{ id, name, priceCents }]
const deliveryPartners = [] // { id, name, phone, vehicleType }
const orders = [] // { id, restaurantId, items: [{ itemId, name, priceCents, qty }], status, paymentStatus, createdAt }
const paymentReceipts = [] // { id, orderId, provider, amountCents, currency, raw }
const processedPaymentEvents = new Set() // eventId strings

export async function createUser({ email, passwordHash, name, phone, role = 'client' }) {
  const existing = users.find(u => u.email.toLowerCase() === String(email).toLowerCase())
  if (existing) throw Object.assign(new Error('Email already exists'), { code: 'UNIQUE_VIOLATION' })
  const user = { id: userId++, email, passwordHash, name, phone, role }
  users.push(user)
  return { ...user }
}

export async function findUserByEmail(email) {
  const u = users.find(u => u.email.toLowerCase() === String(email).toLowerCase())
  return u ? { ...u } : null
}

export async function createRestaurant({ name, address, phone }) {
  const r = { id: restaurantId++, name, address, phone }
  restaurants.push(r)
  if (!menus.has(r.id)) menus.set(r.id, [])
  return { ...r }
}

export async function listRestaurants() {
  return restaurants.map(r => ({ ...r }))
}

export async function getRestaurantById(id) {
  const r = restaurants.find(r => r.id === Number(id))
  return r ? { ...r } : null
}

export async function listMenuItems(restaurantId) {
  const items = menus.get(Number(restaurantId)) || []
  return items.map(it => ({ ...it }))
}

export async function createDeliveryPartner({ name, phone, vehicleType }) {
  const d = { id: deliveryPartnerId++, name, phone, vehicleType }
  deliveryPartners.push(d)
  return { ...d }
}

export async function listDeliveryPartners() {
  return deliveryPartners.map(d => ({ ...d }))
}

// ----- Orders (Story 3.1) -----
const OrderStatus = {
  Submitted: 'Submitted',
  Accepted: 'Accepted',
  Preparing: 'Preparing',
  ReadyForPickup: 'ReadyForPickup'
}

const allowedTransitions = {
  [OrderStatus.Submitted]: [OrderStatus.Accepted],
  [OrderStatus.Accepted]: [OrderStatus.Preparing],
  [OrderStatus.Preparing]: [OrderStatus.ReadyForPickup],
  [OrderStatus.ReadyForPickup]: []
}

export async function createOrder({ restaurantId, items }) {
  const r = restaurants.find(r => r.id === Number(restaurantId))
  if (!r) throw new Error('Invalid restaurant')
  const normalized = (items || []).map(it => ({
    itemId: Number(it.itemId) || 0,
    name: String(it.name || ''),
    priceCents: Number(it.priceCents) || 0,
    qty: Number(it.qty) || 1
  })).filter(it => it.qty > 0)
  if (!normalized.length) throw new Error('No items')
  const o = { id: orderId++, restaurantId: r.id, items: normalized, status: OrderStatus.Submitted, paymentStatus: 'Unpaid', createdAt: Date.now() }
  orders.push(o)
  return { ...o }
}

export async function listOrders() {
  return orders.map(o => ({ ...o, items: o.items.map(i => ({ ...i })) }))
}

export async function getOrderById(id) {
  const o = orders.find(o => o.id === Number(id))
  return o ? { ...o, items: o.items.map(i => ({ ...i })) } : null
}

export async function updateOrderStatus(id, next) {
  const o = orders.find(o => o.id === Number(id))
  if (!o) throw new Error('Not found')
  const allowed = allowedTransitions[o.status] || []
  if (!allowed.includes(next)) {
    const err = new Error('Invalid status transition')
    err.code = 'INVALID_TRANSITION'
    throw err
  }
  o.status = next
  return { ...o, items: o.items.map(i => ({ ...i })) }
}

export async function updateOrderPaymentStatus(id, paymentStatus) {
  const o = orders.find(o => o.id === Number(id))
  if (!o) throw new Error('Not found')
  o.paymentStatus = paymentStatus
  return { ...o, items: o.items.map(i => ({ ...i })) }
}

// ---- Payments persistence (Story 2.4) ----
export async function savePaymentReceipt({ orderId, provider, amountCents, currency, raw }) {
  const id = paymentReceipts.length + 1
  const rec = { id, orderId: Number(orderId), provider: String(provider), amountCents: Number(amountCents) || 0, currency: String(currency || 'USD'), raw: raw ? JSON.parse(JSON.stringify(raw)) : null }
  paymentReceipts.push(rec)
  return { ...rec }
}

export async function hasProcessedPaymentEvent(eventId) {
  return processedPaymentEvents.has(String(eventId))
}

export async function markPaymentEventProcessed(eventId) {
  processedPaymentEvents.add(String(eventId))
  return true
}

// Seed minimal data for Story 2.2
;(function seed() {
  if (restaurants.length > 0) return
  const r1 = { id: restaurantId++, name: 'Taquería El Sol', address: 'Calle 5 #123, Cuernavaca', phone: '+52 777 123 4567' }
  const r2 = { id: restaurantId++, name: 'Pizzería La Nonna', address: 'Av. Morelos 456, Jiutepec', phone: '+52 777 987 6543' }
  restaurants.push(r1, r2)
  menus.set(r1.id, [
    { id: 1, name: 'Taco al Pastor', priceCents: 2000 },
    { id: 2, name: 'Quesadilla de Queso', priceCents: 1500 },
    { id: 3, name: 'Agua de Horchata', priceCents: 1200 }
  ])
  menus.set(r2.id, [
    { id: 1, name: 'Pizza Margarita (Individual)', priceCents: 9500 },
    { id: 2, name: 'Refresco', priceCents: 1800 }
  ])
})()
