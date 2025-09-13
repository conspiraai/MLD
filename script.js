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

// ---- Dev Pulse (dummy data for MVP) ----
// thumb can reuse your stickers as avatars to keep the brand vibe
const PULSE = [
  {
    type: 'code', source: 'GitHub',
    title: 'New Rust Framework hits 1k⭐ this week',
    summary: 'Zero-cost async primitives and a tiny router. DX is sharp; perf looks insane.',
    url: 'https://github.com/',
    thumb: 'assets/anatoly.png',
    tags: ['#rust', '#backend'], hype: '↑ hot'
  },
  {
    type: 'articles', source: 'Hacker News',
    title: 'TypeScript vs JavaScript: what are we optimizing for?',
    summary: 'Nuanced thread on type safety vs iteration speed. Great comments.',
    url: 'https://news.ycombinator.com/',
    thumb: 'assets/saylor.png',
    tags: ['#typescript', '#architecture'], hype: '2.3k pts'
  },
  {
    type: 'packages', source: 'npm',
    title: 'tiny-sql jumps 420% downloads',
    summary: 'A 3 kB SQL wrapper with template-tag queries, no ORM overhead.',
    url: 'https://www.npmjs.com/',
    thumb: 'assets/devfuel.png',
    tags: ['#npm', '#db'], hype: '+420%'
  },
  {
    type: 'articles', source: 'dev.to',
    title: 'Why Svelte is slapping in 2025',
    summary: 'SSR, islands, and boring-fast builds. A practical take with examples.',
    url: 'https://dev.to/',
    thumb: 'assets/vitalik.png',
    tags: ['#svelte', '#frontend'], hype: 'trending'
  },
  {
    type: 'code', source: 'GitHub',
    title: 'LLM-Playbook: clean eval harness for agents',
    summary: 'Simple yaml scenarios, dataset adapters, and metrics. Fork-and-go.',
    url: 'https://github.com/',
    thumb: 'assets/cz.png',
    tags: ['#ai', '#evals'], hype: 'stars↑'
  },
  {
    type: 'packages', source: 'PyPI',
    title: 'vecdb releases v0.9 with mmap indexes',
    summary: 'Fast ANN on a shoestring. Docs show 10x memory wins on commodity boxes.',
    url: 'https://pypi.org/',
    thumb: 'assets/letsbonk-pill.png',
    tags: ['#python', '#search'], hype: 'new'
  }
];

// render cards
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
