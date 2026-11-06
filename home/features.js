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
// Drawing helpers (from shared/apps.js): g.clear(c), g.px(x, y, c), g.text3 / g.text5(str, x, y, c),
// g.c3 / g.c5(str, y, c) centred, wide(g) is true on the Bar (44x11) and false on the Panel (44x22),
// banner(g, top, scroll, topColour, scrollColour, t), colours in C (C.white, C.amber, C.red, C.green, C.blue).
// Don't call store or the UI at the top level here: they boot after this file.

// Example (remove the // to try it, then pick it in the app library):
// ARXI.feature({
//   id: 'home-example', group: 'House', name: 'Example notice', tier: 'free',
//   blurb: 'A one-line notice in the living room.',
//   situations: [
//     S1('Notice', 'Title with a scrolling line.', (g, t) => banner(g, 'DOOR', 'WELCOME HOME', 0x30d158, C.white, t)),
//   ],
// });
