// footer year
document.getElementById('yr').textContent = new Date().getFullYear();

/* ===== Montage toggle (visible + persisted) ===== */
const toggle = document.getElementById('montageToggle');
const root = document.body;
const saved = sessionStorage.getItem('mld_montage');
if (saved === 'on') { root.classList.add('montage'); toggle.setAttribute('aria-pressed','true'); toggle.textContent = 'Montage: ON'; }
toggle.addEventListener('click', () => {
  const on = root.classList.toggle('montage');
  toggle.setAttribute('aria-pressed', String(on));
  toggle.textContent = on ? 'Montage: ON' : 'Montage Mode';
  sessionStorage.setItem('mld_montage', on ? 'on' : 'off');
  setRainSpeed?.(); // sync rain speed/brightness
});

/* ===== Matrix Digital Rain (falling glyph columns) ===== */
(function(){
  const canvas = document.getElementById('matrixCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha:true });
  const glyphs = 'アカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  let fontSize, cols, drops, dpr, speed;

  function resize(){
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const hero = document.querySelector('.hero');
    const r = hero.getBoundingClientRect();
    canvas.width = Math.floor(r.width * dpr);
    canvas.height = Math.floor(r.height * dpr);
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';

    fontSize = Math.max(12, Math.min(22, Math.round(r.width / 60)));
    ctx.font = `${fontSize * dpr}px monospace`;

    cols = Math.floor(canvas.width / (fontSize * dpr));
    drops = new Array(cols).fill(0).map(()=> (Math.random()*canvas.height/fontSize)|0);
  }

  function draw(){
    // trail fade
    ctx.fillStyle = 'rgba(0,0,0,0.09)';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const montage = document.body.classList.contains('montage');
    ctx.fillStyle   = montage ? 'rgba(140,255,170,0.95)' : 'rgba(110,255,160,0.78)';
    ctx.shadowColor = 'rgba(0,255,120,0.4)';
    ctx.shadowBlur  = montage ? 20 : 10;

    for (let i=0; i<cols; i++){
      const char = glyphs[(Math.random()*glyphs.length)|0];
      const x = i * fontSize * dpr;
      const y = drops[i] * fontSize * dpr;
      ctx.fillText(char, x, y);

      if (y > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i] += speed;
    }
    requestAnimationFrame(draw);
  }

  function setSpeed(){
    // obvious difference between modes
    speed = document.body.classList.contains('montage') ? 2.0 : 0.9;
  }
  window.setRainSpeed = setSpeed;

  window.addEventListener('resize', () => { resize(); setSpeed(); });
  resize(); setSpeed(); draw();
})();

/* ---- Dev Pulse (dummy data for MVP) ---- */
const PULSE = [
  { type:'code', source:'GitHub', title:'New Rust Framework hits 1k⭐ this week',
    summary:'Zero-cost async primitives and a tiny router. DX is sharp; perf looks insane.',
    url:'https://github.com/', thumb:'assets/anatoly.png', tags:['#rust','#backend'], hype:'↑ hot' },
  { type:'articles', source:'Hacker News', title:'TypeScript vs JavaScript: what are we optimizing for?',
    summary:'Nuanced thread on type safety vs iteration speed. Great comments.',
    url:'https://news.ycombinator.com/', thumb:'assets/saylor.png', tags:['#typescript','#architecture'], hype:'2.3k pts' },
  { type:'packages', source:'npm', title:'tiny-sql jumps 420% downloads',
    summary:'A 3 kB SQL wrapper with template-tag queries, no ORM overhead.',
    url:'https://www.npmjs.com/', thumb:'assets/devfuel.png', tags:['#npm','#db'], hype:'+420%' },
  { type:'articles', source:'dev.to', title:'Why Svelte is slapping in 2025',
    summary:'SSR, islands, and boring-fast builds. A practical take with examples.',
    url:'https://dev.to/', thumb:'assets/vitalik.png', tags:['#svelte','#frontend'], hype:'trending' },
  { type:'code', source:'GitHub', title:'LLM-Playbook: clean eval harness for agents',
    summary:'Simple yaml scenarios, dataset adapters, and metrics. Fork-and-go.',
    url:'https://github.com/', thumb:'assets/cz.png', tags:['#ai','#evals'], hype:'stars↑' },
  { type:'packages', source:'PyPI', title:'vecdb releases v0.9 with mmap indexes',
    summary:'Fast ANN on a shoestring. Docs show 10x memory wins on commodity boxes.',
    url:'https://pypi.org/', thumb:'assets/letsbonk-pill.png', tags:['#python','#search'], hype:'new' }
];

const grid = document.getElementById('pulseGrid');
function cardHTML(item){
  const tags = item.tags.map(t=>`<span class="tag">${t}</span>`).join('');
  return `
    <article class="card pulse-card reveal" data-type="${item.type}">
      <div class="meta">
        <img class="thumb" src="${item.thumb}" alt="" />
        <div>
          <div class="source">${item.source}</div>
          <div class="title">${item.title}</div>
        </div>
      </div>
      <p class="summary">${item.summary}</p>
      <div class="tags">${tags}</div>
      <div class="actions">
        <a class="btn-mini" href="${item.url}" target="_blank" rel="noopener">Open</a>
        <div class="stat">${item.hype}</div>
      </div>
    </article>
  `;
}
grid.innerHTML = PULSE.map(cardHTML).join('');

// reveal-on-scroll
const io = new IntersectionObserver((entries)=>{
  for (const e of entries){
    if (e.isIntersecting){ e.target.classList.add('revealed'); io.unobserve(e.target); }
  }
},{threshold:0.2});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// filters
document.querySelectorAll('.chip').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.chip').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const f = btn.dataset.filter;
    document.querySelectorAll('.pulse-card').forEach(c=>{
      c.style.display = (f==='all' || c.dataset.type===f) ? '' : 'none';
    });
  });
});
