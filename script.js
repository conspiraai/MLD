// year
document.getElementById('yr').textContent = new Date().getFullYear();

// Montage FX toggle (subtle only)
const toggle = document.getElementById('montageToggle');
const root = document.body;
const saved = sessionStorage.getItem('mld_montage');
if (saved === 'on') { root.classList.add('montage'); toggle.setAttribute('aria-pressed','true'); }
toggle.addEventListener('click', () => {
  const on = root.classList.toggle('montage');
  toggle.setAttribute('aria-pressed', String(on));
  sessionStorage.setItem('mld_montage', on ? 'on' : 'off');
});
