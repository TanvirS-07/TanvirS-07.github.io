const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// split headline into words so they can animate in one by one
(function splitWords(el) {
  let n = 0;
  const walk = node => [...node.childNodes].forEach(c => {
    if (c.nodeType === 3) {
      const f = document.createDocumentFragment();
      c.textContent.split(/(\s+)/).forEach(t => {
        if (!t.trim()) return f.append(t);
        const s = document.createElement('span');
        s.className = 'w'; s.textContent = t; s.style.setProperty('--d', n++);
        f.append(s);
      });
      c.replaceWith(f);
    } else walk(c);
  });
  walk(el);
})(document.getElementById('h1'));
// force reflow or the transition doesn't run
void document.body.offsetWidth;
document.body.classList.add('loaded');

// fade stuff in on scroll
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.rv').forEach(el => io.observe(el));

// logo strip, icons from simple icons
const slugs = ['typescript','react','nextdotjs','nodedotjs','python','go','postgresql','docker','kubernetes','terraform','githubactions','linux','tailwindcss','git'];
const track = document.getElementById('track');
const make = () => slugs.map(s => `<span role="img" aria-label="${s}" style="--i:url(https://cdn.simpleicons.org/${s})"></span>`).join('');
track.innerHTML = make() + `<div style="display:contents" aria-hidden="true">${make()}</div>`;

// project image that follows the mouse
const preview = document.getElementById('preview');
const rows = [...document.querySelectorAll('.row')];
rows.forEach(r => { const im = new Image(); im.src = r.dataset.img; im.alt = ''; preview.append(im); r._img = im; });
if (!reduce && matchMedia('(hover: hover)').matches) {
  let x = 0, y = 0, cx = 0, cy = 0, raf = null;
  const loop = () => {
    cx += (x - cx) * .14; cy += (y - cy) * .14;
    preview.style.transform = `translate3d(${cx + 24}px, ${cy - 130}px, 0)`;
    raf = Math.abs(x - cx) + Math.abs(y - cy) > .1 ? requestAnimationFrame(loop) : null;
  };
  const list = document.getElementById('workList');
  list.addEventListener('pointermove', e => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(loop); });
  list.addEventListener('pointerenter', e => { cx = x = e.clientX; cy = y = e.clientY; preview.classList.add('on'); });
  list.addEventListener('pointerleave', () => preview.classList.remove('on'));
  rows.forEach(r => r.addEventListener('pointerenter', () => {
    rows.forEach(o => o._img.classList.toggle('show', o === r));
  }));
}

// copy email button
const copy = document.getElementById('copy');
copy.onclick = async () => {
  const label = copy.querySelector('span'), icon = copy.querySelector('i');
  try {
    await navigator.clipboard.writeText(document.getElementById('addr').textContent);
    copy.classList.add('done'); label.textContent = 'Copied'; icon.className = 'ph ph-check';
  } catch (e) { label.textContent = 'Press Ctrl+C'; }
  setTimeout(() => { copy.classList.remove('done'); label.textContent = 'Copy email'; icon.className = 'ph ph-copy'; }, 1800);
};

document.getElementById('yr').textContent = new Date().getFullYear();
