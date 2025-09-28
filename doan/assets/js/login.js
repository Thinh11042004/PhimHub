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
  username: 'nguoidung',   // có thể đăng nhập bằng email hoặc username
  name: 'Người dùng 1',
  avatar: 'assets/img/avatar.jpg',
  password: '123456',
  role: 'user'
};

const DEMO_ADMIN = {
  id: 'a_001',
  email: 'admin@phimhb.dev',
  username: 'admin',
  name: 'Quản trị viên',
  avatar: 'assets/img/admin.png',   // nếu chưa có file này, tạm dùng avatar.jpg
  password: '123456',
  role: 'admin'
};

// ====== HELPERS ======
const qs = (s, r=document)=>r.querySelector(s);

// ====== LOGIN HANDLER ======
const btnLogin = qs('#btn-login');
btnLogin?.addEventListener('click', () => {
  const u = qs('#login-username')?.value.trim().toLowerCase();
  const p = qs('#login-password')?.value;

  const found = [DEMO_USER, DEMO_ADMIN].find(c =>
    (u === c.email.toLowerCase() || u === c.username.toLowerCase()) && p === c.password
  );

  if (!found) {
    const err = qs('#login-error');
    if (err) { err.style.display = 'block'; err.textContent = 'Sai email/tài khoản hoặc mật khẩu.'; }
    return;
  }

  // Lưu trạng thái + user info + role
  localStorage.setItem('demo-login', '1');
  localStorage.setItem('user', JSON.stringify({
    id: found.id,
    email: found.email,
    name: found.name,
    avatar: found.avatar,
    role: found.role
  }));

  // Về hồ sơ để thấy đúng sidebar theo role
  window.location.href = 'profile.html';
});

// Enter để login
['login-username','login-password'].forEach(id=>{
  const el = document.getElementById(id);
  el?.addEventListener('keydown',(e)=>{ if(e.key==='Enter') btnLogin?.click(); });
});
