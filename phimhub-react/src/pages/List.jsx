import React from 'react'
import { Link } from 'react-router-dom'
import '../assets/css/list.css'

const ALL_POSTERS = [
  '/doan/assets/img/phimlemoi1.jpg',
  '/doan/assets/img/phimlemoi2.jpg',
  '/doan/assets/img/phimlemoi3.jpg',
  '/doan/assets/img/phimlemoi4.jpg',
  '/doan/assets/img/phimbomoi1.jpg',
  '/doan/assets/img/phimbomoi2.jpg',
  '/doan/assets/img/phimbomoi3.jpg',
  '/doan/assets/img/phimbomoi4.jpg',
  '/doan/assets/img/dienanhmoi1.jpg',
  '/doan/assets/img/dienanhmoi2.jpg',
  '/doan/assets/img/dienanhmoi3.jpg',
  '/doan/assets/img/dienanhmoi4.jpg',
]

function makeData() {
  return Array.from({ length: 60 }).map((_, i) => {
    const poster = ALL_POSTERS[i % ALL_POSTERS.length]
    return {
      id: i + 1,
      title: `Tựa phim ${i + 1}`,
      year: 2024 - (i % 6),
      type: i % 3 === 0 ? 'phimbo' : 'phimle',
      age: ['P', 'K', 'T13', 'T16', 'T18'][i % 5],
      genres: ['Hành động', 'Khoa học', 'Viễn tưởng', 'Hài', 'Tâm lý', 'Tội phạm'].filter((_, gi) => (i + gi) % 2 === 0),
      poster,
      views: Math.floor(Math.random() * 100000),
      rating: (7 + (i % 30) / 10).toFixed(1),
    }
  })
}

function Chip({ active, children, onClick }) {
  return (
    <button className={`chip${active ? ' active' : ''}`} onClick={onClick}>
      {children}
    </button>
  )
}

function List() {
  const dataset = React.useMemo(() => makeData(), [])
  const [query, setQuery] = React.useState('')
  const [type, setType] = React.useState('all')
  const [age, setAge] = React.useState('all')
  const [year, setYear] = React.useState('all')
  const [genres, setGenres] = React.useState(['all'])
  const [sort, setSort] = React.useState('newest')
  const [open, setOpen] = React.useState(true)

  const [page, setPage] = React.useState(0)
  const [pageSize, setPageSize] = React.useState(24)

  const [apiItems, setApiItems] = React.useState(null)

  React.useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (type !== 'all') params.set('type', type)
    if (age !== 'all') params.set('age', age)
    if (year !== 'all') params.set('year', year)
    if (!(genres.length === 1 && genres[0] === 'all')) params.set('genre', genres.join(','))
    params.set('sort', sort)
    params.set('page', String(page + 1))
    params.set('pageSize', String(pageSize))
    fetch(`/api/titles?${params.toString()}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => setApiItems(json.items))
      .catch(() => {})
    return () => controller.abort()
  }, [query, type, age, year, genres, sort, page, pageSize])

  const filtered = React.useMemo(() => {
    let arr = dataset
    const q = query.trim().toLowerCase()
    if (q) arr = arr.filter((m) => m.title.toLowerCase().includes(q))
    if (type !== 'all') arr = arr.filter((m) => m.type === type)
    if (age !== 'all') arr = arr.filter((m) => m.age === age)
    if (year !== 'all') arr = arr.filter((m) => String(m.year) === String(year))
    if (!(genres.length === 1 && genres[0] === 'all')) arr = arr.filter((m) => m.genres.some((g) => genres.includes(g)))
    switch (sort) {
      case 'updated':
        arr = [...arr].sort((a, b) => b.id - a.id)
        break
      case 'views':
        arr = [...arr].sort((a, b) => b.views - a.views)
        break
      case 'rating':
        arr = [...arr].sort((a, b) => Number(b.rating) - Number(a.rating))
        break
      default:
        arr = [...arr].sort((a, b) => b.year - a.year)
    }
    return arr
  }, [dataset, query, type, age, year, genres, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const pageData = React.useMemo(() => {
    if (apiItems) return apiItems.map((m, i) => ({
      id: m.id || `api_${i}`,
      type: m.type || 'movie',
      title: m.title,
      year: m.year,
      poster: m.poster || '/doan/assets/img/phimlemoi1.jpg',
    }))
    return filtered.slice(safePage * pageSize, safePage * pageSize + pageSize)
  }, [apiItems, filtered, safePage, pageSize])

  const years = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017]
  const allGenres = ['Hành động', 'Khoa học', 'Viễn tưởng', 'Hài', 'Tâm lý', 'Tội phạm', 'Kinh dị', 'Hoạt hình', 'Phiêu lưu', 'Chính kịch', 'Bí ẩn', 'Lãng mạn']

  function toggleGenre(g) {
    if (g === 'all') return setGenres(['all'])
    setGenres((curr) => {
      const next = curr.includes('all') ? [] : [...curr]
      const i = next.indexOf(g)
      if (i >= 0) next.splice(i, 1)
      else next.push(g)
      return next.length ? next : ['all']
    })
  }

  function applyFilters() {
    setPage(0)
  }

  return (
    <>
      {/* HEADER LIGHT VERSION */}
      <header className="header">
        <div className="container row">
          <Link className="logo" to="/" title="Về trang chủ">
            <img src="/doan/assets/img/logo.jpg" alt="logo" className="logo-img" />
            <span>PhimHUB</span>
          </Link>
          <nav className="nav">
            <Link to="#">Thể loại</Link>
            <Link to="/list" className="active">Trending</Link>
            <Link to="/list">Phim lẻ</Link>
            <Link to="/list">Phim bộ</Link>
          </nav>
          <div className="search">
            <span>🔍</span>
            <input placeholder="Tìm kiếm phim, diễn viên" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>
      </header>

      {/* TITLE + FILTER TOGGLE */}
      <section className="container titlebar">
        <div className="title-left">
          <span className="emoji">🧾</span>
          <h1>Phim lẻ</h1>
        </div>
        <button id="btn-toggle-filter" className="btn outline" onClick={() => setOpen((o) => !o)}>
          <span>🧰</span> Bộ lọc
        </button>
      </section>

      {/* FILTER PANEL */}
      {open && (
        <section id="filter-panel" className="container filter-card">
          <div className="group">
            <div className="g-title">Loại phim</div>
            <div className="chips" data-key="type">
              <Chip active={type === 'all'} onClick={() => setType('all')}>Tất cả</Chip>
              <Chip active={type === 'phimle'} onClick={() => setType('phimle')}>Phim lẻ</Chip>
              <Chip active={type === 'phimbo'} onClick={() => setType('phimbo')}>Phim bộ</Chip>
            </div>
          </div>

          <div className="group">
            <div className="g-title">Lứa tuổi</div>
            <div className="chips" data-key="age">
              {['all', 'P', 'K', 'T13', 'T16', 'T18'].map((a) => (
                <Chip key={a} active={age === a} onClick={() => setAge(a)}>
                  {a === 'all' ? 'Tất cả' : a}
                </Chip>
              ))}
            </div>
          </div>

          <div className="group">
            <div className="g-title">Năm sản xuất</div>
            <div className="chips" data-key="year">
              <Chip active={year === 'all'} onClick={() => setYear('all')}>Tất cả</Chip>
              {years.map((y) => (
                <Chip key={y} active={String(year) === String(y)} onClick={() => setYear(String(y))}>{y}</Chip>
              ))}
            </div>
          </div>

          <div className="group">
            <div className="g-title">Thể loại</div>
            <div className="chips multi" data-key="genre">
              <Chip active={genres.includes('all')} onClick={() => toggleGenre('all')}>Tất cả</Chip>
              {allGenres.map((g) => (
                <Chip key={g} active={genres.includes(g)} onClick={() => toggleGenre(g)}>
                  {g}
                </Chip>
              ))}
            </div>
          </div>

          <div className="group">
            <div className="g-title">Sắp xếp</div>
            <div className="chips single" data-key="sort">
              {[
                ['newest', 'Mới nhất'],
                ['updated', 'Mới cập nhật'],
                ['views', 'Lượt xem'],
                ['rating', 'Đánh giá'],
              ].map(([k, label]) => (
                <Chip key={k} active={sort === k} onClick={() => setSort(k)}>
                  {label}
                </Chip>
              ))}
            </div>
          </div>

          <div className="group footer-actions">
            <button id="btn-apply" className="btn primary" onClick={applyFilters}>
              Lọc kết quả
            </button>
          </div>
        </section>
      )}

      {/* RESULTS GRID */}
      <section className="container results">
        <div id="grid" className="grid">
          {pageData.map((m) => (
            <Link key={m.id} className="card" to={m.type === 'series' ? `/series/watch/${m.id}` : `/watch/${m.id}`}>
              <div className="poster">
                <img src={m.poster} alt={m.title} />
              </div>
              <div className="info">
                <div className="title">{m.title}</div>
                <div className="meta">{m.year}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* PAGINATION */}
        <div className="pagination">
          <button className="page-btn" id="prev" onClick={() => setPage((p) => Math.max(0, p - 1))}>
            ‹
          </button>
          <div id="pages" className="pages">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} className={`page${i === safePage ? ' active' : ''}`} onClick={() => setPage(i)}>
                {i + 1}
              </button>
            ))}
          </div>
          <button className="page-btn" id="next" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>
            ›
          </button>
          <div className="page-size">
            <span>Nhấp</span>
            {[12, 24, 36].map((s) => (
              <button key={s} className={`badge${pageSize === s ? ' active' : ''}`} data-size={s} onClick={() => { setPageSize(s); setPage(0) }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="cols">
          <Link className="logo" to="/">
            <img src="/doan/assets/img/logo.jpg" alt="logo" className="logo-img small" />
            <span>PhimHUB</span>
          </Link>
          <div className="links">
            <a href="#">Liên hệ</a>
            <a href="#">Giới thiệu</a>
            <a href="#">Điều khoản</a>
            <a href="#">Hỏi đáp</a>
          </div>
        </div>
        <p className="desc">
          PhimHUB - Nơi xem phim cho những người tài chính eo hẹp, tận hưởng thời gian với
          các bộ phim chất lượng như những người không có tài chính eo hẹp.
        </p>
      </footer>
    </>
  )
}

export default List


