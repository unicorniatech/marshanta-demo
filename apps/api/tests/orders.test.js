export default async function (req) {
  // 1) Pick a restaurant and its menu
  const restaurants = await req.get('/restaurants')
  if (restaurants.status !== 200) throw new Error(`restaurants list ${restaurants.status}`)
  const r = restaurants.body.restaurants[0]
  if (!r) throw new Error('no restaurant')
  const menu = await req.get(`/restaurants/${r.id}/menu`)
  if (menu.status !== 200) throw new Error(`menu ${menu.status}`)
  const item = menu.body.items[0] || { name: 'Custom', priceCents: 1000, id: 0 }

  // 2) Create an order
  const create = await req
    .post('/orders')
    .send({ restaurantId: r.id, items: [{ itemId: item.id || 0, name: item.name, priceCents: item.priceCents, qty: 1 }] })
  if (create.status !== 201) throw new Error(`create order ${create.status}: ${JSON.stringify(create.body)}`)
  const order = create.body.order
  if (!order?.id) throw new Error('expected order id')

  // 3) Mock payment intent + confirm
  const intent = await req.post('/payments/intent').send({ orderId: order.id })
  if (intent.status !== 200) throw new Error(`intent ${intent.status}`)
  const clientSecret = intent.body?.clientSecret
  if (!clientSecret) throw new Error('expected clientSecret')

  const confirm = await req.post('/payments/confirm').send({ orderId: order.id, clientSecret, outcome: 'succeeded' })
  if (confirm.status !== 200) throw new Error(`confirm ${confirm.status}`)
  if (confirm.body?.paymentStatus !== 'Succeeded') throw new Error('expected paymentStatus Succeeded')

  // 4) Register a staff user to perform status transitions
  const email = `staff_${Date.now()}@test.local`
  const reg = await req.post('/auth/register').send({ email, password: 'pw', role: 'staff' })
  if (reg.status !== 201) throw new Error(`register ${reg.status}`)
  const login = await req.post('/auth/login').send({ email, password: 'pw' })
  if (login.status !== 200) throw new Error(`login ${login.status}`)
  const token = login.body?.token
  if (!token) throw new Error('expected token')

  // 5) Transition Submitted -> Accepted -> Preparing -> ReadyForPickup
  const seq = ['Accepted', 'Preparing', 'ReadyForPickup']
  let current = order
  for (const next of seq) {
    const resp = await req
      .post(`/orders/${current.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ next })
    if (resp.status !== 200) throw new Error(`transition to ${next} failed ${resp.status}: ${JSON.stringify(resp.body)}`)
    if (resp.body?.order?.status !== next) throw new Error(`expected status ${next}`)
    current = resp.body.order
  }
}
