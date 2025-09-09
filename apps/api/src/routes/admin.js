import { Router } from 'express'
import { authGuard, requireRole, decodeToken, isBlacklisted } from '../lib/auth.js'
import { getAdminMetrics, listUsers, listRestaurants, listOrders } from '../db/adapter.js'
import { onAdminEvent } from '../lib/events.js'

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
