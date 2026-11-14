// ===================================================================== ARXI Home: My system (Home only)
// Pick the products you have (Bar 44x11, Panel 44x22, Prime, Hub), put them in rooms, and the planner balances the
// software across them: what each screen rotates through, who leads when music, a game or the morning happens, and
// how Prime joins in over the ARXI link. Then play a day at home and watch every device at once.
// Everything here is Home only. Prime is a Home device and never shows up in Commercial or Government.

const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for(const [k, v] of Object.entries(attrs)) { if(k === 'on') for(const [ev, fn] of Object.entries(v)) e.addEventListener(ev, fn); else if(k === 'text') e.textContent = v; else if(k === 'html') e.innerHTML = v; else if(v !== false && v != null) e.setAttribute(k, v === true ? '' : v); } for(const c of kids.flat()) if(c != null) e.append(c); return e; };
const STORE_KEY = 'arxi-sim:home:system';

// ------------------------------------------------------------------ products
const TYPES = {
  bar:   { name: 'ARXI Bar',   size: '44×11 · 13×3 in', icon: 'screens', tiers: { lite: 159, pro: 249 } },
  panel: { name: 'ARXI Panel', size: '44×22 · 13×7 in', icon: 'columns', tiers: { pro: 299 } },
  prime: { name: 'Prime',      size: '20 blades · radar', icon: 'sparkles', tiers: { art: null } },
};
const HUB_COST = 49;
const ROOMS = [['living', 'Living room'], ['bedroom', 'Bedroom'], ['cave', 'Man cave'], ['yard', 'Backyard'], ['desk', 'Desk']];
const roomName = (r) => (ROOMS.find(x => x[0] === r) || [r, r])[1];
const FOCUS_AREAS = [['info', 'Info', 'Clock, weather, plans'], ['music', 'Music', 'Lyrics, visualizers, Prime sync'], ['sports', 'Sports', 'Scores, Game Day, touchdowns'], ['calm', 'Ambience', 'Light, mornings, wind-down']];

// ------------------------------------------------------------------ the software, as features the planner can place
// fit: 0 = can't, 1 = works, 2 = good, 3 = made for it.  base = in the screen's rotation; layer = takes over for a moment.
const FEATURES = [
  { id: 'clock',     name: 'Clock',            app: 'clock',       sit: 0, focus: 'info',   kind: 'base',  fit: { bar: 3, panel: 2 }, perRoom: true, sync: true },
  { id: 'weather',   name: 'Weather',          app: 'weather-now', sit: 0, focus: 'info',   kind: 'base',  fit: { bar: 2, panel: 3 }, perRoom: true, sync: true },
  { id: 'calendar',  name: 'Calendar',         app: 'calendar',    sit: 0, focus: 'info',   kind: 'base',  fit: { bar: 2, panel: 3 } },
  { id: 'sun',       name: 'Sun & moon',       app: 'sun-arc',     sit: 0, focus: 'calm',   kind: 'base',  fit: { bar: 1, panel: 3 }, sync: true },
  { id: 'air',       name: 'Air quality',      app: 'air',         sit: 0, focus: 'info',   kind: 'base',  fit: { bar: 2, panel: 2 } },
  { id: 'countdown', name: 'Countdowns',       app: 'countdown',   sit: 0, focus: 'info',   kind: 'base',  fit: { bar: 2, panel: 2 } },
  { id: 'scores',    name: 'Live scores',      app: 'nfl-scores',  sit: 1, focus: 'sports', kind: 'base',  fit: { bar: 3, panel: 2 }, rooms: ['cave', 'living'] },
  { id: 'focus',     name: 'Focus timer',      app: 'focus-timer', sit: 0, focus: 'info',   kind: 'base',  fit: { bar: 3, panel: 2 }, rooms: ['desk'], only: ['desk'] },
  { id: 'wake',      name: 'Wake-up light',    app: 'wake',        sit: 0, focus: 'calm',   kind: 'layer', fit: { bar: 2, panel: 3 }, rooms: ['bedroom'], moment: 'morning' },
  { id: 'door',      name: 'Doorbell',         app: 'door',        sit: 0, focus: 'info',   kind: 'layer', brief: true, fit: { bar: 3, panel: 2 }, moment: 'arrive' },
  { id: 'notify',    name: 'Messages',         app: 'notify',      sit: 1, focus: 'info',   kind: 'layer', brief: true, fit: { bar: 3, panel: 2 }, moment: 'dinner' },
  { id: 'lyrics',    name: 'Synced lyrics',    app: 'lyrics',      sit: 0, focus: 'music',  kind: 'layer', fit: { bar: 3, panel: 2 }, moment: 'dinner', needs: ['speaker'] },
  { id: 'visualizer',name: 'Visualizers',      app: 'visualizers', sit: 0, focus: 'music',  kind: 'layer', fit: { bar: 0, panel: 3 }, moment: 'dinner', needs: ['pro'] },
  { id: 'gameday',   name: 'Game Day',         app: 'gameday',     sit: 0, focus: 'sports', kind: 'layer', fit: { bar: 2, panel: 3 }, moment: 'game', rooms: ['living', 'cave'] },
  { id: 'touchdown', name: 'Touchdown moments',app: 'nfl-moments', sit: 0, focus: 'sports', kind: 'layer', fit: { bar: 3, panel: 3 }, moment: 'game', rooms: ['living', 'cave'] },
  { id: 'wind',      name: 'Wind-down',        app: 'wind',        sit: 0, focus: 'calm',   kind: 'layer', fit: { bar: 2, panel: 3 }, rooms: ['bedroom'], moment: 'wind' },
  { id: 'sleep',     name: 'Sleep when empty', app: 'presence',    sit: 0, focus: 'calm',   kind: 'sense', fit: { bar: 3, panel: 3 }, needs: ['presence'] },
  // Prime: a Home device. Its own radar, its own light, and the ARXI link to the screens.
  { id: 'p-story',   name: 'The climb (walk-up)',     focus: 'calm',   kind: 'prime', fit: { prime: 3 }, moment: 'arrive', note: 'Radar: the years light as you come closer, then the climb.' },
  { id: 'p-sky',     name: 'Sunrise & sunset looks',  focus: 'calm',   kind: 'prime', fit: { prime: 3 }, note: 'Sunrise in the morning, Elemental by day, Sunset at night.' },
  { id: 'p-sync',    name: 'Music sync',              focus: 'music',  kind: 'prime', fit: { prime: 3 }, moment: 'dinner', needs: ['link', 'level'], note: 'A Bar or Panel sends the music level ~20 times a second.' },
  { id: 'p-follow',  name: 'Follow screen colours',   focus: 'sports', kind: 'prime', fit: { prime: 3 }, moment: 'game', needs: ['link'], note: 'Takes the screens\' theme, team colours on game night, and climbs on a score.' },
  { id: 'p-share',   name: 'Share presence',          focus: 'calm',   kind: 'prime', fit: { prime: 3 }, needs: ['link'], note: 'Prime\'s radar tells screens in its room when someone is there, so a Lite Bar can sleep too.' },
];
const FT = Object.fromEntries(FEATURES.map(f => [f.id, f]));

// ------------------------------------------------------------------ a day at home
const MOMENTS = [
  { id: 'morning', name: 'Wake up',        time: '7:00 AM',  h: 7,  m: 0,  here: ['bedroom'] },
  { id: 'leave',   name: 'Out the door',   time: '8:15 AM',  h: 8,  m: 15, here: [] },
  { id: 'day',     name: 'Afternoon',      time: '1:00 PM',  h: 13, m: 0,  here: ['desk', 'living'] },
  { id: 'arrive',  name: 'Home again',     time: '5:45 PM',  h: 17, m: 45, here: ['living'] },
  { id: 'dinner',  name: 'Dinner & music', time: '7:00 PM',  h: 19, m: 0,  here: ['living', 'yard'], music: true },
  { id: 'game',    name: 'Game night',     time: '8:30 PM',  h: 20, m: 30, here: ['living', 'cave'] },
  { id: 'wind',    name: 'Wind down',      time: '10:30 PM', h: 22, m: 30, here: ['bedroom'] },
  { id: 'night',   name: 'Night',          time: '1:00 AM',  h: 1,  m: 0,  here: [] },
];
const MOMENT_MS = 24000, DWELL = 8000, STEP = 33;

// ------------------------------------------------------------------ the system (saved in this browser)
const PRESETS = {
  'Bar Lite':            { devices: [['bar', 'lite', 'living']], hub: false },
  'Bar + Prime':         { devices: [['bar', 'pro', 'living'], ['prime', 'art', 'living']], hub: false },
  'Bar + Panel + Prime': { devices: [['bar', 'pro', 'living'], ['panel', 'pro', 'living'], ['prime', 'art', 'living']], hub: false },
  'Whole home':          { devices: [['bar', 'pro', 'living'], ['panel', 'pro', 'living'], ['prime', 'art', 'living'], ['bar', 'lite', 'bedroom'], ['bar', 'pro', 'desk'], ['panel', 'pro', 'cave']], hub: true },
};
let uid = 1;
const mkDev = (type, tier, room) => ({ id: 'd' + (uid++), type, tier, room, finish: type === 'prime' ? 'white' : 'black' });
function defaults() {
  return { devices: PRESETS['Bar + Panel + Prime'].devices.map(d => mkDev(...d)), hub: false, speaker: 'sonos',
    focus: { info: 2, music: 3, sports: 2, calm: 2 }, feat: {}, prime: { anim: 'tide', c1: 0xFFAA5F, c2: 0x503CFF, c3: 0xFF1208, bri: 160 } };
}
let SYS = (() => { try { const s = JSON.parse(localStorage.getItem(STORE_KEY)); if(s && s.devices) { uid = 1 + Math.max(0, ...s.devices.map(d => +d.id.slice(1) || 0)); return { ...defaults(), ...s }; } } catch(e) {} return defaults(); })();
const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(SYS)); } catch(e) {} };

// ------------------------------------------------------------------ the planner: balances the software across the kit
const displays = () => SYS.devices.filter(d => d.type !== 'prime');
const primes = () => SYS.devices.filter(d => d.type === 'prime');
const devName = (d) => { const same = SYS.devices.filter(x => x.type === d.type && x.room === d.room); return `${roomName(d.room)} ${TYPES[d.type].name.replace('ARXI ', '')}${same.length > 1 ? ' ' + (same.indexOf(d) + 1) : ''}`; };
const featOn = (f) => SYS.feat[f.id] !== 'off' && (SYS.feat[f.id] && SYS.feat[f.id] !== 'auto' || SYS.focus[f.focus] > 0);
const primeShares = (room) => featOn(FT['p-share']) && primes().some(p => p.room === room) && displays().length > 0;
const hasPresence = (d) => d.tier === 'pro' || primeShares(d.room);
function needsOk(f, d) {
  for(const n of f.needs || []) {
    if(n === 'speaker' && SYS.speaker === 'none') return 'needs a Sonos or HEOS speaker';
    if(n === 'pro' && d.tier !== 'pro') return 'needs a Pro display (mic)';
    if(n === 'presence' && !hasPresence(d)) return 'needs presence: a Pro display or Prime in the room';
    if(n === 'link' && !displays().length) return 'needs a Bar or Panel to talk to';
    if(n === 'level' && !(SYS.speaker !== 'none' || displays().some(x => x.tier === 'pro'))) return 'needs a speaker or a Pro display for the music level';
  }
  return '';
}
const capable = (f, d) => (f.fit[d.type] || 0) > 0 && !needsOk(f, d) && (!f.only || f.only.includes(d.room));

function plan() {
  const P = { rot: {}, layer: {}, brief: {}, prime: {}, issues: [], placed: {}, stats: {} };
  const D = displays();
  for(const d of D) { P.rot[d.id] = []; P.layer[d.id] = {}; P.brief[d.id] = {}; }
  const weight = (f) => SYS.focus[f.focus] || 0;
  const manual = (f) => SYS.feat[f.id] && !['auto', 'off'].includes(SYS.feat[f.id]) ? SYS.devices.find(d => d.id === SYS.feat[f.id]) : null;
  const issue = (level, msg, fix) => P.issues.push({ level, msg, fix });
  const MAX_ROT = 4;

  // 1. base rotation: one per room for room-wide things, otherwise on the best fit; never twice in one room
  const bases = FEATURES.filter(f => f.kind === 'base' && featOn(f)).sort((a, b) => weight(b) - weight(a) || Math.max(...Object.values(b.fit)) - Math.max(...Object.values(a.fit)));
  for(const f of bases) {
    const m = manual(f);
    if(m) { if(D.includes(m) && capable(f, m)) { P.rot[m.id].push(f.id); (P.placed[f.id] = P.placed[f.id] || []).push(m.id); } else issue('warn', `${f.name} is pinned to ${devName(m)}, which can't run it.`, { label: 'Let the planner place it', run: () => { SYS.feat[f.id] = 'auto'; } }); continue; }
    const rooms = f.perRoom ? [...new Set(D.map(d => d.room))] : [null];
    for(const room of rooms) {
      const cands = D.filter(d => (!room || d.room === room) && capable(f, d) && P.rot[d.id].length < MAX_ROT);
      if(!cands.length) continue;
      const score = (d) => f.fit[d.type] * 10 + (f.rooms && f.rooms.includes(d.room) ? 6 : 0) - P.rot[d.id].length * 4 - (D.some(x => x.room === d.room && P.rot[x.id].includes(f.id)) ? 30 : 0);
      const best = cands.sort((a, b) => score(b) - score(a))[0];
      if(!room && f.rooms && !f.rooms.includes(best.room) && score(best) < 20) continue; // a room-specific thing with no good home stays off
      P.rot[best.id].push(f.id); (P.placed[f.id] = P.placed[f.id] || []).push(best.id);
    }
    if(!P.placed[f.id] && D.length) {
      const why = D.map(d => needsOk(f, d)).find(Boolean) || (f.only ? `only for the ${f.only.map(roomName).join(', ')}` : 'every screen is full');
      issue('info', `${f.name} isn't shown: ${why}.`, f.only && !D.some(d => f.only.includes(d.room)) ? { label: `Add a Bar at the ${roomName(f.only[0])}`, run: () => SYS.devices.push(mkDev('bar', 'pro', f.only[0])) } : null);
    }
  }
  for(const d of D) if(!P.rot[d.id].length) { P.rot[d.id].push('clock'); }

  // 2. moments: in each room someone is in, hand the moment's features to the screens that fit them best, no repeats
  for(const mo of MOMENTS) {
    const wants = FEATURES.filter(f => f.kind === 'layer' && f.moment === mo.id && featOn(f));
    for(const room of new Set(D.map(d => d.room))) {
      if(!mo.here.includes(room)) continue;
      const inRoom = D.filter(d => d.room === room), used = new Set(), pairs = [];
      for(const f of wants) for(const d of inRoom) { const m = manual(f); if(m && m.id !== d.id) continue; if(capable(f, d)) pairs.push([f, d, f.fit[d.type] * 10 + weight(f) * 4 + (f.rooms && f.rooms.includes(room) ? 4 : 0)]); }
      pairs.sort((a, b) => b[2] - a[2]);
      for(const [f, d] of pairs) { if(!f.brief || used.has(f.id)) continue; P.brief[d.id][mo.id] = f.id; used.add(f.id); (P.placed[f.id] = P.placed[f.id] || []); if(!P.placed[f.id].includes(d.id)) P.placed[f.id].push(d.id); }
      for(const [f, d] of pairs) { if(f.brief || used.has(f.id) || P.layer[d.id][mo.id]) continue; P.layer[d.id][mo.id] = f.id; used.add(f.id); (P.placed[f.id] = P.placed[f.id] || []); if(!P.placed[f.id].includes(d.id)) P.placed[f.id].push(d.id); }
    }
  }
  for(const f of FEATURES.filter(f => f.kind === 'layer' && featOn(f))) if(!(P.placed[f.id] || []).length && D.length) {
    const why = D.map(d => needsOk(f, d)).find(Boolean) || (f.fit.bar === 0 ? 'made for the Panel' : f.rooms ? `nobody's in a room with a screen at ${MOMENTS.find(m => m.id === f.moment).time}` : 'no free screen at that moment');
    issue('info', `${f.name} doesn't play: ${why}.`, f.fit.bar === 0 && !D.some(d => d.type === 'panel') ? { label: 'Add a Panel to the living room', run: () => SYS.devices.push(mkDev('panel', 'pro', 'living')) }
      : why.startsWith('nobody') && f.rooms ? { label: `Add a Bar to the ${roomName(f.rooms[0]).toLowerCase()}`, run: () => SYS.devices.push(mkDev('bar', 'pro', f.rooms[0])) }
      : why.includes('Pro') ? { label: 'Make the Bars Pro', run: () => SYS.devices.forEach(d => { if(d.type === 'bar') d.tier = 'pro'; }) }
      : why.includes('speaker') ? { label: 'Add a Sonos speaker', run: () => { SYS.speaker = 'sonos'; } } : null);
  }
  const sleepOn = featOn(FT.sleep);
  for(const d of D) P.stats[d.id] = { sleeps: sleepOn && hasPresence(d) };

  // 3. Prime
  for(const p of primes()) {
    const peers = D.filter(d => d.room === p.room), on = (id) => featOn(FT[id]) && !needsOk(FT[id], p);
    P.prime[p.id] = { peers: peers.map(d => d.id), story: on('p-story'), sky: on('p-sky'), sync: on('p-sync'), follow: on('p-follow'), share: on('p-share') };
    for(const id of ['p-sync', 'p-follow', 'p-share']) if(featOn(FT[id]) && needsOk(FT[id], p)) issue('warn', `Prime ${FT[id].name.toLowerCase()}: ${needsOk(FT[id], p)}.`, { label: 'Add a Bar next to Prime', run: () => SYS.devices.push(mkDev('bar', 'pro', p.room)) });
    if(!peers.length && D.length) issue('info', `Prime is in the ${roomName(p.room).toLowerCase()} with no screen there. The link still works house-wide, but music sync and presence sharing are best in the same room.`, { label: `Move Prime to the ${roomName(D[0].room).toLowerCase()}`, run: () => { p.room = D[0].room; } });
  }
  if(primes().length > 1) issue('warn', 'Prime is one piece. A second one here is only a what-if.');

  // 4. house-wide checks
  const rooms = new Set(D.map(d => d.room));
  if(featOn(FT.gameday) && rooms.size > 1 && !SYS.hub) issue('warn', 'Game Day is on in more than one room without the Hub, so each screen runs its own takeover and they drift apart.', { label: `Add the Hub (+$${HUB_COST})`, run: () => { SYS.hub = true; } });
  if(SYS.hub && D.length < 2) issue('info', 'The Hub pays off with two or more screens. With one, it only adds the dashboard.', { label: 'Remove the Hub', run: () => { SYS.hub = false; } });
  const lite = D.filter(d => !hasPresence(d));
  if(lite.length && sleepOn) issue('info', `${lite.map(devName).join(', ')} can't tell when the room is empty, so ${lite.length > 1 ? 'they stay' : 'it stays'} lit all night.`, primes().length && lite.some(d => primes().some(p => p.room === d.room)) ? { label: 'Turn on Prime presence sharing', run: () => { SYS.feat['p-share'] = 'auto'; } } : { label: 'Make them Pro', run: () => lite.forEach(d => { if(d.type === 'bar') d.tier = 'pro'; }) });
  for(const d of D) if(P.rot[d.id].length >= MAX_ROT) issue('info', `${devName(d)} rotates through ${P.rot[d.id].length} things. Each one comes round every ${P.rot[d.id].length * DWELL / 1000} s; fewer is easier to read.`, null);

  // 5. score
  const enabled = FEATURES.filter(f => featOn(f) && f.kind !== 'prime' && f.kind !== 'sense');
  const covered = enabled.filter(f => (P.placed[f.id] || []).length).length;
  const fits = Object.entries(P.placed).flatMap(([fid, ids]) => ids.map(id => (FT[fid].fit[SYS.devices.find(d => d.id === id).type] || 0) / 3));
  const loads = D.map(d => P.rot[d.id].length + Object.keys(P.layer[d.id]).length * 0.5), mean = loads.reduce((a, b) => a + b, 0) / Math.max(1, loads.length);
  const sd = Math.sqrt(loads.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, loads.length));
  let lit = 0, wasted = 0; for(const mo of MOMENTS) for(const d of D) { if(!mo.here.includes(d.room)) { lit++; if(!P.stats[d.id].sleeps) wasted++; } }
  const link = primes().length ? primes().reduce((a, p) => a + (P.prime[p.id].peers.length ? 1 : 0.5), 0) / primes().length : 1;
  const hubOk = rooms.size > 1 && featOn(FT.gameday) ? (SYS.hub ? 1 : 0.4) : 1;
  const parts = [
    ['Coverage', enabled.length ? covered / enabled.length : 1, 30, 'Features you want that have a screen'],
    ['Fit', fits.length ? fits.reduce((a, b) => a + b, 0) / fits.length : 0, 20, 'Each feature on the screen it reads best on'],
    ['Balance', D.length < 2 ? 1 : Math.max(0, 1 - sd / (mean + 1)), 20, 'Work shared evenly, nobody overloaded'],
    ['Sleeps', lit ? 1 - wasted / lit : 1, 15, 'Screens go dark in empty rooms'],
    ['Connected', link * hubOk, 15, 'Prime and screens talk; Game Day in step'],
  ];
  P.parts = parts; P.score = D.length || primes().length ? Math.round(parts.reduce((a, [, k, w]) => a + k * w, 0)) : 0;
  P.covered = covered; P.enabled = enabled.length;
  return P;
}

// ------------------------------------------------------------------ what each device shows right now
function content(d, mo, t) {
  const P = S.plan;
  if(d.type === 'prime') return null;
  const here = mo.here.includes(d.room);
  const br = P.brief[d.id] && P.brief[d.id][mo.id];
  if(br && t < 7000) return { fid: br, app: FT[br].app, sit: FT[br].sit, why: 'pops up for a moment', key: 'b' + br };
  const lay = P.layer[d.id] && P.layer[d.id][mo.id];
  if(lay) return { fid: lay, app: FT[lay].app, sit: FT[lay].sit, why: 'leads ' + mo.name.toLowerCase(), key: lay };
  if(!here) {
    if(P.stats[d.id].sleeps) return { dark: true, why: 'asleep, nobody in the room', key: 'dark' };
    if(mo.id === 'night' || mo.id === 'leave') return { fid: 'clock', app: 'clock', sit: 2, why: 'on in an empty room (no presence)', key: 'night', sync: true };
  }
  const rot = P.rot[d.id], i = Math.floor(t / DWELL) % rot.length, f = FT[rot[i]];
  return { fid: f.id, app: f.app, sit: f.sit, why: here ? `rotation ${i + 1}/${rot.length}` : 'lit in an empty room (no presence)', key: 'r' + f.id, sync: f.sync };
}
function primeState(p, mo, t) {
  const pp = S.plan.prime[p.id], here = mo.here.includes(p.room), L = { ...SYS.prime, ember: true };
  const peerShows = (fid) => pp.peers.some(id => S.plan.layer[id] && S.plan.layer[id][mo.id] === fid);
  if(mo.id === 'night' || mo.id === 'leave' || (!here && mo.id !== 'morning')) return { mode: 'ember', look: L, why: 'ember: radar sees nobody' };
  if(mo.id === 'morning') return pp.sky ? { mode: 'ambient', look: { ...L, anim: 'sunrise', bri: 150 }, why: 'Sunrise look' } : { mode: 'ember', look: L, why: 'ember' };
  if(mo.id === 'arrive' && pp.story) return t < 6000 ? { mode: 'walk', cm: 450 - t / 6000 * 330, look: L, why: 'you walk up: the years light' } : { mode: 'climb', look: L, why: 'the climb' };
  if(mo.id === 'dinner' && pp.sync) return { mode: 'ambient', look: { ...L, anim: 'sync' }, why: 'Sync: music level from the ' + (pp.peers.length ? devName(SYS.devices.find(d => d.id === pp.peers[0])) : 'link') };
  if(mo.id === 'game' && pp.follow) { const climb = (t % 16000) > 900 && (t % 16000) < 12000 && peerShows('touchdown'); return climb ? { mode: 'climb', look: { ...L, c1: 0x00338d, c2: 0xc60c30 }, why: 'touchdown: the Panel sent climb' } : { mode: 'ambient', look: { ...L, anim: 'tide', c1: 0x00338d, c2: 0xc60c30 }, why: 'team colours from the screens' }; }
  if(mo.id === 'wind' && pp.sky) return { mode: 'ambient', look: { ...L, anim: 'sunset', bri: 90 }, why: 'Sunset look, low' };
  if(mo.id === 'wind') return { mode: 'ambient', look: { ...L, anim: 'candle', c1: 0xff8a30, c2: 0xff3a10, bri: 70 }, why: 'Candle, low' };
  if(mo.id === 'day' && pp.sky) return { mode: 'ambient', look: { ...L, anim: 'elemental' }, why: 'Elemental' };
  return { mode: 'ambient', look: L, why: PRIME.ANIM_NAMES[L.anim] };
}

// ARXI link messages for the moment, as Prime and ArxiLink.h send them
function linkLines(mo, t) {
  const out = [], hex = (c) => '#' + (c >>> 0 & 0xffffff).toString(16).toUpperCase().padStart(6, '0');
  for(const p of primes()) {
    const pp = S.plan.prime[p.id], here = mo.here.includes(p.room), peer = pp.peers[0] ? SYS.devices.find(d => d.id === pp.peers[0]) : displays()[0], pn = peer ? peer.type : 'bar';
    if(!pp.share && !pp.follow && !pp.sync) continue;
    if(pp.share) out.push(here ? `{"dev":"prime","ev":"presence","cm":${mo.id === 'arrive' ? Math.round(Math.max(120, 450 - t / 6000 * 330)) : 210}}` : `{"dev":"prime","ev":"away"}`);
    if(mo.id === 'arrive' && pp.story && t > 6000) out.push(`{"dev":"prime","ev":"climb","c1":"${hex(SYS.prime.c1)}","c2":"${hex(SYS.prime.c2)}"}`);
    if(mo.id === 'dinner' && pp.sync && peer) out.push(`{"dev":"${pn}","cmd":"level","lvl":${S.level.toFixed(2)}}`);
    if(mo.id === 'game' && pp.follow && peer) { out.push(`{"dev":"${pn}","cmd":"theme","c1":"#00338D","c2":"#C60C30"}`); if(t % 16000 > 900 && t % 16000 < 1600) out.push(`{"dev":"panel","cmd":"climb"}`); }
    if(mo.id === 'night' && pp.follow) out.push(`{"dev":"${pn}","cmd":"look","anim":"breathe","c1":"#FF8A30","c2":"#FF3A10","bri":30}`);
  }
  return out;
}

// ------------------------------------------------------------------ live state
const S = { plan: null, moment: 4, t: 0, playing: true, auto: true, runners: {}, level: 0, mod: null, fonts: null, log: [], tab: 'plan' };
const GAMMA = Array.from({ length: 256 }, (_, v) => Math.round(255 * Math.pow(v / 255, 0.72)));
function sound(t, music) {
  const band = new Array(16).fill(0); let level = 6;
  if(music) { const ph = (t / (60000 / 118)) % 1, kick = Math.exp(-ph * 7); for(let i = 0; i < 16; i++) { const n = Math.sin(t / 97 + i * 1.7) * 0.5 + Math.sin(t / 211 + i * 0.6) * 0.5; band[i] = Math.max(0, Math.min(255, (i < 4 ? 70 + 170 * kick : 40 + 90 * (0.5 + 0.5 * n) * (1 - i / 22)) * 0.85)); } level = Math.min(255, Math.round(band.reduce((a, b) => a + b, 0) / 16 * 1.1)); }
  return { band, level, music };
}
function paint(cv, px, w, h) {
  const off = cv._off || (cv._off = Object.assign(document.createElement('canvas'), { width: w, height: h }));
  const ctx = cv.getContext('2d'), oc = off.getContext('2d'), img = oc.createImageData(w, h);
  for(let i = 0, j = 0; i < w * h; i++, j += 3) { img.data[i * 4] = GAMMA[px[j]]; img.data[i * 4 + 1] = GAMMA[px[j + 1]]; img.data[i * 4 + 2] = GAMMA[px[j + 2]]; img.data[i * 4 + 3] = 255; }
  oc.putImageData(img, 0, 0); const cell = cv.width / w;
  ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.imageSmoothingEnabled = false; ctx.drawImage(off, 0, 0, cv.width, cv.height);
  ctx.globalCompositeOperation = 'lighter'; ctx.filter = `blur(${cell * 0.55}px)`; ctx.globalAlpha = 0.85; ctx.drawImage(off, 0, 0, cv.width, cv.height);
  ctx.filter = 'none'; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.strokeStyle = 'rgba(0,0,0,.28)'; ctx.lineWidth = 1; ctx.beginPath(); for(let x = 1; x < w; x++) { ctx.moveTo(x * cell, 0); ctx.lineTo(x * cell, cv.height); } for(let y = 1; y < h; y++) { ctx.moveTo(0, y * cell); ctx.lineTo(cv.width, y * cell); } ctx.stroke();
}

// one runner per screen: its own copy of the ARXIv2 firmware, or a concept app drawn with the same fonts
class Runner {
  constructor(dev, eng) { this.dev = dev; this.e = eng; this.key = null; this.t = 0; this.w = BAR_W; this.h = dev.type === 'bar' ? BAR_H : PAN_H; this.g = new Gfx(BAR_W, this.h, S.fonts); }
  load(c, mo) {
    this.c = c; this.key = c.key + '|' + mo.id; this.t = 0; this.fired = 0;
    if(c.dark) return;
    this.app = ARXI.apps.find(a => a.id === c.app); this.sit = this.app.situations[Math.min(c.sit, this.app.situations.length - 1)];
    this.fw = this.app.kind === 'firmware';
    if(this.fw) {
      const w = this.sit.world || {}, e = this.e; e.init(); e.set('EPOCH', c.sync ? at(2026, 11, 7, mo.h, mo.m) : (w.epoch || SAT(19, 42)));
      for(const [k, v] of Object.entries(w.set || {})) e.set(k, v); for(const [k, v] of Object.entries(w.text || {})) e.text(k, v); e.lyrics(w.lyrics || []);
      e.set('ROOM', 1); // each screen runs the app as its own (ROOM 2 would turn a Panel into a companion clock) e.set('HUB', SYS.hub ? 1 : 0);
      this.actions = [...(this.sit.actions || [])].sort((a, b) => a.at - b.at); this.music = !!((w.set || {}).MUSIC_PLAYING);
    }
  }
  step() {
    if(!this.c || this.c.dark) return;
    const t = this.t, len = this.sit.len || 20000;
    if(this.fw) {
      while(this.fired < this.actions.length && this.actions[this.fired].at <= t) { const a = this.actions[this.fired++];
        if(a.set) for(const [k, v] of Object.entries(a.set)) this.e.set(k, v); if(a.text) for(const [k, v] of Object.entries(a.text)) this.e.text(k, v);
        if(a.do === 'bar') this.e.barAction(a.a, a.p1, a.p2, t, a.text || ''); if(a.do === 'pan') this.e.panAction(a.a, a.p1, t); }
      for(const r of this.sit.ramps || []) if(t >= r.at) { const k = Math.min(1, (t - r.at) / r.over); this.e.set(r.key, Math.round(r.from + (r.to - r.from) * k)); }
      this.e.frame(t, sound(t, this.music));
    } else { this.g.clear(0); try { this.sit.draw(this.g, t, this.dev.type === 'bar' ? 'bar' : 'panel'); } catch(err) {} }
    this.t += STEP; if(this.t >= len) { const c = this.c; this.key = null; this.load(c, MOMENTS[S.moment]); }
  }
  pixels() {
    if(!this.c || this.c.dark) return new Uint8Array(this.w * this.h * 3);
    if(!this.fw) return this.g.px_;
    return this.dev.type === 'bar' ? this.e.barPixels() : this.e.panPixels();
  }
}

async function ensureRunners() {
  for(const d of displays()) if(!S.runners[d.id]) {
    const inst = await WebAssembly.instantiate(S.mod, { wasi_snapshot_preview1: wasiStub });
    S.runners[d.id] = new Runner(d, new Engine(inst.exports, d.id));
  }
  for(const p of primes()) if(!S.runners[p.id]) S.runners[p.id] = { prime: new PRIME.Prime(), dev: p };
  for(const id of Object.keys(S.runners)) if(!SYS.devices.find(d => d.id === id)) delete S.runners[id];
  for(const d of SYS.devices) S.runners[d.id].dev = d;
}

// ------------------------------------------------------------------ UI: kit
const iconHtml = (n, s = 15) => typeof icon === 'function' ? icon(n, s) : '';
function renderKit() {
  const box = $('kit'); box.innerHTML = '';
  for(const d of SYS.devices) {
    const T = TYPES[d.type];
    const tierSel = Object.keys(T.tiers).length > 1 ? el('select', { 'aria-label': 'Tier', on: { change: (e) => { d.tier = e.target.value; changed(); } } }, ...Object.keys(T.tiers).map(k => el('option', { value: k, text: k === 'lite' ? 'Lite' : 'Pro', selected: d.tier === k }))) : el('span', { class: 'kt', text: d.type === 'prime' ? 'Art piece' : 'Pro' });
    const roomSel = el('select', { 'aria-label': 'Room', on: { change: (e) => { d.room = e.target.value; changed(); } } }, ...ROOMS.map(([k, n]) => el('option', { value: k, text: n, selected: d.room === k })));
    box.append(el('div', { class: 'kchip', 'data-type': d.type },
      el('span', { class: 'kic', html: iconHtml(T.icon, 16) }),
      el('div', { class: 'kbody' }, el('b', { text: T.name }), el('small', { text: T.size })),
      roomSel, tierSel,
      el('button', { class: 'kx', title: 'Remove', 'aria-label': 'Remove ' + T.name, html: '×', on: { click: () => { SYS.devices = SYS.devices.filter(x => x !== d); changed(); } } })));
  }
  const add = (type, tier, label) => el('button', { class: 'hbtn', on: { click: () => { SYS.devices.push(mkDev(type, tier, primes().length && type !== 'prime' ? primes()[0].room : 'living')); changed(); } } }, '+ ' + label);
  box.append(el('div', { class: 'kadd' }, add('bar', 'pro', 'Bar'), add('panel', 'pro', 'Panel'), primes().length ? null : add('prime', 'art', 'Prime')));
  $('hubTog').checked = SYS.hub; $('spk').value = SYS.speaker;
  const cost = displays().reduce((a, d) => a + (TYPES[d.type].tiers[d.tier] || 0), 0) + (SYS.hub ? HUB_COST : 0);
  $('cost').textContent = displays().length ? `$${cost} list${primes().length ? ' + Prime' : ''}` : primes().length ? 'Prime only' : '';
}
function changed() { save(); S.plan = plan(); ensureRunners().then(() => { buildStage(); for(const r of Object.values(S.runners)) if(r.key !== undefined) r.key = null; }); renderKit(); renderScore(); renderTab(); }

// ------------------------------------------------------------------ UI: score
function renderScore() {
  const P = S.plan, k = P.score / 100, col = P.score >= 80 ? 'var(--ok)' : P.score >= 60 ? 'var(--accent)' : '#d64545';
  $('score').innerHTML = `<svg viewBox="0 0 44 44" width="58" height="58" aria-hidden="true"><circle cx="22" cy="22" r="18" fill="none" stroke="var(--line)" stroke-width="5"/><circle cx="22" cy="22" r="18" fill="none" stroke="${col}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(113 * k).toFixed(1)} 113" transform="rotate(-90 22 22)"/></svg><span><b>${P.score}</b><small>${P.score >= 80 ? 'Balanced' : P.score >= 60 ? 'Close' : 'Needs work'}</small></span>`;
  $('score').title = P.parts.map(([n, v, w]) => `${n}: ${Math.round(v * w)}/${w}`).join('\n');
}

// ------------------------------------------------------------------ UI: day strip and the house
function renderDay() {
  const box = $('day'); box.innerHTML = '';
  MOMENTS.forEach((m, i) => box.append(el('button', { 'aria-pressed': i === S.moment, on: { click: () => { S.moment = i; S.t = 0; S.auto = false; renderDay(); } } }, el('small', { text: m.time }), el('span', { text: m.name }))));
  $('playDay').innerHTML = iconHtml(S.playing ? 'pause' : 'play', 16) + (S.playing ? 'Pause' : 'Play the day');
}
function buildStage() {
  const box = $('house'); box.innerHTML = '';
  const rooms = [...new Set(SYS.devices.map(d => d.room))].sort((a, b) => ROOMS.findIndex(r => r[0] === a) - ROOMS.findIndex(r => r[0] === b));
  if(!rooms.length) { box.append(el('p', { class: 'hint', text: 'Add a Bar, a Panel or Prime above to start.' })); return; }
  for(const r of rooms) {
    const card = el('section', { class: 'room' + (SYS.devices.filter(d => d.room === r).length > 2 ? ' wide' : ''), 'data-room': r }, el('header', {}, el('b', { text: roomName(r) }), el('span', { class: 'who', id: 'who-' + r })));
    const row = el('div', { class: 'rdevs' });
    for(const d of SYS.devices.filter(d => d.room === r)) {
      const cv = d.type === 'prime' ? el('canvas', { width: 360, height: 276, class: 'primecv' }) : el('canvas', { width: d.type === 'bar' ? 528 : 440, height: d.type === 'bar' ? 132 : 220 });
      row.append(el('figure', { class: 'rdev dev-' + d.type + (d.finish === 'white' && d.type !== 'prime' ? ' white' : '') },
        el('div', { class: d.type === 'prime' ? 'primebox' : 'bezel' }, cv),
        el('figcaption', {}, el('b', { text: devName(d) }), el('span', { id: 'why-' + d.id }))));
      S.runners[d.id] && (S.runners[d.id].cv = cv);
      cv.dataset.dev = d.id;
    }
    card.append(row); box.append(card);
  }
}

// ------------------------------------------------------------------ UI: tabs (less is more: one open at a time)
function renderTab() {
  document.querySelectorAll('.stabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.t === S.tab));
  const p = $('tabPane'); p.innerHTML = '';
  ({ plan: renderPlan, balance: renderBalance, link: renderLink, export: renderExport })[S.tab](p);
}
function renderPlan(p) {
  const P = S.plan;
  p.append(el('div', { class: 'focus' }, ...FOCUS_AREAS.map(([k, n, line]) => el('label', { class: 'fslider', title: line }, el('span', { text: n }),
    el('input', { type: 'range', min: 0, max: 3, step: 1, value: SYS.focus[k], 'aria-label': n + ' priority', on: { input: (e) => { SYS.focus[k] = +e.target.value; changed(); } } }),
    el('small', { text: ['Off', 'Low', 'Normal', 'High'][SYS.focus[k]] })))));
  p.append(el('p', { class: 'hint', text: 'Priorities steer the auto-balance. Pin any feature to a device, or turn it off. Everything else is placed for you.' }));
  for(const [k, n] of FOCUS_AREAS) {
    const rows = FEATURES.filter(f => f.focus === k && (f.kind !== 'prime' || primes().length));
    const det = el('details', { class: 'fgroup', open: k === 'info' || undefined }, el('summary', {}, el('b', { text: n }), el('small', { text: `${rows.filter(f => (P.placed[f.id] || []).length || (f.kind === 'prime' && primes().length && featOn(f) && !needsOk(f, primes()[0]))).length} of ${rows.length} in use` })));
    const tbl = el('div', { class: 'ftable' });
    for(const f of rows) {
      const opts = [['auto', 'Auto'], ['off', 'Off'], ...(f.kind === 'prime' ? [] : SYS.devices.filter(d => (f.fit[d.type] || 0) > 0).map(d => [d.id, 'Pin: ' + devName(d)]))];
      const where = f.kind === 'sense' ? (featOn(f) ? displays().filter(d => P.stats[d.id] && P.stats[d.id].sleeps).map(devName).join(', ') || 'no screen has presence' : 'off') : f.kind === 'prime' ? (primes().length ? (featOn(f) ? (needsOk(f, primes()[0]) || 'Prime') : 'off') : '') : (P.placed[f.id] || []).map(id => devName(SYS.devices.find(d => d.id === id))).join(', ') || (featOn(f) ? 'not placed' : 'off');
      tbl.append(el('div', { class: 'frow' },
        el('div', {}, el('b', { text: f.name }), el('small', { text: f.note || (f.kind === 'layer' ? `Takes over: ${MOMENTS.find(m => m.id === f.moment).name}` : f.kind === 'sense' ? 'Uses presence' : 'In the rotation') + (f.needs ? ' · ' + f.needs.filter(n => !['link', 'level'].includes(n)).map(n => ({ speaker: 'speaker', pro: 'Pro', presence: 'presence' })[n]).join(', ') : '') })),
        el('div', { class: 'fit' }, ...['bar', 'panel', 'prime'].filter(t => f.fit[t] !== undefined).map(t => el('span', { title: `${TYPES[t].name}: ${['can\'t', 'works', 'good', 'made for it'][f.fit[t]]}`, class: 'dots', text: TYPES[t].name.replace('ARXI ', '') + ' ' + '●'.repeat(f.fit[t]) + '○'.repeat(3 - f.fit[t]) }))),
        el('span', { class: 'where' + (where === 'not placed' || where.startsWith('needs') ? ' warn' : ''), text: where }),
        el('select', { 'aria-label': f.name + ' placement', on: { change: (e) => { SYS.feat[f.id] = e.target.value; changed(); } } }, ...opts.map(([v, t]) => el('option', { value: v, text: t, selected: (SYS.feat[f.id] || 'auto') === v })))));
    }
    det.append(tbl); p.append(det);
  }
  if(primes().length) {
    const pr = SYS.prime;
    p.append(el('details', { class: 'fgroup' }, el('summary', {}, el('b', { text: 'Prime look' }), el('small', { text: 'Its everyday light, when nothing else is leading' })),
      el('div', { class: 'plook' },
        el('label', {}, 'Animation ', el('select', { on: { change: (e) => { pr.anim = e.target.value; save(); } } }, ...PRIME.ANIMS.filter(a => a !== 'sync').map(a => el('option', { value: a, text: PRIME.ANIM_NAMES[a], selected: pr.anim === a })))),
        ...[['c1', 'Main'], ['c2', 'Accent'], ['c3', 'Ember']].map(([k, n]) => el('label', {}, n + ' ', el('input', { type: 'color', value: '#' + pr[k].toString(16).padStart(6, '0'), on: { input: (e) => { pr[k] = parseInt(e.target.value.slice(1), 16); save(); } } }))),
        el('label', {}, 'Brightness ', el('input', { type: 'range', min: 20, max: 255, value: pr.bri, on: { input: (e) => { pr.bri = +e.target.value; save(); } } })))));
  }
}
function renderBalance(p) {
  const P = S.plan;
  p.append(el('div', { class: 'parts' }, ...P.parts.map(([n, v, w, line]) => el('div', { class: 'part' }, el('div', {}, el('b', { text: n }), el('small', { text: line })), el('div', { class: 'pbar' }, el('i', { style: `width:${Math.round(v * 100)}%` })), el('span', { text: `${Math.round(v * w)}/${w}` })))));
  const D = displays();
  if(D.length) {
    const t = el('table', { class: 'results' }, el('thead', {}, el('tr', {}, el('th', { text: 'Screen' }), el('th', { text: 'Rotation' }), ...MOMENTS.filter(m => D.some(d => P.layer[d.id][m.id] || P.brief[d.id][m.id])).map(m => el('th', { text: m.name })))));
    const tb = el('tbody'); for(const d of D) tb.append(el('tr', {}, el('td', { text: devName(d) }), el('td', { text: P.rot[d.id].map(id => FT[id].name).join(' → ') }), ...MOMENTS.filter(m => D.some(x => P.layer[x.id][m.id] || P.brief[x.id][m.id])).map(m => el('td', { text: [P.brief[d.id][m.id], P.layer[d.id][m.id]].filter(Boolean).map(id => FT[id].name).join(' then ') || '—' }))));
    t.append(tb); p.append(el('div', { class: 'tablewrap' }, t));
  }
  p.append(el('h3', { text: P.issues.length ? 'Suggestions' : 'Nothing to fix. This kit is balanced.' }));
  for(const i of P.issues) p.append(el('div', { class: 'sugg ' + i.level }, el('span', { text: i.msg }), i.fix ? el('button', { class: 'btn primary', on: { click: () => { i.fix.run(); changed(); } } }, i.fix.label) : null));
}
function renderLink(p) {
  p.append(el('p', { class: 'hint', html: 'What Prime and the screens say to each other on your Wi-Fi: small JSON lines on UDP multicast <code>239.255.42.91:4291</code> (<code>ArxiLink.h</code>). No hub needed for this part.' }));
  p.append(el('pre', { class: 'code', id: 'linkLog', text: primes().length ? '' : 'Add Prime to see the link in use.' }));
}
function configJson() {
  const P = S.plan;
  return JSON.stringify({ arxi: 'home-system', version: 1, hub: SYS.hub, speaker: SYS.speaker, focus: SYS.focus,
    devices: SYS.devices.map(d => { const o = { id: d.id, name: devName(d), type: d.type, size: d.type === 'bar' ? '44x11' : d.type === 'panel' ? '44x22' : 'prime', tier: d.tier, room: d.room };
      if(d.type === 'prime') { const pp = P.prime[d.id]; o.link = { follow: pp.follow, share: pp.share }; o.look = { anim: SYS.prime.anim, c1: SYS.prime.c1, c2: SYS.prime.c2, c3: SYS.prime.c3, bri: SYS.prime.bri }; o.features = Object.entries(pp).filter(([k, v]) => v === true).map(([k]) => k); }
      else { o.rotation = P.rot[d.id].map(id => ({ app: FT[id].app, dwell_s: DWELL / 1000 })); o.moments = Object.fromEntries(Object.entries(P.layer[d.id]).map(([m, f]) => [m, FT[f].app])); o.popups = Object.fromEntries(Object.entries(P.brief[d.id]).map(([m, f]) => [m, FT[f].app])); o.sleepWhenEmpty = P.stats[d.id].sleeps; o.presenceFrom = d.tier === 'pro' ? 'own' : primeShares(d.room) ? 'prime' : 'none'; }
      return o; }), overrides: SYS.feat }, null, 2);
}
function renderExport(p) {
  const json = configJson();
  p.append(el('p', { class: 'hint', text: 'The balanced setup as one file: what each device rotates through, who leads each moment, and Prime\'s link and look. Load it back here, or use it as the hub\'s setup.' }));
  p.append(el('div', { class: 'btns' },
    el('button', { class: 'btn primary', on: { click: () => { const a = el('a', { href: URL.createObjectURL(new Blob([json], { type: 'application/json' })), download: 'arxi-home.json' }); a.click(); } } }, 'Download arxi-home.json'),
    el('button', { class: 'btn', on: { click: (e) => { navigator.clipboard && navigator.clipboard.writeText(json); e.target.textContent = 'Copied'; } } }, 'Copy'),
    el('label', { class: 'btn' }, 'Load a file', el('input', { type: 'file', accept: '.json', hidden: true, on: { change: async (e) => { try { const j = JSON.parse(await e.target.files[0].text()); importJson(j); } catch(err) { alert('That file is not an ARXI Home setup.'); } } } })),
    el('button', { class: 'btn', on: { click: () => { if(confirm('Start over with the default kit?')) { SYS = defaults(); changed(); } } } }, 'Reset')));
  p.append(el('details', {}, el('summary', { text: 'Show the file' }), el('pre', { class: 'code', text: json })));
}
function importJson(j) {
  if(j.arxi !== 'home-system') throw new Error('not ours');
  SYS.hub = !!j.hub; SYS.speaker = j.speaker || 'sonos'; SYS.focus = { ...SYS.focus, ...(j.focus || {}) }; SYS.feat = j.overrides || {};
  SYS.devices = j.devices.map(d => ({ id: d.id, type: d.type, tier: d.tier, room: d.room, finish: d.type === 'prime' ? 'white' : 'black' }));
  const pr = j.devices.find(d => d.type === 'prime'); if(pr && pr.look) SYS.prime = { ...SYS.prime, ...pr.look };
  uid = 1 + Math.max(0, ...SYS.devices.map(d => +d.id.slice(1) || 0)); changed();
}

// ------------------------------------------------------------------ main loop
let lastTs = 0, acc = 0, ui = 0;
function tick(ts) {
  const dt = Math.min(200, ts - (lastTs || ts)); lastTs = ts;
  const mo = MOMENTS[S.moment];
  if(S.playing) {
    acc += dt; let n = 0;
    while(acc >= STEP && n < 10) { acc -= STEP; n++; S.t += STEP;
      for(const d of displays()) { const r = S.runners[d.id]; if(!r || !r.e) continue; const c = content(d, mo, S.t); if(!r.key || r.key !== c.key + '|' + mo.id) r.load(c, mo); r.step(); }
      if(S.t >= MOMENT_MS && S.auto) { S.moment = (S.moment + 1) % MOMENTS.length; S.t = 0; renderDay(); }
      else if(S.t >= MOMENT_MS) S.t = 0;
    }
  }
  const snd = sound(S.t, mo.music); S.level = Math.min(1, snd.level / 200);
  for(const p of primes()) { const r = S.runners[p.id]; if(!r) continue; const st = primeState(p, MOMENTS[S.moment], S.t); r.prime.setLook(st.look); r.prime.setMode(st.mode); if(st.cm) r.prime.cm = st.cm; r.prime.level = S.level; if(S.playing) r.prime.step(dt); r.st = st; }
  for(const d of SYS.devices) { const r = S.runners[d.id]; const cv = document.querySelector(`canvas[data-dev="${d.id}"]`); if(!r || !cv) continue;
    if(d.type === 'prime') r.prime.draw(cv, true); else paint(cv, r.pixels(), BAR_W, d.type === 'bar' ? BAR_H : PAN_H); }
  if(++ui % 8 === 0) {
    const mo2 = MOMENTS[S.moment];
    for(const d of SYS.devices) { const w = $('why-' + d.id); if(!w) continue; if(d.type === 'prime') { const r = S.runners[d.id]; w.textContent = r && r.st ? r.st.why : ''; } else { const c = content(d, mo2, S.t); w.textContent = c.dark ? c.why : `${FT[c.fid].name} · ${c.why}`; } }
    for(const r of new Set(SYS.devices.map(d => d.room))) { const w = $('who-' + r); if(w) w.textContent = mo2.here.includes(r) ? 'someone here' : 'empty'; }
    $('mclock').textContent = `${mo2.time} · ${mo2.name}`; $('mbar').style.width = (S.t / MOMENT_MS * 100) + '%';
    const lg = $('linkLog'); if(lg && primes().length) { const lines = linkLines(mo2, S.t); S.seen = S.seen || {}; for(const l of lines) { const k = l.replace(/"(lvl|cm)":[\d.]+/, ''); const lvl = l.includes('"level"'); if(!lvl && S.seen[k] === mo2.id) continue; if(lvl && ui % 48) continue; S.seen[k] = mo2.id; S.log.push(`${mo2.time.padEnd(8)} ${l}`); } S.log = S.log.slice(-14); lg.textContent = S.log.join('\n') || '(quiet)'; }
  }
  requestAnimationFrame(tick);
}

// ------------------------------------------------------------------ boot
(async function boot() {
  document.querySelectorAll('[data-ic]').forEach(e => e.insertAdjacentHTML('afterbegin', iconHtml(e.dataset.ic, 15)));
  if(typeof eelMark === 'function') $('eelMark').innerHTML = eelMark();
  const back = document.querySelector('.segback'); if(back) { back.href = './'; back.title = 'Back to the Home simulator'; }
  const bytes = Uint8Array.from(atob(window.ARXI_WASM.proposed), c => c.charCodeAt(0));
  S.mod = await WebAssembly.compile(bytes);
  const first = new Engine((await WebAssembly.instantiate(S.mod, { wasi_snapshot_preview1: wasiStub })).exports, 'fonts');
  S.fonts = first.fonts();
  $('hubTog').onchange = (e) => { SYS.hub = e.target.checked; changed(); };
  $('spk').onchange = (e) => { SYS.speaker = e.target.value; changed(); };
  $('preset').onchange = (e) => { const pr = PRESETS[e.target.value]; if(pr) { SYS.devices = pr.devices.map(d => mkDev(...d)); SYS.hub = pr.hub; changed(); } e.target.value = ''; };
  $('playDay').onclick = () => { S.playing = !S.playing; S.auto = true; renderDay(); };
  document.querySelectorAll('.stabs button').forEach(b => b.onclick = () => { S.tab = b.dataset.t; renderTab(); });
  S.plan = plan(); await ensureRunners(); renderKit(); renderScore(); renderDay(); buildStage(); renderTab();
  $('loading').hidden = true;
  requestAnimationFrame(tick);
})();
