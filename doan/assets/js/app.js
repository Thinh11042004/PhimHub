
const sampleMovies = [
  {id:1, title:"The Godfather", year:1972, rating:9.2, poster:"https://image.tmdb.org/t/p/w342/eEslKSwcqmiNS6va24Pbxf2UKmJ.jpg"},
  {id:2, title:"The Shawshank Redemption", year:1994, rating:9.3, poster:"https://image.tmdb.org/t/p/w342/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg"},
  {id:3, title:"Spider-Man: Across the Spider-Verse", year:2023, rating:8.7, poster:"https://image.tmdb.org/t/p/w342/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg"},
];

function qs(sel, root=document){return root.querySelector(sel)}
function qsa(sel, root=document){return [...root.querySelectorAll(sel)]}

function renderCards(listElId="grid-home"){
  const el = qs(`#${listElId}`);
  if(!el) return;
  el.innerHTML = sampleMovies.map(m => `
    <a class="card" href="detail.html?id=${m.id}">
      <div class="poster"><img alt="${m.title}" loading="lazy" src="${m.poster}"></div>
      <div class="info"><div class="title">${m.title}</div>
      <div class="meta"><span class="imdb">IMDb ${m.rating}</span> <span>${m.year}</span></div></div>
    </a>`).join("");
}

function initSearch(){
  const input = qs("#search-input");
  if(!input) return;
  input.addEventListener("input", e=>{
    const q=e.target.value.toLowerCase().trim();
    qsa(".card").forEach(c=>{
      const t=c.querySelector(".title")?.textContent.toLowerCase()||"";
      c.style.display=t.includes(q)?"":"none";
    });
  });
}

function initComments(){
  const form=qs("#comment-form"),list=qs("#comments");
  if(!form||!list) return;
  const key="phimhub-comments";
  const comments=JSON.parse(localStorage.getItem(key)||"[]");
  const render=()=>{list.innerHTML=comments.map(c=>`<div class="comment"><b>${c.user}</b><div>${c.text}</div></div>`).join("")||"<div class='muted'>Chưa có bình luận</div>";};
  render();
  form.addEventListener("submit",e=>{
    e.preventDefault();
    const user=form.user.value.trim()||"Người dùng";
    const text=form.text.value.trim();
    if(!text)return;
    comments.unshift({user,text,at:Date.now()});
    localStorage.setItem(key,JSON.stringify(comments));
    form.reset();render();
  });
}

// Favorites/Playlist
function toggleFav(id){
  let favs=JSON.parse(localStorage.getItem("favorites")||"[]");
  if(favs.includes(id)){favs=favs.filter(f=>f!==id);}else{favs.push(id);}
  localStorage.setItem("favorites",JSON.stringify(favs));
  alert("Cập nhật Yêu thích: "+JSON.stringify(favs));
}

function togglePlaylist(id){
  let list=JSON.parse(localStorage.getItem("playlist")||"[]");
  if(list.includes(id)){list=list.filter(f=>f!==id);}else{list.push(id);}
  localStorage.setItem("playlist",JSON.stringify(list));
  alert("Cập nhật Playlist: "+JSON.stringify(list));
}

function renderFavs(listElId="grid-home"){
  const favs=JSON.parse(localStorage.getItem("favorites")||"[]");
  const el=qs("#"+listElId); if(!el)return;
  el.innerHTML = sampleMovies.filter(m=>favs.includes(m.id)).map(m=>`
    <div class="card"><div class="poster"><img src="${m.poster}"></div>
    <div class="info"><div class="title">${m.title}</div></div></div>`).join("") || "<p>Chưa có phim yêu thích</p>";
}

function renderPlaylist(listElId="grid-home"){
  const list=JSON.parse(localStorage.getItem("playlist")||"[]");
  const el=qs("#"+listElId); if(!el)return;
  el.innerHTML = sampleMovies.filter(m=>list.includes(m.id)).map(m=>`
    <div class="card"><div class="poster"><img src="${m.poster}"></div>
    <div class="info"><div class="title">${m.title}</div></div></div>`).join("") || "<p>Danh sách trống</p>";
}

// Watch page controls
function initWatch(){
  qsa(".control-btn").forEach(btn=>{
    btn.addEventListener("click",e=>{
      const group=btn.dataset.group;
      qsa(`.control-btn[data-group=${group}]`).forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
  qsa(".episode-btn").forEach((ep,i)=>{
    ep.addEventListener("click",()=>{
      alert("Chuyển sang tập "+(i+1));
    });
  });
}

function init(){
  renderCards();
  initSearch();
  initComments();
  initWatch();
  if(qs("#grid-favs")) renderFavs("grid-favs");
  if(qs("#grid-playlist")) renderPlaylist("grid-playlist");
}
document.addEventListener("DOMContentLoaded",init);
