// ===================================================================== ARXI: sections (Home, Commercial, Government)
// Each section page sets window.ARXI_SEGMENT before loading the shared scripts. This file runs after the shared library
// and wizard are defined, and before the section's own features file and the UI boot. It narrows everything that is
// shared down to one section: who it's for, the places, the market filter, the model presets and the packs.
// With no ARXI_SEGMENT set, nothing is narrowed and the simulator behaves as the old all-in-one page.

const SEGMENTS = {
  home:       { id: 'home',       name: 'Home',       buyer: 'home',       market: 'Consumer',   icon: 'home' },
  commercial: { id: 'commercial', name: 'Commercial', buyer: 'business',   market: 'Commercial', icon: 'store' },
  government: { id: 'government', name: 'Government', buyer: 'government', market: 'Government', icon: 'bus' },
};
const SEG = SEGMENTS[window.ARXI_SEGMENT] || null;

if(SEG) {
  SEG.places = [...BUYERS[SEG.buyer].places];

  // Who it's for: only this section's buyer
  for(const k of Object.keys(BUYERS)) if(k !== SEG.buyer) delete BUYERS[k];

  // Places: the workbench plus this section's own places
  for(let i = PLACES.length - 1; i >= 0; i--) if(PLACES[i].id !== 'bench' && !SEG.places.includes(PLACES[i].id)) PLACES.splice(i, 1);

  // Markets (Model builder and library filter): just this one
  MARKETS.splice(0, MARKETS.length, SEG.market);
  for(const k of Object.keys(MODEL_PRESETS)) if(MODEL_PRESETS[k].market !== SEG.market) delete MODEL_PRESETS[k];

  // Packs: only this market's packs
  for(let i = PACKS.length - 1; i >= 0; i--) if(PACKS[i].market !== SEG.market) PACKS.splice(i, 1);

  // Header: which section you are in, and the way back to the intro
  document.title = `ARXI ${SEG.name} · Simulator`;
  document.body.dataset.segment = SEG.id;
  const mark = document.querySelector('header .mark');
  if(mark) {
    mark.insertAdjacentHTML('beforebegin', `<a class="segback" href="../" title="All sections" aria-label="All sections">${icon('arrowleft', 16)}</a>`);
    mark.insertAdjacentHTML('beforeend', `<span class="segbadge">${icon(SEG.icon, 13)}${SEG.name}</span>`);
  }
}

// ------------------------------------------------------------------ adding a feature to this section
// ARXI.feature({...}) registers an app that belongs to the current section only. It fills in the market and the
// audience, and makes sure its group shows up in the Build wizard for this section's places.
//
//   ARXI.feature({ id: 'my-app', group: 'House', name: 'My app', tier: 'free', blurb: 'One line.', situations: [ ... ] });
//
// Optional: places: ['living', 'bedroom'] to limit where it is offered (default: every place in the section),
//           starter: true to pre-tick it when someone picks one of those places in the wizard,
//           pack: 'packId' to add it to one of this section's packs.
ARXI.feature = function(app) {
  const seg = SEG || SEGMENTS.home;
  const a = { kind: 'concept', tier: 'free', devices: ['bar', 'panel'], markets: [seg.market],
    audience: { home: 'Home', commercial: 'Local businesses', government: 'Parks & recreation' }[seg.id], ...app };
  const places = app.places || (SEG ? SEG.places : []);
  for(const p of places) {
    if(PLACE_GROUPS[p] && !PLACE_GROUPS[p].includes(a.group)) PLACE_GROUPS[p].push(a.group);
    if(app.starter && STARTERS[p] && !STARTERS[p].includes(a.id)) STARTERS[p].push(a.id);
  }
  if(app.pack) { const pk = PACKS.find(x => x.id === app.pack); if(pk && pk.apps && !pk.apps.includes(a.id)) pk.apps.push(a.id); }
  if(app.places) a.onlyPlaces = [...app.places]; // offered only in these places, even when its group shows elsewhere
  delete a.places; delete a.starter; delete a.pack;
  return ARXI.registerApp(a);
};
