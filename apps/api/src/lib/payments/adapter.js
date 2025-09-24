// Payment Gateway Adapter interface
// For now we provide a mock implementation. Later swap to a real provider.

import * as mock from './mock.js'

const impl = mock

export async function createIntent({ order }) {
  return impl.createIntent({ order })
}

export async function confirmPayment({ order, clientSecret, outcome }) {
  return impl.confirmPayment({ order, clientSecret, outcome })
}

export async function verifyAndParseWebhook({ headers, rawBody }) {
  return impl.verifyAndParseWebhook({ headers, rawBody })
}
