require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const { initSchema } = require('./db/schema')
const documentsRouter = require('./routes/documents')
const pagesRouter = require('./routes/pages')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: '*' }))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.use('/api/documents', documentsRouter)
app.use('/api/pages', pagesRouter)

app.use(errorHandler)

async function start() {
  try {
    await initSchema()
    app.listen(PORT, 'localhost', () => {
      console.log(`Backend server running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

start()
