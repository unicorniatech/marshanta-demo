// Neutral DB adapter interface with in-memory default for Sprint 1
// Switch via env: DB_DRIVER=memory (default)

import * as memory from './memory.js'
import * as pg from './pg.js'

const drivers = {
  memory,
  pg
}

function selectDriver() {
  const name = (process.env.DB_DRIVER || 'memory').toLowerCase()
  return drivers[name] || drivers.memory
}

const driver = selectDriver()

// User API
export const createUser = driver.createUser
export const findUserByEmail = driver.findUserByEmail

// Restaurant API
export const createRestaurant = driver.createRestaurant
export const listRestaurants = driver.listRestaurants
export const getRestaurantById = driver.getRestaurantById
export const listMenuItems = driver.listMenuItems

// DeliveryPartner API
export const createDeliveryPartner = driver.createDeliveryPartner
export const listDeliveryPartners = driver.listDeliveryPartners

// Orders API (Story 3.1)
export const createOrder = driver.createOrder
export const listOrders = driver.listOrders
export const getOrderById = driver.getOrderById
export const updateOrderStatus = driver.updateOrderStatus
export const updateOrderPaymentStatus = driver.updateOrderPaymentStatus

// Payments persistence (Story 2.4)
export const savePaymentReceipt = driver.savePaymentReceipt
export const hasProcessedPaymentEvent = driver.hasProcessedPaymentEvent
export const markPaymentEventProcessed = driver.markPaymentEventProcessed

// Admin (read-only)
export const listUsers = driver.listUsers
export const getAdminMetrics = driver.getAdminMetrics
