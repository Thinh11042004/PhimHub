const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/api/health', (req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'dev' })
})

app.use('/api', require('./routes.titles.cjs'))
app.use('/api', require('./routes.movies.cjs'))
app.use('/api', require('./routes.series.cjs'))
app.use('/api', require('./routes.comments.cjs'))
app.use('/api', require('./routes.admin.cjs'))

const port = Number(process.env.PORT || 4000)
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`)
})


