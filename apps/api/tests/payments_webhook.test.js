// payments_webhook.test.js
export default async function paymentsWebhookTests(request) {
  // Use an existing seeded restaurant
  const rest = await request.get('/restaurants')
  const restaurantId = rest.body?.restaurants?.[0]?.id || 1

  // client auth
  const email = `client_${Date.now()}@test.local`
  const reg = await request.post('/auth/register').send({ email, password: 'pw', role: 'client' })
  if (reg.status !== 201) throw new Error(`register client ${reg.status}`)
  const login = await request.post('/auth/login').send({ email, password: 'pw' })
  if (login.status !== 200) throw new Error(`login client ${login.status}`)
  const token = login.body?.token
  if (!token) throw new Error('expected client token')

  const orderRes = await request
    .post('/orders')
    .set('Authorization', `Bearer ${token}`)
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

  // Valid signature and first delivery (status optional)
  const secret = process.env.MOCK_WEBHOOK_SECRET || 'dev_secret'
  const ok1 = await request
    .post('/payments/webhook')
    .set('content-type', 'application/json')
    .set('x-mock-signature', secret)
    .send({ eventId: 'evt_2', orderId: order.id, event: 'payment.updated' })
  if (ok1.status !== 200 || !ok1.body?.ok) throw new Error(`expected ok webhook, got ${ok1.status}: ${ok1.text}`)

  // We only assert idempotency in this smoke

  // Duplicate event id must be idempotent
  const dup = await request
    .post('/payments/webhook')
    .set('content-type', 'application/json')
    .set('x-mock-signature', secret)
    .send({ eventId: 'evt_2', orderId: order.id, event: 'payment.updated' })
  if (dup.status !== 200 || !dup.body?.duplicate) throw new Error('expected duplicate acknowledgement')
}
