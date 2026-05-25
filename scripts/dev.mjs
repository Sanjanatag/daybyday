import 'dotenv/config'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const node = process.execPath
const viteBin = join(root, 'node_modules', 'vite', 'bin', 'vite.js')

const children = []

const apiHealthUrl = process.env.API_HEALTH_URL
const devServerUrl = process.env.VITE_DEV_SERVER_URL
const devServerPort = process.env.VITE_DEV_SERVER_PORT
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET

if (!apiHealthUrl || !devServerUrl || !devServerPort || !apiProxyTarget) {
  console.error(
    'Missing dev env vars. Copy .env.example to .env and set API_HEALTH_URL, VITE_DEV_SERVER_URL, VITE_DEV_SERVER_PORT, VITE_API_PROXY_TARGET.',
  )
  process.exit(1)
}

function start(name, args) {
  const child = spawn(node, args, {
    cwd: root,
    stdio: 'inherit',
    env: process.env,
  })
  child.on('exit', (code, signal) => {
    if (signal) return
    if (code !== 0 && code !== null) {
      console.error(`[${name}] exited with code ${code}`)
      shutdown(code ?? 1)
    }
  })
  children.push(child)
  return child
}

function shutdown(code = 0) {
  for (const c of children) {
    if (!c.killed) c.kill()
  }
  process.exit(code)
}

async function waitForApi(maxMs = 90_000) {
  const start = Date.now()
  process.stdout.write('[dev] Waiting for API + MongoDB')

  while (Date.now() - start < maxMs) {
    try {
      const res = await fetch(apiHealthUrl)
      if (res.ok) {
        process.stdout.write('\n')
        return true
      }
    } catch {
      /* API not up yet */
    }
    process.stdout.write('.')
    await new Promise((r) => setTimeout(r, 500))
  }
  process.stdout.write('\n')
  return false
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

console.log('[dev] Starting API first, then Vite…')
console.log(`[dev] API: ${apiProxyTarget}`)
console.log(`[dev] App: ${devServerUrl}/\n`)

start('api', [join(root, 'server', 'index.js')])

const ready = await waitForApi()
if (!ready) {
  console.error(
    '[dev] API did not become ready in time. Check MONGODB_URI / Atlas network access, then retry.',
  )
  shutdown(1)
}

console.log('[dev] API ready — starting Vite…\n')
start('web', [viteBin, '--port', devServerPort, '--strictPort'])
