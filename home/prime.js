// ===================================================================== Prime in the simulator (Home only)
// A light model of Prime firmware v3.x: 20 blades lit from below, blade 19 (index 18) red PLA, blade 20 the blank one.
// The looks below are ported from frameAmbient() in Prime/firmware/src/main.cpp so what you see here is what the
// piece does. Modes: ambient, ember, walk (someone coming closer), climb (the show), read, off.
// Prime talks to the Bar and Panel over the ARXI link (UDP multicast 239.255.42.91:4291), no hub needed.

const PRIME = (() => {
  const N = 20, NIGHT = 18, BLANK = 19, FLIGHT = 9, TOILING = 14;
  const ANIMS = ['solid', 'breathe', 'candle', 'tide', 'aurora', 'starlight', 'rise', 'heartbeat', 'echo', 'spectrum', 'sync', 'wall', 'sunrise', 'sunset', 'supernova', 'subzero', 'elemental'];
  const ANIM_NAMES = { solid: 'Solid', breathe: 'Breathe', candle: 'Candle', tide: 'Tide', aurora: 'Aurora', starlight: 'Starlight', rise: 'Rise', heartbeat: 'Heartbeat', echo: 'Echo', spectrum: 'Spectrum', sync: 'Sync (music)', wall: 'Wall', sunrise: 'Sunrise', sunset: 'Sunset', supernova: 'Supernova', subzero: 'Subzero', elemental: 'Elemental' };
  const AMBER = [255, 120, 20], WHITE = [235, 225, 255];
  const SKY = [[3, 3, 16], [16, 12, 64], [78, 24, 88], [205, 42, 24], [255, 108, 18], [255, 176, 60], [255, 230, 192]];
  const FIRE = [[0, 0, 0], [70, 6, 0], [185, 28, 0], [255, 92, 0], [255, 180, 40], [255, 244, 210]];
  const ICE = [[2, 6, 22], [8, 36, 92], [26, 108, 185], [110, 205, 255], [232, 250, 255]];
  const EARTH = [[24, 12, 3], [96, 48, 10], [150, 118, 18], [56, 196, 28], [170, 232, 60], [255, 168, 48]];

  const rgb = (c) => [c >> 16 & 255, c >> 8 & 255, c & 255];
  const mix = (a, b, k) => { k = Math.max(0, Math.min(1, k)); return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k]; };
  const sc = (c, v) => [c[0] * v, c[1] * v, c[2] * v];
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const smooth01 = (a, b, x) => { x = clamp((x - a) / (b - a)); return x * x * (3 - 2 * x); };
  const grad = (st, x) => { x = clamp(x) * (st.length - 1); const i = Math.min(st.length - 2, Math.floor(x)); return mix(st[i], st[i + 1], x - i); };
  const hsv = (h, s, v) => { h = ((h % 256) + 256) % 256 / 256 * 6; s /= 255; v /= 255; const i = Math.floor(h), f = h - i, p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f)); return [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6].map(x => x * 255); };
  // stand-in for FastLED's inoise8: smooth 2D value noise, 0..255
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  const noise = (x, y) => { x /= 256; y /= 256; const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return 255 * (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v); };

  class Prime {
    constructor() {
      this.look = { anim: 'breathe', c1: 0xFFAA5F, c2: 0x503CFF, c3: 0xFF1208, bri: 160, speed: 50, ember: true };
      this.mode = 'ember'; this.t = 0; this.modeT = 0; this.level = 0.2; this.cm = 450; this.front = []; this.back = [];
      this.star = new Array(N).fill(0); this.spark = [new Array(N).fill(0), new Array(N).fill(0)];
      for(let i = 0; i < N; i++) { this.front.push([0, 0, 0]); this.back.push([0, 0, 0]); }
    }
    setLook(l) { Object.assign(this.look, l); }
    setMode(m) { if(m !== this.mode) { this.mode = m; this.modeT = 0; } }
    ember() { return 0.42 + 0.1 * Math.sin(this.t * 1.7) + 0.05 * Math.sin(this.t * 4.3); }
    set(i, c, v, back = true) { this.front[i] = sc(c, clamp(v, 0, 1.2)); if(back) this.back[i] = this.front[i]; }
    all(c, v) { for(let i = 0; i < N; i++) this.set(i, c, v); }
    step(dtMs) {
      const dt = Math.min(0.1, dtMs / 1000); this.t += dt; this.modeT += dt;
      const L = this.look, c1 = rgb(L.c1), c2 = rgb(L.c2), c3 = rgb(L.c3), t = this.t * Math.pow(4, (L.speed - 50) / 50), m = this.mode, u = this.modeT;
      this.all([0, 0, 0], 0);
      if(m === 'off') return;
      if(m === 'ember') { this.set(NIGHT, c3, this.ember()); return; }
      if(m === 'walk') { // the closer you are, the further along the years are lit
        const p = clamp((450 - this.cm) / 300) * NIGHT;
        for(let i = 0; i < NIGHT; i++) { const v = clamp(p - i); if(v > 0) this.set(i, c1, v * (0.22 + 0.06 * Math.sin(this.t * 1.2 - i * 0.4))); }
        this.set(NIGHT, c3, this.ember() + 0.1 + 0.2 * p / NIGHT); return;
      }
      if(m === 'climb') { // the show: the years climb, the night flares, the blank blade is left
        const TT = 6.5, q = Math.min(NIGHT, u / TT * NIGHT);
        if(u < TT) {
          for(let i = 0; i < NIGHT; i++) { const d = i - q, v = (i <= q ? 0.3 : 0) + (d * d < 8 ? 0.9 * Math.exp(-d * d / 1.1) : 0); if(v > 0) this.set(i, c2, v); }
          for(let i = 0; i < NIGHT; i++) { const d = i - (q - 0.45), v = (i <= q - 0.45 ? 0.28 : 0) + (d * d < 8 ? 0.9 * Math.exp(-d * d / 1.1) : 0); this.back[i] = v > 0 ? sc(c2, v) : [0, 0, 0]; }
          if(Math.abs(q - FLIGHT) < 0.6) this.set(FLIGHT, AMBER, 0.95); if(Math.abs(q - TOILING) < 0.6) this.set(TOILING, AMBER, 0.95);
          this.set(NIGHT, c3, q >= NIGHT - 0.2 ? 1 : this.ember()); return;
        }
        const w = u - TT;
        if(w < 2.2) { this.set(NIGHT, c3, 1 + 0.08 * Math.sin(this.t * 5)); return; }
        if(w < 3.1) { this.set(NIGHT, c3, 1 - (1 - this.ember()) * (w - 2.2) / 0.9); return; }
        if(w < 6.8) { this.set(BLANK, WHITE, Math.min(1, (w - 3.1) * 1.6)); this.set(NIGHT, c3, this.ember()); return; }
        this.set(BLANK, WHITE, 1); this.set(NIGHT, c3, this.ember()); return;
      }
      if(m === 'read') { // one blade at a time, slow enough to read each line
        const warm = mix(c1, [255, 236, 210], 0.6);
        for(let i = 0; i < N; i++) { if(i === NIGHT) continue; const a = u - i * 1.3; this.set(i, i === BLANK ? WHITE : (a <= 0 ? c1 : warm), a <= 0 ? 0.18 : a < 0.6 ? 0.18 + 0.72 * a / 0.6 : Math.max(0.38, 0.9 - (a - 0.6) * 0.35)); }
        this.set(NIGHT, c3, this.ember() + 0.3); return;
      }
      // ambient
      switch(L.anim) {
        case 'solid': this.all(c1, 0.85); break;
        case 'breathe': this.all(c1, 0.35 + 0.5 * (0.5 - 0.5 * Math.cos(t * 2 * Math.PI / 7))); break;
        case 'candle': for(let i = 0; i < N; i++) { const n = noise(i * 60, t * 900) / 255, f = noise(i * 60 + 5000, t * 2600) / 255; this.set(i, mix(c1, c2, n * 0.5), 0.45 + 0.35 * n + 0.15 * f); } break;
        case 'tide': for(let i = 0; i < N; i++) { const w = 0.5 + 0.5 * Math.sin(i * 0.42 - t * 0.9); this.set(i, mix(c1, c2, w * w), 0.45 + 0.4 * w); } break;
        case 'aurora': for(let i = 0; i < N; i++) { const n = noise(i * 45, t * 220) / 255, mm = noise(i * 30 + 9000, t * 140) / 255; this.set(i, mix(c1, c2, clamp((n - 0.3) * 1.8)), 0.3 + 0.6 * mm); } break;
        case 'starlight': for(let i = 0; i < N; i++) { if(this.star[i] <= 0 && Math.random() < 0.2 * dt * 60 / 60 * 3) this.star[i] = 1; this.star[i] -= dt * 0.55; const s = this.star[i] > 0 ? Math.sin(this.star[i] * Math.PI) : 0; this.set(i, mix(c1, c2, s), 0.22 + 0.75 * s); } break;
        case 'rise': { const q = (t * 1.6) % (N + 6) - 3; for(let i = 0; i < N; i++) { const d = i - q, tr = i <= q ? 0.25 * Math.exp((i - q) / 6) : 0; this.set(i, mix(c1, c2, Math.exp(-d * d / 2)), 0.18 + tr + 0.75 * Math.exp(-d * d / 2)); } break; }
        case 'heartbeat': { const p = t % 4.5, v = 0.3 + 0.6 * (Math.exp(-Math.pow((p - 0.3) / 0.09, 2)) + 0.7 * Math.exp(-Math.pow((p - 0.62) / 0.1, 2))); this.all(mix(c1, c2, v - 0.3), v); break; }
        case 'echo': for(let i = 0; i < N; i++) { const d = Math.abs(i - FLIGHT); let w = 0.5 + 0.5 * Math.sin(d * 0.7 - t * 2.2); w = w * w * w; this.set(i, mix(c1, c2, w), 0.25 + 0.65 * w); } break;
        case 'spectrum': for(let i = 0; i < N; i++) this.set(i, hsv(t * 9 + i * 6, 230, 210), 1); break;
        case 'wall': for(let i = 0; i < N; i++) { const k = 0.5 + 0.5 * Math.sin(t * 0.55 + i * 0.22); this.front[i] = sc(c1, 0.12 + 0.75 * k); this.back[i] = sc(c2, 0.12 + 0.75 * (1 - k)); } break;
        case 'sunrise': case 'sunset': {
          const uu = (t % 48) / 48, rise = L.anim === 'sunrise', p = rise ? smooth01(0.04, 0.66, uu) : 1 - smooth01(0.12, 0.78, uu), gain = rise ? Math.min(smooth01(0, 0.05, uu), 1 - smooth01(0.88, 1, uu)) : Math.min(smooth01(0, 0.06, uu), 1 - smooth01(0.9, 1, uu));
          for(let r = 0; r < 2; r++) for(let i = 0; i < N; i++) { const x = p * 1.35 - (1 - i / (N - 1)) * 0.35 - r * 0.06; (r ? this.back : this.front)[i] = sc(grad(SKY, x), (0.18 + 0.82 * clamp(x)) * Math.max(gain, 0.12)); }
          break;
        }
        case 'supernova': { const uu = t % 14; for(let r = 0; r < 2; r++) for(let i = 0; i < N; i++) { const n = noise(i * 70 + r * 3000, t * 650) / 255, fl = noise(i * 140 + r * 7000, t * 1900) / 255; let h = 0.3 + 0.42 * n * n + 0.12 * fl;
          if(uu < 5) { const d = N - 1 - i, w = Math.exp(-(d - uu * 7) * (d - uu * 7) / 4); h += w * (1 - uu / 5) * 1.5 + Math.exp(-uu) * Math.exp(-d * 0.22); } h = clamp(h); (r ? this.back : this.front)[i] = sc(grad(FIRE, h), 0.15 + 0.85 * h); } break; }
        case 'subzero': for(let r = 0; r < 2; r++) for(let i = 0; i < N; i++) { const n = noise(i * 50 + r * 4000, t * 120) / 255; let f = 0.5 + 0.5 * Math.sin(t * 0.35 - i * 0.26); f = f ** 4;
          if(this.spark[r][i] <= 0 && Math.random() < 0.04) this.spark[r][i] = 1; this.spark[r][i] -= dt * 0.9; const sp = this.spark[r][i] > 0 ? this.spark[r][i] ** 2 : 0;
          const x = (0.22 + 0.32 * n + 0.25 * f) * (r ? 0.82 : 1) + 0.6 * sp; (r ? this.back : this.front)[i] = sc(grad(ICE, x), 0.22 + 0.78 * clamp(x)); } break;
        case 'elemental': { const g = (t * 0.07) % 1.5 * N, fade = 1 - smooth01(1.25 * N, 1.5 * N, g); for(let r = 0; r < 2; r++) for(let i = 0; i < N; i++) { const grow = clamp((g - i) / 5) * fade, n = noise(i * 40 + r * 2000, t * 90) / 255, sun = noise(i * 25 + 9000, t * 60) / 255;
          const x = r ? 0.22 + 0.32 * grow + 0.15 * n : 0.28 + 0.55 * grow + 0.17 * n; let c = grad(EARTH.slice(0, 5), x); if(sun > 0.66) c = mix(c, EARTH[5], (sun - 0.66) * 2.4); (r ? this.back : this.front)[i] = sc(c, 0.45 + 0.55 * clamp(x * 1.4)); } break; }
        case 'sync': { const lv = this.level; for(let i = 0; i < N; i++) { const d = Math.abs(i - 9.5) / 9.5, on = clamp((lv * 1.3 - d) * 3); this.set(i, mix(c1, c2, on), 0.2 + 0.75 * on); } break; }
      }
      if(L.ember) this.set(NIGHT, c3, this.ember() + 0.15);
    }
    // Front view: blade 1's door, and the corridor of doors behind it. Each frame takes its blade's light.
    draw(cv, finishWhite = true) {
      const ctx = cv.getContext('2d'), W = cv.width, H = cv.height, bri = this.look.bri / 255;
      const light = (i) => { const f = this.front[i], b = this.back[i]; return [(f[0] + b[0]) / 2 * bri, (f[1] + b[1]) / 2 * bri, (f[2] + b[2]) / 2 * bri]; };
      const css = (c, a = 1) => `rgba(${Math.min(255, c[0]) | 0},${Math.min(255, c[1]) | 0},${Math.min(255, c[2]) | 0},${a})`;
      ctx.fillStyle = '#07080a'; ctx.fillRect(0, 0, W, H);
      // base (black PETG)
      const bx = W * 0.08, bw = W * 0.84, by = H * 0.80; ctx.fillStyle = '#121316'; ctx.fillRect(bx - 6, by, bw + 12, H * 0.14);
      // glow from below onto the base top
      const glowAll = this.front.reduce((a, c) => [a[0] + c[0], a[1] + c[1], a[2] + c[2]], [0, 0, 0]).map(v => v / N * bri);
      const gg = ctx.createRadialGradient(W / 2, by, 4, W / 2, by, W * 0.5); gg.addColorStop(0, css(glowAll, 0.55)); gg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gg; ctx.fillRect(0, by - H * 0.15, W, H * 0.3);
      // blade 1 face with a skyline top edge (the blades behind rise and fall)
      const fx = W * 0.12, fw = W * 0.76, fy = H * 0.18, fh = by - fy;
      const l0 = light(0), base = finishWhite ? [205, 205, 200] : [40, 40, 44];
      const face = [Math.min(255, base[0] * 0.16 + l0[0] * 0.75), Math.min(255, base[1] * 0.16 + l0[1] * 0.75), Math.min(255, base[2] * 0.16 + l0[2] * 0.75)];
      ctx.fillStyle = css(sc(base, 0.18)); ctx.beginPath(); ctx.moveTo(fx + fw * 0.05, fy);
      const peaks = [0, .1, .05, .2, .12, .3, .18, .1, .25, .4, .3, .22, .5, .35, .28, .45, .2, .08, .02, .15, 0];
      peaks.forEach((p, k) => ctx.lineTo(fx + fw * (0.05 + 0.9 * k / (peaks.length - 1)), fy - p * H * 0.13)); ctx.lineTo(fx + fw * 0.95, fy); ctx.closePath(); ctx.fill();
      ctx.fillStyle = css(face); ctx.fillRect(fx, fy, fw, fh);
      // the corridor through the door
      const dx = W / 2, dw = fw * 0.34, dh = fh * 0.8, dy = fy + fh * 0.1;
      ctx.fillStyle = '#050506'; ctx.fillRect(dx - dw / 2, dy, dw, dh);
      for(let i = N - 1; i >= 1; i--) {
        const k = Math.pow(0.9, i), w = dw * k, h = dh * k, x = dx - w / 2, y = dy + (dh - h) * 0.62, l = light(i);
        const tint = i === NIGHT ? [120, 10, 8] : finishWhite || true ? [36, 36, 38] : [20, 20, 22];
        const c = [tint[0] + l[0] * 0.95, tint[1] + l[1] * 0.95, tint[2] + l[2] * 0.95];
        ctx.lineWidth = Math.max(1.2, 5 * k); ctx.strokeStyle = css(c); ctx.shadowColor = css(l, 0.9); ctx.shadowBlur = 8 * k + (i === NIGHT ? 6 : 0);
        ctx.strokeRect(x, y, w, h);
      }
      ctx.shadowBlur = 0;
      // door frame edge on blade 1
      ctx.strokeStyle = css(sc(face, 0.7)); ctx.lineWidth = 2; ctx.strokeRect(dx - dw / 2, dy, dw, dh);
      // blade strip: what each blade gets, near (left) to far (right)
      const sy = H * 0.955, sw = bw / N;
      for(let i = 0; i < N; i++) { const l = light(i); ctx.fillStyle = css([18 + l[0], 18 + l[1], 18 + l[2]]); ctx.fillRect(bx + i * sw + 1, sy, sw - 2, H * 0.03); }
    }
  }
  return { Prime, ANIMS, ANIM_NAMES, N };
})();
