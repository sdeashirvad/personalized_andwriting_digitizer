const express = require('express')
const pool = require('../db/pool')
const fs = require('fs')
const path = require('path')

const router = express.Router()

router.get('/:pageId/image', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT image_path FROM pages WHERE id = $1`, [req.params.pageId]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'Page not found' })

    const imagePath = result.rows[0].image_path
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: 'Image file not found' })
    }

    const ext = path.extname(imagePath).toLowerCase()
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
    }
    const mimeType = mimeTypes[ext] || 'image/jpeg'
    res.setHeader('Content-Type', mimeType)
    res.sendFile(imagePath)
  } catch (error) {
    console.error('Image serve error:', error)
    res.status(500).json({ error: 'Failed to serve image' })
  }
})

module.exports = router
