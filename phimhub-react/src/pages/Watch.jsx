import React from 'react'
import { Link, useParams } from 'react-router-dom'
import '../assets/css/watch.css'

function Watch() {
  const { id } = useParams()
  const videoRef = React.useRef(null)
  const [activeTab, setActiveTab] = React.useState('eps') // 'eps' | 'cmt'
  const [servers] = React.useState(['SV1', 'SV2', 'VIP'])
  const [qualities] = React.useState(['1080p', '720p'])
  const [server, setServer] = React.useState('SV1')
  const [quality, setQuality] = React.useState('1080p')

  const [comments, setComments] = React.useState([])
  const [cmtText, setCmtText] = React.useState('')

  function clickPlayPause() {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play()
    else v.pause()
  }

  function seekBy(sec) {
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.max(0, v.currentTime + sec)
  }

  function toggleFullscreen() {
    const v = videoRef.current
    if (!v) return
    if (document.fullscreenElement) document.exitFullscreen()
    else v.requestFullscreen?.()
  }

  function onSendComment() {
    const text = cmtText.trim()
    if (!text) return
    const titleId = id?.startsWith('m_') || id?.startsWith('s_') ? id : `m_${id || '1'}`
    fetch(`/api/titles/${titleId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
      .then((r) => r.json())
      .then((item) => {
        if (item && item.id) setComments((prev) => [item, ...prev])
        setCmtText('')
      })
      .catch(() => {
        // fallback local append
        setComments((prev) => [{ id: Date.now(), text }, ...prev])
        setCmtText('')
      })
  }

  // Load movie sources and suggestions
  React.useEffect(() => {
    const controller = new AbortController()
    const movieId = id?.startsWith('m_') ? id : `m_${id || '1'}`
    fetch(`/api/movies/${movieId}/sources`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json.sources)) {
          const ss = json.sources.map((s) => s.server)
          const qq = json.sources.map((s) => s.quality)
          if (ss.length) setServer(ss[0])
          if (qq.length) setQuality(qq[0])
        }
      })
      .catch(() => {})
    return () => controller.abort()
  }, [id])

  // Load comments
  React.useEffect(() => {
    const controller = new AbortController()
    const titleId = id?.startsWith('m_') || id?.startsWith('s_') ? id : `m_${id || '1'}`
    fetch(`/api/titles/${titleId}/comments`, { signal: controller.signal })
      .then((r) => r.json())
      .then((json) => setComments(json.items || []))
      .catch(() => {})
    return () => controller.abort()
  }, [id])

  return (
    <>
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
            <Link to="/list">Phim bộ</Link>
          </nav>
          <div className="search">
            <span>🔍</span>
            <input placeholder="Tìm kiếm phim, diễn viên" />
          </div>
        </div>
      </header>

      <section className="container">
        <div className="player-card">
          <video ref={videoRef} className="player" controls preload="metadata" poster="/doan/assets/img/phimbomoi1.jpg">
            <source id="video-source" src="" type="video/mp4" />
            Trình duyệt không hỗ trợ video.
          </video>
          <div className="player-toolbar">
            <button className="i-btn" title="Play/Pause" onClick={clickPlayPause}>▶</button>
            <button className="i-btn" title="Tua lùi 10s" onClick={() => seekBy(-10)}>⏪ 10s</button>
            <button className="i-btn" title="Tua tới 10s" onClick={() => seekBy(10)}>⏩ 10s</button>
            <span className="spacer"></span>
            <button className="i-btn" title="Cài đặt">⚙</button>
            <button className="i-btn" title="Toàn màn hình" onClick={toggleFullscreen}>⤢</button>
          </div>
        </div>
      </section>

      <main className="container watch">
        <aside className="left">
          <div className="poster">
            <img src="/doan/assets/img/phimbomoi1.jpg" alt="poster" />
          </div>
          <h3>Bố già 2</h3>
          <div className="meta-line">
            <span className="badge">3h 22m</span>
            <span className="badge">1974</span>
            <span className="badge">T16</span>
          </div>
          <div className="taglist">
            <span className="pill">Tội phạm</span>
            <span className="pill">Chính kịch</span>
          </div>
          <div className="about">
            <p>Mô tả phim ngắn gọn… (demo). Sau này thay bằng dữ liệu API.</p>
          </div>
          <div className="kv">
            <div><span>Quốc gia:</span> <strong>Mỹ</strong></div>
            <div><span>Đạo diễn:</span> <strong>Francis Ford Coppola</strong></div>
            <div><span>Diễn viên:</span> <strong>Al Pacino, Robert De Niro</strong></div>
          </div>
        </aside>

        <section className="right">
          <div className="head">
            <div className="imdb-wrap">
              <span>Quá uy tín cỡ IMDB</span>
              <span className="imdb">IMDb 8.7</span>
            </div>
            <div className="actions">
              <button className="btn icon" title="Đánh giá">⭐</button>
              <button className="btn icon" title="Yêu thích">♡</button>
              <button className="btn icon" title="Thêm vào DS">➕</button>
              <button className="btn icon" title="Chia sẻ">🔗</button>
            </div>
          </div>

          <div className="tabs">
            <button className={`tab${activeTab==='eps'?' active':''}`} onClick={()=>setActiveTab('eps')}>Danh sách tập</button>
            <button className={`tab${activeTab==='cmt'?' active':''}`} onClick={()=>setActiveTab('cmt')}>Bình luận</button>
          </div>

          {activeTab === 'eps' && (
            <div className="panel">
              <h4>Các bản chiếu</h4>
              <div className="servers">
                <div className="server-head">Server</div>
                <div className="server-chips">
                  {servers.map((s)=> (
                    <button key={s} className={`chip${server===s?' active':''}`} onClick={()=>setServer(s)}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="qualities">
                <div className="server-head">Chất lượng</div>
                <div className="quality-chips">
                  {qualities.map((q)=> (
                    <button key={q} className={`chip${quality===q?' active':''}`} onClick={()=>setQuality(q)}>{q}</button>
                  ))}
                </div>
              </div>
              <div className="note">* Nếu không phát được, đổi sang server khác.</div>
              <h4>Đề xuất</h4>
              <div className="suggest-grid"></div>
            </div>
          )}

          {activeTab === 'cmt' && (
            <div className="panel">
              <div className="cmt-input">
                <input value={cmtText} onChange={(e)=>setCmtText(e.target.value)} placeholder="Viết bình luận…" />
                <button className="btn primary" onClick={onSendComment}>Gửi</button>
              </div>
              <div className="cmt-list">
                {comments.map(c=> (
                  <div key={c.id} className="comment">{c.text}</div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

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

export default Watch


