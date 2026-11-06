// ===================================================================== ARXI Simulator: engine (WebAssembly bridge)
const BAR_W = 44, BAR_H = 11, PAN_W = 44, PAN_H = 22; // the ARXI Panel is 44 x 22; a 32 x 16 prototype build is scaled up to it
const wasiStub = new Proxy({}, { get: () => () => 0 });

class Engine {
  static async create(bytes, label) {
    const mod = await WebAssembly.compile(bytes);
    const inst = await WebAssembly.instantiate(mod, { wasi_snapshot_preview1: wasiStub });
    return new Engine(inst.exports, label);
  }
  constructor(x, label) {
    this.x = x; this.label = label; x._initialize && x._initialize(); x.sim_init();
    this.keys = {}; this.str(x.sim_key_names()).split(',').filter(Boolean).forEach((k, i) => this.keys[k] = i);
    this.texts = {}; this.str(x.sim_text_names()).split(',').filter(Boolean).forEach((k, i) => this.texts[k] = i);
    this.pw = x.pan_w ? x.pan_w() : 32; this.ph = x.pan_h ? x.pan_h() : 16;
    this.defaults = {}; for(const k in this.keys) this.defaults[k] = x.world_get(this.keys[k]);
  }
  mem() { return new Uint8Array(this.x.memory.buffer); }
  str(p) { const b = this.mem(); let s = ''; while(b[p]) s += String.fromCharCode(b[p++]); return s; }
  buf(s) { const b = this.mem(), p = this.x.sim_buf(); s = String(s || '').normalize('NFKD').replace(/[^\x20-\x7e]/g, ''); const n = Math.min(s.length, 511); for(let i = 0; i < n; i++) b[p + i] = s.charCodeAt(i); b[p + n] = 0; }
  init() { this.x.sim_init(); }
  set(k, v) { if(k in this.keys) this.x.world_set(this.keys[k], v | 0); }
  get(k) { return k in this.keys ? this.x.world_get(this.keys[k]) : 0; }
  text(k, s) { if(k in this.texts) { this.buf(s); this.x.world_text(this.texts[k]); } }
  lyrics(lines) { this.x.lyrics_clear(); for(const [ms, t] of lines || []) { this.buf(t); this.x.lyrics_add(ms); } }
  barAction(a, p1 = 0, p2 = 0, now = 0, text = '') { this.buf(text); this.x.bar_action(a, p1 | 0, p2 | 0, now >>> 0); }
  panAction(a, p1 = 0, now = 0) { this.x.pan_action(a, p1 | 0, now >>> 0); }
  frame(now, snd) {
    const x = this.x;
    if(snd) { const b = this.mem(), p = x.pan_band(); for(let i = 0; i < 16; i++) b[p + i] = snd.band[i]; x.pan_sound(snd.level, snd.music ? 1 : 0); this.set('MIC_LEVEL', snd.level); }
    const src = x.bar_frame(now >>> 0), scr = x.bar_screen(); x.pan_strip(src, scr);
    const view = x.pan_frame(now >>> 0);
    return { src, scr, view, wanting: x.bar_wanting(), art: x.pan_art(), gdv: x.bar_gameday_view(), left: x.bar_remaining(now >>> 0) };
  }
  barPixels() { return new Uint8Array(this.x.memory.buffer, this.x.bar_pixels(), BAR_W * BAR_H * 3).slice(); }
  panPixels() { const raw = new Uint8Array(this.x.memory.buffer, this.x.pan_pixels(), this.pw * this.ph * 3);
    if(this.pw === PAN_W && this.ph === PAN_H) return raw.slice();
    const o = new Uint8Array(PAN_W * PAN_H * 3); for(let j = 0; j < PAN_H; j++) { const sy = Math.min(this.ph - 1, Math.floor((j + 0.5) * this.ph / PAN_H)); for(let i = 0; i < PAN_W; i++) { const sx = Math.min(this.pw - 1, Math.floor((i + 0.5) * this.pw / PAN_W)), a = (sy * this.pw + sx) * 3, b = (j * PAN_W + i) * 3; o[b] = raw[a]; o[b + 1] = raw[a + 1]; o[b + 2] = raw[a + 2]; } } return o; }
  viewName(v) { return this.str(this.x.pan_view_name(v)); }
  artName(i) { return i < 0 ? '' : this.str(this.x.pan_art_name(i)); }
  iconName(i) { return this.str(this.x.icon_name(i)); }
  fonts() { // the firmware's 3x5 and 5x7 glyphs, trimmed to their lit columns exactly as drawText3x5/5x7 do
    const f3 = {}, f5 = {};
    for(let c = 32; c < 127; c++) {
      const a = [0, 1, 2, 3].map(k => this.x.glyph3(c, k)), b = [0, 1, 2, 3, 4].map(k => this.x.glyph5(c, k));
      const trim = cols => { let f = cols.findIndex(v => v), l = cols.length - 1 - [...cols].reverse().findIndex(v => v); return f < 0 ? [] : cols.slice(f, l + 1); };
      f3[c] = { cols: trim(a), adv: this.x.adv3(c) }; f5[c] = { cols: trim(b), adv: this.x.adv5(c) };
    }
    return { f3, f5 };
  }
}

// A small canvas for concept apps: same fonts and text rules as the firmware (upper-case folding included).
class Gfx {
  constructor(w, h, fonts) { this.w = w; this.h = h; this.fonts = fonts; this.px_ = new Uint8Array(w * h * 3); }
  clear(c = 0) { for(let i = 0; i < this.w * this.h; i++) this.put(i, c); }
  put(i, c) { const p = this.px_; p[i * 3] = c >> 16 & 255; p[i * 3 + 1] = c >> 8 & 255; p[i * 3 + 2] = c & 255; }
  px(x, y, c) { x |= 0; y |= 0; if(x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.put(y * this.w + x, c); }
  rect(x0, y0, x1, y1, c) { for(let y = y0; y <= y1; y++) for(let x = x0; x <= x1; x++) this.px(x, y, c); }
  glyphs(font, s) { const f = this.fonts[font]; return [...String(s).toUpperCase()].map(ch => f[ch.charCodeAt(0)] || f[32]); }
  text(font, rows, s, x, y, c) { let cur = x; for(const g of this.glyphs(font, s)) { g.cols.forEach((bits, k) => { for(let r = 0; r < rows; r++) if(bits & (1 << r)) this.px(cur + k, y + r, c); }); cur += g.adv + 1; } return cur - x - 1; }
  width(font, s) { return this.glyphs(font, s).reduce((w, g) => w + g.adv + 1, 0) - 1; }
  text3(s, x, y, c) { return this.text('f3', 5, s, x, y, c); }
  text5(s, x, y, c) { return this.text('f5', 7, s, x, y, c); }
  w3(s) { return this.width('f3', s); } w5(s) { return this.width('f5', s); }
  c3(s, y, c) { return this.text3(s, Math.floor((this.w - this.w3(s)) / 2), y, c); }
  c5(s, y, c) { return this.text5(s, Math.floor((this.w - this.w5(s)) / 2), y, c); }
  marquee3(s, y, c, t, pxps = 25, once = false) { const w = this.w3(s); if(w <= this.w) return this.c3(s, y, c); const span = w + this.w, off = Math.floor(t / 1000 * pxps); const x = this.w - (once ? Math.min(off, span) : off % span); return this.text3(s, x, y, c); }
  hsv(h, s, v) { h = ((h % 256) + 256) % 256 / 256 * 6; s /= 255; v /= 255; const i = Math.floor(h), f = h - i, p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f)); const [r, g, b] = [[v, t, p], [q, v, p], [p, v, t], [p, q, v], [t, p, v], [v, p, q]][i % 6]; return (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255); }
  mix(a, b, k) { k = Math.max(0, Math.min(1, k)); const m = (s) => Math.round((a >> s & 255) * (1 - k) + (b >> s & 255) * k); return (m(16) << 16) | (m(8) << 8) | m(0); }
  scale(c, k) { return this.mix(0, c, k); }
}
