import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

function paginate(items, size) {
  const pages = []
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size))
  }
  return pages
}

function Card({ movie }) {
  return (
    <Link className="card" to={`/detail/${movie.id}`}>
      <div className="poster">
        <img src={movie.poster} alt="poster" />
      </div>
      <div className="info">
        <div className="title">{movie.title}</div>
        <div className="meta">{movie.year}</div>
      </div>
    </Link>
  )
}

function CarouselSection({ title, trackId, data }) {
  const pages = useMemo(() => paginate(data, 5), [data])
  const [page, setPage] = useState(0)

  const current = pages[page] || []

  return (
    <section className="section">
      <div className="row-center">
        <div className="carousel">
          <div className="head">
            <h2 className="h2">{title}</h2>
          </div>
          <button className="ctrl left" onClick={() => setPage((p) => (p - 1 + pages.length) % pages.length)}>
            ‹
          </button>
          <div className="track" id={trackId}>
            {current.map((m) => (
              <Card key={m.id} movie={m} />
            ))}
          </div>
          <button className="ctrl right" onClick={() => setPage((p) => (p + 1) % pages.length)}>
            ›
          </button>
        </div>
      </div>
    </section>
  )
}

export default CarouselSection


