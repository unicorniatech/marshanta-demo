const CACHE_NAME = 'marshanta-v1'
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/main.js',
  '/manifest.webmanifest',
  '/offline.html',
  '/icons/logo-192.svg',
  '/icons/logo-512.svg'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // cleanup old caches
    const names = await caches.keys()
    await Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    return self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const isNavigation = req.mode === 'navigate'
  // Network-first for navigation; cache-first for same-origin static
  if (isNavigation) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req)
        return fresh
      } catch (_) {
        const cache = await caches.open(CACHE_NAME)
        const offline = await cache.match('/offline.html')
        return offline || new Response('Offline', { status: 503 })
      }
    })())
    return
  }

  const url = new URL(req.url)
  if (url.origin === location.origin) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME)
      const cached = await cache.match(req)
      if (cached) return cached
      try {
        const fresh = await fetch(req)
        // Optionally cache successful same-origin GETs
        if (req.method === 'GET') cache.put(req, fresh.clone())
        return fresh
      } catch (e) {
        return cached || Response.error()
      }
    })())
  }
})
