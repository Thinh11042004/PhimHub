// ===== Helpers =====
const qs  = (s, r=document)=>r.querySelector(s);
const qsa = (s, r=document)=>[...r.querySelectorAll(s)];

// ===== Guard admin =====
(function guard(){
  const isLogin = localStorage.getItem('demo-login')==='1';
  if(!isLogin){ window.location.href='login.html'; return; }
  let user=null; try{ user = JSON.parse(localStorage.getItem('user')||'null'); }catch(e){}
  if(!user || user.role !== 'admin'){ window.location.href='profile.html'; return; }
  // show avatar
  qs('#avatar-btn')?.style.removeProperty('display');
  const img=qs('#avatar-small'); if(img) img.src=user.avatar||'assets/img/avatar.jpg';
})();

// ===== Demo dữ liệu thể loại =====
const DEFAULT_GENRES = [
  'Anime','Bí ẩn','Chiến tranh','Chiếu rạp','Chuyển thể','Chính kịch','Chính luận','Chính Trị',
  'Cách mạng','Cổ trang','Cổ tích','Cổ điển','DC Comic','Disney','Đời thường','Gay cấn','Gia đình',
  'Giả tưởng','Hoạt hình','Hài','Hành động','Hình sự','Học đường','Khoa học','Kinh dị','Kinh điển',
  'Kỳ ảo','Live Action','Lãng mạn','Lịch sử','Marvel Comic','Người mẫu','Nhạc kịch','Phiêu lưu',
  'Phép thuật','Siêu anh hùng','Thiếu nhi','Thần thoại','Thể thao','Tài liệu','Tâm lý','Tình cảm',
  'Võ thuật','Viễn tưởng','Xuyên không'
];

function loadGenres(){
  try{
    const s = localStorage.getItem('genres');
    return s ? JSON.parse(s) : DEFAULT_GENRES.slice();
  }catch(e){ return DEFAULT_GENRES.slice(); }
}
function saveGenres(list){
  localStorage.setItem('genres', JSON.stringify(list));
}

let GENRES = loadGenres();

// ===== Render chips =====
const chips = qs('#chips');
function renderChips(){
  chips.innerHTML = GENRES.map(g => `<button type="button" class="g-chip" data-name="${g}">${g}</button>`).join('');
}
renderChips();

// chọn chip (đánh dấu active 1 cái khi bấm)
chips.addEventListener('click', (e)=>{
  const b = e.target.closest('.g-chip'); if(!b) return;
  qsa('.g-chip', chips).forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
});

// ===== Modal helpers =====
function openModal(id){ qs('#'+id)?.classList.add('show'); }
function closeModal(id){ qs('#'+id)?.classList.remove('show'); }

// ===== Open/close modal =====
qs('#btn-rename-open')?.addEventListener('click', ()=>{
  const sel = qs('#rename-from');
  sel.innerHTML = GENRES.map(g=>`<option>${g}</option>`).join('');
  qs('#rename-to').value = '';
  openModal('modal-rename');
});
qs('#btn-add-open')?.addEventListener('click', ()=>{
  qs('#add-name').value = '';
  openModal('modal-add');
});
qsa('.close').forEach(x=>{
  x.addEventListener('click', ()=> closeModal(x.dataset.close));
});

// clear input mini
qsa('.pill-x').forEach(b=>{
  b.addEventListener('click', ()=>{
    const el = qs(b.dataset.clear); if(el) el.value='';
  });
});

// ===== Confirm rename / add =====
qs('#rename-confirm')?.addEventListener('click', ()=>{
  const from = qs('#rename-from').value.trim();
  const to   = qs('#rename-to').value.trim();
  if(!to) { alert('Nhập tên mới'); return; }
  const i = GENRES.findIndex(g => g.toLowerCase() === from.toLowerCase());
  if(i>=0){
    GENRES[i] = to;
    saveGenres(GENRES);
    renderChips();
    closeModal('modal-rename');
  }
});

qs('#add-confirm')?.addEventListener('click', ()=>{
  const name = qs('#add-name').value.trim();
  if(!name) { alert('Nhập tên thể loại'); return; }
  if(GENRES.some(g=>g.toLowerCase()===name.toLowerCase())){
    alert('Thể loại đã tồn tại'); return;
  }
  GENRES.push(name);
  saveGenres(GENRES);
  renderChips();
  closeModal('modal-add');
});

// ===== Save toàn trang (mock) =====
qs('#btn-save')?.addEventListener('click', ()=>{
  saveGenres(GENRES);
  alert('Đã lưu thay đổi (demo).');
});

// ===== Sidebar highlight + Logout =====
(function highlightMenu(){
  document.querySelectorAll('.admin-side a.sbtn').forEach(a=>{
    const href = a.getAttribute('href') || '';
    if (href && location.pathname.endsWith(href)) a.classList.add('active');
  });
})();
qs('#btn-logout')?.addEventListener('click', ()=>{
  localStorage.removeItem('demo-login');
  localStorage.removeItem('user');
  window.location.href='index.html';
});
