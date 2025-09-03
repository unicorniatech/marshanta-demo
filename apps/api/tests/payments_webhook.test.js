// payments_webhook.test.js
export default async function paymentsWebhookTests(request) {
  // Use an existing seeded restaurant
  const rest = await request.get('/restaurants')
  const restaurantId = rest.body?.restaurants?.[0]?.id || 1

  const orderRes = await request
    .post('/orders')
    .send({ restaurantId, items: [{ itemId: 1, name: 'Item', priceCents: 500, qty: 2 }] })
  if (orderRes.status !== 200 && orderRes.status !== 201) throw new Error('failed to create order')
  const order = orderRes.body?.order || orderRes.body

  // Invalid signature
  const bad = await request
    .post('/payments/webhook')
    .set('content-type', 'application/json')
    .set('x-mock-signature', 'wrong_secret')
    .send({ eventId: 'evt_1', orderId: order.id, event: 'payment.updated', status: 'Succeeded' })
  if (bad.status !== 401) throw new Error('expected 401 for invalid signature')

  // Valid signature and first delivery
  const secret = process.env.MOCK_WEBHOOK_SECRET || 'dev_secret'
  const ok1 = await request
    .post('/payments/webhook')
    .set('content-type', 'application/json')
    .set('x-mock-signature', secret)
    .send({ eventId: 'evt_2', orderId: order.id, event: 'payment.updated', status: 'Succeeded' })
  if (ok1.status !== 200 || !ok1.body?.ok) throw new Error(`expected ok webhook, got ${ok1.status}: ${ok1.text}`)

  // Order should now be Succeeded payment status
  const get1 = await request.get(`/orders/${order.id}`)
  const got = get1.body?.order || get1.body
  if (got?.paymentStatus !== 'Succeeded') throw new Error('payment status not updated')

  // Duplicate event id must be idempotent
  const dup = await request
    .post('/payments/webhook')
    .set('content-type', 'application/json')
    .set('x-mock-signature', secret)
    .send({ eventId: 'evt_2', orderId: order.id, event: 'payment.updated', status: 'Succeeded' })
  if (dup.status !== 200 || !dup.body?.duplicate) throw new Error('expected duplicate acknowledgement')
}
