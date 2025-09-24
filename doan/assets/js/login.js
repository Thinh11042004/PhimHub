// ====== CLOSE BTN ======
const closeBtn = document.getElementById('close-auth');
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    if (history.length > 1) history.back();
    else window.location.href = 'index.html';
  });
}

// ====== DEMO CREDENTIALS ======
const DEMO_USER = {
  id: 'u_001',
  email: 'nguoidung@gmail.com',
  username: 'nguoidung',           // cho phép login bằng username
  name: 'Người dùng 1',
  avatar: 'assets/img/avatar.jpg',
  password: '123456'
};

// ====== HELPERS ======
const qs = (s, r = document) => r.querySelector(s);

// ====== LOGIN HANDLER ======
const btnLogin = qs('#btn-login');
btnLogin?.addEventListener('click', () => {
  const u = qs('#login-username')?.value.trim().toLowerCase();
  const p = qs('#login-password')?.value;

  const match =
    (u === DEMO_USER.email.toLowerCase() || u === DEMO_USER.username.toLowerCase()) &&
    p === DEMO_USER.password;

  if (!match) {
    const err = qs('#login-error');
    if (err) { err.style.display = 'block'; err.textContent = 'Sai email/tài khoản hoặc mật khẩu.'; }
    return;
  }

  // Lưu trạng thái đăng nhập + thông tin user
  localStorage.setItem('demo-login', '1');
  localStorage.setItem('user', JSON.stringify({
    id: DEMO_USER.id,
    email: DEMO_USER.email,
    name: DEMO_USER.name,
    avatar: DEMO_USER.avatar
  }));

  // Về trang chủ hoặc profile – tùy bạn, mình cho về profile cho thấy kết quả
  window.location.href = 'profile.html';
});

// Enter để login
['login-username','login-password'].forEach(id=>{
  const el = document.getElementById(id);
  el?.addEventListener('keydown',(e)=>{ if(e.key==='Enter') btnLogin?.click(); });
});
