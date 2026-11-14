// ===================================================================== ARXI: tiers, app packages and merged duplicates
// Home tiers follow arxisystems.com (Lite Bar $159, Pro Bar $249, Pro Panel $299, two displays from $299 with the hub,
// Hub $49). Add-on pack prices are DRAFTS to test; commercial and government are never priced here: they end in a
// quote request. Edit this file to change what ships where.

// ---- duplicates folded into one feature (the second id becomes part of the first) ----
const MERGED = {
  week: 'calendar', timeline: 'sun-arc', moon: 'sun-arc', forecast: 'weather-now', rotation: 'clock', styles: 'clock', 'lyric-pictures': 'lyrics',
  presence: null, // a sense, not a feature: chosen on the Senses step
  celebrate: 'seasons', 'happy-hour': 'specials', 'order-ready': 'now-serving', 'last-bus': 'next-bus', uptime: 'on-air', laundry: 'door',
  'stop-weather': 'weather-safety', 'team-colours': 'gameday', ticker: 'notify',
};
const MERGED_NAME = {
  clock: 'Clock, styles & rotation', calendar: 'Calendar & week ahead', 'sun-arc': 'Sun, moon & day', 'weather-now': 'Weather & forecast',
  lyrics: 'Synced lyrics with pictures', specials: 'Specials & happy hour', 'now-serving': 'Now serving & order ready', 'next-bus': 'Arrivals & last bus',
  'on-air': 'On air & stream timer', door: 'Doorbell & laundry alerts', 'weather-safety': 'Weather & safety alerts', gameday: 'Game Day & team colours',
  notify: 'Messages & ticker', countdown: 'Countdowns', seasons: 'Holidays & celebrations',
};
const SEASON_IDS = ['christmas', 'halloween', 'new-year', 'valentines', 'st-patricks', 'july4', 'thanksgiving', 'celebrate'];

// ---- the packages ----
// incl: tiers that include it. price: draft add-on price for home buyers (null = included only, no add-on).
const PACKS = [
  { id: 'essentials', name: 'Essentials', icon: 'sun', market: 'Consumer', line: 'Clock, weather, messages, games and live scores.', incl: ['lite', 'pro', 'connected'],
    apps: ['clock', 'weather-now', 'calendar', 'sun-arc', 'air', 'countdown', 'timers', 'notify', 'nfl-scores', 'seasons'] },
  { id: 'music', name: 'Music', icon: 'music', market: 'Consumer', line: 'Sonos & HEOS now playing, synced lyrics with keyword pictures, visualizers.', incl: ['pro', 'connected'], needsTier: 'pro',
    apps: ['lyrics', 'visualizers', 'painter', 'volt'] },
  { id: 'room', name: 'Smart Room', icon: 'home', market: 'Consumer', line: 'Wakes, sleeps and sets the mood with the room.', incl: ['pro', 'connected'], needsTier: 'pro',
    apps: ['wake', 'wind', 'sunset', 'chime'] },
  { id: 'gameday', name: 'Game Day', icon: 'trophy', market: 'Consumer', line: 'The whole room follows your game, with celebrations for every score.', incl: ['connected'], price: '$3/mo (draft)',
    apps: ['gameday', 'nfl-moments', 'nba', 'cfb'] },
  { id: 'household', name: 'Household', icon: 'calendar', market: 'Consumer', line: 'Doorbell and laundry alerts, chores and bedtime.', incl: [], price: '$2/mo (draft)',
    apps: ['door', 'chores', 'bedtime'] },
  { id: 'creator', name: 'Creator', icon: 'radio', market: 'Consumer', line: 'On air light, follower goals, alerts and a hype meter.', incl: [], price: '$4/mo (draft)',
    apps: ['on-air', 'goal', 'follower', 'hype'] },
  // commercial: no prices, quote only
  { id: 'storefront', name: 'Storefront', icon: 'store', market: 'Commercial', line: 'Open sign, specials and happy hour, follow us.', apps: ['open-sign', 'specials', 'social'] },
  { id: 'service', name: 'Orders & Waits', icon: 'calendar', market: 'Commercial', line: 'Now serving, order ready, wait times and how busy it is.', apps: ['now-serving', 'wait', 'occupancy'] },
  { id: 'venue', name: 'Sports Venue', icon: 'trophy', market: 'Commercial', line: 'Scores, Game Day and celebrations for a sports bar.', apps: ['nfl-scores', 'gameday', 'nfl-moments', 'nba', 'cfb'] },
  { id: 'atmosphere', name: 'Atmosphere', icon: 'music', market: 'Commercial', line: 'Visualizers and lyrics that move with the room.', apps: ['visualizers', 'lyrics'] },
  { id: 'memorial', name: 'Memorial', icon: 'candle', market: 'Commercial', line: 'Service schedule and a gentle welcome for funeral homes.', apps: ['service', 'welcome'] },
  { id: 'basics-c', name: 'Basics', icon: 'sun', market: 'Commercial', line: 'Clock, weather, messages and holidays.', apps: ['clock', 'weather-now', 'notify', 'seasons'], always: true },
  // government: no prices, quote only
  { id: 'transit', name: 'Transit', icon: 'bus', market: 'Government', line: 'Live arrivals, last bus, approaching bus, service alerts, crowding, stop info, bike share.', apps: ['next-bus', 'approach', 'service-alert', 'crowding', 'stop-id', 'bike-share'] },
  { id: 'parks', name: 'Parks & Recreation', icon: 'tree', market: 'Government', line: 'Trail status, closing time, events, parking, pool and courts.', apps: ['trail', 'closing', 'events', 'parking', 'pool', 'courts'] },
  { id: 'safety', name: 'Weather & Safety', icon: 'bolt', market: 'Government', line: 'Weather and safety alerts and local air quality.', apps: ['weather-safety', 'air'] },
  { id: 'basics-g', name: 'Basics', icon: 'sun', market: 'Government', line: 'Clock, weather and public messages.', apps: ['clock', 'weather-now', 'notify'], always: true },
];
const TIERS = {
  lite: { name: 'Lite', price: '$159', line: 'One Bar. Clock, weather, messages, games and live scores.', screens: ['bar'], senses: [] },
  pro: { name: 'Pro', price: '$249 Bar · $299 Panel', line: 'One Bar or Panel, with presence, room light and sound, plus music and lyrics.', screens: ['bar', 'panel'], senses: ['presence', 'light', 'sound'] },
  connected: { name: 'Connected', price: 'From $299', line: 'Two or more displays in any mix, with the Hub and Game Day sync.', screens: ['both'], senses: ['presence', 'light', 'sound'] },
};
const HUB_PRICE = '$49';

const appById = (id) => ARXI.apps.find(a => a.id === id);
function packApps(p) { return p.apps.map(id => id === 'seasons' ? { id: 'seasons', name: MERGED_NAME.seasons, group: 'Seasons', blurb: 'Holiday scenes all year and fireworks for your celebrations.', preview: 'christmas' } : appById(id) ? { ...appById(id), name: MERGED_NAME[id] || appById(id).name, preview: id } : null).filter(Boolean); }
function packsFor(market, place) { return PACKS.filter(p => p.market === market && (!place || packApps(p).some(a => a.id === 'seasons' || appForPlace(appById(a.preview) || a, place)))); }
function packIncluded(p, tier) { return p.always || (p.incl || []).includes(tier); }
function packAvailable(p, tier) { return !p.needsTier || tier !== 'lite'; }
function featureIdsOf(packIds) { const out = []; for(const id of packIds) { const p = PACKS.find(x => x.id === id); if(p) for(const a of p.apps) out.push(...(a === 'seasons' ? SEASON_IDS : [a])); } return [...new Set(out)].filter(id => appById(id)); }
function partOf(appId) { const lead = MERGED[appId]; return lead === undefined ? null : lead; }
