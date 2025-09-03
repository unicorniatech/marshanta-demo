export default async function (req) {
  // Create order
  const restaurants = await req.get('/restaurants')
  if (restaurants.status !== 200) throw new Error(`restaurants list ${restaurants.status}`)
  const r = restaurants.body.restaurants[0]
  if (!r) throw new Error('no restaurant')
  const menu = await req.get(`/restaurants/${r.id}/menu`)
  if (menu.status !== 200) throw new Error(`menu ${menu.status}`)
  const item = menu.body.items[0] || { name: 'Custom', priceCents: 1000, id: 0 }

  const create = await req.post('/orders').send({ restaurantId: r.id, items: [{ itemId: item.id || 0, name: item.name, priceCents: item.priceCents, qty: 1 }] })
  if (create.status !== 201) throw new Error(`create order ${create.status}`)
  const orderId = create.body.order?.id
  if (!orderId) throw new Error('expected order id')

  // Intent + failed confirm
  const intent = await req.post('/payments/intent').send({ orderId })
  if (intent.status !== 200) throw new Error(`intent ${intent.status}`)
  const clientSecret = intent.body?.clientSecret
  if (!clientSecret) throw new Error('expected clientSecret')

  const confirm = await req.post('/payments/confirm').send({ orderId, clientSecret, outcome: 'failed' })
  if (confirm.status !== 200) throw new Error(`confirm ${confirm.status}`)
  if (confirm.body?.paymentStatus !== 'Failed') throw new Error('expected paymentStatus Failed')
}
