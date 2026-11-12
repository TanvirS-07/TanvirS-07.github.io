// christmas tree next to the hero text, drawn out of text characters.
// only shows from mid november to early jan (or add ?tree to the url).
// click it 3 times: each click lights up another third, the last one
// lights the star, makes it snow (dots.js) and opens a present
(() => {
  const today = new Date(), month = today.getMonth();
  const day = today.getDate();
  const season = (month === 10 && day >= 10) || month === 11 || (month === 0 && day <= 6);
  if (!season && !/[?&]tree\b/.test(location.search)) return;
  const hero = document.querySelector('.hero');
  if (!hero) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;

  const slot = document.createElement('div');
  slot.className = 'tree-slot';
  slot.innerHTML = `
    <button class="tree" type="button" aria-label="Christmas tree. Click to turn on the lights"><canvas></canvas></button>
    <p class="tree-hint" aria-hidden="true">psst, the lights are off</p>
    <div class="gift" hidden>
      <div class="gift-card" role="dialog" aria-labelledby="giftTitle">
        <button class="gift-x" type="button" aria-label="Close"><i class="ph ph-x"></i></button>
        <span class="gift-tag">Merry Christmas</span>
        <h3 id="giftTitle">Here's my résumé.</h3>
        <a class="btn btn-solid" href="resume.pdf" target="_blank" rel="noopener"><i class="ph ph-file-text"></i> Open résumé</a>
      </div>
      <div class="gift-box" aria-hidden="true"><span class="gift-lid"></span><span class="gift-body"></span></div>
    </div>`;
  hero.classList.add('has-tree');
  hero.append(slot);

  const btn = slot.querySelector('.tree');
  const canvas = slot.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const hint = slot.querySelector('.tree-hint');
  const gift = slot.querySelector('.gift');

  // colours for each part, dark and light theme
  const PALETTE = {
    dark: {
      needle: [[52, 150, 84], [68, 172, 98], [38, 126, 72]], snow: [[232, 238, 246]],
      garland: [[240, 190, 70]], red: [[232, 64, 64]], gold: [[246, 196, 82]], blue: [[92, 132, 236]],
      trunk: [[124, 86, 54]], ground: [[110, 120, 140]], off: [[78, 84, 96]], star: [[255, 214, 110]],
      lights: [[255, 214, 120], [255, 112, 92], [124, 172, 255], [255, 238, 196]],
    },
    light: {
      needle: [[30, 106, 58], [42, 122, 68], [22, 90, 52]], snow: [[146, 160, 182]],
      garland: [[190, 134, 18]], red: [[204, 46, 46]], gold: [[198, 142, 24]], blue: [[46, 86, 204]],
      trunk: [[108, 70, 40]], ground: [[160, 168, 184]], off: [[170, 175, 184]], star: [[214, 150, 20]],
      lights: [[236, 150, 10], [226, 58, 46], [36, 98, 226], [214, 160, 30]],
    },
  };
  let dark = false, pal = PALETTE.light, bgRgb = [241, 242, 244];
  const readTheme = () => {
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    const n = parseInt(bg.replace('#', ''), 16);
    bgRgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    dark = bgRgb[0] < 128;
    pal = dark ? PALETTE.dark : PALETTE.light;
    glyphs.clear();
  };

  // the model. y goes 0 (bottom of the tree) to 1 (top)
  const rnd = (a, b) => a + Math.random() * (b - a);
  const smooth = y => 0.03 + 0.4 * Math.pow(1 - y, 1.08);
  const env = y => smooth(y) * (0.86 + 0.14 * (1 - ((y * 5.5) % 1))); // little steps so it looks like branches
  const GROUND = -0.06;
  const pts = [];
  const add = (x, y, z, kind, o = {}) => {
    const n = o.n || [x, 0.35, z];
    const len = Math.hypot(...n) || 1;
    // where it starts for the build animation: flat ring of snow on the ground
    const th = Math.atan2(z, x), r = Math.hypot(x, z);
    const fly = o.fly ?? true;
    const spread = r + 0.22 + y * 0.35;
    pts.push({
      x, y, z, kind, ch: o.ch || '*', v: o.v || 0, tier: o.tier || 0, on: o.on || 0, ph: Math.random() * TAU,
      nx: n[0] / len, ny: n[1] / len, nz: n[2] / len, delay: o.delay || 0, fly,
      x0: fly ? Math.cos(th) * spread : x * 1.25, y0: fly ? GROUND : y, z0: fly ? Math.sin(th) * spread : z * 1.25,
    });
  };

  const NEEDLE = '*+x#%&@=$';
  for (let n = 0; n < 4200;) {
    const y = Math.random();
    if (Math.random() * 0.45 > env(y)) continue;
    const th = rnd(0, TAU), r = env(y) * Math.sqrt(rnd(0.55, 1));
    const snowy = Math.random() < 0.07;
    add(Math.cos(th) * r, y, Math.sin(th) * r, snowy ? 'snow' : 'needle', {
      ch: snowy ? '.' : NEEDLE[(Math.random() * NEEDLE.length) | 0], v: (Math.random() * 3) | 0,
      n: [Math.cos(th), 0.45, Math.sin(th)], delay: 0.15 + y * 1.4 + rnd(0, 0.35),
    });
    n++;
  }
  for (let i = 0; i < 90; i++) {
    const th = rnd(0, TAU), y = rnd(GROUND, 0.03);
    add(Math.cos(th) * 0.045, y, Math.sin(th) * 0.045, 'trunk', { ch: '|', n: [Math.cos(th), 0, Math.sin(th)], delay: 0.1 });
  }
  // snow on the ground, fading out at the edges so it blends into the page
  for (let i = 0; i < 700; i++) {
    const th = rnd(0, TAU), r = Math.pow(Math.random(), 0.8) * 0.62, f = Math.pow(1 - r / 0.62, 1.3);
    add(Math.cos(th) * r, GROUND, Math.sin(th) * r, 'ground', { ch: f > 0.35 ? '-' : '.', n: [0, 1, 0.4], fly: false });
    pts[pts.length - 1].fade = f;
  }
  // two garlands spiralling down
  for (let g = 0; g < 2; g++) for (let i = 0; i < 300; i++) {
    const s = i / 300, y = 0.06 + s * 0.8, th = g * Math.PI + s * 3.1 * TAU, r = smooth(y) * 0.95 + 0.014;
    add(Math.cos(th) * r, y - 0.02 * Math.abs(Math.sin(th * 3)), Math.sin(th) * r, 'garland', {
      ch: '~', n: [Math.cos(th), 0.3, Math.sin(th)], delay: 1.9 + s * 0.6, fly: false,
    });
  }
  for (let b = 0; b < 24; b++) {
    const y = rnd(0.05, 0.82), th = rnd(0, TAU), r = smooth(y) * 0.95 + 0.02;
    const cx = Math.cos(th) * r, cz = Math.sin(th) * r, kind = Math.random() < 0.55 ? 'red' : 'gold';
    for (let i = 0; i < 14; i++) {
      const u = [rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)], l = Math.hypot(...u) || 1;
      add(cx + u[0] / l * 0.026, y + u[1] / l * 0.026, cz + u[2] / l * 0.026, kind, {
        ch: 'oO@'[i % 3], n: u, delay: 2.2 + rnd(0, 0.5), fly: false,
      });
    }
  }
  // lights, split into thirds from the bottom up
  for (let i = 0; i < 120; i++) {
    const y = rnd(0.03, 0.9), th = rnd(0, TAU), r = smooth(y) * 0.95 + 0.018;
    add(Math.cos(th) * r, y, Math.sin(th) * r, 'light', {
      tier: y < 0.31 ? 1 : y < 0.6 ? 2 : 3, v: (Math.random() * 4) | 0,
      on: ((th / TAU) + Math.random() * 0.15) * 0.5, // so they come on around the tree, not all at once
      n: [Math.cos(th), 0.3, Math.sin(th)], delay: 0.15 + y * 1.4 + rnd(0, 0.35),
    });
  }
  // presents under the tree
  [[0.6, 0.11, 'red', 'gold'], [2.5, 0.09, 'blue', 'gold'], [4.3, 0.1, 'gold', 'red']].forEach(([a, s, kind, ribbon], k) => {
    const px = Math.cos(a) * 0.3, pz = Math.sin(a) * 0.3, h = s * 0.85;
    for (let u = -1; u <= 1; u += 0.1) for (let w = -1; w <= 1; w += 0.1) {
      const faces = [[u, 1, w, [0, 1, 0]], [1, u, w, [1, 0, 0]], [-1, u, w, [-1, 0, 0]], [u, w, 1, [0, 0, 1]], [u, w, -1, [0, 0, -1]]];
      for (const [fx, fy, fz, n] of faces) {
        const band = Math.abs(fx) < 0.15 || Math.abs(fz) < 0.15;
        add(px + fx * s / 2, GROUND + (fy + 1) * h / 2, pz + fz * s / 2, band ? ribbon : kind, {
          ch: band ? '#' : '=', n, delay: 2.5 + k * 0.15, fly: false,
        });
      }
    }
  });
  const STAR = ['    #    ', '   ###   ', '#########', '  #####  ', ' ### ### ', ' #     # '];

  // glyphs get drawn once into little canvases and reused
  const glyphs = new Map();
  let W = 0, H = 0, dpr = 1, FS = 8, CW = 5, CH = 8, cols = 0, rows = 0, zbuf, win;
  const glyph = (ch, rgb) => {
    const key = ch + rgb;
    let g = glyphs.get(key);
    if (!g) {
      g = document.createElement('canvas');
      g.width = Math.ceil(CW * dpr); g.height = Math.ceil(CH * dpr);
      const c = g.getContext('2d');
      c.font = `600 ${FS * dpr}px "Geist Mono", ui-monospace, monospace`;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = `rgb(${rgb})`;
      c.fillText(ch, g.width / 2, g.height / 2 + dpr * 0.5);
      glyphs.set(key, g);
    }
    return g;
  };
  const shade = (rgb, b) => {
    const k = dark ? 0.26 + 0.74 * b : 0.55 + 0.45 * b;
    const q = Math.round(k * 6) / 6; // keep the number of colours down so the glyph cache stays small
    return `${(rgb[0] * q) | 0},${(rgb[1] * q) | 0},${(rgb[2] * q) | 0}`;
  };
  // blend a colour into the page background, a = 0 is invisible
  const blend = (rgb, a) => {
    const q = Math.round(a * 6) / 6;
    return rgb.map((c, i) => (bgRgb[i] + (c - bgRgb[i]) * q) | 0).join();
  };
  const glows = new Map();
  const glow = rgb => {
    const key = rgb.join();
    let g = glows.get(key);
    if (!g) {
      g = document.createElement('canvas');
      g.width = g.height = 64;
      const c = g.getContext('2d'), grad = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, `rgba(${key},.9)`); grad.addColorStop(0.3, `rgba(${key},.35)`); grad.addColorStop(1, `rgba(${key},0)`);
      c.fillStyle = grad; c.fillRect(0, 0, 64, 64);
      glows.set(key, g);
    }
    return g;
  };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    if (!r.width) return;
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    FS = W < 340 ? 7 : 8; CW = FS * 0.62; CH = FS * 1.08;
    cols = Math.floor(W / CW); rows = Math.floor(H / CH);
    zbuf = new Float32Array(cols * rows); win = new Int32Array(cols * rows);
    glyphs.clear();
    dispatchEvent(new CustomEvent('treelayout'));
  };

  // state
  let T = reduce ? 100 : 0, stage = 0, shakeAt = -10, starAt = Infinity;
  const litAt = [0, Infinity, Infinity, Infinity];
  const L = (() => { const v = [-0.45, 0.5, 0.74], l = Math.hypot(...v); return v.map(c => c / l); })();
  const ease = e => 1 - Math.pow(1 - e, 3);

  const draw = () => {
    if (!W) return;
    ctx.clearRect(0, 0, W, H);
    const ang = reduce ? 0.6 : T * 0.33, ca = Math.cos(ang), sa = Math.sin(ang);
    const cp = Math.cos(0.2), sp = Math.sin(0.2);
    const S = H * 0.72, cx = W / 2, baseY = H * 0.86;
    const sinceShake = T - shakeAt, sway = sinceShake < 2 ? Math.exp(-sinceShake * 3) * Math.sin(sinceShake * 24) * S * 0.05 : 0;

    zbuf.fill(-1e9); win.fill(-1);
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      let x = p.x, y = p.y, z = p.z;
      const e = Math.min(1, Math.max(0, (T - p.delay) / 0.9));
      if (e < 1) {
        if (!p.fly && p.kind !== 'ground' && e <= 0) continue;
        const k = ease(e);
        x = p.x0 + (x - p.x0) * k; y = p.y0 + (y - p.y0) * k; z = p.z0 + (z - p.z0) * k;
      }
      const x1 = x * ca - z * sa, z1 = x * sa + z * ca;
      const up = y * cp - z1 * sp, depth = z1 * cp + y * sp;
      const k = 3.2 / (3.2 - depth);
      const px = cx + x1 * S * k + sway * Math.pow(Math.max(y, 0), 1.3);
      const py = baseY - up * S * k;
      const c = (px / CW) | 0, r = (py / CH) | 0;
      if (c < 0 || r < 0 || c >= cols || r >= rows) continue;
      const idx = r * cols + c;
      if (depth > zbuf[idx]) { zbuf[idx] = depth; win[idx] = i; }
    }

    const lit = [];
    for (let idx = 0; idx < win.length; idx++) {
      const i = win[idx];
      if (i < 0) continue;
      const p = pts[i];
      const nx = p.nx * ca - p.nz * sa, nz = p.nx * sa + p.nz * ca;
      const b = Math.max(0, nx * L[0] + p.ny * L[1] + nz * L[2]) * 0.75 + 0.25;
      const x = (idx % cols) * CW, y = ((idx / cols) | 0) * CH;
      let ch = p.ch, rgb;
      if (p.kind === 'light') {
        const on = T - (litAt[p.tier] + p.on);
        if (on > 0) {
          const tw = 0.7 + 0.3 * Math.sin(T * (2 + p.v) + p.ph);
          rgb = shade(pal.lights[p.v], Math.min(1, tw + 0.2));
          ch = '*';
          lit.push([x + CW / 2, y + CH / 2, p.v, tw * Math.min(1, on * 4)]);
        } else { rgb = shade(pal.off[0], b); ch = '.'; }
      } else if (p.kind === 'ground') {
        if (p.fade < 0.08) continue;
        rgb = blend(pal.ground[0], p.fade * (dark ? 0.75 : 0.85));
      } else if (p.fly && T - p.delay < 0.75) {
        rgb = shade(pal.snow[0], b); // still flying in, show as snow
      } else {
        const set = pal[p.kind];
        rgb = shade(set[p.v % set.length], b);
      }
      ctx.drawImage(glyph(ch, rgb), x, y, CW, CH);
    }

    if (lit.length) {
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
      for (const [x, y, v, a] of lit) {
        ctx.globalAlpha = a * (dark ? 0.6 : 0.3);
        ctx.drawImage(glow(pal.lights[v]), x - 12, y - 12, 24, 24);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // star on top. doesn't rotate, it's flat
    const starIn = Math.min(1, Math.max(0, (T - 2.6) / 0.5));
    if (starIn <= 0) return;
    const sx = cx + sway, sy = baseY - 1.07 * cp * S * (3.2 / (3.2 - 1.07 * sp));
    const on = T >= starAt;
    if (on) {
      const since = T - starAt, flare = reduce ? 0 : Math.exp(-since * 2.2);
      const pulse = 0.85 + 0.15 * Math.sin(T * 2.4);
      const R = (30 + 70 * flare) * pulse;
      ctx.globalCompositeOperation = dark ? 'lighter' : 'source-over';
      ctx.globalAlpha = dark ? 0.85 : 0.5;
      ctx.drawImage(glow(pal.star[0]), sx - R, sy - R, R * 2, R * 2);
      ctx.strokeStyle = `rgba(${pal.star[0]},${dark ? 0.55 : 0.6})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = i * TAU / 8 + T * 0.25, len = (i % 2 ? 18 : 30) + 60 * flare;
        ctx.moveTo(sx + Math.cos(a) * 6, sy + Math.sin(a) * 6);
        ctx.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    const rgb = on ? shade(pal.star[0], 1) : shade(pal.off[0], 0.9 * starIn);
    STAR.forEach((line, r) => [...line].forEach((ch, c) => {
      if (ch === ' ') return;
      ctx.drawImage(glyph('#', rgb), sx + (c - 4.5) * CW, sy + (r - 2.6) * CH, CW, CH);
    }));
  };

  // loop, only while it's on screen
  let running = false, visible = false, last = 0;
  const frame = now => {
    if (!running) return;
    T += Math.min((now - last) / 1000, 0.05);
    last = now;
    draw();
    requestAnimationFrame(frame);
  };
  const start = () => { if (running || reduce || !visible) return; running = true; last = performance.now(); requestAnimationFrame(frame); };
  const stop = () => { running = false; };

  // clicks
  const LABELS = ['Click to turn on the lights', 'Click to turn on more lights', 'Click to turn on the rest of the lights', 'Click to open the present'];
  const openGift = () => {
    if (!gift.hidden) return;
    gift.hidden = false;
    void gift.offsetWidth;
    gift.classList.add('in');
    setTimeout(() => gift.classList.add('open'), reduce ? 0 : 650);
    setTimeout(() => gift.querySelector('a').focus({ preventScroll: true }), reduce ? 0 : 1100);
  };
  const closeGift = () => {
    gift.classList.remove('open', 'in');
    setTimeout(() => { gift.hidden = true; }, reduce ? 0 : 450);
    btn.focus({ preventScroll: true });
  };
  gift.querySelector('.gift-x').addEventListener('click', closeGift);
  addEventListener('keydown', e => { if (e.key === 'Escape' && !gift.hidden) closeGift(); });

  btn.addEventListener('click', () => {
    hint.classList.add('gone');
    if (!reduce) {
      shakeAt = T;
    }
    if (stage < 3) {
      stage++;
      litAt[stage] = reduce ? T - 10 : T + 0.15;
      if (stage === 3) {
        starAt = reduce ? T - 10 : T + 0.7;
        setTimeout(() => dispatchEvent(new CustomEvent('treesnow')), reduce ? 0 : 900);
        setTimeout(openGift, reduce ? 0 : 1700);
      }
    } else openGift();
    btn.setAttribute('aria-label', 'Christmas tree. ' + LABELS[stage]);
    if (reduce) draw();
  });

  readTheme();
  resize();
  draw();
  new ResizeObserver(() => { resize(); draw(); }).observe(btn);
  new MutationObserver(() => { readTheme(); draw(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { readTheme(); draw(); });
  document.fonts?.ready.then(() => { glyphs.clear(); draw(); });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; visible ? start() : stop(); }).observe(btn);
})();
