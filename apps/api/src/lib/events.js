import { EventEmitter } from 'node:events'

export const bus = new EventEmitter()

// Helper to emit typed admin events
export function emitAdminEvent(evt) {
  // evt: { type, ts?, orderId?, restaurantId?, message?, severity? }
  const payload = { ts: Date.now(), severity: 'info', ...evt }
  bus.emit('admin:event', payload)
}

export function onAdminEvent(listener) {
  bus.on('admin:event', listener)
  return () => bus.off('admin:event', listener)
}

// Partner-targeted events
export function emitPartnerEvent(partnerId, evt) {
  const payload = { ts: Date.now(), ...evt, partnerId: Number(partnerId) }
  bus.emit(`partner:event:${Number(partnerId)}`, payload)
}

export function onPartnerEvent(partnerId, listener) {
  const key = `partner:event:${Number(partnerId)}`
  bus.on(key, listener)
  return () => bus.off(key, listener)
}
