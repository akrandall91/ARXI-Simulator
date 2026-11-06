// ===================================================================== ARXI Commercial: features for this section only
// Loads on the Commercial page only. Everything a business sees is defined here: the commercial apps, the new event,
// taproom and studio apps, the race finish line, packs, model presets and the room profiles that tie it together.
//
// Add a feature with ARXI.feature({...}); see the options at the bottom of shared/segment.js.
// Drawing: g is the screen (Bar 44x11 when wide(g), Panel 44x22 otherwise), t is ms since the situation started.
// Use the layout kit (LK) below so every app reads the same way on both screens.
// Don't call store or the UI at the top level: they boot after this file.

// The layout kit (LK), extra glyphs and the room-profile engine live in shared/kit.js.

// ------------------------------------------------------------------ 3. storefront
ARXI.feature({ id: 'open-sign', group: 'Commercial', name: 'Open Sign', tier: 'paid', price: '$5/mo', places: ['pub', 'cafe', 'store'],
  blurb: 'OPEN in a neon glow with today\'s hours, closing soon and closed. Follows your hours from Square or Google.',
  situations: [
    S1('Open', 'Neon OPEN that flickers on, with today\'s closing time.', (g, t) => {
      const on = t < 900 ? ((t / 90 | 0) % 3 === 0 ? 0.25 : t / 900) : 0.82 + 0.18 * pulse(t, 2800), neon = g.scale(0xff3d5a, on);
      g.clear(0);
      if(wide(g)) { g.text5('OPEN', 1, 2, neon); LK.right3(g, 'TIL', 0, DIM); LK.right3(g, '9PM', 6, WARM); }
      else { g.c5('OPEN', 3, neon); g.rect(12, 12, 31, 12, g.scale(0xff3d5a, 0.25)); LK.line(g, '7AM - 9PM', 15, WARM, t); }
      return { glow: 0.35 * on, accent: 0xff3d5a };
    }, 3000),
    S1('Closing soon', 'Fifteen minutes out: a gentle amber countdown.', (g, t) => {
      const s = Math.max(0, 900 - t / 1000 * 30); g.clear(0);
      if(wide(g)) { LK.line(g, 'CLOSING IN', 0, C.amber, t); LK.line(g, mmss(s), 6, WARM, t); }
      else { LK.line(g, 'CLOSING IN', 1, C.amber, t); g.c5(mmss(s), 8, WARM); LK.line(g, 'LAST ORDERS', 16, DIM, t); }
      return { glow: 0.12, accent: C.amber };
    }, 4000, 24000),
    S1('Closed', 'Dimmed, with when you open next.', (g, t) => {
      const rose = g.scale(0xc8506a, 0.6); g.clear(0);
      if(wide(g)) { if(phase(t, 9000) < 5000) g.c5('CLOSED', 2, rose); else { g.text3('OPENS', 1, 3, DIM); LK.right5(g, '7AM', 2, g.scale(WARM, 0.7)); } }
      else { g.c5('CLOSED', 3, rose); LK.line(g, 'OPENS 7AM', 15, DIM, t); }
    }, 6000),
  ] });

ARXI.feature({ id: 'specials', group: 'Commercial', name: 'Specials', tier: 'paid', price: '$5/mo', places: ['pub', 'cafe', 'store'],
  blurb: 'Rotating specials with prices, and a sold-out line when something runs out. Prices can come from your Square catalog.',
  situations: [
    S1('Menu', 'Three items, each with its price, crossfading.', (g, t) => {
      const items = [['LATTE', '$3.50', 0xd9a066], ['CROISSANT', '$2.75', 0xf0c060], ['COLD BREW', '$4.25', 0x6aa8ff]], L = 5000;
      const [n, p, c] = items[every(t, L) % items.length], k = LK.env(t, L); g.clear(0);
      if(wide(g)) { LK.line(g, n, 0, g.scale(c, k), t); LK.line(g, p, 6, g.scale(C.white, k), t); }
      else { LK.line(g, 'SPECIALS', 1, g.scale(DIM, 1), t); for(let i = 0; i < items.length; i++) g.px(19 + i * 3, 6, i === every(t, L) % items.length ? c : 0x2a2e34);
        LK.line(g, n, 9, g.scale(c, k), t); g.c5(p, 15, g.scale(C.white, k)); }
    }, 1500, 15000),
    S1('Sold out', 'An item runs out: struck through, then gone from the rotation.', (g, t) => {
      const k = Math.min(1, t / 1200); g.clear(0);
      if(wide(g)) { LK.line(g, 'CROISSANT', 0, g.scale(0xf0c060, 1 - 0.6 * k), t); const w = g.w3('CROISSANT'), x0 = Math.floor((g.w - w) / 2); g.rect(x0, 2, x0 + Math.round(w * k), 2, C.red); LK.line(g, 'SOLD OUT', 6, g.scale(C.red, k), t); }
      else { LK.line(g, 'SPECIALS', 1, DIM, t); LK.line(g, 'CROISSANT', 9, g.scale(0xf0c060, 1 - 0.6 * k), t); const w = g.w3('CROISSANT'), x0 = Math.floor((g.w - w) / 2); g.rect(x0, 11, x0 + Math.round(w * k), 11, C.red); LK.line(g, 'SOLD OUT', 16, g.scale(C.red, k), t); }
    }, 3000, 12000),
  ] });

ARXI.feature({ id: 'happy-hour', group: 'Commercial', name: 'Happy Hour', tier: 'paid', price: '$5/mo', places: ['pub', 'cafe'],
  blurb: 'Counts down to happy hour, then celebrates the deal for as long as it runs.',
  situations: [
    S1('Countdown', 'Fifteen minutes to happy hour, then it goes live.', (g, t) => {
      const s = Math.max(0, 900 - t / 1000 * 50), live = s <= 0, lt = t - 18000; g.clear(0);
      if(!live) { if(wide(g)) { LK.line(g, 'HAPPY HOUR', 0, PINK, t); LK.line(g, 'IN ' + mmss(s), 6, C.white, t); }
        else { LK.line(g, 'HAPPY HOUR', 1, PINK, t); g.c5(mmss(s), 8, C.white); LK.line(g, 'STARTS 4PM', 16, DIM, t); } return { glow: 0.1, accent: PINK }; }
      const pop = Math.min(1, lt / 500);
      if(wide(g)) { LK.line(g, 'HAPPY HOUR', 0, g.hsv(220 + 20 * pulse(t, 1600), 200, 255), t); LK.line(g, '$2 OFF ALL DRAFTS', 6, g.scale(C.white, pop), lt); }
      else { LK.line(g, 'HAPPY HOUR', 1, g.hsv(220 + 20 * pulse(t, 1600), 200, 255), t); g.c5('$2 OFF', 8, g.scale(C.white, pop)); LK.line(g, 'ALL DRAFTS', 16, DIM, t); }
      LK.sparkle(g, t, g.scale(PINK, 0.8), wide(g) ? 4 : 7); return { glow: 0.45 * pulse(t, 1600) + 0.15, accent: PINK };
    }, 21000, 30000),
  ] });

ARXI.feature({ id: 'social', group: 'Commercial', name: 'Follow Us & Reviews', tier: 'free', places: ['pub', 'cafe', 'store'],
  blurb: 'Your handle in your colours, and a five-star prompt that asks for a review on the way out.',
  situations: [
    S1('Follow us', 'Handle on a slow colour sweep.', (g, t) => {
      g.clear(0); const head = 'FOLLOW US', y = wide(g) ? 0 : 1, x0 = Math.floor((g.w - g.w3(head)) / 2); let x = x0;
      for(const ch of head) { x += g.text3(ch, x, y, g.hsv(200 + (x - x0) * 2 + t / 40, 210, 255)) + 1; }
      if(wide(g)) LK.line(g, '@ARXISYSTEMS', 6, C.white, t); else { LK.line(g, '@ARXISYSTEMS', 9, C.white, t); LK.line(g, 'IG + TIKTOK', 16, DIM, t); }
    }, 3000),
    S1('Review us', 'Stars fill one by one, then the ask.', (g, t) => {
      g.clear(0); const n = Math.min(5, Math.floor(t / 450)), y = wide(g) ? 0 : 7, x0 = Math.floor((g.w - 29) / 2);
      for(let i = 0; i < 5; i++) LK.star(g, x0 + i * 6, y, i < n ? GOLD : 0x2a2e34);
      if(wide(g)) LK.line(g, 'REVIEW US ON GOOGLE', 6, C.white, t); else { LK.line(g, 'ENJOY IT?', 1, DIM, t); LK.line(g, 'REVIEW US ON GOOGLE', 15, C.white, t); }
      return n >= 5 ? { glow: 0.2, accent: GOLD } : null;
    }, 3500),
  ] });

// ------------------------------------------------------------------ 4. orders, queues and waits
ARXI.feature({ id: 'now-serving', group: 'Commercial', name: 'Now Serving', tier: 'paid', price: '$5/mo', places: ['cafe', 'store', 'pub'],
  blurb: 'The ticket being served, big, with a flash and a chime-free nudge when it moves. From your POS or a tap on the hub.',
  situations: [
    S1('Queue', 'Number moves every 6 s: label, flash, then the number held big.', (g, t) => {
      const P = 6000, n = 47 + every(t, P), ph = phase(t, P), num = 'A' + n, flash = ph < 500; g.clear(flash ? 0x2a1a00 : 0);
      if(wide(g)) {
        if(ph < 1600) { LK.line(g, 'SERVING', 0, C.amber, t); LK.line(g, num, 6, C.white, t); }
        else { g.c5(num, 2, C.white); const w = g.w5(num), xl = Math.floor((g.w - w) / 2) - 5, xr = xl + w + 7; [[0, 0], [1, 1], [2, 2], [1, 3], [0, 4]].forEach(([a, b]) => { g.px(xl + a, 3 + b, C.amber); g.px(xr - a, 3 + b, C.amber); }); }
      } else { LK.line(g, 'SERVING', 1, C.amber, t); g.c5(num, 8, flash ? C.amber : C.white); LK.line(g, `NEXT A${n + 1}`, 16, DIM, t); }
      return flash ? { glow: 0.5, accent: C.amber } : null;
    }, 3000, 30000),
  ] });

ARXI.feature({ id: 'order-ready', group: 'Commercial', name: 'Order Ready', tier: 'paid', price: '$5/mo', places: ['cafe', 'pub', 'store'],
  blurb: 'Pickup numbers that are ready; the newest one lights up. Reads Square or Toast order status.',
  situations: [
    S1('Ready for pickup', 'A new order joins the list every 7 s and the oldest leaves.', (g, t) => {
      const st = every(t, 7000), list = [112, 115, 117, 118, 121, 124, 126].slice(st % 4, st % 4 + 3), fresh = phase(t, 7000) < 1500; g.clear(0);
      const col = (i) => i === list.length - 1 ? (fresh && (t / 250 | 0) % 2 ? MINT : C.green) : C.white;
      if(wide(g)) { g.text3('READY', 1, 0, C.green); const s = list.join(' '); let x = Math.floor((g.w - g.w3(s)) / 2); list.forEach((v, i) => { x += g.text3(String(v), x, 6, col(i)) + 3; }); }
      else { LK.line(g, 'PICKUP', 1, C.green, t); const two = list.slice(-2), ws = two.map(v => g.w5(String(v))), gap = 6, tot = ws[0] + gap + ws[1];
        let x = Math.floor((g.w - tot) / 2); two.forEach((v, i) => { g.text5(String(v), x, 8, col(i + list.length - 2)); x += ws[i] + gap; });
        LK.line(g, 'AT COUNTER', 16, DIM, t); }
      return fresh ? { glow: 0.25, accent: C.green } : null;
    }, 1000, 28000),
  ] });

ARXI.feature({ id: 'pickup-shelf', group: 'Commercial', name: 'Driver Pickup', tier: 'paid', price: 'quote', places: ['cafe', 'pub', 'store'], pack: 'service',
  blurb: 'Delivery drivers see their code and which shelf, so they stop asking at the counter. From DoorDash, Uber Eats or Square.',
  situations: [
    S1('Shelf', 'A code and its shelf; codes rotate.', (g, t) => {
      const L = 4500, list = [['K82', '3', 0xff3008], ['J17', '1', 0x06c167], ['P40', '2', 0xff3008]], [code, shelf, c] = list[every(t, L) % list.length], k = LK.env(t, L); g.clear(0);
      if(wide(g)) { g.text5(code, 1, 2, g.scale(C.white, k)); LK.right3(g, 'SHELF', 0, g.scale(DIM, k)); LK.right3(g, shelf, 6, g.scale(c, k)); }
      else { LK.line(g, 'PICKUP', 1, C.green, t); g.c5(code, 8, g.scale(C.white, k)); LK.line(g, 'SHELF ' + shelf, 16, g.scale(c, k), t); }
    }, 1500, 13500),
  ] });

ARXI.feature({ id: 'wait', group: 'Commercial', name: 'Wait Time', tier: 'paid', price: '$5/mo', places: ['pub', 'cafe', 'store'],
  blurb: 'Estimated wait in minutes, green to red. From your waitlist app or counted by presence at the door.',
  situations: [
    S1('Wait', 'The wait climbs through a rush and eases off.', (g, t) => {
      const m = Math.round(6 + 14 * Math.sin(Math.min(1, t / 24000) * Math.PI)), col = m < 10 ? C.green : m < 16 ? C.amber : C.red, word = m < 10 ? 'SHORT' : m < 16 ? 'MODERATE' : 'LONG'; g.clear(0);
      if(wide(g)) { g.text3('WAIT', 1, 0, DIM); g.text3('TIME', 1, 6, DIM); const mw = g.w3('MIN'), nw = g.w5(String(m)), x = g.w - mw - 2 - nw; g.text5(String(m), x, 2, col); g.text3('MIN', g.w - mw, 4, col); }
      else { LK.line(g, 'WAIT TIME', 1, DIM, t); const s = `${m} MIN`; LK.big(g, s, 8, col, t); LK.line(g, word, 16, g.scale(col, 0.85), t); }
      return { glow: 0.12, accent: col };
    }, 12000, 24000),
  ] });

ARXI.feature({ id: 'occupancy', group: 'Commercial', name: 'Occupancy', tier: 'paid', price: '$5/mo', places: ['pub', 'cafe', 'store'],
  blurb: 'People inside versus your limit, from the presence sensor or a door counter. Turns to PLEASE WAIT at the limit.',
  situations: [
    S1('Room count', 'Count rises to the limit, then holds the door.', (g, t) => {
      const lim = 50, n = Math.min(lim, 34 + Math.floor(t / 900)), k = n / lim, col = k < 0.85 ? C.green : k < 1 ? C.amber : C.red, full = n >= lim; g.clear(0);
      if(wide(g)) { const s = String(n); g.text5(s, 1, 0, C.white); g.text3('/' + lim, 2 + g.w5(s), 2, DIM); LK.right3(g, full ? 'FULL' : k < 0.85 ? 'OPEN' : 'BUSY', 1, col); LK.gauge(g, 1, 9, g.w - 2, 10, k, col); }
      else { LK.line(g, full ? 'PLEASE WAIT' : 'INSIDE NOW', 1, full ? ((t / 600 | 0) % 2 ? C.red : C.white) : DIM, t); g.c5(`${n}/${lim}`, 8, C.white); LK.gauge(g, 2, 18, g.w - 3, 19, k, col); }
      return full ? { glow: 0.3, accent: C.red } : null;
    }, 16000, 20000),
  ] });

// ------------------------------------------------------------------ 5. funeral homes (calm: no motion faster than a slow fade)
ARXI.feature({ id: 'service', group: 'Funeral Homes', name: 'Service Schedule', tier: 'paid', price: 'quote', places: ['store'],
  blurb: 'Today\'s visitation, service and reception by room, in a soft warm white that never flashes.',
  situations: [
    S1('Today', 'Each part of the day, held and slowly crossfaded.', (g, t) => {
      const rows = [['VISITATION', '10AM'], ['SERVICE', '11AM'], ['RECEPTION', '12PM']], L = 7000, [ev, tm] = rows[every(t, L) % rows.length], k = 0.15 + 0.85 * LK.env(t, L, 900); g.clear(0);
      if(wide(g)) { if(1 + g.w3(ev) + 3 + g.w5(tm) <= g.w) { g.text3(ev, 1, 3, g.scale(WARM, k)); LK.right5(g, tm, 2, g.scale(WARM, k)); } else { LK.line(g, ev, 0, g.scale(WARM, k), t); LK.line(g, tm, 6, g.scale(0xb8ad98, k), t); } }
      else { LK.line(g, 'CHAPEL A', 1, g.scale(0xb8ad98, 0.8), t); LK.line(g, ev, 9, g.scale(WARM, k), t); g.c5(tm, 15, g.scale(WARM, k)); }
    }, 3500, 21000),
  ] });

ARXI.feature({ id: 'welcome', group: 'Funeral Homes', name: 'Welcome & Directions', tier: 'paid', price: 'quote', places: ['store'],
  blurb: 'A quiet welcome and which way to go, for guests arriving for a service.',
  situations: [
    S1('Welcome', 'Welcome, then the room and the door, with an arrow.', (g, t) => {
      const k = Math.min(1, 0.35 + t / 2000), L = 6000, second = every(t, L) % 2, e = 0.15 + 0.85 * LK.env(t, L, 900); g.clear(0);
      if(wide(g)) { LK.line(g, 'WELCOME', 0, g.scale(WARM, k), t); if(!second) LK.line(g, '2PM SERVICE', 6, g.scale(0xc8bfae, e), t); else { const s = 'EAST DOOR', w = g.w3(s) + 7, x = Math.floor((g.w - w) / 2); g.text3(s, x, 6, g.scale(0xc8bfae, e)); LK.arrow(g, x + w - 5, 6, g.scale(WARM, e)); } }
      else { LK.line(g, 'WELCOME', 1, g.scale(WARM, k), t); LK.line(g, '2PM SERVICE', 9, g.scale(0xc8bfae, k), t); const s = 'EAST DOOR', w = g.w3(s) + 7, x = Math.floor((g.w - w) / 2); g.text3(s, x, 16, g.scale(0xc8bfae, k)); LK.arrow(g, x + w - 5, 16, g.scale(WARM, 0.6 + 0.4 * pulse(t, 4000))); }
    }, 7000, 18000),
  ] });

// ------------------------------------------------------------------ 6. events and races
// For race organisers, timing companies, running stores and the breweries that host the after-party. Timing data comes
// from the chip-timing mats (RFID) through the timer's results feed; the clock runs from the gun time.
const RACE = { name: '5K', gun: 0 };
const RUNNERS = [['1042', 'MAYA R', '24:31', true], ['388', 'DEV P', '24:39', false], ['1517', 'SAM K', '24:52', true], ['76', 'JO W', '25:03', false], ['902', 'ALEX T', '25:10', false]];

ARXI.feature({ id: 'race-clock', group: 'Events & Races', name: 'Race Clock', tier: 'paid', price: 'quote', places: ['finish'], starter: true,
  blurb: 'Wave countdowns, GO, then the running gun clock, big enough to read from the last stretch.',
  situations: [
    S1('Wave start', 'Wave 2 counts down from 0:20, flashes GO, then the clock runs.', (g, t) => {
      const left = 20 - t / 1000; g.clear(0);
      if(left > 0) { const s = mmss(Math.ceil(left)), hot = left <= 5, col = hot ? ((t / 250 | 0) % 2 ? C.amber : C.white) : C.white;
        LK.board(g, t, { label: 'WAVE 2', value: s, sub: 'GET READY', lc: DIM, vc: col }); return hot ? { glow: 0.2, accent: C.amber } : null; }
      const since = -left * 1000; if(since < 1800) { g.clear(since % 400 < 200 ? 0x0c3a10 : 0); LK.big(g, 'GO!', wide(g) ? 2 : 8, C.green, t); if(!wide(g)) LK.line(g, 'WAVE 2', 1, DIM, t); return { glow: 0.8, accent: C.green }; }
      LK.board(g, t, { label: 'WAVE 2', value: mmss(since / 1000), sub: 'GUN TIME', lc: DIM, vc: C.white });
    }, 3000, 30000),
    S1('Gun clock', 'The clock as runners come in, from 24:20.', (g, t) => {
      const s = 24 * 60 + 20 + t / 1000; g.clear(0);
      if(wide(g)) { g.text3(RACE.name, 1, 3, C.blue); LK.right5(g, mmss(s), 2, C.white); }
      else { LK.line(g, 'TURKEY TROT', 1, C.blue, t); g.c5(mmss(s), 8, C.white); LK.line(g, 'GUN TIME', 16, DIM, t); }
    }, 4000, 20000),
  ] });

ARXI.feature({ id: 'finisher', group: 'Events & Races', name: 'Finisher Call-out', tier: 'paid', price: 'quote', places: ['finish'], starter: true,
  blurb: 'Each runner\'s bib, name and time as they cross the mat, with a burst for a personal record.',
  situations: [
    S1('Finishers', 'A new finisher every 4 s; PRs get a gold burst.', (g, t) => {
      const L = 4000, [bib, nm, tm, pr] = RUNNERS[every(t, L) % RUNNERS.length], ph = phase(t, L), k = t < L ? 1 : Math.min(1, ph / 300); g.clear(0);
      const accent = pr ? GOLD : C.blue;
      if(wide(g)) { LK.line(g, `#${bib} ${nm}`, 0, g.scale(C.white, k), t); if(pr && ph > 1800) { LK.line(g, 'NEW PR!', 6, (t / 220 | 0) % 2 ? GOLD : C.white, t); } else LK.line(g, tm, 6, g.scale(accent, k), t); }
      else { LK.line(g, '#' + bib, 1, g.scale(DIM, k), t); LK.line(g, nm, 8, g.scale(C.white, k), t); g.c5(tm, 14, g.scale(accent, k)); }
      if(pr && ph < 1600) { LK.sparkle(g, t, GOLD, wide(g) ? 5 : 9, 90); return { glow: 0.6 * (1 - ph / 1600), accent: GOLD }; }
    }, 1200, 20000),
  ] });

ARXI.feature({ id: 'results', group: 'Events & Races', name: 'Results Board', tier: 'paid', price: 'quote', places: ['finish', 'store', 'pub', 'cafe'], starter: true,
  blurb: 'Top finishers overall and by age group, in medal colours. Runs at the finish and at the after-party.',
  situations: [
    S1('Overall', 'First, second and third, each held then crossfaded.', (g, t) => {
      const top = [['1ST', 'J OKAFOR', '17:02', GOLD], ['2ND', 'R DIAZ', '17:41', SILVER], ['3RD', 'K NGUYEN', '18:09', BRONZE]], L = 4500, [pl, nm, tm, c] = top[every(t, L) % 3], k = LK.env(t, L); g.clear(0);
      if(wide(g)) { g.text3(pl, 1, 0, g.scale(c, k)); LK.right3(g, tm, 0, g.scale(C.white, k)); LK.line(g, nm, 6, g.scale(C.white, k), t); }
      else { LK.line(g, 'OVERALL', 1, DIM, t); g.text3(pl, 1, 8, g.scale(c, k)); LK.right3(g, tm, 8, g.scale(C.white, k)); LK.line(g, nm, 15, g.scale(c, k), t); }
    }, 1500, 13500),
    S1('Age groups', 'Each age group winner in turn.', (g, t) => {
      const ag = [['F 30-39', 'MAYA R', '24:31'], ['M 40-49', 'DEV P', '24:39'], ['F 50-59', 'ANN B', '27:10'], ['M 60+', 'LEE H', '29:44']], L = 4000, [a, nm, tm] = ag[every(t, L) % ag.length], k = LK.env(t, L); g.clear(0);
      if(wide(g)) { if(1 + g.w3(a) + 3 + g.w3(tm) <= g.w) { g.text3(a, 1, 0, g.scale(C.blue, k)); LK.right3(g, tm, 0, g.scale(C.white, k)); } else LK.line(g, a, 0, g.scale(C.blue, k), t);
        LK.line(g, 1 + g.w3(a) + 3 + g.w3(tm) <= g.w ? nm : `${nm} ${tm}`, 6, g.scale(C.white, k), t); }
      else { LK.line(g, a, 1, g.scale(C.blue, k), t); LK.line(g, nm, 9, g.scale(C.white, k), t); LK.line(g, tm, 16, g.scale(GOLD, k), t); }
    }, 1500, 16000),
  ] });

ARXI.feature({ id: 'cheer', group: 'Events & Races', name: 'Cheer Zone', tier: 'paid', price: 'quote', places: ['finish'], starter: true,
  blurb: 'A crowd-noise meter for the last stretch: the louder they cheer, the higher it climbs. Uses the sound sense; hears levels, not words.',
  situations: [
    S1('Make some noise', 'The crowd builds as a runner comes in; peak sets off a burst.', (g, t) => {
      const lvl = Math.max(0, Math.min(1, 0.25 + 0.75 * Math.sin(Math.min(1, t / 9000) * Math.PI / 2) + 0.1 * Math.sin(t / 130) * Math.sin(t / 370))), peak = lvl > 0.94; g.clear(0);
      const col = (x, w) => g.hsv(85 - 85 * (x / w), 230, 255);
      if(wide(g)) { LK.line(g, peak ? 'LOUDER!!' : 'MAKE NOISE', 0, peak ? GOLD : C.white, t); const n = Math.round(lvl * 42); for(let x = 1; x <= n; x++) g.rect(x, 7, x, 10, col(x, 42)); }
      else { LK.line(g, peak ? 'LOUDER!!' : 'MAKE NOISE', 1, peak ? GOLD : C.white, t); const n = Math.round(lvl * 40); for(let x = 2; x < 2 + n; x++) { const h = 3 + Math.round(6 * Math.abs(Math.sin(x * 0.7 + t / 160)) * lvl); g.rect(x, 16 - h, x, 16, col(x, 42)); } LK.line(g, 'CHEER ZONE', 17, DIM, t); }
      if(peak) { LK.sparkle(g, t, GOLD, 8, 80); return { glow: 0.7, accent: GOLD }; }
      return { glow: 0.3 * lvl, accent: 0x3aff8a };
    }, 9000, 14000),
  ] });

ARXI.feature({ id: 'mile-marker', group: 'Events & Races', name: 'Mile Marker', tier: 'paid', price: 'quote', places: ['finish'],
  blurb: 'Out on the course: the mile, the clock and a push to keep going, with room for a sponsor line.',
  situations: [
    S1('Mile 2', 'Mile, clock and encouragement.', (g, t) => {
      const s = 16 * 60 + 5 + t / 1000, cheer = ['KEEP GOING', 'YOU GOT IT', '1.1 TO GO'][every(t, 4000) % 3]; g.clear(0);
      if(wide(g)) { g.text3('MILE 2', 1, 0, C.blue); LK.right3(g, mmss(s), 0, C.white); LK.line(g, cheer, 6, GOLD, t); }
      else { g.c5('MILE 2', 1, C.blue); g.c5(mmss(s), 9, C.white); LK.line(g, cheer, 17, GOLD, t); }
    }, 2000, 12000),
  ] });

ARXI.feature({ id: 'run-club', group: 'Events & Races', name: 'Run Club', tier: 'paid', price: 'quote', places: ['store', 'cafe', 'pub', 'finish'],
  blurb: 'For running stores, gyms and breweries: the next group run, and who has logged the most miles this month.',
  situations: [
    S1('Next run', 'When, how far and where you meet.', (g, t) => {
      g.clear(0); const L = 5000, second = every(t, L) % 2, k = LK.env(t, L);
      if(wide(g)) { LK.line(g, 'RUN CLUB', 0, MINT, t); LK.line(g, second ? 'ALL PACES' : 'THU 6PM 5K', 6, g.scale(C.white, k), t); }
      else { LK.line(g, 'RUN CLUB', 1, MINT, t); LK.big(g, 'THU 6PM', 8, C.white, t); LK.line(g, second ? 'ALL PACES' : 'GREENWAY', 16, g.scale(DIM, k), t); }
    }, 1500, 15000),
    S1('Miles leaderboard', 'This month\'s top three by miles.', (g, t) => {
      const top = [['1', 'MAYA', '84'], ['2', 'DEV', '71'], ['3', 'JO', '66']], c = [GOLD, SILVER, BRONZE]; g.clear(0);
      if(wide(g)) { const L = 3500, i = every(t, L) % 3, [p, nm, mi] = top[i], k = LK.env(t, L); g.text3(p, 1, 0, g.scale(c[i], k)); g.text3(nm, 7, 0, g.scale(C.white, k)); LK.right3(g, mi + ' MI', 0, g.scale(c[i], k)); LK.line(g, 'TOP MILES', 6, DIM, t); }
      else { top.forEach(([p, nm, mi], i) => { const y = 1 + i * 7; g.text3(p, 1, y, c[i]); g.text3(nm, 7, y, C.white); LK.right3(g, mi + 'MI', y, c[i]); }); }
    }, 1500, 10500),
  ] });

// ------------------------------------------------------------------ 7. taproom and bar
ARXI.feature({ id: 'tap-list', group: 'Taproom', name: 'Tap List', tier: 'paid', price: 'quote', places: ['pub'], starter: true,
  blurb: 'What\'s on tap: tap number, beer, style and ABV, and how full the keg is. Marks kicked kegs.',
  situations: [
    S1('On tap', 'Each tap in turn with its keg level.', (g, t) => {
      const taps = [['1', 'HAZY IPA', '6.5%', 0.72, 0xf2b134], ['2', 'PILSNER', '4.8%', 0.4, 0xf7e27a], ['3', 'STOUT', '7.2%', 0.12, 0x9b5a2b], ['4', 'SOUR', '5.1%', 0.9, 0xff6f91]], L = 4500;
      const [n, nm, abv, keg, col] = taps[every(t, L) % taps.length], k = LK.env(t, L), kc = keg < 0.2 ? C.red : keg < 0.5 ? C.amber : C.green; g.clear(0);
      const chip = (x, y) => { g.rect(x, y, x + g.w3(n) + 1, y + 4, g.scale(col, k)); g.text3(n, x + 1, y, 0); return g.w3(n) + 3; };
      if(wide(g)) { const x = 1 + chip(0, 0); g.text3(nm, x + 1, 0, g.scale(C.white, k)); g.text3(abv, 1, 6, g.scale(DIM, k)); LK.gauge(g, g.w - 19, 8, g.w - 2, 9, keg * k, kc); }
      else { chip(0, 0); LK.line(g, nm, 0, g.scale(C.white, k), t); g.c3(abv, 9, g.scale(col, k)); g.text3('KEG', 1, 16, DIM); LK.gauge(g, 15, 17, g.w - 3, 19, keg * k, kc); }
    }, 1500, 18000),
    S1('Keg kicked', 'Tap 3 runs dry: KICKED, then what replaces it.', (g, t) => {
      g.clear(0); const blink = t < 3000 && (t / 300 | 0) % 2;
      if(wide(g)) { g.text3('TAP 3', 1, 0, DIM); LK.right3(g, 'STOUT', 0, g.scale(0x9b5a2b, 1)); LK.line(g, t < 6000 ? 'KICKED' : 'NEXT PORTER', 6, t < 6000 ? (blink ? C.white : C.red) : C.amber, t); }
      else { LK.line(g, 'TAP 3 STOUT', 1, DIM, t); LK.big(g, 'KICKED', 8, blink ? C.white : C.red, t); LK.line(g, 'NEXT PORTER', 16, C.amber, t); }
    }, 2000, 12000),
  ] });

ARXI.feature({ id: 'trivia', group: 'Taproom', name: 'Trivia Night', tier: 'paid', price: 'quote', places: ['pub', 'cafe'], starter: true,
  blurb: 'Round and answer timer for the host, then the leaderboard between rounds. Host runs it from a phone.',
  situations: [
    S1('Round timer', 'Answers due: the last ten seconds go red.', (g, t) => {
      const left = Math.max(0, 45 - t / 1000), col = left <= 10 ? ((t / 300 | 0) % 2 ? C.red : C.white) : C.white; g.clear(0);
      LK.board(g, t, { label: 'ROUND 3', value: left > 0 ? mmss(Math.ceil(left)) : 'PENS DOWN', sub: 'PENS UP', lc: 0x9b8cff, vc: left > 0 ? col : C.amber });
      return left <= 10 ? { glow: 0.2, accent: C.red } : { glow: 0.08, accent: 0x9b8cff };
    }, 5000, 50000),
    S1('Leaderboard', 'Top teams after round 3.', (g, t) => {
      const teams = [['1', 'BRAINS', '42'], ['2', 'PUNS', '39'], ['3', 'NERDS', '37']], c = [GOLD, SILVER, BRONZE]; g.clear(0);
      if(wide(g)) { const L = 3500, i = every(t, L) % 3, [p, nm, sc] = teams[i], k = LK.env(t, L); g.text3(p, 1, 0, g.scale(c[i], k)); LK.right3(g, sc, 0, g.scale(c[i], k)); LK.line(g, nm, 6, g.scale(C.white, k), t); }
      else { teams.forEach(([p, nm, sc], i) => { const y = 1 + i * 7; g.text3(p, 1, y, c[i]); g.text3(nm, 7, y, C.white); LK.right3(g, sc, y, c[i]); }); }
    }, 1500, 10500),
  ] });

ARXI.feature({ id: 'last-call', group: 'Taproom', name: 'Last Call', tier: 'paid', price: 'quote', places: ['pub'],
  blurb: 'Counts down to last call, then rings it with an amber flash the whole bar can see.',
  situations: [
    S1('Last call', 'Ten minutes out, then the bell.', (g, t) => {
      const left = Math.max(0, 600 - t / 1000 * 40); g.clear(0);
      if(left > 0) { LK.board(g, t, { label: 'LAST CALL', value: mmss(left), sub: 'ORDER NOW', lc: C.amber, vc: WARM }); return { glow: 0.1, accent: C.amber }; }
      const since = t - 15000, ring = since < 2400 && (since / 200 | 0) % 2; g.clear(ring ? 0x3a2000 : 0); LK.big(g, 'LAST CALL', wide(g) ? 2 : 8, ring ? C.white : C.amber, t);
      if(!wide(g)) { LK.line(g, 'THANK YOU', 1, DIM, t); LK.line(g, 'RIDE SAFE', 16, DIM, t); } return { glow: ring ? 0.8 : 0.25, accent: C.amber };
    }, 16000, 24000),
  ] });

// ------------------------------------------------------------------ 8. studios, gyms and salons
ARXI.feature({ id: 'class-spots', group: 'Studios & Salons', name: 'Class Spots', tier: 'paid', price: 'quote', places: ['store'],
  blurb: 'The next class and how many spots are left, then FULL and the waitlist. From Mindbody or your booking app.',
  situations: [
    S1('Next class', 'Spots fill one by one down to full.', (g, t) => {
      const spots = Math.max(0, 4 - Math.floor(t / 3000)), full = !spots, col = full ? C.red : spots <= 2 ? C.amber : C.green; g.clear(0);
      if(wide(g)) { LK.line(g, 'SPIN 6PM', 0, C.white, t); LK.line(g, full ? 'FULL' : `${spots} LEFT`, 6, col, t); }
      else { LK.line(g, 'SPIN 6PM', 1, C.white, t); LK.big(g, full ? 'FULL' : String(spots), 8, col, t); LK.line(g, full ? 'WAITLIST' : 'SPOTS LEFT', 16, DIM, t); }
    }, 4000, 16000),
  ] });

ARXI.feature({ id: 'chair-wait', group: 'Studios & Salons', name: 'Chair Wait', tier: 'paid', price: 'quote', places: ['store'],
  blurb: 'Each barber or stylist with their wait, so walk-ins pick a chair. Green dot when a chair is free.',
  situations: [
    S1('Chairs', 'Three chairs; one frees up partway through.', (g, t) => {
      const free = t > 8000, chairs = [['AJ', free ? 0 : 5], ['TONY', 20], ['MO', 35]]; g.clear(0);
      const tag = (m) => m === 0 ? 'NOW' : `${m}M`, col = (m) => m === 0 ? C.green : m < 25 ? C.amber : C.red;
      if(wide(g)) { const L = 3000, i = every(t, L) % 3, [nm, m] = chairs[i], k = LK.env(t, L); g.text3('WAIT', 1, 0, DIM); chairs.forEach((c, j) => g.px(30 + j * 4, 2, j === i ? col(c[1]) : 0x2a2e34)); g.text3(nm, 1, 6, g.scale(C.white, k)); LK.right3(g, tag(m), 6, g.scale(col(m), k)); }
      else { chairs.forEach(([nm, m], j) => { const y = 1 + j * 7; dot(g, 2, y + 2, col(m), 1); g.text3(nm, 6, y, C.white); LK.right3(g, tag(m), y, col(m)); }); }
      return free && t < 9500 ? { glow: 0.3, accent: C.green } : null;
    }, 9000, 15000),
  ] });

// ------------------------------------------------------------------ 9. the race finish line as a place
PLACES.push({ id: 'finish', name: 'Race finish line', icon: 'flag' });
BUYERS.business.places.push('finish'); if(SEG) SEG.places.push('finish');
BUYERS.business.line = 'For a bar, cafe, shop or race: menus, specials, waits, the game and the finish line.';
PLACE_INFO.finish = { line: 'On an event stand by the finish arch, for runners and the crowd.' };
PLACE_INFO.store = { line: 'In a window or lobby: shops, studios, salons and funeral homes.' };
PLACE_GROUPS.finish = ['Events & Races', 'Time & Weather', 'Room Profiles'];
NOT_FOR_PLACE.finish = ['styles', 'rotation', 'timeline'];
STARTERS.finish = ['race-clock', 'finisher', 'results', 'cheer'];
['sound', 'climate'].forEach(k => { if(!SENSES[k].places.includes('finish')) SENSES[k].places.push('finish'); });
NEEDS.cheer = 'sound';
Object.assign(GROUP_ICONS, { 'Events & Races': 'flag', 'Taproom': 'sparkles', 'Studios & Salons': 'users', 'Room Profiles': 'layers' });
// the sports apps run on the firmware and show up for bars on their own; make them starters for the pub
STARTERS.pub = ['nfl-scores', 'gameday', 'specials', 'happy-hour', 'tap-list'];
STARTERS.cafe = ['open-sign', 'specials', 'now-serving', 'order-ready', 'social'];
STARTERS.store = ['open-sign', 'specials', 'social', 'occupancy'];

// ------------------------------------------------------------------ 10. room profiles
const PROFILES = [
  { id: 'profile-pub', place: 'pub', name: 'Bar profile', accent: 0xffa23a,
    blurb: 'A neighbourhood bar from opening to close: the Bar is read from the stools, the Panel sits on the bar top. Warm amber spill, dimmed with the lights at night, breathing with the crowd.',
    parts: [
      { name: 'Opening, 4 PM', note: 'Lights up, room bright. Bar: specials. Panel: happy hour countdown.', bar: ['specials'], pan: ['happy-hour'], light: 0.8, presence: 'some' },
      { name: 'Happy hour', note: 'The room fills. Bar: the deal, live. Panel: what\'s on tap. Glow breathes with the noise.', bar: ['happy-hour'], pan: ['tap-list'], at: 18500, light: 0.65, presence: 'busy', sound: 0.6 },
      { name: 'Trivia night', note: 'Loud room, lights down. Bar: the round timer. Panel: the leaderboard.', bar: ['trivia'], pan: ['trivia', 1], light: 0.45, presence: 'busy', sound: 0.85 },
      { name: 'Last call', note: 'Lights low. Bar: last call. Panel: asks for a review on the way out.', bar: ['last-call'], pan: ['social', 1], at: 9000, light: 0.3, presence: 'some', sound: 0.3 },
      { name: 'Closed, empty', note: 'Nobody in: the screens rest at a soft amber line. A cleaner walks in at 6 s and they wake to CLOSED.', bar: ['open-sign', 2], pan: ['social'], light: 0.15, presence: 'empty', walkup: 6000 },
    ] },
  { id: 'profile-cafe', place: 'cafe', name: 'Cafe profile', accent: 0xf3d7a6,
    blurb: 'A coffee counter: the Bar is the menu strip on the tile, the Panel faces the pickup end. Cream accent, full brightness for the morning light.',
    parts: [
      { name: 'Morning rush', note: 'Bright and busy. Bar: the menu with prices. Panel: now serving.', bar: ['specials'], pan: ['now-serving'], light: 0.95, presence: 'busy', sound: 0.4 },
      { name: 'Mobile orders', note: 'Bar: driver pickup shelf. Panel: orders ready, newest lit.', bar: ['pickup-shelf'], pan: ['order-ready'], light: 0.9, presence: 'busy' },
      { name: 'Afternoon lull', note: 'Quiet. Bar: Thursday run club (the cafe is the meet-up). Panel: follow us.', bar: ['run-club'], pan: ['social'], light: 0.75, presence: 'some' },
      { name: 'Closing', note: 'Bar: closing soon. Panel: what sold out today.', bar: ['open-sign', 1], pan: ['specials', 1], light: 0.55, presence: 'some' },
      { name: 'Closed', note: 'Resting glow; wakes to CLOSED when someone passes the counter.', bar: ['open-sign', 2], pan: ['open-sign', 2], light: 0.2, presence: 'empty', walkup: 5000 },
    ] },
  { id: 'profile-store', place: 'store', name: 'Shop window profile', accent: 0x3ddc97,
    blurb: 'A shop window that sells to the sidewalk: full brightness against daylight glare, a walk-up wakes it, and it keeps working after hours.',
    parts: [
      { name: 'Open, street', note: 'Sunny window, so full brightness. Bar: neon OPEN. Panel: today\'s special.', bar: ['open-sign'], pan: ['specials'], light: 1, presence: 'some' },
      { name: 'Walk-up', note: 'Someone stops at the glass at 3 s: the Panel wakes from rest to ask for a review.', bar: ['social'], pan: ['social', 1], light: 1, presence: 'empty', walkup: 3000 },
      { name: 'Busy', note: 'Bar: how many are inside. Panel: the wait.', bar: ['occupancy'], pan: ['wait'], light: 0.9, presence: 'busy' },
      { name: 'Evening', note: 'Bar: closing soon. Panel: follow us. Dimmer as the street gets dark.', bar: ['open-sign', 1], pan: ['social'], light: 0.5, presence: 'some' },
      { name: 'After hours', note: 'Resting, then a passer-by at 4 s wakes CLOSED and opening time.', bar: ['open-sign', 2], pan: ['open-sign', 2], light: 0.15, presence: 'empty', walkup: 4000 },
    ] },
  { id: 'profile-memorial', place: 'store', name: 'Funeral home profile', accent: 0xf0e6d2,
    blurb: 'A lobby for services: warm white only, brightness capped at 60 %, no flashing, and screens that go nearly dark while a service is under way.',
    parts: [
      { name: 'Arrivals', note: 'Bar: welcome and which door. Panel: today\'s schedule.', bar: ['welcome'], pan: ['service'], light: 0.6, cap: 0.6, presence: 'some', accentGlow: 0.08 },
      { name: 'During the service', note: 'Lobby empty: both rest at a faint warm line until someone comes out at 7 s.', bar: ['welcome'], pan: ['service'], at: 7000, light: 0.5, cap: 0.6, presence: 'empty', walkup: 7000, accentGlow: 0.05 },
      { name: 'Reception', note: 'Bar: the schedule moves on to the reception. Panel: welcome.', bar: ['service'], pan: ['welcome'], at: 14000, light: 0.55, cap: 0.6, presence: 'some', accentGlow: 0.08 },
    ] },
  { id: 'profile-race', place: 'finish', name: 'Race day profile', accent: 0x3aa0ff,
    blurb: 'Race morning at the finish: start countdowns, the gun clock, finishers called out, the crowd meter, then results for the after-party. Full brightness outdoors.',
    parts: [
      { name: 'Start', note: 'Bar: wave countdown and GO. Panel: the race clock.', bar: ['race-clock'], pan: ['race-clock', 1], light: 1, presence: 'busy', sound: 0.5 },
      { name: 'Finishers', note: 'Bar: the gun clock. Panel: each finisher called out, PRs in gold.', bar: ['race-clock', 1], pan: ['finisher'], light: 1, presence: 'busy', sound: 0.7 },
      { name: 'Last stretch', note: 'Bar: finisher names. Panel: the crowd-noise meter; the glow follows the crowd.', bar: ['finisher'], pan: ['cheer'], light: 1, presence: 'busy', sound: 0.95 },
      { name: 'Awards', note: 'Bar: age group winners. Panel: overall podium.', bar: ['results', 1], pan: ['results'], light: 0.9, presence: 'some', sound: 0.4 },
    ] },
];
for(const p of PROFILES) ARXI.feature({ id: p.id, group: 'Room Profiles', name: p.name, tier: 'paid', price: 'quote', places: [p.place], starter: p.id !== 'profile-memorial', blurb: p.blurb,
  situations: [wholeDay(p.parts, p.accent), ...p.parts.map(part => profilePart(part, p.accent))] });

// ------------------------------------------------------------------ 11. packs and model presets
const packIdx = (id) => PACKS.findIndex(p => p.id === id);
PACKS.splice(Math.max(0, packIdx('basics-c')), 0,
  { id: 'profiles', name: 'Room Profile', icon: 'layers', market: 'Commercial', line: 'The whole room set up for every part of the day, with the senses.', apps: PROFILES.map(p => p.id), always: true },
  { id: 'race', name: 'Race Day', icon: 'flag', market: 'Commercial', line: 'Wave starts, the gun clock, finishers, the cheer meter and results.', apps: ['race-clock', 'finisher', 'cheer', 'mile-marker', 'results'] },
  { id: 'community', name: 'Run Club & Community', icon: 'users', market: 'Commercial', line: 'Group runs, the miles leaderboard and local race results.', apps: ['run-club', 'results'] },
  { id: 'taproom', name: 'Taproom', icon: 'sparkles', market: 'Commercial', line: 'Tap list with keg levels, trivia night and last call.', apps: ['tap-list', 'trivia', 'last-call'] },
  { id: 'studios', name: 'Studios & Salons', icon: 'users', market: 'Commercial', line: 'Class spots left and the wait for each chair.', apps: ['class-spots', 'chair-wait'] });
{ const sv = PACKS.find(p => p.id === 'service'); if(sv) sv.line = 'Now serving, orders ready, driver pickup, waits and how busy it is.'; }
Object.assign(MODEL_PRESETS, {
  'Taproom': { market: 'Commercial', screens: ['bar', 'panel'], power: 'Wall', features: ['profile-pub', 'tap-list', 'trivia', 'last-call', 'happy-hour', 'specials', 'nfl-scores', 'gameday'] },
  'Race Day': { market: 'Commercial', screens: ['bar', 'panel'], power: 'Battery (event)', features: ['profile-race', 'race-clock', 'finisher', 'cheer', 'mile-marker', 'results', 'clock'] },
  'Running Store': { market: 'Commercial', screens: ['bar', 'panel'], power: 'Wall', features: ['open-sign', 'run-club', 'results', 'specials', 'social'] },
});
MODEL_PRESETS['Storefront'].features.unshift('profile-store'); MODEL_PRESETS['Funeral Home'].features.unshift('profile-memorial');

// ------------------------------------------------------------------ 12. the page: buyer-facing by default
// Lab tools stay out of a buyer's way: open the page with ?lab once to unlock them on this browser, ?nolab to lock again.
(() => {
  const KEY = 'arxi-sim:commercial:lab', q = location.search + location.hash;
  try { if(/[?&#]lab\b/.test(q)) localStorage.setItem(KEY, '1'); if(/[?&#]nolab\b/.test(q)) localStorage.removeItem(KEY); } catch(e) {}
  let on = false; try { on = localStorage.getItem(KEY) === '1'; } catch(e) {}
  if(on) document.body.dataset.lab = '1'; else try { localStorage.setItem('arxi-sim:commercial:mode', '"build"'); } catch(e) {}
})();
