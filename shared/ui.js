// ===================================================================== ARXI Simulator: UI
const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for(const [k, v] of Object.entries(attrs)) { if(k === 'on') for(const [ev, fn] of Object.entries(v)) e.addEventListener(ev, fn); else if(k === 'text') e.textContent = v; else if(k === 'html') e.innerHTML = v; else if(v !== false && v != null) e.setAttribute(k, v === true ? '' : v); } for(const c of kids.flat()) if(c != null) e.append(c); return e; };
// Each section keeps its own saved state (builds, wizard, place, last app) so Home, Commercial and Government never mix.
const STORE_NS = 'arxi-sim:' + (typeof SEG !== 'undefined' && SEG ? SEG.id + ':' : '');
const store = { get(k, d) { try { const v = localStorage.getItem(STORE_NS + k); return v == null ? d : JSON.parse(v); } catch(e) { return d; } }, set(k, v) { try { localStorage.setItem(STORE_NS + k, JSON.stringify(v)); } catch(e) {} } };

const FRAME_SOURCES = ['Unknown', 'Setup', 'Boot intro', 'Smoke test', 'Presence test', 'Showcase', 'Sunrise', 'Off', 'Weather test', 'Week recap', 'Next week', 'Preview', 'Alert', 'Calendar alert', 'Sports moment', 'Game takeover', 'Chime', 'Scene', 'Sunset', 'Room empty', 'Clap view', 'Lyrics', 'Base mode'];
const SCREENS = ['Clock', 'Date', 'Next event', 'Weather', 'Scores', 'Moon', 'Air quality', 'Countdown', 'Timer', 'Next week games', 'Forecast', 'Day timeline', 'Sun arc', 'Ticker', 'Week ahead', 'Month'];
const LAYERS = ['Alert', 'Sports', 'Takeover', 'Chime', 'Scene', 'Sunset', 'Presence', 'Calendar', 'Clap'];
const GD_VIEWS = ['Next game', 'Live', 'Strip', 'Lyrics gaps', 'Lyrics', 'No data'];
const STYLES = ['Classic', 'Minimal', 'Noir', 'Terminal', 'Vibrant', 'Night', 'Carbon', 'Lounge'];
const SRC_COLORS = { 21: '#4a9eff', 22: '#6b7280', 11: '#a78bfa', 14: '#f97316', 15: '#ef4444', 12: '#facc15', 13: '#eab308', 17: '#22c55e', 18: '#fb7185', 6: '#fbbf24', 16: '#2dd4bf', 20: '#e879f9', 19: '#374151', 7: '#1f2937', 2: '#94a3b8', 5: '#60a5fa', 8: '#38bdf8' };
const VIEW_COLORS = ['#f97316', '#ef4444', '#4a9eff', '#e879f9', '#6b7280', '#374151', '#1f2937', '#dc2626', '#38bdf8', '#0ea5e9', '#a3a3a3', '#fbbf24', '#9ca3af', '#22c55e', '#84cc16', '#a78bfa', '#2dd4bf'];
const STEP = 33; // the node renders a frame every 33 ms

const S = { engines: [], fonts: null, app: null, sit: null, work: null, sim: 0, playing: true, speed: 1, hist: [], last: null, fired: 0, actions: [],
  dev: 'both', finish: 'black', exact: false, grid: false, diff: false, diffStats: null, tab: 'tSit', ctlTab: 'Room & weather', hover: null, gfx: {} };

// ------------------------------------------------------------------ boot
// The loading screen: the Pixel Eel swims, charges and strikes on both screens while the firmware loads.
function loadingEel() {
  const gb = new Gfx(BAR_W, BAR_H, null), gp = new Gfx(PAN_W, PAN_H, null), t0 = performance.now();
  let done = false, ready = false, skip = false;
  const tick = () => {
    if(done) return;
    const ms = performance.now() - t0, r = EEL.frame(gb, ms); EEL.frame(gp, ms);
    paint($('barCv'), off.bar, gb.px_, BAR_W, BAR_H); paintPanel($('panCv'), gp.px_); setGlow(r.glow, r.accent);
    $('now').innerHTML = ready ? '<span class="tag">Strike</span> firmware loaded, handing over…' : (r.phase === 'charge' ? '<span class="tag">Charging</span> loading your ARXIv2 firmware…' : '<span class="tag">Swimming in</span> loading your ARXIv2 firmware…');
    if(ready && (skip || ms > 3900)) { done = true; setGlow(0); finish(); return; } // let it reach the strike before handing over
    requestAnimationFrame(tick);
  };
  let finish = () => {};
  $('devices').addEventListener('click', () => { skip = true; }, { once: true });
  requestAnimationFrame(tick);
  return { ready: () => new Promise(res => { ready = true; finish = res; }) };
}
function paintIcons() { document.querySelectorAll('[data-ic]').forEach(e => { if(e._ic) return; e._ic = 1; e.insertAdjacentHTML('afterbegin', icon(e.dataset.ic, e.closest('.transport') ? 18 : 15)); }); $('eelMark').innerHTML = eelMark(); }
function setPlayIcon() { const b = $('play'); b.innerHTML = icon(S.playing ? 'pause' : 'play', 18); b.setAttribute('aria-label', S.playing ? 'Pause' : 'Play'); }
paintIcons();
function setGlow(k, c = 0x3fd0ff) { document.querySelectorAll('.bezel').forEach(b => b.style.boxShadow = k > 0.05 ? `0 0 ${Math.round(46 * k)}px rgba(${c >> 16 & 255},${c >> 8 & 255},${c & 255},${(0.55 * k).toFixed(2)}), 0 18px 40px rgba(0,0,0,.5)` : ''); }
(async function boot() {
  const intro = loadingEel();
  const bytesOf = (id) => Uint8Array.from(atob(window.ARXI_WASM[id.replace('wasm-', '')]), c => c.charCodeAt(0)); // shared/firmware.js
  S.builds = [{ id: 'today', name: 'Today: your firmware', eng: await Engine.create(bytesOf('wasm-today'), 'Today') },
              { id: 'proposed', name: 'Proposed: audit fixes', eng: await Engine.create(bytesOf('wasm-proposed'), 'Proposed') }];
  S.primary = store.get('primary', 'proposed'); S.compareId = store.get('compareId', 'today'); S.compare = store.get('compare', true);
  S.room = store.get('room', 0); S.hub = 1;
  if(!S.builds.find(b => b.id === S.primary)) S.primary = 'proposed';
  if(S.compareId === S.primary || !S.builds.find(b => b.id === S.compareId)) S.compareId = S.builds.find(b => b.id !== S.primary).id;
  setEngines();
  await intro.ready();
  S.fonts = S.engines[0].fonts();
  S.gfx = { bar: new Gfx(BAR_W, BAR_H, S.fonts), pan: new Gfx(PAN_W, PAN_H, S.fonts) };
  $('buildTag').textContent = 'lab · ARXIv2 firmware';
  S.finish = store.get('finish', 'black'); S.dev = store.get('dev', 'both');
  bindChrome(); renderApps(); placeInit(); renderAppList(); wizardInit();
  const last = store.get('last', null); const app = ARXI.apps.find(a => a.id === (last && last.app)) || ARXI.apps[0];
  load(app, app.situations[Math.min((last && last.sit) || 0, app.situations.length - 1)]);
  requestAnimationFrame(loop);
})();

// ------------------------------------------------------------------ situations
function load(app, sit) {
  setGlow(0); if(!S.reelLoading && S.reel) { S.reel = null; const r = $('reelNow'); if(r) r.textContent = 'Stopped.'; }
  S.app = app; S.sit = sit; store.set('last', { app: app.id, sit: app.situations.indexOf(sit) });
  const w = sit.world || {}; S.work = { set: { ...(w.set || {}) }, text: { ...(w.text || {}) }, lyrics: w.lyrics || [], epoch: w.epoch || SAT(19, 42) };
  S.actions = [...(sit.actions || [])].sort((a, b) => a.at - b.at);
  $('seek').max = sit.len || 30000;
  document.querySelectorAll('.sits button').forEach(b => b.setAttribute('aria-current', b._sit === sit ? 'true' : 'false'));
  document.querySelectorAll('.app').forEach(d => { d.open = d._app === app; }); document.querySelectorAll('.group').forEach(g => { g.open = [...g.querySelectorAll('.app')].some(d => d._app === app); });
  restart(); if(sit.start) seek(sit.start);
  renderSitPane(); renderControls(); renderInspect(); if(S.tab === 'tSheet') renderSheet();
  applyDeviceVisibility();
}
function isFirmware() { return S.app && S.app.kind === 'firmware'; }
function build(id) { return S.builds.find(b => b.id === id); }
function setEngines() {
  const a = build(S.primary), b = build(S.compareId);
  S.engines = S.compare && b && b !== a ? [a.eng, b.eng] : [a.eng];
  S.diff = false;
}
function refreshBuildUI() {
  const sel = $('buildSel'); sel.innerHTML = '';
  for(const b of S.builds) sel.append(el('option', { value: b.id, text: b.name, selected: b.id === S.primary }));
  $('roomSel').value = String(S.room); if($('mountSel')) $('mountSel').value = String(S.room === 3 ? 0 : S.room);
  $('cmpBtn').setAttribute('aria-pressed', S.engines.length > 1);
}
const ROOM_ROLES = [['leads', 'supports'], ['alone', ''], ['', 'alone'], ['supports', 'leads']];
function applyWorld(e) {
  e.init();
  e.set('EPOCH', S.work.epoch);
  for(const [k, v] of Object.entries(S.work.set)) e.set(k, v);
  for(const [k, v] of Object.entries(S.work.text)) e.text(k, v);
  e.lyrics(S.work.lyrics);
  e.set('ROOM', S.room); e.set('HUB', S.hub);
}
function restart() {
  S.sim = 0; S.fired = 0; S.hist = []; S.last = null; S.diffStats = { frames: 0, diffFrames: 0, first: -1, lastCount: 0 };
  if(isFirmware()) for(const e of S.engines) applyWorld(e);
  stepOnce(true);
}
function seek(ms) { const was = S.playing; restart(); while(S.sim + STEP <= ms) stepOnce(); S.playing = was; draw(); }

function fire(e, a, now) {
  if(a.set) for(const [k, v] of Object.entries(a.set)) e.set(k, v);
  if(a.text) for(const [k, v] of Object.entries(a.text)) e.text(k, v);
  if(a.do === 'bar') e.barAction(a.a, a.p1, a.p2, now, a.text || '');
  if(a.do === 'pan') e.panAction(a.a, a.p1, now);
}
function sound(t) {
  const mode = S.work.sound || 'auto', music = mode === 'music' || mode === 'party' || (mode === 'auto' && (S.work.set.MUSIC_PLAYING || 0));
  const band = new Array(16).fill(0); let level = 6;
  if(music) {
    const bpm = mode === 'party' ? 128 : 118, ph = (t / (60000 / bpm)) % 1, kick = Math.exp(-ph * 7), gain = mode === 'party' ? 1.15 : 0.85;
    for(let i = 0; i < 16; i++) { const n = Math.sin(t / 97 + i * 1.7) * 0.5 + Math.sin(t / 211 + i * 0.6) * 0.5; band[i] = Math.max(0, Math.min(255, (i < 4 ? 70 + 170 * kick : 40 + 90 * (0.5 + 0.5 * n) * (1 - i / 22)) * gain)); }
    level = Math.min(255, Math.round(band.reduce((a, b) => a + b, 0) / 16 * 1.1));
  } else if(mode === 'clap') { const ph = t % 2500; level = ph < 120 ? 240 : 8; for(let i = 0; i < 16; i++) band[i] = level > 100 ? 200 - i * 6 : 4; }
  return { band, level, music };
}
function stepOnce(first) {
  const t = S.sim;
  if(isFirmware()) {
    while(S.fired < S.actions.length && S.actions[S.fired].at <= t) { for(const e of S.engines) fire(e, S.actions[S.fired], t); S.fired++; }
    for(const r of S.sit.ramps || []) if(t >= r.at) { const k = Math.min(1, (t - r.at) / r.over); for(const e of S.engines) e.set(r.key, Math.round(r.from + (r.to - r.from) * k)); }
    const snd = sound(t); let res = null;
    S.engines.forEach((e, i) => { const r = e.frame(t, snd); if(!i) res = r; });
    S.last = res; S.hist.push([t, res.src, res.view, res.scr]); if(S.hist.length > 4000) S.hist.splice(0, 1000);
    if(S.engines.length > 1) compareFrame(t);
  } else {
    const d = S.sit.draw; S.gfx.bar.clear(0); S.gfx.pan.clear(0);
    try { const r = d(S.gfx.bar, t, 'bar'); d(S.gfx.pan, t, 'panel'); setGlow(r && r.glow || 0, r && r.accent); S.last = { concept: true }; } catch(err) { S.last = { error: String(err) }; }
  }
  if(!first) S.sim += STEP;
}

// ------------------------------------------------------------------ main loop
let lastTs = 0, acc = 0, uiTick = 0;
function loop(ts) {
  const dt = Math.min(250, ts - (lastTs || ts)); lastTs = ts;
  if(S.playing) {
    acc += dt * S.speed; let n = 0;
    while(acc >= STEP && n < 80) { stepOnce(); acc -= STEP; n++; if(S.reel && reelDue()) { reelNext(); acc = 0; break; } if(S.sim >= (S.sit.len || 30000)) { restart(); acc = 0; break; } }
    if(n) draw();
  }
  if(++uiTick % 6 === 0) refreshLive();
  requestAnimationFrame(loop);
}

// ------------------------------------------------------------------ drawing the screens
const GAMMA = Array.from({ length: 256 }, (_, v) => Math.round(255 * Math.pow(v / 255, 0.72)));
const off = { bar: document.createElement('canvas'), pan: document.createElement('canvas') };
off.bar.width = BAR_W; off.bar.height = BAR_H; off.pan.width = PAN_W; off.pan.height = PAN_H;
function currentPixels() {
  if(!isFirmware()) return { bar: S.gfx.bar.px_, pan: S.gfx.pan.px_ };
  const A = S.engines[0], bar = A.barPixels(), pan = A.panPixels();
  if(S.engines.length > 1 && S.diff) {
    const B = S.engines[1], b2 = B.barPixels(), p2 = B.panPixels();
    const mark = (a, b) => { const o = new Uint8Array(a.length); for(let i = 0; i < a.length; i += 3) { const same = a[i] === b[i] && a[i + 1] === b[i + 1] && a[i + 2] === b[i + 2]; if(same) { o[i] = a[i] >> 2; o[i + 1] = a[i + 1] >> 2; o[i + 2] = a[i + 2] >> 2; } else { o[i] = 255; o[i + 1] = 0; o[i + 2] = 200; } } return o; };
    return { bar: mark(bar, b2), pan: mark(pan, p2) };
  }
  return { bar, pan };
}
// The ARXI Panel ships at 44 x 22 LEDs (13 x 7 in). The prototype renders 32 x 16; Build mode (what buyers see) maps
// each frame onto the production 44 x 22 grid, the Lab shows the prototype's own pixels.
const PANEL_W = 44, PANEL_H = 22; off.pan44 = document.createElement('canvas'); off.pan44.width = PANEL_W; off.pan44.height = PANEL_H;
const _p44 = new Uint8Array(PANEL_W * PANEL_H * 3);
function toPanel44(px) { for(let j = 0; j < PANEL_H; j++) { const sy = Math.min(PAN_H - 1, Math.floor((j + 0.5) * PAN_H / PANEL_H)); for(let i = 0; i < PANEL_W; i++) { const sx = Math.min(PAN_W - 1, Math.floor((i + 0.5) * PAN_W / PANEL_W)), a = (sy * PAN_W + sx) * 3, b = (j * PANEL_W + i) * 3; _p44[b] = px[a]; _p44[b + 1] = px[a + 1]; _p44[b + 2] = px[a + 2]; } } return _p44; }
function paintPanel(cv, px) { paint(cv, off.pan, px, PAN_W, PAN_H); }
function paint(cv, offc, px, w, h) {
  const ctx = cv.getContext('2d'), oc = offc.getContext('2d'), img = oc.createImageData(w, h);
  for(let i = 0, j = 0; i < w * h; i++, j += 3) { const g = S.exact ? (v => v) : (v => GAMMA[v]); img.data[i * 4] = g(px[j]); img.data[i * 4 + 1] = g(px[j + 1]); img.data[i * 4 + 2] = g(px[j + 2]); img.data[i * 4 + 3] = 255; }
  oc.putImageData(img, 0, 0);
  const cell = cv.width / w; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, cv.width, cv.height);
  if(S.exact) {
    ctx.imageSmoothingEnabled = false; ctx.drawImage(offc, 0, 0, cv.width, cv.height);
    ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for(let x = 1; x < w; x++) { ctx.moveTo(x * cell, 0); ctx.lineTo(x * cell, cv.height); } for(let y = 1; y < h; y++) { ctx.moveTo(0, y * cell); ctx.lineTo(cv.width, y * cell); } ctx.stroke();
  } else { // behind a diffuser: soft cells plus a glow
    ctx.imageSmoothingEnabled = false; ctx.drawImage(offc, 0, 0, cv.width, cv.height);
    ctx.globalCompositeOperation = 'lighter'; ctx.filter = `blur(${cell * 0.55}px)`; ctx.globalAlpha = 0.85; ctx.drawImage(offc, 0, 0, cv.width, cv.height);
    ctx.filter = 'none'; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1; ctx.beginPath();
    for(let x = 1; x < w; x++) { ctx.moveTo(x * cell, 0); ctx.lineTo(x * cell, cv.height); } for(let y = 1; y < h; y++) { ctx.moveTo(0, y * cell); ctx.lineTo(cv.width, y * cell); } ctx.stroke();
  }
  if(S.hover && S.hover.cv === cv) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(S.hover.x * cell + 1, S.hover.y * cell + 1, cell - 2, cell - 2); }
}
function draw() {
  const px = currentPixels(); S.px = px;
  paint($('barCv'), off.bar, px.bar, BAR_W, BAR_H); paintPanel($('panCv'), px.pan);
  if(isFirmware() && S.engines.length > 1 && !$('devicesB').hidden) { const B = S.engines[1]; paint($('barCvB'), off.bar, B.barPixels(), BAR_W, BAR_H); paintPanel($('panCvB'), B.panPixels()); }
  $('clock').textContent = (S.sim / 1000).toFixed(1) + ' s'; $('seek').value = S.sim;
  $('now').innerHTML = nowLine();
}
function wallTime() { const ep = (S.engines[0] && isFirmware()) ? S.work.epoch + Math.floor(S.sim / 1000) : S.work.epoch; const d = new Date(ep * 1000); return d.toLocaleString('en-US', { timeZone: 'UTC', weekday: 'short', hour: 'numeric', minute: '2-digit' }); }
function barWhat(r) {
  if(!r) return '';
  let s = FRAME_SOURCES[r.src] || '?';
  if(r.src === 21) s = (S.work.set.MUSIC_PLAYING ? 'Lyrics' : 'Idle · ' + SCREENS[r.scr]);
  if(r.src === 11) s = 'Preview · ' + SCREENS[r.scr];
  if(r.src === 15 && S.work.set.GAMEDAY) s = 'Game Day · ' + (GD_VIEWS[r.gdv] || '');
  return s;
}
function nowLine() {
  const r = S.last; if(!r) return '';
  if(r.error) return `<span class="tag">Error</span> ${r.error.replace(/</g, '&lt;')}`;
  if(r.concept) return `<span class="tag kind">Concept</span> ${S.app.name} · ${S.sit.name}`;
  const A = S.engines[0]; const art = r.view === 3 && r.art >= 0 ? ' · ' + A.artName(r.art) : '';
  const room = ['', ' · Bar alone', ' · companion alone', ' · swapped'][S.room];
  return `${wallTime()}${room} &nbsp; <span class="tag">Bar</span> ${barWhat(r)} &nbsp; <span class="tag">Panel</span> ${A.viewName(r.view)}${art}`;
}

// ------------------------------------------------------------------ chrome
function bindChrome() {
  const seg = (ids, key, val, after) => ids.forEach(([id, v]) => { $(id).onclick = () => { S[key] = v; store.set(key, v); ids.forEach(([i, vv]) => $(i).setAttribute('aria-pressed', vv === v)); after && after(); }; $(id).setAttribute('aria-pressed', S[key] === v); });
  refreshBuildUI();
  $('buildSel').onchange = (e) => { S.primary = e.target.value; if(S.compareId === S.primary) S.compareId = S.builds.find(b => b.id !== S.primary).id; store.set('primary', S.primary); store.set('compareId', S.compareId); setEngines(); refreshBuildUI(); seek(S.sim); renderInspect(); if(S.tab === 'tBuild') renderBuilds(); applyDeviceVisibility(); };
  $('roomSel').onchange = (e) => { S.room = +e.target.value; store.set('room', S.room); refreshBuildUI(); seek(S.sim); applyDeviceVisibility(); renderControls(); };
  $('cmpBtn').onclick = () => { S.compare = !(S.engines.length > 1); store.set('compare', S.compare); setEngines(); refreshBuildUI(); seek(S.sim); applyDeviceVisibility(); if(S.tab === 'tBuild') renderBuilds(); };
  seg([['fnBlack', 'black'], ['fnWhite', 'white']], 'finish', S.finish, applyDeviceVisibility);
  $('play').onclick = () => { S.playing = !S.playing; setPlayIcon(); };
  $('stepF').onclick = () => { pause(); stepOnce(); draw(); refreshLive(true); };
  $('stepB').onclick = () => { pause(); seek(Math.max(0, S.sim - 2 * STEP)); stepOnce(); draw(); refreshLive(true); };
  $('speed').onchange = (e) => S.speed = +e.target.value;
  $('restart').onclick = () => { restart(); draw(); };
  $('seek').oninput = (e) => { pause(); seek(+e.target.value); refreshLive(true); };
  ['tSit', 'tCtl', 'tIns', 'tSheet', 'tFit', 'tModel', 'tBuild'].forEach(id => $(id).onclick = () => showTab(id));
  for(const cv of [$('barCv'), $('panCv')]) {
    cv.addEventListener('mousemove', (e) => { const r = cv.getBoundingClientRect(), w = cv === $('barCv') ? BAR_W : PAN_W, h = cv === $('barCv') ? BAR_H : PAN_H;
      S.hover = { cv, x: Math.min(w - 1, Math.floor((e.clientX - r.left) / r.width * w)), y: Math.min(h - 1, Math.floor((e.clientY - r.top) / r.height * h)) }; if(!S.playing) draw(); refreshLive(true); });
    cv.addEventListener('mouseleave', () => { S.hover = null; if(!S.playing) draw(); });
  }
  document.addEventListener('keydown', (e) => { if(e.target.matches('input,select,textarea')) return; if(e.key === ' ') { e.preventDefault(); $('play').click(); } if(e.key === 'ArrowRight') $('stepF').click(); if(e.key === 'ArrowLeft') $('stepB').click(); });
}
function pause() { S.playing = false; setPlayIcon(); }
function showTab(id) {
  S.tab = id; ['tSit', 'tCtl', 'tIns', 'tSheet', 'tFit', 'tModel', 'tBuild'].forEach(t => { $(t).setAttribute('aria-selected', t === id); $('p' + t.slice(1)).hidden = t !== id; });
  if(id === 'tSheet') renderSheet(); if(id === 'tIns') renderInspect(); if(id === 'tBuild') renderBuilds(); if(id === 'tFit') renderFit(); if(id === 'tModel') renderModel();
}
function applyDeviceVisibility() {
  const devs = S.app ? S.app.devices : ['bar', 'panel'];
  const fw = isFirmware(), showBar = devs.includes('bar') && S.room !== 2, showPan = devs.includes('panel') && S.room !== 1; // the room's screens, for every app
  $('barDev').hidden = !showBar; $('panDev').hidden = !showPan;
  if(!showBar && !showPan) $('barDev').hidden = false;
  const roles = fw ? ROOM_ROLES[S.room] : ['', ''];
  $('barLbl').innerHTML = `<b>ARXI Bar</b> · 44×11${roles[0] ? ' · ' + roles[0] : ''}`; $('panLbl').innerHTML = S.mode === 'build' ? `<b>ARXI Panel</b> · 44×22` : `<b>ARXI Panel</b> · 44×22${S.engines[0] && S.engines[0].pw !== 44 ? ' (32×16 build, scaled)' : ''}${roles[1] ? ' · ' + roles[1] : ''}`;
  const two = fw && S.engines.length > 1;
  $('devicesB').hidden = !two; $('rowA').hidden = !two; $('rowB').hidden = !two;
  $('barDevB').hidden = $('barDev').hidden; $('panDevB').hidden = $('panDev').hidden;
  if(two) { $('rowA').innerHTML = `<b>●</b> ${S.engines[0].label}`; $('rowB').innerHTML = `<b>○</b> ${S.engines[1].label}`; }
  for(const id of ['devices', 'devicesB']) $(id).className = 'devices ' + (S.finish === 'white' ? 'white' : '');
  draw();
}

// ------------------------------------------------------------------ app library
function tierChip(app) {
  const t = store.get('tier:' + app.id, null) || { tier: app.tier, price: app.price || '' };
  const lbl = t.tier === 'paid' ? (t.price ? 'Paid · ' + t.price : 'Paid') : t.tier === 'internal' ? 'Internal' : 'Free';
  return el('span', { class: 'chip ' + t.tier, text: lbl });
}
function appMatches(app, q, tier) {
  const t = (store.get('tier:' + app.id, null) || { tier: app.tier }).tier;
  if(tier !== 'all' && t !== tier) return false;
  if(!marketOk(app)) return false;
  if(typeof appForPlace === 'function' && typeof P !== 'undefined' && !appForPlace(app, P.place)) return false; // the place locks out features that don't belong there
  if(!q) return true; q = q.toLowerCase();
  return [app.name, app.group, app.audience, app.blurb, ...app.situations.map(s => s.name)].join(' ').toLowerCase().includes(q);
}
function renderApps() {
  const box = $('apps');
  if(!box._built) {
    box._built = true;
    const q = el('input', { type: 'search', id: 'appSearch', placeholder: `Search ${ARXI.apps.length} apps`, 'aria-label': 'Search apps' });
    const tf = el('select', { id: 'tierFilter', 'aria-label': 'Filter by tier' }, ...[['all', 'All'], ['free', 'Free'], ['paid', 'Paid'], ['internal', 'Internal']].map(([v, n]) => el('option', { value: v, text: n })));
    q.oninput = tf.onchange = () => renderAppList();
    box.before(el('div', { class: 'libtools' }, q, tf));
    S.market = SEG ? SEG.market : store.get('market', 'all');
    const mk = el('div', { class: 'mkts', role: 'group', 'aria-label': 'Who it is for' }, ...[['all', 'All', 'grid'], ['Consumer', 'Consumer', 'home'], ['Commercial', 'Commercial', 'store'], ['Government', 'Government', 'bus']].map(([v, n, ic]) => el('button', { 'aria-pressed': String(S.market === v), html: icon(ic, 13) + n, on: { click: (e) => { S.market = v; store.set('market', v); mk.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', b === e.currentTarget)); renderAppList(); } } })));
    if(!SEG) box.before(mk); // a section page is locked to its market, so no market chips
  }
  renderAppList();
}
function renderAppList() {
  const box = $('apps'); box.innerHTML = '';
  const q = $('appSearch').value.trim(), tier = $('tierFilter').value, searching = !!q || tier !== 'all' || S.market !== 'all';
  { let n = $('libNote'); if(!n) { n = el('div', { id: 'libNote', class: 'libnote' }); box.before(n); } const locked = typeof P !== 'undefined' && P.place && P.place !== 'bench'; n.hidden = !locked; if(locked) n.textContent = `Showing what fits a ${placeName(P.place).toLowerCase()}. Pick Workbench under Place to see every app.`; }
  const groups = [...new Set(ARXI.apps.map(a => a.group))];
  for(const g of groups) {
    const apps = ARXI.apps.filter(a => a.group === g && appMatches(a, q, tier)); if(!apps.length) continue;
    const concept = apps.every(a => a.kind === 'concept');
    const sec = el('details', { class: 'group', open: searching || (S.app && S.app.group === g) });
    sec.append(el('summary', {}, el('span', { class: 'gname', html: icon(GROUP_ICONS[g] || 'sparkles', 15) + `<span>${g}</span>` }), el('span', { class: 'gmeta', text: `${apps.length}${concept ? ' · concept' : ''}` })));
    for(const app of apps) {
      const d = el('details', { class: 'app', open: S.app === app }); d._app = app;
      d.addEventListener('toggle', () => { if(d.open) document.querySelectorAll('.app').forEach(o => { if(o !== d) o.open = false; }); });
      const sum = el('summary', {}, el('span', { class: 'nm', text: app.name }), tierChip(app), el('span', { class: 'meta', text: `${app.situations.length} situation${app.situations.length > 1 ? 's' : ''} · ${app.devices.map(x => x === 'bar' ? 'Bar' : 'Panel').join(' + ')}${app.kind === 'concept' ? ' · JS prototype' : ''}` }));
      d.append(sum);
      const info = el('div', { class: 'appinfo' }, el('div', { text: app.blurb + (app.audience !== 'Home' ? ` For: ${app.audience}.` : '') }), el('div', { class: 'small muted', text: 'Markets: ' + marketsOf(app).join(', ') + (typeof PACKS !== 'undefined' ? (() => { const lead = MERGED[app.id], pk = PACKS.filter(p => p.apps.includes(app.id) || p.apps.includes(lead) || (p.apps.includes('seasons') && SEASON_IDS.includes(app.id))).map(p => p.name); return (pk.length ? ' · Pack: ' + [...new Set(pk)].join(', ') : '') + (lead ? ' · Part of ' + (MERGED_NAME[lead] || lead) : lead === null ? ' · A sense, not a feature' : ''); })() : '') }));
      const plan = el('details', {}, el('summary', { text: 'Plan & pricing' }));
      const cur = store.get('tier:' + app.id, null) || { tier: app.tier, price: app.price || '' };
      const sel = el('select', { id: 'tier-' + app.id, 'aria-label': 'Tier' }, ...['free', 'paid', 'internal'].map(v => el('option', { value: v, text: v[0].toUpperCase() + v.slice(1), selected: cur.tier === v })));
      const price = el('input', { id: 'price-' + app.id, type: 'text', value: cur.price, placeholder: 'price', 'aria-label': 'Price' });
      const save = () => { store.set('tier:' + app.id, { tier: sel.value, price: price.value }); sum.replaceChild(tierChip(app), sum.children[1]); };
      sel.onchange = save; price.onchange = save;
      plan.append(el('div', { class: 'row' }, sel, price), el('div', { class: 'row', text: 'Saved in this browser only, for planning.' }));
      info.append(plan); d.append(info);
      const list = el('div', { class: 'sits' });
      for(const sit of app.situations) { const b = el('button', { text: sit.name, 'aria-current': S.sit === sit ? 'true' : 'false', on: { click: () => load(app, sit) } }); b._sit = sit; list.append(b); }
      d.append(list); sec.append(d);
    }
    box.append(sec);
  }
  if(!box.children.length) box.append(el('p', { class: 'hint', style: 'padding:12px 14px', text: 'No apps match. Clear the search, the tier filter or the market.' }));
}

// ------------------------------------------------------------------ situation pane
function fmtAction(a) {
  const n = (x) => x;
  if(a.do === 'bar') return ({ 1: `Preview screen: ${SCREENS[a.p1]}`, 2: `Sports moment type ${a.p1}${a.p2 & 255 ? ' (home)' : ' (away)'}`, 3: `Notification "${a.text}"`, 4: 'Chime', 5: 'Start showcase', 6: 'Boot intro', 7: `Weather test ${a.p1}`, 8: 'Sunset moment', 9: `Lyric icon: ${S.engines[0].iconName(a.p1)}`, 10: `Clap view ${a.p1}`, 13: 'Week recap', 16: 'Morning briefing' })[a.a] || `Bar action ${a.a}`;
  if(a.do === 'pan') return ({ 1: `Panel icon: ${S.engines[0].iconName(a.p1)}`, 2: a.p1 === 2 ? 'Panel: day in 30 s' : 'Panel: sunset moment' })[a.a] || `Panel action ${a.a}`;
  if(a.set) return Object.entries(a.set).map(([k, v]) => k === 'STYLE' ? `Style → ${STYLES[v]}` : k === 'ART_FX' ? `Panel piece → ${S.engines[0].artName(v)}` : `${k} → ${v}`).join(', ');
  return '';
}
function renderSitPane() {
  const p = $('pSit'); p.innerHTML = '';
  p.append(el('h3', { class: 'sit-title', text: S.sit.name }), el('p', { class: 'sit-note', text: S.sit.note || '' }));
  const beats = el('div', { class: 'beats', id: 'beats' });
  const acts = S.actions.length > 14 ? S.actions.slice(0, 12) : S.actions;
  acts.forEach((a, i) => { const d = el('div', { text: `${(a.at / 1000).toFixed(1).padStart(5)} s  ${fmtAction(a)}` }); d._at = a.at; beats.append(d); });
  if(S.actions.length > 14) beats.append(el('div', { text: `… ${S.actions.length - 12} more` }));
  for(const r of S.sit.ramps || []) beats.append(el('div', { text: `${(r.at / 1000).toFixed(1).padStart(5)} s  ${r.key} ${r.from} → ${r.to} over ${r.over / 1000} s` }));
  if(!S.actions.length && !(S.sit.ramps || []).length && isFirmware()) beats.append(el('div', { text: 'No scripted beats: the firmware runs on its own from this world state.' }));
  p.append(beats);
  if(!isFirmware()) {
    p.append(el('p', { class: 'hint', style: 'margin-top:14px', text: 'Concept app: drawn in JavaScript with the firmware\'s 3×5 and 5×7 fonts at the real resolutions, so the picture matches what a C++ port would draw. Its source is below for porting.' }));
    p.append(el('details', {}, el('summary', { text: 'Show draw() source', style: 'cursor:pointer' }), el('pre', { class: 'code', text: S.sit.draw.toString() })));
  }
}
function refreshLive(force) {
  if(typeof placeUpdate === 'function') placeUpdate();
  const b = $('beats'); if(b) for(const d of b.children) if(d._at != null) d.className = d._at <= S.sim ? 'done' : '';
  if(S.tab === 'tIns' || force) updateInspect();
}

// ------------------------------------------------------------------ controls
const O = (arr) => arr.map((t, i) => [i, t]);
const CONTROLS = {
  Look: [['UNIVERSAL', 'Universal: pictures and numbers, no English (Proposed)', 'toggle'], ['STYLE', 'Screen style', 'select', O(STYLES)], ['VIBE', 'Vibe', 'select', O(['Calm', 'Balanced', 'Party'])], ['TRANSITION', 'Transition', 'select', O(['None', 'Fade', 'Slide', 'Wipe'])],
    ['COLOUR_MODE', 'Screen colours', 'select', [[0, 'From the style'], [1, 'My colours']]], ['C1', 'Colour 1', 'color'], ['C2', 'Colour 2', 'color'], ['TEXT_COLOR', 'Text colour (Classic / Minimal)', 'color'],
    ['VOLT', 'Volt the mascot', 'toggle'], ['USE24', '24-hour clock', 'toggle'], ['SHOW_SECONDS', 'Show seconds', 'toggle'], ['BRIGHTNESS', 'Panel brightness', 'range', 1, 255]],
  'Room & weather': [['@room', 'Room setup', 'room'], ['@hub', 'Hub online', 'hub'], ['@time', 'Time of day', 'time'], ['WX_ON', 'Weather on', 'toggle'], ['WX_CODE', 'Condition', 'select', [[0, 'Clear'], [1, 'Mostly clear'], [2, 'Partly cloudy'], [3, 'Overcast'], [45, 'Fog'], [51, 'Drizzle'], [61, 'Rain'], [65, 'Heavy rain'], [71, 'Snow'], [95, 'Thunderstorm']]],
    ['WX_TEMP', 'Temperature °F', 'range', -10, 110], ['WX_HI', 'High °F', 'range', -10, 110], ['WX_LO', 'Low °F', 'range', -20, 100], ['WX_POP', 'Rain chance %', 'range', 0, 100], ['WX_WIND', 'Wind mph', 'range', 0, 60],
    ['WX_VSTYLE', 'Weather visuals', 'select', O(['Ambient', 'Dramatic', 'High contrast'])], ['AQI', 'Air quality index', 'range', 0, 300], ['@sound', 'Room sound', 'sound'], ['ROOM_DARK', 'Room is dark', 'toggle'], ['ROOM_LIGHT', 'Room light %', 'range', 0, 100], ['ROOM_HERE', 'Someone in the room', 'toggle']],
  Music: [['MUSIC_PLAYING', 'Playing', 'toggle'], ['@song', 'Song', 'song'], ['TITLE', 'Title', 'text'], ['ARTIST', 'Artist', 'text'], ['LYRIC_STYLE', 'Lyric style', 'select', O(['Wrap then scroll', 'Scroll only', 'Wrap only', 'Typewriter', 'Pictures only', 'Two rows, small'])],
    ['LYRIC_ICONS', 'Keyword pictures', 'toggle'], ['ART_FX', 'Panel piece', 'art'], ['PANEL_MODE', 'Panel mode', 'select', O(['Auto', 'Music', 'Sports'])], ['@restartSong', 'Restart song', 'button']],
  Sports: [['GAME_ON', 'Game in the feed', 'toggle'], ['GAMEDAY', 'Game Day mode', 'toggle'], ['TAKEOVER', 'Takeover the bar', 'toggle'], ['GAME_LEAGUE', 'League', 'select', O(['NFL', 'NBA', 'College football'])],
    ['AWAY', 'Away', 'text'], ['HOME', 'Home', 'text'], ['AWAY_SCORE', 'Away score', 'number'], ['HOME_SCORE', 'Home score', 'number'], ['GAME_STATE', 'State', 'select', O(['Pregame', 'Live', 'Final'])],
    ['GAME_STATUS', 'Status', 'select', O(['Normal', 'Halftime', 'End of period'])], ['GAME_PERIOD', 'Quarter', 'number'], ['CLOCK', 'Clock', 'text'], ['POSSESSION', 'Possession', 'select', O(['Unknown', 'Away', 'Home'])], ['DOWN', 'Down & distance', 'text'],
    ['BALL', 'Ball on (0 = away goal)', 'range', 0, 100], ['REDZONE', 'Red zone', 'toggle'], ['FAV', 'Your team', 'select', O(['None', 'Away', 'Home'])], ['NFL_LAYOUT', 'NFL layout', 'select', O(['Scoreboard', 'Scorebug'])],
    ['AWAY_C1', 'Away colour', 'color'], ['AWAY_C2', 'Away accent', 'color'], ['HOME_C1', 'Home colour', 'color'], ['HOME_C2', 'Home accent', 'color'], ['@moments', 'Moments', 'moments']],
  House: [['POWER', 'Display on', 'toggle'], ['SUN_ACTIVE', 'Sun ramp running', 'toggle'], ['SUN_RISE', 'Ramp', 'select', [[1, 'Wake up'], [0, 'Wind-down']]], ['SUN_RED', 'Red light look', 'toggle'], ['SUN_PROGRESS', 'Ramp progress ‰', 'range', 0, 1000],
    ['PRESENCE_OFF', 'Room empty (display off)', 'toggle'], ['SCENE_MODE', 'Scenes', 'select', O(['Off', 'Automatic holiday', 'Fixed holiday', 'Sports'])], ['HOLIDAY', 'Holiday', 'select', [[1, 'Christmas'], [2, 'Halloween'], [3, 'New Year'], [4, "Valentine's"], [5, "St Patrick's"], [6, 'July 4th'], [7, 'Thanksgiving']]],
    ['CAL_ON', 'Calendar', 'toggle'], ['CAL_TITLE', 'Event', 'text'], ['CAL_AT', 'Event starts (min after start)', 'number'], ['CD_ON', 'Countdown', 'toggle'], ['CD_LABEL', 'Countdown label', 'text'], ['CD_DAYS', 'Days away', 'number'],
    ['TIMER_ON', 'Timer', 'toggle'], ['TIMER_SECS', 'Timer seconds', 'number'], ['@startTimer', 'Start timer now', 'button']],
  Tests: [['@tests', '', 'tests']],
};
function curVal(k) { if(k in S.work.set) return S.work.set[k]; if(k in S.work.text) return S.work.text[k]; const A = S.engines[0]; return k in A.texts ? '' : A.defaults[k]; }
function setWorld(k, v, isText) {
  if(isText) { S.work.text[k] = v; for(const e of S.engines) e.text(k, v); } else { S.work.set[k] = v; for(const e of S.engines) e.set(k, v); }
  if(!S.playing) { stepOnceNoAdvance(); draw(); }
}
function stepOnceNoAdvance() { S.sim = Math.max(0, S.sim - STEP); stepOnce(); }
const hex = (v) => '#' + (v >>> 0 & 0xffffff).toString(16).padStart(6, '0');
function renderControls() {
  const p = $('pCtl'); p.innerHTML = '';
  if(!isFirmware()) { p.append(el('p', { class: 'hint', text: 'This is a concept app: it draws from its own little script, so there are no knobs to turn yet. Its draw() code is on the Situation tab, ready to port.' })); return; }
  const sub = el('div', { class: 'sub' });
  const SUB_IC = { Look: 'eye', 'Room & weather': 'cloud', Music: 'music', Sports: 'trophy', House: 'home', Tests: 'beaker' };
  for(const t of Object.keys(CONTROLS)) sub.append(el('button', { html: icon(SUB_IC[t] || 'sliders', 14) + `<span>${t}</span>`, 'aria-pressed': S.ctlTab === t, on: { click: () => { S.ctlTab = t; renderControls(); } } }));
  p.append(sub);
  const box = el('div', { class: 'fields' }); p.append(box);
  const A = S.engines[0];
  for(const [k, label, type, a, b] of CONTROLS[S.ctlTab]) {
    const id = 'c-' + k.replace('@', '');
    const f = el('div', { class: 'f' });
    if(type === 'toggle') { const i = el('input', { type: 'checkbox', id, checked: !!curVal(k) }); i.onchange = () => setWorld(k, i.checked ? 1 : 0); f.append(el('label', { class: 'tog', for: id }, i, label)); }
    else if(type === 'select') { const s = el('select', { id }, ...a.map(([v, t]) => el('option', { value: v, text: t, selected: +curVal(k) === v }))); s.onchange = () => setWorld(k, +s.value); f.append(el('label', { for: id, text: label }), s); }
    else if(type === 'range') { const v = el('span', { class: 'val', text: curVal(k) }); const i = el('input', { type: 'range', id, min: a, max: b, value: curVal(k) }); i.oninput = () => { v.textContent = i.value; setWorld(k, +i.value); }; f.append(el('label', { for: id }, label, v), i); }
    else if(type === 'number') { const i = el('input', { type: 'number', id, value: curVal(k) }); i.onchange = () => setWorld(k, +i.value); f.append(el('label', { for: id, text: label }), i); }
    else if(type === 'text') { const i = el('input', { type: 'text', id, value: curVal(k), maxlength: 60 }); i.onchange = () => setWorld(k, i.value, true); f.append(el('label', { for: id, text: label }), i); }
    else if(type === 'color') { const i = el('input', { type: 'color', id, value: hex(curVal(k)) }); i.oninput = () => setWorld(k, parseInt(i.value.slice(1), 16)); f.append(el('label', { for: id, text: label }), i); }
    else if(type === 'art') { const s = el('select', { id }, el('option', { value: -1, text: 'Automatic rotation' }), ...Array.from({ length: 29 }, (_, i) => i).filter(i => i !== 24 && i !== 25).map(i => el('option', { value: i, text: A.artName(i), selected: +curVal(k) === i }))); s.onchange = () => setWorld(k, +s.value); f.append(el('label', { for: id, text: label }), s); }
    else if(type === 'time') { const ep = S.work.epoch + Math.floor(S.sim / 1000), d = new Date(ep * 1000); const i = el('input', { type: 'range', id, min: 0, max: 1439, value: d.getUTCHours() * 60 + d.getUTCMinutes() }); const v = el('span', { class: 'val', text: d.toISOString().slice(11, 16) });
      i.oninput = () => { const mins = +i.value, day = ep - ep % 86400, target = day + mins * 60; S.work.epoch = target - Math.floor(S.sim / 1000); v.textContent = String(Math.floor(mins / 60)).padStart(2, '0') + ':' + String(mins % 60).padStart(2, '0'); for(const e of S.engines) e.set('EPOCH', S.work.epoch); if(!S.playing) { stepOnceNoAdvance(); draw(); } };
      f.append(el('label', { for: id }, label, v), i); }
    else if(type === 'room') { const s = el('select', { id }, ...['Bar + companion', 'Bar alone', 'Companion alone', 'Swapped: companion leads'].map((t, i) => el('option', { value: i, text: t, selected: S.room === i }))); s.onchange = () => { $('roomSel').value = s.value; $('roomSel').onchange({ target: s }); }; f.append(el('label', { for: id, text: label }), s); }
    else if(type === 'hub') { const i = el('input', { type: 'checkbox', id, checked: !!S.hub }); i.onchange = () => { S.hub = i.checked ? 1 : 0; for(const e of S.engines) e.set('HUB', S.hub); if(!S.playing) { stepOnceNoAdvance(); draw(); } }; f.append(el('label', { class: 'tog', for: id }, i, label + ' (off: the companion loses its data)')); }
    else if(type === 'sound') { const s = el('select', { id }, ...[['auto', 'Follows the music'], ['quiet', 'Quiet room'], ['music', 'Music playing'], ['party', 'Party (loud)'], ['clap', 'Claps every 2.5 s']].map(([v, t]) => el('option', { value: v, text: t, selected: (S.work.sound || 'auto') === v }))); s.onchange = () => { S.work.sound = s.value; }; f.append(el('label', { for: id, text: label }), s); }
    else if(type === 'song') { const s = el('select', { id }, el('option', { value: '', text: 'Pick a demo song…' }), ...Object.entries(SONGS).map(([k2, so]) => el('option', { value: k2, text: `${so.title} · ${so.artist}` })));
      s.onchange = () => { if(!s.value) return; const so = SONGS[s.value]; S.work.lyrics = so.lines; Object.assign(S.work.text, { TITLE: so.title, ARTIST: so.artist }); Object.assign(S.work.set, { MUSIC_PLAYING: 1, TRACK_POS: 0, TRACK_AT: S.sim, TRACK_DUR: so.dur }); for(const e of S.engines) { e.lyrics(so.lines); e.text('TITLE', so.title); e.text('ARTIST', so.artist); for(const kk of ['MUSIC_PLAYING', 'TRACK_POS', 'TRACK_AT', 'TRACK_DUR']) e.set(kk, S.work.set[kk]); } renderControls(); };
      f.append(el('label', { for: id, text: label }), s); }
    else if(type === 'button') { const act = { '@restartSong': () => { setWorld('TRACK_POS', 0); setWorld('TRACK_AT', S.sim); }, '@startTimer': () => { setWorld('TIMER_AT', S.sim); setWorld('TIMER_ON', 1); renderControls(); } }[k]; f.append(el('button', { class: 'btn', id, text: label, style: 'margin-top:18px', on: { click: act } })); }
    else if(type === 'moments') { f.style.gridColumn = '1 / -1'; f.append(el('label', { text: 'Fire a moment now (side = the team it is for)' }));
      const side = el('select', { id: 'momSide' }, el('option', { value: 0, text: 'Away' }), el('option', { value: 1, text: 'Home' }));
      const mk = (t, n, v = 0) => el('button', { class: 'btn', text: n, on: { click: () => doBar(2, t, (+side.value) | (v << 8)) } });
      f.append(el('div', { class: 'btns' }, side, mk(6, 'Touchdown', 6), mk(6, 'Field goal', 3), mk(6, '2 points', 2), mk(8, 'Red zone'), mk(9, 'Goal to go'), mk(10, 'Lead change'), mk(11, 'Tie game'), mk(4, 'Halftime'), mk(12, 'Two minutes'), mk(5, 'Overtime'), mk(1, 'Kickoff'), mk(7, 'Final'), mk(20, 'Run', 10), mk(21, 'Clutch', 1), mk(22, 'Upset watch', 5), mk(23, 'Upset', 5), mk(24, 'Three'))); }
    else if(type === 'tests') { f.style.gridColumn = '1 / -1';
      const scr = el('select', { id: 'tScreen' }, ...SCREENS.map((s, i) => el('option', { value: i, text: s })));
      const wx = el('select', { id: 'tWx' }, ...[[0, 'Clear'], [2, 'Partly cloudy'], [3, 'Cloudy'], [45, 'Fog'], [61, 'Rain'], [71, 'Snow'], [95, 'Storm']].map(([v, t]) => el('option', { value: v, text: t })));
      const icon = el('select', { id: 'tIcon' }, ...Array.from({ length: A.x.icon_count() }, (_, i) => el('option', { value: i + 1, text: A.iconName(i + 1) })));
      const msg = el('input', { type: 'text', id: 'tMsg', value: 'DINNER IS READY', maxlength: 48 });
      const row = (lbl, ...kids) => el('div', { class: 'f' }, el('label', { text: lbl }), el('div', { class: 'btns' }, ...kids));
      box.style.gridTemplateColumns = 'repeat(auto-fill, minmax(260px, 1fr))';
      box.append(row('Preview a HUD screen (15 s)', scr, el('button', { class: 'btn', text: 'Preview', on: { click: () => doBar(1, +scr.value, 15000) } })),
        row('Weather test scene', wx, el('button', { class: 'btn', text: 'Show', on: { click: () => doBar(7, +wx.value) } })),
        row('Lyric icon on both screens', icon, el('button', { class: 'btn', text: 'Show', on: { click: () => { doBar(9, +icon.value); doPan(1, +icon.value); } } })),
        row('Notification', msg, el('button', { class: 'btn', text: 'Send', on: { click: () => doBar(3, 0x50c8ff, 8000, msg.value.toUpperCase()) } })),
        row('Moments and reels', ...[['Sunset moment', () => { doBar(8); doPan(2, 1); }], ['Day in 30 s', () => doPan(2, 2)], ['Chime', () => doBar(4, 0)], ['Boot intro', () => doBar(6)], ['Showcase', () => doBar(5)], ['Fireworks', () => doBar(10, 6, 8000)], ['Starburst', () => doBar(10, 7, 8000)], ['Briefing', () => doBar(16)], ['Agenda', () => doBar(15)], ['Week recap', () => doBar(13)], ['Next week', () => doBar(14)]].map(([n, fn]) => el('button', { class: 'btn', text: n, on: { click: fn } }))),
        row('Clear', el('button', { class: 'btn primary', text: 'Stop all previews', on: { click: () => { doBar(11); doBar(7, -1); doBar(17); } } })));
      box.append(el('p', { class: 'hint', style: 'grid-column:1/-1', text: 'Buttons act now and are not saved into the situation; restarting the situation clears them.' }));
      continue; }
    box.append(f);
  }
}
function doBar(a, p1 = 0, p2 = 0, text = '') { for(const e of S.engines) e.barAction(a, p1, p2, S.sim, text); if(!S.playing) { stepOnceNoAdvance(); draw(); } }
function doPan(a, p1 = 0) { for(const e of S.engines) e.panAction(a, p1, S.sim); if(!S.playing) { stepOnceNoAdvance(); draw(); } }

// ------------------------------------------------------------------ inspect
function renderInspect() {
  const p = $('pIns'); p.innerHTML = '';
  p.append(el('dl', { class: 'kv', id: 'insKv' }));
  if(isFirmware()) {
    p.append(el('div', { class: 'f' }, el('label', { text: 'What drew each frame, last 60 s (top: bar, bottom: panel)' })), el('canvas', { id: 'timeline', width: 1200, height: 56 }), el('div', { class: 'legend', id: 'legend' }));
  }
  const exact = el('input', { type: 'checkbox', id: 'iExact', checked: S.exact }); exact.onchange = () => { S.exact = exact.checked; draw(); };
  p.append(el('div', { class: 'btns', style: 'align-items:center' },
    el('label', { class: 'tog', for: 'iExact', style: 'padding:0' }, exact, 'Exact pixels (no diffuser, no gamma)'),
    el('button', { class: 'btn', text: 'Copy bar frame (hex)', on: { click: () => copyFrame('bar') } }),
    el('button', { class: 'btn', text: 'Copy panel frame (hex)', on: { click: () => copyFrame('pan') } }),
    el('span', { class: 'hint', id: 'copyNote' })));
  p.append(el('p', { class: 'hint', style: 'margin-top:12px', text: 'Hover a screen to read one LED. Bar hex is row-major RRGGBB × 484, the same format as the node\'s /api/matrix/frame-live, so you can paste it next to a capture from the real device. Space plays and pauses; the arrow keys step one 33 ms frame.' }));
  updateInspect();
}
function updateInspect() {
  const kv = $('insKv'); if(!kv) return;
  const r = S.last || {}; const A = S.engines[0]; const rows = [];
  rows.push(['Time', `${(S.sim / 1000).toFixed(3)} s · frame ${Math.round(S.sim / STEP)} · ${wallTime()}`]);
  if(isFirmware() && r.src != null) {
    rows.push(['Bar source', `${FRAME_SOURCES[r.src]} (FrameSource ${r.src})${r.left ? ` · ${(r.left / 1000).toFixed(1)} s left` : ''}`]);
    rows.push(['HUD screen', `${SCREENS[r.scr]} (${r.scr})`]);
    if(S.work.set.GAMEDAY) rows.push(['Game Day view', GD_VIEWS[r.gdv] || '']);
    rows.push(['Panel view', `${A.viewName(r.view)}${r.view === 3 && r.art >= 0 ? ' · ' + A.artName(r.art) + ` (piece ${r.art})` : ''}`]);
  }
  if(S.hover && S.px) { const isBar = S.hover.cv === $('barCv'), w = isBar ? BAR_W : PAN_W, a = isBar ? S.px.bar : S.px.pan, i = (S.hover.y * w + S.hover.x) * 3;
    rows.push(['LED', `${isBar ? 'bar' : 'panel'} x ${S.hover.x}, y ${S.hover.y} · rgb(${a[i]}, ${a[i + 1]}, ${a[i + 2]}) · ${hex((a[i] << 16) | (a[i + 1] << 8) | a[i + 2]).toUpperCase()}`]); }
  kv.innerHTML = ''; for(const [k, v] of rows) kv.append(el('dt', { text: k }), el('dd', { text: v }));
  if(isFirmware() && r.src != null) { const lay = el('div', { class: 'layers' }, ...LAYERS.map((n, i) => el('span', { class: (r.wanting >> i) & 1 ? 'on' : '', text: n }))); kv.append(el('dt', { text: 'Layers asking' }), el('dd', {}, lay)); }
  drawTimeline();
}
function drawTimeline() {
  const cv = $('timeline'); if(!cv || !S.hist.length) return;
  const ctx = cv.getContext('2d'), W = cv.width, H = cv.height, end = S.sim, start = Math.max(0, end - 60000);
  ctx.clearRect(0, 0, W, H); const xs = (t) => (t - start) / 60000 * W; const seen = new Map();
  for(let i = 0; i < S.hist.length; i++) { const [t, src, view] = S.hist[i]; if(t < start) continue; const t2 = i + 1 < S.hist.length ? S.hist[i + 1][0] : t + STEP;
    ctx.fillStyle = SRC_COLORS[src] || '#888'; ctx.fillRect(xs(t), 4, Math.max(1, xs(t2) - xs(t)), H / 2 - 6); ctx.fillStyle = VIEW_COLORS[view] || '#888'; ctx.fillRect(xs(t), H / 2 + 2, Math.max(1, xs(t2) - xs(t)), H / 2 - 6);
    seen.set('b' + src, [SRC_COLORS[src] || '#888', 'Bar: ' + (src === 21 && !S.work.set.MUSIC_PLAYING ? 'Idle HUD' : FRAME_SOURCES[src])]); seen.set('p' + view, [VIEW_COLORS[view] || '#888', 'Panel: ' + S.engines[0].viewName(view)]); }
  const lg = $('legend'); if(lg) { lg.innerHTML = ''; for(const [c, n] of seen.values()) lg.append(el('span', {}, el('i', { style: `background:${c}` }), n)); }
}
function copyFrame(which) {
  const a = which === 'bar' ? S.px.bar : S.px.pan; let s = ''; for(let i = 0; i < a.length; i++) s += a[i].toString(16).padStart(2, '0');
  s = s.toUpperCase(); const note = $('copyNote');
  navigator.clipboard.writeText(s).then(() => note.textContent = `Copied ${a.length / 3} LEDs.`, () => { note.textContent = 'Clipboard blocked here; the hex is selected in the box below.'; const t = el('textarea', { style: 'width:100%;height:80px;font:11px var(--mono)', readonly: true }); t.value = s; note.after(t); t.select(); });
}

// ------------------------------------------------------------------ contact sheet
function renderSheet() {
  const p = $('pSheet'); p.innerHTML = '';
  p.append(el('p', { class: 'hint', text: `Every ${S.app.name} situation at its key moment, rendered fresh from t = 0 so earlier situations never leak into later ones. Click one to open it.` }));
  const grid = el('div', { class: 'sheet' }); p.append(grid);
  const keep = { app: S.app, sit: S.sit, sim: S.sim, playing: S.playing };
  const scale = 4;
  for(const sit of S.app.situations) {
    let bar, pan;
    if(S.app.kind === 'firmware') {
      const save = [S.sit, S.work, S.actions, S.engines]; S.sit = sit; const w = sit.world || {};
      S.work = { set: { ...(w.set || {}) }, text: { ...(w.text || {}) }, lyrics: w.lyrics || [], epoch: w.epoch || SAT(19, 42) }; S.actions = [...(sit.actions || [])].sort((a, b) => a.at - b.at);
      S.engines = [save[3][0]]; restart(); const snap = sit.snap || 4000; while(S.sim + STEP <= snap) stepOnce();
      bar = S.engines[0].barPixels(); pan = S.engines[0].panPixels(); [S.sit, S.work, S.actions, S.engines] = save;
    } else { const gb = new Gfx(BAR_W, BAR_H, S.fonts), gp = new Gfx(PAN_W, PAN_H, S.fonts); try { sit.draw(gb, sit.snap || 2000, 'bar'); sit.draw(gp, sit.snap || 2000, 'panel'); } catch(e) {} bar = gb.px_; pan = gp.px_; }
    const mk = (px, w, h) => { const c = el('canvas', { width: w * scale, height: h * scale }); const ctx = c.getContext('2d'); for(let y = 0; y < h; y++) for(let x = 0; x < w; x++) { const i = (y * w + x) * 3; ctx.fillStyle = `rgb(${GAMMA[px[i]]},${GAMMA[px[i + 1]]},${GAMMA[px[i + 2]]})`; ctx.fillRect(x * scale, y * scale, scale - 1, scale - 1); } return c; };
    const fig = el('figure', { tabindex: 0, on: { click: () => { load(S.app, sit); showTab('tSit'); } } });
    if(S.app.devices.includes('bar')) fig.append(mk(bar, BAR_W, BAR_H));
    if(S.app.devices.includes('panel')) { const c = mk(pan, PAN_W, PAN_H); c.style.width = '128px'; fig.append(c); }
    fig.append(el('figcaption', { text: `${sit.name} · ${((sit.snap || 4000) / 1000).toFixed(1)} s` }));
    grid.append(fig);
  }
  // put the open situation back exactly where it was
  S.app = keep.app; S.sit = keep.sit;
  seek(keep.sim); S.playing = keep.playing; draw();
}

// ------------------------------------------------------------------ builds (compare for code cleanup)
function renderBuilds() {
  const p = $('pBuild'); p.innerHTML = '';
  p.append(el('h3', { class: 'sit-title', text: 'Builds' }), el('p', { class: 'sit-note', text: 'Every build runs the same situations in the same simulated room. The header picks the build on screen and, with Compare, a second one underneath.' }));
  const blurb = (id) => id === 'today' ? 'Your ARXIv2 libraries as they are.' : id === 'proposed' ? 'The audit fixes: one conductor, companion alone, room notes, one Volt, eel boot.' : 'Loaded from a file.';
  for(const bd of S.builds) {
    const row = el('div', { class: 'buildrow' }, el('span', { class: 'nm' }, el('b', { text: bd.name }), el('span', { class: 'hint', text: '  ' + blurb(bd.id) })));
    row.append(el('button', { class: 'btn' + (S.primary === bd.id ? ' primary' : ''), text: S.primary === bd.id ? 'On screen' : 'Show', on: { click: () => { $('buildSel').value = bd.id; $('buildSel').onchange({ target: $('buildSel') }); } } }));
    if(S.primary !== bd.id) row.append(el('button', { class: 'btn', text: S.engines.length > 1 && S.compareId === bd.id ? 'Compared' : 'Compare with', on: { click: () => { S.compareId = bd.id; S.compare = true; store.set('compareId', bd.id); store.set('compare', true); setEngines(); refreshBuildUI(); seek(S.sim); applyDeviceVisibility(); renderBuilds(); } } }));
    if(!['today', 'proposed'].includes(bd.id)) row.append(el('button', { class: 'btn', text: 'Remove', on: { click: () => { S.builds = S.builds.filter(x => x !== bd); if(S.primary === bd.id) S.primary = 'proposed'; if(S.compareId === bd.id) S.compareId = S.primary === 'today' ? 'proposed' : 'today'; setEngines(); refreshBuildUI(); seek(S.sim); renderBuilds(); applyDeviceVisibility(); } } }));
    p.append(row);
  }
  const file = el('input', { type: 'file', id: 'wasmFile', accept: '.wasm', style: 'max-width:100%' });
  file.onchange = async () => { const f = file.files[0]; if(!f) return;
    try { const eng = await Engine.create(new Uint8Array(await f.arrayBuffer()), f.name.replace(/\.wasm$/, ''));
      const kind = eng.x.sim_build ? eng.str(eng.x.sim_build()) : 'build'; const id = 'b' + Date.now();
      S.builds.push({ id, name: `${f.name} (${kind})`, eng }); S.compareId = id; S.compare = true; setEngines(); refreshBuildUI(); seek(S.sim); applyDeviceVisibility(); renderBuilds(); }
    catch(e) { $('buildNote').textContent = 'That file did not load as an ARXI simulator build: ' + e.message; } };
  p.append(el('div', { class: 'btns', style: 'align-items:center;margin-top:10px' }, el('label', { for: 'wasmFile', text: 'Add a build (.wasm): ' }), file), el('div', { id: 'buildNote', class: 'hint' }));
  if(S.engines.length > 1) { const dt = el('input', { type: 'checkbox', id: 'bDiff', checked: S.diff }); dt.onchange = () => { S.diff = dt.checked; draw(); };
    p.append(el('div', { class: 'btns', style: 'align-items:center;margin-top:8px' }, el('label', { class: 'tog', for: 'bDiff', style: 'padding:0' }, dt, 'Mark LEDs that differ from the compared build (magenta)')), el('div', { class: 'diffnote', id: 'diffNote' })); updateDiffNote(); }
  // ---- test runner
  p.append(el('h3', { class: 'sit-title', style: 'margin-top:22px', text: 'Test runner' }),
    el('p', { class: 'sit-note', text: 'Plays every situation from the start in each room setup, on the build on screen and the compared one. It reports what each screen showed, where the companion went dark, and how much of each run differs between the two builds.' }));
  const scope = el('select', { id: 'runScope' }, el('option', { value: 'app', text: `This app: ${S.app.name}` }), el('option', { value: 'group', text: `This group: ${S.app.group}` }), el('option', { value: 'all', text: 'Every firmware app (about a minute)' }));
  const rooms = ['Bar + companion', 'Bar alone', 'Companion alone', 'Swapped'].map((n, i) => { const c = el('input', { type: 'checkbox', id: 'rr' + i, checked: i !== 1 }); return el('label', { class: 'tog', for: 'rr' + i, style: 'padding:0' }, c, n); });
  const go = el('button', { class: 'btn primary', id: 'runGo', text: 'Run tests' });
  p.append(el('div', { class: 'btns', style: 'align-items:center' }, scope, ...rooms, go), el('div', { class: 'hint', id: 'runNote' }), el('div', { id: 'runOut' }));
  go.onclick = () => runLab(scope.value, [0, 1, 2, 3].filter(i => $('rr' + i).checked));
  p.append(el('details', { style: 'margin-top:16px' }, el('summary', { text: 'How to make a build of your own', style: 'cursor:pointer' }),
    el('pre', { class: 'code', text: 'cd C:\\Users\\akran\\OneDrive\\Documents\\PlatformIO\\Projects\\ARXIv2\npython tools\\arxi-sim\\build_sim.py --zig <path to zig.exe>\n\n# Today build from lib\\         ->  work\\arxi-sim\\arxi_sim.wasm\n# Proposed build (audit fixes)  ->  work\\arxi-sim\\arxi_sim_proposed.wasm\n# Add either one here with "Add a build", then press Run tests.' })));
}
// One situation in one room, from the start to `len`, on every engine given; calls back once per frame.
function runSituation(engines, sit, room, len, onFrame) {
  const w = sit.world || {}, work = { set: { ...(w.set || {}) }, text: { ...(w.text || {}) }, lyrics: w.lyrics || [], epoch: w.epoch || SAT(19, 42) };
  for(const e of engines) { e.init(); e.set('EPOCH', work.epoch); for(const [k, v] of Object.entries(work.set)) e.set(k, v); for(const [k, v] of Object.entries(work.text)) e.text(k, v); e.lyrics(work.lyrics); e.set('ROOM', room); e.set('HUB', 1); }
  const acts = [...(sit.actions || [])].sort((a, b) => a.at - b.at); let fi = 0; const keep = S.work; S.work = work;
  for(let t = 33; t <= len; t += STEP) {
    while(fi < acts.length && acts[fi].at <= t) { for(const e of engines) fire(e, acts[fi], t); fi++; }
    for(const r of sit.ramps || []) if(t >= r.at) { const k = Math.min(1, (t - r.at) / r.over); for(const e of engines) e.set(r.key, Math.round(r.from + (r.to - r.from) * k)); }
    const snd = sound(t); onFrame(t, engines.map(e => e.frame(t, snd)));
  }
  S.work = keep;
}
async function runLab(scopeKind, rooms) {
  const sits = []; for(const app of ARXI.apps) { if(app.kind !== 'firmware') continue; if(scopeKind === 'app' && app !== S.app) continue; if(scopeKind === 'group' && app.group !== S.app.group) continue; for(const s of app.situations) sits.push([app, s]); }
  if(!sits.length) { $('runNote').textContent = 'Open a firmware app first: concept apps have no build to test.'; return; }
  if(!rooms.length) { $('runNote').textContent = 'Tick at least one room setup.'; return; }
  const A = build(S.primary).eng, Bb = S.engines.length > 1 ? S.engines[1] : null, engines = Bb ? [A, Bb] : [A];
  const wasPlaying = S.playing; pause(); $('runGo').disabled = true;
  const ROOMN = ['Bar + companion', 'Bar alone', 'Companion alone', 'Swapped'];
  const tbl = el('table', { class: 'results' }); tbl.append(el('thead', {}, el('tr', {}, el('th', { text: 'Situation' }), ...rooms.map(r => el('th', { text: ROOMN[r] })))));
  const body = el('tbody'); tbl.append(body); $('runOut').innerHTML = ''; $('runOut').append(el('div', { class: 'tablewrap' }, tbl));
  let done = 0, darkRuns = 0, diffRuns = 0; const total = sits.length * rooms.length, t0 = performance.now();
  for(const [app, sit] of sits) {
    const tr = el('tr', {}, el('td', {}, el('b', { text: sit.name }), el('div', { class: 'hint', text: app.name })));
    for(const room of rooms) {
      const len = Math.min(sit.len || 30000, 30000), seenB = new Map(), seenP = new Map(); let frames = 0, diff = 0, dark = 0;
      runSituation(engines, sit, room, len, (t, res) => {
        frames++; const r = res[0], bk = barWhat(r), pk = A.viewName(r.view);
        if(room !== 2) seenB.set(bk, (seenB.get(bk) || 0) + 1);
        if(room !== 1) seenP.set(pk, (seenP.get(pk) || 0) + 1);
        const pp = A.panPixels();
        if(room !== 1 && pk !== 'off') { let lit = false; for(let i = 0; i < pp.length; i += 3) if(pp[i] | pp[i + 1] | pp[i + 2]) { lit = true; break; } if(!lit) dark++; }
        if(Bb) { const a1 = A.barPixels(), b1 = Bb.barPixels(), b2 = Bb.panPixels(); let d = false;
          if(room !== 2) for(let i = 0; i < a1.length && !d; i++) d = a1[i] !== b1[i];
          if(room !== 1) for(let i = 0; i < pp.length && !d; i++) d = pp[i] !== b2[i];
          if(d) diff++; }
      });
      const top = (m) => [...m.entries()].sort((x, y) => y[1] - x[1]).slice(0, 3).map(([k, n]) => `${k} ${Math.round(n * 100 / frames)}%`).join(', ');
      const td = el('td', { class: 'cell', title: 'Open this situation in this room', on: { click: () => { S.room = room; store.set('room', room); refreshBuildUI(); load(app, sit); showTab('tSit'); } } });
      if(Bb) td.append(el('span', { class: 'tag2 ' + (diff ? 'diff' : 'same'), text: diff ? `differs ${Math.round(diff * 100 / frames)}%` : 'same' }));
      if(dark * STEP > 500) td.append(el('span', { class: 'tag2 bad', text: `companion dark ${(dark * STEP / 1000).toFixed(1)} s` })); // a blink between screens is not a finding
      if(room !== 2) td.append(el('div', { text: 'Bar: ' + top(seenB) }));
      if(room !== 1) td.append(el('div', { text: 'Companion: ' + top(seenP) }));
      tr.append(td); darkRuns += dark * STEP > 500 ? 1 : 0; diffRuns += diff ? 1 : 0;
      done++; $('runNote').textContent = `Running ${done} of ${total}…`;
      await new Promise(r => setTimeout(r, 0));
    }
    body.append(tr);
  }
  $('runNote').textContent = `${total} runs in ${((performance.now() - t0) / 1000).toFixed(1)} s on ${A.label}${Bb ? ` vs ${Bb.label}: ${diffRuns} differ` : ''}; the companion went dark in ${darkRuns}. Click a cell to open it in that room.`;
  $('runGo').disabled = false; seek(S.sim); S.playing = wasPlaying; setPlayIcon();
}
function compareFrame(t) {
  const [A, B] = S.engines; const a1 = A.barPixels(), b1 = B.barPixels(), a2 = A.panPixels(), b2 = B.panPixels();
  let n = 0; for(let i = 0; i < a1.length; i++) if(a1[i] !== b1[i]) n++; for(let i = 0; i < a2.length; i++) if(a2[i] !== b2[i]) n++;
  const d = S.diffStats; d.frames++; d.lastCount = n; if(n) { d.diffFrames++; if(d.first < 0) d.first = t; }
  if(d.frames % 15 === 0) updateDiffNote();
}
function updateDiffNote() {
  const n = $('diffNote'); if(!n || S.engines.length < 2) return; const d = S.diffStats, A = S.engines[0], B = S.engines[1];
  n.className = 'diffnote ' + (d.diffFrames ? 'bad' : 'good');
  n.textContent = d.diffFrames ? `${B.label} differs from ${A.label} in ${d.diffFrames} of ${d.frames} frames of this run so far; first at ${(d.first / 1000).toFixed(2)} s.` : `${B.label} matches ${A.label} on all ${d.frames} frames of this run so far.`;
}

