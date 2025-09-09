import 'dotenv/config'
import express from 'express'
import morgan from 'morgan'
import expressRateLimit from 'express-rate-limit'
import cors from 'cors'

import { authRouter } from './routes/auth.js'
import { restaurantsRouter } from './routes/restaurants.js'
import { ordersRouter } from './routes/orders.js'
import { trackingRouter } from './routes/tracking.js'
import { paymentsRouter } from './routes/payments.js'
import { adminRouter } from './routes/admin.js'
import { authGuard } from './lib/auth.js'

const app = express()

// Middleware
app.use(express.json())
app.use(morgan('dev'))

// CORS (dev-friendly)
const devOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
]
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true) // curl or same-origin
      if (process.env.NODE_ENV !== 'production') {
        // Allow any localhost/127.0.0.1 port in dev
        const ok = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin) || devOrigins.includes(origin)
        return cb(ok ? null : new Error('Not allowed by CORS'), ok)
      }
      return cb(new Error('Not allowed by CORS'), false)
    },
    credentials: false
  })
)

// Basic rate limiting (global)
const globalLimiter = expressRateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
})
app.use(globalLimiter)

// Health
app.get('/healthz', (req, res) => {
  res.json({ ok: true, service: 'api', ts: Date.now() })
})

// Auth routes
app.use('/auth', authRouter)

// Restaurants & menus
app.use('/restaurants', restaurantsRouter)

// Orders
app.use('/orders', ordersRouter)

// Tracking (SSE)
app.use('/tracking', trackingRouter)

// Payments (mock)
app.use('/payments', paymentsRouter)

// Admin (read-only, requires admin role via router middleware)
app.use('/admin', adminRouter)

// Example protected route
app.get('/me', authGuard, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email, role: req.user.role } })
})

// Root info
app.get('/', (req, res) => {
  res.json({
    ok: true,
    service: 'api',
    ts: Date.now(),
    docs: 'See README.md for endpoints',
    endpoints: [
      'GET /healthz',
      'POST /auth/register',
      'POST /auth/login',
      'POST /auth/logout',
      'GET /me',
      'GET /restaurants',
      'GET /restaurants/:id/menu',
      'POST /orders',
      'GET /orders',
      'GET /orders/:id',
      'POST /orders/:id/status',
      'POST /tracking/:orderId/stream',
      'POST /payments/intent',
      'POST /payments/confirm',
      'POST /payments/webhook'
    ]
  })
})

const port = process.env.PORT ? Number(process.env.PORT) : 4000
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`)
  })
}

export default app
