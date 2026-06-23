require('dotenv').config()
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const path = require('path')
const fs = require('fs')
const { initSchema } = require('./db/schema')
const documentsRouter = require('./routes/documents')
const pagesRouter = require('./routes/pages')
const usersRouter = require('./routes/users')
const errorHandler = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || process.env.SERVER_PORT || 3001

app.use(cors({ origin: '*' }))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.get('/health', (req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() })
)

app.use('/api/users', usersRouter)
app.use('/api/documents', documentsRouter)
app.use('/api/pages', pagesRouter)

// Serve frontend static assets in production
const distPath = path.join(__dirname, '..', '..', 'frontend', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(distPath, 'index.html'))
    }
  })
}

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
