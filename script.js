// --- Matrix toggle & rain ---------------------------------------
const body = document.body;
const toggle = document.getElementById('matrixToggle');
const canvas = document.getElementById('matrixCanvas');
const ctx = canvas.getContext('2d');

let matrixRAF = null;
let columns = [];
const glyphs = 'アカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function resizeMatrix() {
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  columns = Array(Math.floor(canvas.width / 18)).fill(0);
}

function stepMatrix() {
  ctx.fillStyle = 'rgba(5,8,13,0.12)'; // trail
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = '#32ff7e'; // glyph color (slightly green)
  ctx.font = '16px monospace';

  columns.forEach((y, i) => {
    const text = glyphs.charAt(Math.floor(Math.random()*glyphs.length));
    const x = i * 18;
    ctx.fillText(text, x, y);
    const nextY = y > canvas.height + Math.random()*200 ? 0 : y + 18;
    columns[i] = nextY;
  });

  matrixRAF = requestAnimationFrame(stepMatrix);
}

function startMatrix() {
  if (matrixRAF) return;
  resizeMatrix();
  matrixRAF = requestAnimationFrame(stepMatrix);
  window.addEventListener('resize', resizeMatrix);
}

function stopMatrix() {
  if (matrixRAF) cancelAnimationFrame(matrixRAF);
  matrixRAF = null;
  window.removeEventListener('resize', resizeMatrix);
  ctx.clearRect(0,0,canvas.width,canvas.height);
}

function setMatrix(on) {
  body.classList.toggle('matrix-on', on);
  toggle.textContent = `Matrix: ${on ? 'ON' : 'OFF'}`;
  toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
  localStorage.setItem('mld:matrix', on ? '1' : '0');
  on ? startMatrix() : stopMatrix();
}

toggle.addEventListener('click', () => setMatrix(!body.classList.contains('matrix-on')));
setMatrix(localStorage.getItem('mld:matrix') === '1');

// --- Smooth scroll CTA ------------------------------------------
document.getElementById('cta-trending')?.addEventListener('click', (e)=>{
  // anchor already points to #pulse – this keeps smooth behavior cross-browsers
});

// --- Feed rendering ---------------------------------------------
const FEED_EL = document.getElementById('feed');
const EMPTY_EL = document.getElementById('feed-empty');
const PILLS = document.querySelectorAll('.pill');

let FEED = [];

async function loadFeed() {
  try {
    const url = `data/repos.json?ts=${Date.now()}`; // cache-bust
    const res = await fetch(url);
    const json = await res.json();
    FEED = normalize(json.items || []);
    render('all');
  } catch (e) {
    console.error(e);
    FEED = [];
    render('all');
  }
}

function normalize(items) {
  return items.map(x => ({
    source: x.source || 'GitHub',
    title: x.title || 'Untitled',
    url: x.url,
    description: x.description || '',
    language: x.language || 'Other',
    stars: x.stars || 0,
    topics: x.topics || [],
    owner_avatar: x.owner_avatar || null,
    kind: 'Code' // default; you can extend with other kinds
  }));
}

function render(filter) {
  const data = filter==='all' ? FEED : FEED.filter(x => x.kind === filter);
  FEED_EL.innerHTML = '';
  if (!data.length) {
    EMPTY_EL.hidden = false;
    return;
  }
  EMPTY_EL.hidden = true;

  data.slice(0, 30).forEach(item => {
    const el = document.createElement('article');
    el.className = 'card';

    el.innerHTML = `
      <div class="meta">
        ${item.owner_avatar ? `<img src="${item.owner_avatar}" alt="">` : ''}
        <span>${item.source}</span>
      </div>
      <h4>${escapeHTML(item.title)}</h4>
      <p>${escapeHTML(item.description)}</p>

      <div class="badges">
        <span class="badge">${escapeHTML(item.language)}</span>
        <span class="badge">★ ${item.stars.toLocaleString()}</span>
        ${item.topics.slice(0,3).map(t => `<span class="badge">#${escapeHTML(t)}</span>`).join('')}
      </div>

      <div class="row">
        <a class="open" href="${item.url}" target="_blank" rel="noopener">OPEN</a>
        <span class="trend">stars↑</span>
      </div>
    `;
    FEED_EL.appendChild(el);
  });
}

function escapeHTML(s=''){
  return s.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

PILLS.forEach(p => p.addEventListener('click', ()=>{
  PILLS.forEach(x => x.classList.remove('active'));
  p.classList.add('active');
  render(p.dataset.filter);
}));

loadFeed();
