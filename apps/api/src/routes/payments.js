import express from 'express'

import { getOrderById, updateOrderPaymentStatus, savePaymentReceipt, hasProcessedPaymentEvent, markPaymentEventProcessed } from '../db/adapter.js'
import { emitAdminEvent } from '../lib/events.js'
import { createIntent, confirmPayment, verifyAndParseWebhook } from '../lib/payments/adapter.js'

export const paymentsRouter = express.Router()

// POST /payments/intent -> returns client secret & amount summary (via adapter)
paymentsRouter.post('/intent', async (req, res) => {
  const { orderId } = req.body || {}
  if (!orderId) return res.status(400).json({ error: 'orderId required' })
  const o = await getOrderById(orderId)
  if (!o) return res.status(404).json({ error: 'Order not found' })
  const result = await createIntent({ order: o })
  res.json(result)
})

// POST /payments/confirm -> confirm via adapter; update order + persist receipt
paymentsRouter.post('/confirm', async (req, res) => {
  const { orderId, clientSecret, outcome = 'succeeded' } = req.body || {}
  if (!orderId || !clientSecret) return res.status(400).json({ error: 'orderId and clientSecret required' })
  const o = await getOrderById(orderId)
  if (!o) return res.status(404).json({ error: 'Order not found' })
  const result = await confirmPayment({ order: o, clientSecret, outcome })
  const updated = await updateOrderPaymentStatus(orderId, result.status)
  await savePaymentReceipt({ orderId: updated.id, provider: result.provider || 'mock', amountCents: result.receipt?.amountCents || 0, currency: result.receipt?.currency || 'USD', raw: result.receipt || null })
  emitAdminEvent({ type: 'payment_updated', orderId: updated.id, restaurantId: updated.restaurantId, message: `Payment ${updated.paymentStatus} for order #${updated.id}` })
  res.json({ paymentStatus: updated.paymentStatus, order: updated })
})

// POST /payments/webhook -> verify signature via adapter; idempotent event handling
paymentsRouter.post('/webhook', async (req, res) => {
  try {
    const parsed = await verifyAndParseWebhook({ headers: req.headers, rawBody: req.body })
    // Idempotency check
    const seen = await hasProcessedPaymentEvent(parsed.eventId)
    if (seen) {
      emitAdminEvent({ type: 'webhook_duplicate', orderId: parsed.orderId, message: `Duplicate webhook ${parsed.eventId}` })
      return res.json({ ok: true, duplicate: true })
    }
    if (parsed.status) await updateOrderPaymentStatus(parsed.orderId, parsed.status)
    await markPaymentEventProcessed(parsed.eventId)
    emitAdminEvent({ type: 'payment_webhook', orderId: parsed.orderId, message: `Webhook processed ${parsed.eventId} status=${parsed.status || 'N/A'}` })
    res.json({ ok: true })
  } catch (e) {
    const status = e.code === 'INVALID_SIGNATURE' ? 401 : 400
    try { emitAdminEvent({ type: 'payment_webhook_error', severity: 'warn', message: e.message || 'webhook error' }) } catch (_) {}
    res.status(status).json({ error: e.message || 'webhook error' })
  }
})
