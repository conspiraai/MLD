/* =========
   LIVE FEED MVP
   - GitHub “trending-ish”: repos created in last 7 days, by stars
   - Hacker News: dev stories via Algolia API with points filter
   - Montage Mode: stickers bounce inside the hero code-rain band
   ========= */

const JSON_LIMIT = 12;
const cardsEl = document.getElementById('cards');
const emptyEl = document.getElementById('empty');

/* --------- Matrix code rain (visual only) --------- */
(() => {
  const c = document.getElementById('rain');
  const ctx = c.getContext('2d');
  function size() { c.width = c.clientWidth; c.height = c.clientHeight; }
  size(); addEventListener('resize', size);

  const glyphs = 'アカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const cols = () => Math.floor(c.width / 18);
  let drops = new Array(cols()).fill(0).map(()=> Math.random()*c.height);

  function draw(){
    ctx.fillStyle = 'rgba(8,12,16,0.35)'; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = '#39ff14';
    ctx.font = '16px monospace';
    for (let i=0;i<drops.length;i++){
      const text = glyphs[Math.floor(Math.random()*glyphs.length)];
      const x = i*18, y = drops[i];
      ctx.fillText(text,x,y);
      drops[i] = y > c.height && Math.random()>0.975 ? 0 : y + (12 + Math.random()*8);
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

/* --------- Stickers + Montage Mode --------- */
const STICKERS = [
  'assets/letsbonk-pill.png',
  'assets/pumpfun-pill.png',
  'assets/devfuel.png',
  'assets/github-octocat.png',
  'assets/windows-error.png',
  'assets/vitalik.png',
  'assets/cz.png',
  'assets/saylor.png',
  'assets/anatoly.png'
];
const stage = document.getElementById('stickerStage');
const montageBtn = document.getElementById('montageBtn');
const montageState = document.getElementById('montageState');
let bouncers = [];
let rafId = 0;

function spawnStickers(){
  stage.innerHTML = '';
  bouncers = STICKERS.map(src => {
    const img = new Image();
    img.src = src; img.alt = '';
    stage.appendChild(img);
    const rect = stage.getBoundingClientRect();
    const w = img.width || 84, h = img.height || 84;
    return {
      el: img,
      x: Math.random()*(rect.width-w),
      y: Math.random()*(rect.height-h),
      vx: (Math.random()*2+1)*(Math.random()<.5?-1:1),
      vy: (Math.random()*2+1)*(Math.random()<.5?-1:1)
    };
  });
}
function tick(){
  const r = stage.getBoundingClientRect();
  bouncers.forEach(b=>{
    b.x += b.vx; b.y += b.vy;
    if (b.x<0||b.x>r.width-84) b.vx*=-1;
    if (b.y<0||b.y>r.height-84) b.vy*=-1;
    b.el.style.transform = `translate(${b.x}px,${b.y}px)`;
  });
  rafId = requestAnimationFrame(tick);
}
function startMontage(){
  montageState.textContent = 'ON';
  stage.style.pointerEvents = 'none';
  spawnStickers();
  cancelAnimationFrame(rafId);
  tick();
}
function stopMontage(){
  montageState.textContent = 'OFF';
  cancelAnimationFrame(rafId);
  stage.innerHTML = '';
}
montageBtn.addEventListener('click', ()=>{
  (montageState.textContent === 'OFF') ? startMontage() : stopMontage();
});

/* --------- Data Sources --------- */

async function fetchGitHub() {
  // last 7 days
  const since = new Date(Date.now() - 7*24*3600*1000).toISOString().slice(0,10);
  const url = `https://api.github.com/search/repositories?q=created:>${since}+stars:>20&sort=stars&order=desc&per_page=${JSON_LIMIT}`;
  const res = await fetch(url, { headers: { 'Accept':'application/vnd.github+json' }});
  if (!res.ok) throw new Error('GitHub API failed');
  const json = await res.json();
  return json.items.map(r => ({
    id: `gh_${r.id}`,
    source: 'GitHub',
    title: r.full_name.replace('/', ' / '),
    url: r.html_url,
    summary: r.description || 'No description.',
    badges: [r.language || 'other', `★ ${r.stargazers_count.toLocaleString()}`],
    right: `+${r.stargazers_count.toLocaleString()}★`,
    kind: 'code',
    icon: 'assets/devfuel.png'
  }));
}

async function fetchHN() {
  const q = encodeURIComponent('javascript OR typescript OR rust OR python OR ai OR react OR svelte OR bun');
  const url = `https://hn.algolia.com/api/v1/search?tags=story&numericFilters=points>80&hitsPerPage=${JSON_LIMIT}&query=${q}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('HN API failed');
  const json = await res.json();
  return json.hits.map(h => ({
    id: `hn_${h.objectID}`,
    source: 'Hacker News',
    title: h.title,
    url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
    summary: h._highlightResult && h._highlightResult.title ? ' ' : '',
    badges: ['discussion', `${h.points} pts`],
    right: `${h.points} pts`,
    kind: 'articles',
    icon: 'assets/letsbonk-pill.png'
  }));
}

/* --------- Render --------- */

function badge(html){ return `<span class="b">${html}</span>`; }

function cardHTML(item){
  return `
    <article class="card" data-kind="${item.kind}">
      <div class="src"><img src="${item.icon}" alt="" width="18" height="18" style="border-radius:4px"> ${item.source}</div>
      <h3>${item.title}</h3>
      <p>${item.summary ?? ''}</p>
      <div class="badges">${item.badges.map(badge).join('')}</div>
      <div class="meta">
        <a class="open" href="${item.url}" target="_blank" rel="noopener">OPEN</a>
        <span>${item.right ?? ''}</span>
      </div>
    </article>
  `;
}

function render(items){
  if (!items.length){ cardsEl.innerHTML = ''; emptyEl.hidden = false; return; }
  emptyEl.hidden = true;
  cardsEl.innerHTML = items.map(cardHTML).join('');
}

/* --------- Filters --------- */
const tabs = [...document.querySelectorAll('.tab')];
function applyFilter(kind){
  tabs.forEach(t=>t.classList.toggle('active', t.dataset.filter===kind));
  const cards = [...document.querySelectorAll('.card')];
  let shown = 0;
  cards.forEach(c=>{
    const show = (kind==='all'|| c.dataset.kind===kind);
    c.style.display = show? 'block':'none';
    if (show) shown++;
  });
  emptyEl.hidden = shown>0;
}
tabs.forEach(t=> t.addEventListener('click', ()=> applyFilter(t.dataset.filter)));

/* --------- Boot --------- */
(async function boot(){
  try{
    const [gh, hn] = await Promise.all([
      fetchGitHub().catch(()=>[]),
      fetchHN().catch(()=>[])
    ]);
    // Merge: interleave GH + HN
    const merged = [];
    const max = Math.max(gh.length, hn.length);
    for (let i=0;i<max;i++){ if (gh[i]) merged.push(gh[i]); if (hn[i]) merged.push(hn[i]); }
    render(merged);
  }catch(err){
    console.error(err);
    cardsEl.innerHTML = `<div class="empty">Failed to load live data. Try again later.</div>`;
  }
})();
