const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

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
