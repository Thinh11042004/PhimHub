// assets/js/lists.js
(function(global){
    const LS_KEY = 'lists';
  
    function getLists(){
      try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }
      catch(e){ return []; }
    }
    function saveLists(arr){ localStorage.setItem(LS_KEY, JSON.stringify(arr)); }
    function nextId(arr){ return (arr.reduce((m,x)=>Math.max(m,x.id),0) + 1) || 1; }
  
    function ensureSeed(){
      const cur = getLists();
      if (cur.length) return;
      saveLists([
        { id:1, name:'Phim hay',       items:[] },
        { id:2, name:'Anime',          items:[] },
        { id:3, name:'Chuẩn bị xem',   items:[] },
      ]);
    }
  
    function createList(name){
      const arr = getLists();
      const id = nextId(arr);
      arr.push({ id, name, items:[] });
      saveLists(arr);
      return id;
    }
    function renameList(id, name){
      const arr = getLists();
      const i = arr.findIndex(x=>x.id===id); if(i<0) return;
      arr[i].name = name; saveLists(arr);
    }
    function deleteList(id){
      saveLists(getLists().filter(x=>x.id!==id));
    }
  
    function addToList(listId, item){
      const arr = getLists();
      const list = arr.find(x=>x.id===listId); if(!list) return false;
      if (!list.items.some(x=>x.id===item.id)) list.items.unshift(item);
      saveLists(arr); return true;
    }
    function removeFromList(listId, itemId){
      const arr = getLists();
      const list = arr.find(x=>x.id===listId); if(!list) return;
      list.items = list.items.filter(x=>x.id!==itemId);
      saveLists(arr);
    }
  
    // ======= Popup chọn danh sách (dùng ở mọi trang) =======
    function openAddToListPicker(item){
      ensureSeed();
      const lists = getLists();
  
      // overlay
      const ov = document.createElement('div');
      ov.style.cssText = `
        position:fixed; inset:0; background:rgba(11,18,32,.45); backdrop-filter:blur(2px);
        display:flex; align-items:center; justify-content:center; z-index:9999;
      `;
      ov.addEventListener('click', (e)=>{ if(e.target===ov) document.body.removeChild(ov); });
  
      // card
      const card = document.createElement('div');
      card.style.cssText = `
        width:min(420px,94%); background:#0f1a2b; color:#e9eefb;
        border:1px solid rgba(255,255,255,.08); border-radius:14px; padding:14px;
        box-shadow:0 10px 30px rgba(0,0,0,.5);
      `;
      card.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:8px;">
          <h3 style="margin:0">➕ Thêm vào danh sách</h3>
          <button id="ls-close" class="btn" style="background:rgba(255,255,255,.08)">✕</button>
        </div>
        <div id="ls-list" style="display:grid; gap:8px; margin-top:10px;"></div>
        <div style="display:flex; gap:8px; margin-top:12px;">
          <input id="ls-new" placeholder="Tạo danh sách mới…" style="flex:1; padding:10px; border-radius:10px; border:1px solid rgba(255,255,255,.12); background:#fff; color:#000"/>
          <button id="ls-create" class="btn primary">Tạo</button>
        </div>
      `;
  
      const listWrap = card.querySelector('#ls-list');
      const render = ()=>{
        const data = getLists();
        listWrap.innerHTML = data.map(x=>`
          <button class="btn" data-id="${x.id}" style="justify-content:flex-start">
            📂 ${x.name}
          </button>`).join('');
        listWrap.querySelectorAll('.btn').forEach(b=>{
          b.addEventListener('click', ()=>{
            addToList(+b.dataset.id, item);
            alert('Đã thêm vào "' + b.textContent.replace('📂','').trim() + '"');
            document.body.removeChild(ov);
          });
        });
      };
      render();
  
      card.querySelector('#ls-create').addEventListener('click', ()=>{
        const name = card.querySelector('#ls-new').value.trim();
        if(!name) return;
        createList(name);
        card.querySelector('#ls-new').value='';
        render();
      });
      card.querySelector('#ls-close').addEventListener('click', ()=> document.body.removeChild(ov));
  
      ov.appendChild(card);
      document.body.appendChild(ov);
    }
  
    // Expose API
    global.ListsAPI = {
      getLists, saveLists, ensureSeed,
      createList, renameList, deleteList,
      addToList, removeFromList,
      openAddToListPicker
    };
  
  })(window);
  