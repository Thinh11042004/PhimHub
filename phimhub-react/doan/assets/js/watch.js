// Helpers
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];

// ===== Auth demo (đồng bộ header) =====
(function(){
  const isLogin = localStorage.getItem("demo-login")==="1";
  const auth=qs("#auth-actions"), av=qs("#avatar-btn");
  if(auth && av){ auth.style.display = isLogin ? "none" : ""; av.style.display = isLogin ? "" : "none"; }
})();

// ===== DATA DEMO CHO PHIM LẺ =====
const MOVIE = {
  id: 101,
  title: "Bố già 2 (The Godfather Part II)",
  duration: "3h 22m",
  year: 1974,
  age: "T16",
  genres: ["Chính kịch","Tâm lý","Tội phạm"],
  desc: "Phần tiếp theo kể câu chuyện song song giữa Michael Corleone và tuổi trẻ của Vito Corleone.",
  country: "Mỹ",
  director: "Francis Ford Coppola",
  cast: "Al Pacino, Robert De Niro",
  imdb: 8.7,
  poster: "assets/img/phimbomoi1.jpg"
};

const SERVERS = ["Server 1","Server 2","VIP"];
const QUALITIES = ["1080p","720p","480p"];

// Map chất lượng -> file (demo cùng 1 file)
const SOURCES = {
  "1080p": "assets/video/demo.mp4",
  "720p" : "assets/video/demo.mp4",
  "480p" : "assets/video/demo.mp4",
};

// ===== Render INFO LEFT =====
(function fillInfo(){
  qs("#poster").src = MOVIE.poster;
  qs("#title-side").textContent = MOVIE.title;
  qs("#dur-side").textContent   = MOVIE.duration;
  qs("#year-side").textContent  = MOVIE.year;
  qs("#age-side").textContent   = MOVIE.age;
  qs("#genres-side").innerHTML  = MOVIE.genres.map(g=>`<span class="badge">${g}</span>`).join("");
  qs("#desc-side").textContent  = MOVIE.desc;
  qs("#country").textContent    = MOVIE.country;
  qs("#director").textContent   = MOVIE.director;
  qs("#cast").textContent       = MOVIE.cast;
  qs("#imdb").textContent       = "IMDb " + MOVIE.imdb;
})();

// ===== Player và thanh tool =====
const player = qs("#player");
const source = qs("#video-source");
player.poster = MOVIE.poster;

// set default source
function setSourceByQuality(quality="1080p"){
  const src = SOURCES[quality] || SOURCES["1080p"];
  source.src = src;
  player.load();
  player.play().catch(()=>{});
}

// tool buttons
qs("#btn-toggle").onclick = ()=> player.paused ? player.play() : player.pause();
qs("#btn-back").onclick   = ()=> player.currentTime = Math.max(0, player.currentTime - 10);
qs("#btn-fwd").onclick    = ()=> player.currentTime = Math.min(player.duration || 1e9, player.currentTime + 10);
qs("#btn-settings").onclick = ()=> alert("Demo: mở popup cài đặt sau này.");
qs("#btn-fs").onclick = ()=> {
  if(document.fullscreenElement){ document.exitFullscreen(); }
  else{ player.requestFullscreen?.(); }
};

// ===== Render server/quality chips =====
function chipsHTML(arr, activeIdx=0){ 
  return arr.map((t,i)=>`<button class="chip ${i===activeIdx?'active':''}">${t}</button>`).join("");
}
qs("#server-chips").innerHTML  = chipsHTML(SERVERS, 0);
qs("#quality-chips").innerHTML = chipsHTML(QUALITIES, 0);

// behavior choose 1
function bindSingleSelect(containerSel, onChange){
  const area = qs(containerSel);
  area.addEventListener("click", (e)=>{
    const b = e.target.closest(".chip"); if(!b) return;
    qsa(".chip", area).forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    onChange?.(b.textContent.trim());
  });
}
bindSingleSelect("#server-chips", (server)=> {
  // demo: chỉ hiển thị thông báo server
  console.log("server:", server);
});
bindSingleSelect("#quality-chips", (q)=> {
  setSourceByQuality(q);
});

// khởi tạo
setSourceByQuality("1080p");

// ===== Tabs: Danh sách tập (không dùng cho phim lẻ) & Bình luận =====
qsa(".tab").forEach(t=> t.onclick = ()=>{
  qsa(".tab").forEach(x=>x.classList.remove("active"));
  t.classList.add("active");
  const k=t.dataset.tab;
  qs("#panel-eps").style.display = k==='eps'?'block':'none';
  qs("#panel-cmt").style.display = k==='cmt'?'block':'none';
});

// ===== Like & Comments demo =====
qs("#btn-like").onclick = ()=> alert("Đã thêm vào Yêu thích (demo).");

const demoCmts=[
  {name:"Người dùng 1", time:"vừa xong", text:"Phim đỉnh của đỉnh!"},
  {name:"Người dùng 2", time:"1 giờ trước", text:"Âm nhạc tuyệt vời."}
];
const cmtList=qs("#cmt-list");
function renderCmts(){
  cmtList.innerHTML = demoCmts.map(c=>`
    <div class="cmt">
      <div class="name">${c.name} <span class="time">· ${c.time}</span></div>
      <div class="text">${c.text}</div>
    </div>`).join('');
}
renderCmts();
qs("#cmt-send").onclick=()=>{
  const t=qs("#cmt-text"); if(!t.value.trim()) return;
  demoCmts.unshift({name:"Bạn", time:"vừa xong", text:t.value.trim()});
  t.value=""; renderCmts();
};

// ===== Suggest (đồng bộ card) =====
const SUGGEST = [
  {id:201,title:"Forrest Gump",poster:"assets/img/dienanhmoi1.jpg"},
  {id:202,title:"Bố già (P1)",poster:"assets/img/phimbomoi2.jpg"},
  {id:203,title:"Hành tinh cát: Phần 1",poster:"assets/img/dienanhmoi4.jpg"},
  {id:204,title:"Nhà tù Shawshank",poster:"assets/img/phimbomoi4.jpg"},
  {id:205,title:"Oppenheimer",poster:"assets/img/dienanhmoi3.jpg"},
];
qs("#suggest-grid").innerHTML = SUGGEST.map(m=>`
  <a class="card" href="detail.html?id=${m.id}">
    <div class="poster"><img src="${m.poster}" alt="${m.title}"></div>
    <div class="info"><div class="title">${m.title}</div></div>
  </a>
`).join('');
