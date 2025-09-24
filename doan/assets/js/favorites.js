// ===== helpers =====
const qs = (s,r=document)=>r.querySelector(s);
const qsa = (s,r=document)=>[...r.querySelectorAll(s)];

// ===== auth header (ẩn hiện avatar) =====
(function initAuth(){
  const isLogin = localStorage.getItem('demo-login') === '1';
  const auth = qs('#auth-actions');
  const avatar = qs('#avatar-btn');
  if (auth && avatar){
    auth.style.display = isLogin ? 'none' : '';
    avatar.style.display = isLogin ? '' : 'none';
  }
  // bảo vệ trang: nếu chưa login → về index (có thể đổi thành login.html nếu bạn muốn)
  if (!isLogin) window.location.href = 'index.html';
})();

// ===== demo seed favorites (nếu trống) =====
function seedIfEmpty(){
  let fav = [];
  try { fav = JSON.parse(localStorage.getItem('favorites')||'[]'); } catch(_){}
  if (fav.length) return;
  fav = [
    {id:901, type:'series',  title:'Thế giới ảo diệu của Gumball', poster:'assets/img/dienanhmoi2.jpg', year:2023},
    {id:902, type:'series',  title:'Family Guy',                    poster:'assets/img/phimlemoi2.jpg', year:1999},
    {id:903, type:'series',  title:'One Piece',                     poster:'assets/img/phimlemoi4.jpg', year:1999},
    {id:904, type:'movie',   title:'Bố già',                        poster:'assets/img/phimlemoi1.jpg', year:1972},
    {id:905, type:'movie',   title:'Nhà tù Shawshank',              poster:'assets/img/dienanhmoi1.jpg', year:1994},
    {id:906, type:'movie',   title:'Spider-Man: Across the Spider-Verse', poster:'assets/img/dienanhmoi3.jpg', year:2023},
  ];
  localStorage.setItem('favorites', JSON.stringify(fav));
}
seedIfEmpty();

// ===== render grid =====
function cardHTML(m){
  const href = m.type === 'series'
    ? `series-detail.html?id=${m.id}`
    : `detail.html?id=${m.id}`;
  return `
    <div class="fav-card" data-id="${m.id}">
      <button class="remove" title="Xoá khỏi yêu thích">✕</button>
      <a class="thumb" href="${href}">
        <img src="${m.poster}" alt="${m.title}">
      </a>
      <div class="cap">
        <div class="name">${m.title}</div>
        <div class="meta">${m.type==='series'?'Phim bộ':'Phim lẻ'} · ${m.year||''}</div>
      </div>
    </div>
  `;
}

let FAVORITES = [];
function loadFav(){
  try { FAVORITES = JSON.parse(localStorage.getItem('favorites')||'[]'); } catch(_){ FAVORITES=[]; }
}
function saveFav(){
  localStorage.setItem('favorites', JSON.stringify(FAVORITES));
}
function render(list = FAVORITES){
  const grid = qs('#fav-grid');
  const empty = qs('#fav-empty');
  if (!list.length){
    grid.innerHTML = '';
    empty.style.display = '';
    return;
  }
  empty.style.display = 'none';
  grid.innerHTML = list.map(cardHTML).join('');

  // bind remove
  qsa('.fav-card .remove').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const id = btn.closest('.fav-card').dataset.id;
      FAVORITES = FAVORITES.filter(x=> String(x.id) !== String(id));
      saveFav(); render();
    });
  });
}
loadFav(); render();

// ===== search trong favorites =====
qs('#fav-search').addEventListener('input', (e)=>{
  const q = e.target.value.toLowerCase().trim();
  const filtered = FAVORITES.filter(x=> x.title.toLowerCase().includes(q));
  render(filtered);
});

// ===== logout về index =====
qs('#btn-logout').addEventListener('click', ()=>{
  localStorage.removeItem('demo-login');
  localStorage.removeItem('user');
  // giữ nguyên danh sách yêu thích cho demo; nếu muốn xoá luôn thì bỏ comment:
  // localStorage.removeItem('favorites');
  window.location.href = 'index.html';
});
