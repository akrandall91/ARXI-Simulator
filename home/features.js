// ===================================================================== ARXI Home: features for this section only
// This file loads on the Home page and nowhere else. Anything you add here shows up in the Home app library,
// the Build wizard (Home places only) and the Model builder. Shared apps (clock, weather, seasons...) still come
// from shared/apps.js; edit that file only for changes every section should get.
//
// Add a feature with ARXI.feature({...}). It is tagged for the Consumer market automatically.
//   id          unique, kebab-case
//   group       sidebar section; reuse one ('House') or make a new one
//   name, blurb what it is, in one line
//   tier        'free' | 'paid' | 'internal'   (price: '$5/mo' for paid)
//   devices     ['bar', 'panel'] (default), ['bar'] or ['panel']
//   situations  one or more S1(name, note, draw) scenes; draw(g, t) paints a frame, t = ms since start
//   places      optional, limit it to some Home places (default: all of them)
//   starter     optional, true = pre-ticked when that place is picked in the wizard
//   pack        optional, id of a Home pack to include it in
//
// Layout kit (shared/kit.js): LK.board / LK.line / LK.big / LK.gauge / LK.env / LK.sparkle and friends lay text out
// the same way on the Bar (wide(g), 44x11) and the Panel (44x22). Don't call store or the UI at the top level here.
//
// Every app below is built to be easy to port: text, numbers and bars in the firmware fonts, and data that is either
// typed in, sent by a button, or pulled from one simple source (named in each blurb). Where data comes from:
//   Strava API      runs, rides, weekly totals, best efforts. Garmin, COROS, Apple Watch and Peloton can all sync to Strava.
//   Apple Shortcuts a personal automation on the iPhone reads Apple Health and sends the numbers to the hub on your Wi-Fi.
//   PC companion    LibreHardwareMonitor's built-in web server (free, Windows) gives CPU/GPU numbers the hub can read.
//   Buttons         the hub's web page, a phone shortcut or a Stream Deck key sends one tap: on a call, win, in a match.
//   Calendar        the hub's calendar feed (Google or Outlook) for meetings and race day.

// ------------------------------------------------------------------ the desk as a place
PLACES.push({ id: 'desk', name: 'Desk', icon: 'screens' });
BUYERS.home.places.push('desk'); if(SEG) SEG.places.push('desk');
BUYERS.home.line = 'For your living room, bedroom, den, backyard or desk.';
PLACE_INFO.desk = { line: 'Above the monitor and on the desk: homework, gaming, streaming or work.' };
PLACE_GROUPS.desk = ['Time & Weather', 'Plans', 'Music', 'Desk & Focus', 'Gaming', 'Kids', 'Fitness', 'Streamer', 'Seasons', 'House', 'Home Extras', 'Room Profiles'];
NOT_FOR_PLACE.desk = ['rotation'];
STARTERS.desk = ['clock', 'focus-timer', 'meeting', 'calendar', 'weather-now'];
if(!SENSES.sound.places.includes('desk')) SENSES.sound.places.push('desk');
Object.assign(GROUP_ICONS, { 'Fitness': 'bolt', 'Desk & Focus': 'screens', 'Gaming': 'trophy', 'Kids': 'sparkles', 'Room Profiles': 'layers' });

const STRAVA = 0xfc5200, FOCUS = 0x6ab0ff, PLAY = 0x9b5cff, KID = 0x7ad7ff;
const FIT_PLACES = ['living', 'bedroom', 'cave', 'yard', 'desk'];
const flame = (g, x, y, t) => { const f = (t / 140 | 0) % 2; const rows = f ? ['..X..', '.XX..', '.XXX.', 'XXXXX', 'XXOXX', 'XOOOX', '.XOX.'] : ['...X.', '..XX.', '.XXX.', 'XXXXX', 'XXOXX', 'XOOOX', '.XOX.'];
  rows.forEach((r, j) => [...r].forEach((ch, i) => { if(ch !== '.') g.px(x + i, y + j, ch === 'O' ? 0xffd34a : STRAVA); })); };
const hm = (min) => `${Math.floor(min / 60)}:${String(Math.floor(min % 60)).padStart(2, '0')}`;

// ------------------------------------------------------------------ fitness and health
ARXI.feature({ id: 'weekly-miles', group: 'Fitness', name: 'Weekly Miles', tier: 'paid', price: 'TBD', places: FIT_PLACES, pack: 'fitness',
  blurb: 'Miles this week toward your goal, filling as runs sync. From Strava (Garmin, COROS and Apple Watch sync there).',
  situations: [
    S1('This week', 'A run syncs at 6 s and the bar fills toward 25 miles.', (g, t) => {
      const goal = 25, mi = t < 6000 ? 17.4 : Math.min(23.6, 17.4 + (t - 6000) / 1000 * 2.4), k = mi / goal, s = mi.toFixed(1), col = k >= 1 ? C.green : STRAVA; g.clear(0);
      if(wide(g)) { g.text5(s, 1, 0, C.white); const tail = 3 + g.w5(s) + g.w3('/' + goal + ' MI') <= g.w ? '/' + goal + ' MI' : '/' + goal; g.text3(tail, 3 + g.w5(s), 2, DIM); LK.gauge(g, 1, 9, g.w - 2, 10, k, col); }
      else { LK.line(g, 'THIS WEEK', 1, DIM, t); LK.big(g, s + ' MI', 8, C.white, t); LK.line(g, `${Math.max(0, goal - mi).toFixed(1)} TO GO`, 15, col, t); LK.gauge(g, 2, 21, g.w - 3, 21, k, col); }
    }, 9000, 12000),
    S1('Goal hit', 'The week\'s goal is reached: a burst in green.', (g, t) => {
      g.clear(0); const k = Math.min(1, t / 800);
      if(wide(g)) { g.text5('25.3', 1, 0, C.green); g.text3('MI', 3 + g.w5('25.3'), 2, C.green); LK.gauge(g, 1, 9, g.w - 2, 10, k, C.green); }
      else { LK.line(g, 'GOAL HIT!', 1, C.green, t); g.c5('25.3 MI', 8, C.white); LK.line(g, 'NICE WEEK', 16, DIM, t); }
      if(t < 2500) { LK.sparkle(g, t, C.green, 7, 90); return { glow: 0.5, accent: C.green }; }
    }, 1200, 8000),
  ] });

ARXI.feature({ id: 'last-run', group: 'Fitness', name: 'Last Run', tier: 'paid', price: 'TBD', places: FIT_PLACES, pack: 'fitness', starter: true,
  blurb: 'Your latest run: distance, time and pace, and a gold PR badge when you beat a best. From Strava.',
  situations: [
    S1('Morning run', 'Distance, time and pace in turn.', (g, t) => {
      const rows = [['DIST', '6.2 MI'], ['TIME', '52:14'], ['PACE', '8:25/MI']], L = 3500, [k1, v] = rows[every(t, L) % 3], e = LK.env(t, L); g.clear(0);
      if(wide(g)) { LK.board(g, t, { label: k1, value: v, lc: g.scale(STRAVA, e), vc: g.scale(C.white, e) }); }
      else { LK.line(g, 'LAST RUN', 1, STRAVA, t); g.c5('6.2 MI', 8, C.white); LK.line(g, '52:14  8:25', 16, DIM, t); }
    }, 1500, 10500),
    S1('New PR', 'A 5K personal record: gold burst, then the time.', (g, t) => {
      g.clear(0); const gold = (t / 250 | 0) % 2 && t < 2500 ? C.white : GOLD;
      if(wide(g)) { g.text3('5K PR', 1, 3, gold); LK.right5(g, '21:48', 2, C.white); }
      else { LK.line(g, 'NEW 5K PR', 1, gold, t); g.c5('21:48', 8, C.white); LK.line(g, '-0:22', 16, C.green, t); }
      if(t < 2500) { LK.sparkle(g, t, GOLD, 8, 90); return { glow: 0.6, accent: GOLD }; }
    }, 3000, 9000),
  ] });

ARXI.feature({ id: 'race-countdown', group: 'Fitness', name: 'Race Countdown', tier: 'paid', price: 'TBD', places: FIT_PLACES, pack: 'fitness', starter: true,
  blurb: 'Days to your next race and today\'s workout from your plan. Race date from your calendar; plan typed in once.',
  situations: [
    S1('Training', 'Days to go, then today\'s workout.', (g, t) => {
      const L = 4500, plan = every(t, L) % 2, e = LK.env(t, L); g.clear(0);
      if(wide(g)) { LK.line(g, 'CITY HALF', 0, STRAVA, t); LK.line(g, plan ? 'TODAY 5 EASY' : '23 DAYS', 6, g.scale(plan ? C.green : C.white, e), t); }
      else { LK.line(g, 'CITY HALF', 1, STRAVA, t); g.c5('23', 8, C.white); LK.line(g, plan ? '5 MI EASY' : 'DAYS TO GO', 16, g.scale(plan ? C.green : DIM, e), t); }
    }, 1500, 13500),
    S1('Race morning', 'Race day: start time and the weather at the start.', (g, t) => {
      g.clear(0);
      if(wide(g)) { LK.line(g, 'RACE DAY', 0, g.hsv(20 + 15 * pulse(t, 2000), 230, 255), t); LK.line(g, 'GUN 7:30', 6, C.white, t); }
      else { LK.line(g, 'RACE DAY', 1, STRAVA, t); g.c5('7:30', 8, C.white); LK.line(g, '48F CLEAR', 16, DIM, t); }
      return { glow: 0.25, accent: STRAVA };
    }, 2000, 8000),
  ] });

ARXI.feature({ id: 'streak', group: 'Fitness', name: 'Streak', tier: 'paid', price: 'TBD', places: FIT_PLACES, pack: 'fitness',
  blurb: 'Days in a row you\'ve moved, with a little flame. Counts runs, rides and walks from Strava or Apple Health.',
  situations: [
    S1('12-day streak', 'The flame and the count.', (g, t) => {
      g.clear(0);
      if(wide(g)) { flame(g, 1, 2, t); g.text5('12', 8, 2, C.white); const fits = 8 + g.w5('12') + 3 + g.w3('STREAK') <= g.w; if(fits) { LK.right3(g, 'DAY', 0, DIM); LK.right3(g, 'STREAK', 6, STRAVA); } }
      else { flame(g, 20, 1, t); g.c5('12 DAYS', 9, C.white); LK.line(g, 'KEEP GOING', 17, STRAVA, t); }
      return { glow: 0.12, accent: STRAVA };
    }, 2000, 8000),
  ] });

ARXI.feature({ id: 'health-today', group: 'Fitness', name: 'Today\'s Health', tier: 'paid', price: 'TBD', places: FIT_PLACES, pack: 'fitness',
  blurb: 'Steps, resting heart rate and sleep from Apple Health, sent to the hub by an iPhone Shortcut. Private: only what you pick, only while you\'re in the room.',
  situations: [
    S1('Morning check', 'Sleep, resting heart rate and steps, one at a time.', (g, t) => {
      const rows = [['SLEEP', '7H 12M', 'GOOD NIGHT', 0x9b8cff, 0.9], ['REST HR', '52', 'BPM  LOW', C.red, 0], ['STEPS', '8,214', 'OF 10,000', C.green, 0.82]], L = 4000, [lb, v, sub, col, k] = rows[every(t, L) % 3], e = LK.env(t, L); g.clear(0);
      if(wide(g)) { LK.board(g, t, { label: lb, value: v, lc: g.scale(col, e), vc: g.scale(C.white, e) }); }
      else { LK.line(g, lb, 1, g.scale(col, e), t); LK.big(g, v, 8, g.scale(C.white, e), t); if(k) LK.gauge(g, 2, 18, g.w - 3, 19, k * e, col); else LK.line(g, sub, 16, g.scale(DIM, e), t); }
    }, 1500, 12000),
  ] });

ARXI.feature({ id: 'pr-board', group: 'Fitness', name: 'PR Board', tier: 'paid', price: 'TBD', places: FIT_PLACES, pack: 'fitness',
  blurb: 'Your best times at 5K, 10K and the half, from Strava\'s best efforts.',
  situations: [
    S1('Bests', 'Three distances.', (g, t) => {
      const prs = [['5K', '21:48'], ['10K', '46:30'], ['HALF', '1:44:10']]; g.clear(0);
      if(wide(g)) { const L = 3000, [d, tm] = prs[every(t, L) % 3], e = LK.env(t, L); LK.board(g, t, { label: d, value: tm, lc: g.scale(GOLD, e), vc: g.scale(C.white, e) }); }
      else prs.forEach(([d, tm], i) => { const y = 1 + i * 7; g.text3(d, 1, y, GOLD); LK.right3(g, tm, y, C.white); });
    }, 1500, 9000),
  ] });

// ------------------------------------------------------------------ desk and focus
ARXI.feature({ id: 'focus-timer', group: 'Desk & Focus', name: 'Focus Timer', tier: 'free', places: ['desk', 'bedroom', 'living'], pack: 'desk',
  blurb: 'Pomodoro blocks: focus, then a short break, with a bar that empties as time runs. Start it from the hub page or a button.',
  situations: [
    S1('Focus block', '25 minutes compressed into 25 s, then a 5-minute break.', (g, t) => {
      const focus = t < 25000, left = focus ? 25 * 60 - t / 1000 * 60 : 5 * 60 - (t - 25000) / 1000 * 60, k = focus ? 1 - t / 25000 : 1 - (t - 25000) / 5000, col = focus ? FOCUS : C.green; g.clear(0);
      if(wide(g)) { g.text3(focus ? 'FOCUS' : 'BREAK', 1, 2, col); LK.right5(g, mmss(Math.max(0, left)), 1, C.white); LK.gauge(g, 1, 10, g.w - 2, 10, k, g.scale(col, 0.7)); }
      else { LK.line(g, focus ? 'FOCUS' : 'BREAK', 1, col, t); g.c5(mmss(Math.max(0, left)), 8, C.white); LK.line(g, '3 OF 4', 15, DIM, t); LK.gauge(g, 0, 21, g.w - 1, 21, k, g.scale(col, 0.7)); }
      return !focus && t < 26500 ? { glow: 0.3, accent: C.green } : null;
    }, 8000, 30000),
    S1('Homework', 'The kids\' version: bright, with a star for every block done.', (g, t) => {
      const left = 20 * 60 - t / 1000 * 60, stars = 2 + (left <= 0 ? 1 : 0); g.clear(0);
      if(wide(g)) { LK.line(g, 'HOMEWORK', 0, KID, t); g.text3(left > 0 ? mmss(left) : 'BREAK!', 1, 6, left > 0 ? C.white : C.green); for(let i = 0; i < 3; i++) LK.star(g, g.w - 18 + i * 6, 6, i < stars ? GOLD : 0x2a2e34); }
      else { LK.line(g, 'HOMEWORK', 1, KID, t); LK.big(g, left > 0 ? mmss(left) : 'BREAK!', 8, left > 0 ? C.white : C.green, t); for(let i = 0; i < 3; i++) LK.star(g, 13 + i * 6, 16, i < stars ? GOLD : 0x2a2e34); }
      return left <= 0 ? { glow: 0.4, accent: GOLD } : null;
    }, 5000, 24000),
  ] });

ARXI.feature({ id: 'call-light', group: 'Desk & Focus', name: 'On a Call', tier: 'free', places: ['desk'], pack: 'desk', starter: true,
  blurb: 'A red ON A CALL sign the family can see from the door. Turns on from your calendar or one tap, off when the call ends.',
  situations: [
    S1('On a call', 'Red until the call ends at 12 s, then green.', (g, t) => {
      const on = t < 12000, red = g.scale(C.red, 0.75 + 0.25 * pulse(t, 2400)), left = Math.max(0, 15 * 60 - t / 1000 * 60); g.clear(on ? 0x140000 : 0);
      if(wide(g)) { if(on) { LK.line(g, 'ON A CALL', 0, red, t); LK.line(g, 'ENDS 2:30', 6, DIM, t); } else { g.c5('FREE', 2, C.green); } }
      else { if(on) { g.rect(0, 0, g.w - 1, 0, red); g.rect(0, g.h - 1, g.w - 1, g.h - 1, red); g.rect(0, 0, 0, g.h - 1, red); g.rect(g.w - 1, 0, g.w - 1, g.h - 1, red);
          LK.line(g, 'ON A CALL', 2, red, t); g.c5(mmss(left), 8, C.white); LK.line(g, 'ENDS 2:30', 15, DIM, t); }
        else { g.c5('FREE', 5, C.green); LK.line(g, 'COME ON IN', 14, DIM, t); } }
      return on ? { glow: 0.3, accent: C.red } : { glow: 0.15, accent: C.green };
    }, 4000, 16000),
  ] });

ARXI.feature({ id: 'meeting', group: 'Desk & Focus', name: 'Next Meeting', tier: 'free', places: ['desk', 'living'], pack: 'desk',
  blurb: 'Your next meeting and how long until it starts, amber in the last 5 minutes. From the hub\'s calendar.',
  situations: [
    S1('Coming up', 'Counts down from 8 minutes; amber under 5, NOW at zero.', (g, t) => {
      const left = Math.max(0, 8 - t / 1000 * 0.5), now = left <= 0, col = now ? ((t / 400 | 0) % 2 ? C.red : C.white) : left < 5 ? C.amber : C.white, v = now ? 'NOW' : `${Math.ceil(left)} MIN`; g.clear(0);
      if(wide(g)) { LK.line(g, 'TEAM SYNC', 0, FOCUS, t); LK.line(g, now ? 'NOW' : 'IN ' + v, 6, col, t); }
      else { LK.line(g, 'NEXT UP', 1, DIM, t); LK.line(g, 'TEAM SYNC', 8, FOCUS, t); LK.big(g, v, 14, col, t); }
      return left < 5 ? { glow: now ? 0.4 : 0.15, accent: now ? C.red : C.amber } : null;
    }, 8000, 20000),
  ] });

ARXI.feature({ id: 'world-clocks', group: 'Desk & Focus', name: 'World Clocks', tier: 'free', places: ['desk', 'living'], pack: 'desk',
  blurb: 'The time where your team is, with a sun or moon dot for day and night. Typed in once.',
  situations: [
    S1('Three cities', 'New York, London, Tokyo.', (g, t) => {
      const cities = [['NYC', '9:14', true], ['LDN', '2:14', true], ['TYO', '11:14', false]]; g.clear(0);
      const dotc = (day) => day ? GOLD : 0x8aa0ff;
      if(wide(g)) { const L = 3000, [c, tm, day] = cities[every(t, L) % 3], e = LK.env(t, L); dot(g, 2, 5, g.scale(dotc(day), e), 1); g.text3(c, 6, 3, g.scale(DIM, e)); LK.right5(g, tm, 2, g.scale(C.white, e)); }
      else cities.forEach(([c, tm, day], i) => { const y = 1 + i * 7; dot(g, 2, y + 2, dotc(day), 1); g.text3(c, 6, y, DIM); LK.right3(g, tm, y, C.white); });
    }, 1500, 9000),
  ] });

ARXI.feature({ id: 'pc-stats', group: 'Desk & Focus', name: 'PC Stats', tier: 'free', places: ['desk'], pack: 'gaming',
  blurb: 'CPU and GPU temperature and load while you play or render. Read from LibreHardwareMonitor\'s web server on your PC.',
  situations: [
    S1('Under load', 'A game starts at 3 s and temperatures climb.', (g, t) => {
      const k = Math.min(1, Math.max(0, (t - 3000) / 8000)), cpu = Math.round(48 + 20 * k), gpu = Math.round(44 + 32 * k), cl = (Math.round(12 + 30 * k)), gl = Math.round(8 + 88 * k);
      const col = (c) => c < 65 ? C.green : c < 78 ? C.amber : C.red; g.clear(0);
      const row = (y, nm, tc, ld, gy, gh) => { g.text3(nm, 1, y, DIM); LK.right3(g, `${tc}C`, y, col(tc)); LK.gauge(g, 15, gy, g.w - 18, gy + gh, ld / 100, col(tc)); };
      if(wide(g)) { row(0, 'CPU', cpu, cl, 1, 2); row(6, 'GPU', gpu, gl, 7, 2); }
      else { const big = (y, nm, tc, ld) => { g.text3(nm, 1, y, DIM); LK.right3(g, `${tc}C ${ld}%`, y, col(tc)); LK.gauge(g, 1, y + 7, g.w - 2, y + 8, ld / 100, col(tc)); }; big(1, 'CPU', cpu, cl); big(12, 'GPU', gpu, gl); }
    }, 10000, 14000),
  ] });

// ------------------------------------------------------------------ gaming
ARXI.feature({ id: 'session-timer', group: 'Gaming', name: 'Game Session', tier: 'free', places: ['desk', 'cave', 'living', 'bedroom'], pack: 'gaming',
  blurb: 'How long you\'ve been playing, with a stretch-and-water reminder every hour. Starts when the PC or console wakes, or with a tap.',
  situations: [
    S1('Hour mark', 'Playing 58 minutes; at 60 the break reminder.', (g, t) => {
      const min = 58 + t / 1000 / 3, brk = min >= 60 && min < 62; g.clear(0);
      if(brk) { const on = (t / 500 | 0) % 2; if(wide(g)) { LK.line(g, 'TAKE 5', 0, on ? C.amber : C.white, t); LK.line(g, 'STRETCH + WATER', 6, DIM, t); } else { LK.line(g, '1 HOUR', 1, DIM, t); LK.big(g, 'TAKE 5', 8, on ? C.amber : C.white, t); LK.line(g, 'STRETCH', 16, DIM, t); } return { glow: 0.3, accent: C.amber }; }
      LK.board(g, t, { label: 'PLAYED', value: hm(min), sub: 'BREAK 2:00', lc: PLAY, vc: C.white });
    }, 7000, 14000),
  ] });

ARXI.feature({ id: 'match-status', group: 'Gaming', name: 'In a Match', tier: 'free', places: ['desk', 'cave', 'bedroom'], pack: 'gaming',
  blurb: 'Tells the house you can\'t pause: IN A MATCH, then FREE when it ends. One tap from a phone or a Stream Deck key.',
  situations: [
    S1('Ranked match', 'In a match until 10 s, then GG and free.', (g, t) => {
      const on = t < 10000; g.clear(0);
      if(on) { const p = g.scale(PLAY, 0.75 + 0.25 * pulse(t, 1800)); if(wide(g)) { LK.line(g, 'IN A MATCH', 0, p, t); LK.line(g, 'BACK IN 10M', 6, DIM, t); } else { LK.line(g, "CAN'T PAUSE", 1, DIM, t); LK.line(g, 'IN A MATCH', 9, p, t); LK.line(g, 'BACK IN 10M', 16, DIM, t); } return { glow: 0.2, accent: PLAY }; }
      if(wide(g)) g.c5('GG', 2, C.green); else { g.c5('GG', 5, C.green); LK.line(g, 'FREE NOW', 14, DIM, t); }
      return t < 11500 ? { glow: 0.4, accent: C.green } : null;
    }, 4000, 14000),
  ] });

ARXI.feature({ id: 'win-tally', group: 'Gaming', name: 'Win Tally', tier: 'free', places: ['desk', 'cave'], pack: 'gaming',
  blurb: 'Wins and losses tonight and your current streak. One tap to add a W or an L.',
  situations: [
    S1('Tonight', 'A win lands at 5 s and the streak grows.', (g, t) => {
      const won = t >= 5000, W = won ? 8 : 7, L = 3, st = won ? 4 : 3, flash = won && t < 6200 && (t / 200 | 0) % 2; g.clear(flash ? 0x0a2a10 : 0);
      if(wide(g)) { g.text3('W', 1, 3, C.green); g.text5(String(W), 6, 2, C.white); const ls = String(L); g.text5(ls, g.w - g.w5(ls), 2, C.white); g.text3('L', g.w - g.w5(ls) - 5, 3, C.red); g.c3(`${st}X`, 3, GOLD); }
      else { g.text3('W', 6, 2, C.green); g.text3('L', g.w - 9, 2, C.red); g.text5(String(W), 4, 8, C.white); g.text5(String(L), g.w - g.w5(String(L)) - 5, 8, C.white); LK.line(g, `STREAK ${st}`, 16, GOLD, t); }
      return won && t < 7000 ? { glow: 0.45, accent: C.green } : null;
    }, 6000, 10000),
  ] });

ARXI.feature({ id: 'stream-scenes', group: 'Streamer', name: 'Stream Scenes', tier: 'paid', price: 'TBD', places: ['desk', 'cave', 'living'], pack: 'creator',
  blurb: 'Starting soon with a countdown, be right back, and thanks for watching, on the wall behind you. Switches with your OBS scene or a key.',
  situations: [
    S1('Starting soon', 'Countdown from 1:00 with a moving dot line.', (g, t) => {
      const left = Math.max(0, 60 - t / 1000 * 3); g.clear(0); const dots = (y) => { for(let i = 0; i < 6; i++) g.px(((t / 60 | 0) + i * 8) % g.w, y, g.hsv(240 + i * 8, 200, 255)); };
      if(wide(g)) { LK.line(g, 'LIVE SOON', 0, PINK, t); g.c3(mmss(left), 6, C.white); dots(10); }
      else { LK.line(g, 'STARTING', 1, PINK, t); LK.line(g, 'SOON', 7, PINK, t); g.c5(mmss(left), 13, C.white); dots(21); }
      return { glow: 0.2, accent: PINK };
    }, 4000, 20000),
    S1('Be right back', 'BRB with how long you\'ve been away.', (g, t) => {
      g.clear(0); const away = 45 + t / 1000;
      if(wide(g)) { g.text5('BRB', 1, 2, PINK); LK.right3(g, 'AWAY', 0, DIM); LK.right3(g, mmss(away), 6, C.white); }
      else { g.c5('BRB', 3, PINK); LK.line(g, 'AWAY ' + mmss(away), 14, DIM, t); }
    }, 3000, 12000),
  ] });

// ------------------------------------------------------------------ kids
ARXI.feature({ id: 'screen-time', group: 'Kids', name: 'Screen Time', tier: 'free', places: ['desk', 'living', 'bedroom', 'cave'], pack: 'kids',
  blurb: 'Game or tablet time left today, set by a parent from the hub page. Amber at 5 minutes, TIME\'S UP at zero.',
  situations: [
    S1('Running out', 'From 8 minutes to zero.', (g, t) => {
      const left = Math.max(0, 8 * 60 - t / 1000 * 30), up = left <= 0, col = up ? C.red : left < 300 ? C.amber : C.green; g.clear(0);
      if(up) { const on = (t / 500 | 0) % 2; if(wide(g)) { LK.line(g, "TIME'S UP", 0, on ? C.red : C.white, t); LK.line(g, 'SAVE + QUIT', 6, DIM, t); } else { LK.line(g, 'SCREEN TIME', 1, DIM, t); LK.big(g, "TIME'S UP", 8, on ? C.red : C.white, t); LK.line(g, 'SAVE + QUIT', 16, DIM, t); } return { glow: 0.35, accent: C.red }; }
      if(wide(g)) { g.text3('LEFT', 1, 2, DIM); LK.right5(g, mmss(left), 1, col); LK.gauge(g, 1, 10, g.w - 2, 10, left / 480, col); }
      else { LK.line(g, 'SCREEN TIME', 1, DIM, t); g.c5(mmss(left), 8, col); LK.gauge(g, 2, 17, g.w - 3, 18, left / 480, col); }
    }, 10000, 20000),
  ] });

ARXI.feature({ id: 'reading-log', group: 'Kids', name: 'Reading Log', tier: 'free', places: ['desk', 'bedroom', 'living'], pack: 'kids',
  blurb: 'Minutes read this week toward the goal, a star for every 30. Logged with one tap after reading.',
  situations: [
    S1('This week', 'A session gets logged at 4 s and a new star lights.', (g, t) => {
      const min = t < 4000 ? 85 : 105, stars = Math.floor(min / 30), pop = t >= 4000 && t < 5500; g.clear(0);
      if(wide(g)) { LK.line(g, `${min}/120 MIN`, 0, KID, t); for(let i = 0; i < 4; i++) LK.star(g, 10 + i * 7, 6, i < stars ? (pop && i === stars - 1 ? C.white : GOLD) : 0x2a2e34); }
      else { LK.line(g, 'READING', 1, KID, t); g.c5(`${min} MIN`, 8, C.white); for(let i = 0; i < 4; i++) LK.star(g, 9 + i * 7, 16, i < stars ? (pop && i === stars - 1 ? C.white : GOLD) : 0x2a2e34); }
      return pop ? { glow: 0.35, accent: GOLD } : null;
    }, 5000, 9000),
  ] });

// ------------------------------------------------------------------ room profiles for home
// Same engine as Commercial (shared/kit.js). Senses at home: light follows the lamps, presence rests the screens when
// the room empties, sound lets the glow breathe with the game or the music.
const HOME_PROFILES = [
  { id: 'profile-runner', places: ['living', 'bedroom'], name: 'Runner\'s home', accent: STRAVA,
    blurb: 'For your friends who race: training on the Bar, health on the Panel, a PR celebrated when the watch syncs.',
    parts: [
      { name: 'Morning', note: 'Bar: race countdown and today\'s workout. Panel: last night\'s sleep, resting HR and steps.', bar: ['race-countdown'], pan: ['health-today'], light: 0.5, presence: 'some' },
      { name: 'After the run', note: 'The run syncs. Bar: the run. Panel: the week\'s miles filling.', bar: ['last-run'], pan: ['weekly-miles'], light: 0.85, presence: 'some' },
      { name: 'New PR', note: 'Bar: the PR burst. Panel: the PR board.', bar: ['last-run', 1], pan: ['pr-board'], light: 0.85, presence: 'some', accentGlow: 0.3 },
      { name: 'Evening', note: 'Lamps low. Bar: the streak. Panel: days to the race.', bar: ['streak'], pan: ['race-countdown'], light: 0.35, presence: 'some' },
    ] },
  { id: 'profile-kid-desk', places: ['desk'], name: 'Kid\'s desk', accent: KID,
    blurb: 'Homework first, then game time with a limit, then reading and bed. Bright and friendly, never harsh at night.',
    parts: [
      { name: 'Homework', note: 'Bar: homework timer with stars. Panel: chores still to do.', bar: ['focus-timer', 1], pan: ['chores'], light: 0.8, presence: 'some' },
      { name: 'Game time', note: 'Bar: screen time left. Panel: wins tonight.', bar: ['screen-time'], pan: ['win-tally'], light: 0.6, presence: 'some', sound: 0.5 },
      { name: 'Reading', note: 'Bar: reading log. Panel: bedtime countdown.', bar: ['reading-log'], pan: ['bedtime'], light: 0.35, presence: 'some' },
      { name: 'Lights out', note: 'Room empty: a faint line until someone comes in at 6 s.', bar: ['bedtime'], pan: ['reading-log'], light: 0.1, presence: 'empty', walkup: 6000 },
    ] },
  { id: 'profile-gamer', places: ['desk', 'cave'], name: 'Gaming setup', accent: PLAY,
    blurb: 'For teens and adults: session time and PC temps while you play, a do-not-disturb sign for ranked, and a break nudge. Purple glow that pulses with the game.',
    parts: [
      { name: 'Warm-up', note: 'Bar: session time. Panel: CPU and GPU temps as the game loads.', bar: ['session-timer'], pan: ['pc-stats'], light: 0.5, presence: 'some', sound: 0.3 },
      { name: 'Ranked', note: 'Bar: IN A MATCH for the house. Panel: wins tonight. Loud: the glow breathes.', bar: ['match-status'], pan: ['win-tally'], light: 0.35, presence: 'some', sound: 0.9 },
      { name: 'Break', note: 'Bar: the one-hour break nudge. Panel: PC cools down.', bar: ['session-timer'], pan: ['pc-stats'], at: 6500, light: 0.4, presence: 'some' },
      { name: 'Away', note: 'Nobody at the desk: resting purple line; back at 5 s.', bar: ['session-timer'], pan: ['win-tally'], light: 0.25, presence: 'empty', walkup: 5000 },
    ] },
  { id: 'profile-streamer', places: ['desk', 'cave'], name: 'Streamer desk', accent: PINK,
    blurb: 'The screens behind you are part of the stream: starting soon, ON AIR, follower alerts, hype with the room, BRB.',
    parts: [
      { name: 'Starting soon', note: 'Bar: starting soon countdown. Panel: the follower goal.', bar: ['stream-scenes'], pan: ['goal'], light: 0.45, presence: 'some' },
      { name: 'Live', note: 'Bar: ON AIR. Panel: new follower alerts.', bar: ['on-air'], pan: ['follower'], light: 0.4, presence: 'some', sound: 0.5 },
      { name: 'Hype', note: 'Bar: hype meter. Panel: stream timer. The glow follows your mic and the room.', bar: ['hype'], pan: ['uptime'], light: 0.4, presence: 'busy', sound: 0.95 },
      { name: 'Be right back', note: 'Bar: BRB. Panel: the goal so viewers stay.', bar: ['stream-scenes', 1], pan: ['goal'], light: 0.4, presence: 'empty', walkup: 7000 },
    ] },
  { id: 'profile-office', places: ['desk'], name: 'Home office', accent: 0xf2a640,
    blurb: 'For professionals: the next meeting, focus blocks, a red light the family can see while you\'re on a call, and a lunch run.',
    parts: [
      { name: 'Morning', note: 'Bar: next meeting. Panel: where your team is.', bar: ['meeting'], pan: ['world-clocks'], light: 0.8, presence: 'some' },
      { name: 'Deep work', note: 'Bar: focus timer. Panel: next meeting, quiet.', bar: ['focus-timer'], pan: ['meeting'], light: 0.75, presence: 'some' },
      { name: 'On a call', note: 'Bar and Panel go red for the door; green when the call ends.', bar: ['call-light'], pan: ['meeting'], light: 0.75, presence: 'some' },
      { name: 'Lunch run', note: 'Bar: weekly miles after the run syncs. Panel: the run.', bar: ['weekly-miles'], pan: ['last-run'], light: 0.85, presence: 'some' },
      { name: 'After hours', note: 'Empty office: resting line; wakes when you walk in at 5 s.', bar: ['meeting'], pan: ['world-clocks'], light: 0.2, presence: 'empty', walkup: 5000 },
    ] },
];
for(const p of HOME_PROFILES) ARXI.feature({ id: p.id, group: 'Room Profiles', name: p.name, tier: 'free', places: p.places, starter: true, blurb: p.blurb,
  situations: [wholeDay(p.parts, p.accent), ...p.parts.map(part => profilePart(part, p.accent))] });

// ------------------------------------------------------------------ packs and presets
// Prices are left as TBD on purpose: set them in shared/tiers.js style ('$3/mo (draft)') when decided.
PACKS.splice(PACKS.findIndex(p => p.id === 'household'), 0,
  { id: 'fitness', name: 'Fitness & Health', icon: 'bolt', market: 'Consumer', line: 'Your runs, weekly miles, streak, PRs and today\'s health, from Strava and Apple Health.', incl: [], price: 'Price TBD', apps: ['last-run', 'weekly-miles', 'race-countdown', 'streak', 'health-today', 'pr-board'] },
  { id: 'desk', name: 'Desk & Focus', icon: 'screens', market: 'Consumer', line: 'Focus timer, on-a-call light, next meeting and world clocks.', incl: ['pro', 'connected'], price: 'Price TBD', apps: ['focus-timer', 'call-light', 'meeting', 'world-clocks'] },
  { id: 'gaming', name: 'Gaming', icon: 'trophy', market: 'Consumer', line: 'Session timer with break nudges, in-a-match sign, win tally and PC temps.', incl: [], price: 'Price TBD', apps: ['session-timer', 'match-status', 'win-tally', 'pc-stats'] },
  { id: 'kids', name: 'Kids', icon: 'sparkles', market: 'Consumer', line: 'Homework timer with stars, screen time, reading log, chores and bedtime.', incl: [], price: 'Price TBD', apps: ['focus-timer', 'screen-time', 'reading-log', 'chores', 'bedtime'] });
PACKS.unshift({ id: 'profiles-home', name: 'Room Profile', icon: 'layers', market: 'Consumer', line: 'The room set up for every part of the day, with the senses.', incl: ['lite', 'pro', 'connected'], apps: HOME_PROFILES.map(p => p.id) });
Object.assign(MODEL_PRESETS, {
  'Runner': { market: 'Consumer', screens: ['bar', 'panel'], power: 'Wall', features: ['profile-runner', 'race-countdown', 'last-run', 'weekly-miles', 'streak', 'health-today', 'pr-board', 'clock', 'weather-now'] },
  'Kid\'s Desk': { market: 'Consumer', screens: ['bar', 'panel'], power: 'Wall', features: ['profile-kid-desk', 'focus-timer', 'screen-time', 'reading-log', 'chores', 'bedtime', 'clock'] },
  'Gaming Setup': { market: 'Consumer', screens: ['bar', 'panel'], power: 'Wall', features: ['profile-gamer', 'session-timer', 'match-status', 'win-tally', 'pc-stats', 'visualizers', 'clock'] },
  'Home Office': { market: 'Consumer', screens: ['bar', 'panel'], power: 'Wall', features: ['profile-office', 'meeting', 'focus-timer', 'call-light', 'world-clocks', 'calendar', 'weather-now'] },
});
if(MODEL_PRESETS['Streamer Desk']) MODEL_PRESETS['Streamer Desk'].features.unshift('profile-streamer', 'stream-scenes');
