const express = require('express')
const { series } = require('./data.cjs')
const router = express.Router()

router.get('/series', (req, res) => {
  res.json(series)
})

router.get('/series/:id', (req, res) => {
  const id = String(req.params.id)
  const found = series.find((s) => s.id === id)
  if (!found) return res.status(404).json({ error: 'Not found' })
  res.json(found)
})

router.get('/series/:id/seasons', (req, res) => {
  const id = String(req.params.id)
  const found = series.find((s) => s.id === id)
  if (!found) return res.status(404).json({ error: 'Not found' })
  const seasons = (found.seasons || []).map((s, si) => ({
    season: s.season,
    episodes: Array.from({ length: s.episodes }).map((_, ei) => ({
      id: `e_${id}_${s.season}_${ei + 1}`,
      seriesId: id,
      season: s.season,
      episode: ei + 1,
      title: `Tập ${ei + 1}`,
      durationMin: 45,
    })),
  }))
  res.json({ seriesId: id, seasons })
})

router.get('/series/:seriesId/episodes/:episodeId/sources', (req, res) => {
  res.json({
    sources: [
      { server: 'SV1', quality: '1080p', url: 'https://example.com/ep1080.mp4' },
      { server: 'SV2', quality: '720p', url: 'https://example.com/ep720.mp4' },
    ],
  })
})

module.exports = router


