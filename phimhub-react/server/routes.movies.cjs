const express = require('express')
const { movies } = require('./data.cjs')
const router = express.Router()

router.get('/movies', (req, res) => {
  res.json(movies)
})

router.get('/movies/:id', (req, res) => {
  const id = String(req.params.id)
  const found = movies.find((m) => m.id === id)
  if (!found) return res.status(404).json({ error: 'Not found' })
  res.json(found)
})

router.get('/movies/:id/sources', (req, res) => {
  const id = String(req.params.id)
  const found = movies.find((m) => m.id === id)
  if (!found) return res.status(404).json({ error: 'Not found' })
  res.json({ id, sources: [
    { server: 'SV1', quality: '1080p', url: 'https://example.com/video1080.mp4' },
    { server: 'SV2', quality: '720p', url: 'https://example.com/video720.mp4' },
  ], suggest: movies.slice(0, 6) })
})

module.exports = router


