// ===== Helpers
const qs  = (s, r=document)=>r.querySelector(s);
const qsa = (s, r=document)=>[...r.querySelectorAll(s)];

// ===== Guard
(function(){
  if (localStorage.getItem('demo-login') !== '1') {
    window.location.href = 'login.html';
  }
})();

// ===== User
let user = null;
try { user = JSON.parse(localStorage.getItem('user')||'null'); } catch(e){ user=null; }
if (!user) {
  user = { email:'nguoidung@gmail.com', name:'Người dùng 1', avatar:'assets/img/avatar.jpg' };
  localStorage.setItem('user', JSON.stringify(user));
}
function fillUser(){
  qs('#email').value = user.email || '';
  qs('#name').value  = user.name  || '';
  qs('#avatar').src  = user.avatar || 'assets/img/avatar.jpg';
  const small = qs('#avatar-small'); if (small) small.src = qs('#avatar').src;
}
fillUser();

// ===== Avatar change
qs('#btn-change-avatar').addEventListener('click', ()=> qs('#avatar-file').click());
qs('#avatar-file').addEventListener('change', (e)=>{
  const f = e.target.files?.[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = ()=>{ user.avatar = reader.result; localStorage.setItem('user', JSON.stringify(user)); fillUser(); };
  reader.readAsDataURL(f);
});

// ===== Save / Change pass
qs('#btn-save').addEventListener('click', ()=>{
  user.email = qs('#email').value.trim();
  user.name  = qs('#name').value.trim();
  localStorage.setItem('user', JSON.stringify(user));
  alert('Đã lưu thông tin (demo).');
});
qs('#btn-change-pass').addEventListener('click', ()=> alert('Demo: màn đổi mật khẩu sẽ nối API sau.'));

// ===== Sidebar views
function showView(key){
  qsa('.view').forEach(v=>v.style.display='none');
  qs(`#view-${key}`).style.display='block';
  qsa('.sbtn').forEach(b=>b.classList.toggle('active', b.dataset.view===key));
}
qsa('.sbtn').forEach(b=> b.addEventListener('click', ()=> showView(b.dataset.view)));

// ===== Favorites
function seedFavoritesIfEmpty(){
  const cur = JSON.parse(localStorage.getItem('favorites')||'[]');
  if (!cur.length) {
    localStorage.setItem('favorites', JSON.stringify([
      {id:1,title:'Thế giới ảo diệu của Gumball',poster:'assets/img/dienanhmoi2.jpg',type:'series'},
      {id:2,title:'Family Guy',poster:'assets/img/phimlemoi2.jpg',type:'series'},
      {id:3,title:'One Piece',poster:'assets/img/phimlemoi4.jpg',type:'series'},
      {id:4,title:'Bố già',poster:'assets/img/phimlemoi1.jpg',type:'movie'},
    ]));
  }
}
seedFavoritesIfEmpty();
function renderFav(){
  const wrap = qs('#fav-grid');
  const list = JSON.parse(localStorage.getItem('favorites')||'[]');
  if (!list.length){ wrap.innerHTML = `<p class="muted">Chưa có mục yêu thích.</p>`; return; }
  wrap.innerHTML = list.map(m=>`
    <a class="tile" href="${m.type==='series'?'series-detail.html':'detail.html'}?id=${m.id}">
      <button class="rm" data-id="${m.id}">✕</button>
      <div class="poster"><img src="${m.poster}" alt="${m.title}"></div>
      <div class="meta"><div class="title">${m.title}</div></div>
    </a>`).join('');
  wrap.querySelectorAll('.rm').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.preventDefault(); e.stopPropagation();
      const id = +btn.dataset.id;
      const arr = JSON.parse(localStorage.getItem('favorites')||'[]').filter(x=>x.id!==id);
      localStorage.setItem('favorites', JSON.stringify(arr));
      renderFav();
    });
  });
}
renderFav();

// ===== Lists (CRUD) – sử dụng ListsAPI từ lists.js
let currentListId = null;

function renderListsSidebar(){
  const lists = ListsAPI.getLists();
  const wrap = qs('#lists-wrap');
  wrap.innerHTML = lists.map(l=>`
    <div class="list-item ${l.id===currentListId?'active':''}" data-id="${l.id}">
      <span>${l.name}</span>
      <span class="list-actions">
        <button class="icon act-rename" title="Đổi tên">✎</button>
        <button class="icon act-del" title="Xoá">🗑</button>
      </span>
    </div>`).join('');

  // select
  wrap.querySelectorAll('.list-item').forEach(it=>{
    it.addEventListener('click', (e)=>{
      if (e.target.closest('.icon')) return;
      currentListId = +it.dataset.id;
      renderListsSidebar();
      renderListItems();
    });
  });

  // rename
  wrap.querySelectorAll('.act-rename').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const id = +btn.closest('.list-item').dataset.id;
      const cur = ListsAPI.getLists().find(x=>x.id===id);
      const name = prompt('Tên mới cho danh sách:', cur?.name||'');
      if (name && name.trim()) { ListsAPI.renameList(id, name.trim()); renderListsSidebar(); renderListItems(); }
    });
  });

  // delete
  wrap.querySelectorAll('.act-del').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const id = +btn.closest('.list-item').dataset.id;
      if (confirm('Xoá danh sách này?')) {
        ListsAPI.deleteList(id);
        const all = ListsAPI.getLists();
        currentListId = all[0]?.id ?? null;
        renderListsSidebar(); renderListItems();
      }
    });
  });
}

function renderListItems(){
  const title = qs('#cur-list-title');
  const grid  = qs('#list-items');
  const empty = qs('#list-empty');

  const lists = ListsAPI.getLists();
  if (!lists.length){ title.textContent='—'; grid.innerHTML=''; empty.style.display='block'; return; }

  const cur = lists.find(x=>x.id===currentListId) || lists[0];
  currentListId = cur.id;
  title.textContent = cur.name;

  if (!cur.items.length){
    grid.innerHTML = '';
    empty.style.display='block';
    return;
  }
  empty.style.display='none';
  grid.innerHTML = cur.items.map(m=>`
    <a class="tile" href="${m.type==='series'?'series-detail.html':'detail.html'}?id=${m.id}">
      <button class="rm" data-id="${m.id}">✕</button>
      <div class="poster"><img src="${m.poster}" alt="${m.title}"></div>
      <div class="meta"><div class="title">${m.title}</div></div>
    </a>`).join('');

  grid.querySelectorAll('.rm').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      e.preventDefault(); e.stopPropagation();
      const id = +btn.dataset.id;
      ListsAPI.removeFromList(currentListId, id);
      renderListItems();
    });
  });
}

// create list
qs('#btn-create-list').addEventListener('click', ()=>{
  const name = qs('#new-list-name').value.trim();
  if (!name) return;
  const id = ListsAPI.createList(name);
  qs('#new-list-name').value='';
  currentListId = id;
  renderListsSidebar(); renderListItems();
});

// init lists UI
(function initLists(){
  ListsAPI.ensureSeed();       // tạo vài list mẫu nếu chưa có
  const all = ListsAPI.getLists();
  currentListId = all[0]?.id ?? null;
  renderListsSidebar();
  renderListItems();
})();

// ===== Logout
qs('#btn-logout').addEventListener('click', ()=>{
  localStorage.removeItem('demo-login');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});
