// ===================================================================== ARXI Lab icons: one small stroke set, drawn on a 24 grid
const ICON_PATHS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  snowflake: '<path d="M12 2v20M3.3 7l17.4 10M20.7 7L3.3 17M9 4l3 2 3-2M9 20l3-2 3 2"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  arrowleft: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  arrowright: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  flag: '<path d="M5 21V4M5 4h12l-2.5 4L17 12H5"/>',
  bus: '<rect x="4" y="3" width="16" height="15" rx="3"/><path d="M4 11h16M7 21v-3M17 21v-3"/><circle cx="8" cy="14.5" r=".8"/><circle cx="16" cy="14.5" r=".8"/>',
  tree: '<path d="M12 2l6 9h-3l4 6H5l4-6H6zM12 17v5"/>',
  store: '<path d="M3 9l1.5-5h15L21 9M4 9v11h16V9M3 9h18M9 20v-6h6v6"/>',
  candle: '<rect x="9" y="10" width="6" height="11" rx="1"/><path d="M12 7c-1.6-1.4-.4-3.4 0-5 .4 1.6 1.6 3.6 0 5z"/>',
  radio: '<circle cx="12" cy="12" r="2"/><path d="M16.2 7.8a6 6 0 0 1 0 8.4M7.8 16.2a6 6 0 0 1 0-8.4M19.1 4.9a10 10 0 0 1 0 14.2M4.9 19.1a10 10 0 0 1 0-14.2"/>',
  sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.7 1.8 1.8.7-1.8.7L19 21l-.7-1.8-1.8-.7 1.8-.7z"/>',
  play: '<path d="M7 4l13 8-13 8z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/>',
  back: '<path d="M18 5l-9 7 9 7z" fill="currentColor" stroke="none"/><path d="M6 5v14"/>',
  fwd: '<path d="M6 5l9 7-9 7z" fill="currentColor" stroke="none"/><path d="M18 5v14"/>',
  restart: '<path d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"/>',
  film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M10 9l5 3-5 3z"/>',
  sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  flask: '<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9V3M7 15h10"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5"/>',
  screens: '<rect x="2" y="7" width="13" height="6" rx="1"/><rect x="17" y="5" width="5" height="10" rx="1"/><path d="M8 17h8"/>',
  columns: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 12h18"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  cloud: '<path d="M7 18a4 4 0 0 1-.5-8 6 6 0 0 1 11.5 1.5A3.5 3.5 0 0 1 17.5 18z"/>',
  beaker: '<path d="M7 3h10M8 3v15a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3V3M8 12h8"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  type: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
  box: '<path d="M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v8"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
};
function icon(name, size = 16) {
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}
const GROUP_ICONS = { 'Time & Weather': 'sun', 'Plans': 'calendar', 'Music': 'music', 'Sports': 'trophy', 'House': 'home', 'Seasons': 'snowflake', 'Diagnostics': 'wrench',
  'Transit': 'bus', 'Parks': 'tree', 'Commercial': 'store', 'Funeral Homes': 'candle', 'Streamer': 'radio', 'Home Extras': 'sparkles' };
// The ARXI mark: the pixel eel at 12 x 6, the brand's motion version, as a tiny static badge.
function eelMark() {
  const rows = ['............', '.......cc...', '.ccc..cccc..', 'cc.cccc..cww', '.......cc...', '............'];
  let r = ''; rows.forEach((row, y) => [...row].forEach((ch, x) => { if(ch !== '.') r += `<rect x="${x * 2}" y="${y * 2}" width="1.7" height="1.7" rx=".3" fill="${ch === 'w' ? '#ffffff' : '#3fd0ff'}"/>`; }));
  return `<svg class="eelmark" width="36" height="18" viewBox="0 0 24 12" aria-hidden="true">${r}</svg>`;
}
