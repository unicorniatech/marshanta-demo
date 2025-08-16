import express from 'express'
import { hashPassword, comparePassword, issueToken, decodeToken, blacklistToken } from '../lib/auth.js'
import { createUser, findUserByEmail } from '../db/adapter.js'

export const authRouter = express.Router()

authRouter.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    if (await findUserByEmail(email)) return res.status(409).json({ error: 'Email already registered' })
    const passwordHash = await hashPassword(password)
    const allowedRoles = ['client', 'staff', 'admin']
    const safeRole = allowedRoles.includes(role) ? role : 'client'
    const user = await createUser({ email, passwordHash, role: safeRole })
    return res.status(201).json({ id: user.id, email: user.email })
  } catch (e) {
    if (e && e.code === 'UNIQUE_VIOLATION') return res.status(409).json({ error: 'Email already registered' })
    return res.status(500).json({ error: 'Registration failed' })
  }
})

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {}
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const user = await findUserByEmail(email)
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const ok = await comparePassword(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    const token = issueToken({ id: user.id, email: user.email, role: user.role })
    return res.json({ token })
  } catch (e) {
    return res.status(500).json({ error: 'Login failed' })
  }
})

authRouter.post('/logout', (req, res) => {
  try {
    const header = req.headers['authorization'] || ''
    const [, token] = header.split(' ')
    if (!token) return res.status(400).json({ error: 'Authorization bearer token required' })
    const payload = decodeToken(token)
    if (!payload.jti || !payload.exp) return res.status(400).json({ error: 'Invalid token payload' })
    blacklistToken(payload.jti, payload.exp)
    return res.json({ ok: true })
  } catch (e) {
    return res.status(400).json({ error: 'Invalid token' })
  }
})
