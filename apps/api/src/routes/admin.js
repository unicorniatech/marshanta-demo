import { Router } from 'express'
import { authGuard, requireRole, decodeToken, isBlacklisted } from '../lib/auth.js'
import { getAdminMetrics, listUsers, listRestaurants, listOrders, createDeliveryAssignment, listDeliveryPartners, createDeliveryPartner, updateDeliveryPartner } from '../db/adapter.js'
import { onAdminEvent, emitPartnerEvent, emitAdminEvent } from '../lib/events.js'

export const adminRouter = Router()

adminRouter.get('/metrics', authGuard, requireRole(['admin']), async (req, res) => {
  try {
    const m = await getAdminMetrics()
    res.json({ metrics: m })
  } catch (e) {
    res.status(500).json({ error: 'Failed to load metrics' })
  }
})

adminRouter.get('/users', authGuard, requireRole(['admin']), async (req, res) => {
  try {
    const users = await listUsers()
    res.json({ users })
  } catch (e) {
    res.status(500).json({ error: 'Failed to load users' })
  }
})

adminRouter.get('/restaurants', authGuard, requireRole(['admin']), async (req, res) => {
  try {
    const restaurants = await listRestaurants()
    res.json({ restaurants })
  } catch (e) {
    res.status(500).json({ error: 'Failed to load restaurants' })
  }
})

adminRouter.get('/orders', authGuard, requireRole(['admin']), async (req, res) => {
  try {
    const orders = await listOrders()
    res.json({ orders })
  } catch (e) {
    res.status(500).json({ error: 'Failed to load orders' })
  }
})

// List delivery partners (for assignment UI)
adminRouter.get('/delivery-partners', authGuard, requireRole(['admin']), async (req, res) => {
  try {
    const rows = await listDeliveryPartners()
    res.json({ partners: rows })
  } catch (e) {
    res.status(500).json({ error: 'Failed to load partners' })
  }
})

// Create delivery partner
adminRouter.post('/delivery-partners', authGuard, requireRole(['admin']), async (req, res) => {
  try {
    const { name, phone, vehicleType } = req.body || {}
    const p = await createDeliveryPartner({ name, phone, vehicleType })
    res.status(201).json({ partner: p })
  } catch (e) {
    res.status(400).json({ error: e.message || 'Failed to create partner' })
  }
})

// Update delivery partner
adminRouter.patch('/delivery-partners/:id', authGuard, requireRole(['admin']), async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { name, phone, vehicleType } = req.body || {}
    const p = await updateDeliveryPartner(id, { name, phone, vehicleType })
    if (!p) return res.status(404).json({ error: 'Not found' })
    res.json({ partner: p })
  } catch (e) {
    res.status(400).json({ error: e.message || 'Failed to update partner' })
  }
})

// Assign an order to a delivery partner
adminRouter.post('/assignments', authGuard, requireRole(['admin']), async (req, res) => {
  try {
    const { orderId, partnerId } = req.body || {}
    if (!orderId || !partnerId) return res.status(400).json({ error: 'orderId and partnerId required' })
    const a = await createDeliveryAssignment({ orderId, partnerId })
    // Notify specific partner and admins
    try { emitPartnerEvent(partnerId, { type: 'assignment_created', orderId, message: `New assignment for order #${orderId}` }) } catch (_) {}
    try { emitAdminEvent({ type: 'assignment_created', orderId, message: `Assigned order #${orderId} to partner #${partnerId}` }) } catch (_) {}
    res.status(201).json({ assignment: a })
  } catch (e) {
    res.status(400).json({ error: e.message || 'Failed to assign' })
  }
})

// Server-Sent Events: admin notifications
adminRouter.get('/events', async (req, res) => {
  // Authenticate via token query (EventSource cannot set headers)
  try {
    const token = String(req.query.token || '')
    if (!token) return res.status(401).end()
    const payload = decodeToken(token)
    if (payload.jti && isBlacklisted(payload.jti)) return res.status(401).end()
    const role = payload.role || 'client'
    if (role !== 'admin') return res.status(403).end()
  } catch (_) {
    return res.status(401).end()
  }

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  // Heartbeat
  const heartbeat = setInterval(() => {
    try { res.write(`event: ping\ndata: {"ts":${Date.now()}}\n\n`) } catch (_) {}
  }, 15000)

  // Listener
  const off = onAdminEvent((evt) => {
    try {
      res.write(`data: ${JSON.stringify(evt)}\n\n`)
    } catch (_) {
      // If client disconnects, remove listener
      off()
      clearInterval(heartbeat)
    }
  })

  // Cleanup on close
  req.on('close', () => {
    try { off() } catch (_) {}
    clearInterval(heartbeat)
    try { res.end() } catch (_) {}
  })
})

// (Routes above individually apply auth/role checks; SSE uses token query.)
