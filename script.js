/* ===========================================================
   MLD: Dev Pulse (JSON-powered) + Matrix Rain + Montage Mode
   =========================================================== */

const JSON_URL = 'data/repos.json'; // updated daily by GitHub Action

// ---------- Utilities ----------
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const fmt = n => n >= 1000 ? `${(n/1000).toFixed(1)}k` : `${n}`;

// ---------- Render Feed ----------
async function loadFeed() {
  const feed = $('#feed');
  if (!feed) return;

  try {
    const res = await fetch(`${JSON_URL}?t=${Date.now()}`, { cache: 'no-store' });
    const data = await res.json();

    feed.innerHTML = data.items.map(cardHTML).join('');
    hookOpenButtons();
  } catch (e) {
    console.error('Failed to load feed JSON:', e);
    feed.innerHTML = `<div class="empty">Couldn’t load today’s data. Try again soon.</div>`;
  }
}

function cardHTML(item) {
  const {
    source = 'GitHub',
    title,
    url,
    description = '',
    language,
    stars = 0,
    owner = '',
    tags = []
  } = item;

  const tagChips = [
    language && `#${language.toLowerCase()}`,
    ...tags.map(t => `#${t}`)
  ].filter(Boolean).slice(0, 4).map(t => `<span class="tag">${t}</span>`).join('');

  return `
  <article class="card" role="listitem">
    <header class="meta">
      <span class="src">${source}</span>
      ${owner ? `<span class="owner">${owner}</span>` : ''}
    </header>
    <h3 class="title">${title}</h3>
    <p class="desc">${description}</p>
    <div class="tags">${tagChips}</div>
    <footer class="row">
      <span class="stat">⭐ ${fmt(stars)}</span>
      <a href="${url}" target="_blank" rel="noopener" class="btn mini pill-rwb">OPEN</a>
    </footer>
  </article>`;
}

function hookOpenButtons() {
  // For future analytics or montage pops
}

// ---------- Filters (basic stub; “All/Code” active) ----------
function setupFilters() {
  const chips = $$('.chip');
  chips.forEach(chip => chip.addEventListener('click', () => {
    chips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    // Today everything is "code"; later we’ll filter by item.type
  }));
}

// ---------- Matrix Rain (cleaner, closer to movie) ----------
function startMatrix() {
  const canvas = $('#matrixCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const glyphs = 'アカサタナハマヤラワ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&?';
  const cols = [];
  let w, h, fontSize, columns;

  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
    fontSize = Math.max(14, Math.floor(w / 75));
    columns = Math.floor(w / fontSize);
    cols.length = 0;
    for (let i = 0; i < columns; i++) cols[i] = (Math.random() * -50) | 0;
    ctx.font = `${fontSize}px monospace`;
  }
  resize();
  window.addEventListener('resize', resize);

  function draw() {
    // translucent fade to create trails
    ctx.fillStyle = 'rgba(7, 22, 18, 0.15)';
    ctx.fillRect(0, 0, w, h);

    for (let i = 0; i < columns; i++) {
      const x = i * fontSize;
      const y = cols[i] * fontSize;

      // bright head
      ctx.fillStyle = '#aef1c1';
      ctx.fillText(glyphs[Math.random() * glyphs.length | 0], x, y);

      // dim tail
      ctx.fillStyle = '#0ac26b';
      ctx.fillText(glyphs[Math.random() * glyphs.length | 0], x, y - fontSize);

      // move column
      if (y > h + Math.random() * 300) cols[i] = 0;
      else cols[i]++;
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ---------- Montage Mode (stickers bounce *inside* hero only) ----------
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

let montageOn = false;
let raf;
const bouncers = [];

function toggleMontage() {
  montageOn = !montageOn;
  $('#montageState').textContent = montageOn ? 'ON' : 'OFF';
  const arena = $('#stickerArena');
  if (!arena) return;

  arena.classList.toggle('active', montageOn);
  if (!montageOn) return stopBouncers();

  // spawn stickers to the right side (not covering text)
  arena.innerHTML = '';
  const { width, height } = arena.getBoundingClientRect();
  const minX = Math.floor(width * 0.55); // right 45%
  STICKERS.forEach(src => {
    const el = document.createElement('img');
    el.src = src;
    el.alt = '';
    el.className = 'sticker';
    arena.appendChild(el);

    const w = 72 + Math.random() * 36;
    el.style.width = `${w}px`;
    const x = minX + Math.random() * (width - minX - w);
    const y = Math.random() * (height - w);
    el.style.transform = `translate(${x}px, ${y}px)`;

    const s = 0.6 + Math.random() * 0.9;
    bouncers.push({
      el, x, y, w,
      vx: (Math.random() * 2 + 1) * (Math.random() < .5 ? -1 : 1) * s,
      vy: (Math.random() * 2 + 1) * (Math.random() < .5 ? -1 : 1) * s
    });
  });

  animateBouncers();
}

function animateBouncers() {
  const arena = $('#stickerArena');
  const step = () => {
    const rect = arena.getBoundingClientRect();
    bouncers.forEach(b => {
      b.x += b.vx; b.y += b.vy;

      // bounce
      if (b.x <= 0 || b.x + b.w >= rect.width) b.vx *= -1;
      if (b.y <= 0 || b.y + b.w >= rect.height) b.vy *= -1;

      b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
    });
    raf = requestAnimationFrame(step);
  };
  raf = requestAnimationFrame(step);
}

function stopBouncers() {
  cancelAnimationFrame(raf);
  bouncers.length = 0;
  const arena = $('#stickerArena');
  if (arena) arena.innerHTML = '';
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', () => {
  startMatrix();
  setupFilters();
  loadFeed();

  const btn = $('#montageBtn');
  if (btn) btn.addEventListener('click', toggleMontage);
});
