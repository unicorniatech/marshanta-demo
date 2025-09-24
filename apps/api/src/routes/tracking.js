import express from 'express'

import { getOrderById, getLatestLocationForOrder } from '../db/adapter.js'

export const trackingRouter = express.Router()

// GET /tracking/:orderId/stream - SSE stream with real delivery locations (if any)
trackingRouter.get('/:orderId/stream', async (req, res) => {
  const { orderId } = req.params
  const order = await getOrderById(orderId)
  if (!order) return res.status(404).json({ error: 'Order not found' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  // Send an initial event with order status
  send({ type: 'hello', orderId: order.id, status: order.status, ts: Date.now() })

  let lastTs = 0
  const interval = setInterval(async () => {
    try {
      const loc = await getLatestLocationForOrder(order.id)
      if (loc && loc.ts && loc.ts !== lastTs) {
        lastTs = loc.ts
        send({ type: 'location', orderId: order.id, lat: Number(loc.lat), lng: Number(loc.lng), ts: Number(loc.ts) })
      } else {
        // heartbeat to keep the connection alive
        try { res.write(`event: ping\ndata: {\"ts\":${Date.now()} }\n\n`) } catch (_) {}
      }
    } catch (_) {
      // ignore transient errors
    }
  }, 2000)

  req.on('close', () => {
    clearInterval(interval)
  })
})
