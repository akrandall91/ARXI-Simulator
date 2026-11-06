// ===================================================================== ARXI kit: shared by every section
// Layout kit for concept apps, the glyphs the firmware fonts lack, and the room-profile engine.
// Loads after shared/apps.js and shared/segment.js, before a section's features.js.

// ------------------------------------------------------------------ glyphs the firmware fonts are missing
// The ARXIv2 fonts have no $ # @ &. Businesses need prices, ticket numbers and handles, so these are drawn here.
// PORT NOTE: add the same bitmaps to the firmware fonts (f3 is 5 rows, f5 is 7 rows; bit r = row r).
const EXTRA_GLYPHS = {
  f3: { '$': { cols: [18, 31, 9], adv: 3 }, '#': { cols: [10, 31, 10, 31], adv: 4 }, '@': { cols: [14, 17, 21, 22], adv: 4 }, '&': { cols: [10, 21, 10, 20], adv: 4 } },
  f5: { '$': { cols: [36, 42, 127, 42, 18], adv: 5 }, '#': { cols: [20, 127, 20, 127, 20], adv: 5 } },
};
(() => { Gfx.prototype.glyphs = function(font, s) { const f = this.fonts[font], ex = EXTRA_GLYPHS[font] || {}; return [...String(s).toUpperCase()].map(ch => ex[ch] || f[ch.charCodeAt(0)] || f[32]); }; })();

// ------------------------------------------------------------------ layout kit
// Bar (44x11): one f5 line (7 rows), or two f3 lines at y 0 and 6. Panel (44x22): a header at y 1, a big line at y 8,
// a footer at y 16. Long text scrolls at a reading pace instead of running off the edge.
const LK = {
  READ: 16, // px per second for scrolling text: slow enough to read from a stool
  line(g, s, y, c, t, speed = LK.READ) { return g.w3(s) <= g.w ? g.c3(s, y, c) : g.marquee3(s, y, c, t, speed); },
  big(g, s, y, c, t) { return g.w5(s) <= g.w ? g.c5(s, y, c) : LK.line(g, s, y + 1, c, t); },
  left3(g, s, y, c, x = 1) { return g.text3(s, x, y, c); },
  right3(g, s, y, c) { return g.text3(s, g.w - g.w3(s), y, c); },
  right5(g, s, y, c) { return g.text5(s, g.w - g.w5(s), y, c); },
  // label + value: side by side on the Bar when it fits, otherwise two lines; stacked with a footer on the Panel
  board(g, t, o) {
    const { label = '', value = '', sub = '', lc = C.white, vc = C.white, sc = 0x8a929c } = o;
    if(wide(g)) {
      if(label && 1 + g.w3(label) + 3 + g.w5(value) <= g.w) { g.text3(label, 1, 3, lc); LK.right5(g, value, 2, vc); }
      else if(!label) LK.big(g, value, 2, vc, t);
      else { LK.line(g, label, 0, lc, t); LK.line(g, value, 6, vc, t); }
    } else { if(label) LK.line(g, label, 1, lc, t); LK.big(g, value, 8, vc, t); if(sub) LK.line(g, sub, 16, sc, t); }
  },
  // 0..1 envelope for one item of a rotation: fades in and out over `edge` ms
  // pass t (ms since start): the very first item starts fully lit instead of fading up from black
  env(t, len, edge = 260) { const ph = t % len; return Math.max(0, Math.min(1, t < len ? 1 : ph / edge, (len - ph) / edge)); },
  // a little sparkle field, deterministic per time step
  sparkle(g, t, col, n = 8, rate = 110) { const st = Math.floor(t / rate); for(let i = 0; i < n; i++) { const h = Math.sin((st + i * 13.7) * 91.3) * 43758.5; const r = h - Math.floor(h);
    const x = Math.floor(r * g.w), y = Math.floor(((r * 977) % 1) * g.h); g.px(x, y, col); } },
  gauge(g, x0, y0, x1, y1, k, col, track = 0x1c1f24) { g.rect(x0, y0, x1, y1, track); const x = x0 + Math.round((x1 - x0) * Math.max(0, Math.min(1, k))); if(k > 0) g.rect(x0, y0, x, y1, col); },
  fade(g, k) { if(k >= 0.999) return; const p = g.px_; for(let i = 0; i < p.length; i++) p[i] = Math.round(p[i] * Math.max(0, k)); },
  tint(g, c, k) { const p = g.px_; const r = c >> 16 & 255, gg = c >> 8 & 255, b = c & 255; for(let i = 0; i < p.length; i += 3) if(p[i] + p[i + 1] + p[i + 2] > 24) { p[i] = Math.round(p[i] * (1 - k) + r * k); p[i + 1] = Math.round(p[i + 1] * (1 - k) + gg * k); p[i + 2] = Math.round(p[i + 2] * (1 - k) + b * k); } },
  star(g, x, y, col) { [[2, 0], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [1, 3], [2, 3], [3, 3], [1, 4], [3, 4]].forEach(([a, b]) => g.px(x + a, y + b, col)); },
  arrow(g, x, y, col) { [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [3, 1], [3, 3], [2, 0], [2, 4]].forEach(([a, b]) => g.px(x + a, y + b, col)); },
};
const WARM = 0xfff1d6, DIM = 0x8a929c, PINK = 0xff5ab4, MINT = 0x3ddc97, GOLD = 0xffc23a, SILVER = 0xc9d2dc, BRONZE = 0xd38a4a;
const every = (t, ms) => Math.floor(t / ms), phase = (t, ms) => t % ms;

// ------------------------------------------------------------------ room profiles
// A profile sets a whole room up at once: which app the Bar and the Panel each run at each part of the day (they
// complement each other, never mirror), the accent that spills into the room, and how the senses change it:
//   light    the room's brightness (0 dark .. 1 sunny window); the screens follow it so they never glare or wash out
//   presence 'busy', 'some' or 'empty'; empty rests the screens at a low breathing glow, a walk-up wakes them
//   sound    0..1 crowd level; the accent glow breathes with the room
// Each part is a situation, and "Whole day" plays every part in order.
const pick = (id, i = 0) => { const a = ARXI.apps.find(x => x.id === id); return a ? a.situations[Math.min(i, a.situations.length - 1)] : null; };
function profilePart(part, accent) {
  return S1(part.name, part.note, (g, t, dev) => {
    const [id, i] = wide(g) ? part.bar : part.pan, sit = pick(id, i); g.clear(0); let r = null;
    if(sit) r = sit.draw(g, (part.at || 0) + t, dev);
    const lvl = Math.min(part.cap || 1, 0.3 + 0.7 * (part.light ?? 0.7));
    let wake = 1; if(part.presence === 'empty') wake = part.walkup && t >= part.walkup ? Math.min(1, 0.12 + (t - part.walkup) / 700) : 0.12 + 0.06 * pulse(t, 5000);
    LK.fade(g, lvl * wake);
    if(wake < 0.5) { const y = g.h - 1, c = g.scale(accent, 0.22 + 0.12 * pulse(t, 5000)); g.rect(14, y, g.w - 15, y, c); }
    const snd = part.sound ? part.sound * (0.6 + 0.4 * Math.abs(Math.sin(t / 380) * Math.sin(t / 1100))) : 0;
    const glow = Math.max(r && r.glow || 0, (part.accentGlow ?? 0.15) + 0.35 * snd) * lvl * wake;
    return { glow, accent: r && r.accent && r.glow > 0.3 ? r.accent : accent };
  }, part.snap || 3000, part.len || 12000);
}
function wholeDay(parts, accent) {
  const sits = parts.map(p => profilePart(p, accent)), L = 9000;
  return S1('Whole day', 'Every part of the day in order, 9 s each, dimming through each change.', (g, t, dev) => {
    const i = every(t, L) % parts.length, ph = phase(t, L), r = sits[i].draw(g, ph, dev); LK.fade(g, Math.min(1, t < L ? 1 : ph / 400, (L - ph) / 400)); return r;
  }, 4000, L * parts.length);
}
