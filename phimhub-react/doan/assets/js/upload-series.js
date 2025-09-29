// ===== Helpers =====
const qs  = (s, r = document) => r.querySelector(s);
const qsa = (s, r = document) => [...r.querySelectorAll(s)];

// ===== Guard: chỉ admin mới vào =====
(function guard() {
  const isLogin = localStorage.getItem('demo-login') === '1';
  if (!isLogin) { window.location.href = 'login.html'; return; }
  let user = null;
  try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch (e) {}
  if (!user || user.role !== 'admin') { window.location.href = 'profile.html'; return; }

  // show avatar
  qs('#avatar-btn')?.style.removeProperty('display');
  const img = qs('#avatar-small'); if (img) img.src = user.avatar || 'assets/img/avatar.jpg';
})();

// ===== Options cho chips =====
const AGE_OPTS = ['P (Mọi lứa tuổi)', 'K (Dưới 13 tuổi)', 'T13 (13 tuổi trở lên)', 'T16 (16 tuổi trở lên)', 'T18 (18 tuổi trở lên)'];
const GENRE_OPTS = [
  'Anime','Bí ẩn','Chiến tranh','Chiếu rạp','Chuyển thể','Chính kịch','Chính luận',
  'Chính Trị','Cách mạng','Cổ trang','Cổ tích','Cổ điển','DC Comic','Disney',
  'Đời thường','Gay cấn','Gia đình','Giả tưởng','Hoạt hình','Hài','Hành động',
  'Hình sự','Học đường','Khoa học','Kinh dị','Kinh điển','Kỳ ảo','Live Action','Lãng mạn',
  'Lịch sử','Marvel Comic','Người mẫu','Nhạc kịch','Phiêu lưu','Phép thuật','Siêu anh hùng',
  'Thiếu nhi','Thần thoại','Thể thao','Tài liệu','Tâm lý','Tình cảm','Võ thuật','Viễn tưởng','Xuyên không'
];
const QUALITY_OPTS = ['240p','360p','480p','720p','1080p','1440p','2160p'];

// ===== Render chips =====
function renderChips(id, opts) {
  const wrap = qs(id);
  if (!wrap) return;
  wrap.innerHTML = opts.map(t => `<button class="chip" data-value="${t}">${t}</button>`).join('');
  wrap.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    b.classList.toggle('active');
  });
}
renderChips('#age-chips', AGE_OPTS);
renderChips('#genre-chips', GENRE_OPTS);
renderChips('#quality-chips', QUALITY_OPTS);

// ===== Fill năm =====
(function fillYears(){
  const sel = qs('#year'); if(!sel) return;
  const now = new Date().getFullYear();
  for(let y = now; y >= 1980; y--){
    const o = document.createElement('option'); o.value = y; o.textContent = y;
    sel.appendChild(o);
  }
})();

// ===== Add/Clear combo inputs =====
qsa('.pill-add').forEach(btn => {
  btn.addEventListener('click', () => {
    const to  = qs(btn.dataset.append);
    const src = qs(btn.dataset.source);
    if (!to || !src) return;
    const val = src.value.trim(); if (!val) return;
    to.value = (to.value ? (to.value + ', ') : '') + val;
    src.value = '';
  });
});
qsa('.pill-x').forEach(btn => {
  btn.addEventListener('click', () => {
    const el = qs(btn.dataset.clear);
    if (el) el.value = '';
  });
});

// ===== Preview image =====
function bindPreview(fileInputId, imgId) {
  const fi = qs(fileInputId), img = qs(imgId);
  fi?.addEventListener('change', e => {
    const f = e.target.files?.[0]; if (!f) return;
    const rd = new FileReader();
    rd.onload = () => { if (img) img.src = rd.result; };
    rd.readAsDataURL(f);
  });
}
bindPreview('#posterFile', '#posterPreview');
bindPreview('#backdropFile', '#backdropPreview');

// ===== Season / Episode builder =====
const seasonsArea = qs('#seasons-area');

function seasonBlockHTML(idx, epHint='') {
  const n = idx + 1;
  return `
  <div class="season-block" data-season="${n}">
    <div class="row between">
      <h4 class="h4">Phần ${n}</h4>
      <div class="row gap">
        <input class="input input-sm ep-hint" value="${epHint || ''}" placeholder="Gợi ý số tập (VD: 12)"/>
        <button class="btn sm add-ep">+ Thêm tập</button>
        <button class="btn sm danger remove-season">Xoá phần</button>
      </div>
    </div>

    <div class="ep-list"></div>
  </div>`;
}

function epItemHTML(epIndex=1) {
  return `
  <div class="ep-item">
    <div class="video-block compact">
      <div class="placeholder"></div>
      <div class="row gap">
        <label class="btn">
          🎬 Tải bản phim
          <input type="file" accept="video/*" hidden class="ep-file">
        </label>
        <input class="input ep-number" type="number" min="1" value="${epIndex}" placeholder="Tập" style="max-width:120px"/>
        <div class="input-combo">
          <input class="input ep-cut" placeholder="Tên phiên bản (VD: Vietsub)"/>
          <button type="button" class="pill-x remove-ep" title="Xoá">×</button>
        </div>
      </div>
    </div>
  </div>`;
}

function refreshSeasonIndex() {
  qsa('.season-block', seasonsArea).forEach((b, i) => {
    b.dataset.season = String(i + 1);
    const h = b.querySelector('.h4');
    if (h) h.textContent = `Phần ${i + 1}`;
  });
}

// tạo theo số season
qs('#btn-generate-seasons')?.addEventListener('click', () => {
  const count = parseInt(qs('#seasonCount')?.value || '0', 10);
  const epHint = (qs('#episodeHint')?.value || '').trim();
  if (!count || count <= 0) { alert('Nhập số lượng phần hợp lệ.'); return; }
  seasonsArea.innerHTML = '';
  for (let i = 0; i < count; i++) {
    seasonsArea.insertAdjacentHTML('beforeend', seasonBlockHTML(i, epHint));
    const target = seasonsArea.lastElementChild.querySelector('.ep-list');
    // nếu có gợi ý số tập, render luôn
    const hintNum = parseInt(epHint || '0', 10);
    if (hintNum && hintNum > 0) {
      for (let e = 1; e <= hintNum; e++) target.insertAdjacentHTML('beforeend', epItemHTML(e));
    }
  }
  attachSeasonEvents();
});

qs('#btn-add-season')?.addEventListener('click', () => {
  seasonsArea.insertAdjacentHTML('beforeend', seasonBlockHTML(qsa('.season-block', seasonsArea).length, qs('#episodeHint')?.value || ''));
  attachSeasonEvents();
});

function attachSeasonEvents() {
  // Xoá phần
  qsa('.season-block .remove-season', seasonsArea).forEach(btn => {
    btn.onclick = () => {
      btn.closest('.season-block')?.remove();
      refreshSeasonIndex();
    };
  });

  // Thêm tập
  qsa('.season-block .add-ep', seasonsArea).forEach(btn => {
    btn.onclick = () => {
      const list = btn.closest('.season-block')?.querySelector('.ep-list');
      if (!list) return;
      const nextEp = list.children.length + 1;
      list.insertAdjacentHTML('beforeend', epItemHTML(nextEp));
      attachEpEvents(list);
    };
  });

  // bind xoá tập & input file trong các tập có sẵn
  qsa('.season-block .ep-list', seasonsArea).forEach(list => attachEpEvents(list));
}

function attachEpEvents(listEl) {
  qsa('.remove-ep', listEl).forEach(x => {
    x.onclick = () => x.closest('.ep-item')?.remove();
  });
}

// ===== Submit: demo gom dữ liệu =====
qs('#btn-submit')?.addEventListener('click', () => {
  // Gom chips
  const ages     = qsa('#age-chips .chip.active').map(b => b.dataset.value);
  const genres   = qsa('#genre-chips .chip.active').map(b => b.dataset.value);
  const qualities= qsa('#quality-chips .chip.active').map(b => b.dataset.value);

  // Gom meta cơ bản
  const payload = {
    type: 'series',
    title: qs('#title')?.value.trim(),
    originTitle: qs('#originTitle')?.value.trim(),
    actors: qs('#actors')?.value.trim(),
    directors: qs('#directors')?.value.trim(),
    seasonCount: +(qs('#seasonCount')?.value || 0),
    year: qs('#year')?.value,
    country: qs('#country')?.value.trim(),
    studio: qs('#studio')?.value.trim(),
    desc: qs('#desc')?.value.trim(),
    ages, genres, qualities,
    seasons: []
  };

  // Gom phần/tập
  qsa('.season-block', seasonsArea).forEach(sb => {
    const seasonNo = +sb.dataset.season;
    const epList = [];
    qsa('.ep-item', sb).forEach((row) => {
      epList.push({
        ep: +(row.querySelector('.ep-number')?.value || 0),
        cut: row.querySelector('.ep-cut')?.value.trim() || '',
        // file: row.querySelector('.ep-file')?.files?.[0] || null, // demo: không đính kèm binary
      });
    });
    payload.seasons.push({ season: seasonNo, episodes: epList });
  });

  console.log('Upload payload (demo):', payload);
  alert('Demo: Dữ liệu upload đã sẵn sàng trong console. Sau này sẽ gọi API để lưu.');
});

// ===== Logout =====
qs('#btn-logout')?.addEventListener('click', () => {
  localStorage.removeItem('demo-login');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
});
