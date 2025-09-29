// Helpers
const qs  = (s, r=document)=>r.querySelector(s);
const qsa = (s, r=document)=>[...r.querySelectorAll(s)];

// Guard login
(function guard(){
  const isLogin = localStorage.getItem('demo-login') === '1';
  if (!isLogin) { window.location.href = 'login.html'; return; }
})();

// Load user
let user = null;
try { user = JSON.parse(localStorage.getItem('user')||'null'); } catch(e){ user = null; }
if (!user) {
  user = { email:'email@domain.com', name:'Người dùng 1', avatar:'assets/img/avatar.jpg', role:'user' };
  localStorage.setItem('user', JSON.stringify(user));
}

// Role-based UI
(function toggleMenu(){
  const role = user.role || 'user';
  qsa('.user-only').forEach(el  => el.style.display = role==='user'  ? '' : 'none');
  qsa('.admin-only').forEach(el => el.style.display = role==='admin' ? '' : 'none');
})();

// Fill account
function fill(){
  const av = qs('#avatar'); if (av) av.src = user.avatar || 'assets/img/avatar.jpg';
  qs('#email')?.setAttribute('value', user.email || '');
  qs('#name')?.setAttribute('value',  user.name  || '');
  const small = qs('#avatar-small'); if (small) small.src = av?.src || 'assets/img/avatar.jpg';
}
fill();

// Change avatar (demo)
const fileInput = qs('#avatar-file');
qs('#btn-change-avatar')?.addEventListener('click', ()=> fileInput?.click());
fileInput?.addEventListener('change',(e)=>{
  const f = e.target.files?.[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = ()=>{ user.avatar = reader.result; localStorage.setItem('user', JSON.stringify(user)); fill(); };
  reader.readAsDataURL(f);
});

// Update info (demo)
qs('#btn-save')?.addEventListener('click', ()=>{
  user.email = (qs('#email')?.value || '').trim();
  user.name  = (qs('#name')?.value  || '').trim();
  localStorage.setItem('user', JSON.stringify(user));
  alert('Đã lưu thông tin (demo).');
});

// Change pass (demo)
qs('#btn-change-pass')?.addEventListener('click', ()=> alert('Demo: nối API sau.'));

// Show view helper
function show(id){
  qsa('.view').forEach(v=>v.style.display='none');
  const map = { 'admin-account':'admin' };
  qs('#view-'+(map[id]||id))?.style.removeProperty('display');
  qsa('.side .sbtn').forEach(b=>b.classList.remove('active'));
  const btn = qsa('.side .sbtn').find(b=> (b.dataset.action||'')===id );
  btn?.classList.add('active');
}

// Sidebar SPA (chỉ cho .sbtn không phải <a>)
qs('.side')?.addEventListener('click', (e)=>{
  const sbtn = e.target.closest('.sbtn'); if(!sbtn || sbtn.tagName==='A') return;
  const act = sbtn.dataset.action;
  if (!act) return;
  show(act);
});

// Favorites demo
(function renderFav(){
  const favs = JSON.parse(localStorage.getItem('favs')||'[]');
  const wrap = qs('#fav-grid'); if(!wrap) return;
  wrap.innerHTML = favs.length ? favs.map(f=>`
    <a class="tile" href="detail.html?id=${f.id}">
      <div class="poster"><img src="${f.poster}" alt="" style="width:100%;height:100%;object-fit:cover"></div>
      <div class="meta"><div class="title">${f.title}</div></div>
    </a>`).join('') : `<p class="muted">Chưa có phim yêu thích.</p>`;
})();

// Logout
qs('#btn-logout')?.addEventListener('click',(e)=>{
  e.preventDefault();
  localStorage.removeItem('demo-login');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});
