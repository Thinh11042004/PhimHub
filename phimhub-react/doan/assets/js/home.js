// ====== DỮ LIỆU ẢNH LOCAL ======
const slides = [
  {
    title: "Dune: Part Two",
    desc:
      "Hãy theo chân Paul Atreides cùng Chani và người Fremen trên con đường trả thù và cứu lấy nhân loại.",
    badges: ["IMDb 8.7", "2024", "Khoa học", "Viễn tưởng"],
    bg: "assets/img/banner1.jpg",
    thumbs: ["assets/img/banner1.jpg", "assets/img/banner2.jpg"]
  },
  {
    title: "Oppenheimer",
    desc: "Câu chuyện về J. Robert Oppenheimer và dự án Manhattan.",
    badges: ["IMDb 8.6", "2023", "Tiểu sử", "Lịch sử"],
    bg: "assets/img/banner2.jpg",
    thumbs: ["assets/img/banner2.jpg", "assets/img/banner1.jpg"]
  }
];

// Dùng các ảnh poster local (chỉ cần thay ảnh trong thư mục là được)
const posters = [
  "assets/img/phimlemoi1.jpg",
  "assets/img/phimlemoi2.jpg",
  "assets/img/phimlemoi3.jpg",
  "assets/img/phimlemoi4.jpg",
  "assets/img/phimbomoi1.jpg",
  "assets/img/phimbomoi2.jpg",
  "assets/img/phimbomoi3.jpg",
  "assets/img/phimbomoi4.jpg",
  "assets/img/dienanhmoi1.jpg",
  "assets/img/dienanhmoi2.jpg",
  "assets/img/dienanhmoi3.jpg",
  "assets/img/dienanhmoi4.jpg"
];

const sectionData = posters.map((p, i) => ({
  id: i + 1,
  title: `Tựa phim ${i + 1}`,
  year: 2024 - (i % 5),
  poster: p
}));

// ====== TIỆN ÍCH ======
const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => [...r.querySelectorAll(s)];

// ====== AUTH GIẢ LẬP TRÊN HEADER ======
(function initAuth() {
  const isLogin = localStorage.getItem("demo-login") === "1";
  const auth = qs("#auth-actions");
  const avatar = qs("#avatar-btn");
  if (isLogin) {
    auth.style.display = "none";
    avatar.style.display = "";
  } else {
    auth.style.display = "";
    avatar.style.display = "none";
  }
})();

/* ====== SỬA LINK ĐIỀU HƯỚNG (đảm bảo 'Phim bộ' -> series.html) ======
   Một số file HTML cũ có thể vẫn để href="list.html".
   Đoạn dưới sẽ chuẩn hoá lại ngay khi load trang. */
(function fixNavLinks() {
  qsa(".nav a").forEach((a) => {
    const text = a.textContent.trim().toLowerCase();
    if (text === "phim bộ") a.setAttribute("href", "series.html");
    if (text === "phim lẻ") a.setAttribute("href", "list.html");
    if (text === "trending") a.setAttribute("href", "list.html");
    // 'Thể loại' giữ nguyên (#) hoặc tuỳ bạn đổi sau
  });
})();

// ====== HERO SLIDER ======
let current = 0;

function renderHero(i = 0) {
  const s = slides[i];
  qs("#hero-bg").style.backgroundImage = `url("${s.bg}")`;
  qs("#hero-title").textContent = s.title;
  qs("#hero-desc").textContent = s.desc;

  const badges = s.badges
    .map((b, idx) =>
      idx === 0 ? `<span class="imdb">${b}</span>` : `<span class="pill">${b}</span>`
    )
    .join("");
  qs("#hero-badges").innerHTML = badges;

  // thumbnails
  const thumbs = s.thumbs
    .map(
      (t, idx) =>
        `<div class="thumb ${idx === 0 ? "active" : ""}"><img src="${t}" alt=""></div>`
    )
    .join("");
  qs("#thumbs").innerHTML = thumbs;

  // Bấm thumb -> chuyển sang slide kế (demo)
  qsa(".thumb").forEach((el) =>
    el.addEventListener("click", () => {
      current = (current + 1) % slides.length;
      renderHero(current);
    })
  );
}
renderHero(current);

// Auto đổi slide 6s
setInterval(() => {
  current = (current + 1) % slides.length;
  renderHero(current);
}, 6000);

// Like demo
qs("#btn-like").addEventListener("click", () => {
  alert("Đã thêm vào Yêu thích (demo). Sau này nối API để lưu thật.");
});

// ====== SECTION HELPERS (chỉ hiển thị 5 poster, lật trang bằng nút) ======
function cardHTML(m) {
  return `
  <a class="card" href="detail.html?id=${m.id}">
    <div class="poster"><img src="${m.poster}" alt=""></div>
    <div class="info">
      <div class="title">${m.title}</div>
      <div class="meta">${m.year}</div>
    </div>
  </a>`;
}

function paginate(data, size) {
  const pages = [];
  for (let i = 0; i < data.length; i += size) {
    pages.push(data.slice(i, i + size));
  }
  return pages;
}

function initCarousel(trackId, data) {
  const track = qs("#" + trackId);
  const pages = paginate(data, 5);
  let page = 0;

  function render() {
    track.innerHTML = pages[page].map(cardHTML).join("");
  }

  render();

  qsa(`[data-target='${trackId}']`).forEach((btn) => {
    btn.addEventListener("click", () => {
      const isLeft = btn.classList.contains("left");
      if (isLeft) page = (page - 1 + pages.length) % pages.length;
      else page = (page + 1) % pages.length;
      render();
    });
  });
}

// Khởi tạo 4 section
initCarousel("track-watched", sectionData.slice(0, 12));
initCarousel("track-movies", sectionData.slice(4, 16));
initCarousel("track-tv", sectionData.slice(8, 20));
initCarousel("track-top", sectionData.slice(12, 24));

// ====== SEARCH (lọc toàn trang) ======
qs("#search-input").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  qsa(".card").forEach((c) => {
    const t = c.querySelector(".title")?.textContent.toLowerCase() || "";
    c.style.display = t.includes(q) ? "" : "none";
  });
});

// ===== AUTH MODAL =====
const overlay = qs("#auth-overlay");
const loginModal = qs("#login-modal");
const registerModal = qs("#register-modal");

function openModal(which = "login") {
  overlay.style.display = "flex";
  overlay.classList.add("soft"); // mờ nhẹ để vẫn thấy giao diện chính
  document.body.style.overflow = "hidden";
  if (which === "login") {
    loginModal.style.display = "flex";
    registerModal.style.display = "none";
  } else {
    loginModal.style.display = "none";
    registerModal.style.display = "flex";
  }
}

function closeModal() {
  overlay.style.display = "none";
  loginModal.style.display = "none";
  registerModal.style.display = "none";
  document.body.style.overflow = "";
}

// Mở từ 2 nút trên header
qsa("#auth-actions .btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const isLogin = btn.textContent.trim().includes("Đăng nhập");
    openModal(isLogin ? "login" : "register");
  });
});

// Chuyển login <-> register
qs("#to-register").addEventListener("click", (e) => {
  e.preventDefault();
  openModal("register");
});
qs("#to-login").addEventListener("click", (e) => {
  e.preventDefault();
  openModal("login");
});

// Đóng: nút ✕, link "Đóng", click nền, phím ESC
qsa(".auth-close, .close-link").forEach((b) =>
  b.addEventListener("click", closeModal)
);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});
