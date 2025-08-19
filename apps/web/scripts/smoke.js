// Minimal web smoke test: run a static server and verify /
import { spawn } from 'node:child_process'

const PORT = process.env.WEB_SMOKE_PORT ? Number(process.env.WEB_SMOKE_PORT) : 5174

function wait(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  const server = spawn('npx', ['--yes', 'http-server', '-c-1', '-a', '127.0.0.1', '-p', String(PORT), '.'], {
    cwd: new URL('..', import.meta.url).pathname.replace(/\/scripts\/$/, '/'),
    stdio: 'inherit'
  })

  let exited = false
  server.on('exit', () => { exited = true })

  try {
    // wait for server to boot with retries
    const url = `http://127.0.0.1:${PORT}/`
    const maxAttempts = 15
    let attempt = 0
    let ok = false
    let lastErr
    while (attempt < maxAttempts && !ok) {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`GET / failed: ${res.status}`)
        const text = await res.text()
        if (!text.toLowerCase().includes('<!doctype')) throw new Error('index.html not served')
        ok = true
      } catch (e) {
        lastErr = e
        await wait(400)
      }
      attempt++
    }
    if (!ok) throw lastErr || new Error('Server not reachable')
    console.log('Web smoke: OK')
    process.exitCode = 0
  } catch (e) {
    console.error('Web smoke failed:', e.message)
    process.exitCode = 1
  } finally {
    if (!exited) server.kill('SIGTERM')
    await wait(300)
  }
}

main()
