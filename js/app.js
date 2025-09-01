
const CATS = ['horror','thriller','fantasy','sci-fi','comedy','cartoon','porn','other'];
const STORAGE_KEYS = { movies:'castle.movies.v10', tv:'castle.tv.v10', porn:'castle.porn.v10' };

let section = document.body.dataset.section || 'movies';
let currentFilter = 'All';

const load = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS[section])) || []; } catch { return []; } };
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
    function cleanup(){ confirmBtn.removeEventListener('click', onConfirm); cancelBtn.removeEventListener('click', onCancel); modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }
    confirmBtn.addEventListener('click', onConfirm); cancelBtn.addEventListener('click', onCancel);
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
  });
}

function render(){
  setActiveTab();
  const items = load();
  renderChips(items);
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  const visible = (currentFilter==='All') ? items : items.filter(x => (x.categories||[]).includes(currentFilter));
  visible.forEach(item=>{
    const idx = items.indexOf(item);
    const card = document.createElement('div'); card.className = 'card';
    const a = document.createElement('a'); a.className='window'; a.href=item.link||'#'; a.target='_blank'; a.rel='noopener';
    a.innerHTML = item.img ? `<img src="${item.img}" alt="">` : `<div class="placeholder">No Thumbnail</div>`;
    const actions=document.createElement('div'); actions.className='actions';
    const del=document.createElement('button'); del.className='btn-del'; del.textContent='✖';
    del.onclick=(e)=>{ e.preventDefault(); e.stopPropagation(); if(confirm('Delete this item?')){ const data=load(); data.splice(idx,1); save(data); render(); } };
    actions.appendChild(del); a.appendChild(actions); card.appendChild(a);
    const title=document.createElement('div'); title.className='title';
    title.innerHTML=`<a href="${item.link||'#'}" target="_blank" rel="noopener">${item.title||'Untitled'}</a>`;
    card.appendChild(title);
    const row=document.createElement('div'); row.className='row-btns';
    const coverBtn=document.createElement('button'); coverBtn.className='mini'; coverBtn.textContent='Change Cover';
    coverBtn.onclick=()=>{ const url=prompt('Thumbnail image URL (leave blank to remove):', item.img||''); if(url===null) return; const data=load(); data[idx].img=url.trim()||null; save(data); render(); };
    const editCat=document.createElement('button'); editCat.className='mini'; editCat.textContent='Edit Categories';
    editCat.onclick=async()=>{ const picked=await openPicker(item.categories||[]); if(picked===null) return; const data=load(); data[idx].categories=[...new Set(picked)]; save(data); render(); };
    row.appendChild(coverBtn); row.appendChild(editCat); card.appendChild(row);
    const chosen=document.createElement('div'); chosen.className='chosen';
    (item.categories||[]).forEach(cat=>{ const chip=document.createElement('span'); chip.className='cat'; chip.textContent=cat; chosen.appendChild(chip); });
    card.appendChild(chosen);
    grid.appendChild(card);
  });
}

async function addItem(){
  const link = prompt(`Enter the ${section==='tv'?'show':'link'} (URL):`) || '#';
  const title = prompt(`Enter a title for this ${section==='tv'?'show':'link'}:`) || 'Untitled';
  const categories = await openPicker([]); if(categories===null) return;
  const img = prompt('Thumbnail image URL (optional):') || null;
  const items = load(); items.push({ link, title, img, categories:[...new Set(categories)] }); save(items); currentFilter='All'; render();
}

function setSection(newSection){ section = newSection; currentFilter='All'; render(); }

// Preload seed JSON once (only looks on the page you're on)
function preloadOnce(){
  const key = STORAGE_KEYS[section];
  if(localStorage.getItem(key)) return;
  const tag = document.getElementById('seed-movies'); // only on index.html
  if(tag){
    try{
      const data = JSON.parse(tag.textContent.trim() || '[]');
      localStorage.setItem(key, JSON.stringify(data));
    }catch(e){ console.error('Failed to parse seed JSON', e); }
  }
}

window.addEventListener('DOMContentLoaded', ()=>{
  preloadOnce();
  document.getElementById('tabMovies')?.addEventListener('click', ()=>setSection('movies'));
  document.getElementById('tabTV')?.addEventListener('click', ()=>setSection('tv'));
  document.getElementById('tabPorn')?.addEventListener('click', ()=>setSection('porn'));
  document.getElementById('addBtn')?.addEventListener('click', addItem);
  render();
});
