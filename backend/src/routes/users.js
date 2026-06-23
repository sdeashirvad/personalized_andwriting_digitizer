const express = require('express')
const pool = require('../db/pool')

const router = express.Router()

router.post('/', async (req, res) => {
  const { username } = req.body
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' })
  }
  const trimmed = username.trim()
  if (trimmed.length < 2 || trimmed.length > 32) {
    return res.status(400).json({ error: 'Username must be 2–32 characters' })
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return res.status(400).json({ error: 'Username may only contain letters, numbers, underscores, and hyphens' })
  }

  try {
    const existing = await pool.query(
      `SELECT id, username, created_at FROM users WHERE LOWER(username) = LOWER($1)`,
      [trimmed]
    )
    if (existing.rows.length > 0) {
      const u = existing.rows[0]
      return res.json({ id: u.id, username: u.username, createdAt: u.created_at })
    }

    const { v4: uuidv4 } = require('uuid')
    const id = uuidv4()
    const result = await pool.query(
      `INSERT INTO users (id, username) VALUES ($1, $2) RETURNING id, username, created_at`,
      [id, trimmed]
    )
    const u = result.rows[0]
    res.status(201).json({ id: u.id, username: u.username, createdAt: u.created_at })
  } catch (err) {
    console.error('Create user error:', err)
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already taken' })
    }
    res.status(500).json({ error: 'Failed to create user' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, created_at FROM users WHERE id = $1`,
      [req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' })
    const u = result.rows[0]
    res.json({ id: u.id, username: u.username, createdAt: u.created_at })
  } catch (err) {
    console.error('Fetch user error:', err)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

router.patch('/:id', async (req, res) => {
  const { username } = req.body
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required' })
  }
  const trimmed = username.trim()
  if (trimmed.length < 2 || trimmed.length > 32) {
    return res.status(400).json({ error: 'Username must be 2–32 characters' })
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return res.status(400).json({ error: 'Username may only contain letters, numbers, underscores, and hyphens' })
  }

  try {
    const conflict = await pool.query(
      `SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id != $2`,
      [trimmed, req.params.id]
    )
    if (conflict.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' })
    }

    const result = await pool.query(
      `UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, created_at`,
      [trimmed, req.params.id]
    )
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' })
    const u = result.rows[0]
    res.json({ id: u.id, username: u.username, createdAt: u.created_at })
  } catch (err) {
    console.error('Update user error:', err)
    res.status(500).json({ error: 'Failed to update username' })
  }
})

router.get('/:id/stats', async (req, res) => {
  try {
    const [docsRes, pagesRes, correctionsRes, exportedRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM documents WHERE user_id = $1`, [req.params.id]),
      pool.query(
        `SELECT COUNT(p.*) FROM pages p
         JOIN documents d ON d.id = p.document_id
         WHERE d.user_id = $1`,
        [req.params.id]
      ),
      pool.query(`SELECT COUNT(*) FROM corrections WHERE user_id = $1`, [req.params.id]),
      pool.query(
        `SELECT COUNT(*) FROM documents WHERE user_id = $1 AND status = 'EXPORTED'`,
        [req.params.id]
      ),
    ])

    res.json({
      documentsUploaded: parseInt(docsRes.rows[0].count),
      pagesProcessed: parseInt(pagesRes.rows[0].count),
      correctionsLearned: parseInt(correctionsRes.rows[0].count),
      documentsExported: parseInt(exportedRes.rows[0].count),
    })
  } catch (err) {
    console.error('Stats error:', err)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

module.exports = router
