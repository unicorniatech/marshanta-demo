export default async function (req) {
  // List restaurants
  const restaurants = await req.get('/restaurants')
  if (restaurants.status !== 200) throw new Error(`restaurants list ${restaurants.status}`)
  const r = restaurants.body.restaurants[0]
  if (!r) throw new Error('no restaurant')

  // Create an order (requires client auth) so the RC has something to fetch
  const menu = await req.get(`/restaurants/${r.id}/menu`)
  if (menu.status !== 200) throw new Error(`menu ${menu.status}`)
  const item = menu.body.items[0] || { name: 'Custom', priceCents: 1000, id: 0 }
  const cEmail = `client_${Date.now()}@test.local`
  const cReg = await req.post('/auth/register').send({ email: cEmail, password: 'pw', role: 'client' })
  if (cReg.status !== 201) throw new Error(`register client ${cReg.status}`)
  const cLogin = await req.post('/auth/login').send({ email: cEmail, password: 'pw' })
  if (cLogin.status !== 200) throw new Error(`login client ${cLogin.status}`)
  const cToken = cLogin.body?.token
  if (!cToken) throw new Error('expected client token')

  const create = await req.post('/orders').set('Authorization', `Bearer ${cToken}`).send({ restaurantId: r.id, items: [{ itemId: item.id || 0, name: item.name, priceCents: item.priceCents, qty: 1 }] })
  if (create.status !== 201) throw new Error(`create order ${create.status}`)

  // Admin login
  const email = `admin_${Date.now()}@test.local`
  const reg = await req.post('/auth/register').send({ email, password: 'pw', role: 'admin' })
  if (reg.status !== 201) throw new Error(`register admin ${reg.status}`)
  const login = await req.post('/auth/login').send({ email, password: 'pw' })
  if (login.status !== 200) throw new Error(`login admin ${login.status}`)
  const token = login.body?.token
  if (!token) throw new Error('expected admin token')

  // RC endpoint: list orders for restaurant
  const list = await req.get(`/orders?restaurantId=${encodeURIComponent(r.id)}`).set('Authorization', `Bearer ${token}`)
  if (list.status !== 200) throw new Error(`rc list ${list.status}`)
  if (!Array.isArray(list.body.orders)) throw new Error('orders not array')
}
