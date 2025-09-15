import { defineConfig } from 'vite'

// Vite config for Marshanta Web (PWA shell)
// - base './' so the build works when served from Capacitor in native apps
// - dev server defaults to 5173
export default defineConfig({
  base: './',
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
