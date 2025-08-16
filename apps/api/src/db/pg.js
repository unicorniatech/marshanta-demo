// Postgres DB driver for Sprint 2
// Uses env DATABASE_URL and implements the neutral adapter interface
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function q(text, params = []) {
  const client = await pool.connect()
  try {
    const res = await client.query(text, params)
    return res
  } finally {
    client.release()
  }
}

// Users
export async function createUser({ email, passwordHash, name, phone, role = 'client' }) {
  const sql = `INSERT INTO users (email, password_hash, name, phone, role)
               VALUES ($1, $2, $3, $4, $5)
               RETURNING id, email, name, phone, role`
  const { rows } = await q(sql, [email, passwordHash, name || null, phone || null, role])
  return rows[0]
}

export async function findUserByEmail(email) {
  const { rows } = await q('SELECT id, email, password_hash, name, phone, role FROM users WHERE LOWER(email)=LOWER($1) LIMIT 1', [email])
  if (!rows.length) return null
  const { password_hash, ...rest } = rows[0]
  return { ...rest, passwordHash: password_hash }
}

// Restaurants
export async function createRestaurant({ name, address, phone }) {
  const { rows } = await q('INSERT INTO restaurants (name, address, phone) VALUES ($1,$2,$3) RETURNING id, name, address, phone', [name, address || null, phone || null])
  return rows[0]
}

export async function listRestaurants() {
  const { rows } = await q('SELECT id, name, address, phone FROM restaurants ORDER BY id')
  return rows
}

export async function getRestaurantById(id) {
  const { rows } = await q('SELECT id, name, address, phone FROM restaurants WHERE id=$1', [id])
  return rows[0] || null
}

export async function listMenuItems(restaurantId) {
  const { rows } = await q('SELECT id, name, price_cents FROM menu_items WHERE restaurant_id=$1 ORDER BY id', [restaurantId])
  return rows.map(r => ({ id: r.id, name: r.name, priceCents: Number(r.price_cents) }))
}

// Delivery partners
export async function createDeliveryPartner({ name, phone, vehicleType }) {
  const { rows } = await q('INSERT INTO delivery_partners (name, phone, vehicle_type) VALUES ($1,$2,$3) RETURNING id, name, phone, vehicle_type', [name || null, phone || null, vehicleType || 'other'])
  const r = rows[0]
  return { id: r.id, name: r.name, phone: r.phone, vehicleType: r.vehicle_type }
}

export async function listDeliveryPartners() {
  const { rows } = await q('SELECT id, name, phone, vehicle_type FROM delivery_partners ORDER BY id')
  return rows.map(r => ({ id: r.id, name: r.name, phone: r.phone, vehicleType: r.vehicle_type }))
}

// Orders
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
  const r = await getRestaurantById(restaurantId)
  if (!r) throw new Error('Invalid restaurant')
  const normalized = (items || []).map(it => ({
    itemId: Number(it.itemId) || 0,
    name: String(it.name || ''),
    priceCents: Number(it.priceCents) || 0,
    qty: Number(it.qty) || 1
  })).filter(it => it.qty > 0)
  if (!normalized.length) throw new Error('No items')

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      'INSERT INTO orders (restaurant_id, status, payment_status) VALUES ($1,$2,$3) RETURNING id, restaurant_id, status, payment_status, created_at',
      [Number(restaurantId), OrderStatus.Submitted, 'Unpaid']
    )
    const order = rows[0]
    for (const it of normalized) {
      await client.query(
        'INSERT INTO order_items (order_id, item_id, name, price_cents, qty) VALUES ($1,$2,$3,$4,$5)',
        [order.id, it.itemId, it.name, it.priceCents, it.qty]
      )
    }
    await client.query('COMMIT')
    return { id: order.id, restaurantId: order.restaurant_id, items: normalized, status: order.status, paymentStatus: order.payment_status, createdAt: new Date(order.created_at).getTime() }
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

export async function listOrders() {
  const { rows } = await q('SELECT id, restaurant_id, status, payment_status, created_at FROM orders ORDER BY id DESC')
  const orders = []
  for (const o of rows) {
    const items = await q('SELECT item_id, name, price_cents, qty FROM order_items WHERE order_id=$1 ORDER BY id', [o.id])
    orders.push({
      id: o.id,
      restaurantId: o.restaurant_id,
      items: items.rows.map(i => ({ itemId: i.item_id, name: i.name, priceCents: Number(i.price_cents), qty: Number(i.qty) })),
      status: o.status,
      paymentStatus: o.payment_status,
      createdAt: new Date(o.created_at).getTime()
    })
  }
  return orders
}

export async function getOrderById(id) {
  const { rows } = await q('SELECT id, restaurant_id, status, payment_status, created_at FROM orders WHERE id=$1', [id])
  if (!rows.length) return null
  const o = rows[0]
  const items = await q('SELECT item_id, name, price_cents, qty FROM order_items WHERE order_id=$1 ORDER BY id', [o.id])
  return {
    id: o.id,
    restaurantId: o.restaurant_id,
    items: items.rows.map(i => ({ itemId: i.item_id, name: i.name, priceCents: Number(i.price_cents), qty: Number(i.qty) })),
    status: o.status,
    paymentStatus: o.payment_status,
    createdAt: new Date(o.created_at).getTime()
  }
}

export async function updateOrderStatus(id, next) {
  const cur = await getOrderById(id)
  if (!cur) throw new Error('Not found')
  const allowed = allowedTransitions[cur.status] || []
  if (!allowed.includes(next)) {
    const err = new Error('Invalid status transition')
    err.code = 'INVALID_TRANSITION'
    throw err
  }
  const { rows } = await q('UPDATE orders SET status=$2 WHERE id=$1 RETURNING id, restaurant_id, status, payment_status, created_at', [id, next])
  const o = rows[0]
  const items = await q('SELECT item_id, name, price_cents, qty FROM order_items WHERE order_id=$1 ORDER BY id', [o.id])
  return {
    id: o.id,
    restaurantId: o.restaurant_id,
    items: items.rows.map(i => ({ itemId: i.item_id, name: i.name, priceCents: Number(i.price_cents), qty: Number(i.qty) })),
    status: o.status,
    paymentStatus: o.payment_status,
    createdAt: new Date(o.created_at).getTime()
  }
}

export async function updateOrderPaymentStatus(id, paymentStatus) {
  const { rows } = await q('UPDATE orders SET payment_status=$2 WHERE id=$1 RETURNING id, restaurant_id, status, payment_status, created_at', [id, paymentStatus])
  if (!rows.length) throw new Error('Not found')
  const o = rows[0]
  const items = await q('SELECT item_id, name, price_cents, qty FROM order_items WHERE order_id=$1 ORDER BY id', [o.id])
  return {
    id: o.id,
    restaurantId: o.restaurant_id,
    items: items.rows.map(i => ({ itemId: i.item_id, name: i.name, priceCents: Number(i.price_cents), qty: Number(i.qty) })),
    status: o.status,
    paymentStatus: o.payment_status,
    createdAt: new Date(o.created_at).getTime()
  }
}
