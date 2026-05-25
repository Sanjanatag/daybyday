import mongoose from 'mongoose'

/** Reuse one connection across serverless invocations (required on Vercel). */
export async function connectDb(uri) {
  if (!uri) {
    throw new Error('Missing MONGODB_URI')
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  const g = globalThis
  if (!g._mongooseCache) {
    g._mongooseCache = { promise: null }
  }

  if (!g._mongooseCache.promise) {
    mongoose.set('strictQuery', true)
    g._mongooseCache.promise = mongoose
      .connect(uri)
      .then((conn) => {
        console.log('MongoDB connected')
        return conn
      })
      .catch((err) => {
        g._mongooseCache.promise = null
        throw err
      })
  }

  await g._mongooseCache.promise
  return mongoose.connection
}
