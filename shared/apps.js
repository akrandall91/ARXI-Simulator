// ===================================================================== ARXI Simulator: app library
// Firmware apps run the real ARXIv2 renderers. Concept apps are drawn in JS with the firmware's own fonts, so a
// prototype looks exactly like it will once ported to C++. Add an app with ARXI.registerApp({...}).
const ARXI = { apps: [], registerApp(a) { this.apps.push(a); return a; } };

const at = (y, mo, d, h, mi) => Math.floor(Date.UTC(y, mo - 1, d, h, mi) / 1000);
const SAT = (h, m) => at(2026, 11, 7, h, m);   // a Saturday in November
const WED = (h, m) => at(2026, 11, 4, h, m);

const SONGS = {
  neon: { title: 'Neon Avenue', artist: 'Glass Harbor', dur: 214000, lines: [
    [4000, 'City lights are on fire tonight'], [8000, 'Your heart is a rocket in the dark'], [12000, 'We ride the night with the windows down'],
    [16000, 'Chasing every star across the sky'], [20000, 'Diamonds in the rain'], [24000, ''],
    [30000, 'City lights are on fire tonight'], [34000, 'Your heart is a rocket in the dark'], [38000, 'Crown on my head and money on my mind'],
    [42000, 'Moon on the water, waves in my soul'], [46000, 'Diamonds in the rain'], [50000, '']] },
  bloom: { title: 'Slow Bloom', artist: 'Ivy Lane', dur: 188000, lines: [
    [4000, 'Coffee on the window, morning sun'], [9000, 'A rose for every little thing you said'], [14000, 'Light a candle when the rain comes down'],
    [19000, 'Butterfly, you do not have to run'], [24000, ''], [30000, 'A rose for every little thing you said'], [35000, 'Slow bloom, slow bloom']] },
  none: { title: 'Late Drive (Instrumental)', artist: 'Glass Harbor', dur: 240000, lines: [] },
};
const song = (k, extra = {}) => ({ set: { MUSIC_PLAYING: 1, TRACK_POS: 0, TRACK_AT: 0, TRACK_DUR: SONGS[k].dur, ...extra }, text: { TITLE: SONGS[k].title, ARTIST: SONGS[k].artist }, lyrics: SONGS[k].lines });
const merge = (...ws) => { const o = { set: {}, text: {}, lyrics: null, epoch: 0 }; for(const w of ws) { if(!w) continue; Object.assign(o.set, w.set || {}); Object.assign(o.text, w.text || {}); if(w.lyrics) o.lyrics = w.lyrics; if(w.epoch) o.epoch = w.epoch; } return o; };
const bills = { text: { AWAY: 'BUF', HOME: 'MIA', CLOCK: '8:42', DOWN: '3RD & 5' }, set: { GAME_ON: 1, GAME_LEAGUE: 0, GAME_STATE: 1, GAME_PERIOD: 2, AWAY_SCORE: 14, HOME_SCORE: 10, POSSESSION: 1, BALL: 62, AWAY_C1: 0x00338d, AWAY_C2: 0xc60c30, HOME_C1: 0x008e97, HOME_C2: 0xfc4c02, FAV: 1 } };
const ev = (at, type, side = 0, value = 0, sad = false) => ({ at, do: 'bar', a: 2, p1: type, p2: side | (value << 8) | (sad ? 1 << 16 : 0) });

// --------------------------------------------------------------------------------------- the mini-app catalogue
// One app = one job. `group` sets the sidebar section. Firmware apps run the real renderers; concept apps draw in JS.
const FW = (group, id, name, tier, blurb, situations, extra = {}) => ARXI.registerApp({ id, group, name, kind: 'firmware', tier, audience: extra.audience || 'Home', devices: extra.devices || ['bar', 'panel'], price: extra.price, blurb, situations });
const CO = (group, id, name, tier, price, audience, blurb, situations, devices = ['bar', 'panel']) => ARXI.registerApp({ id, group, name, kind: 'concept', tier, price, audience, devices, blurb, situations });
const prev = (name, screen, world, note, len = 20000, snap = 4000) => ({ name, note, len, snap, world, actions: [{ at: 0, do: 'bar', a: 1, p1: screen, p2: len }] });
const wxTest = (name, code, epoch = SAT(13, 0)) => ({ name, note: `The weather scene for WMO code ${code}, held on screen.`, len: 14000, snap: 3500, world: { epoch, set: { WX_CODE: code } }, actions: [{ at: 0, do: 'bar', a: 7, p1: code }] });
const ramp = (len = 40000) => [{ key: 'SUN_PROGRESS', at: 0, over: len, from: 0, to: 1000 }];

// ===== Time & Weather
FW('Time & Weather', 'clock', 'Clock', 'free', 'The big clock in the screen style.', [
  prev('Evening clock', 0, { epoch: SAT(19, 42) }, 'Clock screen held in Classic.'),
  prev('24-hour with seconds', 0, { epoch: SAT(21, 7), set: { USE24: 1, SHOW_SECONDS: 1 } }, '24-hour format with seconds ticking.'),
  prev('Night style', 0, { epoch: SAT(2, 14), set: { STYLE: 5 } }, 'Night style: dim red, easy on the eyes.'),
]);
FW('Time & Weather', 'date', 'Date', 'free', 'Day and date.', [prev('Today', 1, { epoch: SAT(10, 0) }, 'Date screen held.')]);
FW('Time & Weather', 'weather-now', 'Weather Now', 'free', 'Current conditions as an animated scene with the temperature.', [
  prev('Partly cloudy', 3, { epoch: SAT(13, 10), set: { WX_CODE: 2, WX_TEMP: 62 } }, 'Weather screen, partly cloudy.'),
  prev('Rainy morning', 3, { epoch: WED(7, 5), set: { WX_CODE: 61, WX_TEMP: 51, STYLE: 1 } }, 'Rain in Minimal style.'),
  prev('Thunderstorm', 3, { epoch: SAT(16, 20), set: { WX_CODE: 95, WX_TEMP: 74, STYLE: 4 } }, 'Storm with lightning strikes, Vibrant.', 30000, 12000),
  prev('Snow day', 3, { epoch: SAT(9, 30), set: { WX_CODE: 71, WX_TEMP: 28, STYLE: 7 } }, 'Snow in Lounge.'),
  prev('Clear night', 3, { epoch: SAT(22, 30), set: { WX_CODE: 0, WX_TEMP: 48 } }, 'Clear sky after dark.'),
]);
FW('Time & Weather', 'forecast', 'Forecast', 'free', 'The next hours, then the next days, in six pages.', [prev('Forecast pages', 10, { epoch: SAT(8, 10) }, 'All six pages.', 40000, 6000)]);
FW('Time & Weather', 'air', 'Air Quality', 'free', 'AQI with a colour band.', [
  prev('Good air', 6, { epoch: SAT(11, 0), set: { AQI: 28 } }, 'AQI 28.'), prev('Unhealthy air', 6, { epoch: SAT(14, 0), set: { AQI: 168, WX_CODE: 45 } }, 'AQI 168.')]);
FW('Time & Weather', 'moon', 'Moon Phase', 'free', 'Tonight\'s moon.', [prev('Moon tonight', 5, { epoch: SAT(23, 30), set: { STYLE: 5 } }, 'Moon screen, Night style.')]);
FW('Time & Weather', 'sun-arc', 'Sun Arc', 'free', 'Where the sun is between sunrise and sunset.', [prev('Afternoon', 12, { epoch: SAT(15, 10) }, 'Sun arc mid-afternoon.'), prev('Just after sunset', 12, { epoch: SAT(18, 40) }, 'Sun arc after sunset.')]);
FW('Time & Weather', 'timeline', 'Day Timeline', 'free', 'The day as a bar: now, sunrise, sunset and events.', [prev('With an event', 11, { epoch: SAT(11, 0), set: { CAL_ON: 1, CAL_AT: 180, CAL_LEN: 90 }, text: { CAL_TITLE: 'Soccer practice' } }, 'Timeline with an afternoon event.')]);
FW('Time & Weather', 'rotation', 'Idle Rotation', 'free', 'All the idle screens taking turns, the way the bar runs most of the day.', [
  { name: 'Evening rotation', note: 'The full rotation. The panel shows the partner half of whatever the bar is on.', len: 90000, snap: 3000, world: { epoch: SAT(19, 42) } }]);
FW('Time & Weather', 'styles', 'Screen Styles', 'free', 'Eight looks shared by every screen, plus your own colours.', [
  { name: 'Style tour', note: 'Classic, Minimal, Noir, Terminal, Vibrant, Night, Carbon, Lounge, 6 s each.', len: 48000, snap: 26000, world: { epoch: SAT(20, 15), set: { MIC_ON: 1 } }, actions: [0, 1, 2, 3, 4, 5, 6, 7].map((s, i) => ({ at: i * 6000, set: { STYLE: s } })) },
  { name: 'My colours', note: 'Screen colours "My colours": text from colour 1, backdrop from colour 2, hue locked.', len: 40000, snap: 3000, world: { epoch: SAT(21, 0), set: { COLOUR_MODE: 1, C1: 0x9a5cff, C2: 0x10a0a0 } } },
]);

// ===== Plans
FW('Plans', 'calendar', 'Calendar', 'free', 'Your next event, reminders before it starts, and the morning agenda.', [
  prev('Next event', 2, { epoch: WED(9, 30), set: { CAL_ON: 1, CAL_AT: 45, CAL_LEN: 30 }, text: { CAL_TITLE: 'Team standup' } }, 'Next event screen.'),
  { name: '5-minute reminder', note: 'An event 5 minutes away raises the calendar banner.', len: 20000, snap: 3000, world: { epoch: WED(9, 55), set: { CAL_ON: 1, CAL_AT: 5, CAL_LEN: 30 }, text: { CAL_TITLE: 'Team standup' } } },
  { name: 'Morning briefing', note: 'The agenda shown when someone walks into an empty room in the morning.', len: 20000, snap: 4000, world: { epoch: WED(7, 30), set: { CAL_ON: 1, CAL_AT: 90, CAL_LEN: 60 }, text: { CAL_TITLE: 'Dentist' } }, actions: [{ at: 300, do: 'bar', a: 16 }] },
]);
FW('Plans', 'week', 'Week Ahead', 'free', 'The week and the month at a glance.', [
  prev('Week ahead', 14, { epoch: WED(8, 0), set: { CAL_ON: 1, CAL_AT: 1500 } }, 'Week ahead screen.'), prev('Month', 15, { epoch: WED(8, 0), set: { CAL_ON: 1 } }, 'Month grid screen.'),
  { name: 'Week recap', note: 'The week recap page.', len: 15000, snap: 4000, world: { epoch: SAT(10, 0) }, actions: [{ at: 0, do: 'bar', a: 13 }] }]);
FW('Plans', 'countdown', 'Countdowns', 'free', 'Days until the things you are waiting for.', [
  prev('Vacation', 7, { epoch: SAT(10, 0), set: { CD_ON: 1, CD_DAYS: 12 }, text: { CD_LABEL: 'Vacation' } }, '12 days to go.'),
  prev('Birthday', 7, { epoch: SAT(10, 0), set: { CD_ON: 1, CD_DAYS: 3, CD_KIND: 1 }, text: { CD_LABEL: 'Mom' } }, 'A birthday in 3 days.')]);
FW('Plans', 'timers', 'Timers', 'free', 'Kitchen timers with a TIME\'S UP alert.', [
  prev('Timer running', 8, { epoch: SAT(18, 40), set: { TIMER_ON: 1, TIMER_AT: 0, TIMER_SECS: 600 }, text: { TIMER_LABEL: 'Pasta' } }, 'A 10 minute timer.'),
  { name: 'Timer done', note: 'A 10 second pizza timer, then TIME\'S UP.', len: 24000, snap: 12500, world: { epoch: SAT(18, 45), set: { TIMER_ON: 1, TIMER_AT: 0, TIMER_SECS: 10 } } }]);
FW('Plans', 'ticker', 'Ticker', 'free', 'A scrolling line of everything: weather, events, scores.', [prev('Ticker', 13, { epoch: SAT(12, 30), set: { CAL_ON: 1, CAL_AT: 120 }, text: { CAL_TITLE: 'Lunch with Sam' } }, 'Ticker screen.', 30000, 6000)]);

// ===== Music
FW('Music', 'lyrics', 'Synced Lyrics', 'free', 'Lyrics from the Sonos or HEOS speaker, in time with the song.', [
  { name: 'Wrap then scroll', note: 'The default style: title and artist, then lines with word sync.', len: 56000, snap: 9000, world: merge({ epoch: SAT(21, 10) }, song('neon')) },
  { name: 'Scroll only', note: 'Lyric style 1.', len: 40000, snap: 9000, world: merge({ epoch: SAT(21, 10), set: { LYRIC_STYLE: 1 } }, song('neon')) },
  { name: 'Wrap only', note: 'Lyric style 2.', len: 40000, snap: 9000, world: merge({ epoch: SAT(21, 10), set: { LYRIC_STYLE: 2 } }, song('neon')) },
  { name: 'Typewriter', note: 'Lyric style 3.', len: 40000, snap: 9500, world: merge({ epoch: SAT(21, 10), set: { LYRIC_STYLE: 3 } }, song('bloom')) },
  { name: 'Two rows, small', note: 'Lyric style 5.', len: 40000, snap: 9000, world: merge({ epoch: SAT(21, 10), set: { LYRIC_STYLE: 5 } }, song('neon')) },
  { name: 'Vibrant beat', note: 'Vibrant: hot word colour and the beat pulse.', len: 56000, snap: 9000, world: merge({ epoch: SAT(21, 10), set: { STYLE: 4, MIC_ON: 1 } }, song('neon')) }]);
FW('Music', 'lyric-pictures', 'Lyric Pictures', 'paid', 'Keyword pictures for the words being sung (122 icons).', [
  { name: 'Pictures only', note: 'Lyric style 4: the background with icons, no words.', len: 40000, snap: 9000, world: merge({ epoch: SAT(21, 10), set: { LYRIC_STYLE: 4, STYLE: 6 } }, song('neon')) },
  { name: 'Instrumental break', note: 'The empty line at 24 s: the strip shows the held icon in the gap.', len: 40000, start: 18000, snap: 25500, world: merge({ epoch: SAT(21, 10) }, song('neon')) },
  { name: 'Icon gallery', note: 'Every icon, 2.5 s each, on both screens.', len: 122 * 2500, snap: 1200, world: { epoch: SAT(20, 0) }, actions: Array.from({ length: 122 }, (_, i) => [{ at: i * 2500, do: 'bar', a: 9, p1: i + 1 }, { at: i * 2500, do: 'pan', a: 1, p1: i + 1 }]).flat() }], { price: '$1/mo' });
FW('Music', 'visualizers', 'Visualizers', 'free', 'The panel\'s music pictures: bars, plasma, fire, aurora and 20 more.', [
  { name: 'Visualizer tour', note: 'Each piece for 4 seconds.', len: 96000, snap: 5000, world: merge({ epoch: SAT(22, 5), set: { STYLE: 4 } }, song('none')), actions: Array.from({ length: 24 }, (_, i) => ({ at: i * 4000, set: { ART_FX: i } })) },
  { name: 'Party mode', note: 'Loud room, Party vibe, automatic rotation.', len: 60000, snap: 8000, world: merge({ epoch: SAT(23, 15), set: { STYLE: 4, VIBE: 2, MIC_ON: 1 } }, song('none')) }], { devices: ['panel'] });
FW('Music', 'painter', 'Mr Ross Painter', 'paid', 'Paints a landscape across the length of a song.', [
  { name: 'Painting a song', note: 'A song without lyrics: the painting builds as it plays.', len: 60000, snap: 40000, world: merge({ epoch: SAT(19, 30), set: { ART_FX: 26, ROOM_LIGHT: 70 } }, song('none')) }], { devices: ['panel'], price: '$1/mo' });
FW('Music', 'volt', 'Volt', 'paid', 'Volt the mascot: dances, sings the chorus, cheers for your team.', [
  { name: 'Volt dance', note: 'Volt dances to the beat.', len: 30000, snap: 6000, world: merge({ epoch: SAT(22, 5), set: { ART_FX: 27, STYLE: 4 } }, song('none')) },
  { name: 'Make some noise', note: 'Volt reacts to how loud the room is.', len: 30000, snap: 6000, world: merge({ epoch: SAT(22, 5), set: { ART_FX: 28 } }, song('none'), { set: { } }) },
  { name: 'Volt sings the chorus', note: 'Chorus lines repeat, so Volt sings them on the panel.', len: 40000, start: 29000, snap: 31000, world: merge({ epoch: SAT(21, 10) }, song('neon')) }], { price: '$1/mo' });

// ===== Sports
const live = (name, note, w = {}, actions = [], snap = 3000, len = 14000) => ({ name, note, len, snap, world: merge({ epoch: SAT(14, 5) }, bills, w), actions });
FW('Sports', 'nfl-scores', 'NFL Scores', 'free', 'Live NFL scoreboard in the rotation, or taking over the bar.', [
  live('Scoreboard takeover', 'The live game takes the bar.', { set: { TAKEOVER: 1 } }, [], 3000, 20000),
  live('Scorebug layout', 'The smaller scorebug layout.', { set: { TAKEOVER: 1, NFL_LAYOUT: 1 } }, [], 3000, 20000),
  { name: 'Pregame', note: 'Kickoff in 90 minutes.', len: 30000, snap: 3000, world: merge({ epoch: SAT(11, 30) }, bills, { set: { GAME_STATE: 0, KICKOFF_AT: 90, AWAY_SCORE: 0, HOME_SCORE: 0 } }), actions: [{ at: 0, do: 'bar', a: 1, p1: 4, p2: 30000 }] }]);
FW('Sports', 'gameday', 'Game Day Mode', 'paid', 'The whole room follows your game: down and distance, smart clock, lyrics in the gaps.', [
  live('Game Day on', 'Game Day mode during a drive.', { set: { GAMEDAY: 1 } }, [], 5000, 40000),
  live('Red zone', 'Inside the 20.', { set: { GAMEDAY: 1, REDZONE: 1, BALL: 88 }, text: { DOWN: '1ST & 10' } }, [ev(800, 8, 0)], 2000),
  live('Two-minute warning', 'Fourth quarter, two minutes left.', { set: { GAME_PERIOD: 4, AWAY_SCORE: 24, HOME_SCORE: 20 }, text: { CLOCK: '2:00' } }, [ev(800, 12)], 2000),
  live('Game Day with music', 'Lyrics share the top rows while the game runs.', merge(song('neon'), { set: { GAMEDAY: 1 } }), [], 9000, 40000)], { price: '$3/mo' });
FW('Sports', 'nfl-moments', 'Touchdown Moments', 'paid', 'Full-screen celebrations for scores and the big swings.', [
  live('Touchdown', 'Your team scores.', { set: { AWAY_SCORE: 21 } }, [ev(800, 6, 0, 6)], 3500, 16000),
  live('Field goal', 'Three points.', { set: { AWAY_SCORE: 17 } }, [ev(800, 6, 0, 3)], 2500),
  live('Opponent scores', 'The quiet version.', { set: { HOME_SCORE: 17 } }, [ev(800, 6, 1, 7, true)], 1800, 10000),
  live('Lead change', 'The lead flips.', { set: { HOME_SCORE: 17 } }, [ev(800, 10, 1)], 2200),
  live('Halftime', 'Halftime card.', { set: { GAME_STATUS: 1 }, text: { CLOCK: '0:00' } }, [ev(800, 4)], 3000),
  live('Final: win', 'Your team wins.', { set: { GAME_STATE: 2, GAME_PERIOD: 4, AWAY_SCORE: 27, HOME_SCORE: 20 } }, [ev(800, 7, 0)], 3500, 16000),
  live('Final: loss', 'Your team loses.', { set: { GAME_STATE: 2, GAME_PERIOD: 4, AWAY_SCORE: 17, HOME_SCORE: 23 } }, [ev(800, 7, 1, 0, true)], 3500, 16000)], { price: '$2/mo' });
const nba = { set: { GAME_ON: 1, GAME_LEAGUE: 1, GAME_STATE: 1, GAME_PERIOD: 4, AWAY_SCORE: 112, HOME_SCORE: 108, AWAY_C1: 0xffc72c, AWAY_C2: 0x1d428a, HOME_C1: 0x007a33, HOME_C2: 0xffffff, POSSESSION: 0, FAV: 1, TAKEOVER: 1 }, text: { AWAY: 'GSW', HOME: 'BOS', CLOCK: '4:31', DOWN: '' } };
FW('Sports', 'nba', 'NBA', 'paid', 'The league board, tip-off and basketball moments: runs, clutch, threes.', [
  { name: 'Live board', note: 'Fourth quarter on the league board.', len: 16000, snap: 2000, world: merge({ epoch: SAT(20, 40) }, nba) },
  { name: '10-0 run', note: 'A run.', len: 14000, snap: 2600, world: merge({ epoch: SAT(20, 40) }, nba), actions: [ev(800, 20, 0, 10)] },
  { name: 'Clutch', note: 'Close game, last minutes.', len: 14000, snap: 2000, world: merge({ epoch: SAT(20, 55) }, nba, { text: { CLOCK: '1:12' } }), actions: [ev(800, 21, 0, 1)] },
  { name: 'Splash three', note: 'A three-pointer.', len: 12000, snap: 1800, world: merge({ epoch: SAT(20, 41) }, nba), actions: [ev(800, 24, 0, 3)] },
  { name: 'Tip-off', note: 'Game start.', len: 14000, snap: 2500, world: merge({ epoch: SAT(19, 30) }, nba, { set: { GAME_PERIOD: 1, AWAY_SCORE: 0, HOME_SCORE: 0 }, text: { CLOCK: '12:00' } }), actions: [ev(500, 1, 0, 1)] }], { price: '$2/mo' });
const cfb = { set: { GAME_ON: 1, GAME_LEAGUE: 2, GAME_STATE: 1, GAME_PERIOD: 4, AWAY_SCORE: 17, HOME_SCORE: 14, HOME_RANK: 5, AWAY_C1: 0xe84a27, AWAY_C2: 0x13294b, HOME_C1: 0xbb0000, HOME_C2: 0x666666, FAV: 0 }, text: { AWAY: 'ILL', HOME: 'OSU', CLOCK: '9:00', DOWN: '' } };
FW('Sports', 'cfb', 'College Football', 'paid', 'Rankings on the board and upset alerts.', [
  { name: 'Ranked board', note: '#5 at home in the fourth.', len: 16000, snap: 2000, world: merge({ epoch: SAT(19, 40) }, cfb, { set: { TAKEOVER: 1 } }) },
  { name: 'Upset watch', note: 'An unranked team leads late.', len: 14000, snap: 2000, world: merge({ epoch: SAT(19, 40) }, cfb), actions: [ev(800, 22, 0, 5)] },
  { name: 'Upset!', note: 'It happened.', len: 14000, snap: 3000, world: merge({ epoch: SAT(19, 55) }, cfb, { set: { GAME_STATE: 2, AWAY_SCORE: 27, HOME_SCORE: 24 } }), actions: [ev(800, 23, 0, 5)] }], { price: '$2/mo' });
FW('Sports', 'team-colours', 'Team Colours', 'free', 'Paint every screen in your team\'s colours.', [
  { name: 'Bills colours', note: 'Screen colours set from the favourite team.', len: 40000, snap: 3000, world: merge({ epoch: SAT(12, 0), set: { COLOUR_MODE: 1, C1: 0x00338d, C2: 0xc60c30 } }) },
  { name: 'Celtics colours, Vibrant', note: 'Team hue locked in Vibrant.', len: 40000, snap: 3000, world: merge({ epoch: SAT(12, 0), set: { COLOUR_MODE: 1, C1: 0x007a33, C2: 0xffffff, STYLE: 4 } }) }]);

// ===== House
FW('House', 'wake', 'Wake-Up Light', 'paid', 'A sunrise on the screens before your alarm. Daylight or red light.', [
  { name: 'Daylight', note: '20 min ramp shown in 40 s. The clock stays on.', len: 44000, snap: 26000, world: { epoch: WED(6, 40), set: { SUN_ACTIVE: 1, SUN_RISE: 1, SUN_RED: 0 } }, ramps: ramp() },
  { name: 'Red light', note: 'The same ramp in red.', len: 44000, snap: 26000, world: { epoch: WED(6, 40), set: { SUN_ACTIVE: 1, SUN_RISE: 1, SUN_RED: 1 } }, ramps: ramp() }], { price: '$1/mo' });
FW('House', 'wind', 'Wind-Down', 'free', 'Golden hour to dusk to a dim night before bed.', [
  { name: 'Warm sky', note: 'The standard wind-down, no flash.', len: 44000, snap: 22000, world: { epoch: SAT(21, 0), set: { SUN_ACTIVE: 1, SUN_RISE: 0, SUN_RED: 0 } }, ramps: ramp() },
  { name: 'Red light', note: 'Wind-down in red light.', len: 44000, snap: 22000, world: { epoch: SAT(21, 0), set: { SUN_ACTIVE: 1, SUN_RISE: 0, SUN_RED: 1 } }, ramps: ramp() }]);
FW('House', 'sunset', 'Sunset Moment', 'free', 'A 12 second sunset on both screens at the real sunset.', [
  { name: 'Sunset moment', note: 'Both screens together.', len: 16000, snap: 6000, world: { epoch: SAT(18, 20) }, actions: [{ at: 500, do: 'bar', a: 8 }, { at: 500, do: 'pan', a: 2, p1: 1 }] },
  { name: 'A day in 30 seconds', note: 'The panel skyline through a whole day.', len: 32000, snap: 15000, world: { epoch: SAT(12, 0) }, actions: [{ at: 300, do: 'pan', a: 2, p1: 2 }] }]);
FW('House', 'notify', 'Notifications', 'free', 'Messages pushed from your phone or smart home.', [
  { name: 'Package at the door', note: 'A notification banner.', len: 12000, snap: 2500, world: { epoch: SAT(17, 12) }, actions: [{ at: 500, do: 'bar', a: 3, text: 'PACKAGE AT THE DOOR', p1: 0x50c8ff, p2: 8000 }] },
  { name: 'Dinner is ready', note: 'A warm-coloured notification.', len: 12000, snap: 2500, world: { epoch: SAT(18, 30) }, actions: [{ at: 500, do: 'bar', a: 3, text: 'DINNER IS READY', p1: 0xffa040, p2: 8000 }] }]);
FW('House', 'chime', 'Hourly Chime', 'free', 'A quiet chime on the quarter hours, off at night.', [{ name: 'On the hour', note: 'The chime.', len: 12000, snap: 1500, world: { epoch: SAT(15, 0) }, actions: [{ at: 300, do: 'bar', a: 4, p1: 0 }] }]);
FW('House', 'presence', 'Presence', 'free', 'Screens sleep when the room is empty and wake when you return.', [
  { name: 'Room empties', note: 'Nobody in the room: the bar turns off.', len: 16000, snap: 9000, world: { epoch: SAT(23, 10) }, actions: [{ at: 6000, set: { PRESENCE_OFF: 1, ROOM_HERE: 0 } }] }]);
FW('House', 'celebrate', 'Celebrations', 'free', 'Fireworks and starbursts on a clap or a schedule.', [
  { name: 'Fireworks', note: 'Clap view: fireworks.', len: 10000, snap: 3000, world: { epoch: SAT(23, 59) }, actions: [{ at: 0, do: 'bar', a: 10, p1: 6, p2: 9000 }] },
  { name: 'Starburst', note: 'Clap view: starburst.', len: 10000, snap: 3000, world: { epoch: SAT(22, 0) }, actions: [{ at: 0, do: 'bar', a: 10, p1: 7, p2: 9000 }] }]);

// ===== Seasons (one pack per holiday)
[['christmas', 'Christmas'], ['halloween', 'Halloween'], ['new-year', 'New Year'], ['valentines', "Valentine's"], ['st-patricks', "St Patrick's"], ['july4', 'July 4th'], ['thanksgiving', 'Thanksgiving']].forEach(([id, n], i) =>
  FW('Seasons', id, n, 'free', `The ${n} scene, on its date or any time you like.`, [{ name: `${n} scene`, note: `Holiday scene ${i + 1}.`, len: 20000, snap: 4000, world: { epoch: SAT(19, 0), set: { SCENE_MODE: 2, HOLIDAY: i + 1 } } }], { devices: ['bar'] }));

// ===== Diagnostics
// The boot / loading screen is the Pixel Eel (ARXI Eel Logo Concepts, 03). Drawn in JS here; the firmware's boot intro still says MATRIX.
const eelSit = (name, note, accent, start = 0) => ({ name, note, len: EEL.CYCLE_MS * 2, snap: 3200, draw: (g, t) => EEL.frame(g, t + start, { accent }) });
CO('Diagnostics', 'boot', 'Pixel Eel (design)', 'internal', '', 'You', 'The Pixel Eel: swims in, charges, strikes, then embers. Replaces the old MATRIX intro and the companion\'s waiting-for-hub clock.', [
  eelSit('Boot: swim to strike', 'Power on: the eel swims in head-first, coils and crackles, strikes across the screen, then the bolt breaks into embers. 4.6 s a cycle.', 0x3fd0ff),
  eelSit('Strike only', 'Starts at the charge, for an alert hit (a score, the doorbell).', 0x3fd0ff, 32 * EEL.TICK),
  eelSit('Gold eel', 'The same sequence in gold.', 0xf2c14e),
  eelSit('Sage eel', 'The same sequence in sage.', 0x5fc597),
  eelSit('Violet eel', 'The same sequence in violet.', 0xb48cff),
]);
FW('Diagnostics', 'power-on', 'Power On', 'internal', 'What every screen shows while the room starts up and while the hub is away.', [
  { name: 'Power on', note: 'The boot screen while the Bar connects. Today the Bar says MATRIX; Proposed plays the Pixel Eel on every screen.', len: 9000, snap: 3200, world: { epoch: SAT(8, 0), set: { BOOT_INTRO: 1 } }, actions: [{ at: 33, do: 'bar', a: 6 }] },
  { name: 'Hub drops out', note: 'The hub goes offline at 5 s and comes back at 20 s. Today the companion shows a clock; Proposed shows the eel until the hub answers.', len: 28000, snap: 9000, world: { epoch: SAT(20, 0) }, actions: [{ at: 5000, set: { HUB: 0 } }, { at: 20000, set: { HUB: 1 } }] },
], { audience: 'You' });
FW('Diagnostics', 'showcase', 'Showcase Reel', 'internal', 'The demo reel that plays every feature.', [{ name: 'Showcase', note: 'The reel.', len: 120000, snap: 8000, world: { epoch: SAT(19, 0) }, actions: [{ at: 0, do: 'bar', a: 5 }] }], { audience: 'You' });
FW('Diagnostics', 'wx-scenes', 'Weather Scenes', 'internal', 'Every weather scene held on screen.', [wxTest('Clear', 0), wxTest('Partly cloudy', 2), wxTest('Cloudy', 3), wxTest('Fog', 45), wxTest('Rain', 61), wxTest('Snow', 71), wxTest('Storm', 95)], { audience: 'You', devices: ['bar'] });

// --------------------------------------------------------------------------------------- concept apps (JS, firmware fonts)
const C = { white: 0xffffff, amber: 0xffb547, red: 0xff3b30, green: 0x30d158, blue: 0x4aa3ff, dim: 0x3a3f46 };
const pulse = (t, ms) => 0.5 + 0.5 * Math.sin(t / ms * Math.PI * 2);
const dot = (g, cx, cy, col, r = 2) => { for(let y = -r; y <= r; y++) for(let x = -r; x <= r; x++) if(x * x + y * y <= r * r + 1) g.px(cx + x, cy + y, col); };
const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const wide = (g) => g.h <= 11; // the Bar (44 x 11) is wide and short; the Panel (44 x 22) has rows to stack
// Two-line card: a label and a big value. Works on both sizes.
const card = (g, label, value, lc, vc, bg = 0) => { g.clear(bg); if(wide(g)) { g.text3(label, 1, 3, lc); g.text5(value, 43 - g.w5(value), 2, vc); } else { g.c3(label, 1, lc); g.c5(value, 8, vc); } };
const banner = (g, top, scroll, tc, sc, t, bg = 0) => { g.clear(bg); if(wide(g)) { g.c3(top, 0, tc); g.marquee3(scroll, 6, sc, t, 26); } else { g.c3(top, 1, tc); g.marquee3(scroll, 9, sc, t, 22); } };
const S1 = (name, note, draw, snap = 2500, len = 20000) => ({ name, note, len, snap, draw });

// ===== Transit
const ROUTES = [['5', 'DOWNTOWN', 0x00a3e0], ['11', 'UNCG', 0xff8c00], ['2', 'AIRPORT', 0x8cc63f], ['7', 'GTCC', 0xe31b23]];
const routeChip = (g, x, y, r, c) => { const w = g.w3(r) + 2; g.rect(x, y, x + w, y + 4, c); g.text3(r, x + 1, y, 0x000000); return w + 1; };
CO('Transit', 'next-bus', 'Next Arrivals', 'paid', 'quote', 'Transit agencies', 'Real-time arrivals for the routes at this stop, from GTFS-realtime.', [
  S1('Arrivals board', 'Two routes with minutes away; DUE flashes.', (g, t) => { g.clear(0); const mins = [Math.max(0, 3 - Math.floor(t / 6000)), 12 - Math.floor(t / 6000)];
    [[0, mins[0]], [1, mins[1]]].forEach(([i, m], row) => { const [r, d, c] = ROUTES[i], y = wide(g) ? row * 6 : row * 8 + 1; let x = 0; x += routeChip(g, x, y, r, c); if(wide(g)) g.text3(d, x + 1, y, C.white);
      const s = m <= 0 ? 'DUE' : `${m}M`, col = m <= 0 ? ((t % 800) < 500 ? C.amber : 0x604000) : C.white; g.rect(g.w - g.w3(s) - 2, y, g.w - 1, y + 4, 0); g.text3(s, g.w - g.w3(s), y, col); }); }, 3000, 30000),
  S1('Route cycle', 'One route at a time, full destination.', (g, t) => { const [r, d, c] = ROUTES[Math.floor(t / 4000) % 4], m = 2 + Math.floor(t / 4000) % 4 * 5; g.clear(0);
    if(wide(g)) { routeChip(g, 0, 0, r, c); g.text3(d, 13, 0, C.white); g.text5(`${m} MIN`, 22 - Math.floor(g.w5(`${m} MIN`) / 2), 4, c); } else { routeChip(g, 0, 0, r, c); g.marquee3(d, 0 + 0, C.white, t % 4000, 20); g.c5(`${m}M`, 8, c); } }, 2000, 16000)]);
CO('Transit', 'approach', 'Bus Approaching', 'paid', 'quote', 'Transit agencies', 'A moving dot shows the bus coming down the line, stop by stop.', [
  S1('Approaching', 'The bus moves stop to stop toward you.', (g, t) => { g.clear(0); const stops = 6, k = (t % 18000) / 18000, y = wide(g) ? 8 : 12;
    g.rect(1, y, g.w - 2, y, 0x203040); for(let i = 0; i < stops; i++) { const x = 1 + Math.round(i * (g.w - 3) / (stops - 1)); g.px(x, y - 1, i === stops - 1 ? C.amber : 0x406080); g.px(x, y + 1, i === stops - 1 ? C.amber : 0x406080); }
    const bx = 1 + Math.round(k * (g.w - 3)); g.rect(bx - 1, y - 1, bx + 1, y + 1, 0x00a3e0); const m = Math.max(0, Math.ceil((1 - k) * 6)); g.text3(m ? `ROUTE 5  ${m} MIN` : 'ROUTE 5  HERE', 1, wide(g) ? 0 : 2, m ? C.white : C.green); }, 9000, 18000)]);
CO('Transit', 'service-alert', 'Service Alerts', 'paid', 'quote', 'Transit agencies', 'Detours, delays and stop closures, coloured by severity.', [
  S1('Detour', 'Amber detour notice.', (g, t) => banner(g, 'DETOUR', 'ROUTE 11 USES SPRING GARDEN ST UNTIL 6PM', C.amber, C.white, t, 0x1a1000)),
  S1('Delay', 'Red delay notice.', (g, t) => banner(g, 'DELAYS', 'ROUTE 2 RUNNING ABOUT 15 MIN LATE', (t % 1000) < 650 ? C.red : 0x601010, C.white, t)),
  S1('Stop closed', 'Stop moved.', (g, t) => banner(g, 'STOP CLOSED', 'USE THE STOP ACROSS THE STREET', C.red, C.white, t, 0x140000))]);
CO('Transit', 'last-bus', 'Last Bus', 'paid', 'quote', 'Transit agencies', 'Warns riders when the last trip of the night is close.', [
  S1('Last trip', 'Countdown to the final bus.', (g, t) => { const s = Math.max(0, 9 * 60 - t / 1000 * 8); card(g, 'LAST BUS', mmss(s), C.amber, s < 120 ? C.red : C.white, 0x0a0a14); }, 4000, 30000)]);
CO('Transit', 'crowding', 'Crowding', 'paid', 'quote', 'Transit agencies', 'How full the next bus is, from the agency\'s occupancy feed.', [
  S1('Next bus crowding', 'Seats available / standing / full.', (g, t) => { const lv = Math.floor(t / 5000) % 3, txt = ['SEATS', 'STANDING', 'FULL'][lv], col = [C.green, C.amber, C.red][lv]; g.clear(0);
    g.text3('NEXT BUS', 1, 0, C.white); for(let i = 0; i < 3; i++) g.rect(1 + i * 5, g.h - 4, 4 + i * 5, g.h - 1, i <= lv ? col : 0x222222); g.text3(txt, g.w - g.w3(txt) - 1, g.h - 5, col); }, 2000, 15000)]);
CO('Transit', 'stop-weather', 'Stop Weather', 'free', '', 'Transit agencies', 'Weather at the stop between arrivals, with a rain-soon warning.', [
  S1('Rain soon', 'Temperature and a rain warning.', (g, t) => { g.clear(0x02101c); g.text5('58°'.replace('°', ''), 1, wide(g) ? 2 : 1, C.white); g.px(g.w5('58') + 2, wide(g) ? 2 : 1, C.white);
    for(let i = 0; i < 8; i++) { const x = (i * 5 + Math.floor(t / 60)) % g.w, y = (i * 3 + Math.floor(t / 90)) % g.h; g.px(g.w - 1 - (x % 14), y, 0x4aa3ff); } g.text3('RAIN 20M', wide(g) ? 18 : 1, wide(g) ? 6 : 10, C.blue); })]);
CO('Transit', 'bike-share', 'Bike Share', 'paid', 'quote', 'Transit agencies', 'Bikes and open docks at the nearest station.', [
  S1('Station', 'Bikes and docks.', (g, t) => { const b = 6 - Math.floor(t / 4000) % 4; g.clear(0); g.text3('BIKES', 1, 0, 0x8cc63f); g.text3(String(b), g.w - g.w3(String(b)) - 1, 0, C.white); g.text3('DOCKS', 1, 6, 0x60a0ff); g.text3(String(12 - b), g.w - g.w3(String(12 - b)) - 1, 6, C.white); })]);
CO('Transit', 'stop-id', 'Stop Info', 'free', '', 'Transit agencies', 'Stop name and number for riders and trip planners.', [
  S1('Stop name', 'Name and stop ID.', (g, t) => banner(g, 'STOP 11241', 'ELM ST AT FRIENDLY AVE - TEXT 11241 TO 41411 FOR TIMES', C.amber, C.white, t))]);

// ===== Parks
CO('Parks', 'trail', 'Trail Status', 'paid', 'quote', 'Parks & recreation', 'Open or closed, conditions and distance at the trailhead.', [
  S1('Trail open', 'Open with conditions scrolling.', (g, t) => { g.clear(0x02100a); if(wide(g)) { g.text3('TRAIL', 1, 0, C.green); g.text3('OPEN', 43 - g.w3('OPEN'), 0, C.green); g.marquee3('BLUFF TRAIL 2.4 MI - MUDDY IN PLACES', 6, 0xd8f5e0, t, 28); } else { g.c3('TRAIL', 1, C.green); g.c5('OPEN', 8, C.green); } }),
  S1('Trail closed', 'Closed for repairs.', (g, t) => { g.clear(0x140000); if(wide(g)) { g.text3('TRAIL', 1, 0, C.red); g.text3('CLOSED', 43 - g.w3('CLOSED'), 0, C.red); g.marquee3('BRIDGE REPAIR - REOPENS NOV 20', 6, C.white, t, 28); } else { g.c3('TRAIL', 1, C.red); g.c5('SHUT', 8, C.red); } })]);
CO('Parks', 'closing', 'Closing Time', 'paid', 'quote', 'Parks & recreation', 'Minutes until the park closes, with the sun going down.', [
  S1('Closing countdown', 'Green, then amber, then red.', (g, t) => { const left = Math.max(0, 45 - t / 1000 * 1.5), col = left > 30 ? C.green : left > 10 ? C.amber : C.red;
    for(let y = 0; y < g.h; y++) g.rect(0, y, g.w - 1, y, g.mix(0x0a1c3a, 0x5a2410, y / g.h * (1 - left / 45))); dot(g, g.w - 5, Math.round(2 + (g.h - 4) * (1 - left / 45)), 0xffa030);
    if(wide(g)) g.text3(`CLOSES ${mmss(left * 60).slice(0, -3)}`, 1, 3, col); else { g.text3('CLOSES', 1, 1, col); g.text5(`${Math.floor(left)}M`, 1, 8, col); } }, 20000, 30000)]);
CO('Parks', 'weather-safety', 'Weather Safety', 'paid', 'quote', 'Parks & recreation', 'Lightning, heat and air alerts that tell visitors what to do.', [
  S1('Lightning', 'Seek shelter, flashing.', (g, t) => { const on = (t % 1000) < 600; g.clear(on ? 0x2a0000 : 0); if(wide(g)) { g.c3('LIGHTNING', 0, on ? C.amber : 0x804000); g.c3('SEEK SHELTER', 6, C.white); } else { g.c3('LIGHTNING', 1, on ? C.amber : 0x804000); g.c3('SHELTER', 9, C.white); } }, 1100, 12000),
  S1('Heat advisory', 'Heat index with a water reminder.', (g, t) => banner(g, 'HEAT 104', 'DRINK WATER - SHADE AT THE PAVILION', 0xff6a00, C.white, t, 0x1a0800)),
  S1('UV index', 'UV with a colour scale.', (g, t) => { const uv = 8; g.clear(0); g.text3('UV', 1, wide(g) ? 3 : 1, C.white); for(let i = 0; i < 11; i++) g.rect(wide(g) ? 10 + i * 3 : 1 + i * 3, wide(g) ? 4 : 9, (wide(g) ? 10 + i * 3 : 1 + i * 3) + 1, wide(g) ? 6 : 12, i < uv ? g.hsv(90 - i * 9, 255, 255) : 0x1a1a1a); })]);
CO('Parks', 'events', 'Park Events', 'paid', 'quote', 'Parks & recreation', 'Today\'s classes, concerts and programs.', [
  S1('Yoga at 6', 'Event, time, place.', (g, t) => { g.clear(0x0a0614); const c = g.hsv((t / 40) % 256, 180, 255); if(wide(g)) { g.text3('YOGA', 1, 0, c); g.text3('6PM', 43 - g.w3('6PM'), 0, C.white); g.marquee3('ON THE GREAT LAWN - BRING A MAT', 6, 0xcfc4ff, t, 28); } else { g.c5('YOGA', 1, c); g.c3('6PM', 10, C.white); } }),
  S1('Concert tonight', 'Music in the park.', (g, t) => banner(g, 'CONCERT 7PM', 'THE RIVERSIDE BAND AT THE BANDSHELL - FREE', 0xff4fa0, C.white, t, 0x10000a))]);
CO('Parks', 'parking', 'Parking', 'paid', 'quote', 'Parks & recreation', 'Spaces left in each lot.', [
  S1('Lot filling up', 'Spaces count down to FULL.', (g, t) => { const n = Math.max(0, 14 - Math.floor(t / 2500)); card(g, 'LOT B', n ? String(n) : 'FULL', C.white, n > 5 ? C.green : n ? C.amber : C.red); }, 3000)]);
CO('Parks', 'pool', 'Pool & Splash Pad', 'paid', 'quote', 'Parks & recreation', 'Open status, water temperature and swim-break countdowns.', [
  S1('Swim break', 'Adult swim countdown.', (g, t) => { const s = Math.max(0, 600 - t / 1000 * 20); card(g, s > 0 ? 'SWIM BREAK' : 'POOL OPEN', s > 0 ? mmss(s) : '78F', 0x40c0ff, C.white, 0x001018); }, 5000, 32000)]);
CO('Parks', 'courts', 'Court Queue', 'paid', 'quote', 'Parks & recreation', 'Who is up next on the pickleball and tennis courts.', [
  S1('Pickleball', 'Next group and wait.', (g, t) => { const n = 4 + Math.floor(t / 7000); card(g, `COURT ${1 + n % 4}`, `#${n}`, 0xc8f000, C.white); }, 2000)]);

// ===== Commercial
CO('Commercial', 'open-sign', 'Open Sign', 'paid', '$5/mo', 'Local businesses', 'OPEN with today\'s hours, readable from the street.', [
  S1('Open', 'Slow glow.', (g, t) => { const col = g.scale(0xff3060, 0.75 + 0.25 * pulse(t, 2600)); g.clear(0); if(wide(g)) { g.text5('OPEN', 1, 2, col); g.text3('7-9', 43 - g.w3('7-9'), 3, C.white); } else { g.c5('OPEN', 2, col); g.c3('7AM-9PM', 10, C.white); } }),
  S1('Closed', 'Closed with opening time.', (g, t) => card(g, 'OPENS 7AM', 'CLOSED', 0x8090a0, 0x804050))]);
CO('Commercial', 'now-serving', 'Now Serving', 'paid', '$5/mo', 'Local businesses', 'The queue number, with a flash when it moves.', [
  S1('Queue', 'A47, A48 ...', (g, t) => { const n = 47 + Math.floor(t / 6000); card(g, 'NOW SERVING', 'A' + n, C.amber, C.white, t % 6000 < 400 ? 0x203000 : 0); }, 6200, 30000)]);
CO('Commercial', 'order-ready', 'Order Ready', 'paid', '$5/mo', 'Local businesses', 'Pickup numbers that are ready at the counter.', [
  S1('Ready for pickup', 'Numbers ready.', (g, t) => banner(g, 'READY', `ORDERS 112  115  ${117 + Math.floor(t / 8000)}`, C.green, C.white, t))]);
CO('Commercial', 'specials', 'Specials', 'paid', '$5/mo', 'Local businesses', 'Rotating specials with prices.', [
  S1('Coffee menu', 'Three items rotating.', (g, t) => { const it = [['LATTE', '$3.50', 0xc89060], ['CROISSANT', '$2.75', 0xf0c060], ['COLD BREW', '$4.25', 0x60a0ff]][Math.floor(t / 4000) % 3]; g.clear(0);
    if(wide(g)) { g.marquee3(it[0], 0, it[2], t % 4000, 20, true); g.text3(it[1], 43 - g.w3(it[1]), 6, C.white); } else { g.c3(it[0], 2, it[2]); g.c5(it[1], 8, C.white); } }, 2000, 24000)]);
CO('Commercial', 'happy-hour', 'Happy Hour', 'paid', '$5/mo', 'Local businesses', 'Countdown to happy hour, then the deal.', [
  S1('Countdown', 'Minutes to happy hour.', (g, t) => { const s = Math.max(0, 900 - t / 1000 * 40); card(g, s ? 'HAPPY HR IN' : 'HAPPY HOUR', s ? mmss(s) : '$2 OFF', 0xff7ac8, C.white, 0x100010); }, 6000, 30000)]);
CO('Commercial', 'wait', 'Wait Time', 'paid', '$5/mo', 'Local businesses', 'Estimated wait, coloured by length.', [
  S1('Wait', 'Minutes of wait.', (g, t) => { const m = 8 + Math.round(6 * pulse(t, 20000)); card(g, 'WAIT', `${m}M`, C.white, m < 10 ? C.green : m < 13 ? C.amber : C.red); }, 3000)]);
CO('Commercial', 'occupancy', 'Occupancy', 'paid', '$5/mo', 'Local businesses', 'People inside versus the limit, from a door counter.', [
  S1('Room count', 'Count rising to the limit.', (g, t) => { const n = Math.min(50, 38 + Math.floor(t / 1500)); g.clear(0); g.text3(`${n}/50`, 1, 0, C.white); const k = n / 50; g.rect(0, g.h - 4, g.w - 1, g.h - 1, 0x1a1a1a); g.rect(0, g.h - 4, Math.round((g.w - 1) * k), g.h - 1, k < 0.85 ? C.green : k < 1 ? C.amber : C.red); }, 12000)]);
CO('Commercial', 'social', 'Follow Us', 'free', '', 'Local businesses', 'Your social handle and a scan-to-review prompt.', [
  S1('Instagram', 'Handle scrolling.', (g, t) => banner(g, 'FOLLOW US', '@ARXISYSTEMS ON INSTAGRAM AND TIKTOK', g.hsv(220 + 30 * pulse(t, 3000), 200, 255), C.white, t))]);

// ===== Funeral homes
CO('Funeral Homes', 'service', 'Service Schedule', 'paid', 'quote', 'Funeral homes', 'Today\'s services by room and time, in a calm white.', [
  S1('Today', 'Room and time, slow fade.', (g, t) => { const k = 0.7 + 0.3 * pulse(t, 6000), col = g.scale(0xf0ece4, k); banner(g, 'CHAPEL A 11AM', 'VISITATION 10AM  -  SERVICE 11AM  -  RECEPTION TO FOLLOW', col, g.scale(0xc8c0b0, k), t, 0); }, 4000)]);
CO('Funeral Homes', 'welcome', 'Welcome', 'paid', 'quote', 'Funeral homes', 'A quiet welcome with directions for guests.', [
  S1('Welcome', 'Directions for guests.', (g, t) => banner(g, 'WELCOME', 'GUESTS FOR THE 2PM SERVICE PLEASE USE THE EAST DOOR', 0xe8e0d0, 0xb0a890, t))]);

// ===== Streamer
CO('Streamer', 'on-air', 'On Air', 'paid', '$4/mo', 'Creators', 'A red ON AIR light that breathes.', [
  S1('On air', 'Breathing glow.', (g, t) => { const k = 0.55 + 0.45 * pulse(t, 2200); g.clear(g.scale(0x300000, k)); g.c5(wide(g) ? 'ON AIR' : 'LIVE', Math.floor((g.h - 7) / 2), g.scale(0xff2020, 0.6 + 0.4 * k)); }, 1500, 12000)]);
CO('Streamer', 'goal', 'Follower Goal', 'paid', '$4/mo', 'Creators', 'Progress toward a follower or sub goal.', [
  S1('Goal bar', 'Filling toward 500.', (g, t) => { const n = Math.min(500, 412 + Math.floor(t / 200)), k = n / 500; g.clear(0); g.text3(`${n}/500`, 1, 0, C.white); g.rect(0, g.h - 4, g.w - 1, g.h - 1, 0x1a1030); g.rect(0, g.h - 4, Math.round((g.w - 1) * k), g.h - 1, g.hsv(200 - k * 60, 220, 255)); }, 12000)]);
CO('Streamer', 'follower', 'New Follower', 'paid', '$4/mo', 'Creators', 'An alert with the new follower\'s name.', [
  S1('Alert', 'Slides in.', (g, t) => { const x = Math.max(1, g.w - Math.floor(t / 15)); g.clear(0x05001a); g.text3('NEW FOLLOWER', x, 0, 0xb080ff); g.marquee3('THANKS NOVA_KAT', g.h - 5, C.white, t, 25); }, 1600, 10000)]);
CO('Streamer', 'uptime', 'Stream Timer', 'free', '', 'Creators', 'How long you have been live.', [
  S1('Uptime', 'Counting up.', (g, t) => { const s = 5025 + t / 1000; card(g, 'LIVE FOR', `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}`, C.red, C.white); }, 3000)]);
CO('Streamer', 'hype', 'Hype Meter', 'paid', '$4/mo', 'Creators', 'Chat activity as a meter that peaks with the room.', [
  S1('Hype', 'Meter bouncing with chat.', (g, t) => { g.clear(0); const v = 0.5 + 0.5 * Math.sin(t / 700) * Math.sin(t / 2300); for(let x = 0; x < g.w; x++) { const h = Math.round(v * (g.h - 1) * (0.6 + 0.4 * Math.sin(x / 3 + t / 300))); for(let y = 0; y <= h; y++) g.px(x, g.h - 1 - y, g.hsv(160 - y * 14, 255, 255)); } if(v > 0.85) g.c3('HYPE', 0, C.white); }, 4000)]);

// ===== Home extras (concepts)
CO('Home Extras', 'door', 'Doorbell', 'free', '', 'Home', 'Someone at the door, from your smart home.', [S1('At the door', 'Flashing door alert.', (g, t) => banner(g, 'FRONT DOOR', 'SOMEONE IS AT THE DOOR', (t % 900) < 500 ? C.amber : 0x604000, C.white, t), 1000, 10000)]);
CO('Home Extras', 'laundry', 'Laundry Done', 'free', '', 'Home', 'Washer and dryer finish alerts from a smart plug.', [S1('Dryer done', 'Done with a tumble icon.', (g, t) => { g.clear(0); const a = t / 200; for(let i = 0; i < 6; i++) g.px(5 + Math.round(3 * Math.cos(a + i)), (wide(g) ? 5 : 5) + Math.round(3 * Math.sin(a + i)), 0x60c0ff); g.text3('DRYER DONE', wide(g) ? 12 : 1, wide(g) ? 3 : 11, C.white); })]);
CO('Home Extras', 'chores', 'Chore Chart', 'paid', '$2/mo', 'Families', 'Whose turn it is for today\'s chores.', [S1('Today', 'Rotating chores.', (g, t) => { const it = [['DISHES', 'ALEX', 0x60c0ff], ['TRASH', 'JORDAN', 0x90e060], ['DOG WALK', 'SAM', 0xffb060]][Math.floor(t / 4000) % 3]; card(g, it[0], it[1].slice(0, 5), it[2], C.white); }, 2000, 12000)]);
CO('Home Extras', 'bedtime', 'Bedtime', 'paid', '$2/mo', 'Families', 'A kids\' bedtime countdown that turns sleepy.', [S1('Bedtime soon', 'Countdown with stars.', (g, t) => { const s = Math.max(0, 600 - t / 1000 * 25); g.clear(0x02021a); for(let i = 0; i < 8; i++) if(((t / 300 + i * 7) | 0) % 5) g.px((i * 11) % g.w, (i * 5) % g.h, 0x8080c0); if(wide(g)) g.text5(s ? mmss(s) : 'ZZZ', 43 - g.w5(s ? mmss(s) : 'ZZZ'), 2, 0xc0c0ff); else g.c5(s ? mmss(s) : 'ZZZ', 5, 0xc0c0ff); }, 8000, 30000)]);
