// hero dot grid. dots get pushed away from the cursor, and a fake "ghost"
// cursor wanders around when nobody's moving the mouse (also covers phones).
// click spam easter egg is at the bottom, the page breaking bit is in egg.js
(() => {
  const canvas = document.getElementById('dots');
  const host = document.getElementById('heroWrap');
  if (!canvas || !host) return;
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const SPACING = 24;
  const RADIUS = 170;
  const PUSH = 36;
  const IDLE_AFTER = 2.2; // secs before the ghost cursor kicks in

  let W = 0, H = 0, dots = [], colors = {};
  let t = 0, active = 0, idle = IDLE_AFTER;
  let mx = 0, my = 0, sx = -1e4, sy = -1e4, inside = false;
  const ripples = [];
  const egg = { count: 0, last: 0, phase: null, time: 0 };

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
    const cols = Math.ceil(W / SPACING) + 1, rows = Math.ceil(H / SPACING) + 1;
    const ox = (W - (cols - 1) * SPACING) / 2, oy = (H - (rows - 1) * SPACING) / 2;
    dots = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = ox + i * SPACING, y = oy + j * SPACING;
      dots.push({ x0: x, y0: y, x, y, p: 0 });
    }
  };

  // figure 8 on the empty right side (under the text on mobile)
  const ghost = () => {
    const wide = W >= 900;
    const cx = wide ? W * 0.7 : W * 0.5, cy = wide ? H * 0.48 : H * 0.8;
    const rx = wide ? W * 0.17 : W * 0.32, ry = wide ? H * 0.22 : H * 0.08;
    return [cx + Math.sin(t * 0.45) * rx, cy + Math.sin(t * 0.9 + 0.6) * ry];
  };

  const update = dt => {
    t += dt;
    idle += dt;
    const auto = idle > IDLE_AFTER;
    let tx = mx, ty = my, want = inside ? 1 : 0;
    if (auto) { [tx, ty] = ghost(); want = 0.8; }
    if (egg.phase) {
      want = 0;
      egg.time += dt;
      if (egg.phase === 'mend' && egg.time > 1.6) egg.phase = null;
    }
    if (sx < -1e3) { sx = tx; sy = ty; }
    const follow = Math.min(1, dt * (auto ? 3 : 10));
    sx += (tx - sx) * follow; sy += (ty - sy) * follow;
    active += (want - active) * Math.min(1, dt * 3);

    for (let k = ripples.length - 1; k >= 0; k--) if ((ripples[k].age += dt) > 1.6) ripples.splice(k, 1);

    const ease = Math.min(1, dt * 12);
    for (const d of dots) {
      if (egg.phase === 'fall') {
        if (egg.time > d.delay) { d.vy += 2600 * dt; d.x += d.vx * dt; d.y += d.vy * dt; }
        d.p = 0;
        continue;
      }
      if (egg.phase === 'mend') {
        const e = Math.min(1, dt * 3);
        d.x += (d.x0 - d.x) * e; d.y += (d.y0 - d.y) * e;
        d.p = 0;
        continue;
      }
      let ox = 0, oy = 0, p = 0;
      const dx = d.x0 - sx, dy = d.y0 - sy;
      if (active > 0.01 && Math.abs(dx) < RADIUS && Math.abs(dy) < RADIUS) {
        const dist = Math.hypot(dx, dy) || 1;
        if (dist < RADIUS) {
          p = (1 - dist / RADIUS) * active;
          const f = p * p * PUSH;
          ox += (dx / dist) * f; oy += (dy / dist) * f;
        }
      }
      for (const r of ripples) {
        const rx = d.x0 - r.x, ry = d.y0 - r.y, rd = Math.hypot(rx, ry) || 1;
        const band = Math.abs(rd - r.age * 420);
        if (band < 48) {
          const s = (1 - band / 48) * (1 - r.age / 1.6);
          ox += (rx / rd) * s * 14 * r.power; oy += (ry / rd) * s * 14 * r.power;
          p = Math.max(p, s * 0.85);
        }
      }
      // idle wave
      oy += Math.sin(d.x0 * 0.02 + d.y0 * 0.015 - t * 1.3) * 2.2;
      d.x += (d.x0 + ox - d.x) * ease;
      d.y += (d.y0 + oy - d.y) * ease;
      d.p = p;
    }
  };

  const draw = () => {
    if (!W) return;
    ctx.clearRect(0, 0, W, H);
    if (active > 0.01) {
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, RADIUS * 1.5);
      g.addColorStop(0, rgba(colors.accent, 0.24 * active));
      g.addColorStop(1, rgba(colors.accent, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
    // draw all the normal dots in one path, way faster than one by one
    ctx.fillStyle = rgba(colors.text, 0.26);
    ctx.beginPath();
    for (const d of dots) if (d.p <= 0.04) { ctx.moveTo(d.x + 1.6, d.y); ctx.arc(d.x, d.y, 1.6, 0, Math.PI * 2); }
    ctx.fill();
    for (const d of dots) if (d.p > 0.04) {
      ctx.fillStyle = rgba(colors.accent, 0.45 + d.p * 0.55);
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
    // ripple on load
    const [gx, gy] = ghost();
    ripples.push({ x: gx, y: gy, age: 0, power: 1 });

    const local = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r]; };
    addEventListener('pointermove', e => {
      if (e.pointerType === 'touch') return; // let touch scroll, ghost handles phones
      const [x, y, r] = local(e);
      inside = x >= 0 && y >= 0 && x <= r.width && y <= r.height;
      if (inside) { mx = x; my = y; idle = 0; }
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => { inside = false; });
  }

  // easter egg
  const tip = document.createElement('div');
  tip.className = 'egg-tip';
  tip.setAttribute('role', 'status');
  host.append(tip);
  let tipTimer;
  const say = (msg, x, y, warn = false) => {
    tip.textContent = msg;
    tip.classList.toggle('warn', warn);
    tip.style.left = Math.min(Math.max(x, 110), W - 110) + 'px';
    tip.style.top = Math.max(y, 150) + 'px';
    tip.classList.remove('show'); void tip.offsetWidth; tip.classList.add('show');
    clearTimeout(tipTimer);
    tipTimer = setTimeout(() => tip.classList.remove('show'), 1900);
  };

  // dots fall with the page and come back when it's fixed
  addEventListener('pagebreak', () => {
    egg.phase = 'fall'; egg.time = 0;
    for (const d of dots) {
      d.vx = (Math.random() - 0.5) * 160;
      d.vy = -Math.random() * 260;
      d.delay = 0.3 + Math.random() * 0.6;
    }
  });
  addEventListener('pagemend', () => { egg.phase = reduce ? null : 'mend'; egg.time = 0; });

  host.addEventListener('pointerdown', e => {
    if (e.target.closest('a, button')) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const now = performance.now();
    if (now - egg.last > 4000) egg.count = 0;
    egg.last = now;
    if (egg.phase) return;
    egg.count++;
    if (egg.count >= 9) {
      egg.count = 0;
      egg.phase = 'wait';
      say('Fine. You asked for it.', x, y, true);
      setTimeout(() => dispatchEvent(new CustomEvent('pagebreak')), reduce ? 400 : 900);
      return;
    }
    if (!reduce) ripples.push({ x, y, age: 0, power: 1 + egg.count * 0.3 });
    if (egg.count === 3) say('Stop clicking.', x, y);
    else if (egg.count === 6) say("I'm warning you.", x, y, true);
  });
})();
