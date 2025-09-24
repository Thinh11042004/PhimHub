// Helpers
const qs = (s, r=document)=>r.querySelector(s);
const qsa = (s, r=document)=>[...r.querySelectorAll(s)];

// Header auth demo
(function(){
  const isLogin = localStorage.getItem("demo-login")==="1";
  const auth = qs("#auth-actions");
  const avatar = qs("#avatar-btn");
  if(isLogin){ auth.style.display="none"; avatar.style.display=""; }
  else { auth.style.display=""; avatar.style.display="none"; }
})();

// ===== Demo data (sau này thay bằng API) =====
const MOVIE = {
  id: 101,
  title: "Nhà Tù Shawshank",
  original: "The Shawshank Redemption",
  imdb: 9.3,
  year: 1994,
  duration: "2h 22m",
  age: "T16",
  country: "Mỹ",
  director: "Frank Darabont",
  cast: "Tim Robbins, Morgan Freeman",
  genres: ["Chính kịch","Tâm lý","Tội phạm"],
  desc: "Bị kết án oan, Andy Dufresne tìm thấy hy vọng và tình bạn trong những năm tháng tù đày tại Shawshank.",
  poster: "assets/img/phimlemoi1.jpg",
  // banner sẽ fallback về poster nếu không có
  banner: "" 
};

const SUGGESTS = [
  {id:1,title:"Forrest Gump",poster:"assets/img/phimlemoi2.jpg"},
  {id:2,title:"12 người đàn ông giận dữ",poster:"assets/img/phimbomoi2.jpg"},
  {id:3,title:"Hành tinh cát: Phần 1",poster:"assets/img/dienanhmoi3.jpg"},
  {id:4,title:"Sự im lặng của bầy cừu",poster:"assets/img/phimbomoi3.jpg"},
  {id:5,title:"Tây du ký",poster:"assets/img/phimbomoi4.jpg"},
  {id:6,title:"Bố già: Phần 1",poster:"assets/img/dienanhmoi1.jpg"},
  {id:7,title:"One Piece",poster:"assets/img/phimlemoi4.jpg"}
];

// ===== Render detail =====
function renderDetail(){
  const heroImg = MOVIE.banner || MOVIE.poster; // dùng poster làm banner nếu không có banner riêng
  qs("#hero-bg").style.backgroundImage = `url(${heroImg})`;
  qs("#poster").src = MOVIE.poster;

  qs("#title").textContent = MOVIE.title;
  qs("#original-title").textContent = MOVIE.original;
  qs("#imdb").textContent = `IMDb ${MOVIE.imdb}`;
  qs("#title-side").textContent = MOVIE.title;
  qs("#dur-side").textContent = MOVIE.duration;
  qs("#year-side").textContent = MOVIE.year;
  qs("#age-side").textContent = MOVIE.age;
  qs("#country").textContent = MOVIE.country;
  qs("#director").textContent = MOVIE.director;
  qs("#cast").textContent = MOVIE.cast;
  qs("#desc-side").textContent = MOVIE.desc;

  qs("#genres-side").innerHTML = MOVIE.genres.map(g=>`<span class="badge">${g}</span>`).join("");

  qs("#btn-watch").href = `watch.html?id=${MOVIE.id}`;
}
renderDetail();

// Tabs
qsa(".tab").forEach(t=>{
  t.addEventListener("click", ()=>{
    qsa(".tab").forEach(x=>x.classList.remove("active"));
    t.classList.add("active");
    const tab = t.dataset.tab;
    qs("#panel-eps").style.display = tab==="eps" ? "block" : "none";
    qs("#panel-cmt").style.display = tab==="cmt" ? "block" : "none";
  });
});

// Suggest carousel
function cardHTML(m){
  return `<a class="card" href="detail.html?id=${m.id}">
    <div class="poster"><img src="${m.poster}" alt="${m.title}"></div>
    <div class="info"><div class="title">${m.title}</div></div>
  </a>`;
}
function paginate(list, size){ const pages=[]; for(let i=0;i<list.length;i+=size) pages.push(list.slice(i,i+size)); return pages; }
(function initSuggest(){
  const track = qs("#suggest-track");
  const pages = paginate(SUGGESTS,5);
  let page = 0;
  function render(){ track.innerHTML = pages[page].map(cardHTML).join(""); }
  render();
  qsa(".carousel .ctrl").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      page = btn.classList.contains("left") ? (page-1+pages.length)%pages.length : (page+1)%pages.length;
      render();
    });
  });
})();

// Comments demo
const cmtList = qs("#cmt-list");
const demoCmts = [
  {name:"Người dùng 1", time:"vừa xong", text:"Phim hay, tuyệt vời!"},
  {name:"Người dùng 2", time:"1 giờ trước", text:"Âm nhạc và diễn xuất đỉnh."}
];
function renderCmts(){
  cmtList.innerHTML = demoCmts.map(c=>`
    <div class="cmt">
      <div class="name">${c.name} <span class="time">· ${c.time}</span></div>
      <div class="text">${c.text}</div>
    </div>
  `).join("");
}
renderCmts();
qs("#cmt-send").addEventListener("click", ()=>{
  const t = qs("#cmt-text");
  if(!t.value.trim()) return;
  demoCmts.unshift({name:"Bạn", time:"vừa xong", text:t.value.trim()});
  t.value=""; renderCmts();
});

// Like demo
qs("#btn-like").addEventListener("click", ()=>alert("Đã thêm vào Yêu thích (demo)"));
