// Minimal web smoke test: run a static server and verify /
import { spawn } from 'node:child_process'

const PORT = process.env.WEB_SMOKE_PORT ? Number(process.env.WEB_SMOKE_PORT) : 5174

function wait(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  const server = spawn('npx', ['--yes', 'http-server', '-c-1', '-p', String(PORT), '.'], {
    cwd: new URL('..', import.meta.url).pathname.replace(/\/scripts\/$/, '/'),
    stdio: 'inherit'
  })

  let exited = false
  server.on('exit', () => { exited = true })

  try {
    // give server time to boot
    await wait(800)
    const res = await fetch(`http://127.0.0.1:${PORT}/`)
    if (!res.ok) throw new Error(`GET / failed: ${res.status}`)
    const text = await res.text()
    if (!text.toLowerCase().includes('<!doctype')) throw new Error('index.html not served')
    console.log('Web smoke: OK')
    process.exitCode = 0
  } catch (e) {
    console.error('Web smoke failed:', e.message)
    process.exitCode = 1
  } finally {
    if (!exited) server.kill('SIGTERM')
    await wait(200)
  }
}

main()
