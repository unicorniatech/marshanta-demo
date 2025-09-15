import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
// Load env from monorepo root so starting via workspace doesn't depend on shell sourcing
try {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const rootEnvPath = path.resolve(__dirname, '../../.env')
  dotenv.config({ path: rootEnvPath, override: true })
  // Also load default .env in current cwd as fallback
  dotenv.config({ override: true })
} catch (_) {
  // ignore if dotenv not available
}
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
import { deliveryRouter } from './routes/delivery.js'
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
        // Allow any localhost/127.0.0.1 port in dev and Capacitor WebView scheme
        const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin) || devOrigins.includes(origin)
        const isCapacitor = /^capacitor:\/\//.test(origin)
        const ok = isLocalhost || isCapacitor
        return cb(ok ? null : new Error('Not allowed by CORS'), ok)
      }
      return cb(new Error('Not allowed by CORS'), false)
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
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

// Delivery partner endpoints
app.use('/delivery', deliveryRouter)

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
