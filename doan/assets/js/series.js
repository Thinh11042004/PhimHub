// Helpers
const qs = (s, r=document)=>r.querySelector(s);
const qsa = (s, r=document)=>[...r.querySelectorAll(s)];

// Auth demo
(function(){
  const isLogin = localStorage.getItem('demo-login')==='1';
  qs('#auth-actions').style.display = isLogin ? 'none' : '';
  qs('#avatar-btn').style.display  = isLogin ? '' : 'none';
})();

// ===== Options (demo) =====
const AGES   = ["P","T13","T16","T18","18+"];
const YEARS  = [2025,2024,2023,2022,2021,2020,2019,2018,2017,2016];
const GENRES = ["Hành động","Hài","Tâm lý","Tội phạm","Phiêu lưu","Khoa học","Viễn tưởng","Huyền bí","Lãng mạn","Cổ trang","Gia đình"];
const SORTS  = ["Mới nhất","Xem nhiều","IMDb cao","A→Z"];

// Render filter chips
function chipHTML(text){ return `<button class="chip">${text}</button>` }
qs('#ages').innerHTML   = AGES.map(chipHTML).join('');
qs('#years').innerHTML  = YEARS.map(chipHTML).join('');
qs('#genres').innerHTML = GENRES.map(chipHTML).join('');
qs('#sorts').innerHTML  = SORTS.map((s,i)=>`<button class="chip ${i===0?'active':''}">${s}</button>`).join('');

qsa('.chips').forEach(area=>{
  area.addEventListener('click', e=>{
    const b = e.target.closest('.chip'); if(!b) return;
    if(area.id==='genres'){ b.classList.toggle('active'); } // genres: multi-select
    else { qsa('.chip', area).forEach(x=>x.classList.remove('active')); b.classList.add('active'); }
  });
});

// Toggle filter
qs('#toggle-filter').onclick = ()=>{
  const el = qs('#filter-wrap');
  el.style.display = (el.style.display==='none') ? '' : 'none';
};

// ===== Dataset demo (phim bộ) =====
const SERIES = [
  {id:201, title:"Ben 10",           poster:"assets/img/phimbomoi1.jpg", season:4, eps:52, imdb:7.9},
  {id:202, title:"Rick and Morty",  poster:"assets/img/phimbomoi3.jpg", season:7, eps:70, imdb:9.1},
  {id:203, title:"Family Guy",      poster:"assets/img/phimlemoi2.jpg", season:21, eps:400, imdb:8.2},
  {id:204, title:"One Piece",       poster:"assets/img/phimlemoi4.jpg", season:20, eps:1000, imdb:8.8},
  {id:205, title:"Gumball",         poster:"assets/img/dienanhmoi2.jpg", season:6, eps:240, imdb:8.2},
  {id:206, title:"The Boys",        poster:"assets/img/dienanhmoi3.jpg", season:4, eps:32, imdb:8.7},
  {id:207, title:"Wednesday",       poster:"assets/img/dienanhmoi4.jpg", season:2, eps:16, imdb:8.1},
  {id:208, title:"Peacemaker",      poster:"assets/img/phimbomoi4.jpg", season:2, eps:16, imdb:8.5},
  {id:209, title:"Love Untangled",  poster:"assets/img/dienanhmoi1.jpg", season:1, eps:12, imdb:7.2},
  {id:210, title:"Young Sheldon",   poster:"assets/img/phimlemoi3.jpg", season:7, eps:141, imdb:7.7},
  {id:211, title:"Avatar: The Last Airbender", poster:"assets/img/phimbomoi2.jpg", season:3, eps:61, imdb:9.3},
  {id:212, title:"Loki",            poster:"assets/img/phimlemoi1.jpg", season:2, eps:12, imdb:8.2},
];

// Render grid
function cardHTML(m){
  // ✅ Trỏ sang trang chi tiết PHIM BỘ
  return `
  <a href="series-detail.html?id=${m.id}" class="card">
    <div class="poster"><img src="${m.poster}" alt="${m.title}"></div>
    <div class="ep-tip">Tập mới nhất: Ep ${Math.min(m.eps, (m.eps % 24) + 1)}</div>
    <div class="info">
      <div class="title">${m.title}</div>
      <div class="meta">
        <span class="badge">S${m.season}</span>
        <span class="badge">Ep ${m.eps}</span>
        <span class="badge imdb">IMDb ${m.imdb}</span>
      </div>
    </div>
  </a>`;
}
function render(list){ qs('#grid').innerHTML = list.map(cardHTML).join(''); }
render(SERIES);

// Search (lọc tại chỗ)
qs('#search').addEventListener('input', e=>{
  const q = e.target.value.toLowerCase().trim();
  render(SERIES.filter(x=>x.title.toLowerCase().includes(q)));
});

// Apply (demo chỉ báo)
qs('#apply').onclick = ()=> alert('Demo: Apply filter — sau này nối API để lấy kết quả theo bộ lọc.');
