import { randomBytes } from 'node:crypto'

import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const AUTH_SECRET = process.env.AUTH_SECRET || 'dev_secret_change_me'

// Very simple in-memory blacklist with expiration cleanup
const tokenBlacklist = new Map() // jti -> exp (epoch seconds)

function cleanupBlacklist() {
  const now = Math.floor(Date.now() / 1000)
  for (const [jti, exp] of tokenBlacklist.entries()) {
    if (exp <= now) tokenBlacklist.delete(jti)
  }
}
setInterval(cleanupBlacklist, 60_000).unref?.()

export async function hashPassword(plain) {
  return await bcrypt.hash(plain, 10)
}

export async function comparePassword(plain, hash) {
  return await bcrypt.compare(plain, hash)
}

export function issueToken({ id, email, role }, { expiresIn = '1h' } = {}) {
  const jti = cryptoRandomId()
  return jwt.sign({ sub: String(id), email, role, jti }, AUTH_SECRET, { expiresIn })
}

export function decodeToken(token) {
  return jwt.verify(token, AUTH_SECRET)
}

export function blacklistToken(jti, exp) {
  tokenBlacklist.set(jti, exp)
}

export function isBlacklisted(jti) {
  return tokenBlacklist.has(jti)
}

export function authGuard(req, res, next) {
  try {
    const header = req.headers['authorization'] || ''
    const [, token] = header.split(' ')
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    const payload = decodeToken(token)
    if (payload.jti && isBlacklisted(payload.jti)) {
      return res.status(401).json({ error: 'Token revoked' })
    }
    req.user = { id: payload.sub, email: payload.email, role: payload.role || 'client' }
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}

export function requireRole(roles = []) {
  return (req, res, next) => {
    const role = req.user?.role || 'client'
    if (!roles.includes(role)) return res.status(403).json({ error: 'Forbidden' })
    next()
  }
}

function cryptoRandomId() {
  return randomBytes(16).toString('hex')
}
