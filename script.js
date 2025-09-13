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
  setRainSpeed?.(); // sync matrix rain
  setStickerDrift?.(); // start/stop freer drift
});

/* ===== Matrix Digital Rain (columns w/ bright heads + fading trails) ===== */
(function(){
  const canvas = document.getElementById('matrixCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha:true });

  // Full katakana + ascii vibe
  const glyphs = ('アイウエオカキクケコサシスセソタチツテト' +
                  'ナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン' +
                  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ').split('');

  let colW, cols, drops, speeds, dpr, fontSize;

  function resize(){
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const hero = document.querySelector('.hero');
    const r = hero.getBoundingClientRect();
    canvas.width = Math.floor(r.width * dpr);
    canvas.height = Math.floor(r.height * dpr);
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';

    // font size responsive to width, a bit larger on desktop
    fontSize = Math.max(12, Math.min(22, Math.round(r.width / 58)));
    ctx.font = `${fontSize * dpr}px monospace`;

    colW = fontSize * dpr;
    cols = Math.floor(canvas.width / colW);

    drops  = new Array(cols).fill(0).map(()=> (Math.random()*canvas.height/colW)|0);
    speeds = new Array(cols).fill(0).map(()=> 0.8 + Math.random()*0.8); // per-column speed
  }

  function draw(){
    // trail fade
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const montage = root.classList.contains('montage');

    for (let i=0; i<cols; i++){
      const x = i * colW;
      const y = drops[i] * colW;

      // head (bright)
      ctx.fillStyle = montage ? 'rgba(170,255,190,0.95)' : 'rgba(140,255,170,0.85)';
      ctx.shadowColor = 'rgba(0,255,120,0.45)';
      ctx.shadowBlur  = montage ? 24 : 14;
      const headChar = glyphs[(Math.random()*glyphs.length)|0];
      ctx.fillText(headChar, x, y);

      // trail (dim)
      ctx.shadowBlur = 0;
      ctx.fillStyle = montage ? 'rgba(60,180,95,0.55)' : 'rgba(50,160,90,0.45)';
      const trailLen = 6;
      for (let t=1; t<trailLen; t++){
        const ty = y - t*colW;
        if (ty < 0) break;
        ctx.globalAlpha = (trailLen - t) / (trailLen * (montage?0.9:1.2));
        const ch = glyphs[(Math.random()*glyphs.length)|0];
        ctx.fillText(ch, x, ty);
      }
      ctx.globalAlpha = 1;

      // advance & reset
      drops[i] += speeds[i] * (montage ? 2.0 : 1.0);
      if (y > canvas.height && Math.random() > 0.975){
        drops[i] = 0;
        speeds[i] = 0.8 + Math.random()*0.8;
      }
    }
    requestAnimationFrame(draw);
  }

  function setSpeed(){ /* speed derived per column; we just redraw */ }
  window.setRainSpeed = setSpeed;

  window.addEventListener('resize', resize, { passive:true });
  resize(); draw();
})();

/* ===== Sticker drift (Montage Mode only, bounded to right cluster area) ===== */
(function(){
  const cluster = document.getElementById('stickerCluster');
  if (!cluster) return;

  const stickers = Array.from(cluster.querySelectorAll('.sticker')).map(el => ({
    el, x: el.offsetLeft, y: el.offsetTop,
    ampX: 8 + Math.random()*10,
    ampY: 6 + Math.random()*8,
    spd:  0.8 + Math.random()*0.8,
    phase: Math.random()*Math.PI*2
  }));

  let rect, t0 = performance.now();

  function updateBounds(){
    rect = cluster.getBoundingClientRect();
  }

  function tick(t){
    const montage = document.body.classList.contains('montage');
    if (montage){
      const dt = (t - t0) / 1000;
      stickers.forEach(s => {
        const nx = s.x + Math.sin(dt * s.spd + s.phase) * s.ampX;
        const ny = s.y + Math.cos(dt * (s.spd*0.9) + s.phase) * s.ampY;
        // keep inside cluster box
        const w = s.el.offsetWidth, h = s.el.offsetHeight;
        const clampedX = Math.max(0, Math.min(nx, rect.width  - w));
        const clampedY = Math.max(0, Math.min(ny, rect.height - h));
        s.el.style.transform = `translate(${clampedX}px, ${clampedY}px)`;
      });
    }else{
      // reset transforms when montage off
      stickers.forEach(s => s.el.style.transform = `translate(${s.x}px, ${s.y}px)`);
    }
    requestAnimationFrame(tick);
  }

  window.setStickerDrift = updateBounds;
  window.addEventListener('resize', updateBounds, { passive:true });
  updateBounds(); requestAnimationFrame(tick);
})();

/* ---- Dev Pulse (dummy content) ---- */
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
