export default async function (req) {
  // Register admin
  const adminEmail = `admin_${Date.now()}@test.local`
  const adminReg = await req.post('/auth/register').send({ email: adminEmail, password: 'pw', role: 'admin' })
  if (adminReg.status !== 201) throw new Error(`admin register ${adminReg.status}`)
  const adminLogin = await req.post('/auth/login').send({ email: adminEmail, password: 'pw' })
  if (adminLogin.status !== 200) throw new Error(`admin login ${adminLogin.status}`)
  const adminToken = adminLogin.body?.token
  if (!adminToken) throw new Error('missing admin token')

  // Register delivery user (should be auto-provisioned as partner)
  const delEmail = `delivery_${Date.now()}@test.local`
  const delReg = await req.post('/auth/register').send({ email: delEmail, password: 'pw', role: 'delivery' })
  if (delReg.status !== 201) throw new Error(`delivery register ${delReg.status}`)
  const deliveryId = delReg.body?.id
  if (!deliveryId) throw new Error('missing delivery id from register')
  const delLogin = await req.post('/auth/login').send({ email: delEmail, password: 'pw' })
  if (delLogin.status !== 200) throw new Error(`delivery login ${delLogin.status}`)
  const delToken = delLogin.body?.token
  if (!delToken) throw new Error('missing delivery token')

  // Partners list should include our delivery user id
  const partners = await req.get('/admin/delivery-partners').set('Authorization', `Bearer ${adminToken}`)
  if (partners.status !== 200) throw new Error(`partners list ${partners.status}`)
  const found = (partners.body.partners || []).find(p => Number(p.id) === Number(deliveryId))
  if (!found) throw new Error(`delivery partner id ${deliveryId} not found in partners list`)

  // Create an order
  const restaurants = await req.get('/restaurants')
  if (restaurants.status !== 200) throw new Error(`restaurants list ${restaurants.status}`)
  const r = restaurants.body.restaurants[0]
  if (!r) throw new Error('no restaurant')
  const menu = await req.get(`/restaurants/${r.id}/menu`)
  if (menu.status !== 200) throw new Error(`menu ${menu.status}`)
  const item = menu.body.items[0] || { name: 'Item', priceCents: 1000, id: 0 }
  const createOrder = await req.post('/orders').send({ restaurantId: r.id, items: [{ itemId: item.id || 0, name: item.name, priceCents: item.priceCents, qty: 1 }] })
  if (createOrder.status !== 201) throw new Error(`create order ${createOrder.status}`)
  const orderId = createOrder.body?.order?.id
  if (!orderId) throw new Error('missing order id')

  // Admin assigns order to delivery partner
  const assign = await req.post('/admin/assignments')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ orderId, partnerId: deliveryId })
  if (assign.status !== 201) throw new Error(`assign order ${assign.status}`)
  const assignmentId = assign.body?.assignment?.id
  if (!assignmentId) throw new Error('missing assignment id')

  // Delivery user sees assignment
  const myAssignments = await req.get('/delivery/assignments').set('Authorization', `Bearer ${delToken}`)
  if (myAssignments.status !== 200) throw new Error(`list assignments ${myAssignments.status}`)
  const mine = (myAssignments.body.assignments || []).find(a => Number(a.id) === Number(assignmentId))
  if (!mine) throw new Error('delivery assignment not visible to delivery user')

  // Delivery user accepts assignment
  const accept = await req.post(`/delivery/assignments/${assignmentId}/accept`).set('Authorization', `Bearer ${delToken}`)
  if (accept.status !== 200) throw new Error(`accept assignment ${accept.status}`)
  if ((accept.body.assignment?.status || '') !== 'Accepted') throw new Error('expected status Accepted after accept')
}
