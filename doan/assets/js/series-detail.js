// helpers
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];

// auth demo
(function(){
  const isLogin = localStorage.getItem('demo-login')==='1';
  qs('#auth-actions').style.display = isLogin ? 'none' : '';
  qs('#avatar-btn').style.display  = isLogin ? '' : 'none';
})();

// ===== demo data for a series =====
const SERIES = {
  id: 501,
  title: "Thế giới ảo diệu của Gumball",
  poster: "assets/img/dienanhmoi2.jpg",
  backdrop: "assets/img/dienanhmoi2.jpg",
  imdb: 8.7,
  rating: "P",
  year: 2023,
  genres: ["Hoạt hình","Gia đình","Hài hước"],
  country: "Mỹ",
  director: "Mic Graves",
  cast: "Logan Grove, Kwesi Boakye",
  desc:
    "Series hoạt hình vui nhộn xoay quanh cậu bé Gumball và những người bạn ở thị trấn Elmore.",
  seasons: [
    { season: 1, episodes: 20 },
    { season: 2, episodes: 20 },
    { season: 3, episodes: 20 }
  ]
};

const SUGGESTS = [
  {id:601,title:"Gumball (spin-off)",poster:"assets/img/dienanhmoi2.jpg"},
  {id:602,title:"Family Guy",poster:"assets/img/phimlemoi2.jpg"},
  {id:603,title:"One Piece",poster:"assets/img/phimlemoi4.jpg"},
  {id:604,title:"Rick and Morty",poster:"assets/img/phimbomoi3.jpg"},
  {id:605,title:"Tom and Jerry: The Fast and the Furry",poster:"assets/img/phimbomoi4.jpg"},
  {id:606,title:"Ben 10",poster:"assets/img/phimbomoi1.jpg"},
];

// fill static
(function init(){
  qs('#hero-bg').style.backgroundImage = `url("${SERIES.backdrop}")`;
  qs('#poster').src = SERIES.poster;
  qs('#title').textContent = SERIES.title;
  qs('#imdb').textContent = `IMDb ${SERIES.imdb}`;
  qs('#genres').innerHTML = SERIES.genres.map(g=>`<span class="badge">${g}</span>`).join('');
  qs('#desc').textContent = SERIES.desc;
  qs('#country').textContent = SERIES.country;
  qs('#director').textContent = SERIES.director;
  qs('#cast').textContent = SERIES.cast;

  // ✅ suggest: trỏ về series-detail.html
  qs('#suggest-grid').innerHTML = SUGGESTS.slice(0,4).map(m=>`
    <a class="card" href="series-detail.html?id=${m.id}">
      <div class="poster"><img src="${m.poster}" alt="${m.title}"></div>
      <div class="info"><div class="title">${m.title}</div></div>
    </a>
  `).join('');
})();

// seasons dropdown
const seasonBtn = qs('#season-btn');
const seasonMenu = qs('#season-menu');
seasonMenu.innerHTML = SERIES.seasons.map(s=>`<div class="item" data-s="${s.season}">Phần ${s.season}</div>`).join('');
seasonBtn.onclick = ()=> seasonMenu.style.display = (seasonMenu.style.display==='block'?'none':'block');
document.addEventListener('click', (e)=>{
  if(!seasonBtn.contains(e.target) && !seasonMenu.contains(e.target)) seasonMenu.style.display='none';
});

// render episodes
let currentSeason = SERIES.seasons[0].season;

// ✅ hàm tạo URL xem phim bộ
function makeWatchHref(seriesId, s, e){
  return `series-watch.html?id=${encodeURIComponent(seriesId)}&s=${s}&e=${e}`;
}

function renderEpisodes(){
  seasonBtn.textContent = `Phần ${currentSeason} ▾`;
  const sObj = SERIES.seasons.find(s=>s.season===currentSeason);
  const total = sObj.episodes;
  const grid = qs('#eps-grid');
  let html='';
  for(let i=1;i<=total;i++){
    const href = makeWatchHref(SERIES.id, currentSeason, i); // ✅ series-watch.html
    html += `<a class="ep" href="${href}" title="Tập ${i}">▶ Tập ${i}</a>`;
  }
  grid.innerHTML = html;

  // set link cho nút ▶ Xem (mặc định tập 1 của season hiện tại)
  const playBtn = qs('#btn-watch');
  if (playBtn) playBtn.href = makeWatchHref(SERIES.id, currentSeason, 1);
}
renderEpisodes();

// choose season
qsa('#season-menu .item').forEach(it=>{
  it.onclick = ()=>{
    currentSeason = +it.dataset.s;
    renderEpisodes();
    seasonMenu.style.display='none';
  };
});

// tabs
qsa('.tab').forEach(t=> t.onclick = ()=>{
  qsa('.tab').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  const k=t.dataset.tab;
  qs('#panel-eps').style.display = k==='eps'?'block':'none';
  qs('#panel-cmt').style.display = k==='cmt'?'block':'none';
});

// like demo
qs('#btn-like').onclick = ()=> alert('Đã thêm vào Yêu thích (demo).');

// comments demo
const cmtList=qs('#cmt-list');
const demoCmts=[
  {name:"Người dùng 1", time:"vừa xong", text:"Series này xem siêu vui!"},
  {name:"Người dùng 2", time:"1 giờ trước", text:"Gumball best!"}
];
function renderCmts(){
  cmtList.innerHTML=demoCmts.map(c=>`
    <div class="cmt">
      <div class="name">${c.name} <span class="time">· ${c.time}</span></div>
      <div class="text">${c.text}</div>
    </div>`).join('');
}
renderCmts();
qs('#cmt-send').onclick=()=>{
  const t=qs('#cmt-text'); if(!t.value.trim()) return;
  demoCmts.unshift({name:"Bạn", time:"vừa xong", text:t.value.trim()});
  t.value=""; renderCmts();
};
