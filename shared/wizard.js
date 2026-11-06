// ===================================================================== ARXI Build: the guided wizard
// One question at a time, plain words, and only what fits the buyer. Each answer shows on the screens straight away.
// Steps: Who it's for -> Where it goes -> Screens -> Senses -> Features -> Your ARXI.
// Places lock the rest: a bus stop only offers transit features and outdoor sensors, a living room only home ones.

// ------------------------------------------------------------------ the rules
const BUYERS = {
  home: { name: 'Home', icon: 'home', market: 'Consumer', line: 'For your living room, bedroom, den or backyard.', places: ['living', 'bedroom', 'cave', 'yard'] },
  business: { name: 'Business', icon: 'store', market: 'Commercial', line: 'For a bar, cafe or shop: menus, specials, waits and the game.', places: ['pub', 'cafe', 'store'] },
  government: { name: 'Government', icon: 'bus', market: 'Government', line: 'For transit stops and parks: arrivals, alerts and trail status.', places: ['busstop', 'park'] },
};
const PLACE_INFO = {
  living: { line: 'On the wall and the console, seen from the sofa.' }, bedroom: { line: 'Above the bed and on the nightstand.' },
  cave: { line: 'Around the big TV for game day and music.' }, yard: { line: 'Under the pergola, out in the weather.' },
  pub: { line: 'Behind and on the bar, read from the stools.' }, cafe: { line: 'A menu strip and a counter screen.' }, store: { line: 'In a window or lobby: shops, offices, funeral homes.' },
  busstop: { line: 'On a solar transit pole at the curb.' }, park: { line: 'On a two-post wayfinding kiosk.' },
};
// which feature groups belong in each place (the rest are hidden, not just switched off)
const PLACE_GROUPS = {
  living: ['Time & Weather', 'Plans', 'Music', 'Sports', 'House', 'Seasons', 'Home Extras'],
  bedroom: ['Time & Weather', 'Plans', 'Music', 'House', 'Seasons', 'Home Extras'],
  cave: ['Time & Weather', 'Plans', 'Music', 'Sports', 'House', 'Seasons', 'Home Extras', 'Streamer'],
  yard: ['Time & Weather', 'Plans', 'Music', 'Sports', 'House', 'Seasons'],
  pub: ['Commercial', 'Sports', 'Music', 'Time & Weather', 'Seasons'],
  cafe: ['Commercial', 'Music', 'Time & Weather', 'Seasons'],
  store: ['Commercial', 'Time & Weather', 'Seasons', 'Funeral Homes'],
  busstop: ['Transit', 'Time & Weather'],
  park: ['Parks', 'Time & Weather'],
};
const NOT_FOR_PLACE = { busstop: ['styles', 'rotation', 'moon', 'timeline'], park: ['styles', 'rotation', 'timeline'], store: ['styles', 'rotation'], pub: ['styles'], cafe: ['styles'] };
const STARTERS = {
  living: ['clock', 'weather-now', 'calendar', 'lyrics', 'nfl-scores', 'notify'], bedroom: ['clock', 'weather-now', 'wake', 'wind', 'calendar'],
  cave: ['clock', 'nfl-scores', 'gameday', 'nfl-moments', 'visualizers', 'lyrics'], yard: ['clock', 'weather-now', 'forecast', 'lyrics', 'sunset'],
  pub: ['nfl-scores', 'gameday', 'happy-hour', 'specials', 'visualizers'], cafe: ['open-sign', 'specials', 'order-ready', 'wait', 'clock'], store: ['open-sign', 'specials', 'social', 'clock'],
  busstop: ['next-bus', 'approach', 'service-alert', 'stop-weather', 'clock'], park: ['trail', 'closing', 'weather-safety', 'events', 'clock'],
};
// what the screens can sense, in plain words; what each lets them do depends on the buyer
const SENSES = {
  presence: { name: 'Presence', icon: 'eye', line: 'Knows when someone is near.', places: 'all',
    can: { home: ['Wakes up when you walk in', 'Goes dark when the room empties, to save power', 'Greets you with your day when you get home'],
           business: ['Wakes for customers, rests when the place is empty', 'Counts visits for busy-hour reports', 'Shows the special when someone walks up'],
           government: ['Wakes when riders or visitors arrive', 'Sleeps when no one is around, to save the battery', 'Counts people for crowding and usage reports'] } },
  sound: { name: 'Sound', icon: 'music', line: 'Listens to the room. It hears levels, not words.', places: ['living', 'bedroom', 'cave', 'yard', 'pub', 'cafe'],
    can: { home: ['Visualizers dance to whatever is playing', 'Clap to change what the screens show', 'Cheers along when the room goes loud for a score'],
           business: ['Visualizers move with the music and the crowd', 'Hype meter that peaks with the room', 'Notices when it is too loud to read and goes simpler'] } },
  light: { name: 'Light', icon: 'sun', line: 'Senses how bright it is.', places: 'all',
    can: { home: ['Dims at night and brightens in daylight', 'Turns off when you switch the lights off', 'Gentle night mode for bedrooms'],
           business: ['Stays readable in a sunny window and soft in a dim bar', 'Follows your opening hours and lighting'],
           government: ['Full brightness in the sun, low at night to save power', 'Lowers glare for drivers after dark'] } },
  climate: { name: 'Air & climate', icon: 'cloud', line: 'Feels temperature, humidity and air quality right there.', places: ['yard', 'busstop', 'park', 'cafe', 'store', 'living'],
    can: { home: ['Shows the real temperature on your patio or in the room', 'Warns when the air gets poor'],
           business: ['Shows the temperature out front', 'Alerts staff when it is too hot or stuffy'],
           government: ['Local heat and air-quality warnings at the stop or trail', 'Data for heat-island and air reports'] } },
};
delete SENSES.climate.can.home; // not offered for homes on arxisystems.com
// features that only work with a sense
const NEEDS = { visualizers: 'sound', hype: 'sound', presence: 'presence', occupancy: 'presence', crowding: 'presence', wait: 'presence', air: 'climate' };

// ------------------------------------------------------------------ state
const W = { step: 0, b: { buyer: null, place: null, screens: 'both', barSpot: 0, panSpot: 0, senses: [], features: [], name: '' } };
const STEPS = ['Who it\'s for', 'Where it goes', 'Your ARXI', 'Senses', 'Packs', 'Review'];
const wSave = () => store.set('wizard', { step: W.step, b: W.b });

function placeAllowed(place) { if(!place || place === 'bench') return null; const g = PLACE_GROUPS[place]; return g ? { groups: g, not: NOT_FOR_PLACE[place] || [] } : null; }
function appForPlace(app, place) { const r = placeAllowed(place); if(!r) return true; const need = NEEDS[app.id]; if(need && !sensesFor(place).includes(need)) return false; return app.group !== 'Diagnostics' && r.groups.includes(app.group) && !r.not.includes(app.id); }
function sensesFor(place) { return Object.entries(SENSES).filter(([, s]) => s.places === 'all' || s.places.includes(place)).map(([k]) => k); }
function buyerOfPlace(place) { return Object.keys(BUYERS).find(k => BUYERS[k].places.includes(place)); }
function placeName(id) { const p = PLACES.find(x => x.id === id); return p ? p.name : id; }

// ------------------------------------------------------------------ mode: Build (wizard) or Lab (everything)
function wizardInit() {
  const saved = store.get('wizard', null); if(saved) { W.step = saved.step || 0; Object.assign(W.b, saved.b || {}); }
  if(SEG && W.b.buyer !== SEG.buyer) { W.b.buyer = SEG.buyer; W.b.place = null; W.b.features = []; W.b.senses = []; W.b.packs = []; W.b.tier = null; W.step = 1; } // the section decides who it's for
  const nav = el('nav', { class: 'wiz', id: 'wiz', 'aria-label': 'Build your ARXI' }); document.querySelector('.lib').before(nav);
  const seg = el('div', { class: 'seg modeseg', role: 'group', 'aria-label': 'Mode' },
    el('button', { id: 'modeBuild', html: icon('sparkles', 14) + ' Build', on: { click: () => setMode('build') } }),
    el('button', { id: 'modeLab', html: icon('flask', 14) + ' Lab', on: { click: () => setMode('lab') } }));
  document.querySelector('header .mark').after(seg);
  setMode(store.get('mode', 'build'));
}
function setMode(m) {
  S.mode = m; store.set('mode', m); document.body.dataset.mode = m;
  $('modeBuild').setAttribute('aria-pressed', String(m === 'build')); $('modeLab').setAttribute('aria-pressed', String(m === 'lab'));
  if(typeof applyDeviceVisibility === 'function') applyDeviceVisibility();
  if(m === 'build') { wRender(); wApply(); } else { if(W.demo) stopSenseDemo(false); if(S.reel) reelStop(); renderAppList(); }
}

// ------------------------------------------------------------------ apply the build to the screens and the scene
function wApply() {
  const b = W.b;
  if(b.place && $('placeSel').value !== b.place) { $('placeSel').value = b.place; $('placeSel').onchange(); }
  const room = b.screens === 'bar' ? 1 : b.screens === 'panel' ? 2 : 0;
  if(S.room !== room) { $('mountSel').value = String(room); $('mountSel').onchange(); }
  if(b.place) { store.set('spot:' + b.place, [b.barSpot || 0, b.panSpot || 0]); P.key = ''; placeUpdate(true); }
  for(const e of S.engines || []) { e.set('MIC_ON', b.senses.includes('sound') ? 1 : 0); e.set('ROOM_HERE', 1); }
}
function wPreview(appId) { // show one feature on the screens, looping
  const a = ARXI.apps.find(x => x.id === appId); if(!a) return; if(S.reel) reelStop(); S.reelLoading = true; load(a, a.situations[0]); S.reelLoading = false; S.playing = true; setPlayIcon();
}
function wPlayAll() {
  const b = W.b; if(!b.features.length) return toast('Pick at least one feature');
  M.model = { name: b.name || `${placeName(b.place)} ARXI`, market: BUYERS[b.buyer].market, screens: b.screens === 'both' ? ['bar', 'panel'] : [b.screens], power: ['busstop', 'park'].includes(b.place) ? 'Solar + battery' : 'Wall', features: [...b.features] };
  reelStart();
}


// ------------------------------------------------------------------ "Show me": each sense acted out in the 3D place
const DEMO_TEXT = {
  presence: { title: 'Presence', how: 'A small radar watches the space in front of the screens. No camera: it only knows that someone is there and how far.',
    caption: (i) => i.here ? `Someone is ${i.dist} m away: the screens are awake` : i.awake > 0.2 ? 'Nobody in range: dimming down…' : 'The space is empty: screens asleep, saving power' },
  sound: { title: 'Sound', how: 'A tiny microphone measures how loud the room is. It hears levels, never words, and nothing is recorded.',
    caption: (i) => i.level > 0.45 ? 'Beat! The visualizer jumps with the music' : 'Listening to the room…' },
  light: { title: 'Light', how: 'A light sensor reads the room and sets the screen brightness to match, so it is never glaring at night or washed out by day.',
    caption: (i) => i.room > 0.66 ? 'Bright room: screens at full brightness' : i.room > 0.25 ? 'Lights going down: screens dim with them' : 'Dark room: gentle, low glow' },
  climate: { title: 'Air & climate', how: 'A sensor feels the temperature, humidity and air quality right where the screens are.',
    caption: (i) => i.aq > 0.66 ? 'Air quality dropping: a warning goes up' : i.aq > 0.33 ? 'The air is getting worse…' : 'Fresh air: all clear' },
};
const DEMO_APP = { presence: 'clock', sound: 'visualizers', light: 'clock', climate: 'air' };
function hud() { let h = $('senseHud'); if(!h) { h = el('div', { id: 'senseHud', class: 'shud', role: 'status' }); document.querySelector('.stage').append(h); } return h; }
function stopSenseDemo(rerender = true) {
  if(!W.demo) return; const k = W.demo; W.demo = null; if(Scene3D.stopDemo) Scene3D.stopDemo();
  if(S.work) { S.work.sound = W.demoSound; delete S.work.set.PRESENCE_OFF; S.work.set.ROOM_HERE = 1; if(W.demoLight != null) S.work.set.ROOM_LIGHT = W.demoLight; delete S.work.set.ROOM_DARK; }
  for(const e of S.engines || []) { e.set('PRESENCE_OFF', 0); e.set('ROOM_HERE', 1); e.set('ROOM_DARK', 0); if(W.demoLight != null) e.set('ROOM_LIGHT', W.demoLight); }
  const h = $('senseHud'); if(h) h.remove(); if(rerender && k) wRender();
}
function senseDemo(k) {
  if(W.demo === k) return stopSenseDemo();
  stopSenseDemo(false); W.demo = k;
  const app = appById(DEMO_APP[k]); if(app) wPreview(app.id);
  W.demoSound = S.work.sound; W.demoLight = S.work.set.ROOM_LIGHT ?? 60;
  if(k === 'sound') { S.work.sound = 'party'; S.work.set.MIC_ON = 1; }
  const t = DEMO_TEXT[k], h = hud(); h.innerHTML = '';
  const cap = el('div', { class: 'shud-cap' }), meter = el('div', { class: 'shud-meter' }, el('span')), meter2 = el('div', { class: 'shud-meter alt' }, el('span'));
  h.append(el('div', { class: 'shud-head', html: icon(SENSES[k].icon, 16) + `<b>${t.title}</b>` }), el('div', { class: 'shud-how', text: t.how }), cap,
    el('div', { class: 'shud-row' }, el('small', { text: { presence: 'Screens awake', sound: 'Room level', light: 'Room light', climate: 'Air quality' }[k] }), meter),
    ...(k === 'light' ? [el('div', { class: 'shud-row' }, el('small', { text: 'Screen brightness' }), meter2)] : []),
    el('button', { class: 'btn', text: 'Stop', on: { click: () => stopSenseDemo() } }));
  let last = '';
  const tick = (i) => {
    cap.textContent = t.caption(i); let v = 0;
    if(k === 'presence') { v = i.awake; const off = i.awake < 0.3 ? 1 : 0; if(off + '' !== last) { last = off + ''; S.work.set.PRESENCE_OFF = off; S.work.set.ROOM_HERE = off ? 0 : 1; for(const e of S.engines) { e.set('PRESENCE_OFF', off); e.set('ROOM_HERE', off ? 0 : 1); } } }
    if(k === 'sound') v = Math.min(1, 0.15 + i.level);
    if(k === 'light') { v = i.room; meter2.firstChild.style.width = Math.round(i.screen * 100) + '%'; const lv = Math.round(i.room * 100); if(Math.abs(lv - (+last || 0)) > 4) { last = lv; S.work.set.ROOM_LIGHT = lv; for(const e of S.engines) { e.set('ROOM_LIGHT', lv); e.set('ROOM_DARK', lv < 6 ? 1 : 0); } } }
    if(k === 'climate') { v = i.aq; const aqi = Math.round(25 + i.aq * 150); if(Math.abs(aqi - (+last || 0)) > 3) { last = aqi; S.work.set.AQI = aqi; for(const e of S.engines) e.set('AQI', aqi); } }
    meter.firstChild.style.width = Math.round(v * 100) + '%'; meter.dataset.state = k === 'climate' ? (v > 0.66 ? 'bad' : v > 0.33 ? 'warn' : 'ok') : '';
  };
  if(!Scene3D.demo || !Scene3D.demo(k, tick)) { // no 3D here (offline or workbench): run the same timeline on the screens alone
    const t0 = performance.now(); const loop = () => { if(W.demo !== k) return; const ph = (performance.now() - t0) / 1000;
      const info = k === 'presence' ? (() => { const u = ph % 15, here = u > 3 && u < 9.5; W.aw = (W.aw || 0) + ((here ? 1 : 0) - (W.aw || 0)) * 0.06; return { here, awake: W.aw, dist: '1.2' }; })()
        : k === 'sound' ? { level: Math.max(0, Math.sin(ph * 6.7)) ** 6 } : k === 'light' ? (() => { const f = 0.5 + 0.5 * Math.cos(ph / 12 * Math.PI * 2); return { room: f, screen: 0.25 + 0.75 * f }; })() : { aq: Math.max(0, Math.sin((ph % 14) / 14 * Math.PI)) };
      tick(info); requestAnimationFrame(loop); }; loop(); }
  wRender();
}

// ------------------------------------------------------------------ the panel
function wRender() {
  const nav = $('wiz'); if(!nav) return; if(W.demo && W.step !== 3) stopSenseDemo(false); nav.innerHTML = ''; const b = W.b;
  // can't be past a step whose answer is missing
  const need = [() => b.buyer, () => b.place, () => b.buyer === 'home' ? b.tier : b.screens, () => true, () => b.features.length]; for(let i = 0; i < W.step; i++) if(!need[i]()) { W.step = i; break; }
  const head = el('div', { class: 'wsteps', role: 'list' }, ...STEPS.map((s, i) => el('button', { role: 'listitem', class: 'wdot' + (i === W.step ? ' on' : i < W.step ? ' done' : ''), title: s, 'aria-label': `Step ${i + 1}: ${s}`, disabled: i > W.step && !need.slice(0, i).every(f => f()), on: { click: () => { W.step = i; wSave(); wRender(); } } }, el('span', { text: i < W.step ? '✓' : String(i + 1) }))));
  nav.append(head, el('div', { class: 'wtitle' }, el('small', { text: `Step ${W.step + 1} of ${STEPS.length}` }), el('h2', { text: STEPS[W.step] })));
  const body = el('div', { class: 'wbody' }); nav.append(body);
  const card = (on, ic, title, line, click, extra) => el('button', { class: 'wcard' + (on ? ' on' : ''), 'aria-pressed': String(!!on), on: { click } }, el('span', { class: 'wic', html: icon(ic, 20) }), el('span', { class: 'wtx' }, el('b', { text: title }), el('span', { text: line }), extra || null));
  const next = (ok, label = 'Next') => el('div', { class: 'wnav' }, W.step ? el('button', { class: 'btn', text: 'Back', on: { click: () => { W.step--; wSave(); wRender(); } } }) : el('span'), el('button', { class: 'btn primary', text: label, disabled: !ok, on: { click: () => { W.step++; wSave(); wRender(); } } }));

  if(W.step === 0) {
    body.append(el('p', { class: 'wlead', text: 'Who is this ARXI for? You will only see what fits.' }));
    if(SEG) body.append(el('a', { class: 'wswitch', href: '../', html: icon('arrowleft', 14) + ' Building for someone else? Choose another section' }));
    for(const [k, v] of Object.entries(BUYERS)) body.append(card(b.buyer === k, v.icon, v.name, v.line, () => { if(b.buyer !== k) { b.buyer = k; b.place = null; b.features = []; b.senses = []; b.packs = []; b.tier = null; } wSave(); W.step = 1; wRender(); }));
  }
  if(W.step === 1) {
    body.append(el('p', { class: 'wlead', text: 'Where will it go? The screens move there now.' }));
    for(const p of BUYERS[b.buyer].places) body.append(card(b.place === p, (PLACES.find(x => x.id === p) || {}).icon || 'home', placeName(p), PLACE_INFO[p].line, () => {
      if(b.place !== p) { b.place = p; b.barSpot = 0; b.panSpot = 0; b.features = (STARTERS[p] || []).filter(id => ARXI.apps.find(a => a.id === id)); b.senses = b.buyer === 'home' ? [] : sensesFor(p).filter(s => s !== 'climate'); b.tier = null; b.packs = b.buyer === 'home' ? [] : PACKS.filter(x => x.market === BUYERS[b.buyer].market && !x.always && x.apps.some(id => (STARTERS[p] || []).includes(id))).map(x => x.id); }
      wSave(); wApply(); wPreview(b.features[0]); wRender(); }));
    body.append(next(!!b.place));
  }
  const home = b.buyer === 'home', market = BUYERS[b.buyer || 'home'].market;
  const mountSpots = () => { const spots = Scene3D && Scene3D.spots && Scene3D.spots(b.place); if(!spots) return null;
    const mk = (which, list, v) => { const s = el('select', { id: 'w' + which, 'aria-label': which === 'bar' ? 'Bar spot' : 'Panel spot' }, ...list.map((sp, i) => el('option', { value: i, text: sp.n, selected: i === v }))); s.onchange = () => { b[which === 'bar' ? 'barSpot' : 'panSpot'] = +s.value; wSave(); wApply(); }; return s; };
    const box2 = el('details', { class: 'wmore' }, el('summary', { text: 'Change where they mount' }));
    if(b.screens !== 'panel') box2.append(el('div', { class: 'f' }, el('label', { for: 'wbar', text: 'Bar' }), mk('bar', spots.bar, b.barSpot)));
    if(b.screens !== 'bar') box2.append(el('div', { class: 'f' }, el('label', { for: 'wpan', text: 'Panel' }), mk('pan', spots.pan, b.panSpot)));
    return box2; };
  const finish = () => el('div', { class: 'wfinish' }, el('span', { class: 'small muted', text: 'Frame' }), ...[['black', 'Black'], ['white', 'White']].map(([v, n]) => el('button', { class: 'chipbtn' + (S.finish === v ? ' on' : ''), text: n, on: { click: () => { (v === 'white' ? $('fnWhite') : $('fnBlack')).click(); P.key = ''; placeUpdate(true); wRender(); } } })));
  const setTier = (t, scr) => { b.tier = t; b.screens = scr; b.senses = [...TIERS[t].senses].filter(x => sensesFor(b.place).includes(x));
    b.packs = PACKS.filter(p => p.market === 'Consumer' && packIncluded(p, t)).map(p => p.id).concat((b.packs || []).filter(id => { const p = PACKS.find(x => x.id === id); return p && !packIncluded(p, t) && packAvailable(p, t) && p.price; }));
    wSave(); wApply(); wRender(); };

  if(W.step === 2 && home) {
    body.append(el('p', { class: 'wlead', text: 'Choose your ARXI. Everything in a tier comes with it; you can add packs next.' }));
    const incl = (t) => el('ul', { class: 'wcan' }, ...PACKS.filter(p => p.market === 'Consumer' && packIncluded(p, t)).map(p => el('li', { text: p.name })), ...(TIERS[t].senses.length ? [el('li', { text: 'Presence, room light and sound sensing' })] : []), ...(t === 'connected' ? [el('li', { text: 'ARXI Hub included' })] : []));
    body.append(card(b.tier === 'lite', 'screens', `Lite · ${TIERS.lite.price}`, TIERS.lite.line, () => setTier('lite', 'bar'), incl('lite')));
    const pro = card(b.tier === 'pro', 'grid', `Pro · ${TIERS.pro.price}`, TIERS.pro.line, () => setTier('pro', b.tier === 'pro' ? b.screens : 'bar'), incl('pro'));
    body.append(pro);
    if(b.tier === 'pro') body.append(el('div', { class: 'wfinish' }, el('span', { class: 'small muted', text: 'Size' }), ...[['bar', 'Bar 13 × 3.5 in · $249'], ['panel', 'Panel 13 × 7 in · $299']].map(([v, n]) => el('button', { class: 'chipbtn' + (b.screens === v ? ' on' : ''), text: n, on: { click: () => { b.screens = v; wSave(); wApply(); wRender(); } } }))));
    body.append(card(b.tier === 'connected', 'columns', `Connected · ${TIERS.connected.price}`, TIERS.connected.line, () => setTier('connected', 'both'), incl('connected')));
    if(b.tier) { const m = mountSpots(); if(m) body.append(m); body.append(finish()); }
    body.append(next(!!b.tier));
  } else if(W.step === 2) {
    body.append(el('p', { class: 'wlead', text: 'Which displays, and how many sites? Any mix works.' }));
    for(const [k, ic, t, l] of [['both', 'columns', 'Bar + Panel', 'Words on the Bar, pictures and numbers on the Panel.'], ['bar', 'screens', 'Bar', '13 × 3.5 in. One clear line.'], ['panel', 'grid', 'Panel', '13 × 7 in. Pictures, numbers and two lines.']])
      body.append(card(b.screens === k, ic, t, l, () => { b.screens = k; wSave(); wApply(); wRender(); }));
    const sites = el('input', { type: 'number', id: 'wSites', min: 1, value: b.sites || 1 }); sites.oninput = () => { b.sites = Math.max(1, +sites.value || 1); wSave(); };
    body.append(el('div', { class: 'f' }, el('label', { for: 'wSites', text: b.buyer === 'government' ? 'How many stops or sites?' : 'How many locations?' }), sites));
    const m = mountSpots(); if(m) body.append(m); body.append(finish(), next(!!b.screens));
  }
  if(W.step === 3) {
    const avail = sensesFor(b.place).filter(k => (SENSES[k].can[b.buyer] || []).length && (!home || TIERS[b.tier || 'pro'].senses.includes(k)));
    if(home && b.tier === 'lite') {
      body.append(el('p', { class: 'wlead', text: 'Lite keeps it simple: no sensors. Pro and Connected add presence, room light and sound.' }),
        card(false, 'sparkles', 'Upgrade to Pro', 'Wakes when you walk in, dims with the lights, visualizers that hear the music.', () => { setTier('pro', 'bar'); }));
    } else {
      body.append(el('p', { class: 'wlead', text: home ? 'These come with your ARXI. Switch off any you do not want.' : 'Tap a sense to include it.' }));
      for(const k of avail) { const s = SENSES[k], on = b.senses.includes(k);
        body.append(card(on, s.icon, s.name, s.line, () => { b.senses = on ? b.senses.filter(x => x !== k) : [...b.senses, k]; wSave(); wApply(); wRender(); }, el('ul', { class: 'wcan' }, ...(s.can[b.buyer] || []).map(t => el('li', { text: t })))),
          el('button', { class: 'wshow' + (W.demo === k ? ' on' : ''), html: icon(W.demo === k ? 'pause' : 'play', 13) + (W.demo === k ? ' Stop' : ` Show me ${s.name.toLowerCase()}`), on: { click: () => senseDemo(k) } })); }
    }
    body.append(next(true));
  }
  if(W.step === 4) {
    body.append(el('p', { class: 'wlead', text: home ? 'Packs group the features. Included ones are already on; add more if you like.' : 'Choose the packs for this site. Tap a feature to see it play.' }));
    b.packs = b.packs || [];
    for(const p of packsFor(market, b.place)) {
      const inc = home ? packIncluded(p, b.tier) : !!p.always, ok = !home || packAvailable(p, b.tier), on = inc || b.packs.includes(p.id);
      const tag = inc ? el('span', { class: 'chip free', text: 'Included' }) : !ok ? el('span', { class: 'chip internal', text: 'Needs Pro' }) : home && p.price ? el('span', { class: 'chip paid', text: p.price }) : null;
      const offered = sensesFor(b.place).filter(k => (SENSES[k].can[b.buyer] || []).length && (!home || TIERS[b.tier || 'pro'].senses.includes(k) || k === 'climate'));
      const apps = packApps(p).filter(a => a.id === 'seasons' || appForPlace(appById(a.preview) || a, b.place)).filter(a => !NEEDS[a.preview] || offered.includes(NEEDS[a.preview]) && (!home || (TIERS[b.tier || 'pro'].senses.includes(NEEDS[a.preview]))));
      const list = el('div', { class: 'wpackapps' }, ...apps.map(a => { const need = NEEDS[a.preview], miss = need && !b.senses.includes(need);
        return el('button', { class: 'wapp' + (miss ? ' locked' : ''), title: miss ? `Adds ${SENSES[need].name}` : a.blurb, on: { click: () => { if(miss) { b.senses = [...b.senses, need]; wSave(); wApply(); wRender(); } wPreview(a.preview); } } }, el('span', { text: a.name }), miss ? el('small', { text: `needs ${SENSES[need].name}` }) : null); }));
      const c = card(on, p.icon, p.name, p.line, () => { if(inc || !ok) return; b.packs = on ? b.packs.filter(x => x !== p.id) : [...b.packs, p.id]; wSave(); wRender(); }, tag);
      if(inc || !ok) c.classList.add('fixed');
      body.append(c, list);
    }
    const chosen = () => packsFor(market, b.place).filter(p => (home ? packIncluded(p, b.tier) : p.always) || b.packs.includes(p.id));
    b.features = featureIdsOf(chosen().map(p => p.id)).filter(id => appForPlace(appById(id), b.place) || SEASON_IDS.includes(id)).filter(id => !NEEDS[id] || b.senses.includes(NEEDS[id]));
    wSave();
    body.append(next(b.features.length > 0, home ? 'See my ARXI' : 'Review'));
  }
  if(W.step === 5) {
    const packs = packsFor(market, b.place).filter(p => (home ? packIncluded(p, b.tier) : p.always) || (b.packs || []).includes(p.id));
    const name = el('input', { type: 'text', id: 'wName', value: b.name || `${placeName(b.place)} ARXI`, 'aria-label': 'Name this build' }); name.oninput = () => { b.name = name.value; wSave(); };
    const scr = { both: 'Bar + Panel', bar: 'Bar', panel: 'Panel' }[b.screens];
    const rows = [['For', BUYERS[b.buyer].name], ['Place', placeName(b.place)], ...(home ? [['ARXI', `${TIERS[b.tier].name} · ${scr}`]] : [['Displays', `${scr} × ${b.sites || 1} site${(b.sites || 1) > 1 ? 's' : ''}`]]), ['Frame', S.finish],
      ['Senses', b.senses.map(x => SENSES[x].name).join(', ') || 'None'], ['Packs', packs.map(p => p.name).join(', ')]];
    if(home) { const hw = b.tier === 'lite' ? '$159' : b.tier === 'pro' ? (b.screens === 'panel' ? '$299' : '$249') : 'From $299 (hub included)'; const adds = packs.filter(p => !packIncluded(p, b.tier) && p.price).map(p => p.price);
      rows.push(['Price', hw], ['Add-on packs', adds.length ? adds.join(' + ') : 'None']); }
    const spec = () => ({ name: name.value, for: BUYERS[b.buyer].name, place: placeName(b.place), tier: home ? TIERS[b.tier].name : undefined, displays: scr, sites: home ? 1 : (b.sites || 1), frame: S.finish, senses: b.senses.map(x => SENSES[x].name), packs: packs.map(p => p.name), features: b.features.map(id => MERGED_NAME[id] || (appById(id) || {}).name).filter(Boolean) });
    body.append(el('div', { class: 'f' }, el('label', { for: 'wName', text: 'Name it' }), name), el('dl', { class: 'mstats wsum' }, ...rows.flatMap(([k, v]) => [el('dt', { text: k }), el('dd', { text: v })])),
      el('div', { class: 'btns' }, el('button', { class: 'btn primary', html: icon('play', 14) + ' Play my ARXI', on: { click: wPlayAll } }),
        el('button', { class: 'btn', text: 'Save', on: { click: () => { const list = store.get('builds', []).filter(x => x.name !== name.value); list.push({ ...JSON.parse(JSON.stringify(b)), finish: S.finish }); store.set('builds', list); toast('Saved in this browser'); } } }),
        el('button', { class: 'btn', text: 'Copy spec', on: { click: () => copyText(JSON.stringify(spec(), null, 2)) } })));
    if(!home) body.append(quoteForm(spec));
    else body.append(el('p', { class: 'hint', text: 'Prices are from arxisystems.com; add-on pack prices are drafts.' }));
    body.append(el('div', { class: 'wnav' }, el('button', { class: 'btn', text: 'Back', on: { click: () => { W.step--; wSave(); wRender(); } } }), el('button', { class: 'btn', text: 'Start over', on: { click: () => { W.b = { buyer: null, place: null, screens: 'both', barSpot: 0, panSpot: 0, senses: [], features: [], packs: [], name: '' }; W.step = 0; wSave(); wRender(); } } })));
    const saved = store.get('builds', []);
    if(saved.length) { const s = el('select', { 'aria-label': 'Open a saved build' }, el('option', { value: '', text: 'Open a saved build…' }), ...saved.map((x, i) => el('option', { value: i, text: x.name || placeName(x.place) }))); s.onchange = () => { if(s.value === '') return; W.b = JSON.parse(JSON.stringify(saved[+s.value])); W.step = 5; wSave(); wApply(); wRender(); }; body.append(s); }
  }
}

// ------------------------------------------------------------------ commercial and government end in a quote request
const QUOTE_EMAIL = ''; // set to the sales inbox to prefill the email fallback
function quoteForm(spec) {
  const f = el('form', { class: 'wquote', novalidate: true });
  const field = (id, label, type = 'text', req = false, extra = {}) => el('div', { class: 'f' }, el('label', { for: id, text: label + (req ? ' *' : '') }), type === 'textarea' ? el('textarea', { id, rows: 3, ...extra }) : el('input', { id, type, required: req, ...extra }));
  f.append(el('h3', { text: 'Request a quote' }), el('p', { class: 'hint', text: 'Pricing for organizations depends on sites, mounting and data feeds. Send this build and we will follow up.' }),
    field('qName', 'Your name', 'text', true, { autocomplete: 'name' }), field('qOrg', W.b.buyer === 'government' ? 'Agency or department' : 'Business', 'text', true, { autocomplete: 'organization' }),
    field('qEmail', 'Email', 'email', true, { autocomplete: 'email' }), field('qPhone', 'Phone', 'tel', false, { autocomplete: 'tel' }),
    el('div', { class: 'f' }, el('label', { for: 'qWhen', text: 'Timeline' }), el('select', { id: 'qWhen' }, ...['Just exploring', 'This quarter', 'Next 6 months', 'Budget cycle / RFP'].map(t => el('option', { text: t })))),
    field('qNotes', 'Anything else (feeds, power, mounting)', 'textarea'),
    el('button', { class: 'btn primary', type: 'submit', text: 'Send request' }), el('div', { id: 'qStatus', class: 'small', role: 'status' }));
  f.onsubmit = async (e) => { e.preventDefault();
    const v = (id) => f.querySelector('#' + id).value.trim(), st = f.querySelector('#qStatus');
    if(!v('qName') || !v('qOrg') || !/^\S+@\S+\.\S+$/.test(v('qEmail'))) { st.textContent = 'Please add your name, organization and a valid email.'; return; }
    const req = { at: new Date().toISOString(), contact: { name: v('qName'), org: v('qOrg'), email: v('qEmail'), phone: v('qPhone'), timeline: v('qWhen'), notes: v('qNotes') }, build: spec() };
    st.textContent = 'Sending…';
    let sent = false;
    try { const db = await Promise.race([claude.use('db'), new Promise(r => setTimeout(() => r(null), 4000))]), user = db && await claude.use('user'), id = user && await user.id();
      if(db && id) { const ref = db.doc('quotes/' + id), cur = await ref.get(), list = (cur.exists && cur.data().requests) || []; list.push(req); await ref.set({ requests: list.slice(-20) }); sent = true; } } catch(err) { sent = false; }
    if(sent) { f.replaceWith(el('div', { class: 'wquote done' }, el('h3', { text: 'Request sent' }), el('p', { text: `Thanks, ${req.contact.name}. We have your build and will reach out at ${req.contact.email}.` }))); return; }
    const body = `Quote request\n\n${JSON.stringify(req, null, 2)}`;
    st.innerHTML = ''; st.append('Could not send from here. ', el('a', { href: `mailto:${QUOTE_EMAIL}?subject=${encodeURIComponent('ARXI quote: ' + req.contact.org)}&body=${encodeURIComponent(body)}`, text: 'Email it instead' }), ' or ', el('button', { class: 'btn', type: 'button', text: 'copy it', on: { click: () => copyText(body) } }), '.');
  };
  return f;
}

