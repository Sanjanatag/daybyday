import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { connectDb } from './db.js'
import profileRoutes from './routes/profile.js'

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI')
}

const app = express()
app.use(cors({ origin: true }))
app.use(express.json({ limit: '2mb' }))

function dbReady() {
  return mongoose.connection.readyState === 1
}

app.use(async (_req, res, next) => {
  if (!MONGODB_URI) {
    return res.status(500).json({ error: 'Server missing MONGODB_URI' })
  }
  try {
    await connectDb(MONGODB_URI)
    next()
  } catch (err) {
    console.error('MongoDB error:', err.message)
    res.status(500).json({ error: 'Database connection failed' })
  }
})

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

export default app
