// 9 clicks on the hero (see dots.js) and the page falls apart.
// only uses transforms so putting it back is just clearing them
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;
  const GRAVITY = 2600;
  const PIECES = [
    '.logo', '.nav > *', '.avail', 'h1 .w', '.lede', '.actions .btn', '.track > span',
    'section .eyebrow', 'section h2', '.sub', '.row', 'details', '.cell', '.mail > *', '.foot > *',
  ];

  let pieces = [], raf = 0, overlay = null, lastFocus = null;

  const onScreen = el => {
    if (el.closest('.sheet')) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  };

  const collect = () => {
    const found = [...new Set(PIECES.flatMap(s => [...document.querySelectorAll(s)]))].filter(onScreen);
    // don't double up if a piece is inside another piece
    return found.filter(el => !found.some(o => o !== el && o.contains(el)));
  };

  const buildOverlay = () => {
    overlay = document.createElement('div');
    overlay.className = 'broken';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'brokenTitle');
    overlay.innerHTML = `
      <div class="broken-inner">
        <h2 id="brokenTitle">Nice. You broke the page.</h2>
        <p>This is what happens when you don't listen.</p>
        <button class="btn btn-solid" type="button"><i class="ph ph-arrow-counter-clockwise"></i> Put it back</button>
      </div>`;
    overlay.querySelector('button').addEventListener('click', mend);
    document.body.append(overlay);
  };

  const showOverlay = () => {
    if (!overlay) buildOverlay();
    overlay.classList.add('show');
    overlay.querySelector('button').focus({ preventScroll: true });
  };

  const fall = () => {
    lastFocus = document.activeElement;
    root.classList.add('is-broken');
    for (const el of document.body.children) if (el !== overlay) el.inert = true;
    if (reduce) { showOverlay(); return; }

    pieces = collect();
    for (const el of pieces) {
      const r = el.getBoundingClientRect();
      el._fall = {
        x: 0, y: 0, a: 0,
        vx: (Math.random() - 0.5) * 320,
        vy: -(60 + Math.random() * 300),
        va: (Math.random() - 0.5) * 300,
        // bottom stuff drops first
        delay: 0.25 + (1 - r.bottom / innerHeight) * 0.35 + Math.random() * 0.2,
      };
      el.style.transition = 'none';
      el.style.willChange = 'transform';
    }

    let last = performance.now(), time = 0;
    const step = now => {
      const dt = Math.min((now - last) / 1000, 0.04);
      last = now; time += dt;
      let moving = false;
      for (const el of pieces) {
        const p = el._fall;
        if (time < p.delay) {
          // shake a bit first
          el.style.transform = `translate(${(Math.random() - 0.5) * 3}px, ${(Math.random() - 0.5) * 3}px)`;
          moving = true;
          continue;
        }
        p.vy += GRAVITY * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt;
        el.style.transform = `translate(${p.x}px, ${p.y}px) rotate(${p.a}deg)`;
        if (p.y < innerHeight * 1.5) moving = true;
      }
      if (moving) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    setTimeout(showOverlay, 1500);
  };

  function mend() {
    cancelAnimationFrame(raf);
    overlay?.classList.remove('show');
    document.activeElement?.blur();
    dispatchEvent(new CustomEvent('pagemend'));
    const done = () => {
      for (const el of pieces) { el.style.transition = ''; el.style.transform = ''; el.style.willChange = ''; delete el._fall; }
      pieces = [];
      root.classList.remove('is-broken');
      for (const el of document.body.children) el.inert = false;
      lastFocus?.focus?.({ preventScroll: true });
    };
    if (reduce || !pieces.length) { done(); return; }
    const ordered = pieces.slice().sort((a, b) => a._fall.delay - b._fall.delay).reverse();
    ordered.forEach((el, i) => {
      el.style.transition = `transform .9s cubic-bezier(.16, 1, .3, 1) ${Math.min(i * 14, 500)}ms`;
      el.style.transform = '';
    });
    setTimeout(done, 1500);
  }

  addEventListener('pagebreak', fall);
  addEventListener('keydown', e => { if (e.key === 'Escape' && overlay?.classList.contains('show')) mend(); });
})();
