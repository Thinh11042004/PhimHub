import React from 'react'
import { useParams, Link } from 'react-router-dom'
import '../assets/css/detail.css'

function Detail() {
  const { id } = useParams()

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <nav style={{ marginBottom: 12 }}>
        <Link to="/">← Về Trang chủ</Link>
      </nav>
      <h1>Chi tiết phim #{id}</h1>
      <div className="layout-2col">
        <div>
          <div className="banner-slim" />
          <div className="info" style={{ marginTop: 16 }}>
            <div className="chips">
              <div className="chip">2024</div>
              <div className="chip">Khoa học</div>
              <div className="chip">Viễn tưởng</div>
            </div>
            <p className="muted" style={{ marginTop: 10 }}>Mô tả ngắn về phim. Sẽ nối API sau.</p>
            <div className="player-controls">
              <button className="control-btn active">Tập 1</button>
              <button className="control-btn">Tập 2</button>
              <button className="control-btn">Tập 3</button>
            </div>
          </div>
        </div>
        <aside className="sidebar">
          <button className="side-btn">👍 Thích</button>
          <button className="side-btn">➕ Thêm playlist</button>
          <button className="side-btn">⤓ Tải xuống</button>
        </aside>
      </div>
    </div>
  )
}

export default Detail


