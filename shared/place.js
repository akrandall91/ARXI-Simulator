// ===================================================================== ARXI Lab: Place (where the screens hang)
// Puts the two screens in a room or outdoors, lit by the simulated time of day, room light and weather, so you can judge
// how a design reads where it will live: across a living room at night, at a bus stop at noon, in a shop window.
const PLACES = [
  { id: 'bench', name: 'Workbench', icon: 'wrench' },
  { id: 'living', name: 'Living room', icon: 'home' },
  { id: 'bedroom', name: 'Bedroom', icon: 'moon' },
  { id: 'pub', name: 'Bar', icon: 'trophy' },
  { id: 'cafe', name: 'Coffee shop counter', icon: 'store' },
  { id: 'cave', name: 'Man cave', icon: 'trophy' },
  { id: 'yard', name: 'Backyard', icon: 'sun' },
  { id: 'busstop', name: 'Bus stop', icon: 'bus' },
  { id: 'park', name: 'Park kiosk', icon: 'tree' },
  { id: 'store', name: 'Shop window', icon: 'store' },
];
const DISTANCES = [{ id: 1, name: 'Up close' }, { id: 0.72, name: 'Across the room' }, { id: 0.5, name: 'From the street' }, { id: 0.34, name: 'Far away' }];
const P = { place: 'bench', dist: 1, key: '' };

function placeInit() {
  P.place = store.get('place', 'bench'); P.dist = store.get('dist', 1);
  if(!PLACES.some(p => p.id === P.place)) P.place = 'bench'; // a place from another section
  const stage = document.querySelector('.stage');
  stage.insertAdjacentHTML('afterbegin', '<div id="sceneBg" aria-hidden="true"></div><div id="sceneFx" aria-hidden="true"></div>');
  const sel = el('select', { id: 'placeSel', 'aria-label': 'Place' }, ...PLACES.map(p => el('option', { value: p.id, text: p.name, selected: p.id === P.place })));
  const dist = el('select', { id: 'distSel', 'aria-label': 'Viewing distance' }, ...DISTANCES.map(d => el('option', { value: d.id, text: d.name, selected: d.id === P.dist })));
  const mount = el('select', { id: 'mountSel', 'aria-label': 'Screens installed' }, ...[[0, 'Bar + Panel'], [1, 'Bar only'], [2, 'Panel only']].map(([v, n]) => el('option', { value: v, text: n, selected: (S.room === 3 ? 0 : S.room) === v })));
  mount.onchange = () => { $('roomSel').value = mount.value; $('roomSel').onchange({ target: $('roomSel') }); P.key = ''; placeUpdate(true); };
  sel.onchange = () => { P.place = sel.value; store.set('place', P.place); P.key = ''; placeUpdate(true); if(typeof renderAppList === 'function' && $('appSearch')) renderAppList(); };
  dist.onchange = () => { P.dist = +dist.value; store.set('dist', P.dist); P.key = ''; placeUpdate(true); };
  const bs = el('select', { id: 'barSpotSel', 'aria-label': 'Where the Bar goes' }), ps = el('select', { id: 'panSpotSel', 'aria-label': 'Where the Panel goes' });
  const spotChange = () => { store.set('spot:' + P.place, [+bs.value, +ps.value]); P.key = ''; placeUpdate(true); };
  bs.onchange = ps.onchange = spotChange;
  stage.prepend(el('div', { class: 'placebar' }, el('label', { class: 'psel', for: 'placeSel', html: icon('screens', 14) + '<span>Place</span>' }), sel, el('label', { class: 'psel', for: 'distSel', html: icon('eye', 14) + '<span>View</span>' }), dist, el('label', { class: 'psel', for: 'mountSel', html: icon('columns', 14) + '<span>Screens</span>' }), mount,
    el('span', { class: 'spots', id: 'spotsBox' }, el('label', { class: 'psel', for: 'barSpotSel', id: 'barSpotLbl', html: '<span>Bar spot</span>' }), bs, el('label', { class: 'psel', for: 'panSpotSel', id: 'panSpotLbl', html: '<span>Panel spot</span>' }), ps)));
  placeUpdate(true);
}

// light: 0 night .. 1 noon, with the sun's colour at the edges of the day
function daylight() {
  const ep = (S.work ? S.work.epoch : 0) + Math.floor((S.sim || 0) / 1000), h = (ep % 86400) / 3600;
  const sun = Math.max(0, Math.sin((h - 6.2) / 13.0 * Math.PI)); // up about 6:12, down about 19:12
  const edge = sun > 0 && sun < 0.35 ? 1 - sun / 0.35 : 0;      // golden hour
  return { h, sun, edge, night: sun <= 0 };
}
const mixHex = (a, b, k) => { k = Math.max(0, Math.min(1, k)); const p = (x, s) => parseInt(x.slice(s, s + 2), 16); const c = (s) => Math.round(p(a, s) * (1 - k) + p(b, s) * k).toString(16).padStart(2, '0'); return '#' + c(1) + c(3) + c(5); };
function skyColours(L, wx) {
  const overcast = wx >= 3 && wx !== 0 ? 0.55 : 0;
  let top = mixHex('#070b1d', '#3d8fe0', L.sun), bot = mixHex('#141a33', '#bfe0ff', L.sun);
  if(L.edge) { top = mixHex(top, '#4b3a78', L.edge * 0.7); bot = mixHex(bot, '#ff9a5a', L.edge * 0.85); }
  if(overcast) { top = mixHex(top, mixHex('#2b3038', '#9aa3ad', L.sun), overcast); bot = mixHex(bot, mixHex('#30353c', '#c5cbd2', L.sun), overcast); }
  return { top, bot };
}

function placeUpdate(force) {
  const stage = document.querySelector('.stage'); if(!stage || !S.work) return;
  const L = daylight(), wx = S.work.set.WX_ON === 0 ? 0 : (S.work.set.WX_CODE ?? 2), roomLight = S.work.set.ROOM_LIGHT ?? 60, dark = !!S.work.set.ROOM_DARK;
  const is3d = ['busstop', 'park', 'living', 'bedroom', 'pub', 'cafe', 'cave', 'yard'].includes(P.place) && typeof Scene3D !== 'undefined' && !Scene3D.failed;
  const key = [P.place, P.dist, Math.round(L.h * 6), wx, roomLight, dark, S.room, S.finish, JSON.stringify(store.get('spot:' + P.place, [0, 0]))].join('|');
  if(!force && key === P.key) return; P.key = key;
  stage.classList.toggle('is3d', is3d);
  const spots = is3d && Scene3D.spots(P.place), saved = store.get('spot:' + P.place, [0, 0]);
  $('spotsBox').hidden = !spots;
  if(spots) {
    const fill = (sel, list, v, show) => { if(sel._for !== P.place) { sel.innerHTML = ''; list.forEach((sp, i) => sel.append(el('option', { value: i, text: sp.n }))); sel._for = P.place; } sel.value = String(Math.min(v, list.length - 1)); sel.hidden = !show; };
    fill($('barSpotSel'), spots.bar, saved[0], S.room !== 2); fill($('panSpotSel'), spots.pan, saved[1], S.room !== 1);
    $('barSpotLbl').hidden = S.room === 2; $('panSpotLbl').hidden = S.room === 1;
  }
  if(is3d) { // the outdoor sites are rendered in 3D (scene3d.js); the 2D screens keep drawing and become its textures
    const o = { hour: L.h, wx, dist: P.dist, room: S.room, finish: S.finish, roomLight, dark, barSpot: spots ? +$('barSpotSel').value : 0, panSpot: spots ? +$('panSpotSel').value : 0 };
    Scene3D.show(P.place, o, stage).then(ok => { if(!ok) { stage.classList.remove('is3d'); P.key = ''; placeUpdate(true); } else Scene3D.update(o); });
    $('sceneBg').innerHTML = ''; $('sceneFx').className = ''; stage.dataset.place = P.place; stage.style.setProperty('--wash', 0);
    const indoor = ['living', 'bedroom', 'pub', 'cafe', 'cave'].includes(P.place), lbl = $('placeNote'), note = placeNote(L, indoor ? Math.min(1, (dark ? 0 : roomLight / 100) * 0.35 + L.sun * 0.25) : outdoorWash(L, wx), !indoor) + ' · drag to look around';
    if(lbl) lbl.textContent = note; else stage.querySelector('.placebar').append(el('span', { id: 'placeNote', class: 'pnote', text: note }));
    return;
  }
  if(typeof Scene3D !== 'undefined') Scene3D.hide();
  stage.dataset.place = P.place; stage.style.setProperty('--dist', P.dist);
  const outdoor = ['busstop', 'park', 'store', 'yard'].includes(P.place);
  // how washed out the LEDs look: full sun outdoors makes them hard to read, a bright room a little
  const ambient = P.place === 'bench' ? 0 : outdoor ? L.sun * (wx >= 3 ? 0.6 : 1) * (P.place === 'store' ? 0.75 : 1) : Math.min(1, (dark ? 0 : roomLight / 100) * 0.35 + L.sun * 0.25);
  stage.style.setProperty('--wash', ambient.toFixed(2));
  $('sceneBg').innerHTML = P.place === 'bench' ? '' : sceneSvg(P.place, L, wx, roomLight, dark);
  $('sceneFx').className = P.place !== 'bench' && outdoor ? (wx >= 95 ? 'fx-storm' : wx >= 71 && wx < 80 ? 'fx-snow' : wx >= 51 ? 'fx-rain' : wx === 45 ? 'fx-fog' : '') : '';
  const lbl = $('placeNote'); const note = placeNote(L, ambient, outdoor);
  if(lbl) lbl.textContent = note; else stage.querySelector('.placebar').append(el('span', { id: 'placeNote', class: 'pnote', text: note }));
}
function outdoorWash(L, wx) { return L.sun * (wx >= 3 ? 0.6 : 1); }
function placeNote(L, wash, outdoor) {
  if(P.place === 'bench') return '';
  const hh = Math.floor(L.h), mm = Math.floor((L.h - hh) * 60), t = `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
  const read = wash > 0.7 ? 'hard to read in full sun' : wash > 0.4 ? 'some glare' : L.night ? 'night: the screens are the brightest thing here' : 'easy to read';
  return `${t} · ${read}`;
}

// ------------------------------------------------------------------ the scenes (SVG, 1000 x 600, sliced to fill)
function sceneSvg(place, L, wx, roomLight, dark) {
  const sky = skyColours(L, wx), wrap = (body) => `<svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" width="100%" height="100%"><defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky.top}"/><stop offset="1" stop-color="${sky.bot}"/></linearGradient>
    <radialGradient id="lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".55"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient></defs>${body}</svg>`;
  if(place === 'living' || place === 'bedroom') {
    const lit = dark ? 0.08 : Math.max(L.sun * 0.55, roomLight / 100 * 0.8, 0.12), lampOn = !dark && L.sun < 0.4;
    const wall = mixHex('#14161b', place === 'living' ? '#d9cfc0' : '#b9c4cf', lit), floor = mixHex('#0d0e10', '#8a6a4a', lit), wood = mixHex('#120d09', '#6b4a2e', lit), fabric = mixHex('#0c0d10', place === 'living' ? '#4f6b7a' : '#7a5f6b', lit);
    const win = `<rect x="745" y="70" width="190" height="230" rx="6" fill="url(#sky)"/><path d="M840 70v230M745 185h190" stroke="${mixHex('#222222', '#f4efe6', lit)}" stroke-width="8"/><rect x="745" y="70" width="190" height="230" rx="6" fill="none" stroke="${mixHex('#222222', '#f4efe6', lit)}" stroke-width="10"/>
      ${L.sun > 0 ? `<circle cx="${790 + L.h * 6}" cy="${260 - L.sun * 150}" r="16" fill="#fff4cf" opacity=".9"/>` : `<circle cx="900" cy="110" r="10" fill="#e8ecff" opacity=".8"/>`}`;
    const lamp = place === 'living' ? `<g><path d="M95 470V210" stroke="${mixHex('#111111', '#3a3a3a', lit)}" stroke-width="7"/><path d="M55 210h80l-18-60h-44z" fill="${lampOn ? '#ffe2b0' : mixHex('#1a1a1a', '#e9e2d6', lit)}"/>${lampOn ? '<circle cx="95" cy="200" r="190" fill="url(#lamp)"/>' : ''}</g>`
      : `<g><rect x="60" y="400" width="90" height="70" rx="6" fill="${wood}"/><path d="M105 400v-50" stroke="${mixHex('#111111', '#555555', lit)}" stroke-width="5"/><path d="M80 350h50l-10-35h-30z" fill="${lampOn ? '#ffe2b0' : mixHex('#1a1a1a', '#e9e2d6', lit)}"/>${lampOn ? '<circle cx="105" cy="335" r="140" fill="url(#lamp)"/>' : ''}</g>`;
    const furniture = place === 'living'
      ? `<rect x="250" y="470" width="500" height="40" rx="6" fill="${wood}"/><rect x="270" y="510" width="16" height="40" fill="${wood}"/><rect x="714" y="510" width="16" height="40" fill="${wood}"/>
         <path d="M140 600v-70q0-30 30-30h660q30 0 30 30v70z" fill="${fabric}"/><path d="M175 600v-55q0-18 18-18h614q18 0 18 18v55z" fill="${mixHex('#000000', fabric, 0.85)}"/>
         <g transform="translate(870 400)"><rect x="-22" y="40" width="44" height="60" rx="6" fill="${mixHex('#120d09', '#9a7b5a', lit)}"/><path d="M0 40c-40-30-30-80 0-110c30 30 40 80 0 110z" fill="${mixHex('#081008', '#3f7a43', lit)}"/></g>`
      : `<path d="M180 600v-60q0-25 25-25h590q25 0 25 25v60z" fill="${fabric}"/><rect x="230" y="520" width="200" height="34" rx="14" fill="${mixHex('#111111', '#ece6dc', lit)}"/><rect x="570" y="520" width="200" height="34" rx="14" fill="${mixHex('#111111', '#ece6dc', lit)}"/>`;
    return wrap(`<rect width="1000" height="600" fill="${wall}"/>${win}<rect y="545" width="1000" height="55" fill="${floor}"/><rect y="540" width="1000" height="8" fill="${mixHex('#111111', '#efe9df', lit)}"/>${lamp}${furniture}<rect width="1000" height="600" fill="url(#shade)"/>`);
  }
  const ground = mixHex('#0a0b0d', '#9a9790', L.sun * (wx >= 3 ? 0.7 : 1)), metal = mixHex('#0e1014', '#5c6570', Math.max(L.sun, 0.15)), dim = Math.max(L.sun, 0.12);
  const stars = L.night ? Array.from({ length: 40 }, (_, i) => `<circle cx="${(i * 97) % 1000}" cy="${(i * 53) % 260}" r="${i % 3 ? 1 : 1.6}" fill="#fff" opacity=".7"/>`).join('') : '';
  const sun = L.sun > 0 && wx < 3 ? `<circle cx="${80 + (L.h - 6) / 13 * 840}" cy="${330 - L.sun * 280}" r="26" fill="#fff6d0" opacity=".95"/>` : '';
  const city = Array.from({ length: 14 }, (_, i) => { const w = 50 + (i * 37) % 40, hgt = 80 + (i * 71) % 140, x = i * 75 - 20; const win = L.night || L.edge > 0.5 ? Array.from({ length: 6 }, (_, k) => `<rect x="${x + 8 + (k % 3) * 14}" y="${430 - hgt + 14 + Math.floor(k / 3) * 22}" width="6" height="8" fill="#ffd27a" opacity="${(i + k) % 3 ? .9 : .2}"/>`).join('') : '';
    return `<rect x="${x}" y="${430 - hgt}" width="${w}" height="${hgt}" fill="${mixHex('#0b0d14', '#7d8896', dim * 0.8)}"/>${win}`; }).join('');
  const person = (x, s = 1) => `<g transform="translate(${x} 470) scale(${s})" fill="${mixHex('#050608', '#2d3440', dim)}"><circle cx="0" cy="-118" r="13"/><path d="M-16-102h32l6 60h-8l-2 52h-10l-2-48h-2l-2 48h-10l-2-52h-8z"/></g>`;
  if(place === 'busstop') return wrap(`<rect width="1000" height="600" fill="url(#sky)"/>${stars}${sun}${city}
    <rect y="430" width="1000" height="40" fill="${mixHex('#08090b', '#55575c', dim)}"/><rect y="470" width="1000" height="130" fill="${ground}"/><rect y="466" width="1000" height="6" fill="${mixHex('#111111', '#d9d6cf', dim)}"/>
    <rect x="40" y="18" width="920" height="26" rx="4" fill="${metal}"/><rect x="40" y="40" width="920" height="6" fill="${mixHex('#000000', '#2a2f36', dim)}"/>
    <rect x="58" y="44" width="14" height="430" fill="${metal}"/><rect x="928" y="44" width="14" height="430" fill="${metal}"/>
    <rect x="72" y="60" width="150" height="400" fill="${mixHex('#0d1a24', '#a8d4ec', dim)}" opacity=".18"/><rect x="778" y="60" width="150" height="400" fill="${mixHex('#0d1a24', '#a8d4ec', dim)}" opacity=".18"/>
    <rect x="300" y="430" width="400" height="14" rx="4" fill="${metal}"/><rect x="320" y="444" width="10" height="28" fill="${metal}"/><rect x="670" y="444" width="10" height="28" fill="${metal}"/>
    ${person(160, 1.1)}${person(860, 1)}<rect width="1000" height="600" fill="url(#shade)"/>`);
  if(place === 'park') return wrap(`<rect width="1000" height="600" fill="url(#sky)"/>${stars}${sun}
    ${[60, 200, 760, 900].map((x, i) => `<g transform="translate(${x} ${300 + i % 2 * 20})"><rect x="-8" y="60" width="16" height="110" fill="${mixHex('#090605', '#5a3e28', dim)}"/><circle cx="0" cy="30" r="${70 - i % 2 * 12}" fill="${mixHex('#050a06', '#3f8a46', dim)}"/></g>`).join('')}
    <path d="M0 470q250-40 500 0t500 0v130H0z" fill="${mixHex('#060a06', '#5f9d4a', dim)}"/><path d="M380 600l70-140h100l70 140z" fill="${mixHex('#0b0b0a', '#c9b48e', dim)}"/>
    <path d="M150 60h700l-40-40H190z" fill="${mixHex('#1a0d08', '#8a4b2a', dim)}"/><rect x="170" y="60" width="16" height="420" fill="${metal}"/><rect x="814" y="60" width="16" height="420" fill="${metal}"/>
    ${person(110, 0.9)}<rect width="1000" height="600" fill="url(#shade)"/>`);
  // shop window: brick, an awning, the screens behind glass that catches the sky
  return wrap(`<rect width="1000" height="600" fill="${mixHex('#120806', '#9c4d36', dim)}"/>
    ${Array.from({ length: 30 }, (_, r) => `<path d="M0 ${r * 20}h1000" stroke="${mixHex('#000000', '#6e3424', dim)}" stroke-width="2"/>`).join('')}
    <rect x="30" y="40" width="940" height="430" fill="${mixHex('#0c0f14', '#32404d', dim * 0.7)}"/><rect x="30" y="40" width="940" height="430" fill="none" stroke="${mixHex('#000000', '#1d2228', dim)}" stroke-width="18"/>
    <path d="M30 40L420 470M600 40L970 380" stroke="url(#sky)" stroke-width="140" opacity="${0.05 + L.sun * 0.12}"/>
    <path d="M0 0h1000v28l-20 20H20L0 28z" fill="${mixHex('#140a10', '#2f6b5f', dim)}"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${i * 100} 0h50v40h-50z" fill="${mixHex('#120a0a', '#e9e2d0', dim)}" opacity=".9"/>`).join('')}
    <rect y="480" width="1000" height="120" fill="${ground}"/><rect y="470" width="1000" height="12" fill="${mixHex('#111111', '#bdb7ad', dim)}"/>${person(880, 1.15)}<rect width="1000" height="600" fill="url(#shade)"/>`);
}
