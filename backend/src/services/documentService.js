const pool = require('../db/pool')
const { runOcr } = require('./ocrService')
const { applyCorrections } = require('./correctionMemoryService')
const fs = require('fs')
const path = require('path')

const PROCESSED_DIR = path.join(process.cwd(), '..', 'storage', 'processed')

async function processDocument(documentId) {
  const client = await pool.connect()
  try {
    await client.query(`UPDATE documents SET status = 'PROCESSING' WHERE id = $1`, [documentId])

    const pagesRes = await client.query(
      `SELECT * FROM pages WHERE document_id = $1 ORDER BY page_number`,
      [documentId]
    )

    if (pagesRes.rows.length === 0) {
      await client.query(`UPDATE documents SET status = 'FAILED' WHERE id = $1`, [documentId])
      return
    }

    const docRes = await client.query(`SELECT user_id FROM documents WHERE id = $1`, [documentId])
    const userId = docRes.rows[0]?.user_id

    for (const page of pagesRes.rows) {
      const ocrResult = await runOcr(page.image_path)
      const words = ocrResult.words || []

      const enrichedWords = await applyCorrections(words, userId, client)

      const confidence = enrichedWords.length > 0
        ? enrichedWords.reduce((sum, w) => sum + (w.confidence || 0), 0) / enrichedWords.length
        : 0

      await client.query(
        `DELETE FROM ocr_results WHERE page_id = $1`,
        [page.id]
      )
      await client.query(
        `INSERT INTO ocr_results (page_id, raw_text, confidence, words_json)
         VALUES ($1, $2, $3, $4)`,
        [page.id, ocrResult.raw_text || '', confidence, JSON.stringify(enrichedWords)]
      )
    }

    await client.query(`UPDATE documents SET status = 'AWAITING_REVIEW' WHERE id = $1`, [documentId])
    console.log(`Document ${documentId} processed successfully`)
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error)
    await client.query(`UPDATE documents SET status = 'FAILED' WHERE id = $1`, [documentId])
  } finally {
    client.release()
  }
}

async function getDocumentReview(documentId) {
  const docRes = await pool.query(
    `SELECT * FROM documents WHERE id = $1`, [documentId]
  )
  if (docRes.rows.length === 0) return null

  const pagesRes = await pool.query(
    `SELECT p.*, o.id AS ocr_id, o.raw_text, o.confidence, o.words_json
     FROM pages p
     LEFT JOIN ocr_results o ON o.page_id = p.id
     WHERE p.document_id = $1
     ORDER BY p.page_number`,
    [documentId]
  )

  const pages = pagesRes.rows.map((row) => ({
    page: {
      id: row.id,
      documentId: row.document_id,
      imagePath: row.image_path,
      pageNumber: row.page_number,
    },
    ocrResult: {
      id: row.ocr_id,
      pageId: row.id,
      rawText: row.raw_text || '',
      confidence: parseFloat(row.confidence) || 0,
      words: row.words_json || [],
    },
  }))

  return {
    document: formatDocument(docRes.rows[0]),
    pages,
  }
}

async function approveDocument(documentId) {
  const res = await pool.query(
    `UPDATE documents SET status = 'REVIEWED' WHERE id = $1 RETURNING *`,
    [documentId]
  )
  return res.rows[0] ? formatDocument(res.rows[0]) : null
}

async function getDocument(documentId) {
  const res = await pool.query(`SELECT * FROM documents WHERE id = $1`, [documentId])
  return res.rows[0] ? formatDocument(res.rows[0]) : null
}

async function getDocuments(userId) {
  const res = await pool.query(
    `SELECT * FROM documents WHERE user_id = $1 ORDER BY upload_time DESC`,
    [userId]
  )
  return res.rows.map(formatDocument)
}

function formatDocument(row) {
  return {
    id: row.id,
    userId: row.user_id,
    originalFilename: row.original_filename,
    uploadTime: row.upload_time,
    status: row.status,
  }
}

module.exports = { processDocument, getDocumentReview, approveDocument, getDocument, getDocuments }
