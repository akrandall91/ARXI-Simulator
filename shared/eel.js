// ===================================================================== ARXI Pixel Eel (from "ARXI Eel Logo Concepts", 03)
// Swim → Charge → Strike → Embers, drawn at any matrix size with the simulator's Gfx. One tick = 70 ms, one cycle = 66 ticks.
const EEL = (() => {
  const TICK = 70, CYCLE = 66;
  const rand = (c, seed) => { const x = Math.sin(c * 12.9898 + seed * 78.233) * 43758.5453; return x - Math.floor(x); };
  const ch = (c) => [c >> 16 & 255, c >> 8 & 255, c & 255];
  const pack = (a) => (Math.round(a[0]) << 16) | (Math.round(a[1]) << 8) | Math.round(a[2]);
  const mixTo = (c, target, m) => pack(ch(c).map(v => v + (target - v) * m));   // the design's mix(): toward black (0) or white (255)
  const over = (bg, c, a) => { a = Math.max(0, Math.min(1, a)); const b = ch(bg), f = ch(c); return pack(b.map((v, i) => v + (f[i] - v) * a)); };
  const WHITE = 0xffffff;

  function drawEel(g, s, hx, amp, freq, phase, bright, hot, L, charge, tick) {
    const { cols, rows, accent, off } = s, put = (r, c, col) => { s.grid[r * cols + c] = col; }, at = (r, c) => s.grid[r * cols + c];
    const back = mixTo(accent, 0, 0.45), belly = mixTo(accent, 255, 0.5);
    const mid = (rows - 1) / 2, big = rows >= 9, body = []; let headY = Math.round(mid), prevY = null;
    const centerAt = (c) => { const f = (c - (hx - L)) / L; const a = amp * Math.pow(0.25 + 0.75 * (1 - f), 1.2); return mid + a * Math.sin(c * freq - phase); };
    for(let c = hx - L; c <= hx; c++) {
      const f = (c - (hx - L)) / L, y = centerAt(c);
      let rad = f > 0.86 ? (big ? 1.55 : 1.05) : f > 0.3 ? (big ? 0.6 : 0.5) + (big ? 0.75 : 0.4) * ((f - 0.3) / 0.56) : 0.5;
      if(c === hx) { rad = big ? 1.05 : 0.6; headY = Math.round(y); }
      if(c < 0 || c >= cols) { prevY = y; continue; }
      let alpha = (0.18 + 0.82 * Math.min(1, f * 1.25)) * bright; if(f < 0.08) alpha *= 0.5;
      for(let r = 0; r < rows; r++) {
        const d = r - y; if(Math.abs(d) > rad) continue;
        let col;
        if(hot) col = Math.abs(d) < rad * 0.6 ? WHITE : over(off, accent, 0.95);
        else if(d < -rad * 0.35) col = over(off, back, alpha);
        else if(d > rad * 0.35) col = over(off, belly, alpha);
        else col = over(off, accent, alpha);
        put(r, c, col);
      }
      if(prevY !== null && rad < 0.8) { const lo = Math.round(Math.min(prevY, y)), hi = Math.round(Math.max(prevY, y)); for(let r = lo; r <= hi; r++) if(r >= 0 && r < rows && at(r, c) === off) put(r, c, over(off, accent, alpha * 0.8)); }
      if(big && f > 0.12 && f < 0.82 && Math.sin(c * 1.4 - phase * 2.2) > -0.2) { const fr = Math.round(y + rad + 0.9); if(fr >= 0 && fr < rows && at(fr, c) === off) put(fr, c, over(off, accent, 0.2 * bright)); } // the fin
      if(charge > 0 && f > 0.15 && f < 0.85) { const p = ((c - tick * 1.5) % 5 + 5) % 5; if(p < 1 && rand(c, tick) < 0.4 + charge * 0.6) { const cr = Math.round(y); if(cr >= 0 && cr < rows) put(cr, c, WHITE); } } // electric cells
      body.push([Math.max(0, Math.min(rows - 1, Math.round(y))), c]); prevY = y;
    }
    if(big && hx - 1 >= 0 && hx - 1 < cols) { const ey = Math.round(centerAt(hx - 1) - 0.7); if(ey >= 0 && ey < rows) put(ey, hx - 1, hot ? accent : 0x05070a); } // the eye
    return { headY, body };
  }
  function sparks(s, body, prob, tick) {
    for(let i = 0; i < body.length; i++) {
      const r = body[i][0] + Math.round((rand(i, tick) - 0.5) * 6), c = body[i][1] + Math.round((rand(i + 300, tick) - 0.5) * 3);
      if(r < 0 || r >= s.rows || c < 0 || c >= s.cols) continue;
      if(rand(i + 600, tick) < prob) s.grid[r * s.cols + c] = rand(i + 900, tick) > 0.6 ? WHITE : over(s.off, s.accent, 0.85);
    }
  }
  function boltPath(cols, rows, sCol, sY, seed) {
    const cells = [], forks = []; let y = sY, prev = sY;
    for(let c = sCol; c < cols; c++) {
      y = Math.max(0, Math.min(rows - 1, Math.round(y + (rand(c, seed) - 0.5) * 3.4)));
      for(let r = Math.min(prev, y); r <= Math.max(prev, y); r++) cells.push([r, c]); prev = y;
      if(rand(c + 99, seed) > 0.82 && c < cols - 5) { const dir = rand(c + 7, seed) > 0.5 ? 1 : -1; let by = y; for(let k = 1; k <= 4; k++) { by += dir; if(by < 0 || by >= rows) break; forks.push([by, c + k]); } }
    }
    return { cells, forks };
  }
  function drawBolt(s, path, progress, core, halo, keep, seed) {
    const { cols, rows, off } = s, G = s.grid, maxC = path.cells.length ? path.cells[0][1] + (cols - path.cells[0][1]) * progress : 0;
    path.cells.forEach((p, i) => { if(p[1] > maxC || (keep < 1 && rand(i + 1200, seed) > keep)) return; G[p[0] * cols + p[1]] = core;
      if(p[0] > 0 && G[(p[0] - 1) * cols + p[1]] === off) G[(p[0] - 1) * cols + p[1]] = halo; if(p[0] < rows - 1 && G[(p[0] + 1) * cols + p[1]] === off) G[(p[0] + 1) * cols + p[1]] = halo; });
    path.forks.forEach((q, j) => { if(q[1] > maxC || q[1] >= cols || (keep < 1 && rand(j + 1500, seed) > keep)) return; G[q[0] * cols + q[1]] = halo; });
  }

  // One frame at time `ms` (any size). Returns the phase and the glow (0-1) for the housing.
  function frame(g, ms, opt = {}) {
    const accent = opt.accent ?? 0x3fd0ff, cols = g.w, rows = g.h;
    const sx = cols / 44, tick = Math.floor(ms / TICK), t = tick % CYCLE, seed = Math.floor(tick / CYCLE) + 1;
    let off = 0, glow = 0, phase = 'swim';
    if(t >= 44 && t <= 48) off = over(0, accent, 0.24 * { 44: 0.7, 45: 1, 46: 0.15, 47: 0.9, 48: 0.4 }[t]); // the flash
    const s = { cols, rows, accent, off, grid: new Array(cols * rows).fill(off) };
    const L = Math.round(26 * sx), hx = Math.round(Math.min(-2 + t * 0.85 * sx, 24 * sx));
    if(t < 32) drawEel(g, s, hx, 2.6 * rows / 11, 0.32 / sx, t * 0.6, 0.9, false, L, 0, tick);
    else if(t < 44) { const k = (t - 32) / 12; phase = 'charge'; const e = drawEel(g, s, hx, (2.6 * (1 - k) + 0.8) * rows / 11, (0.32 + k * 0.5) / sx, t * (0.6 + k * 1.4), 0.9 + 0.1 * k, k > 0.85, L, k, tick); sparks(s, e.body, 0.03 + k * 0.28, tick); glow = k * 0.55; }
    else if(t < 52) { phase = 'strike'; const e = drawEel(g, s, hx, 0.8 * rows / 11, 0.82 / sx, 0, 1, true, L, 0, tick);
      const path = boltPath(cols, rows, hx + 1, e.headY, t < 47 ? seed : seed + 50);
      drawBolt(s, path, t === 44 ? 0.45 : 1, t === 46 ? over(0, accent, 0.6) : WHITE, over(0, accent, 0.9), 1, seed);
      if(t === 45 || t === 47) sparks(s, path.cells, 0.25, tick); glow = t <= 48 ? 1 : 0.8; }
    else { const fade = 1 - (t - 51) / 14; phase = 'embers'; const e = drawEel(g, s, hx, 0.8 * rows / 11, 0.82 / sx, 0, Math.max(fade, 0.35), false, L, 0, tick);
      drawBolt(s, boltPath(cols, rows, hx + 1, e.headY, seed + 50), 1, over(0, accent, fade), over(0, accent, 0.3 * fade), fade * fade, seed + t); glow = fade * 0.6; }
    for(let i = 0; i < cols * rows; i++) g.put(i, s.grid[i]);
    return { phase, glow, accent, shake: (t === 45 || t === 47) };
  }
  return { frame, TICK, CYCLE, CYCLE_MS: TICK * CYCLE };
})();
