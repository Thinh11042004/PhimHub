// assets/js/upload-movie.js
// ===== Helpers =====
const qs = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => [...r.querySelectorAll(s)];

// ===== Guard admin (demo) =====
(function guard() {
  const isLogin = localStorage.getItem('demo-login') === '1';
  if (!isLogin) { window.location.href = 'login.html'; return; }
  let user = null;
  try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) {}
  if (!user || user.role !== 'admin') {
    window.location.href = 'profile.html'; // chặn non-admin
  } else {
    qs('#avatar-btn')?.style.removeProperty('display');
    const img = qs('#avatar-small'); if (img) img.src = user.avatar || 'assets/img/avatar.jpg';
  }
})();

// ===== Years select =====
(function fillYears() {
  const yearSel = qs('#year'); if (!yearSel) return;
  const now = new Date().getFullYear();
  for (let y = now; y >= 1980; y--) {
    const o = document.createElement('option');
    o.value = y; o.textContent = y;
    yearSel.appendChild(o);
  }
})();

// ===== Pills add/clear =====
qsa('.pill-add').forEach(btn => {
  btn.addEventListener('click', () => {
    const to = qs(btn.dataset.append);
    const src = qs(btn.dataset.source);
    if (!to || !src) return;
    const val = src.value.trim();
    if (!val) return;
    to.value = (to.value ? `${to.value}, ` : '') + val;
    src.value = '';
  });
});
qsa('.pill-x').forEach(btn => {
  btn.addEventListener('click', () => {
    const el = qs(btn.dataset.clear);
    if (el) el.value = '';
  });
});

// ===== Image/Video preview =====
function bindPreview(fileInputId, imgId) {
  const fi = qs(fileInputId), img = qs(imgId);
  fi?.addEventListener('change', (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { if (img) img.src = rd.result; };
    rd.readAsDataURL(f);
  });
}
bindPreview('#posterFile', '#posterPreview');
bindPreview('#backdropFile', '#backdropPreview');

qs('#trailerFile')?.addEventListener('change', (e) => {
  const f = e.target.files?.[0]; if (!f) return;
  qs('#trailerPreview').src = URL.createObjectURL(f);
});

// ===== CHIP DATA =====
const AGE_OPTS = [
  'P (Mọi lứa tuổi)',
  'K (Dưới 13 tuổi)',
  'T13 (13 tuổi trở lên)',
  'T16 (16 tuổi trở lên)',
  'T18 (18 tuổi trở lên)',
];

const GENRE_OPTS = [
  'Anime', 'Bí ẩn', 'Chiến tranh', 'Chiếu rạp', 'Chuyển thể', 'Chính kịch', 'Chính luận',
  'Chính Trị', 'Cách mạng', 'Cổ trang', 'Cổ tích', 'Cổ điển', 'DC Comic', 'Disney',
  'Đời thường', 'Gay cấn', 'Gia đình', 'Giả tưởng', 'Hoạt hình', 'Hài', 'Hành động',
  'Hình sự', 'Học đường', 'Khoa học', 'Kinh dị', 'Kinh điển', 'Kỳ ảo', 'Live Action',
  'Lãng mạn', 'Lịch sử', 'Marvel Comic', 'Người mẫu', 'Nhạc kịch', 'Phiêu lưu',
  'Phép thuật', 'Siêu anh hùng', 'Thiếu nhi', 'Thần thoại', 'Thể thao', 'Tài liệu',
  'Tâm lý', 'Tình cảm', 'Võ thuật', 'Viễn tưởng', 'Xuyên không'
];

const QUALITY_OPTS = ['240p','360p','480p','720p','1080p','1440p','2160p'];

// ===== Render chips & interactions =====
function makeChip(label) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.textContent = label;
  return b;
}

function renderChips(container, list, singleSelect = false) {
  container.innerHTML = '';
  list.forEach(txt => container.appendChild(makeChip(txt)));

  container.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;

    if (singleSelect) {
      qsa('.chip', container).forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    } else {
      chip.classList.toggle('active');
    }
  });
}

renderChips(qs('#age-chips'), AGE_OPTS, /* singleSelect */ true);
renderChips(qs('#genre-chips'), GENRE_OPTS, /* multi */ false);
renderChips(qs('#quality-chips'), QUALITY_OPTS, /* singleSelect */ true);

// Helper to read selected chips
function getSelectedChips(container) {
  return qsa('.chip.active', container).map(el => el.textContent.trim());
}

// ===== Submit (demo – gom cả bộ lọc) =====
qs('#btn-submit')?.addEventListener('click', () => {
  const payload = {
    title: qs('#title')?.value.trim() || '',
    originTitle: qs('#originTitle')?.value.trim() || '',
    actors: qs('#actors')?.value.trim() || '',
    directors: qs('#directors')?.value.trim() || '',
    versions: qs('#versions')?.value.trim() || '',
    year: qs('#year')?.value || '',
    country: qs('#country')?.value.trim() || '',
    studio: qs('#studio')?.value.trim() || '',
    desc: qs('#desc')?.value.trim() || '',
    // selections
    age: getSelectedChips(qs('#age-chips'))[0] || '',
    genres: getSelectedChips(qs('#genre-chips')),
    quality: getSelectedChips(qs('#quality-chips'))[0] || ''
  };

  // TODO: gọi API thật ở đây.
  console.log('UPLOAD PAYLOAD', payload);
  alert('Demo nhận dữ liệu:\n' + JSON.stringify(payload, null, 2));
});

// ===== Logout =====
qs('#btn-logout')?.addEventListener('click', () => {
  localStorage.removeItem('demo-login');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});
