export default async function (req) {
  // list restaurants
  const list = await req.get('/restaurants')
  if (list.status !== 200) throw new Error(`expected 200, got ${list.status}`)
  if (!Array.isArray(list.body?.restaurants) || list.body.restaurants.length === 0) {
    throw new Error('expected at least one restaurant')
  }
  const first = list.body.restaurants[0]

  // get by id
  const byId = await req.get(`/restaurants/${first.id}`)
  if (byId.status !== 200) throw new Error(`expected 200 for /restaurants/:id, got ${byId.status}`)
  if (!byId.body?.restaurant || byId.body.restaurant.id !== first.id) {
    throw new Error('expected restaurant detail')
  }

  // menu
  const menu = await req.get(`/restaurants/${first.id}/menu`)
  if (menu.status !== 200) throw new Error(`expected 200 for /restaurants/:id/menu, got ${menu.status}`)
  if (!Array.isArray(menu.body?.items)) throw new Error('expected items array')
}
