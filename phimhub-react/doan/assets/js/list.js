// ====== AUTH HEADER DEMO (giống home.js) ======
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];

(function initAuth(){
  const isLogin = localStorage.getItem('demo-login')==='1';
  const auth = qs('#auth-actions');
  const avatar = qs('#avatar-btn');
  if(isLogin){ auth.style.display='none'; avatar.style.display=''; }
  else { auth.style.display=''; avatar.style.display='none'; }
})();

// ====== DATA DEMO ======
const posters = [
  "assets/img/phimlemoi1.jpg", "assets/img/phimlemoi2.jpg", "assets/img/phimlemoi3.jpg", "assets/img/phimlemoi4.jpg",
  "assets/img/phimbomoi1.jpg", "assets/img/phimbomoi2.jpg", "assets/img/phimbomoi3.jpg", "assets/img/phimbomoi4.jpg",
  "assets/img/dienanhmoi1.jpg", "assets/img/dienanhmoi2.jpg", "assets/img/dienanhmoi3.jpg", "assets/img/dienanhmoi4.jpg"
];

// một ít thể loại để random
const GENRES = ["Hành động","Khoa học","Viễn tưởng","Hài","Tâm lý","Tội phạm","Kinh dị","Hoạt hình","Phiêu lưu","Chính kịch","Bí ẩn","Lãng mạn"];
const AGES = ["P","K","T13","T16","T18"];

// tạo 48 phim lẻ demo
const MOVIES = Array.from({length:48}).map((_,i)=>({
  id: i+1,
  title: `Phim lẻ ${i+1}`,
  type: "phimle",
  year: 2025 - (i % 9),
  age: AGES[i % AGES.length],
  genres: [GENRES[i%GENRES.length], GENRES[(i+3)%GENRES.length]],
  rating: +(6 + (i%4) + Math.random()).toFixed(1),     // 6.0 - 10.0
  views: 1000 + i*137,
  poster: posters[i % posters.length],
}));

// ====== STATE ======
let STATE = {
  text: "",
  type: "all",
  age: "all",
  years: new Set(["all"]),   // Set để dễ bật tắt
  genres: new Set(["all"]),
  sort: "newest",
  page: 1,
  size: 24
};

// ====== HELPERS ======
function chipToggle(container, multi=false){
  const key = container.dataset.key; // type | age | year | genre | sort
  container.addEventListener('click',(e)=>{
    const btn = e.target.closest('.chip'); if(!btn) return;
    const val = btn.dataset.value;

    if(key==='sort' || key==='type' || key==='age'){    // single
      container.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
      btn.classList.add('active');
      STATE[key] = val;
    } else { // year / genre : multi
      if(val==='all'){
        // bật 'Tất cả'
        container.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
        btn.classList.add('active');
        STATE[key+'s'] = new Set(['all']);
      } else {
        // bỏ 'Tất cả' nếu đang bật
        container.querySelector('.chip[data-value="all"]')?.classList.remove('active');
        STATE[key+'s'].delete('all');
        // toggle phần tử
        if(btn.classList.contains('active')){
          btn.classList.remove('active'); STATE[key+'s'].delete(val);
          if(STATE[key+'s'].size===0){ // nếu trống → trở lại all
            container.querySelector('.chip[data-value="all"]').classList.add('active');
            STATE[key+'s'].add('all');
          }
        } else {
          btn.classList.add('active'); STATE[key+'s'].add(val);
        }
      }
    }

    STATE.page = 1;
    render();
  });
}

// gắn toggle cho tất cả cụm chips
qsa('.chips').forEach(c=>{
  const isMulti = c.classList.contains('multi');
  chipToggle(c, isMulti);
});

// toggle panel
qs('#btn-toggle-filter').addEventListener('click', ()=>{
  const p = qs('#filter-panel');
  p.style.display = (getComputedStyle(p).display === 'none') ? 'block' : 'none';
});

// nút Lọc kết quả
qs('#btn-apply').addEventListener('click', ()=>{ STATE.page=1; render(); });

// search text
qs('#search-input').addEventListener('input', (e)=>{
  STATE.text = e.target.value.toLowerCase().trim();
  STATE.page = 1;
  render();
});

// page size
qsa('.page-size .badge').forEach(b=>{
  b.addEventListener('click', ()=>{
    qsa('.page-size .badge').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    STATE.size = +b.dataset.size;
    STATE.page = 1;
    render();
  });
});

// ====== FILTER & RENDER ======
function applyFilters(list){
  let out = list.slice();

  // loại phim
  if(STATE.type!=='all') out = out.filter(m=>m.type===STATE.type);

  // tuổi
  if(STATE.age!=='all') out = out.filter(m=>m.age===STATE.age);

  // năm
  if(!STATE.years.has('all')){
    const years = STATE.years;
    out = out.filter(m=> years.has(String(m.year)));
  }

  // thể loại
  if(!STATE.genres.has('all')){
    const gs = STATE.genres;
    out = out.filter(m => m.genres.some(g => gs.has(g)));
  }

  // search
  if(STATE.text){
    out = out.filter(m => m.title.toLowerCase().includes(STATE.text));
  }

  // sort
  switch(STATE.sort){
    case 'newest':  out.sort((a,b)=> b.year - a.year); break;
    case 'updated': out.sort((a,b)=> (b.id%7) - (a.id%7)); break; // demo
    case 'views':   out.sort((a,b)=> b.views - a.views); break;
    case 'rating':  out.sort((a,b)=> b.rating - a.rating); break;
  }

  return out;
}

function cardHTML(m){
  return `<a class="card" href="detail.html?id=${m.id}">
    <div class="poster"><img src="${m.poster}" alt="${m.title}"></div>
    <div class="info">
      <div class="title">${m.title}</div>
      <div class="meta">${m.year} · ${m.genres.slice(0,2).join(', ')} · <span class="badge">${m.age}</span></div>
    </div>
  </a>`;
}

function render(){
  const data = applyFilters(MOVIES);
  const total = data.length;
  const pages = Math.max(1, Math.ceil(total / STATE.size));
  if(STATE.page > pages) STATE.page = pages;

  // slice page
  const start = (STATE.page-1)*STATE.size;
  const items = data.slice(start, start+STATE.size);

  // grid
  qs('#grid').innerHTML = items.map(cardHTML).join('');

  // pagination
  const pagesWrap = qs('#pages');
  let html = '';
  for(let i=1;i<=pages;i++){
    html += `<button class="page ${i===STATE.page?'active':''}" data-p="${i}">${i}</button>`;
  }
  pagesWrap.innerHTML = html;

  // page handlers
  qsa('#pages .page').forEach(p=>{
    p.addEventListener('click', ()=>{
      STATE.page = +p.dataset.p;
      render();
      window.scrollTo({top:0, behavior:'smooth'});
    });
  });
  qs('#prev').onclick = ()=>{ if(STATE.page>1){ STATE.page--; render(); window.scrollTo({top:0,behavior:'smooth'});} };
  qs('#next').onclick = ()=>{ if(STATE.page<pages){ STATE.page++; render(); window.scrollTo({top:0,behavior:'smooth'});} };
}

// initial
render();
