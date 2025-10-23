export default async function (req) {
  // Create an order as a client (POST /orders requires auth)
  const restaurants = await req.get('/restaurants')
  if (restaurants.status !== 200) throw new Error(`restaurants list ${restaurants.status}`)
  const r = restaurants.body.restaurants[0]
  if (!r) throw new Error('no restaurant')
  const menu = await req.get(`/restaurants/${r.id}/menu`)
  if (menu.status !== 200) throw new Error(`menu ${menu.status}`)
  const item = menu.body.items[0] || { name: 'Custom', priceCents: 1000, id: 0 }

  // client auth
  const emailClient = `client_${Date.now()}@test.local`
  const regClient = await req.post('/auth/register').send({ email: emailClient, password: 'pw', role: 'client' })
  if (regClient.status !== 201) throw new Error(`register client ${regClient.status}`)
  const loginClient = await req.post('/auth/login').send({ email: emailClient, password: 'pw' })
  if (loginClient.status !== 200) throw new Error(`login client ${loginClient.status}`)
  const clientToken = loginClient.body?.token
  if (!clientToken) throw new Error('expected client token')

  const create = await req.post('/orders').set('Authorization', `Bearer ${clientToken}`).send({ restaurantId: r.id, items: [{ itemId: item.id || 0, name: item.name, priceCents: item.priceCents, qty: 1 }] })
  if (create.status !== 201) throw new Error(`create order ${create.status}`)
  const order = create.body.order

  // Unauthorized transition should be 401
  const noAuth = await req.post(`/orders/${order.id}/status`).send({ next: 'Accepted' })
  if (noAuth.status !== 401) throw new Error(`expected 401 without auth, got ${noAuth.status}`)

  // Client role should be 403
  const email2 = `client_${Date.now()}b@test.local`
  const reg2 = await req.post('/auth/register').send({ email: email2, password: 'pw', role: 'client' })
  if (reg2.status !== 201) throw new Error(`register client ${reg2.status}`)
  const login2 = await req.post('/auth/login').send({ email: email2, password: 'pw' })
  if (login2.status !== 200) throw new Error(`login client ${login2.status}`)
  const token = login2.body?.token
  if (!token) throw new Error('expected client token')

  const forbidden = await req.post(`/orders/${order.id}/status`).set('Authorization', `Bearer ${token}`).send({ next: 'Accepted' })
  if (forbidden.status !== 403) throw new Error(`expected 403 for client, got ${forbidden.status}`)
}
