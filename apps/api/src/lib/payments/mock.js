// Mock payment gateway implementation for Story 2.4
// createIntent/confirmPayment simulate a provider; webhook verification uses a shared header

export async function createIntent({ order }) {
  const amountCents = (order.items || []).reduce((acc, i) => acc + (i.priceCents * i.qty), 0)
  const clientSecret = `mock_secret_${order.id}_${Date.now()}`
  return { clientSecret, amountCents, currency: 'USD' }
}

export async function confirmPayment({ order, clientSecret, outcome = 'succeeded' }) {
  if (!clientSecret) throw new Error('clientSecret required')
  const status = outcome === 'failed' ? 'Failed' : 'Succeeded'
  return {
    provider: 'mock',
    status,
    receipt: {
      provider: 'mock',
      orderId: order.id,
      amountCents: (order.items || []).reduce((acc, i) => acc + (i.priceCents * i.qty), 0),
      currency: 'USD',
      clientSecret,
      outcome: status,
      at: Date.now()
    }
  }
}

export async function verifyAndParseWebhook({ headers, rawBody }) {
  const secret = process.env.MOCK_WEBHOOK_SECRET || 'dev_secret'
  const sig = headers['x-mock-signature']
  if (sig !== secret) {
    const err = new Error('invalid signature')
    err.code = 'INVALID_SIGNATURE'
    throw err
  }
  // rawBody may be undefined since we use express.json; accept parsed JSON in tests
  const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : JSON.parse(JSON.stringify(rawBody || {}))
  // accept both camelCase and snake_case
  const eventId = body.eventId || body.event_id
  const orderId = body.orderId || body.order_id
  const event = body.event
  const status = body.status
  if (!eventId || !orderId || !event) throw new Error('eventId, orderId, and event required')
  return { eventId, orderId, event, status }
}
