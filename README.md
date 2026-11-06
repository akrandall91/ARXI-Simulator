# ARXI Simulator

See the ARXI Bar (44×11) and Panel (44×22) running the real ARXIv2 firmware, in place, before they're built.

## Layout

```
index.html              Intro: pick Home, Commercial or Government
home/                   Home section (living room, bedroom, den, backyard)
  index.html
  features.js           ← add Home-only features here
commercial/             Commercial section (bar, cafe, shop window)
  index.html
  features.js           ← add Commercial-only features here
government/             Government section (bus stop, park kiosk)
  index.html
  features.js           ← add Government-only features here
shared/                 The simulator every section runs on
  firmware.js           ARXIv2 builds (WebAssembly, base64)
  apps.js               Shared app library (clock, weather, seasons…)
  segment.js            Locks a page to its section; defines ARXI.feature()
  wizard.js, lab.js, tiers.js, place.js, scene3d.js, ui.js, …
  arxi.css
```

## Adding a feature to one section

Open that section's `features.js` and call `ARXI.feature({...})`. Each file has a commented example. The feature only
loads on that section's page, is tagged for that market, and shows up in its app library, Build wizard and Model builder.

Change files in `shared/` only when every section should get the change.

Each section saves its own state in the browser (builds, wizard progress, last app), so they never mix.
