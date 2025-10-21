
import React from 'react'
import { Link } from 'react-router-dom'
import '../assets/css/upload-series.css'

function UploadSeries() {
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
            <input placeholder="Tìm kiếm phim, diễn viên" />
          </div>
        </div>
      </header>

      {/* LAYOUT */}
      <main className="container upload-layout">
        {/* LEFT: FORM UPLOAD SERIES */}
        <section className="upload-card">
          <div className="upload-head"><h2 className="h2">Tải Phim bộ</h2></div>

          <div className="grid-2">
            <div className="input-wrap"><input className="input" placeholder="Tên phim" /></div>
            <div className="input-wrap"><input className="input" placeholder="Tên phim bản gốc" /></div>

            <div className="input-pill">
              <input className="input" placeholder="Diễn viên đã chọn" />
              <button type="button" className="pill-x">×</button>
            </div>
            <div className="input-combo">
              <input className="input" placeholder="Nhập diễn viên" />
              <button type="button" className="pill-add">＋</button>
            </div>

            <div className="input-pill">
              <input className="input" placeholder="Đạo diễn đã chọn" />
              <button type="button" className="pill-x">×</button>
            </div>
            <div className="input-combo">
              <input className="input" placeholder="Nhập đạo diễn" />
              <button type="button" className="pill-add">＋</button>
            </div>

            <div className="grid-3 xs-grid-1">
              <div className="input-combo">
                <input className="input" type="number" min="1" placeholder="Số lượng phần (season)" />
                <button type="button" className="pill-x">×</button>
              </div>
              <select className="input"><option value="">Nhập năm</option></select>
              <input className="input" placeholder="Nhập Quốc gia" />
            </div>

            <div className="grid-2 xs-grid-1">
              <div className="input-combo">
                <input className="input" placeholder="Nhập nhà sản xuất" />
                <button type="button" className="pill-x">×</button>
              </div>
              <div className="input-combo">
                <input className="input" placeholder="Gợi ý số tập/mùa (VD: 12)" />
                <button type="button" className="pill-x">×</button>
              </div>
            </div>
          </div>

          <div className="chips-area"><div className="chips-title">Lứa tuổi</div><div className="chips"></div></div>
          <div className="chips-area"><div className="chips-title">Thể loại</div><div className="chips"></div></div>
          <div className="chips-area"><div className="chips-title">Chất lượng</div><div className="chips"></div></div>

          <div className="input-wrap">
            <textarea className="input textarea" placeholder="Nhập mô tả chi tiết"></textarea>
          </div>

          <div className="media-grid">
            <div>
              <img className="media" src="/doan/assets/img/phimbomoi1.jpg" alt="poster" />
              <label className="btn" htmlFor="posterFile">🖼️ Tải poster  phim</label>
              <input id="posterFile" type="file" accept="image/*" hidden />
            </div>
            <div>
              <img className="media" src="/doan/assets/img/dienanhmoi1.jpg" alt="backdrop" />
              <label className="btn" htmlFor="backdropFile">🖼️ Tải ảnh nền  phim</label>
              <input id="backdropFile" type="file" accept="image/*" hidden />
            </div>
          </div>

          <div className="series-builder">
            <div className="row gap between">
              <h3 className="h3" style={{ margin: '8px 0' }}>Danh sách phần & tập</h3>
              <div className="row gap">
                <button className="btn">Tạo phần theo số lượng</button>
                <button className="btn">+ Thêm phần</button>
              </div>
            </div>
            <div className="seasons-area"></div>
          </div>

          <div className="center">
            <button className="btn primary xl">👍 Xác nhận upload</button>
          </div>
        </section>

        {/* RIGHT: SIDEBAR ADMIN */}
        <aside className="admin-side">
          <Link className="sbtn" to="/profile">👤 Tài khoản</Link>
          <Link className="sbtn" to="/upload/movie">🎬 Tải Phim lẻ mới</Link>
          <Link className="sbtn active" to="/upload/series">📺 Tải Phim bộ mới</Link>
          <Link className="sbtn" to="/admin/genres">🧩 Chỉnh thể loại phim</Link>
          <Link className="sbtn" to="/admin/users">👥 Quản lý người dùng</Link>
          <Link className="sbtn" to="/">🏠 Trang chủ</Link>
          <button className="btn block danger mt">Đăng xuất</button>
        </aside>
      </main>

      <footer className="footer">
        <div className="cols">
          <Link className="logo" to="/"><img src="/doan/assets/img/logo.jpg" className="logo-img small" />
            <span>PhimHUB</span></Link>
          <div className="links"><a href="#">Liên hệ</a><a href="#">Giới thiệu</a><a href="#">Điều khoản</a><a href="#">Hỏi đáp</a></div>
        </div>
        <p className="desc">PhimHUB — Nơi xem phim cho những người tài chính eo hẹp…</p>
      </footer>
    </>
  )
}

export default UploadSeries


