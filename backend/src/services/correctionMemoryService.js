async function applyCorrections(words, userId, client) {
  if (!userId || words.length === 0) return words

  const correctionsRes = await client.query(
    `SELECT original_word, corrected_word FROM corrections WHERE user_id = $1`,
    [userId]
  )
  const correctionMap = {}
  for (const row of correctionsRes.rows) {
    correctionMap[row.original_word.toLowerCase()] = row.corrected_word
  }

  return words.map((word) => {
    const key = word.word?.toLowerCase()
    const suggestion = correctionMap[key]
    return suggestion
      ? { ...word, suggestionFromProfile: suggestion }
      : word
  })
}

async function saveCorrections(corrections, userId, pool) {
  const client = await pool.connect()
  try {
    for (const correction of corrections) {
      const { originalWord, correctedWord } = correction
      if (!originalWord || !correctedWord || originalWord === correctedWord) continue

      await client.query(
        `INSERT INTO corrections (user_id, original_word, corrected_word, frequency)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (user_id, original_word) DO UPDATE
         SET corrected_word = EXCLUDED.corrected_word,
             frequency = corrections.frequency + 1`,
        [userId, originalWord.toLowerCase(), correctedWord]
      )
    }

    for (const correction of corrections) {
      const { pageId, wordIndex, correctedWord } = correction
      const ocrRes = await client.query(
        `SELECT words_json FROM ocr_results WHERE page_id = $1`, [pageId]
      )
      if (ocrRes.rows.length === 0) continue

      const words = ocrRes.rows[0].words_json || []
      if (words[wordIndex] !== undefined) {
        words[wordIndex] = { ...words[wordIndex], correctedWord }
      }
      await client.query(
        `UPDATE ocr_results SET words_json = $1 WHERE page_id = $2`,
        [JSON.stringify(words), pageId]
      )
    }
  } finally {
    client.release()
  }
}

module.exports = { applyCorrections, saveCorrections }
