import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { connectDb } from './db.js'
import profileRoutes from './routes/profile.js'

const PORT = Number(process.env.PORT)
const HOST = process.env.HOST
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env')
  process.exit(1)
}
if (!HOST) {
  console.error('Missing HOST in .env')
  process.exit(1)
}
if (!PORT) {
  console.error('Missing PORT in .env')
  process.exit(1)
}

const app = express()
app.use(cors({ origin: true }))
app.use(express.json({ limit: '2mb' }))

function dbReady() {
  return mongoose.connection.readyState === 1
}

app.get('/api/health', (_req, res) => {
  if (!dbReady()) {
    return res.status(503).json({ ok: false, db: 'connecting' })
  }
  res.json({ ok: true })
})

app.use('/api/profile', (req, res, next) => {
  if (!dbReady()) {
    return res.status(503).json({ error: 'Database still connecting — retry in a moment' })
  }
  next()
}, profileRoutes)

const server = app.listen(PORT, HOST, () => {
  console.log(`API listening on http://${HOST}:${PORT}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\nPort ${PORT} is already in use (another server is still running).\n` +
        `Fix: close the other terminal, or run:\n` +
        `  Get-NetTCPConnection -LocalPort ${PORT} | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }\n` +
        `Or change PORT in .env and restart.\n`,
    )
    process.exit(1)
  }
  throw err
})

try {
  console.log('Connecting to MongoDB…')
  await connectDb(MONGODB_URI)
} catch (err) {
  console.error('MongoDB connection failed:', err.message)
  process.exit(1)
}
