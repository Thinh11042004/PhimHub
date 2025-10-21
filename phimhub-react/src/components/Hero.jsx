import React, { useEffect, useMemo, useState } from 'react'

const SLIDES = [
  {
    title: 'Dune: Part Two',
    desc:
      'Hãy theo chân Paul Atreides cùng Chani và người Fremen trên con đường trả thù và cứu lấy nhân loại.',
    badges: ['IMDb 8.7', '2024', 'Khoa học', 'Viễn tưởng'],
    bg: '/doan/assets/img/banner1.jpg',
    thumbs: ['/doan/assets/img/banner1.jpg', '/doan/assets/img/banner2.jpg'],
  },
  {
    title: 'Oppenheimer',
    desc: 'Câu chuyện về J. Robert Oppenheimer và dự án Manhattan.',
    badges: ['IMDb 8.6', '2023', 'Tiểu sử', 'Lịch sử'],
    bg: '/doan/assets/img/banner2.jpg',
    thumbs: ['/doan/assets/img/banner2.jpg', '/doan/assets/img/banner1.jpg'],
  },
]

function Hero({ intervalMs = 6000 }) {
  const [current, setCurrent] = useState(0)
  const slide = useMemo(() => SLIDES[current], [current])

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % SLIDES.length)
    }, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return (
    <section className="hero" id="hero">
      <div className="bg" id="hero-bg" style={{ backgroundImage: `url('${slide.bg}')` }}></div>
      <div className="fade"></div>

      <div className="content">
        <div className="inner">
          <div>
            <h1 id="hero-title">{slide.title}</h1>
            <div className="badges" id="hero-badges">
              {slide.badges.map((b, idx) => (
                <span key={b} className={idx === 0 ? 'imdb' : 'pill'}>
                  {b}
                </span>
              ))}
            </div>
            <p id="hero-desc">{slide.desc}</p>

            <div className="ctas">
              <a className="play" href="/watch" title="Xem">
                ▶
              </a>
              <button className="btn icon-btn" id="btn-like" onClick={() => alert('Đã thêm vào Yêu thích (demo).')}>
                🤍 <span>Yêu thích</span>
              </button>
              <a className="btn icon-btn" href="#sec-de-xuat" title="Mở rộng">
                ☰ <span>Xem đề xuất</span>
              </a>
            </div>
          </div>

          <div className="thumbs" id="thumbs">
            {slide.thumbs.map((t, idx) => (
              <div
                key={t + idx}
                className={`thumb ${idx === 0 ? 'active' : ''}`}
                onClick={() => setCurrent((c) => (c + 1) % SLIDES.length)}
              >
                <img src={t} alt="thumb" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero


