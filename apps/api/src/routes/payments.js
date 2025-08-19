import express from 'express'
 
import { getOrderById, updateOrderPaymentStatus } from '../db/adapter.js'

export const paymentsRouter = express.Router()

// POST /payments/intent -> returns mock client secret & amount summary
paymentsRouter.post('/intent', async (req, res) => {
  const { orderId } = req.body || {}
  if (!orderId) return res.status(400).json({ error: 'orderId required' })
  const o = await getOrderById(orderId)
  if (!o) return res.status(404).json({ error: 'Order not found' })
  const amountCents = (o.items || []).reduce((acc, i) => acc + (i.priceCents * i.qty), 0)
  const clientSecret = `mock_secret_${o.id}_${Date.now()}`
  res.json({ clientSecret, amountCents, currency: 'USD' })
})

// POST /payments/confirm -> simulates confirmation and marks order as paid
paymentsRouter.post('/confirm', async (req, res) => {
  const { orderId, clientSecret, outcome = 'succeeded' } = req.body || {}
  if (!orderId || !clientSecret) return res.status(400).json({ error: 'orderId and clientSecret required' })
  const o = await getOrderById(orderId)
  if (!o) return res.status(404).json({ error: 'Order not found' })
  const status = outcome === 'failed' ? 'Failed' : 'Succeeded'
  const updated = await updateOrderPaymentStatus(orderId, status)
  res.json({ paymentStatus: updated.paymentStatus, order: updated })
})

// POST /payments/webhook -> mock webhook that validates a shared secret header
paymentsRouter.post('/webhook', async (req, res) => {
  const secret = process.env.MOCK_WEBHOOK_SECRET || 'dev_secret'
  const sig = req.headers['x-mock-signature']
  if (sig !== secret) return res.status(401).json({ error: 'invalid signature' })
  try {
    const { orderId, event, status } = req.body || {}
    if (!orderId || !event) return res.status(400).json({ error: 'orderId and event required' })
    if (status) await updateOrderPaymentStatus(orderId, status)
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message || 'webhook error' })
  }
})
