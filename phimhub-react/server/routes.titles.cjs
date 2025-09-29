const express = require('express')
const { movies, series } = require('./data.cjs')
const router = express.Router()

function searchTitles(list, q) {
  if (!q) return list
  const s = q.toLowerCase()
  return list.filter((t) => t.title.toLowerCase().includes(s))
}

router.get('/titles', (req, res) => {
  const { q, type = 'all', year, age, genre, sort = 'newest', page = 1, pageSize = 24 } = req.query
  let items = [...movies, ...series]
  if (type !== 'all') items = items.filter((t) => t.type === type)
  if (year) items = items.filter((t) => String(t.year) === String(year))
  if (age) items = items.filter((t) => t.age === age)
  if (genre) {
    const g = Array.isArray(genre) ? genre : String(genre).split(',')
    items = items.filter((t) => (t.genres || []).some((x) => g.includes(x)))
  }
  items = searchTitles(items, q)
  switch (sort) {
    case 'updated': items.sort((a, b) => (b.id > a.id ? 1 : -1)); break
    case 'views': items.sort((a, b) => b.views - a.views); break
    case 'rating': items.sort((a, b) => b.rating - a.rating); break
    default: items.sort((a, b) => b.year - a.year)
  }
  const p = Math.max(1, Number(page)); const ps = Math.max(1, Number(pageSize))
  const total = items.length
  const slice = items.slice((p - 1) * ps, (p - 1) * ps + ps)
  res.json({ items: slice, page: p, pageSize: ps, total })
})

module.exports = router


