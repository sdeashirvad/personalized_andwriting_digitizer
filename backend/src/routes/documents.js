const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const pool = require('../db/pool')
const { processDocument, getDocumentReview, approveDocument, getDocument, getDocuments } = require('../services/documentService')
const { saveCorrections } = require('../services/correctionMemoryService')
const { exportAsTxt, exportAsMarkdown, exportAsPdf } = require('../services/exportService')

const router = express.Router()

const UPLOADS_DIR = path.join(process.cwd(), '..', 'storage', 'uploads')
const PROCESSED_DIR = path.join(process.cwd(), '..', 'storage', 'processed')

fs.mkdirSync(UPLOADS_DIR, { recursive: true })
fs.mkdirSync(PROCESSED_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `${uuidv4()}${ext}`)
  },
})
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.pdf']
    const ext = path.extname(file.originalname).toLowerCase()
    if (allowed.includes(ext)) cb(null, true)
    else cb(new Error('Invalid file type. Only images and PDFs are allowed.'))
  },
  limits: { fileSize: 50 * 1024 * 1024 },
})

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const userId = req.body.userId || 'user-1'

    await pool.query(
      `INSERT INTO users (id, username) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
      [userId, userId]
    )

    const docRes = await pool.query(
      `INSERT INTO documents (user_id, original_filename, status)
       VALUES ($1, $2, 'UPLOADED') RETURNING *`,
      [userId, req.file.originalname]
    )
    const document = docRes.rows[0]

    const ext = path.extname(req.file.originalname).toLowerCase()
    const imagePath = req.file.path

    await pool.query(
      `INSERT INTO pages (document_id, image_path, page_number)
       VALUES ($1, $2, 1)`,
      [document.id, imagePath]
    )

    setImmediate(() => processDocument(document.id))

    res.status(201).json({
      id: document.id,
      userId: document.user_id,
      originalFilename: document.original_filename,
      uploadTime: document.upload_time,
      status: document.status,
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: error.message || 'Upload failed' })
  }
})

router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId || 'user-1'
    const docs = await getDocuments(userId)
    res.json(docs)
  } catch (error) {
    console.error('List documents error:', error)
    res.status(500).json({ error: 'Failed to list documents' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const doc = await getDocument(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Document not found' })
    res.json(doc)
  } catch (error) {
    console.error('Get document error:', error)
    res.status(500).json({ error: 'Failed to get document' })
  }
})

router.get('/:id/review', async (req, res) => {
  try {
    const review = await getDocumentReview(req.params.id)
    if (!review) return res.status(404).json({ error: 'Document not found' })
    res.json(review)
  } catch (error) {
    console.error('Get review error:', error)
    res.status(500).json({ error: 'Failed to get review data' })
  }
})

router.post('/:id/corrections', async (req, res) => {
  try {
    const { corrections, userId } = req.body
    if (!corrections || !Array.isArray(corrections)) {
      return res.status(400).json({ error: 'corrections must be an array' })
    }
    await saveCorrections(corrections, userId || 'user-1', pool)
    res.json({ success: true, count: corrections.length })
  } catch (error) {
    console.error('Save corrections error:', error)
    res.status(500).json({ error: 'Failed to save corrections' })
  }
})

router.post('/:id/approve', async (req, res) => {
  try {
    const doc = await approveDocument(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Document not found' })
    res.json(doc)
  } catch (error) {
    console.error('Approve document error:', error)
    res.status(500).json({ error: 'Failed to approve document' })
  }
})

router.get('/:id/export/txt', async (req, res) => {
  try {
    const result = await exportAsTxt(req.params.id)
    res.setHeader('Content-Type', result.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    res.send(result.content)
  } catch (error) {
    console.error('Export TXT error:', error)
    res.status(500).json({ error: 'Export failed' })
  }
})

router.get('/:id/export/md', async (req, res) => {
  try {
    const result = await exportAsMarkdown(req.params.id)
    res.setHeader('Content-Type', result.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    res.send(result.content)
  } catch (error) {
    console.error('Export MD error:', error)
    res.status(500).json({ error: 'Export failed' })
  }
})

router.get('/:id/export/pdf', async (req, res) => {
  try {
    const result = await exportAsPdf(req.params.id)
    res.setHeader('Content-Type', result.mimeType)
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
    res.sendFile(result.filePath)
  } catch (error) {
    console.error('Export PDF error:', error)
    res.status(500).json({ error: 'Export failed' })
  }
})

module.exports = router
