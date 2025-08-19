#!/usr/bin/env node
/* eslint import/order: 0 */
import 'dotenv/config'
import request from 'supertest'

import app from '../src/index.js'

// Minimal test runner
const tests = []
function register(name, fn) { tests.push({ name, fn }) }

async function run() {
  let failed = 0
  for (const t of tests) {
    const start = Date.now()
    try {
      await t.fn(request(app))
      const ms = Date.now() - start
      console.log(`✔ ${t.name} (${ms}ms)`) 
    } catch (e) {
      failed += 1
      console.error(`✘ ${t.name}:`, e.message)
      if (process.env.VERBOSE) console.error(e)
    }
  }
  if (failed) {
    console.error(`\n${failed} test(s) failed`)
    process.exit(1)
  } else {
    console.log(`\nAll tests passed (${tests.length})`)
  }
}

// Import test modules and register them
import health from '../tests/health.test.js'
import restaurants from '../tests/restaurants.test.js'
import orders from '../tests/orders.test.js'
import auth from '../tests/auth.test.js'
import errors from '../tests/errors.test.js'

register('health endpoint', health)
register('restaurants and menus', restaurants)
register('orders flow with mocked payments', orders)
register('auth register/login/me/logout', auth)
register('errors and negative cases', errors)

run().catch(err => { console.error(err); process.exit(1) })
