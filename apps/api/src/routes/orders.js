import express from 'express'

import { createOrder, listOrders, getOrderById, updateOrderStatus, getAssignmentForOrder } from '../db/adapter.js'
import { emitAdminEvent, emitPartnerEvent } from '../lib/events.js'
import { authGuard, requireRole } from '../lib/auth.js'

export const ordersRouter = express.Router()

// POST /orders - create order
ordersRouter.post('/', async (req, res) => {
  try {
    const { restaurantId, items } = req.body || {}
    if (!restaurantId || !Array.isArray(items)) return res.status(400).json({ error: 'restaurantId and items required' })
    const order = await createOrder({ restaurantId, items })
    // Notify admins
    emitAdminEvent({ type: 'new_order', orderId: order.id, restaurantId: order.restaurantId, message: 'New order created' })
    res.status(201).json({ order })
  } catch (e) {
    res.status(400).json({ error: e.message || 'Create failed' })
  }
})

// GET /orders - list
ordersRouter.get('/', async (req, res) => {
  const rows = await listOrders()
  const rid = req.query.restaurantId ? Number(req.query.restaurantId) : null
  const filtered = rid ? rows.filter(o => o.restaurantId === rid) : rows
  res.json({ orders: filtered })
})

// GET /orders/:id - detail
ordersRouter.get('/:id', async (req, res) => {
  const o = await getOrderById(req.params.id)
  if (!o) return res.status(404).json({ error: 'Not found' })
  res.json({ order: o })
})

// POST /orders/:id/status - transition
ordersRouter.post('/:id/status', authGuard, requireRole(['staff', 'admin']), async (req, res) => {
  try {
    const { next } = req.body || {}
    if (!next) return res.status(400).json({ error: 'next required' })
    const o = await updateOrderStatus(req.params.id, next)
    emitAdminEvent({ type: 'order_status_changed', orderId: o.id, restaurantId: o.restaurantId, message: `Order #${o.id} -> ${o.status}` })
    // Notify assigned delivery partner about the status change (Accepted/Preparing/ReadyForPickup)
    try {
      const a = await getAssignmentForOrder(o.id)
      if (a && a.partnerId) {
        emitPartnerEvent(a.partnerId, { type: 'order_status', orderId: o.id, status: o.status, message: `Order #${o.id} status: ${o.status}` })
      }
    } catch (_) {}
    res.json({ order: o })
  } catch (e) {
    if (e && e.code === 'INVALID_TRANSITION') return res.status(409).json({ error: e.message })
    if (String(e.message || '').includes('Not found')) return res.status(404).json({ error: 'Not found' })
    res.status(400).json({ error: e.message || 'Update failed' })
  }
})
