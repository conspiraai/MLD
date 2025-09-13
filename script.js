// footer year
document.getElementById('yr').textContent = new Date().getFullYear();

/* ===== Montage toggle (persisted) ===== */
const toggle = document.getElementById('montageToggle');
const root = document.body;
const saved = sessionStorage.getItem('mld_montage');
if (saved === 'on') { root.classList.add('montage'); toggle.setAttribute('aria-pressed','true'); toggle.textContent = 'Montage: ON'; startBouncers(); }
toggle.addEventListener('click', () => {
  const on = root.classList.toggle('montage');
  toggle.setAttribute('aria-pressed', String(on));
  toggle.textContent = on ? 'Montage: ON' : 'Montage Mode';
  sessionStorage.setItem('mld_montage', on ? 'on' : 'off');
  on ? startBouncers() : stopBouncers();
});

/* ===== Matrix Digital Rain (classic heads + trails) ===== */
(function(){
  const canvas = document.getElementById('matrixCanvas');
  const ctx = canvas.getContext('2d', { alpha:true });
  const glyphs = ('アイウエオカキクケコサシスセソタチツテト' +
                  'ナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン' +
                  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ').split('');
  let colW, cols, drops, speeds, dpr, fontSize;

  function resize(){
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const r = document.getElementById('hero').getBoundingClientRect();
    canvas.width = Math.floor(r.width * dpr);
    canvas.height = Math.floor(r.height * dpr);
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';

    fontSize = Math.max(12, Math.min(22, Math.round(r.width / 58)));
    ctx.font = `${fontSize * dpr}px monospace`;

    colW = fontSize * dpr;
    cols = Math.floor(canvas.width / colW);
    drops  = new Array(cols).fill(0).map(()=> (Math.random()*canvas.height/colW)|0);
    speeds = new Array(cols).fill(0).map(()=> 0.8 + Math.random()*0.8);
  }

  function draw(){
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const montage = root.classList.contains('montage');

    for (let i=0;i<cols;i++){
      const x = i * colW;
      const y = drops[i] * colW;

      // head
      ctx.fillStyle = montage ? 'rgba(170,255,190,0.96)' : 'rgba(140,255,170,0.85)';
      ctx.shadowColor = 'rgba(0,255,120,0.45)';
      ctx.shadowBlur  = montage ? 24 : 14;
      ctx.fillText(glyphs[(Math.random()*glyphs.length)|0], x, y);

      // trail
      ctx.shadowBlur = 0;
      ctx.fillStyle = montage ? 'rgba(60,180,95,0.55)' : 'rgba(50,160,90,0.45)';
      for (let t=1;t<6;t++){
        const ty = y - t*colW; if (ty<0) break;
        ctx.globalAlpha = (6-t)/(6*(montage?0.9:1.2));
        ctx.fillText(glyphs[(Math.random()*glyphs.length)|0], x, ty);
      }
      ctx.globalAlpha = 1;

      // step
      drops[i] += speeds[i] * (montage ? 2.0 : 1.0);
      if (y > canvas.height && Math.random() > 0.975){ drops[i]=0; speeds[i]=0.8+Math.random()*0.8; }
    }
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive:true });
  resize(); draw();
})();

/* ===== Sticker Bouncers (spawn ONLY in Montage Mode, inside hero) ===== */
const STICKERS = [
  'assets/vitalik.png',
  'assets/cz.png',
  'assets/saylor.png',
  'assets/anatoly.png',
  'assets/pumpfun-pill.png',
  'assets/letsbonk-pill.png',
  'assets/devfuel.png',
  'assets/github-octocat.png',
  'assets/windows-error.png',
  'assets/matrix.png'
];

let bouncerRAF = 0;
let bouncers = [];
const hero = document.getElementById('hero');

function startBouncers(){
  stopBouncers(); // clean if re-entering

  const layer = document.createElement('div');
  layer.id = 'bouncer-layer';
  Object.assign(layer.style, {
    position:'absolute', inset:'0', zIndex:1, pointerEvents:'none', overflow:'hidden'
  });
  hero.appendChild(layer);

  const r = layer.getBoundingClientRect();
  const minW = 64, maxW = 130; // sticker sizes

  STICKERS.forEach(src=>{
    const img = document.createElement('img');
    img.src = src; img.alt = '';
    Object.assign(img.style, {
      position:'absolute',
      width: Math.round(minW + Math.random()*(maxW-minW)) + 'px',
      willChange:'transform',
      filter:'drop-shadow(0 6px 0 #fff) drop-shadow(0 10px 22px rgba(0,0,0,.45))'
    });
    layer.appendChild(img);

    const w = img.getBoundingClientRect().width || 90;
    bouncers.push({
      el: img,
      x: Math.random()*(r.width - w),
      y: Math.random()*(r.height - w),
      vx: (Math.random()*1.2 + 0.6) * (Math.random()<0.5?-1:1),
      vy: (Math.random()*1.2 + 0.6) * (Math.random()<0.5?-1:1),
      w
    });
  });

  const step = () => {
    const b = layer.getBoundingClientRect();
    bouncers.forEach(s=>{
      s.x += s.vx; s.y += s.vy;

      // bounce on edges
      if (s.x <= 0 || s.x + s.w >= b.width){ s.vx *= -1; s.x = Math.max(0, Math.min(s.x, b.width - s.w)); }
      if (s.y <= 0 || s.y + s.w >= b.height){ s.vy *= -1; s.y = Math.max(0, Math.min(s.y, b.height - s.w)); }

      s.el.style.transform = `translate(${s.x}px, ${s.y}px) rotate(${s.vx*3}deg)`;
    });
    bouncerRAF = requestAnimationFrame(step);
  };
  bouncerRAF = requestAnimationFrame(step);

  window.addEventListener('resize', onResizeBouncers, { passive:true });
}

function stopBouncers(){
  if (bouncerRAF) cancelAnimationFrame(bouncerRAF);
  bouncerRAF = 0; bouncers = [];
  const layer = document.getElementById('bouncer-layer');
  if (layer) layer.remove();
  window.removeEventListener('resize', onResizeBouncers);
}

function onResizeBouncers(){
  const layer = document.getElementById('bouncer-layer');
  if (!layer) return;
  const r = layer.getBoundingClientRect();
  bouncers.forEach(s=>{
    s.x = Math.max(0, Math.min(s.x, r.width  - s.w));
    s.y = Math.max(0, Math.min(s.y, r.height - s.w));
  });
}

/* ---- Demo Dev Pulse content (static) ---- */
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
