const pool = require('../db/pool')
const fs = require('fs')
const path = require('path')

const EXPORTS_DIR = path.join(process.cwd(), '..', 'storage', 'exports')

async function getDocumentText(documentId) {
  const pagesRes = await pool.query(
    `SELECT p.page_number, o.raw_text, o.words_json
     FROM pages p
     LEFT JOIN ocr_results o ON o.page_id = p.id
     WHERE p.document_id = $1
     ORDER BY p.page_number`,
    [documentId]
  )

  const docRes = await pool.query(
    `SELECT original_filename FROM documents WHERE id = $1`, [documentId]
  )
  const title = docRes.rows[0]?.original_filename || 'Document'

  return { title, pages: pagesRes.rows }
}

function buildPageText(page) {
  const words = page.words_json || []
  if (words.length > 0) {
    return words.map((w) => w.correctedWord || w.word || '').join(' ')
  }
  return page.raw_text || ''
}

async function exportAsTxt(documentId) {
  const { title, pages } = await getDocumentText(documentId)
  let content = `${title}\n${'='.repeat(title.length)}\n\n`
  for (const page of pages) {
    content += `--- Page ${page.page_number} ---\n`
    content += buildPageText(page) + '\n\n'
  }
  const filePath = path.join(EXPORTS_DIR, `${documentId}.txt`)
  fs.mkdirSync(EXPORTS_DIR, { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
  await recordExport(documentId, 'TXT', filePath)
  return { filePath, content, mimeType: 'text/plain', filename: `${title}.txt` }
}

async function exportAsMarkdown(documentId) {
  const { title, pages } = await getDocumentText(documentId)
  let content = `# ${title}\n\n`
  for (const page of pages) {
    content += `## Page ${page.page_number}\n\n`
    content += buildPageText(page) + '\n\n'
    content += '---\n\n'
  }
  const filePath = path.join(EXPORTS_DIR, `${documentId}.md`)
  fs.mkdirSync(EXPORTS_DIR, { recursive: true })
  fs.writeFileSync(filePath, content, 'utf8')
  await recordExport(documentId, 'MD', filePath)
  return { filePath, content, mimeType: 'text/markdown', filename: `${title}.md` }
}

async function exportAsPdf(documentId) {
  const { title, pages } = await getDocumentText(documentId)

  let textContent = `${title}\n\n`
  for (const page of pages) {
    textContent += `Page ${page.page_number}:\n`
    textContent += buildPageText(page) + '\n\n'
  }

  const pdfHeader = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj

2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj

`
  const sanitizedText = textContent.replace(/[()\\]/g, '\\$&')
  const lines = sanitizedText.split('\n').slice(0, 50)
  let yPos = 750
  let streamContent = 'BT\n/F1 12 Tf\n'
  for (const line of lines) {
    streamContent += `72 ${yPos} Td (${line}) Tj\n`
    yPos -= 18
    if (yPos < 50) break
  }
  streamContent += 'ET'

  const stream = streamContent
  const page = `3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792]
   /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj

4 0 obj
<< /Length ${stream.length} >>
stream
${stream}
endstream
endobj

5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj

`
  const xrefOffset = (pdfHeader + page).length
  const pdfContent = `${pdfHeader}${page}xref
0 6
0000000000 65535 f 
${String(pdfHeader.length).padStart(10, '0')} 00000 n 
0000000000 00000 n 
0000000000 00000 n 
0000000000 00000 n 
0000000000 00000 n 

trailer
<< /Size 6 /Root 1 0 R >>
startxref
${xrefOffset}
%%EOF`

  const filePath = path.join(EXPORTS_DIR, `${documentId}.pdf`)
  fs.mkdirSync(EXPORTS_DIR, { recursive: true })
  fs.writeFileSync(filePath, pdfContent)
  await recordExport(documentId, 'PDF', filePath)
  return { filePath, mimeType: 'application/pdf', filename: `${title}.pdf` }
}

async function recordExport(documentId, fileType, filePath) {
  await pool.query(
    `INSERT INTO export_files (document_id, file_type, file_path)
     VALUES ($1, $2, $3)`,
    [documentId, fileType, filePath]
  )
  await pool.query(
    `UPDATE documents SET status = 'EXPORTED' WHERE id = $1`,
    [documentId]
  )
}

module.exports = { exportAsTxt, exportAsMarkdown, exportAsPdf }
