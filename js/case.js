// case study page: just dark mode, header and fade ins (no hero stuff here)

const root = document.documentElement, themeBtn = document.getElementById('theme');
const isDark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
const syncIcon = () => themeBtn.innerHTML = `<i class="ph ${isDark() ? 'ph-sun' : 'ph-moon-stars'}"></i>`;
themeBtn.onclick = () => {
  root.dataset.theme = isDark() ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  syncIcon();
};
syncIcon();

const bar = document.getElementById('bar');
new IntersectionObserver(([e]) => bar.classList.toggle('stuck', !e.isIntersecting))
  .observe(document.getElementById('sentinel'));

const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .1 });
document.querySelectorAll('.rv').forEach(el => io.observe(el));

document.getElementById('yr').textContent = new Date().getFullYear();
