const qs = (s, r=document)=>r.querySelector(s);
const qsa = (s, r=document)=>[...r.querySelectorAll(s)];

/* ===== AUTH DEMO ===== */
(function(){
  const isLogin = localStorage.getItem("demo-login")==="1";
  const auth = qs("#auth-actions"); const av = qs("#avatar-btn");
  if(auth && av){ auth.style.display = isLogin ? "none" : ""; av.style.display = isLogin ? "" : "none"; }
})();

/* ===== LẤY PARAM URL id, s, e ===== */
const url = new URL(location.href);
const seriesId = url.searchParams.get("id") || "demoSeries";
let season = parseInt(url.searchParams.get("s") || "1", 10);
let ep     = parseInt(url.searchParams.get("e") || "1", 10);

/* ===== DATA DEMO ===== */
const TOTAL_EPS = 20;              // mỗi season 20 tập (demo)
const POSTER    = "assets/img/phimbomoi1.jpg";
const SOURCES   = {
  "1080p": "assets/video/demo.mp4",
  "720p" : "assets/video/demo.mp4",
  "480p" : "assets/video/demo.mp4"
};

/* ===== PLAYER ===== */
const player = qs("#player");
if (player) player.setAttribute("poster", POSTER);

function loadEpisode(s, e) {
  // demo: thay source theo chất lượng hiện chọn
  const qBtn = qs(".options .group:nth-child(2) .chip.active");
  const quality = qBtn ? qBtn.textContent.trim() : "1080p";
  const src = SOURCES[quality] || SOURCES["1080p"];

  player.pause();
  player.src = src; // ở thực tế bạn sẽ map theo id/s/e
  player.load();
  player.play().catch(()=>{ /* ignore autoplay block */ });

  // lưu last-watched theo series
  localStorage.setItem(`last-${seriesId}`, JSON.stringify({season:s, ep:e, quality}));

  // highlight tập
  qsa(".episodes .chip").forEach(c=>c.classList.remove("active"));
  const active = qs(`.episodes .chip[data-ep='${e}']`);
  if(active) active.classList.add("active");

  // cập nhật URL (không reload)
  const u = new URL(location.href);
  u.searchParams.set("s", s); u.searchParams.set("e", e);
  history.replaceState({}, "", u.toString());

  // scroll tới player
  player.scrollIntoView({behavior:"smooth", block:"start"});
}

/* ===== RENDER DANH SÁCH TẬP ===== */
const wrap = qs("#ep-list");
function renderEpisodes(total=TOTAL_EPS){
  wrap.innerHTML = "";
  for(let i=1;i<=total;i++){
    const b = document.createElement("button");
    b.className = "chip";
    b.dataset.ep = String(i);
    b.textContent = "Tập " + i;
    if(i===ep) b.classList.add("active");
    b.onclick = ()=>{ ep = i; loadEpisode(season, ep); };
    wrap.appendChild(b);
  }
}
renderEpisodes();

/* ===== KHÔI PHỤC LẦN XEM GẦN NHẤT (NẾU KHÔNG CÓ PARAM) ===== */
(function(){
  if(url.searchParams.has("s") || url.searchParams.has("e")) { loadEpisode(season, ep); return; }
  const last = localStorage.getItem(`last-${seriesId}`);
  if(last){
    try{
      const d = JSON.parse(last);
      season = +d.season || 1; ep = +d.ep || 1;
      // set quality đang lưu
      if(d.quality){
        qsa(".options .group:nth-child(2) .chip").forEach(c=>{
          c.classList.toggle("active", c.textContent.trim()===d.quality);
        });
      }
    }catch{}
  }
  loadEpisode(season, ep);
})();

/* ===== CHỌN SERVER / CHẤT LƯỢNG / NGÔN NGỮ ===== */
qsa(".options .group").forEach(group=>{
  group.addEventListener("click", e=>{
    const b = e.target.closest(".chip"); if(!b) return;
    qsa(".chip", group).forEach(x=>x.classList.remove("active"));
    b.classList.add("active");

    // nếu đổi chất lượng thì nạp lại tập hiện tại với source tương ứng
    if(group.querySelector("span")?.textContent.includes("Chất lượng")){
      loadEpisode(season, ep);
    }
  });
});

/* ===== RECOMMEND ===== */
const recData = [
  {id:601,title:"Gumball (spin-off)",poster:"assets/img/dienanhmoi2.jpg"},
  {id:602,title:"Family Guy",poster:"assets/img/phimlemoi2.jpg"},
  {id:603,title:"One Piece",poster:"assets/img/phimlemoi4.jpg"},
  {id:604,title:"Rick and Morty",poster:"assets/img/phimbomoi3.jpg"},
  {id:605,title:"Tom and Jerry: The Fast and the Furry",poster:"assets/img/phimbomoi4.jpg"},
  {id:606,title:"Ben 10",poster:"assets/img/phimbomoi1.jpg"},
];
const recWrap = qs("#recommend");
if(recWrap){
  recWrap.innerHTML = recData.slice(0,5).map(m=>`
    <a class="card" href="series-detail.html?id=${m.id}">
      <img src="${m.poster}" alt="${m.title}">
      <div class="info"><div class="title">${m.title}</div></div>
    </a>
  `).join("");
}
