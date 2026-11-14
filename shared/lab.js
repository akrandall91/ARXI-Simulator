// ===================================================================== ARXI Lab: markets, Words & icons, Model builder
// Markets: who an app is for. Words & icons: try a message on every screen size with words, pixel icons and emoji, and
// see which layout fits. Model builder: pick a market, screens and features, play the result as a reel, export it.

// ------------------------------------------------------------------ markets
const MARKETS = ['Consumer', 'Commercial', 'Government'];
const AUD_MARKET = { 'Home': ['Consumer'], 'You': ['Consumer'], 'Families': ['Consumer'], 'Creators': ['Consumer', 'Commercial'],
  'Local businesses': ['Commercial'], 'Funeral homes': ['Commercial'], 'Transit agencies': ['Government'], 'Parks & recreation': ['Government'] };
const MARKET_ALL = ['clock', 'date', 'weather-now', 'forecast', 'air', 'sun-arc', 'styles', 'rotation', 'countdown', 'ticker', 'timers',
  'boot', 'power-on', 'showcase', 'wx-scenes', 'stop-weather', 'weather-safety', 'wait', 'occupancy', 'now-serving', 'parking', 'events'];
const MARKET_PLUS = { calendar: ['Commercial'], notify: ['Commercial'], chime: ['Commercial'], presence: ['Commercial'], moon: ['Government'],
  timeline: ['Commercial'], visualizers: ['Commercial'], lyrics: ['Commercial'], 'nfl-scores': ['Commercial'], gameday: ['Commercial'],
  'nfl-moments': ['Commercial'], nba: ['Commercial'], cfb: ['Commercial'], 'team-colours': ['Commercial'], celebrate: ['Commercial'],
  'open-sign': [], specials: [], social: ['Government'], 'service-alert': [], 'bike-share': ['Commercial'] };
function marketsOf(app) {
  if(app.markets) return app.markets;
  if(MARKET_ALL.includes(app.id)) return MARKETS;
  const m = new Set([...(AUD_MARKET[app.audience] || ['Consumer']), ...(MARKET_PLUS[app.id] || [])]);
  return MARKETS.filter(x => m.has(x));
}
function marketOk(app, market) { market = market || S.market || 'all'; return market === 'all' || marketsOf(app).includes(market); }

// ------------------------------------------------------------------ pixel icons (7 x 7, drawn for LEDs)
const PIX_COL = { w: 0xffffff, y: 0xffc400, o: 0xff7a00, r: 0xff2a2a, g: 0x22dd44, b: 0x2a6bff, c: 0x22ccff, p: 0xff5fa8, m: 0xc040ff, k: 0x8a8f98, n: 0xa0522d };
const PIX = {
  bus: ['.bbbbb.', 'bwwwwwb', 'bwwwwwb', 'bbbbbbb', 'bybbbyb', 'bbbbbbb', '.k...k.'],
  clock: ['..www..', '.w...w.', 'w..w..w', 'w..ww.w', 'w.....w', '.w...w.', '..www..'],
  heart: ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'],
  check: ['.......', '......g', '.....gg', 'g...gg.', 'gg.gg..', '.ggg...', '..g....'],
  x: ['r.....r', '.r...r.', '..r.r..', '...r...', '..r.r..', '.r...r.', 'r.....r'],
  right: ['...w...', '...ww..', 'wwwwww.', 'wwwwwww', 'wwwwww.', '...ww..', '...w...'],
  left: ['...w...', '..ww...', '.wwwwww', 'wwwwwww', '.wwwwww', '..ww...', '...w...'],
  up: ['...w...', '..www..', '.wwwww.', 'wwwwwww', '..www..', '..www..', '..www..'],
  down: ['..www..', '..www..', '..www..', 'wwwwwww', '.wwwww.', '..www..', '...w...'],
  sun: ['y..y..y', '.y.y.y.', '..yyy..', 'yyyyyyy', '..yyy..', '.y.y.y.', 'y..y..y'],
  cloud: ['.......', '..www..', '.wwwww.', 'wwwwwww', 'wwwwwww', '.......', '.......'],
  rain: ['..kkk..', '.kkkkk.', 'kkkkkkk', '.......', '.c.c.c.', 'c.c.c..', '.......'],
  bolt: ['...yy..', '..yy...', '.yyyy..', '...yy..', '..yy...', '.yy....', '.y.....'],
  bell: ['...y...', '..yyy..', '.yyyyy.', '.yyyyy.', '.yyyyy.', 'yyyyyyy', '...y...'],
  warn: ['...y...', '..yky..', '..yky..', '.yykyy.', '.yyyyy.', 'yyykyyy', 'yyyyyyy'],
  star: ['...y...', '...y...', 'yyyyyyy', '.yyyyy.', '..yyy..', '.yy.yy.', '.y...y.'],
  walk: ['...w...', '.......', '..www..', '.w.w.w.', '...w...', '..w.w..', '.w...w.'],
  access: ['..w....', '.......', '..ww...', '..w....', '.wwwww.', 'w..w.w.', '.ww..w.'],
  parking: ['bbbbbbb', 'bwwwwbb', 'bwbbbwb', 'bwwwwbb', 'bwbbbbb', 'bwbbbbb', 'bbbbbbb'],
  music: ['...cccc', '...c..c', '...c..c', '...c..c', '.ccc.cc', 'ccc.ccc', '.c...c.'],
  coffee: ['.w.w...', '..w.w..', 'nnnnn..', 'nnnnnnn', 'nnnnn.n', 'nnnnnn.', '.nnn...'],
  fire: ['...o...', '..oo...', '..ooo.o', '.ooyoo.', 'ooyyyoo', 'oyyyyyo', '.oyyyo.'],
  drop: ['...c...', '...c...', '..ccc..', '.ccccc.', '.ccwcc.', '.ccccc.', '..ccc..'],
  tree: ['...g...', '..ggg..', '.ggggg.', '..ggg..', '.ggggg.', 'ggggggg', '...n...'],
  home: ['...o...', '..ooo..', '.ooooo.', 'ooooooo', '.w.n.w.', '.w.n.w.', '.wwnww.'],
  info: ['..bbb..', '.bbwbb.', 'bbbbbbb', 'bbwwbbb', 'bbbwbbb', '.bwwwb.', '..bbb..'],
  cake: ['.y.y.y.', '.r.r.r.', 'ppppppp', 'pwpwpwp', 'ppppppp', 'nnnnnnn', '.......'],
  mail: ['.......', 'wwwwwww', 'ww...ww', 'w.w.w.w', 'w..w..w', 'w.....w', 'wwwwwww'],
  moon: ['..yyy..', '.yy....', 'yy.....', 'yy.....', 'yy.....', '.yy....', '..yyy..'],
  dollar: ['...g...', '.ggggg.', 'g..g...', '.gggg..', '...g.g.', 'ggggg..', '...g...'],
  live: ['..rrr..', '.rrrrr.', 'rrrrrrr', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..'],
};
const ICON_WORDS = { bus: 'bus', buses: 'bus', route: 'bus', love: 'heart', heart: 'heart', open: 'check', yes: 'check', ready: 'check', done: 'check',
  closed: 'x', no: 'x', cancelled: 'x', canceled: 'x', next: 'right', sunny: 'sun', sun: 'sun', cloudy: 'cloud', rain: 'rain', rainy: 'rain', showers: 'rain',
  storm: 'bolt', storms: 'bolt', lightning: 'bolt', thunder: 'bolt', alert: 'bell', notice: 'bell', warning: 'warn', caution: 'warn', star: 'star', vip: 'star',
  walk: 'walk', accessible: 'access', wheelchair: 'access', parking: 'parking', music: 'music', song: 'music', coffee: 'coffee', cafe: 'coffee', hot: 'fire',
  water: 'drop', pool: 'drop', splash: 'drop', trail: 'tree', trails: 'tree', home: 'home', info: 'info', information: 'info', birthday: 'cake', mail: 'mail',
  message: 'mail', night: 'moon', tonight: 'moon', sale: 'dollar', deal: 'dollar', live: 'live', time: 'clock' };
const SHORT = { minutes: 'MIN', minute: 'MIN', mins: 'MIN', hours: 'HR', hour: 'HR', seconds: 'SEC', northbound: 'NB', southbound: 'SB', eastbound: 'EB',
  westbound: 'WB', street: 'ST', avenue: 'AVE', road: 'RD', boulevard: 'BLVD', drive: 'DR', downtown: 'DTWN', station: 'STN', center: 'CTR', centre: 'CTR',
  transfer: 'XFER', express: 'EXP', arriving: 'ARR', departing: 'DEP', delayed: 'LATE', cancelled: 'CXL', canceled: 'CXL', temperature: 'TEMP',
  tomorrow: 'TMRW', tonight: 'TNITE', monday: 'MON', tuesday: 'TUE', wednesday: 'WED', thursday: 'THU', friday: 'FRI', saturday: 'SAT', sunday: 'SUN',
  and: '&', with: 'W/', number: '#', please: 'PLS', thanks: 'THX', people: 'PPL', available: 'AVAIL', information: 'INFO', appointment: 'APPT',
  service: 'SVC', parking: 'PKG', entrance: 'ENT', restrooms: 'WC', restroom: 'WC', birthday: 'BDAY', congratulations: 'CONGRATS', percent: '%',
  until: 'TIL', between: 'BTWN', weather: 'WX', approximately: '~', about: '~', half: '1/2', welcome: 'HI', everyone: 'ALL', chapel: 'CHPL' };

// ------------------------------------------------------------------ atoms: text, pixel icons, emoji
const _seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
const isEmoji = (g) => /\p{Extended_Pictographic}|\p{Regional_Indicator}/u.test(g);
function parseMsg(msg) { // -> words, each a list of atoms {k:'t',s} | {k:'i',n} | {k:'e',ch}
  const words = [];
  for(const raw of String(msg || '').trim().split(/\s+/).filter(Boolean)) {
    const atoms = []; let txt = '';
    const flush = () => { if(txt) { atoms.push({ k: 't', s: txt }); txt = ''; } };
    const parts = raw.split(/(:[a-z]+:)/);
    for(const part of parts) {
      if(/^:[a-z]+:$/.test(part) && PIX[part.slice(1, -1)]) { flush(); atoms.push({ k: 'i', n: part.slice(1, -1) }); continue; }
      const gs = _seg ? [..._seg.segment(part)].map(s => s.segment) : [...part];
      for(const g of gs) { if(isEmoji(g)) { flush(); atoms.push({ k: 'e', ch: g }); } else txt += g.normalize('NFKD').replace(/[^\x20-\x7e]/g, ''); }
    }
    flush(); if(atoms.length) words.push(atoms);
  }
  return words;
}
const wordText = (w) => w.length === 1 && w[0].k === 't' ? w[0].s : null;
const bare = (s) => s.toLowerCase().replace(/[^a-z]/g, '');
function shorten(words) { return words.map(w => { const t = wordText(w); if(t == null) return w; const k = bare(t), r = SHORT[k]; return r ? [{ k: 't', s: t.replace(new RegExp(k, 'i'), r) }] : w; }); }
function withIcons(words) { return words.map(w => { const t = wordText(w); if(t == null) return w; const n = ICON_WORDS[bare(t)]; return n ? [{ k: 'i', n }] : w; }); }
const sameWords = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function wordsLabel(words) { return words.map(w => w.map(a => a.k === 't' ? a.s.toUpperCase() : a.k === 'i' ? `[${a.n}]` : a.ch).join('')).join(' '); }

const _emo = new Map();
function emojiPix(ch, n) { // the system emoji, rendered big then averaged down to n x n LEDs, as an LED would show it
  const key = ch + '|' + n; if(_emo.has(key)) return _emo.get(key);
  const Z = 72, c = document.createElement('canvas'); c.width = c.height = Z; const x = c.getContext('2d', { willReadFrequently: true });
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = `${Z * 0.8}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  x.fillText(ch, Z / 2, Z / 2 + Z * 0.05);
  const d = x.getImageData(0, 0, Z, Z).data; let x0 = Z, y0 = Z, x1 = -1, y1 = -1;
  for(let y = 0; y < Z; y++) for(let xx = 0; xx < Z; xx++) if(d[(y * Z + xx) * 4 + 3] > 30) { x0 = Math.min(x0, xx); x1 = Math.max(x1, xx); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  let out = null;
  if(x1 >= 0) {
    const side = Math.max(x1 - x0 + 1, y1 - y0 + 1), ox = (x0 + x1 + 1) / 2 - side / 2, oy = (y0 + y1 + 1) / 2 - side / 2; out = [];
    for(let j = 0; j < n; j++) for(let i = 0; i < n; i++) {
      let r = 0, g = 0, b = 0, a = 0, cnt = 0;
      for(let yy = Math.floor(oy + j * side / n); yy < Math.ceil(oy + (j + 1) * side / n); yy++) for(let xx = Math.floor(ox + i * side / n); xx < Math.ceil(ox + (i + 1) * side / n); xx++) {
        cnt++; if(xx < 0 || yy < 0 || xx >= Z || yy >= Z) continue; const p = (yy * Z + xx) * 4, al = d[p + 3]; r += d[p] * al; g += d[p + 1] * al; b += d[p + 2] * al; a += al; }
      if(!cnt || a / (cnt * 255) < 0.42) { out.push(-1); continue; }
      r /= a; g /= a; b /= a; const v = Math.max(r, g, b), k = v > 8 && v < 170 ? Math.min(2.4, 170 / v) : 1;
      out.push((Math.min(255, Math.round(r * k)) << 16) | (Math.min(255, Math.round(g * k)) << 8) | Math.min(255, Math.round(b * k)));
    }
    if(out.every(v => v < 0)) out = null;
  }
  _emo.set(key, out); return out;
}
function iconPix(name, n) { // a 7 x 7 pixel icon at n x n (nearest neighbour: whole-number sizes stay crisp)
  const rows = PIX[name], out = [];
  for(let j = 0; j < n; j++) for(let i = 0; i < n; i++) { const ch = rows[Math.floor((j + 0.5) * 7 / n)][Math.floor((i + 0.5) * 7 / n)]; out.push(ch === '.' ? -1 : PIX_COL[ch]); }
  return out;
}
function drawSq(g, px, n, x, y) { if(!px) { g.rect(x, y, x + n - 1, y + n - 1, 0x303030); return; } for(let j = 0; j < n; j++) for(let i = 0; i < n; i++) { const c = px[j * n + i]; if(c >= 0) g.px(x + i, y + j, c); } }
function atomPix(a, n) { return a.k === 'i' ? iconPix(a.n, n) : emojiPix(a.ch, n); }

// ------------------------------------------------------------------ layout
const FONT = { big: { font: 'f5', lh: 7, name: 'big' }, small: { font: 'f3', lh: 5, name: 'small' } };
const atomW = (g, a, f) => a.k === 't' ? Math.max(0, g.width(f.font, a.s)) : f.lh;
const wordW = (g, w, f) => w.reduce((s, a) => s + atomW(g, a, f), 0) + w.length - 1;
const gapW = (g, f) => g.fonts[f.font][32].adv + 2;
const lineW = (g, ws, f) => ws.reduce((s, w) => s + wordW(g, w, f), 0) + Math.max(0, ws.length - 1) * gapW(g, f);
function drawLine(g, ws, x, y, f, color) {
  let cx = x;
  for(const w of ws) { for(const a of w) { if(a.k === 't') g.text(f.font, f.lh, a.s, cx, y, color); else drawSq(g, atomPix(a, f.lh), f.lh, cx, y); cx += atomW(g, a, f) + 1; } cx += gapW(g, f) - 1; }
}
function wrap(g, words, f, maxW, maxLines) {
  const lines = []; let cur = [];
  for(const w of words) {
    if(wordW(g, w, f) > maxW) return null;
    if(cur.length && lineW(g, [...cur, w], f) > maxW) { lines.push(cur); cur = []; }
    cur.push(w);
  }
  if(cur.length) lines.push(cur);
  return lines.length && lines.length <= maxLines ? lines : null;
}
function stack(g, lines, f, x, w, h, color, gap) { const tot = lines.length * f.lh + (lines.length - 1) * gap, y0 = Math.floor((h - tot) / 2); lines.forEach((ln, i) => drawLine(g, ln, x + Math.floor((w - lineW(g, ln, f)) / 2), y0 + i * (f.lh + gap), f, color)); }
function linesFit(g, words, f, w, h, minLines) { // most lines that fit the height, gap 1 (or 0 when 1 does not fit)
  for(const gap of [1, 0]) { const max = Math.floor((h + gap) / (f.lh + gap)); if(max < minLines) continue; const ls = wrap(g, words, f, w, max); if(ls && ls.length >= minLines) return { lines: ls, gap }; }
  return null;
}
function blit(dst, src, ox, oy) { for(let y = 0; y < src.h; y++) for(let x = 0; x < src.w; x++) { const i = (y * src.w + x) * 3, c = (src.px_[i] << 16) | (src.px_[i + 1] << 8) | src.px_[i + 2]; if(c) dst.px(ox + x, oy + y, c); } }
const SCROLL_PXPS = 22;
function marqueeLine(g, words, f, w, h, t, color) { const W = lineW(g, words, f), x = w - Math.floor(t / 1000 * SCROLL_PXPS) % (W + w); drawLine(g, words, x, Math.floor((h - f.lh) / 2), f, color); }

// Every way to show a message on one screen, best first. Each candidate knows whether it fits without scrolling.
function fitCandidates(g, msg) {
  const { w, h } = g, base = parseMsg(msg), out = [];
  if(!base.length) return out;
  const sh = shorten(base), ic = shorten(withIcons(base));
  const variants = [['as typed', base]]; if(!sameWords(sh, base)) variants.push(['shortened', sh]); if(!sameWords(ic, sh) && !sameWords(ic, base)) variants.push(['icons for words', ic]);
  for(const [variant, words] of variants) {
    const add = (key, label, ok, draw) => out.push({ key: key + ':' + variant, label, variant, words, ok, draw });
    const one = (f) => h >= f.lh && lineW(g, words, f) <= w;
    if(one(FONT.big)) add('big1', 'One line, big letters', true, (g2, t, c) => stack(g2, [words], FONT.big, 0, w, h, c, 0));
    // picture + words: the first icon or emoji large, the rest beside it
    const hi = words.findIndex(wd => wd.length === 1 && wd[0].k !== 't');
    if(hi >= 0) {
      const a = words[hi][0], rest = words.filter((_, i) => i !== hi), n = a.k === 'i' ? 7 * Math.max(1, Math.floor(h / 7)) : (h <= 11 ? h : h - 2), aw = w - n - 2;
      const pic = (g2) => drawSq(g2, atomPix(a, n), n, 0, Math.floor((h - n) / 2));
      const sub = (fn) => (g2, t, c) => { pic(g2); const s = new Gfx(aw, h, g2.fonts); fn(s, t, c); blit(g2, s, n + 2, 0); };
      let lay = null;
      if(!rest.length) add('hero', 'Picture alone', true, (g2) => pic(g2));
      else if(aw > 6) {
        for(const f of [FONT.big, FONT.small]) { lay = linesFit(g, rest, f, aw, h, 1); if(lay) { const L = lay, F = f; add('hero', `Picture + words (${L.lines.length > 1 ? L.lines.length + ' lines, ' : ''}${F.name})`, true, sub((s, t, c) => stack(s, L.lines, F, 0, aw, h, c, L.gap))); break; } }
        if(!lay) add('heroScroll', 'Picture + scrolling words', false, sub((s, t, c) => marqueeLine(s, rest, h >= 7 ? FONT.big : FONT.small, aw, h, t, c)));
      }
    }
    const big = linesFit(g, words, FONT.big, w, h, 2); if(big) add('lines5', `${big.lines.length} lines, big letters`, true, (g2, t, c) => stack(g2, big.lines, FONT.big, 0, w, h, c, big.gap));
    if(one(FONT.small)) add('small1', 'One line, small letters', true, (g2, t, c) => stack(g2, [words], FONT.small, 0, w, h, c, 0));
    const sm = linesFit(g, words, FONT.small, w, h, 2); if(sm) add('lines3', `${sm.lines.length} lines, small letters`, true, (g2, t, c) => stack(g2, sm.lines, FONT.small, 0, w, h, c, sm.gap));
  }
  out.push({ key: 'scroll', label: 'Scrolls across', variant: 'as typed', words: base, ok: false, draw: (g2, t, c) => marqueeLine(g2, base, h >= 7 ? FONT.big : FONT.small, w, h, t, c) });
  return out;
}
function bestFit(cands) { return cands.find(c => c.ok) || cands.find(c => c.key.startsWith('heroScroll')) || cands[cands.length - 1]; }

// ------------------------------------------------------------------ Words & icons tab
const FIT_SCREENS = [{ id: 'bar', name: 'ARXI Bar', w: 44, h: 11 }, { id: 'pan', name: 'Companion', w: 32, h: 16 }, { id: 'big', name: 'ARXI Panel', w: 44, h: 22 }];
const FIT_PRESETS = ['Route 7 Downtown 3 minutes', 'Next :bus: 12 Northbound 8 min', 'Trail closed flooding', 'Now serving A42', 'Happy hour 4-7 half off drinks',
  'Order 118 ready', 'Severe storm warning take shelter', 'Happy birthday 🎂', 'Service 2 PM Chapel A', 'Pool open until 8 PM', 'Live now 🔴', '72° sunny ☀️'];
const FIT_EMOJI = ['🚌', '🚲', '♿', '🅿️', '⏱️', '☀️', '🌧️', '⛈️', '❄️', '🌳', '🏊', '⚠️', '🔔', '✅', '❌', '❤️', '⭐', '🎉', '🎂', '☕', '🍕', '🍺', '🎵', '🏈', '🏀', '🔴', '🔥', '💧', '🕯️', '🌙'];
const F = { msg: '', color: '#ffb000', pick: {}, raf: 0, cands: {} };
function renderFit() {
  const p = $('pFit');
  if(!p._built) {
    p._built = true; const st = store.get('fit', { msg: FIT_PRESETS[1], color: '#ffb000' }); F.msg = st.msg; F.color = st.color;
    const inp = el('input', { type: 'text', id: 'fitMsg', value: F.msg, 'aria-label': 'Message', placeholder: 'Type a message. Add :bus: or an emoji.' });
    const col = el('input', { type: 'color', id: 'fitCol', value: F.color, 'aria-label': 'Text colour' });
    const pre = el('select', { id: 'fitPreset', 'aria-label': 'Examples' }, el('option', { value: '', text: 'Examples…' }), ...FIT_PRESETS.map(s => el('option', { value: s, text: s })));
    const upd = () => { F.msg = inp.value; F.color = col.value; F.pick = {}; store.set('fit', { msg: F.msg, color: F.color }); fitCompute(); };
    inp.oninput = upd; col.oninput = upd; pre.onchange = () => { if(pre.value) { inp.value = pre.value; pre.value = ''; upd(); } };
    const insert = (s) => { const i = inp.selectionStart ?? inp.value.length; inp.value = inp.value.slice(0, i) + s + inp.value.slice(inp.selectionEnd ?? i); inp.focus(); upd(); };
    const icons = el('div', { class: 'iconrow', role: 'group', 'aria-label': 'Pixel icons' }, ...Object.keys(PIX).map(n => { const b = el('button', { class: 'pixbtn', title: `:${n}:`, 'aria-label': `Insert ${n} icon` }); b.append(pixThumb(iconPix(n, 7), 7)); b.onclick = () => insert(` :${n}: `); return b; }));
    const emo = el('div', { class: 'iconrow', role: 'group', 'aria-label': 'Emoji' }, ...FIT_EMOJI.map(e => { const b = el('button', { class: 'emobtn', title: 'Insert ' + e, text: e }); b.onclick = () => insert(` ${e} `); return b; }));
    p.append(
      el('div', { class: 'fitbar' }, el('div', { class: 'f grow' }, el('label', { for: 'fitMsg', text: 'Message' }), inp), el('div', { class: 'f' }, el('label', { for: 'fitCol', text: 'Colour' }), col), el('div', { class: 'f' }, el('label', { for: 'fitPreset', text: 'Try one' }), pre)),
      el('div', { class: 'f', style: 'margin-top:10px' }, el('label', { text: 'Pixel icons (made for LEDs, crisp at any size)' }), icons),
      el('details', { class: 'fitmore' }, el('summary', { text: 'Emoji (your system emoji, shrunk to LEDs the way the matrix would show them)' }), emo),
      el('div', { class: 'fitwall', id: 'fitWall' }),
      el('details', { class: 'fitmore' }, el('summary', { text: 'Every layout on every screen' }), el('div', { id: 'fitAll' })),
      el('details', { class: 'fitmore' }, el('summary', { text: 'How it fits a message' }), el('p', { class: 'hint', text: 'Each screen tries, in order: one line in big 5×7 letters; the picture large with the words beside it; two or three lines; small 3×5 letters. If none fit it tries again with words shortened (Minutes → MIN, Northbound → NB, Street → ST), then with words swapped for icons (rain → a rain cloud, closed → a red X). Only when nothing fits does it scroll. Click any layout below a screen to pin it.' })),
      el('div', { class: 'btns', style: 'margin-top:12px' }, el('button', { class: 'btn primary', html: icon('screens', 15) + ' Show on the main screens', on: { click: fitToStage } }), el('button', { class: 'btn', html: icon('box', 15) + ' Copy layouts (JSON)', on: { click: fitCopy } })));
  }
  fitCompute(); fitRun();
}
function pixThumb(px, n, cell = 3) { const c = el('canvas', { width: n * cell, height: n * cell }), x = c.getContext('2d'); px && px.forEach((v, i) => { if(v >= 0) { x.fillStyle = '#' + v.toString(16).padStart(6, '0'); x.fillRect((i % n) * cell, Math.floor(i / n) * cell, cell - 0.5, cell - 0.5); } }); return c; }
function fitCompute() {
  const wall = $('fitWall'), all = $('fitAll'); if(!wall) return; wall.innerHTML = ''; all.innerHTML = '';
  for(const sc of FIT_SCREENS) {
    const g = new Gfx(sc.w, sc.h, S.fonts), cands = fitCandidates(g, F.msg); F.cands[sc.id] = cands;
    const chosen = cands.find(c => c.key === F.pick[sc.id]) || bestFit(cands);
    const cv = el('canvas', { width: sc.w * 10, height: sc.h * 10, class: 'fitcv', id: 'fitcv-' + sc.id }); cv._sc = sc; cv._off = el('canvas', { width: sc.w, height: sc.h });
    const v = !chosen ? ['', 'Type a message'] : !chosen.ok ? ['scroll', 'Scrolls'] : chosen.variant === 'as typed' ? ['ok', 'Fits'] : ['warn', chosen.variant === 'shortened' ? 'Fits shortened' : 'Fits with icons'];
    const sel = el('select', { 'aria-label': sc.name + ' layout' }, el('option', { value: '', text: 'Best fit (auto)' }), ...cands.map(c => el('option', { value: c.key, text: `${c.ok ? '✓' : '↔'} ${c.label}${c.variant !== 'as typed' ? ' · ' + c.variant : ''}`, selected: F.pick[sc.id] === c.key })));
    sel.onchange = () => { F.pick[sc.id] = sel.value || undefined; fitCompute(); };
    wall.append(el('figure', { class: 'fitdev', style: `--cols:${sc.w}` }, el('div', { class: 'bezel' }, cv),
      el('figcaption', {}, el('div', { class: 'fithead' }, el('b', { text: sc.name }), el('span', { class: 'muted', text: ` ${sc.w}×${sc.h}` }), el('span', { class: 'verdict ' + v[0], text: v[1] })),
        el('div', { class: 'fitlbl', text: chosen ? `${chosen.label}${chosen.variant !== 'as typed' ? ': ' + wordsLabel(chosen.words) : ''}` : '' }), sel)));
    cv._cand = chosen;
    const strip = el('div', { class: 'fitstrip' }, el('div', { class: 'fitstriph', text: `${sc.name} ${sc.w}×${sc.h}` }));
    for(const c of cands) { const g2 = new Gfx(sc.w, sc.h, S.fonts); c.draw(g2, 1400, hex2int(F.color)); const b = el('button', { class: 'fitthumb' + (c === chosen ? ' on' : ''), title: c.label }); b.append(thumbOf(g2), el('span', { text: `${c.ok ? '✓' : '↔'} ${c.label}${c.variant !== 'as typed' ? ' · ' + c.variant : ''}` })); b.onclick = () => { F.pick[sc.id] = c.key; fitCompute(); }; strip.append(b); }
    all.append(strip);
  }
}
function thumbOf(g) { const c = el('canvas', { width: g.w * 3, height: g.h * 3 }), x = c.getContext('2d'); x.fillStyle = '#050505'; x.fillRect(0, 0, c.width, c.height); for(let i = 0; i < g.w * g.h; i++) { const v = (g.px_[i * 3] << 16) | (g.px_[i * 3 + 1] << 8) | g.px_[i * 3 + 2]; if(v) { x.fillStyle = '#' + v.toString(16).padStart(6, '0'); x.fillRect((i % g.w) * 3, Math.floor(i / g.w) * 3, 2.6, 2.6); } } return c; }
const hex2int = (h) => parseInt(String(h).replace('#', ''), 16) || 0xffb000;
function fitRun() {
  cancelAnimationFrame(F.raf); const t0 = performance.now();
  const tick = () => {
    if(S.tab !== 'tFit') return;
    const t = performance.now() - t0;
    document.querySelectorAll('.fitcv').forEach(cv => { const sc = cv._sc, g = new Gfx(sc.w, sc.h, S.fonts); if(cv._cand) cv._cand.draw(g, t, hex2int(F.color)); paint(cv, cv._off, g.px_, sc.w, sc.h); });
    F.raf = requestAnimationFrame(tick);
  };
  F.raf = requestAnimationFrame(tick);
}
function fitChosen(id) { const c = F.cands[id] || []; return c.find(x => x.key === F.pick[id]) || bestFit(c); }
function fitToStage() {
  const msg = F.msg, color = hex2int(F.color), pick = { ...F.pick };
  const sit = { name: msg || '(empty)', note: 'Your message from Words & icons, laid out for each screen.', len: 30000, snap: 1500,
    draw: (g, t, dev) => { const cands = fitCandidates(g, msg), id = dev === 'bar' ? 'bar' : 'pan', c = cands.find(x => x.key === pick[id]) || bestFit(cands); if(c) c.draw(g, t, color); } };
  const app = { id: 'fit-message', group: 'Words & icons', name: 'Your message', kind: 'concept', tier: 'internal', audience: 'Home', devices: ['bar', 'panel'], blurb: 'From the Words & icons tab.', situations: [sit] };
  load(app, sit); S.playing = true; setPlayIcon(); document.querySelector('.stage').scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function fitCopy() {
  const out = { message: F.msg, colour: F.color, screens: FIT_SCREENS.map(sc => { const c = fitChosen(sc.id); return { screen: `${sc.name} ${sc.w}x${sc.h}`, layout: c && c.label, fits: !!(c && c.ok), variant: c && c.variant, shows: c && wordsLabel(c.words) }; }) };
  copyText(JSON.stringify(out, null, 2));
}
function copyText(s) { try { navigator.clipboard.writeText(s); toast('Copied'); } catch(e) { toast('Copy failed'); } }
function toast(s) { let t = $('toast'); if(!t) { t = el('div', { id: 'toast', class: 'toast', role: 'status' }); document.body.append(t); } t.textContent = s; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 1600); }

// ------------------------------------------------------------------ Model builder tab
const MODEL_PRESETS = {
  'Home Bar': { market: 'Consumer', screens: ['bar', 'panel'], power: 'Wall', features: ['clock', 'date', 'weather-now', 'forecast', 'calendar', 'countdown', 'lyrics', 'lyric-pictures', 'visualizers', 'nfl-scores', 'gameday', 'wake', 'notify', 'chime', 'celebrate'] },
  'Transit Stop': { market: 'Government', screens: ['bar'], power: 'Solar + battery', features: ['clock', 'next-bus', 'approach', 'service-alert', 'last-bus', 'crowding', 'stop-weather', 'stop-id', 'bike-share'] },
  'Park Kiosk': { market: 'Government', screens: ['bar', 'panel'], power: 'Solar + battery', features: ['clock', 'weather-now', 'air', 'trail', 'closing', 'weather-safety', 'events', 'parking', 'pool', 'courts'] },
  'Storefront': { market: 'Commercial', screens: ['bar', 'panel'], power: 'Wall', features: ['open-sign', 'specials', 'happy-hour', 'wait', 'now-serving', 'order-ready', 'occupancy', 'social', 'clock', 'weather-now'] },
  'Sports Bar': { market: 'Commercial', screens: ['bar', 'panel'], power: 'Wall', features: ['nfl-scores', 'gameday', 'nfl-moments', 'nba', 'cfb', 'team-colours', 'happy-hour', 'specials', 'visualizers'] },
  'Funeral Home': { market: 'Commercial', screens: ['bar'], power: 'Wall', features: ['welcome', 'service', 'clock', 'date'] },
  'Streamer Desk': { market: 'Consumer', screens: ['bar', 'panel'], power: 'Wall', features: ['on-air', 'goal', 'follower', 'uptime', 'hype', 'visualizers'] },
};
const M = { model: null, showAll: false };
const blankModel = () => ({ name: 'New model', market: MARKETS[0], screens: ['bar', 'panel'], power: 'Wall', features: ['clock', 'date', 'weather-now'] });
function tierOf(app) { return store.get('tier:' + app.id, null) || { tier: app.tier, price: app.price || '' }; }
function modelSummary(m) {
  const apps = m.features.map(id => ARXI.apps.find(a => a.id === id)).filter(Boolean);
  let monthly = 0, quote = 0, free = 0, paid = 0;
  for(const a of apps) { const t = tierOf(a); if(t.tier === 'paid') { paid++; const mm = String(t.price).match(/\$(\d+(?:\.\d+)?)/); if(mm) monthly += +mm[1]; else quote++; } else free++; }
  return { apps, monthly, quote, free, paid };
}
function renderModel() {
  const p = $('pModel'); if(!M.model) M.model = store.get('model', null) || (() => { const n = Object.keys(MODEL_PRESETS)[0]; return n ? { ...MODEL_PRESETS[n], features: [...MODEL_PRESETS[n].features], screens: [...MODEL_PRESETS[n].screens], name: n } : blankModel(); })();
  const m = M.model, save = () => store.set('model', m); p.innerHTML = '';
  const presets = el('div', { class: 'chips', role: 'group', 'aria-label': 'Start from' }, el('span', { class: 'muted small', text: 'Start from' }),
    ...Object.keys(MODEL_PRESETS).map(n => el('button', { class: 'chipbtn' + (m.name === n ? ' on' : ''), text: n, on: { click: () => { M.model = { ...MODEL_PRESETS[n], features: [...MODEL_PRESETS[n].features], screens: [...MODEL_PRESETS[n].screens], name: n }; store.set('model', M.model); renderModel(); } } })),
    el('button', { class: 'chipbtn', text: 'Blank', on: { click: () => { M.model = blankModel(); store.set('model', M.model); renderModel(); } } }));
  const name = el('input', { type: 'text', id: 'mName', value: m.name, 'aria-label': 'Model name' }); name.oninput = () => { m.name = name.value; save(); sumBox(); };
  const market = el('div', { class: 'seg', role: 'group', 'aria-label': 'Market' }, ...MARKETS.map(k => el('button', { 'aria-pressed': String(m.market === k), text: k, on: { click: () => { m.market = k; save(); renderModel(); } } })));
  const scr = el('div', { class: 'checks' }, ...[['bar', 'ARXI Bar 44×11'], ['panel', 'Companion 32×16 (prototype)'], ['big', 'ARXI Panel 44×22']].map(([k, n]) => { const c = el('input', { type: 'checkbox', id: 'ms-' + k, checked: m.screens.includes(k) }); c.onchange = () => { m.screens = c.checked ? [...new Set([...m.screens, k])] : m.screens.filter(x => x !== k); save(); sumBox(); }; return el('label', { for: 'ms-' + k, class: 'check' }, c, document.createTextNode(n)); }));
  const power = el('select', { id: 'mPower' }, ...['Wall', 'Solar + battery', 'PoE'].map(v => el('option', { value: v, text: v, selected: m.power === v }))); power.onchange = () => { m.power = power.value; save(); sumBox(); };
  const all = el('input', { type: 'checkbox', id: 'mAll', checked: M.showAll }); all.onchange = () => { M.showAll = all.checked; renderModel(); };
  // features, grouped, filtered to the market
  const feats = el('div', { class: 'feats' });
  for(const g of [...new Set(ARXI.apps.map(a => a.group))]) {
    const apps = ARXI.apps.filter(a => a.group === g && (M.showAll || marketOk(a, m.market) || m.features.includes(a.id))); if(!apps.length) continue;
    const on = apps.filter(a => m.features.includes(a.id)).length;
    const d = el('details', { class: 'fgroup', open: on > 0 }, el('summary', { html: icon(GROUP_ICONS[g] || 'sparkles', 14) + `<span>${g}</span><span class="muted small">${on ? on + ' of ' : ''}${apps.length}</span>` }));
    for(const a of apps) {
      const t = tierOf(a), c = el('input', { type: 'checkbox', id: 'mf-' + a.id, checked: m.features.includes(a.id) });
      c.onchange = () => { m.features = c.checked ? [...m.features, a.id] : m.features.filter(x => x !== a.id); save(); sumBox(); d.querySelector('summary .small').textContent = `${apps.filter(x => m.features.includes(x.id)).length || ''}${apps.filter(x => m.features.includes(x.id)).length ? ' of ' : ''}${apps.length}`; };
      d.append(el('label', { class: 'feat', for: 'mf-' + a.id, title: a.blurb }, c, el('span', { class: 'fn', text: a.name }), el('span', { class: 'chip ' + t.tier, text: t.tier === 'paid' ? (t.price || 'paid') : t.tier })));
    }
    feats.append(d);
  }
  const sum = el('aside', { class: 'msum', id: 'mSum' });
  p.append(presets, el('div', { class: 'mgrid' },
    el('div', {}, el('div', { class: 'mrow' }, el('div', { class: 'f grow' }, el('label', { for: 'mName', text: 'Model name' }), name), el('div', { class: 'f' }, el('label', { text: 'Market' }), market)),
      el('div', { class: 'mrow' }, el('div', { class: 'f' }, el('label', { text: 'Screens' }), scr), el('div', { class: 'f' }, el('label', { for: 'mPower', text: 'Power' }), power)),
      el('div', { class: 'f', style: 'margin-top:12px' }, el('div', { class: 'fhead' }, el('label', { text: `Features for ${m.market.toLowerCase()} use` }), el('label', { class: 'check small', for: 'mAll' }, all, document.createTextNode('Show every app'))), feats)),
    sum));
  sumBox();
}
function sumBox() {
  const m = M.model, box = $('mSum'); if(!box) return; const s = modelSummary(m), saved = store.get('models', []);
  const scrNames = { bar: 'Bar 44×11', panel: 'Companion 32×16 (prototype)', big: 'Panel 44×22' };
  box.innerHTML = '';
  box.append(...[el('div', { class: 'mhead' }, el('span', { html: icon('box', 16) }), el('b', { text: m.name || 'Untitled' })),
    el('div', { class: 'mtags' }, el('span', { class: 'tagpill', text: m.market }), el('span', { class: 'tagpill', text: m.power }), ...m.screens.map(k => el('span', { class: 'tagpill', text: scrNames[k] }))),
    el('dl', { class: 'mstats' }, el('dt', { text: 'Features' }), el('dd', { text: String(s.apps.length) }), el('dt', { text: 'Free' }), el('dd', { text: String(s.free) }), el('dt', { text: 'Paid' }), el('dd', { text: String(s.paid) }),
      el('dt', { text: 'Monthly' }), el('dd', { text: (s.monthly ? '$' + s.monthly + '/mo' : '$0') + (s.quote ? ` + ${s.quote} quoted` : '') })),
    el('div', { class: 'mlist' }, ...s.apps.map(a => el('span', { text: a.name }))),
    el('div', { class: 'btns' }, el('button', { class: 'btn primary', id: 'reelBtn', html: icon(S.reel ? 'pause' : 'play', 14) + (S.reel ? ' Stop the reel' : ' Play this model'), on: { click: () => { S.reel ? reelStop() : reelStart(); sumBox(); } } }),
      el('select', { id: 'reelDwell', 'aria-label': 'Seconds per feature' }, ...[5, 8, 15].map(v => el('option', { value: v * 1000, text: v + ' s each', selected: (S.reelDwell || 8000) === v * 1000 })))),
    el('div', { class: 'small muted', id: 'reelNow', text: S.reel ? reelLabel() : 'Plays each feature on the screens above, in this model\'s room setup.' }),
    el('div', { class: 'btns' }, el('button', { class: 'btn', text: 'Save', on: { click: () => { const list = store.get('models', []).filter(x => x.name !== m.name); list.push(JSON.parse(JSON.stringify(m))); store.set('models', list); toast('Saved in this browser'); sumBox(); } } }),
      el('button', { class: 'btn', text: 'Copy JSON', on: { click: () => copyText(modelJSON(m)) } }), el('button', { class: 'btn', text: 'Download', on: { click: () => downloadText(modelJSON(m), (m.name || 'model').replace(/\W+/g, '-').toLowerCase() + '.json') } })),
    saved.length ? el('div', { class: 'f', style: 'margin-top:10px' }, el('label', { for: 'mSaved', text: 'Saved models' }), (() => { const s2 = el('select', { id: 'mSaved' }, el('option', { value: '', text: 'Open a saved model…' }), ...saved.map((x, i) => el('option', { value: i, text: x.name }))); s2.onchange = () => { if(s2.value !== '') { M.model = JSON.parse(JSON.stringify(saved[+s2.value])); store.set('model', M.model); renderModel(); } }; return s2; })()) : null].filter(Boolean));
  $('reelDwell').onchange = (e) => { S.reelDwell = +e.target.value; if(S.reel) S.reel.dwell = S.reelDwell; };
}
function modelJSON(m) { const s = modelSummary(m); return JSON.stringify({ name: m.name, market: m.market, power: m.power, screens: m.screens, monthly: s.monthly, quoted: s.quote,
  features: s.apps.map(a => { const t = tierOf(a); return { id: a.id, name: a.name, group: a.group, tier: t.tier, price: t.price || null, built: a.kind === 'firmware' }; }) }, null, 2); }
function downloadText(s, name) { try { const a = el('a', { href: URL.createObjectURL(new Blob([s], { type: 'application/json' })), download: name }); document.body.append(a); a.click(); a.remove(); } catch(e) { copyText(s); } }
// the reel: each chosen feature's first situation, a few seconds each, in the model's room
function reelStart() {
  const m = M.model, apps = modelSummary(m).apps; if(!apps.length) return toast('Pick some features first');
  const room = m.screens.includes('bar') && m.screens.includes('panel') ? 0 : m.screens.includes('panel') && !m.screens.includes('bar') ? 2 : 1;
  if(S.room !== room) { $('roomSel').value = String(room); $('roomSel').onchange({ target: $('roomSel') }); }
  S.reel = { apps, i: -1, dwell: S.reelDwell || 8000 }; reelNext(); S.playing = true; setPlayIcon();
}
function reelStop() { S.reel = null; const r = $('reelNow'); if(r) r.textContent = 'Stopped.'; }
function reelLabel() { const r = S.reel; return r ? `Playing ${r.i + 1} of ${r.apps.length}: ${r.apps[r.i].name}` : ''; }
function reelDue() { const r = S.reel; return r && (S.sim >= (S.sit.start || 0) + r.dwell || S.sim >= (S.sit.len || 30000) - STEP); }
function reelNext() {
  const r = S.reel; r.i = (r.i + 1) % r.apps.length; const app = r.apps[r.i], sit = app.situations[0];
  S.reelLoading = true; load(app, sit); S.reelLoading = false;
  const n = $('reelNow'); if(n) n.textContent = reelLabel();
}
