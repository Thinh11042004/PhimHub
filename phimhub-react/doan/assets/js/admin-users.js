// Helpers
const qs  = (s, r=document)=>r.querySelector(s);
const qsa = (s, r=document)=>[...r.querySelectorAll(s)];

// Guard admin
(function guard(){
  const isLogin = localStorage.getItem('demo-login')==='1';
  if(!isLogin){ window.location.href='login.html'; return; }
  let user=null; try{ user = JSON.parse(localStorage.getItem('user')||'null'); }catch(e){}
  if(!user || user.role!=='admin'){ window.location.href='profile.html'; return; }
  qs('#avatar-btn')?.style.removeProperty('display');
  const img=qs('#avatar-small'); if(img) img.src=user.avatar||'assets/img/avatar.jpg';
})();

// MOCK data
const USERS = [
  {id:'u000', name:'Chủ hệ thống 1', email:'chusystem1@gmail.com', role:'super'},
  {id:'u001', name:'Quản trị viên 1', email:'quantrivien1@gmail.com', role:'admin'},
  {id:'u101', name:'Người dùng 1', email:'nguoidung1@gmail.com', role:'user'},
  {id:'u102', name:'Người dùng 2', email:'nguoidung2@gmail.com', role:'user'},
];

const listEl = qs('#u-list');
let curTab = 'super';
let query = '';
let roleFilter = '';

function roleLabel(r){ return r==='super'?'Chủ hệ thống':(r==='admin'?'Quản trị viên':'Người dùng'); }
function openModal(id){ qs('#'+id)?.classList.add('show'); }
function closeModal(id){ qs('#'+id)?.classList.remove('show'); }

function render(){
  const count = {super:0,admin:0,user:0}; USERS.forEach(u=>count[u.role]++);
  qsa('.chip[data-tab]').forEach(c=>{
    const t=c.dataset.tab, base=roleLabel(t);
    c.textContent=`${base} (${count[t]||0})`;
    c.classList.toggle('active', t===curTab);
  });

  const items = USERS.filter(u=>{
    const okTab = curTab ? u.role===curTab : true;
    const okRF  = roleFilter ? u.role===roleFilter : true;
    const okQ   = query ? (u.name.toLowerCase().includes(query)||u.email.toLowerCase().includes(query)) : true;
    return okTab && okRF && okQ;
  });

  listEl.innerHTML = items.map(u=>`
    <article class="u-item">
      <div class="u-top">
        <div>
          <div class="u-cover"></div>
          <div class="u-info">
            <span class="tag">${roleLabel(u.role)}</span>
            <div class="u-name">${u.name}</div>
            <div class="u-email">${u.email}</div>
          </div>
        </div>
        <div class="u-actions">
          ${u.role!=='super' ? `<button class="btn icon js-del" data-id="${u.id}">🗑 Xóa</button>` : ''}
          <button class="btn icon js-edit" data-id="${u.id}">✏️ Chỉnh sửa</button>
          ${u.role==='admin'
            ? `<button class="btn ghost" disabled>⤵ Xóa Quản trị viên</button>`
            : (u.role==='user' ? `<button class="btn ghost" disabled>⤴ Nâng thành Quản trị viên</button>` : '')
          }
        </div>
      </div>
    </article>
  `).join('');

  // bind mở modal
  qsa('.js-edit', listEl).forEach(b=>{
    b.onclick=()=>{
      const u=USERS.find(x=>x.id===b.dataset.id); if(!u) return;
      qs('#edit-name').value=u.name; qs('#edit-email').value=u.email;
      openModal('modal-edit');
    };
  });
  qsa('.js-del', listEl).forEach(b=>{
    b.onclick=()=>{
      const u=USERS.find(x=>x.id===b.dataset.id); if(!u) return;
      qs('#del-name').value=u.name; qs('#del-email').value=u.email;
      openModal('modal-delete');
    };
  });
}
render();

// filters
qs('#q')?.addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();render();});
qs('#roleFilter')?.addEventListener('change',e=>{roleFilter=e.target.value;render();});
qsa('.chip[data-tab]').forEach(c=>c.addEventListener('click',()=>{curTab=c.dataset.tab;render();}));

// open create
qs('#btn-open-create')?.addEventListener('click',()=>openModal('modal-create'));

// close modals
qsa('.close').forEach(x=>x.addEventListener('click',()=>closeModal(x.dataset.close)));

// logout
qs('#btn-logout')?.addEventListener('click',()=>{
  localStorage.removeItem('demo-login'); localStorage.removeItem('user');
  window.location.href='index.html';
});
