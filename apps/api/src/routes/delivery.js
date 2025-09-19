import { Router } from 'express'
import { authGuard, requireRole, decodeToken, isBlacklisted } from '../lib/auth.js'
import { listAssignmentsForPartner, setAssignmentStatus, saveDeliveryLocation } from '../db/adapter.js'
import { onPartnerEvent, emitAdminEvent } from '../lib/events.js'

export const deliveryRouter = Router()

// List assignments for the authenticated delivery partner
deliveryRouter.get('/assignments', authGuard, requireRole(['delivery']), async (req, res) => {
  try {
    const partnerId = Number(req.user.id)
    const rows = await listAssignmentsForPartner(partnerId)
    res.json({ assignments: rows })
  } catch (e) {
    res.status(500).json({ error: 'Failed to load assignments' })
  }
})

// Accept an assignment
deliveryRouter.post('/assignments/:id/accept', authGuard, requireRole(['delivery']), async (req, res) => {
  try {
    const id = Number(req.params.id)
    const updated = await setAssignmentStatus(id, 'Accepted')
    emitAdminEvent({ type: 'delivery_accepted', orderId: updated.orderId, message: `Partner accepted assignment #${id}` })
    res.json({ assignment: updated })
  } catch (e) {
    const status = String(e.message || '').includes('Not found') ? 404 : 400
    res.status(status).json({ error: e.message || 'Failed to accept' })
  }
})

// Update assignment status (PickedUp | Delivered)
deliveryRouter.post('/assignments/:id/status', authGuard, requireRole(['delivery']), async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { status } = req.body || {}
    if (!['PickedUp', 'Delivered'].includes(String(status))) return res.status(400).json({ error: 'Invalid status' })
    const updated = await setAssignmentStatus(id, String(status))
    emitAdminEvent({ type: 'delivery_status', orderId: updated.orderId, message: `Assignment #${id} -> ${updated.status}` })
    res.json({ assignment: updated })
  } catch (e) {
    const code = String(e.message || '').includes('Not found') ? 404 : 400
    res.status(code).json({ error: e.message || 'Failed to update' })
  }
})

// Partner posts current location
deliveryRouter.post('/location', authGuard, requireRole(['delivery']), async (req, res) => {
  try {
    const partnerId = Number(req.user.id)
    const { orderId, lat, lng } = req.body || {}
    if (typeof lat !== 'number' || typeof lng !== 'number') return res.status(400).json({ error: 'lat and lng required as numbers' })
    const rec = await saveDeliveryLocation({ partnerId, orderId, lat, lng })
    res.json({ ok: true, location: rec })
  } catch (e) {
    res.status(400).json({ error: e.message || 'Failed to save location' })
  }
})

// SSE for partner notifications
// Authenticate with token query param (EventSource limitation)
deliveryRouter.get('/events', async (req, res) => {
  try {
    const token = String(req.query.token || '')
    if (!token) return res.status(401).end()
    const payload = decodeToken(token)
    if (payload.jti && isBlacklisted(payload.jti)) return res.status(401).end()
    if ((payload.role || 'client') !== 'delivery') return res.status(403).end()
    const partnerId = Number(payload.sub)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.flushHeaders?.()

    const heartbeat = setInterval(() => {
      try { res.write(`event: ping\ndata: {"ts":${Date.now()}}\n\n`) } catch (_) {}
    }, 15000)

    const off = onPartnerEvent(partnerId, (evt) => {
      try { res.write(`data: ${JSON.stringify(evt)}\n\n`) } catch (_) { /* ignore */ }
    })

    req.on('close', () => {
      try { off() } catch (_) {}
      clearInterval(heartbeat)
      try { res.end() } catch (_) {}
    })
  } catch (_) {
    return res.status(401).end()
  }
})
