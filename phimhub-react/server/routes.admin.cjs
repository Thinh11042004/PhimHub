const express = require('express')
const { genres } = require('./data.cjs')
const router = express.Router()

router.get('/admin/genres', (req, res) => res.json(genres))
router.post('/admin/genres', (req, res) => {
  const name = (req.body.name || '').trim()
  if (!name) return res.status(400).json({ error: 'name required' })
  const item = { id: 'g_' + Date.now(), name }
  genres.push(item)
  res.status(201).json(item)
})
router.patch('/admin/genres/:id', (req, res) => {
  const id = String(req.params.id)
  const name = (req.body.name || '').trim()
  const idx = genres.findIndex((g) => g.id === id)
  if (idx < 0) return res.status(404).json({ error: 'Not found' })
  if (name) genres[idx].name = name
  res.json(genres[idx])
})
router.delete('/admin/genres/:id', (req, res) => {
  const id = String(req.params.id)
  const idx = genres.findIndex((g) => g.id === id)
  if (idx < 0) return res.status(404).json({ error: 'Not found' })
  const [removed] = genres.splice(idx, 1)
  res.json(removed)
})

module.exports = router


