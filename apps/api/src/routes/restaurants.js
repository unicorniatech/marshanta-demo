import express from 'express'
import { listRestaurants, getRestaurantById, listMenuItems } from '../db/adapter.js'

export const restaurantsRouter = express.Router()

// GET /restaurants
restaurantsRouter.get('/', async (req, res) => {
  const rows = await listRestaurants()
  res.json({ restaurants: rows })
})

// GET /restaurants/:id
restaurantsRouter.get('/:id', async (req, res) => {
  const r = await getRestaurantById(req.params.id)
  if (!r) return res.status(404).json({ error: 'Not found' })
  res.json({ restaurant: r })
})

// GET /restaurants/:id/menu
restaurantsRouter.get('/:id/menu', async (req, res) => {
  const r = await getRestaurantById(req.params.id)
  if (!r) return res.status(404).json({ error: 'Not found' })
  const items = await listMenuItems(r.id)
  res.json({ restaurantId: r.id, items })
})
