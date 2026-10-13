// dot grid in the hero, dots get pushed away from the cursor
(() => {
  const canvas = document.getElementById('dots');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SPACING = 22;
  const RADIUS = 160;
  const PUSH = 34;

  let W = 0, H = 0, dots = [], colors = {};
  let t = 0, active = 0;
  let mx = -1e4, my = -1e4, sx = -1e4, sy = -1e4, inside = false;
  const ripples = [];

  const hexToRgb = hex => {
    let h = hex.trim().replace('#', '');
    if (h.length === 3) h = [...h].map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const readColors = () => {
    const cs = getComputedStyle(document.documentElement);
    colors.accent = hexToRgb(cs.getPropertyValue('--accent'));
    colors.text = hexToRgb(cs.getPropertyValue('--text'));
  };

  const build = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cols = Math.floor(W / SPACING), rows = Math.floor(H / SPACING);
    const ox = (W - (cols - 1) * SPACING) / 2, oy = (H - (rows - 1) * SPACING) / 2;
    dots = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = ox + i * SPACING, y = oy + j * SPACING;
      dots.push({ x0: x, y0: y, x, y, p: 0 });
    }
  };

  const update = dt => {
    t += dt;
    active += ((inside ? 1 : 0) - active) * Math.min(1, dt * 4);
    if (inside) { sx += (mx - sx) * Math.min(1, dt * 10); sy += (my - sy) * Math.min(1, dt * 10); }
    for (let k = ripples.length - 1; k >= 0; k--) if ((ripples[k].age += dt) > 1.4) ripples.splice(k, 1);

    const ease = Math.min(1, dt * 12);
    for (const d of dots) {
      let ox = 0, oy = 0, p = 0;
      const dx = d.x0 - sx, dy = d.y0 - sy, dist = Math.hypot(dx, dy) || 1;
      if (dist < RADIUS && active > 0.01) {
        p = (1 - dist / RADIUS) * active;
        const f = p * p * PUSH;
        ox += (dx / dist) * f; oy += (dy / dist) * f;
      }
      for (const r of ripples) {
        const rx = d.x0 - r.x, ry = d.y0 - r.y, rd = Math.hypot(rx, ry) || 1;
        const band = Math.abs(rd - r.age * 360);
        if (band < 44) {
          const s = (1 - band / 44) * (1 - r.age / 1.4);
          ox += (rx / rd) * s * 12; oy += (ry / rd) * s * 12;
          p = Math.max(p, s * 0.8);
        }
      }
      // idle wave
      oy += Math.sin(d.x0 * 0.022 + d.y0 * 0.016 - t * 1.4) * 2.4;
      d.x += (d.x0 + ox - d.x) * ease;
      d.y += (d.y0 + oy - d.y) * ease;
      d.p = p;
    }
  };

  const draw = () => {
    if (!W) return;
    ctx.clearRect(0, 0, W, H);
    if (active > 0.01) {
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, RADIUS * 1.4);
      g.addColorStop(0, rgba(colors.accent, 0.26 * active));
      g.addColorStop(1, rgba(colors.accent, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    for (const d of dots) {
      const near = d.p > 0.04;
      ctx.fillStyle = near ? rgba(colors.accent, 0.45 + d.p * 0.55) : rgba(colors.text, 0.28);
      ctx.beginPath();
      ctx.arc(d.x, d.y, 1.6 + d.p * 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  let running = false, last = 0;
  const frame = now => {
    if (!running) return;
    update(Math.min((now - last) / 1000, 0.05));
    last = now;
    draw();
    requestAnimationFrame(frame);
  };
  const start = () => { if (running || reduce) return; running = true; last = performance.now(); requestAnimationFrame(frame); };
  const stop = () => { running = false; };

  readColors(); build(); draw(); start();
  new ResizeObserver(() => { build(); draw(); }).observe(canvas);
  new MutationObserver(() => { readColors(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readColors(); draw(); });
  new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(canvas);

  if (!reduce) {
    const local = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r]; };
    addEventListener('pointermove', e => {
      const [x, y, r] = local(e);
      const pad = 60;
      inside = x > -pad && y > -pad && x < r.width + pad && y < r.height + pad;
      if (inside && active < 0.05) { sx = x; sy = y; }
      mx = x; my = y;
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { inside = false; });
    canvas.addEventListener('pointerdown', e => { const [x, y] = local(e); ripples.push({ x, y, age: 0 }); });
  }
})();
