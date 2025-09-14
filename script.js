/* ---------- tiny utils ---------- */
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const byTag = t => (a,b)=> (a.tags?.includes(t)?-1:1);

/* ---------- tabs / filtering ---------- */
let currentFilter = 'all';
$$('.tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    $$('.tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    render();
  });
});

/* ---------- CTA scroll ---------- */
$$('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if(target){ e.preventDefault(); target.scrollIntoView({behavior:'smooth', block:'start'}); }
  });
});

/* ---------- data ---------- */
let DATA = [];
async function loadData(){
  try{
    const res = await fetch('data/repos.json', {cache:'no-store'});
    DATA = await res.json();
  }catch(err){
    console.error('Failed to load repos.json', err);
    DATA = []; // fail safe
  }
  render();
}

/* ---------- card renderer ---------- */
function itemCard(d){
  const tags = (d.tags||[]).map(t=>`<span class="badge">#${t}</span>`).join('');
  const pts = d.points ? `${d.points}★` : (d.stars ? `${d.stars}★` : '');
  const meta = d.trend ? d.trend : (pts || '');
  const src = d.source || 'GitHub';

  return `
  <article class="card item">
    <div class="src">${src}</div>
    <h3>${d.title || d.name || 'Untitled'}</h3>
    <p>${d.description || '—'}</p>
    <div class="badges">${tags}</div>
    <div class="item-footer">
      <a class="btn open" href="${d.url}" target="_blank" rel="noopener">OPEN</a>
      <div class="meta">${meta}</div>
    </div>
  </article>`;
}

/* ---------- main render ---------- */
function render(){
  const feed = $('#feed');
  if(!feed) return;

  let rows = DATA;
  if(currentFilter !== 'all'){
    rows = rows.filter(r => (r.type || 'code') === currentFilter);
  }
  // a little opinionated: prioritize code, then packages, then articles
  const ordered = [
    ...rows.filter(r => (r.type||'code')==='code').sort(byTag('ai')),
    ...rows.filter(r => (r.type||'code')==='packages'),
    ...rows.filter(r => (r.type||'code')==='articles')
  ];

  feed.innerHTML = ordered.map(itemCard).join('');
}

/* kick it off */
loadData();
