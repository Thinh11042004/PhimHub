const express = require('express')
const { comments } = require('./data.cjs')
const router = express.Router()

router.get('/titles/:id/comments', (req, res) => {
  const id = String(req.params.id)
  const page = Math.max(1, Number(req.query.page || 1))
  const pageSize = Math.max(1, Number(req.query.pageSize || 20))
  const list = comments[id] || []
  const total = list.length
  const slice = list.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
  res.json({ items: slice, page, pageSize, total })
})

router.post('/titles/:id/comments', (req, res) => {
  const id = String(req.params.id)
  const text = (req.body.text || '').trim()
  if (!text) return res.status(400).json({ error: 'text required' })
  const item = { id: 'c_' + Date.now(), text, createdAt: new Date().toISOString(), user: { id: 'u_anon', name: 'Guest' } }
  comments[id] = [item, ...(comments[id] || [])]
  res.status(201).json(item)
})

module.exports = router


