import React from 'react'
import { Link } from 'react-router-dom'
import Hero from '../components/Hero.jsx'
import CarouselSection from '../components/CarouselSection.jsx'
import AuthOverlay from '../components/AuthOverlay.jsx'
import '../assets/css/home.css'

const POSTERS = [
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

function buildSectionData() {
  return POSTERS.map((p, i) => ({
    id: i + 1,
    title: `Tựa phim ${i + 1}`,
    year: 2024 - (i % 5),
    poster: p,
  }))
}

function Home() {
  const [query, setQuery] = React.useState('')
  const data = React.useMemo(() => buildSectionData(), [])
  const filter = React.useCallback(
    (arr) => arr.filter((m) => m.title.toLowerCase().includes(query.toLowerCase().trim())),
    [query],
  )

  const watched = React.useMemo(() => filter(data.slice(0, 12)), [data, filter])
  const movies = React.useMemo(() => filter(data.slice(4, 16)), [data, filter])
  const tv = React.useMemo(() => filter(data.slice(8, 20)), [data, filter])
  const top = React.useMemo(() => filter(data.slice(12, 24)), [data, filter])

  return (
    <>
      {/* HEADER */}
      <header className="header">
        <div className="container row">
          <Link className="logo" to="/" title="Về trang chủ">
            <img src="/doan/assets/img/logo.jpg" alt="logo" className="logo-img" />
            <span>PhimHUB</span>
          </Link>

          <nav className="nav">
            <a href="#">Thể loại</a>
            <Link to="/list">Trending</Link>
            <Link to="/list">Phim lẻ</Link>
            <Link to="/series">Phim bộ</Link>
          </nav>

          <div className="search">
            <span>🔍</span>
            <input
              id="search-input"
              placeholder="Tìm kiếm phim, diễn viên"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <AuthOverlay />
        </div>
      </header>

      <Hero />

      {/* SECTIONS */}
      <main className="sections">
        <CarouselSection title="Phim đã xem" trackId="track-watched" data={watched} />
        <CarouselSection title="Điện ảnh mới" trackId="track-movies" data={movies} />
        <CarouselSection title="TV Show mới" trackId="track-tv" data={tv} />
        <CarouselSection title="TOP Thịnh hành" trackId="track-top" data={top} />
      </main>

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

      {/* Modal auth được render bởi <AuthOverlay /> */}
    </>
  )
}

export default Home


