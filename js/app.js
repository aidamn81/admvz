/* Aiden’s Neon Castle — full app.js
   - Movies/TV/Porn sections (localStorage per section)
   - One-time seed preload on Movies page (from <script id="seed-movies">)
   - Click title/thumbnail to open link
   - "…" menu under title: Edit Link, Change Cover, Edit Categories, Delete
*/

const CATS = ['horror','thriller','fantasy','sci-fi','comedy','cartoon','porn','other'];
const STORAGE_KEYS = { movies:'castle.movies.v10', tv:'castle.tv.v10', porn:'castle.porn.v10' };

let section = document.body.dataset.section || 'movies';
let currentFilter = 'All';

const load = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEYS[section])) || []; }
  catch { return []; }
};
const save = (items) => localStorage.setItem(STORAGE_KEYS[section], JSON.stringify(items));

function setActiveTab(){
  document.querySelectorAll('.btn-tab').forEach(b=>b.classList.remove('active'));
  const ids = {movies:'#tabMovies', tv:'#tabTV', porn:'#tabPorn'};
  const el = document.querySelector(ids[section]);
  if(el) el.classList.add('active');
  const addBtn = document.getElementById('addBtn');
  if(addBtn) addBtn.textContent = section==='tv' ? 'Add Show' : (section==='movies' ? 'Add Movie' : 'Add Link');
}

function renderChips(items){
  const wrap = document.getElementById('chips'); if(!wrap) return;
  wrap.innerHTML = '';
  const countFor = (cat) => items.filter(it => (it.categories||[]).includes(cat)).length;
  ['All', ...CATS].forEach(cat=>{
    const chip = document.createElement('div');
    chip.className = 'chip' + (cat===currentFilter ? ' active':''); 
    const count = (cat==='All') ? items.length : countFor(cat);
    chip.innerHTML = `<span>${cat}</span> <span class="count">(${count})</span>`;
    chip.onclick = ()=>{ currentFilter = cat; render(); };
    wrap.appendChild(chip);
  });
}

function openPicker(preset=[]){
  return new Promise((resolve)=>{
    const modal = document.getElementById('catModal');
    const grid = document.getElementById('cbGrid');
    grid.innerHTML = '';
    CATS.forEach(cat=>{
      const row = document.createElement('label'); row.className='opt';
      const checked = preset.includes(cat) ? 'checked' : '';
      row.innerHTML = `<input type="checkbox" value="${cat}" ${checked}><span>${cat}</span>`;
      grid.appendChild(row);
    });
    const confirmBtn = document.getElementById('confirmPick');
    const cancelBtn  = document.getElementById('cancelPick');
    const onConfirm = ()=>{ const picked = Array.from(grid.querySelectorAll('input:checked')).map(i=>i.value); cleanup(); resolve(picked); };
    const onCancel  = ()=>{ cleanup(); resolve(null); };
    function cleanup(){
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
    }
    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
  });
}

function makeMenu(onEditLink, onChangeCover, onEditCats, onDelete){
  const wrap = document.createElement('div'); wrap.className = 'menu';
  const btn = document.createElement('button'); btn.className = 'more-btn'; btn.textContent = '…';
  const panel = document.createElement('div'); panel.className = 'menu-panel';
  const mk = (label, handler)=>{
    const b=document.createElement('button'); b.className='menu-item'; b.textContent=label;
    b.onclick=(e)=>{ e.preventDefault(); e.stopPropagation(); handler(); wrap.classList.remove('open'); };
    return b;
  };
  panel.appendChild(mk('Edit Link', onEditLink));
  panel.appendChild(mk('Change Cover', onChangeCover));
  panel.appendChild(mk('Edit Categories', onEditCats));
  panel.appendChild(mk('Delete', onDelete));
  btn.onclick = (e)=>{ e.preventDefault(); e.stopPropagation(); wrap.classList.toggle('open'); };
  document.addEventListener('click', (ev)=>{ if(!wrap.contains(ev.target)) wrap.classList.remove('open'); });
  wrap.appendChild(btn); wrap.appendChild(panel);
  return wrap;
}

function card(item, idx, items){
  const c = document.createElement('div'); c.className = 'card';

  // Thumbnail opens link
  const a = document.createElement('a'); a.className='window'; a.href=item.link||'#'; a.target='_blank'; a.rel='noopener';
  a.innerHTML = item.img ? `<img src="${item.img}" alt="">` : `<div class="placeholder">No Thumbnail</div>`;
  c.appendChild(a);

  // Title + "…" menu
  const head = document.createElement('div'); head.className = 'row-head';
  const title = document.createElement('div'); title.className='title';
  title.innerHTML = `<a href="${item.link||'#'}" target="_blank" rel="noopener">${item.title||'Untitled'}</a>`;
  head.appendChild(title);

  const menu = makeMenu(
    // Edit Link
    ()=>{ const url = prompt('Enter the link (URL):', item.link || ''); if(url===null) return;
          const data=load(); data[idx].link=(url.trim()||'#'); save(data); render(); },
    // Change Cover
    ()=>{ const url = prompt('Thumbnail image URL (leave blank to remove):', item.img||''); if(url===null) return;
          const data=load(); data[idx].img=(url.trim()||null); save(data); render(); },
    // Edit Categories
    async ()=>{ const picked = await openPicker(item.categories||[]); if(picked===null) return;
                const data=load(); data[idx].categories=[...new Set(picked)]; save(data); render(); },
    // Delete
    ()=>{ if(confirm('Delete this item?')){ const data=load(); data.splice(idx,1); save(data); render(); } }
  );
  head.appendChild(menu);
  c.appendChild(head);

  // Chosen categories under title
  const chosen = document.createElement('div'); chosen.className='chosen';
  (item.categories||[]).forEach(cat=>{ const chip=document.createElement('span'); chip.className='cat'; chip.textContent=cat; chosen.appendChild(chip); });
  c.appendChild(chosen);

  return c;
}

function render(){
  setActiveTab();
  const items = load();
  renderChips(items);
  const grid = document.getElementById('grid'); grid.innerHTML = '';
  const visible = (currentFilter==='All') ? items : items.filter(x => (x.categories||[]).includes(currentFilter));
  visible.forEach(it => grid.appendChild(card(it, items.indexOf(it), items)));
}

async function addItem(){
  const link = prompt(`Enter the ${section==='tv'?'show':'link'} (URL):`) || '#';
  const title = prompt(`Enter a title for this ${section==='tv'?'show':'link'}:`) || 'Untitled';
  const categories = await openPicker([]); if(categories===null) return;
  const img = prompt('Thumbnail image URL (optional):') || null;
  const items = load(); items.push({ link, title, img, categories:[...new Set(categories)] });
  save(items); currentFilter='All'; render();
}

function setSection(newSection){ section = newSection; currentFilter='All'; render(); }

// One-time preload of seed JSON (index.html only)
function preloadOnce(){
  if(section!=='movies') return;
  const key = STORAGE_KEYS.movies;
  if(localStorage.getItem(key)) return;                 // already seeded
  const tag = document.getElementById('seed-movies');   // must exist in index.html
  if(!tag) return;
  try{
    const data = JSON.parse(tag.textContent.trim() || '[]');
    localStorage.setItem(key, JSON.stringify(data));
  }catch(e){ console.error('Failed to parse seed JSON', e); }
}

// Optional: logo fallback via JS (HTML also has onerror)
function ensureLogo(){
  const logo = document.querySelector('.logo');
  if(!logo) return;
  const img = new Image();
  img.onerror = ()=>{ 
    logo.src = 'https://edef11.pcloud.com/DLZh51BqEZ2pnOSB7ZWjPfZ7ZXFqaVkZ3VZZnHXZZsaN5ZwJZXJZJVZxoibDOlI51uhh5jphbiJgBhNz98X/aidensent.png';
  };
  img.src = logo.src;
}

window.addEventListener('DOMContentLoaded', ()=>{
  ensureLogo();        // extra safety for the logo
  preloadOnce();       // seed only on first visit to Movies
  document.getElementById('tabMovies')?.addEventListener('click', ()=>setSection('movies'));
  document.getElementById('tabTV')?.addEventListener('click', ()=>setSection('tv'));
  document.getElementById('tabPorn')?.addEventListener('click', ()=>setSection('porn'));
  document.getElementById('addBtn')?.addEventListener('click', addItem);
  render();
});
