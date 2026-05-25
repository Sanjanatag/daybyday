import 'dotenv/config'
import app from './app.js'

const PORT = Number(process.env.PORT)
const HOST = process.env.HOST

if (!HOST) {
  console.error('Missing HOST in .env')
  process.exit(1)
}
if (!PORT) {
  console.error('Missing PORT in .env')
  process.exit(1)
}

const server = app.listen(PORT, HOST, () => {
  console.log(`API listening on http://${HOST}:${PORT}`)
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\nPort ${PORT} is already in use.\n` +
        `Close the other process or change PORT in .env.\n`,
    )
    process.exit(1)
  }
  throw err
})
