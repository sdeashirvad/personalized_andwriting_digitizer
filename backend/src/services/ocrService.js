const axios = require('axios')
const fs = require('fs')
const path = require('path')

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || 'http://localhost:8000'

async function runOcr(imagePath) {
  try {
    const imageBuffer = fs.readFileSync(imagePath)
    const base64Image = imageBuffer.toString('base64')
    const ext = path.extname(imagePath).toLowerCase().replace('.', '') || 'png'

    const response = await axios.post(`${OCR_SERVICE_URL}/ocr`, {
      image: base64Image,
      mime_type: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    }, { timeout: 60000 })

    return response.data
  } catch (error) {
    console.error('OCR service error:', error.message)
    return {
      raw_text: '',
      confidence: 0,
      words: [],
      error: error.message,
    }
  }
}

module.exports = { runOcr }
