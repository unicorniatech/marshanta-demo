export default async function (req) {
  // invalid order create (missing items)
  const bad1 = await req.post('/orders').send({ restaurantId: 1 })
  if (bad1.status !== 400) throw new Error(`expected 400 for missing items, got ${bad1.status}`)

  // invalid order create (missing restaurantId)
  const bad2 = await req.post('/orders').send({ items: [] })
  if (bad2.status !== 400) throw new Error(`expected 400 for missing restaurantId, got ${bad2.status}`)

  // create a valid order first
  const restaurants = await req.get('/restaurants')
  const r = restaurants.body.restaurants[0]
  const menu = await req.get(`/restaurants/${r.id}/menu`)
  const item = menu.body.items[0]
  const create = await req.post('/orders').send({ restaurantId: r.id, items: [{ itemId: item.id, name: item.name, priceCents: item.priceCents, qty: 1 }] })
  if (create.status !== 201) throw new Error(`create order ${create.status}`)
  const orderId = create.body.order.id

  // transition without auth
  const noAuth = await req.post(`/orders/${orderId}/status`).send({ next: 'Accepted' })
  if (noAuth.status !== 401) throw new Error(`expected 401 for transition without auth, got ${noAuth.status}`)

  // login as staff
  const email = `staff_${Date.now()}@test.local`
  const reg = await req.post('/auth/register').send({ email, password: 'pw', role: 'staff' })
  if (reg.status !== 201) throw new Error(`register staff ${reg.status}`)
  const login = await req.post('/auth/login').send({ email, password: 'pw' })
  const token = login.body.token

  // invalid transition (e.g., skipping to Delivered immediately)
  const invalid = await req
    .post(`/orders/${orderId}/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ next: 'Delivered' })
  if (![400, 409].includes(invalid.status)) throw new Error(`expected 409/400 for invalid transition, got ${invalid.status}`)

  // 404 on non-existent order
  const missing = await req
    .post(`/orders/999999/status`)
    .set('Authorization', `Bearer ${token}`)
    .send({ next: 'Accepted' })
  if (missing.status !== 404 && missing.status !== 400) throw new Error(`expected 404/400 for missing order, got ${missing.status}`)
}
