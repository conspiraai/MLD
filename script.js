// year
document.getElementById('yr').textContent = new Date().getFullYear();

// Montage toggle
const toggle = document.getElementById('montageToggle');
const root = document.body;
const saved = sessionStorage.getItem('mld_montage');
if (saved === 'on') { root.classList.add('montage'); toggle.setAttribute('aria-pressed','true'); }
toggle.addEventListener('click', () => {
  const on = root.classList.toggle('montage');
  toggle.setAttribute('aria-pressed', String(on));
  sessionStorage.setItem('mld_montage', on ? 'on' : 'off');
});

// Reveal-on-scroll for sticker grid
const io = new IntersectionObserver((entries)=>{
  for (const e of entries){
    if (e.isIntersecting){ e.target.classList.add('revealed'); io.unobserve(e.target); }
  }
},{threshold:0.2});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// --------- Montage Playground (Canvas) ----------
const stage = document.getElementById('stage');
const ctx = stage.getContext('2d');
const DPR = Math.max(1, window.devicePixelRatio || 1);
function fitCanvas(){
  const w = stage.clientWidth, h = stage.clientHeight;
  stage.width  = Math.round(w * DPR);
  stage.height = Math.round(h * DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  draw();
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const stickers = []; // {img, src, x,y, s, r}
const order = () => stickers; // z-order = array order
const assets = [
  "assets/vitalik.png","assets/cz.png","assets/saylor.png","assets/anatoly.png",
  "assets/pumpfun-pill.png","assets/letsbonk-pill.png","assets/devfuel.png",
  "assets/github-octocat.png","assets/windows-error.png","assets/matrix.png"
];
const cache = new Map();
function load(src){
  return new Promise((res, rej)=>{
    if (cache.has(src)) return res(cache.get(src));
    const i = new Image(); i.onload = ()=>{cache.set(src,i); res(i)}; i.onerror = rej; i.src = src;
  });
}
function addSticker(src, x = 60 + Math.random()*200, y = 60 + Math.random()*120, s = 0.6 + Math.random()*0.3){
  return load(src).then(img=>{
    stickers.push({img, src, x, y, s, r: (Math.random()*0.2 - 0.1)});
    draw();
  });
}
function draw(){
  // clear
  ctx.clearRect(0,0,stage.width,stage.height);
  // draw all
  for (const st of order()){
    ctx.save();
    ctx.translate(st.x, st.y);
    ctx.rotate(st.r);
    const w = st.img.width * st.s;
    const h = st.img.height * st.s;
    ctx.drawImage(st.img, -w/2, -h/2, w, h);
    ctx.restore();
  }
}

// hit test
function hit(mx,my){
  for (let i=stickers.length-1;i>=0;i--){
    const st = stickers[i];
    const w = st.img.width * st.s, h = st.img.height * st.s;
    // inverse transform
    const dx = mx - st.x, dy = my - st.y;
    const a = Math.cos(-st.r), b = Math.sin(-st.r);
    const rx = a*dx - b*dy, ry = b*dx + a*dy;
    if (rx > -w/2 && rx < w/2 && ry > -h/2 && ry < h/2) return i;
  }
  return -1;
}

let drag = null; // {idx, ox, oy}
let lastTap = 0;

function pointerPos(e){
  const rect = stage.getBoundingClientRect();
  const x = (e.touches? e.touches[0].clientX : e.clientX) - rect.left;
  const y = (e.touches? e.touches[0].clientY : e.clientY) - rect.top;
  return {x,y};
}

stage.addEventListener('pointerdown', (e)=>{
  const p = pointerPos(e);
  const idx = hit(p.x, p.y);
  const now = performance.now();
  if (idx >= 0){
    // bring to front
    stickers.push(stickers.splice(idx,1)[0]);
    const st = stickers[stickers.length-1];
    drag = {idx: stickers.length-1, ox: p.x - st.x, oy: p.y - st.y};
    draw();
    // double-click/tap deletes
    if (now - lastTap < 280){ stickers.splice(drag.idx,1); drag=null; draw(); }
    lastTap = now;
  }
});
stage.addEventListener('pointermove', (e)=>{
  if (!drag) return;
  const p = pointerPos(e);
  const st = stickers[drag.idx];
  st.x = p.x - drag.ox;
  st.y = p.y - drag.oy;
  draw();
});
window.addEventListener('pointerup', ()=> drag=null);

// wheel: scale (Alt/Option) or rotate (Shift)
stage.addEventListener('wheel', (e)=>{
  const p = pointerPos(e);
  const idx = hit(p.x, p.y);
  if (idx < 0) return;
  const st = stickers[idx];
  if (e.shiftKey){
    st.r += (e.deltaY>0? 0.05 : -0.05);
  }else{
    const factor = (e.altKey || e.metaKey)? 1.06 : 1.12;
    st.s *= (e.deltaY>0? 1/factor : factor);
    st.s = Math.max(0.12, Math.min(2.5, st.s));
  }
  e.preventDefault();
  draw();
},{passive:false});

// Controls
document.getElementById('addBtn').addEventListener('click', ()=>{
  const src = document.getElementById('addSelect').value;
  addSticker(src);
});
document.getElementById('shuffleBtn').addEventListener('click', ()=>{
  for (const st of stickers){
    st.x = 90 + Math.random()*(stage.clientWidth-180);
    st.y = 90 + Math.random()*(stage.clientHeight-180);
    st.r = (Math.random()*0.6 - 0.3);
  }
  draw();
});
document.getElementById('clearBtn').addEventListener('click', ()=>{
  stickers.length = 0; draw();
});
document.getElementById('saveBtn').addEventListener('click', ()=>{
  const data = stickers.map(s=>({src:s.src,x:s.x,y:s.y,s:s.s,r:s.r}));
  localStorage.setItem('mld_layout', JSON.stringify(data));
  flash('Saved layout');
});
document.getElementById('loadBtn').addEventListener('click', async ()=>{
  const raw = localStorage.getItem('mld_layout'); if(!raw) return flash('No saved layout');
  const data = JSON.parse(raw);
  stickers.length = 0;
  for (const it of data){ await addSticker(it.src, it.x, it.y, it.s).then(()=>{stickers[stickers.length-1].r = it.r;}); }
  draw(); flash('Loaded layout');
});
document.getElementById('exportBtn').addEventListener('click', ()=>{
  // export at device pixel ratio
  const url = stage.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url; a.download = `mld-montage-${Date.now()}.png`; a.click();
  flash('Exported PNG');
});

// mini toast
function flash(text){
  let el = document.getElementById('toast');
  if(!el){ el = document.createElement('div'); el.id='toast'; document.body.appendChild(el); }
  el.textContent = text; el.className='show';
  setTimeout(()=> el.classList.remove('show'), 1400);
}
// toast style (inline to keep single CSS file clean)
const style = document.createElement('style');
style.textContent = `
#toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:rgba(14,18,30,.9);border:1px solid rgba(255,255,255,.2);padding:10px 14px;border-radius:10px;color:#e9eefc;opacity:0;pointer-events:none}
#toast.show{opacity:1;transition:opacity .25s ease}
`;
document.head.appendChild(style);

// preload a few defaults into stage for vibe
Promise.all([
  addSticker("assets/vitalik.png", 220, 220, 0.55),
  addSticker("assets/cz.png", 440, 260, 0.55),
  addSticker("assets/devfuel.png", 640, 300, 0.6)
]);
