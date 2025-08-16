import express from 'express'
import { getOrderById } from '../db/adapter.js'

export const trackingRouter = express.Router()

// GET /tracking/:orderId/stream - SSE stream with mock location updates
trackingRouter.get('/:orderId/stream', async (req, res) => {
  const { orderId } = req.params
  const order = await getOrderById(orderId)
  if (!order) return res.status(404).json({ error: 'Order not found' })

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders?.()

  // Simple mocked route near Cuernavaca
  const baseLat = 18.936
  const baseLng = -99.223
  const steps = 60
  let i = 0

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  // Send an initial event with order status
  send({ type: 'hello', orderId: order.id, status: order.status, ts: Date.now() })

  const interval = setInterval(() => {
    i += 1
    const lat = baseLat + (Math.sin(i / 10) * 0.01) + (i * 0.0005)
    const lng = baseLng + (Math.cos(i / 10) * 0.01) + (i * 0.0004)
    send({ type: 'location', orderId: order.id, lat, lng, ts: Date.now() })
    if (i >= steps) {
      send({ type: 'complete', orderId: order.id, ts: Date.now() })
      clearInterval(interval)
      res.end()
    }
  }, 1000)

  req.on('close', () => {
    clearInterval(interval)
  })
})
