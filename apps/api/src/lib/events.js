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
