import React, { useCallback, useEffect, useMemo, useState } from 'react'

const DEMO_USER = {
  id: 'u_001',
  email: 'nguoidung@gmail.com',
  username: 'nguoidung',
  name: 'Người dùng 1',
  avatar: '/doan/assets/img/avatar.jpg',
  password: '123456',
  role: 'user',
}
const DEMO_ADMIN = {
  id: 'u_999',
  email: 'admin@gmail.com',
  username: 'admin',
  name: 'Quản trị viên',
  avatar: '/doan/assets/img/avatar.jpg',
  password: '123456',
  role: 'admin',
}
const AUTH_KEYS = ['demo-login', 'user', 'token', 'isLoggedIn', 'loggedIn', 'auth_user', 'profile']

function setAllAuth(found) {
  const user = {
    id: found.id,
    email: found.email,
    username: found.username,
    name: found.name,
    avatar: found.avatar,
    role: found.role,
  }
  const token = 'mock-token-' + Date.now()

  localStorage.setItem('demo-login', '1')
  localStorage.setItem('user', JSON.stringify(user))
  localStorage.setItem('auth_user', JSON.stringify(user))
  localStorage.setItem('profile', JSON.stringify(user))
  localStorage.setItem('token', token)
  localStorage.setItem('isLoggedIn', 'true')
  localStorage.setItem('loggedIn', 'true')

  try {
    sessionStorage.setItem('demo-login', '1')
    sessionStorage.setItem('user', JSON.stringify(user))
    sessionStorage.setItem('auth_user', JSON.stringify(user))
    sessionStorage.setItem('profile', JSON.stringify(user))
    sessionStorage.setItem('token', token)
    sessionStorage.setItem('isLoggedIn', 'true')
    sessionStorage.setItem('loggedIn', 'true')
  } catch {}
}

function clearAllAuth() {
  for (const k of AUTH_KEYS) {
    localStorage.removeItem(k)
    try {
      sessionStorage.removeItem(k)
    } catch {}
  }
}

function useAuthUI() {
  const [logged, setLogged] = useState(false)
  const refresh = useCallback(() => {
    const isLogin = localStorage.getItem('demo-login') === '1' || sessionStorage.getItem('demo-login') === '1'
    setLogged(!!isLogin)
  }, [])
  useEffect(() => {
    refresh()
  }, [refresh])
  return { logged, refresh }
}

function AuthOverlay() {
  const [open, setOpen] = useState(false)
  const [which, setWhich] = useState('login')
  const { logged, refresh } = useAuthUI()

  useEffect(() => {
    document.body.classList.toggle('modal-open', open)
    return () => document.body.classList.remove('modal-open')
  }, [open])

  const doLogin = useCallback(() => {
    const u = document.getElementById('login-username')?.value?.trim()?.toLowerCase()
    const p = document.getElementById('login-password')?.value
    const found = [DEMO_USER, DEMO_ADMIN].find(
      (c) => (u === c.email.toLowerCase() || u === c.username.toLowerCase()) && p === c.password,
    )
    const err = document.getElementById('login-error')
    if (!found) {
      if (err) {
        err.style.display = 'block'
        err.textContent = 'Sai email/tài khoản hoặc mật khẩu.'
      }
      return
    } else if (err) {
      err.style.display = 'none'
    }
    setAllAuth(found)
    refresh()
    setOpen(false)
  }, [refresh])

  const onLogout = useCallback(() => {
    if (confirm('Bạn chắc chắn muốn đăng xuất?')) {
      clearAllAuth()
      refresh()
      setOpen(false)
    }
  }, [refresh])

  return (
    <>
      <div id="auth-actions" className="auth" style={{ display: logged ? 'none' : '' }}>
        <a className="btn" href="#" onClick={(e) => (e.preventDefault(), setWhich('login'), setOpen(true))}>
          Đăng nhập
        </a>
        <a className="btn primary" href="#" onClick={(e) => (e.preventDefault(), setWhich('register'), setOpen(true))}>
          Đăng ký
        </a>
      </div>

      <a id="avatar-btn" className="avatar" href="#" title="Tài khoản" style={{ display: logged ? '' : 'none' }}>
        <img src="/doan/assets/img/avatar.jpg" alt="me" />
      </a>

      <div id="user-menu" className="user-menu" style={{ display: 'none' }}></div>

      {open && (
        <div id="auth-overlay" className="overlay open" onClick={(e) => e.target === e.currentTarget && setOpen(false)}>
          {/* LOGIN */}
          {which === 'login' && (
            <div id="login-modal" className="auth-card" style={{ display: 'flex' }}>
              <button className="auth-close" aria-label="Đóng" onClick={() => setOpen(false)}>
                ×
              </button>
              <div className="auth-left">
                <img src="/doan/assets/img/banner1.jpg" alt="Login banner" />
                <div className="brand">
                  <img src="/doan/assets/img/logo.jpg" alt="logo" />
                  <span>PhimHUB</span>
                </div>
              </div>
              <div className="auth-right">
                <div className="auth-head">
                  <h3 id="login-title">Đăng nhập</h3>
                </div>
                <p className="muted small">
                  Nếu bạn chưa có tài khoản,{' '}
                  <a href="#" id="to-register" onClick={(e) => (e.preventDefault(), setWhich('register'))}>
                    đăng ký ngay
                  </a>
                </p>
                <input id="login-username" type="text" placeholder="Email hoặc tài khoản" />
                <input id="login-password" type="password" placeholder="Mật khẩu" />
                <div id="login-error" className="muted small" style={{ display: 'none', color: '#ffb3b3', margin: '-6px 0 6px' }}></div>
                <div className="captcha">
                  ✔ Thành công! <span>Fake Captcha</span>
                </div>
                <button id="btn-login" className="btn primary full" onClick={doLogin}>
                  Đăng nhập
                </button>
                <a href="#" className="muted small">
                  Quên mật khẩu?
                </a>
                <button className="btn google full">Đăng nhập bằng Google</button>
              </div>
            </div>
          )}

          {/* REGISTER */}
          {which === 'register' && (
            <div id="register-modal" className="auth-card" style={{ display: 'flex' }}>
              <button className="auth-close" aria-label="Đóng" onClick={() => setOpen(false)}>
                ×
              </button>
              <div className="auth-left">
                <img src="/doan/assets/img/banner2.jpg" alt="Register banner" />
                <div className="brand">
                  <img src="/doan/assets/img/logo.jpg" alt="logo" />
                  <span>PhimHUB</span>
                </div>
              </div>
              <div className="auth-right">
                <div className="auth-head">
                  <h3 id="register-title">Đăng ký</h3>
                </div>
                <p className="muted small">
                  Đã có tài khoản?{' '}
                  <a href="#" id="to-login" onClick={(e) => (e.preventDefault(), setWhich('login'))}>
                    Đăng nhập
                  </a>
                </p>
                <input id="reg-name" type="text" placeholder="Tên người dùng" />
                <input id="reg-username" type="text" placeholder="Email hoặc tài khoản" />
                <input id="reg-password" type="password" placeholder="Mật khẩu" />
                <input id="reg-repassword" type="password" placeholder="Nhập lại mật khẩu" />
                <button id="btn-register" className="btn primary full" onClick={() => setWhich('login')}>
                  Đăng ký
                </button>
                <button className="btn google full">Đăng ký bằng Google</button>
              </div>
            </div>
          )}
        </div>
      )}
      {logged && (
        <button id="logout-btn" className="item danger" style={{ display: 'none' }} onClick={onLogout}>
          Đăng xuất
        </button>
      )}
    </>
  )
}

export default AuthOverlay


