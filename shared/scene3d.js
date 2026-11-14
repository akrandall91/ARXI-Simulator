// ===================================================================== ARXI Lab: outdoor installs in 3D (three.js)
// The Bus stop and Park kiosk places are rendered in 3D with physically based light: a sky and sun placed by the
// simulated time of day, image-based reflections from that sky, soft shadows and weather. The two LED screens are the
// live canvases of the simulator mapped onto the hardware, mounted the way each site needs:
//   Bus stop  - a 3.9 m galvanised transit pole (89 mm), the Bar cabinet on stainless band clamps at 2.4 m, the
//               companion at eye level, the stop flag above and a small solar panel on a top bracket.
//   Park      - a two-post wayfinding kiosk: 100 mm square aluminium posts in bronze powder coat on concrete pads,
//               the Bar in a header cabinet, the companion below it, and a standing-seam canopy.
const Scene3D = (() => {
  const CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0/';
  let T = null, SkyCls = null, mergeV = null, RBox = null, R = null, cam = null, scene = null, sky = null, sun = null, hemi = null, pmrem = null, envRT = null;
  let rig = null, place = '', canvas = null, raf = 0, texBar = null, texPan = null, rain = null, snow = null, stars = null, lamps = [];
  let fc = 0;
  let opts = { hour: 12, wx: 0, dist: 1, room: 0, finish: 'black', roomLight: 60, dark: false, barSpot: 0, panSpot: 0 }, envKey = '', yaw = 0, pitch = 0, drag = null, loading = null, failed = false;

  async function load() {
    if(T) return true; if(failed) return false;
    loading = loading || (async () => {
      try { T = await import(CDN + 'build/three.module.js'); SkyCls = (await import(CDN + 'examples/jsm/objects/Sky.js')).Sky; mergeV = (await import(CDN + 'examples/jsm/utils/BufferGeometryUtils.js')).mergeVertices; RBox = (await import(CDN + 'examples/jsm/geometries/RoundedBoxGeometry.js')).RoundedBoxGeometry; return true; }
      catch(e) { failed = true; console.warn('3D unavailable', e); return false; }
    })();
    return loading;
  }

  // ---------------------------------------------------------------- procedural textures (canvas)
  function canvasTex(w, h, draw, repeat = [1, 1], srgb = true) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.anisotropy = 8; if(srgb) t.colorSpace = T.SRGBColorSpace; return t;
  }
  const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
  function noise(g, w, h, base, spread, n, size = 1) { g.fillStyle = base; g.fillRect(0, 0, w, h); for(let i = 0; i < n; i++) { const v = Math.floor((rnd() - 0.5) * spread); g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 255})`; g.fillRect(rnd() * w, rnd() * h, size * (0.5 + rnd()), size * (0.5 + rnd())); } }
  const tex = {};
  function makeTextures() {
    tex.concrete = canvasTex(512, 512, (g, w, h) => { noise(g, w, h, '#a9a69f', 60, 26000, 2); g.strokeStyle = 'rgba(60,58,54,.55)'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.stroke(); }, [10, 3]);
    tex.asphalt = canvasTex(512, 512, (g, w, h) => { noise(g, w, h, '#3b3c3e', 70, 30000, 1.6); }, [12, 2]);
    tex.lines = canvasTex(512, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(235,230,210,.9)'; g.fillRect(0, 24, 260, 16); }, [8, 1]);
    tex.grass = canvasTex(512, 512, (g, w, h) => { noise(g, w, h, '#4c6b34', 90, 40000, 2.2); for(let i = 0; i < 4000; i++) { g.strokeStyle = `rgba(${40 + rnd() * 60},${80 + rnd() * 70},${30 + rnd() * 30},.6)`; const x = rnd() * w, y = rnd() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - .5) * 3, y - 4 - rnd() * 6); g.stroke(); } }, [24, 24]);
    tex.gravel = canvasTex(512, 512, (g, w, h) => { noise(g, w, h, '#b9ab90', 90, 30000, 3); }, [2, 10]);
    tex.brick = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#5a3a2e'; g.fillRect(0, 0, w, h); for(let y = 0; y < h; y += 16) for(let x = -((y / 16) % 2) * 24; x < w; x += 48) { g.fillStyle = `hsl(${12 + rnd() * 10},${35 + rnd() * 15}%,${30 + rnd() * 12}%)`; g.fillRect(x + 1, y + 1, 46, 14); } }, [6, 3]);
    tex.solar = canvasTex(256, 192, (g, w, h) => { g.fillStyle = '#0d1a3a'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8ea3c8'; g.lineWidth = 1.2; for(let x = 0; x <= w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for(let y = 0; y <= h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } });
    tex.flag = canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#f4f4f2'; g.fillRect(0, 0, w, h); g.fillStyle = '#1c55c7'; g.fillRect(10, 10, w - 20, h - 20); g.fillStyle = '#fff';
      g.beginPath(); g.roundRect(58, 62, 140, 110, 18); g.fill(); g.fillStyle = '#1c55c7'; g.fillRect(74, 80, 108, 46); g.fillStyle = '#fff'; g.beginPath(); g.arc(88, 186, 14, 0, 7); g.arc(168, 186, 14, 0, 7); g.fill(); g.fillStyle = '#1c55c7'; g.fillRect(80, 146, 18, 10); g.fillRect(158, 146, 18, 10); });
    tex.facade = (lit) => canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#6d6a66'; g.fillRect(0, 0, w, h); noise(g, w, h, 'rgba(0,0,0,0)', 40, 6000, 3);
      for(let y = 22; y < h - 30; y += 70) for(let x = 22; x < w - 40; x += 70) { const on = lit && rnd() < 0.4; g.fillStyle = '#4a4744'; g.fillRect(x - 4, y - 4, 42, 54);
        const gr = g.createLinearGradient(x, y, x + 34, y + 46); if(on) { gr.addColorStop(0, `hsl(${34 + rnd() * 10},85%,${62 + rnd() * 12}%)`); gr.addColorStop(1, `hsl(${30 + rnd() * 10},70%,45%)`); } else { gr.addColorStop(0, '#5f6f7e'); gr.addColorStop(0.5, '#2a333d'); gr.addColorStop(1, '#3d4955'); }
        g.fillStyle = gr; g.fillRect(x, y, 34, 46); g.fillStyle = '#4a4744'; g.fillRect(x + 16, y, 2, 46); g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x, y + 48, 34, 3); } }, [1, 1]);
  }

  // ---------------------------------------------------------------- materials and helpers
  const M = {};
  function makeMaterials() {
    M.galv = new T.MeshPhysicalMaterial({ color: 0xb9bdc1, metalness: 1, roughness: 0.38, clearcoat: 0.2 });
    M.steel = new T.MeshStandardMaterial({ color: 0xd8dade, metalness: 1, roughness: 0.22 });
    M.coatBlack = new T.MeshPhysicalMaterial({ color: 0x17181a, metalness: 0.35, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.3 });
    M.coatWhite = new T.MeshPhysicalMaterial({ color: 0xe9e8e3, metalness: 0.2, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.3 });
    M.bronze = new T.MeshPhysicalMaterial({ color: 0x3a2f25, metalness: 0.6, roughness: 0.48, clearcoat: 0.4 });
    M.concrete = new T.MeshStandardMaterial({ map: tex.concrete, roughness: 0.92 });
    M.pad = new T.MeshStandardMaterial({ color: 0xa7a49c, roughness: 0.95 });
    M.asphalt = new T.MeshStandardMaterial({ map: tex.asphalt, roughness: 0.85 });
    M.curb = new T.MeshStandardMaterial({ color: 0xb4b1aa, roughness: 0.9 });
    M.grass = new T.MeshStandardMaterial({ map: tex.grass, roughness: 1 });
    M.gravel = new T.MeshStandardMaterial({ map: tex.gravel, roughness: 1 });
    M.wood = new T.MeshStandardMaterial({ color: 0x8a5c38, roughness: 0.7 });
    M.leaf = new T.MeshStandardMaterial({ color: 0x3b5a2a, roughness: 0.95 });
    M.canopy = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
    M.bark = new T.MeshStandardMaterial({ color: 0x4a3626, roughness: 1 });
    M.glass = new T.MeshPhysicalMaterial({ color: 0x0a0c10, metalness: 0, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.18 });
    M.solar = new T.MeshPhysicalMaterial({ map: tex.solar, metalness: 0.4, roughness: 0.25, clearcoat: 1 });
    M.alu = new T.MeshStandardMaterial({ color: 0xc9ccd0, metalness: 1, roughness: 0.3 });
    M.flag = new T.MeshStandardMaterial({ map: tex.flag, roughness: 0.5, metalness: 0.1 });
    M.roof = new T.MeshPhysicalMaterial({ color: 0x2d3a33, metalness: 0.7, roughness: 0.4, clearcoat: 0.5 });
    M.lampHead = new T.MeshStandardMaterial({ color: 0x2a2c30, metalness: 0.6, roughness: 0.4 });
    M.lampLens = new T.MeshStandardMaterial({ color: 0xfff1d0, emissive: 0xffd9a0, emissiveIntensity: 0 });
  }
  const box = (w, h, d, m, x = 0, y = 0, z = 0) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };
  const cyl = (r, h, m, x = 0, y = 0, z = 0, seg = 32) => { const o = new T.Mesh(new T.CylinderGeometry(r, r, h, seg), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };
  function ledFace(texture, w, h) { // the screen: the live canvas as light, behind a thin glossy window
    const g = new T.Group();
    const face = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: texture, emissiveIntensity: 2.2, roughness: 0.35 }));
    const win = new T.Mesh(new T.PlaneGeometry(w, h), M.glass); win.position.z = 0.004; g.add(face, win); return g;
  }
  function cabinet(texture, faceW, faceH, depth, mat, outerW, outerH) { // powder-coated aluminium cabinet with a bevel frame
    const g = new T.Group(), bw = outerW || faceW + 0.07, bh = outerH || faceH + 0.07;
    g.add(box(bw, bh, depth, mat, 0, 0, -depth / 2));
    const lip = 0.006; g.add(box(bw, lip, 0.02, mat, 0, bh / 2 - lip / 2, 0.01), box(bw, lip, 0.02, mat, 0, -bh / 2 + lip / 2, 0.01), box(lip, bh, 0.02, mat, -bw / 2 + lip / 2, 0, 0.01), box(lip, bh, 0.02, mat, bw / 2 - lip / 2, 0, 0.01));
    const led = ledFace(texture, faceW, faceH); led.position.z = 0.003; g.add(led); g.userData.led = led; return g;
  }
  function bandClamp(y, r) { const t = new T.Mesh(new T.TorusGeometry(r + 0.006, 0.006, 8, 40), M.steel); t.rotation.x = Math.PI / 2; t.position.y = y; return t; }
  function tree(x, z, s = 1) {
    const g = new T.Group(); g.add(cyl(0.12 * s, 2.6 * s, M.bark, 0, 1.3 * s, 0, 10));
    // the canopy: a dozen lumpy, smooth-shaded clusters in slightly different greens (no flat facets)
    const seed = rnd() * 100;
    for(let i = 0; i < 12; i++) {
      const geo = mergeV(new T.IcosahedronGeometry(1, 4)), p = geo.attributes.position, col = [];
      for(let k = 0; k < p.count; k++) { const x = p.getX(k), y = p.getY(k), z = p.getZ(k), n = 0.78 + 0.16 * Math.sin(x * 5.1 + seed + i) * Math.cos(y * 4.3 + i) + 0.1 * Math.sin(z * 9.7 + x * 3.3); p.setXYZ(k, x * n, y * n * 0.85, z * n);
        const sh = 0.75 + 0.35 * Math.max(0, y); col.push(0.2 * sh, (0.36 + 0.08 * Math.sin(i + seed)) * sh, 0.15 * sh); }
      geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
      const m = new T.Mesh(geo, M.canopy); const a = i / 12 * Math.PI * 2, r = (i % 3) * 0.55 * s;
      m.scale.setScalar((0.75 + rnd() * 0.5) * s); m.position.set(Math.cos(a) * r, (3 + (i % 4) * 0.45 + rnd() * 0.3) * s, Math.sin(a) * r); m.castShadow = true; m.receiveShadow = true; g.add(m); }
    for(let b = 0; b < 3; b++) { const br = cyl(0.04 * s, 1.3 * s, M.bark, 0, 2.6 * s, 0, 6); br.rotation.z = (b - 1) * 0.6; br.rotation.y = b * 2; g.add(br); }
    g.position.set(x, 0, z); return g;
  }
  function streetLamp(x, z, face = 1) {
    const g = new T.Group(); g.add(cyl(0.07, 7, M.galv, 0, 3.5, 0, 20)); g.add(box(0.06, 0.06, 1.6, M.galv, 0, 6.9, 0.8 * face));
    const head = box(0.5, 0.1, 0.25, M.lampHead, 0, 6.85, 1.6 * face); g.add(head); const lens = new T.Mesh(new T.PlaneGeometry(0.42, 0.18), M.lampLens); lens.rotation.x = Math.PI / 2; lens.position.set(0, 6.79, 1.6 * face); g.add(lens);
    const L = new T.SpotLight(0xffd6a0, 0, 26, 0.95, 0.6, 1.6); L.position.set(0, 6.75, 1.6 * face); L.target.position.set(0, 0, 2.2 * face); L.castShadow = true; L.shadow.mapSize.set(1024, 1024); g.add(L, L.target); lamps.push(L);
    g.position.set(x, 0, z); return g;
  }
  function person(x, z, rotY = 0, col = 0x2c3442) {
    const g = new T.Group(), cloth = new T.MeshStandardMaterial({ color: col, roughness: 0.9 }), skin = new T.MeshStandardMaterial({ color: 0x8d6a52, roughness: 0.7 });
    g.add(cyl(0.16, 0.62, cloth, 0, 1.18, 0, 16)); g.add(new T.Mesh(new T.SphereGeometry(0.11, 20, 16), skin)); g.children[1].position.y = 1.62;
    g.add(cyl(0.07, 0.86, new T.MeshStandardMaterial({ color: 0x1d2128, roughness: 0.9 }), -0.08, 0.43, 0, 10), cyl(0.07, 0.86, new T.MeshStandardMaterial({ color: 0x1d2128, roughness: 0.9 }), 0.08, 0.43, 0, 10));
    g.children.forEach(c => { c.castShadow = true; }); g.position.set(x, 0, z); g.rotation.y = rotY; return g;
  }


  // ---------------------------------------------------------------- where each screen can go, per place (spot 0 = the scene's own default)
  // t: wall (flat on a wall, facing r), stand (on a surface at height y), hang (on cables from c), pole (band clamps on a round pole)
  const SPOTS = {
    living:  { bar: [{ n: 'Wall above the console' }, { n: 'On the console', t: 'stand', x: -0.3, y: 0.56, z: 0.2 }, { n: 'Wall by the art', t: 'wall', x: -1.55, y: 1.05, z: 0 }, { n: 'On the coffee table', t: 'stand', x: 1.1, y: 0.44, z: 2.55 }],
               pan: [{ n: 'On the console' }, { n: 'Wall beside the Bar', t: 'wall', x: 0.9, y: 1.32, z: 0 }, { n: 'On the coffee table', t: 'stand', x: 1.1, y: 0.44, z: 2.6 }, { n: 'Wall by the art', t: 'wall', x: -1.55, y: 1.0, z: 0 }] },
    bedroom: { bar: [{ n: 'Above the headboard' }, { n: 'On the left nightstand', t: 'stand', x: -1.15, y: 0.55, z: 0.3 }, { n: 'Wall over the left nightstand', t: 'wall', x: -1.2, y: 1.2, z: 0 }],
               pan: [{ n: 'Right nightstand' }, { n: 'Left nightstand', t: 'stand', x: -1.12, y: 0.55, z: 0.22, r: 0.35 }, { n: 'Above the headboard', t: 'wall', x: 0, y: 1.42, z: 0 }, { n: 'Wall over the right nightstand', t: 'wall', x: 1.2, y: 1.15, z: 0 }] },
    pub:     { bar: [{ n: 'Above the back bar' }, { n: 'Hanging over the bar top', t: 'hang', x: 0.7, y: 1.8, z: 1.72, c: 2.7 }, { n: 'On the bar top', t: 'stand', x: -0.3, y: 1.11, z: 1.62 }],
               pan: [{ n: 'On the bar top' }, { n: 'Hanging over the bar', t: 'hang', x: -0.7, y: 1.75, z: 1.72, c: 2.7 }, { n: 'Above the mirror', t: 'wall', x: -1.2, y: 1.78, z: 0.012 }] },
    cafe:    { bar: [{ n: 'Menu strip on the tile' }, { n: 'Hanging over the counter', t: 'hang', x: 0, y: 1.75, z: 1.9, c: 2.7 }, { n: 'On the pastry case', t: 'stand', x: 1.2, y: 1.46, z: 1.9 }],
               pan: [{ n: 'On the counter' }, { n: 'By the register', t: 'stand', x: -0.95, y: 1.05, z: 1.85 }, { n: 'On the tile wall', t: 'wall', x: 0.6, y: 1.4, z: 0.005 }, { n: 'Hanging over the counter', t: 'hang', x: 0.6, y: 1.6, z: 1.9, c: 2.7 }] },
    cave:    { bar: [{ n: 'Above the TV' }, { n: 'On the media console', t: 'stand', x: -0.6, y: 0.455, z: 0.25 }, { n: 'Wall beside the TV', t: 'wall', x: 1.9, y: 1.5, z: 0 }],
               pan: [{ n: 'On the media console' }, { n: 'Above the TV', t: 'wall', x: 0, y: 1.95, z: 0.05 }, { n: 'On the coffee table', t: 'stand', x: -0.2, y: 0.44, z: 2.2 }, { n: 'Wall beside the TV', t: 'wall', x: 1.9, y: 1.2, z: 0 }] },
    yard:    { bar: [{ n: 'Under the back beam' }, { n: 'On the fence', t: 'wall', x: 1.0, y: 1.25, z: -3.19 }, { n: 'On the patio table', t: 'stand', x: 0.4, y: 0.895, z: 0.05 }],
               pan: [{ n: 'On the patio table' }, { n: 'Under the back beam', t: 'hang', x: 0, y: 2.15, z: -1.72, c: 2.56 }, { n: 'On a front post', t: 'wall', x: -2.2, y: 1.5, z: 1.87 }, { n: 'On the fence', t: 'wall', x: -1.0, y: 1.2, z: -3.19 }] },
    // Outdoor transit mounts: every cabinet on the pole gets a sun hood (keeps the sun off the LEDs and stops glare) and a
    // tilting knuckle; high mounts (8 ft / 2.44 m, above vandal reach and over crowds) tilt down toward the rider.
    busstop: { bar: [{ n: '8 ft, tilted down 15°, sun hood', t: 'pole', x: 0, y: 2.44, z: 1.45, tilt: 15, hood: true }, { n: '7 ft, tilted down 10°, sun hood', t: 'pole', x: 0, y: 2.13, z: 1.45, tilt: 10, hood: true },
                        { n: 'Eye level, sun hood', t: 'pole', x: 0, y: 1.72, z: 1.45, tilt: 3, hood: true }, { n: 'On the bench back', t: 'stand', x: 2.6, y: 1.08, z: -0.06 }],
               pan: [{ n: 'Eye level, tilted 5°, sun hood', t: 'pole', x: 0, y: 1.6, z: 1.45, tilt: 5, hood: true }, { n: '8 ft, tilted down 18°, sun hood', t: 'pole', x: 0, y: 2.62, z: 1.45, tilt: 18, hood: true },
                        { n: '7 ft, tilted down 12°, sun hood', t: 'pole', x: 0, y: 2.05, z: 1.45, tilt: 12, hood: true }, { n: 'On the bench end', t: 'stand', x: 3.3, y: 0.62, z: 0.2 }] },
    park:    { bar: [{ n: 'Kiosk header' }, { n: 'Under the canopy', t: 'hang', k: 'K', x: 0, y: 1.9, z: 0.0, c: 2.0 }, { n: 'On the bench', t: 'stand', x: 2.2, y: 0.47, z: 1.2, r: -0.6 }],
               pan: [{ n: 'Below the Bar' }, { n: 'Under the canopy', t: 'hang', k: 'K', x: 0, y: 1.85, z: 0.0, c: 2.0 }, { n: 'On the bench', t: 'stand', x: 2.2, y: 0.47, z: 1.2, r: -0.6 }] },
  };
  function placeAt(parent, which, sp, housing) {
    const bar = which === 'bar', oh = bar ? 0.076 : 0.178, grp = new T.Group(), r = sp.r || 0;
    grp.position.set(sp.x, sp.y, sp.z); grp.rotation.y = r; parent.add(grp);
    const cab = cabinet(bar ? texBar : texPan, bar ? 0.3 : 0.32, bar ? 0.075 : 0.16, 0.035, housing, 0.33, oh);
    let gy = 0;
    if(sp.t === 'wall') { cab.position.set(0, 0, 0.04); grp.add(cab, box(bar ? 0.2 : 0.22, bar ? 0.03 : 0.06, 0.008, housing, 0, 0, 0.004)); }
    else if(sp.t === 'stand') { cab.position.set(0, oh / 2 + 0.012, 0); cab.rotation.x = -0.12; grp.add(cab, box(0.12, 0.008, 0.11, housing, 0, 0.004, -0.05)); gy = oh / 2; }
    else if(sp.t === 'hang') { grp.add(cab); [-0.12, 0.12].forEach(x => grp.add(cyl(0.0015, sp.c - sp.y - oh / 2, M.steel, x, (sp.c - sp.y + oh / 2) / 2, -0.015, 6))); }
    else if(sp.t === 'pole') {
      // band clamps and a backplate on the pole, a tilting knuckle, then the cabinet pitched down by sp.tilt degrees
      const tilt = T.MathUtils.degToRad(sp.tilt || 0), head = new T.Group(); head.position.set(0, 0, 0.1); head.rotation.x = tilt;
      cab.position.set(0, 0, 0.03); head.add(cab);
      if(sp.hood) { // sun hood: a top visor angled forward and down, with side cheeks, in the cabinet's finish
        const hw = 0.35, hd = bar ? 0.075 : 0.11, vis = box(hw, 0.005, hd, housing, 0, oh / 2 + 0.006, 0.03 + hd / 2 - 0.01); vis.rotation.x = 0.16; head.add(vis);
        [-1, 1].forEach(sd => { const ch = new T.Mesh(new T.ShapeGeometry(new T.Shape([new T.Vector2(0, 0), new T.Vector2(hd, 0), new T.Vector2(0, -oh * 0.7)])), housing); ch.material.side = T.DoubleSide; ch.rotation.y = -Math.PI / 2; ch.position.set(sd * hw / 2, oh / 2 + 0.004, 0.02); ch.castShadow = true; head.add(ch); });
      }
      grp.add(head, box(0.05, 0.05, 0.07, housing, 0, 0, 0.065), cyl(0.012, 0.07, M.steel, 0, 0, 0.1, 12)); grp.children[grp.children.length - 1].rotation.z = Math.PI / 2;
      grp.add(box(bar ? 0.06 : 0.07, oh * 0.9, 0.035, housing, 0, 0, 0.045), bandClamp(oh / 2 - 0.012, 0.0445), bandClamp(-oh / 2 + 0.012, 0.0445));
      gy = -Math.sin(tilt) * 0.35; }
    glowAt(parent, sp.x + Math.sin(r) * 0.35, sp.y + gy, sp.z + Math.cos(r) * 0.35, which);
  }
  function alt(which, g, housing, parents = {}) { // the chosen spot, when it is not the scene's default; true when placed here
    const list = (SPOTS[place] || {})[which], i = which === 'bar' ? opts.barSpot : opts.panSpot;
    if(!list || !list[i || 0] || (!i && !list[0].t)) return false; // spot 0 is the scene's own unless it is defined here
    const sp = list[i || 0]; placeAt(sp.k ? parents[sp.k] : g, which, sp, housing); return true;
  }

  // ---------------------------------------------------------------- the sites
  function busStop() {
    const g = new T.Group(), housing = opts.finish === 'white' ? M.coatWhite : M.coatBlack;
    const side = new T.Mesh(new T.BoxGeometry(60, 0.15, 5), M.concrete); side.position.set(0, 0.075, -0.5); side.receiveShadow = true; g.add(side);
    g.add(box(60, 0.17, 0.25, M.curb, 0, 0.085, 2.1));
    const road = new T.Mesh(new T.PlaneGeometry(60, 14), M.asphalt); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.002, 9.2); road.receiveShadow = true; g.add(road);
    const lines = new T.Mesh(new T.PlaneGeometry(60, 0.14), new T.MeshStandardMaterial({ map: tex.lines, transparent: true, roughness: 0.6 })); lines.rotation.x = -Math.PI / 2; lines.position.set(0, 0.006, 8.5); g.add(lines);
    const far = new T.Mesh(new T.BoxGeometry(60, 0.15, 6), M.concrete); far.position.set(0, 0.075, 19); far.receiveShadow = true; g.add(far);
    // buildings behind the sidewalk
    for(let i = 0; i < 9; i++) { const w = 7 + rnd() * 3, h = 9 + rnd() * 14, x = -30 + i * 7.6, z = -15 - rnd() * 3; const fm = i % 2 ? M.facadeA : M.facadeB;
      const b = new T.Mesh(new T.BoxGeometry(w, h, 8), [M.brick2, M.brick2, M.brick2, M.brick2, fm, M.brick2]); b.position.set(x, h / 2 + 3.2, z); b.castShadow = b.receiveShadow = true; g.add(b);
      g.add(box(w, 3.2, 8, M.brick2, x, 1.6, z)); const shop = new T.Mesh(new T.PlaneGeometry(w - 1, 2.4), M.shopGlass); shop.position.set(x, 1.5, z + 4.01); g.add(shop);
      const aw = box(w - 0.6, 0.08, 1.2, i % 3 ? M.awningA : M.awningB, x, 3.0, z + 4.6); aw.rotation.x = 0.25; g.add(aw); }
    const back = new T.Mesh(new T.BoxGeometry(60, 0.15, 12), M.concrete); back.position.set(0, 0.075, -8.5); back.receiveShadow = true; g.add(back);
    // the pole, 89 mm galvanised, set in the sidewalk 0.55 m back from the curb
    const P = new T.Group(); P.position.set(0, 0.15, 1.45); g.add(P);
    P.add(cyl(0.0445, 3.9, M.galv, 0, 1.95, 0)); P.add(cyl(0.05, 0.02, M.galv, 0, 3.91, 0)); // cap
    P.add(cyl(0.09, 0.04, M.steel, 0, 0.02, 0, 24)); // base collar
    // stop flag: double-sided plate on two bands
    const flag = new T.Mesh(new T.BoxGeometry(0.46, 0.46, 0.012), [M.alu, M.alu, M.alu, M.alu, M.flag, M.flag]); flag.position.set(0.29, 3.45, 0); flag.castShadow = true; P.add(flag, bandClamp(3.62, 0.0445), bandClamp(3.28, 0.0445));
    // solar: 60 x 40 cm panel tilted south on a top bracket
    const sp = new T.Group(); sp.position.set(0, 3.98, 0); sp.add(box(0.05, 0.1, 0.05, M.alu, 0, -0.04, 0));
    const panel = new T.Group(); panel.rotation.x = -0.55; panel.add(box(0.62, 0.02, 0.42, M.alu, 0, 0, 0)); const cells = new T.Mesh(new T.PlaneGeometry(0.58, 0.38), M.solar); cells.rotation.x = -Math.PI / 2; cells.position.y = 0.011; panel.add(cells); sp.add(panel); P.add(sp);
    // Bar cabinet on a backplate with two stainless bands at 2.4 m; the companion at eye level below it
    // real sizes: the Bar is 13 x 3 in (330 x 76 mm), the companion 13 x 7 in (330 x 178 mm); mounted at reading height
    if(opts.room !== 2 && !alt('bar', g, housing)) { const bar = cabinet(texBar, 0.300, 0.075, 0.035, housing, 0.330, 0.076); const y = opts.room === 1 ? 1.72 : 1.86; bar.position.set(0, y, 0.085); P.add(bar, box(0.06, 0.07, 0.04, housing, 0, y, 0.06), bandClamp(y + 0.025, 0.0445), bandClamp(y - 0.025, 0.0445)); } // alone: at eye level
    if(opts.room !== 1 && !alt('pan', g, housing)) { const pan = cabinet(texPan, 0.320, 0.160, 0.04, housing, 0.330, 0.178); const y = opts.room === 2 ? 1.62 : 1.56; pan.position.set(0, y, 0.088); P.add(pan, box(0.07, 0.15, 0.04, housing, 0, y, 0.06), bandClamp(y + 0.06, 0.0445), bandClamp(y - 0.06, 0.0445)); }
    // bench, a lamp, people, street trees
    const bench = new T.Group(); bench.position.set(2.6, 0.15, 0.2); for(let i = 0; i < 4; i++) bench.add(box(1.8, 0.04, 0.09, M.wood, 0, 0.45, -0.18 + i * 0.12)); bench.add(box(1.8, 0.09, 0.04, M.wood, 0, 0.75, -0.26), box(1.8, 0.09, 0.04, M.wood, 0, 0.88, -0.26));
    [-0.8, 0.8].forEach(x => bench.add(box(0.05, 0.45, 0.5, M.galv, x, 0.225, 0))); g.add(bench);
    g.add(streetLamp(-6, 1.7, 1), streetLamp(14, 1.7, 1)); g.add(tree(-9, 0.6, 1.1), tree(8, 0.6, 1), tree(20, 0.6, 1.2));
    return { group: g, target: new T.Vector3(0, 2.0, 1.6), base: new T.Vector3(0.6, 1.62, 3.4) };
  }
  function parkKiosk() {
    const g = new T.Group(), housing = opts.finish === 'white' ? M.coatWhite : M.bronze;
    const lawn = new T.Mesh(new T.PlaneGeometry(120, 120), M.grass); lawn.rotation.x = -Math.PI / 2; lawn.receiveShadow = true; g.add(lawn);
    const path = new T.Mesh(new T.PlaneGeometry(2.4, 60), M.gravel); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.004, 4); path.receiveShadow = true; g.add(path);
    const K = new T.Group(); K.position.set(-2.2, 0, 1); K.rotation.y = 0.35; g.add(K);
    const span = 0.44, postH = 2.0; // 50 mm posts either side of the 13 in signs
    [-span / 2, span / 2].forEach(x => { K.add(box(0.05, postH, 0.05, housing, x, postH / 2, 0)); K.add(box(0.22, 0.08, 0.22, M.pad, x, 0.04, 0)); K.add(box(0.065, 0.015, 0.065, housing, x, postH + 0.008, 0)); });
    if(opts.room !== 2 && !alt('bar', g, housing, { K })) { const bar = cabinet(texBar, 0.300, 0.075, 0.04, housing, 0.330, 0.076); const y = opts.room === 1 ? 1.5 : 1.62; bar.position.set(0, y, 0.025); K.add(bar); K.add(box(span, 0.02, 0.04, housing, 0, y + 0.05, 0), box(span, 0.02, 0.04, housing, 0, y - 0.05, 0)); }
    if(opts.room !== 1 && !alt('pan', g, housing, { K })) { const pan = cabinet(texPan, 0.320, 0.160, 0.045, housing, 0.330, 0.178); const y = opts.room === 2 ? 1.45 : 1.38; pan.position.set(0, y, 0.025); K.add(pan); K.add(box(span, 0.02, 0.04, housing, 0, y - 0.1, 0), box(span, 0.02, 0.04, housing, 0, y + 0.1, 0)); }
    const roofL = box(0.32, 0.015, 0.34, M.roof, 0, 0, 0); roofL.position.set(-0.145, postH + 0.07, 0); roofL.rotation.z = 0.36; const roofR = roofL.clone(); roofR.position.x = 0.145; roofR.rotation.z = -0.36; K.add(roofL, roofR); K.add(box(span + 0.06, 0.04, 0.05, housing, 0, postH + 0.01, 0));
    // trees, benches, a lamp post, people on the path
    [[-9, -6, 1.3], [-4, -11, 1.5], [3, -9, 1.2], [9, -5, 1.4], [14, -12, 1.6], [-15, -10, 1.4], [6, 9, 1.1], [-10, 6, 1.2], [18, 2, 1.3], [-20, -2, 1.5]].forEach(([x, z, s]) => g.add(tree(x, z, s)));
    const bench = new T.Group(); bench.position.set(2.2, 0, 1.2); bench.rotation.y = -0.6; for(let i = 0; i < 3; i++) bench.add(box(1.6, 0.04, 0.1, M.wood, 0, 0.45, -0.14 + i * 0.13)); bench.add(box(1.6, 0.1, 0.04, M.wood, 0, 0.78, -0.22)); [-0.7, 0.7].forEach(x => bench.add(box(0.06, 0.45, 0.45, M.bronze, x, 0.225, 0))); g.add(bench);
    g.add(streetLamp(4.5, -1, -1));
    return { group: g, target: new T.Vector3(-2.2, 1.5, 1), base: new T.Vector3(-1.4, 1.6, 2.9) };
  }

  // A race finish line: a closed road, the finish arch over a timing mat, barriers with spectators, runners coming in.
  // The stand is on the right just past the line, facing the finish chute where runners and the crowd gather (two posts).
  function finishLine() {
    const g = new T.Group(), housing = opts.finish === 'white' ? M.coatWhite : M.coatBlack;
    if(!tex.finish) {
      tex.finish = canvasTex(1024, 192, (c, w, h) => { c.fillStyle = '#12233f'; c.fillRect(0, 0, w, h);
        for(let x = 0; x < w; x += 32) for(let y = 0; y < 2; y++) { c.fillStyle = ((x / 32 + y) % 2) ? '#ffffff' : '#111111'; c.fillRect(x, y * 16, 32, 16); c.fillRect(x, h - 32 + y * 16, 32, 16); }
        c.fillStyle = '#ffffff'; c.font = 'bold 104px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('FINISH', w / 2, h / 2 + 4); });
      tex.mat = canvasTex(256, 64, (c, w, h) => { for(let x = 0; x < w; x += 16) for(let y = 0; y < h; y += 16) { c.fillStyle = ((x + y) / 16 % 2) ? '#e8e8e8' : '#1a1a1a'; c.fillRect(x, y, 16, 16); } }, [6, 1]);
    }
    const grassL = new T.Mesh(new T.PlaneGeometry(120, 120), M.grass); grassL.rotation.x = -Math.PI / 2; grassL.receiveShadow = true; g.add(grassL);
    const road = new T.Mesh(new T.PlaneGeometry(7.4, 80), M.asphalt); road.rotation.x = -Math.PI / 2; road.position.set(0, 0.004, -20); road.receiveShadow = true; g.add(road);
    const walk = new T.Mesh(new T.PlaneGeometry(4, 80), M.concrete); walk.rotation.x = -Math.PI / 2; walk.position.set(5.9, 0.006, -20); walk.receiveShadow = true; g.add(walk);
    const mat = new T.Mesh(new T.PlaneGeometry(7.2, 0.9), new T.MeshStandardMaterial({ map: tex.mat, roughness: 0.8 })); mat.rotation.x = -Math.PI / 2; mat.position.set(0, 0.01, 0); g.add(mat);
    // the arch: two truss legs and a banner beam
    [-3.9, 3.9].forEach(x => { g.add(box(0.32, 4.2, 0.32, M.steel, x, 2.1, 0)); g.add(box(0.7, 0.12, 0.7, M.pad, x, 0.06, 0)); });
    g.add(box(8.12, 0.3, 0.34, M.steel, 0, 4.3, 0));
    const banner = new T.Mesh(new T.PlaneGeometry(7.4, 1.38), new T.MeshStandardMaterial({ map: tex.finish, roughness: 0.7, side: T.DoubleSide })); banner.position.set(0, 3.55, 0.18); g.add(banner);
    const bannerB = banner.clone(); bannerB.position.z = -0.18; bannerB.rotation.y = Math.PI; g.add(bannerB);
    // barriers both sides of the road, with spectators behind them
    for(let z = -26; z <= 7; z += 2.1) for(const x of [-3.85, 3.85]) { if(Math.abs(z) < 1.2) continue;
      const bar = new T.Group(); bar.add(box(0.04, 1.0, 2.0, M.galv, 0, 0.6, 0)); bar.add(box(0.03, 0.03, 2.0, M.galv, 0, 1.08, 0), box(0.03, 0.03, 2.0, M.galv, 0, 0.18, 0));
      for(let k = -0.9; k <= 0.9; k += 0.15) bar.add(box(0.015, 0.9, 0.015, M.galv, 0, 0.62, k)); bar.position.set(x, 0, z); g.add(bar); }
    const cols = [0xc0392b, 0x2e86de, 0xf1c40f, 0x27ae60, 0x8e44ad, 0xe67e22, 0x16a085, 0x34495e];
    for(let i = 0; i < 22; i++) { const z = -24 + i * 1.45 + rnd() * 0.6; const side = i % 2 ? -1 : 1; if(Math.abs(z) < 1.4 || (side > 0 && z > 3.4 && z < 6.6)) continue;
      g.add(person(side * (4.45 + rnd() * 0.5), z, side > 0 ? -Math.PI / 2 : Math.PI / 2, cols[i % cols.length])); }
    // runners on the course, the leader just crossing the mat
    [[-0.6, -0.3], [1.1, -3.6], [-1.4, -6.2], [0.4, -9.5], [-0.9, -13], [1.6, -16.4], [-0.2, -21]].forEach(([x, z], i) => g.add(person(x, z, 0, cols[(i + 3) % cols.length])));
    // the ARXI stand: two posts past the arch on the right, angled to the finish
    const K = new T.Group(); K.position.set(4.6, 0, 5.0); K.rotation.y = -0.35; g.add(K);
    const span = 0.44, postH = 2.0;
    [-span / 2, span / 2].forEach(x => { K.add(box(0.05, postH, 0.05, housing, x, postH / 2, 0)); K.add(box(0.3, 0.03, 0.42, M.steel, x, 0.015, 0)); K.add(box(0.065, 0.015, 0.065, housing, x, postH + 0.008, 0)); });
    if(opts.room !== 2 && !alt('bar', g, housing, { K })) { const bar = cabinet(texBar, 0.300, 0.075, 0.04, housing, 0.330, 0.076); const y = opts.room === 1 ? 1.62 : 1.74; bar.position.set(0, y, 0.025); K.add(bar); K.add(box(span, 0.03, 0.03, housing, 0, y, 0)); }
    if(opts.room !== 1 && !alt('pan', g, housing, { K })) { const pan = cabinet(texPan, 0.320, 0.160, 0.045, housing, 0.330, 0.178); const y = opts.room === 2 ? 1.55 : 1.48; pan.position.set(0, y, 0.025); K.add(pan); K.add(box(span, 0.03, 0.03, housing, 0, y, 0)); }
    [[-12, -30, 1.4], [-9, -18, 1.2], [11, -26, 1.5], [12, -12, 1.3], [-13, -6, 1.3], [14, 2, 1.2], [-12, 8, 1.4]].forEach(([x, z, sc]) => g.add(tree(x, z, sc)));
    g.add(streetLamp(8.2, -6, -1));
    return { group: g, target: new T.Vector3(4.4, 1.7, 5.0), base: new T.Vector3(2.5, 1.7, 8.4) };
  }

  // ---------------------------------------------------------------- indoors: a real room, window light, lamps, screen glow
  const rbox = (w, h, d, r, m, x = 0, y = 0, z = 0) => { const o = new T.Mesh(new RBox(w, h, d, 4, Math.min(r, w / 2, h / 2, d / 2)), m); o.position.set(x, y, z); o.castShadow = o.receiveShadow = true; return o; };
  function roomTextures() {
    if(tex.planks) return;
    tex.planks = canvasTex(1024, 1024, (g, w, h) => { for(let y = 0; y < h; y += 64) { let x = -rnd() * 300; while(x < w) { const len = 220 + rnd() * 320, L = 34 + rnd() * 14; g.fillStyle = `hsl(${26 + rnd() * 8},${38 + rnd() * 10}%,${L}%)`; g.fillRect(x, y, len, 64);
      for(let k = 0; k < 18; k++) { g.strokeStyle = `rgba(40,22,10,${0.05 + rnd() * 0.08})`; g.beginPath(); const yy = y + rnd() * 64; g.moveTo(x, yy); g.bezierCurveTo(x + len * 0.3, yy + (rnd() - 0.5) * 8, x + len * 0.7, yy + (rnd() - 0.5) * 8, x + len, yy); g.stroke(); }
      g.fillStyle = 'rgba(20,10,4,.55)'; g.fillRect(x, y, 2, 64); x += len; } g.fillStyle = 'rgba(20,10,4,.6)'; g.fillRect(0, y, w, 2); } }, [3, 3]);
    tex.paint = canvasTex(256, 256, (g, w, h) => { noise(g, w, h, '#ffffff', 14, 9000, 2); }, [6, 3]);
    tex.rug = canvasTex(512, 512, (g, w, h) => { noise(g, w, h, '#b9ad98', 40, 30000, 2); g.strokeStyle = 'rgba(70,52,40,.55)'; g.lineWidth = 18; g.strokeRect(30, 30, w - 60, h - 60); g.lineWidth = 4; g.strokeRect(70, 70, w - 140, h - 140);
      for(let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(70,52,40,.25)'; g.beginPath(); g.arc(w / 2, h / 2, 40 + i * 30, 0, 7); g.stroke(); } });
    tex.fabric = canvasTex(256, 256, (g, w, h) => { noise(g, w, h, '#ffffff', 30, 16000, 1.2); }, [4, 4]);
  }
  function roomShell(wallHex, floorMat) {
    const g = new T.Group(), W = 6, D = 5.6, H = 2.7, wall = new T.MeshStandardMaterial({ color: wallHex, map: tex.paint, roughness: 0.95 });
    const floor = new T.Mesh(new T.PlaneGeometry(W, D), floorMat); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, D / 2); floor.receiveShadow = true; g.add(floor);
    const ceil = new T.Mesh(new T.PlaneGeometry(W, D), new T.MeshStandardMaterial({ color: 0xf2f0ec, roughness: 1 })); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, H, D / 2); g.add(ceil);
    const t = 0.12, wb = (w, h, d, x, y, z) => { const o = box(w, h, d, wall, x, y, z); return o; };
    g.add(wb(W, H, t, 0, H / 2, -t / 2), wb(t, H, D, W / 2 + t / 2, H / 2, D / 2), wb(W, H, t, 0, H / 2, D + t / 2));
    // left wall with a window (z 1.2..3.4, y 0.85..2.2)
    const z0 = 1.2, z1 = 3.4, y0 = 0.85, y1 = 2.2, x = -W / 2 - t / 2;
    g.add(wb(t, H, z0, x, H / 2, z0 / 2), wb(t, H, D - z1, x, H / 2, (z1 + D) / 2), wb(t, y0, z1 - z0, x, y0 / 2, (z0 + z1) / 2), wb(t, H - y1, z1 - z0, x, (y1 + H) / 2, (z0 + z1) / 2));
    const trim = new T.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.6 });
    g.add(box(0.06, 0.05, z1 - z0 + 0.1, trim, x + 0.06, y0, (z0 + z1) / 2), box(0.06, 0.05, z1 - z0 + 0.1, trim, x + 0.06, y1, (z0 + z1) / 2), box(0.06, y1 - y0, 0.05, trim, x + 0.06, (y0 + y1) / 2, z0), box(0.06, y1 - y0, 0.05, trim, x + 0.06, (y0 + y1) / 2, z1), box(0.04, y1 - y0, 0.035, trim, x + 0.04, (y0 + y1) / 2, (z0 + z1) / 2));
    const pane = new T.Mesh(new T.PlaneGeometry(z1 - z0, y1 - y0), new T.MeshPhysicalMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, roughness: 0.02, metalness: 0, clearcoat: 1 })); pane.rotation.y = Math.PI / 2; pane.position.set(x, (y0 + y1) / 2, (z0 + z1) / 2); g.add(pane);
    // curtains either side of the window
    const cloth = new T.MeshStandardMaterial({ color: 0xd9d2c4, map: tex.fabric, roughness: 1, side: T.DoubleSide });
    [z0 - 0.28, z1 + 0.28].forEach(z => { for(let k = 0; k < 5; k++) { const c = cyl(0.05, H - 0.25, cloth, -W / 2 + 0.1, (H - 0.25) / 2, z - 0.2 + k * 0.1, 12); c.scale.x = 0.5; g.add(c); } });
    g.add(cyl(0.012, z1 - z0 + 1.4, M.steel, -W / 2 + 0.1, H - 0.12, (z0 + z1) / 2, 10)); g.children[g.children.length - 1].rotation.x = Math.PI / 2;
    // baseboards
    const base = new T.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.7 }); g.add(box(W, 0.1, 0.02, base, 0, 0.05, 0.01), box(0.02, 0.1, D, base, W / 2 - 0.01, 0.05, D / 2));
    return g;
  }
  function wallBar(g, x, y, housing) { // the Bar on the wall: a slim French-cleat mount, the cabinet 13 x 3 in
    const bar = cabinet(texBar, 0.300, 0.075, 0.035, housing, 0.330, 0.076); bar.position.set(x, y, 0.04); g.add(bar, box(0.2, 0.03, 0.008, housing, x, y, 0.004)); glowAt(g, x, y - 0.05, 0.35, 'bar');
  }
  function standPanel(g, x, y, z, housing, rotY = 0) { // the companion standing on furniture on a small kickstand
    const s = new T.Group(); const pan = cabinet(texPan, 0.320, 0.160, 0.035, housing, 0.330, 0.178); pan.position.set(0, 0.089 + 0.012, 0); pan.rotation.x = -0.12; s.add(pan);
    const leg = box(0.12, 0.008, 0.11, housing, 0, 0.004, -0.05); s.add(leg); s.position.set(x, y, z); s.rotation.y = rotY; g.add(s); glowAt(g, x, y + 0.08, z + 0.35, 'pan');
  }
  const glows = [];
  function glowAt(g, x, y, z, which) { const L = new T.PointLight(0xffffff, 0, 4.5, 1.6); L.position.set(x, y, z); L.userData.which = which; g.add(L); glows.push(L); }
  const sampler = document.createElement('canvas'); sampler.width = 8; sampler.height = 2; const sctx = sampler.getContext('2d', { willReadFrequently: true });
  function updateGlows() { // the screens light the wall: each glow takes its screen's average colour and brightness
    for(const L of glows) { const src = L.userData.which === 'bar' ? $('barCv') : $('panCv'); if(!src) continue; sctx.drawImage(src, 0, 0, 8, 2); const d = sctx.getImageData(0, 0, 8, 2).data; let r = 0, gg = 0, b = 0; for(let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; }
      const n = d.length / 4, lum = (r + gg + b) / (n * 3 * 255); L.color.setRGB(r / n / 255 + 0.02, gg / n / 255 + 0.02, b / n / 255 + 0.02); L.intensity = (L.userData.which === 'bar' ? 1.1 : 1.4) * Math.min(1.2, 0.18 + lum * 3) * (rig.indoor ? 1 : 0.5); }
  }
  function floorLamp(g, x, z) {
    const head = new T.MeshStandardMaterial({ color: 0xf3e7d0, emissive: 0xffd9a8, emissiveIntensity: 0, roughness: 0.9, side: T.DoubleSide, transparent: true, opacity: 0.95 });
    g.add(cyl(0.16, 0.03, M.lampHead, x, 0.015, z, 24), cyl(0.012, 1.55, M.steel, x, 0.8, z, 10));
    const shade = new T.Mesh(new T.CylinderGeometry(0.17, 0.24, 0.3, 32, 1, true), head); shade.position.set(x, 1.62, z); g.add(shade);
    const L = new T.PointLight(0xffc98a, 0, 9, 2); L.position.set(x, 1.6, z); L.castShadow = true; L.shadow.mapSize.set(512, 512); L.shadow.bias = -0.002; g.add(L); lamps.push(L); L.userData.shade = head; return L;
  }
  function tableLamp(g, x, y, z) {
    const head = new T.MeshStandardMaterial({ color: 0xf1e6d2, emissive: 0xffd2a0, emissiveIntensity: 0, roughness: 0.9, side: T.DoubleSide, transparent: true, opacity: 0.95 });
    g.add(rbox(0.12, 0.22, 0.12, 0.05, new T.MeshPhysicalMaterial({ color: 0x8aa39b, roughness: 0.25, clearcoat: 1 }), x, y + 0.11, z), cyl(0.008, 0.12, M.steel, x, y + 0.28, z, 8));
    const shade = new T.Mesh(new T.CylinderGeometry(0.11, 0.15, 0.18, 32, 1, true), head); shade.position.set(x, y + 0.4, z); g.add(shade);
    const L = new T.PointLight(0xffc98a, 0, 6, 2); L.position.set(x, y + 0.38, z); g.add(L); lamps.push(L); L.userData.shade = head;
  }
  function plant(g, x, z, s = 1) {
    g.add(rbox(0.34 * s, 0.4 * s, 0.34 * s, 0.06, new T.MeshStandardMaterial({ color: 0xd8d2c8, roughness: 0.6 }), x, 0.2 * s, z));
    const leafM = new T.MeshStandardMaterial({ color: 0x2f5a2f, roughness: 0.7, side: T.DoubleSide });
    for(let i = 0; i < 16; i++) { const lf = new T.Mesh(new T.SphereGeometry(0.16 * s, 12, 8), leafM); lf.scale.set(0.35, 1, 0.12); const a = i / 16 * Math.PI * 2; lf.position.set(x + Math.cos(a) * 0.12 * s, (0.62 + (i % 4) * 0.12) * s, z + Math.sin(a) * 0.12 * s); lf.rotation.set(Math.sin(a) * 0.7, a, Math.cos(a) * 0.7); lf.castShadow = true; g.add(lf); }
  }
  function livingRoom() {
    roomTextures(); glows.length = 0; const g = roomShell(0xd8cfc1, new T.MeshStandardMaterial({ map: tex.planks, roughness: 0.55 })), housing = opts.finish === 'white' ? M.coatWhite : M.coatBlack;
    const rug = new T.Mesh(new T.PlaneGeometry(2.8, 1.9), new T.MeshStandardMaterial({ map: tex.rug, roughness: 1 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0.6, 0.004, 2.6); rug.receiveShadow = true; g.add(rug);
    const walnut = new T.MeshStandardMaterial({ color: 0x5b3a24, map: tex.planks, roughness: 0.5 });
    g.add(rbox(1.8, 0.46, 0.42, 0.02, walnut, 0.3, 0.33, 0.24)); [-0.55, 1.15].forEach(x => g.add(box(0.03, 0.1, 0.03, M.steel, x, 0.05, 0.24))); g.add(box(1.76, 0.004, 0.005, new T.MeshStandardMaterial({ color: 0x1a120c }), 0.3, 0.33, 0.453));
    // decor on the console: books and a vase; framed art on the wall
    [0x6b2f2a, 0x2f4a5c, 0xc9b78f].forEach((c, i) => g.add(box(0.22, 0.035, 0.16, new T.MeshStandardMaterial({ color: c, roughness: 0.8 }), -0.35, 0.578 + i * 0.036, 0.22)));
    g.add(new T.Mesh(new T.LatheGeometry([0, 0.04, 0.06, 0.05, 0.03, 0.035].map((r, i) => new T.Vector2(r, i * 0.05)), 24), new T.MeshPhysicalMaterial({ color: 0xc66b3d, roughness: 0.3, clearcoat: 1 }))); g.children[g.children.length - 1].position.set(-0.05, 0.56, 0.2);
    const frame = rbox(0.8, 0.6, 0.03, 0.01, new T.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.5 }), -1.55, 1.55, 0.016); g.add(frame);
    const art = new T.Mesh(new T.PlaneGeometry(0.7, 0.5), new T.MeshStandardMaterial({ map: canvasTex(256, 192, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#e8d3b0'); gr.addColorStop(1, '#a35a3a'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#2c3f4f'; c.beginPath(); c.moveTo(0, h); c.lineTo(w * 0.35, h * 0.45); c.lineTo(w * 0.6, h * 0.75); c.lineTo(w * 0.8, h * 0.5); c.lineTo(w, h); c.fill(); c.fillStyle = '#f4e7c8'; c.beginPath(); c.arc(w * 0.7, h * 0.3, 18, 0, 7); c.fill(); }), roughness: 0.8 })); art.position.set(-1.55, 1.55, 0.033); g.add(art);
    // the sofa along the right wall, a coffee table, the lamp by the window and a plant
    const fab = new T.MeshStandardMaterial({ color: 0x55707f, map: tex.fabric, roughness: 1 });
    const sofa = new T.Group(); sofa.add(rbox(2.1, 0.42, 0.9, 0.06, fab, 0, 0.27, 0), rbox(2.1, 0.5, 0.22, 0.08, fab, 0, 0.68, -0.34), rbox(0.2, 0.55, 0.9, 0.08, fab, -1.0, 0.45, 0), rbox(0.2, 0.55, 0.9, 0.08, fab, 1.0, 0.45, 0));
    [-0.48, 0.48].forEach(x => sofa.add(rbox(0.92, 0.14, 0.68, 0.06, fab, x, 0.54, 0.06))); [[-0.55, 0x2f3f49], [0.6, 0xc9a96e]].forEach(([x, c]) => { const pil = rbox(0.42, 0.36, 0.12, 0.06, new T.MeshStandardMaterial({ color: c, map: tex.fabric, roughness: 1 }), x, 0.78, -0.18); pil.rotation.x = -0.25; sofa.add(pil); });
    sofa.position.set(2.45, 0, 2.7); sofa.rotation.y = -Math.PI / 2; g.add(sofa);
    g.add(rbox(1.1, 0.04, 0.6, 0.015, walnut, 1.1, 0.42, 2.7)); [[0.6, 2.45], [1.6, 2.45], [0.6, 2.95], [1.6, 2.95]].forEach(([x, z]) => g.add(box(0.03, 0.4, 0.03, M.steel, x, 0.2, z)));
    floorLamp(g, -2.55, 0.55); plant(g, 2.55, 0.45, 1.1);
    if(opts.room !== 2 && !alt('bar', g, housing)) wallBar(g, 0.3, 1.32, housing);
    if(opts.room !== 1 && !alt('pan', g, housing)) standPanel(g, opts.room === 2 ? 0.3 : 0.9, 0.56, 0.2, housing, opts.room === 2 ? 0 : -0.12);
    return { group: g, target: new T.Vector3(0.35, 1.0, 0.3), base: new T.Vector3(0.75, 1.25, 2.1), indoor: true };
  }
  function bedroom() {
    roomTextures(); glows.length = 0; const g = roomShell(0xb7c3cc, new T.MeshStandardMaterial({ map: tex.planks, roughness: 0.6, color: 0xd9cfc0 })), housing = opts.finish === 'white' ? M.coatWhite : M.coatBlack;
    const rug = new T.Mesh(new T.PlaneGeometry(2.6, 3.0), new T.MeshStandardMaterial({ map: tex.rug, roughness: 1, color: 0xd6dbe0 })); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.004, 1.6); rug.receiveShadow = true; g.add(rug);
    const oak = new T.MeshStandardMaterial({ color: 0x9a7350, map: tex.planks, roughness: 0.55 }), linen = new T.MeshStandardMaterial({ color: 0xf1ede6, map: tex.fabric, roughness: 1 }), duvet = new T.MeshStandardMaterial({ color: 0x8796a6, map: tex.fabric, roughness: 1 });
    g.add(rbox(1.75, 1.05, 0.08, 0.03, new T.MeshStandardMaterial({ color: 0x6f7b86, map: tex.fabric, roughness: 1 }), 0, 0.62, 0.05));
    g.add(rbox(1.65, 0.28, 2.1, 0.03, oak, 0, 0.2, 1.15), rbox(1.58, 0.22, 2.0, 0.08, linen, 0, 0.44, 1.12), rbox(1.62, 0.1, 1.45, 0.05, duvet, 0, 0.56, 1.45));
    const fold = rbox(1.62, 0.07, 0.25, 0.035, linen, 0, 0.6, 0.78); g.add(fold);
    [-0.4, 0.4].forEach(x => { const p = rbox(0.62, 0.4, 0.12, 0.05, linen, x, 0.72, 0.22); p.rotation.x = -0.3; g.add(p); });
    [-1.2, 1.2].forEach(x => { g.add(rbox(0.5, 0.5, 0.42, 0.02, oak, x, 0.3, 0.24)); g.add(box(0.44, 0.004, 0.005, new T.MeshStandardMaterial({ color: 0x3a2a1c }), x, 0.3, 0.453)); tableLamp(g, x + (x < 0 ? -0.08 : 0.12), 0.55, 0.2); });
    plant(g, -2.5, 4.6, 0.9);
    g.add(rbox(1.2, 0.8, 0.45, 0.02, oak, 2.65, 0.4, 3.6)); g.children[g.children.length - 1].rotation.y = -Math.PI / 2;
    if(opts.room !== 2 && !alt('bar', g, housing)) wallBar(g, 0, 1.36, housing);
    if(opts.room !== 1 && !alt('pan', g, housing)) standPanel(g, 1.12, 0.55, 0.22, housing, -0.35);
    return { group: g, target: new T.Vector3(0.25, 0.95, 0.4), base: new T.Vector3(0.9, 1.3, 2.6), indoor: true };
  }

  function pendant(g, x, y, z, col = 0x1b1c1e, warm = 0xffc27a, power = 1) { // a hanging shade on a cord
    const head = new T.MeshStandardMaterial({ color: 0xfff1d8, emissive: warm, emissiveIntensity: 0, roughness: 0.6 });
    g.add(cyl(0.004, 2.7 - y, M.lampHead, x, (2.7 + y) / 2, z, 6));
    const shade = new T.Mesh(new T.ConeGeometry(0.16, 0.18, 32, 1, true), new T.MeshStandardMaterial({ color: col, metalness: 0.6, roughness: 0.4, side: T.DoubleSide })); shade.position.set(x, y, z); g.add(shade);
    const bulb = new T.Mesh(new T.SphereGeometry(0.045, 16, 12), head); bulb.position.set(x, y - 0.07, z); g.add(bulb);
    const L = new T.SpotLight(warm, 0, 7, 1.1, 0.7, 1.6); L.position.set(x, y - 0.08, z); L.target.position.set(x, 0, z); L.castShadow = true; L.shadow.mapSize.set(512, 512); g.add(L, L.target); L.userData.shade = head; L.userData.k = power; lamps.push(L);
  }
  function stool(g, x, z, seat) { g.add(cyl(0.2, 0.05, seat, x, 0.76, z, 28), cyl(0.025, 0.74, M.steel, x, 0.38, z, 10), cyl(0.2, 0.012, M.steel, x, 0.006, z, 28)); const ring = new T.Mesh(new T.TorusGeometry(0.16, 0.01, 8, 32), M.steel); ring.rotation.x = Math.PI / 2; ring.position.set(x, 0.3, z); g.add(ring); }
  function bottle(g, x, y, z, hue) {
    const prof = [0, 0.032, 0.034, 0.034, 0.03, 0.014, 0.012, 0.014].map((r, i) => new T.Vector2(r, [0, 0.005, 0.02, 0.15, 0.18, 0.23, 0.27, 0.29][i]));
    const m = new T.MeshPhysicalMaterial({ color: new T.Color().setHSL(hue, 0.6, 0.35), roughness: 0.08, transmission: 0.5, thickness: 0.02, transparent: true, opacity: 0.85, clearcoat: 1 });
    const b = new T.Mesh(new T.LatheGeometry(prof, 20), m); b.position.set(x, y, z); g.add(b);
  }
  function pubScene() { // a sports bar: walnut bar top, back bar of lit bottles, pendants, stools; the Bar above the back bar
    roomTextures(); glows.length = 0; const housing = opts.finish === 'white' ? M.coatWhite : M.coatBlack;
    const g = roomShell(0x2b2a27, new T.MeshStandardMaterial({ map: tex.planks, roughness: 0.6, color: 0x6b5340 }));
    const brick = new T.Mesh(new T.PlaneGeometry(6, 2.7), new T.MeshStandardMaterial({ map: tex.brick, roughness: 0.95, color: 0xb08870 })); brick.position.set(0, 1.35, 0.005); brick.receiveShadow = true; g.add(brick);
    const walnut = new T.MeshPhysicalMaterial({ color: 0x4a2c18, map: tex.planks, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.15 });
    // back bar: cabinet, two lit shelves of bottles, mirror strip
    g.add(box(3.6, 0.9, 0.5, walnut, 0, 0.45, 0.25), box(3.6, 0.04, 0.55, walnut, 0, 0.92, 0.27));
    const mirror = new T.Mesh(new T.PlaneGeometry(3.4, 0.62), new T.MeshPhysicalMaterial({ color: 0x8a8f96, metalness: 1, roughness: 0.08 })); mirror.position.set(0, 1.28, 0.012); g.add(mirror);
    const shelfGlow = new T.MeshStandardMaterial({ color: 0x2a1a0e, emissive: 0xffb060, emissiveIntensity: 0.9 });
    [1.0, 1.36].forEach((y, row) => { g.add(box(3.4, 0.025, 0.2, M.alu, 0, y, 0.11), box(3.4, 0.008, 0.02, shelfGlow, 0, y + 0.016, 0.2));
      for(let i = 0; i < 26; i++) bottle(g, -1.6 + i * 0.128, y + 0.013, 0.1 + (i % 2) * 0.03, [0.08, 0.1, 0.33, 0.55, 0.02, 0.12][(i * 7 + row) % 6]); });
    const bbL = new T.PointLight(0xffa860, 2.2, 5, 1.6); bbL.position.set(0, 1.2, 0.5); g.add(bbL); // the back bar's shelf lights wash the brick
    [-1.6, 1.6].forEach(x => { const w = new T.PointLight(0xffb070, 1.2, 4, 1.8); w.position.set(x, 2.2, 0.4); g.add(w); }); // wall sconces
    // the bar counter in front, a brass foot rail, stools
    g.add(rbox(4.2, 1.05, 0.6, 0.02, walnut, 0, 0.525, 1.75), rbox(4.4, 0.06, 0.78, 0.02, walnut, 0, 1.08, 1.72));
    const brass = new T.MeshStandardMaterial({ color: 0xc8a050, metalness: 1, roughness: 0.25 }); const rail = cyl(0.025, 4.2, brass, 0, 0.22, 2.18, 16); rail.rotation.z = Math.PI / 2; g.add(rail);
    const leather = new T.MeshStandardMaterial({ color: 0x5a2a20, roughness: 0.6 }); [-1.5, -0.5, 0.5, 1.5].forEach(x => stool(g, x, 2.55, leather));
    // on the bar: glasses, a coaster stack, taps
    const glassM = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, transmission: 0.9, thickness: 0.01, transparent: true, opacity: 0.4 });
    const beerM = new T.MeshPhysicalMaterial({ color: 0xd88a1c, roughness: 0.1, transmission: 0.4, transparent: true, opacity: 0.9 });
    [[-1.4, 1.95], [0.7, 1.9]].forEach(([x, z]) => { g.add(cyl(0.04, 0.15, glassM, x, 1.185, z, 20), cyl(0.036, 0.11, beerM, x, 1.165, z, 20), cyl(0.037, 0.02, new T.MeshStandardMaterial({ color: 0xf6efe0, roughness: 0.9 }), x, 1.23, z, 20)); });
    for(let i = 0; i < 4; i++) { const tx = -0.9 + i * 0.12; g.add(cyl(0.012, 0.22, M.steel, tx, 1.22, 1.5, 10), box(0.03, 0.09, 0.03, new T.MeshStandardMaterial({ color: [0x1f3a6b, 0x8b1e1e, 0x1d1d1d, 0xc59a2a][i], roughness: 0.4 }), tx, 1.37, 1.5)); }
    [-1.4, 0, 1.4].forEach(x => pendant(g, x, 1.85, 1.75, 0x1b1c1e, 0xffb46a, 1.2));
    if(opts.room !== 2 && !alt('bar', g, housing)) wallBar(g, 0, 1.82, housing);
    if(opts.room !== 1 && !alt('pan', g, housing)) standPanel(g, opts.room === 2 ? 0 : 1.2, 1.11, 1.62, housing, -0.15);
    return { group: g, target: new T.Vector3(0.2, 1.35, 1.0), base: new T.Vector3(0.5, 1.55, 3.3), indoor: true, mood: 'pub' };
  }
  function cafeScene() { // a coffee counter: white subway tile, oak counter, espresso machine, pastry case; the Bar as a menu strip
    roomTextures(); glows.length = 0; const housing = opts.finish === 'white' ? M.coatWhite : M.coatBlack;
    const g = roomShell(0xe9e4da, new T.MeshStandardMaterial({ map: tex.planks, roughness: 0.55, color: 0xcdb79a }));
    if(!tex.tile) tex.tile = canvasTex(512, 512, (c, w, h) => { c.fillStyle = '#cfcac0'; c.fillRect(0, 0, w, h); for(let y = 0; y < h; y += 32) for(let x = -((y / 32) % 2) * 32; x < w; x += 64) { const gr = c.createLinearGradient(x, y, x, y + 30); gr.addColorStop(0, '#fbfaf6'); gr.addColorStop(1, '#ece8df'); c.fillStyle = gr; c.fillRect(x + 2, y + 2, 60, 28); } }, [6, 3]);
    const tile = new T.Mesh(new T.PlaneGeometry(6, 1.6), new T.MeshPhysicalMaterial({ map: tex.tile, roughness: 0.25, clearcoat: 0.6 })); tile.position.set(0, 0.8, 0.005); g.add(tile);
    const oak = new T.MeshStandardMaterial({ color: 0xc89a6a, map: tex.planks, roughness: 0.45 }), white = new T.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.5 });
    // back counter with the espresso machine and grinder; open shelves with cups
    g.add(box(4.6, 0.9, 0.6, white, 0, 0.45, 0.3), box(4.6, 0.04, 0.62, oak, 0, 0.92, 0.31));
    const espresso = new T.Group(); espresso.add(rbox(0.75, 0.42, 0.5, 0.03, new T.MeshPhysicalMaterial({ color: 0xb8352c, metalness: 0.3, roughness: 0.25, clearcoat: 1 }), 0, 0.21, 0), rbox(0.78, 0.04, 0.52, 0.01, M.steel, 0, 0.44, 0));
    [-0.2, 0.2].forEach(x => { espresso.add(cyl(0.035, 0.08, M.steel, x, 0.14, 0.26, 16)); const h = box(0.12, 0.02, 0.02, new T.MeshStandardMaterial({ color: 0x111111 }), x, 0.12, 0.33); espresso.add(h); });
    espresso.add(box(0.5, 0.02, 0.2, M.steel, 0, 0.01, 0.3)); espresso.position.set(-0.9, 0.94, 0.3); g.add(espresso);
    g.add(cyl(0.09, 0.3, new T.MeshStandardMaterial({ color: 0x1c1c1c, metalness: 0.4, roughness: 0.4 }), -0.25, 1.09, 0.3, 24), new T.Mesh(new T.ConeGeometry(0.1, 0.18, 24), new T.MeshPhysicalMaterial({ color: 0x5a3a1e, roughness: 0.1, transmission: 0.3, transparent: true, opacity: 0.8 })));
    g.children[g.children.length - 1].position.set(-0.25, 1.34, 0.3); g.children[g.children.length - 1].rotation.x = Math.PI;
    const cupM = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.35 });
    [1.55, 1.95].forEach(y => { g.add(box(1.6, 0.03, 0.24, oak, 1.2, y, 0.13)); for(let i = 0; i < 9; i++) g.add(cyl(0.04, 0.08, cupM, 0.5 + i * 0.17, y + 0.055, 0.13, 16)); });
    // front counter: oak top on a fluted white front, a glass pastry case, register, menu card
    g.add(box(4.0, 1.0, 0.6, white, 0, 0.5, 1.9)); for(let i = 0; i < 40; i++) g.add(box(0.03, 0.96, 0.02, white, -1.95 + i * 0.1, 0.5, 2.21));
    g.add(rbox(4.2, 0.05, 0.75, 0.01, oak, 0, 1.025, 1.9));
    const caseG = new T.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, transmission: 0.95, thickness: 0.01, transparent: true, opacity: 0.25 });
    g.add(box(1.1, 0.4, 0.5, caseG, 1.2, 1.25, 1.9), box(1.1, 0.02, 0.5, M.steel, 1.2, 1.24, 1.9));
    [[0xc98a3c, 0.9], [0xe8c79a, 1.1], [0x6b3a1e, 1.3], [0xd9a35c, 1.5]].forEach(([c, x]) => { const p = new T.Mesh(new T.SphereGeometry(0.06, 16, 10), new T.MeshStandardMaterial({ color: c, roughness: 0.7 })); p.scale.set(1.3, 0.55, 1); p.position.set(x, 1.08, 1.85); g.add(p); const q = p.clone(); q.position.set(x, 1.28, 1.95); g.add(q); });
    g.add(rbox(0.3, 0.12, 0.25, 0.02, new T.MeshStandardMaterial({ color: 0x202226, roughness: 0.4 }), -1.3, 1.11, 1.85));
    g.add(cyl(0.04, 0.1, cupM, -0.55, 1.1, 2.0, 16), cyl(0.06, 0.008, cupM, -0.55, 1.054, 2.0, 20));
    plant(g, 2.4, 0.4, 0.9);
    [-1.2, 0, 1.2].forEach(x => pendant(g, x, 1.95, 1.9, 0xe9e2d4, 0xffd7a0, 0.9));
    if(opts.room !== 2 && !alt('bar', g, housing)) wallBar(g, 0.1, 1.86, housing);
    if(opts.room !== 1 && !alt('pan', g, housing)) standPanel(g, opts.room === 2 ? 0 : 0.2, 1.05, 1.75, housing, 0);
    return { group: g, target: new T.Vector3(0.15, 1.35, 1.1), base: new T.Vector3(0.45, 1.6, 3.4), indoor: true, mood: 'cafe' };
  }

  function stringLights(g, a, b, sag, n) { // festoon bulbs on a sagging wire; a few real lights carry the glow
    const bulb = new T.MeshStandardMaterial({ color: 0xfff0d0, emissive: 0xffc070, emissiveIntensity: 0, roughness: 0.4 }), pts = [];
    for(let i = 0; i <= n; i++) { const t = i / n; pts.push(new T.Vector3().lerpVectors(a, b, t).add(new T.Vector3(0, -sag * 4 * t * (1 - t), 0))); }
    g.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0x111111 })));
    pts.forEach((p, i) => { if(i % 2) return; const m = new T.Mesh(new T.SphereGeometry(0.025, 10, 8), bulb); m.position.copy(p).add(new T.Vector3(0, -0.04, 0)); g.add(m); });
    [0.25, 0.75].forEach(t => { const L = new T.PointLight(0xffc27a, 0, 6, 2); L.position.copy(pts[Math.round(t * n)]).add(new T.Vector3(0, -0.06, 0)); L.userData.k = 0.06; L.userData.shade = bulb; g.add(L); lamps.push(L); });
  }
  function backyard() { // a deck under a cedar pergola: the Bar on the beam, the companion on the patio table, string lights
    roomTextures(); glows.length = 0; const g = new T.Group(), housing = opts.finish === 'white' ? M.coatWhite : M.coatBlack;
    const lawn = new T.Mesh(new T.PlaneGeometry(80, 80), M.grass); lawn.rotation.x = -Math.PI / 2; lawn.receiveShadow = true; g.add(lawn);
    const cedar = new T.MeshStandardMaterial({ color: 0x9a6a46, map: tex.planks, roughness: 0.75 }), weathered = new T.MeshStandardMaterial({ color: 0x8c7a66, map: tex.planks, roughness: 0.9 });
    // privacy fence behind: boards with posts and a cap rail
    for(let i = 0; i < 70; i++) g.add(box(0.14, 1.8, 0.02, weathered, -10 + i * 0.145, 0.9, -3.2));
    for(let i = 0; i < 6; i++) g.add(box(0.09, 1.9, 0.09, weathered, -10 + i * 2, 0.95, -3.15)); g.add(box(20.2, 0.05, 0.12, weathered, 0, 1.83, -3.18));
    // the deck and pergola
    g.add(box(5, 0.16, 4, cedar, 0, 0.08, 0)); for(let i = 0; i < 28; i++) g.add(box(5, 0.004, 0.006, new T.MeshStandardMaterial({ color: 0x3a2618 }), 0, 0.162, -2 + i * 0.145));
    const posts = [[-2.2, -1.8], [2.2, -1.8], [-2.2, 1.8], [2.2, 1.8]]; posts.forEach(([x, z]) => g.add(box(0.14, 2.6, 0.14, cedar, x, 1.46, z)));
    [-1.8, 1.8].forEach(z => g.add(box(4.8, 0.2, 0.08, cedar, 0, 2.66, z))); for(let i = 0; i < 9; i++) g.add(box(0.06, 0.14, 4.1, cedar, -2.2 + i * 0.55, 2.83, 0));
    // patio table with chairs, a grill, a planter
    const black = new T.MeshStandardMaterial({ color: 0x1c1d1f, metalness: 0.5, roughness: 0.5 });
    g.add(cyl(0.55, 0.03, new T.MeshPhysicalMaterial({ color: 0x2a2c2e, roughness: 0.3, clearcoat: 0.6 }), 0.4, 0.88, 0.2, 40), cyl(0.04, 0.72, black, 0.4, 0.52, 0.2, 12), cyl(0.3, 0.02, black, 0.4, 0.17, 0.2, 24));
    [[0.4, 0.95, 0], [0.4, -0.55, Math.PI], [1.15, 0.2, Math.PI / 2], [-0.35, 0.2, -Math.PI / 2]].forEach(([x, z, r]) => { const c = new T.Group(); c.add(rbox(0.46, 0.06, 0.46, 0.02, cedar, 0, 0.47, 0), rbox(0.46, 0.45, 0.04, 0.02, cedar, 0, 0.72, -0.22)); [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].forEach(([a, b]) => c.add(box(0.03, 0.45, 0.03, black, a, 0.24, b))); c.position.set(x, 0.16, z); c.rotation.y = r; g.add(c); });
    const grill = new T.Group(); grill.add(rbox(0.9, 0.45, 0.5, 0.05, black, 0, 1.0, 0), rbox(0.92, 0.12, 0.52, 0.05, M.steel, 0, 1.25, 0), box(1.3, 0.04, 0.5, M.steel, 0, 0.78, 0)); [[-0.55, -0.2], [0.55, -0.2], [-0.55, 0.2], [0.55, 0.2]].forEach(([a, b]) => grill.add(box(0.04, 0.62, 0.04, black, a, 0.47, b))); grill.position.set(-1.5, 0.16, -1.2); g.add(grill);
    plant(g, 1.9, -1.4, 1.1); [[-7, -5, 1.6], [6, -6, 1.8], [-12, 3, 1.4], [11, 2, 1.5]].forEach(([x, z, s]) => g.add(tree(x, z, s)));
    stringLights(g, new T.Vector3(-2.2, 2.55, -1.8), new T.Vector3(2.2, 2.55, -1.8), 0.25, 16); stringLights(g, new T.Vector3(-2.2, 2.55, 1.8), new T.Vector3(2.2, 2.55, 1.8), 0.25, 16);
    // the Bar on a weatherproof bracket under the back beam, the companion on the table facing the deck
    if(opts.room !== 2 && !alt('bar', g, housing)) { const y = 2.2, bar = cabinet(texBar, 0.300, 0.075, 0.035, housing, 0.330, 0.076); bar.position.set(0, y, -1.72); g.add(bar, box(0.06, 0.32, 0.03, housing, 0, y + 0.18, -1.75)); glowAt(g, 0, y, -1.4, 'bar'); }
    if(opts.room !== 1 && !alt('pan', g, housing)) standPanel(g, 0.4, 0.895, 0.05, housing, 0);
    return { group: g, target: new T.Vector3(0.2, 1.4, -0.6), base: new T.Vector3(0.6, 1.6, 3.4) };
  }
  function deskScene() { // a desk setup: a wide desk against the wall, a monitor, keyboard, a chair, a shelf with books and a plant; the Bar on the wall above the monitor, the Panel on the desk
    roomTextures(); glows.length = 0; const housing = opts.finish === 'white' ? M.coatWhite : M.coatBlack;
    const g = roomShell(0x3d4652, new T.MeshStandardMaterial({ color: 0x6b5644, map: tex.planks, roughness: 0.7 }));
    const oak = new T.MeshStandardMaterial({ color: 0xb08a64, map: tex.planks, roughness: 0.45 }), black = new T.MeshStandardMaterial({ color: 0x15161a, roughness: 0.5, metalness: 0.3 });
    // desk: 1.6 m top on two panel legs
    g.add(rbox(1.6, 0.035, 0.7, 0.01, oak, 0, 0.74, 0.4));
    [-0.76, 0.76].forEach(x => g.add(box(0.04, 0.72, 0.62, black, x, 0.36, 0.4)));
    // monitor on a stand, with a desktop on it
    const screen = canvasTex(512, 300, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1b2a44'); gr.addColorStop(1, '#3a2148'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(255,255,255,.88)'; c.fillRect(40, 40, 260, 170); c.fillStyle = '#2c6be0'; c.fillRect(40, 40, 260, 18); c.fillStyle = 'rgba(30,30,40,.5)'; for(let i = 0; i < 6; i++) c.fillRect(56, 76 + i * 20, 120 + (i * 37) % 100, 7);
      c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(330, 70, 140, 110); c.fillStyle = '#e0702c'; c.fillRect(342, 82, 116, 60); c.fillStyle = 'rgba(0,0,0,.55)'; c.fillRect(0, h - 22, w, 22); });
    g.add(rbox(0.66, 0.4, 0.03, 0.008, black, 0, 1.12, 0.18));
    const disp = new T.Mesh(new T.PlaneGeometry(0.62, 0.36), new T.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: screen, emissiveIntensity: 0.8, roughness: 0.3 })); disp.position.set(0, 1.12, 0.197); g.add(disp);
    g.add(box(0.05, 0.22, 0.03, black, 0, 0.87, 0.15), box(0.24, 0.012, 0.16, black, 0, 0.763, 0.17));
    // keyboard, mouse, mug, headphones on a hook
    g.add(rbox(0.44, 0.02, 0.14, 0.006, black, -0.02, 0.77, 0.5), rbox(0.06, 0.02, 0.1, 0.01, black, 0.32, 0.77, 0.5));
    g.add(cyl(0.04, 0.09, new T.MeshStandardMaterial({ color: 0xe8e2d6, roughness: 0.4 }), -0.52, 0.8, 0.55, 20));
    const phones = new T.Mesh(new T.TorusGeometry(0.08, 0.014, 8, 24, Math.PI), black); phones.position.set(-0.78, 0.66, 0.6); phones.rotation.y = Math.PI / 2; g.add(phones);
    // chair
    const chair = new T.Group(), fab = new T.MeshStandardMaterial({ color: 0x23262c, roughness: 0.9 });
    chair.add(rbox(0.5, 0.08, 0.5, 0.03, fab, 0, 0.48, 0), rbox(0.48, 0.62, 0.07, 0.03, fab, 0, 0.86, 0.24), cyl(0.025, 0.4, M.steel, 0, 0.25, 0, 12), cyl(0.3, 0.02, black, 0, 0.05, 0, 5));
    chair.position.set(-0.55, 0, 1.25); chair.rotation.y = -0.5; g.add(chair);
    // wall shelf with books and a plant, a desk lamp
    g.add(rbox(0.7, 0.025, 0.18, 0.005, oak, -0.95, 1.62, 0.1));
    [0x8a3a2a, 0x2a4a8a, 0xd9b44a, 0x3a7a4a, 0x6a4a8a].forEach((col, i) => g.add(box(0.035, 0.2 - (i % 3) * 0.02, 0.15, new T.MeshStandardMaterial({ color: col, roughness: 0.7 }), -1.22 + i * 0.045, 1.73 - (i % 3) * 0.01, 0.1)));
    const pot = cyl(0.06, 0.1, new T.MeshStandardMaterial({ color: 0xd8d2c6, roughness: 0.6 }), -0.75, 1.68, 0.1, 16); g.add(pot);
    for(let i = 0; i < 7; i++) { const leaf = new T.Mesh(new T.SphereGeometry(0.05, 10, 8), M.canopy); leaf.scale.set(0.7, 1.4, 0.7); leaf.position.set(-0.75 + Math.cos(i) * 0.05, 1.79 + (i % 3) * 0.03, 0.1 + Math.sin(i) * 0.05); g.add(leaf); }
    const lamp = new T.Group(); lamp.add(cyl(0.07, 0.015, black, 0, 0.765, 0, 20), cyl(0.008, 0.38, black, 0, 0.95, 0, 8)); const shade = new T.Mesh(new T.ConeGeometry(0.08, 0.1, 20, 1, true), black); shade.position.set(0.06, 1.13, 0); shade.rotation.z = 0.9; lamp.add(shade);
    const lampL = new T.PointLight(0xffd9a0, 0.9, 2.5, 2); lampL.position.set(0.1, 1.08, 0.02); lamp.add(lampL); lamp.position.set(0.66, 0, 0.3); g.add(lamp);
    const monL = new T.PointLight(0x6a7aff, 0.6, 2.2, 2); monL.position.set(0, 1.12, 0.5); g.add(monL);
    floorLamp(g, -2.55, 4.4);
    // the Bar on the wall above the monitor, the Panel on the desk beside it
    if(opts.room !== 2 && !alt('bar', g, housing)) placeAt(g, 'bar', { t: 'wall', x: 0, y: 1.5, z: 0 }, housing);
    if(opts.room !== 1 && !alt('pan', g, housing)) standPanel(g, opts.room === 2 ? 0 : -0.5, 0.758, 0.32, housing, 0.2);
    return { group: g, target: new T.Vector3(-0.1, 1.12, 0.3), base: new T.Vector3(0.55, 1.42, 2.05), indoor: true, mood: 'desk' };
  }
  function manCave() { // a basement den: dark slate walls, a sectional, a big TV, neon sign, a mini fridge and a dartboard
    roomTextures(); glows.length = 0; const housing = opts.finish === 'white' ? M.coatWhite : M.coatBlack;
    const g = roomShell(0x2f3439, new T.MeshStandardMaterial({ color: 0x3a3c40, map: tex.rug, roughness: 0.95 }));
    const leather = new T.MeshStandardMaterial({ color: 0x3b2418, roughness: 0.55 }), walnut = new T.MeshStandardMaterial({ color: 0x4a2c18, map: tex.planks, roughness: 0.4 });
    // media wall: wood slat panel, a 75" TV, a low console
    for(let i = 0; i < 26; i++) g.add(box(0.05, 2.2, 0.03, walnut, -1.3 + i * 0.1, 1.2, 0.03));
    g.add(rbox(1.7, 0.97, 0.05, 0.01, new T.MeshStandardMaterial({ color: 0x0a0a0b, roughness: 0.2, metalness: 0.4 }), 0, 1.25, 0.09));
    const field = canvasTex(512, 288, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0d2a4a'); gr.addColorStop(0.35, '#163a5a'); gr.addColorStop(0.36, '#2f7a32'); gr.addColorStop(1, '#3f9a3e'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 2; for(let i = 0; i <= 10; i++) { const x0 = w * 0.12 + i * w * 0.076, x1 = -w * 0.15 + i * w * 0.13; c.beginPath(); c.moveTo(x0, h * 0.36); c.lineTo(x1, h); c.stroke(); }
      for(let i = 0; i < 22; i++) { c.fillStyle = i < 11 ? '#c8202a' : '#f2f2f2'; c.beginPath(); c.arc(w * (0.25 + (i % 11) * 0.05), h * (i < 11 ? 0.6 : 0.66) + (i % 3) * 4, 5, 0, 7); c.fill(); }
      c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(w * 0.3, h * 0.88, w * 0.4, h * 0.08); c.fillStyle = '#fff'; c.font = 'bold 18px sans-serif'; c.fillText('BUF 14   MIA 10   Q2 8:42', w * 0.32, h * 0.94); });
    const tv = new T.Mesh(new T.PlaneGeometry(1.64, 0.92), new T.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: field, emissiveIntensity: 0.9, roughness: 0.6 })); tv.position.set(0, 1.25, 0.116); g.add(tv);
    g.add(rbox(2.2, 0.45, 0.45, 0.02, walnut, 0, 0.23, 0.26));
    // neon sign on the side wall and a dartboard
    const neon = new T.MeshStandardMaterial({ color: 0xff3ba0, emissive: 0xff2a90, emissiveIntensity: 3 });
    const tor = new T.Mesh(new T.TorusGeometry(0.22, 0.012, 8, 48, Math.PI * 1.6), neon); tor.position.set(-2.93, 1.75, 2.0); tor.rotation.y = Math.PI / 2; g.add(tor);
    const tor2 = new T.Mesh(new T.TorusGeometry(0.12, 0.012, 8, 48), new T.MeshStandardMaterial({ color: 0x3bd0ff, emissive: 0x2ac8ff, emissiveIntensity: 3 })); tor2.position.set(-2.93, 1.75, 2.0); tor2.rotation.y = Math.PI / 2; g.add(tor2);
    const tvL = new T.PointLight(0x5a8ae0, 1.6, 5, 1.6); tvL.position.set(0, 1.2, 0.8); g.add(tvL); // the game on the TV lights the room
    const nL = new T.PointLight(0xff4aa8, 1.2, 3, 2); nL.position.set(-2.7, 1.75, 2.0); g.add(nL);
    const dart = cyl(0.23, 0.04, new T.MeshStandardMaterial({ map: canvasTex(256, 256, (c, w, h) => { for(let i = 0; i < 20; i++) { c.fillStyle = i % 2 ? '#1a1a1a' : '#e9dcc0'; c.beginPath(); c.moveTo(w / 2, h / 2); c.arc(w / 2, h / 2, w / 2, i / 20 * 6.283, (i + 1) / 20 * 6.283); c.fill(); } c.strokeStyle = '#b02a2a'; c.lineWidth = 10; c.beginPath(); c.arc(w / 2, h / 2, w * 0.3, 0, 7); c.stroke(); c.beginPath(); c.arc(w / 2, h / 2, w * 0.46, 0, 7); c.stroke(); c.fillStyle = '#1c7a3a'; c.beginPath(); c.arc(w / 2, h / 2, 12, 0, 7); c.fill(); }), roughness: 0.9 }), 2.93, 1.65, 3.6, 40); dart.rotation.z = Math.PI / 2; g.add(dart);
    // sectional sofa facing the TV, a mini fridge with a glass door, a bar cart
    const sect = new T.Group(); sect.add(rbox(2.6, 0.42, 0.95, 0.06, leather, 0, 0.26, 0), rbox(2.6, 0.48, 0.24, 0.08, leather, 0, 0.66, 0.36), rbox(0.95, 0.42, 1.7, 0.06, leather, 1.18, 0.26, -0.38), rbox(0.24, 0.48, 1.7, 0.08, leather, 1.54, 0.66, -0.38));
    [-0.85, 0, 0.6].forEach(x => sect.add(rbox(0.8, 0.13, 0.72, 0.06, leather, x, 0.53, -0.05))); sect.position.set(-0.1, 0, 3.3); g.add(sect);
    g.add(rbox(1.0, 0.04, 0.6, 0.02, walnut, -0.2, 0.42, 2.2)); [[-0.65, 1.95], [0.25, 1.95], [-0.65, 2.45], [0.25, 2.45]].forEach(([x, z]) => g.add(box(0.04, 0.4, 0.04, M.steel, x, 0.2, z)));
    const fridge = new T.Group(); fridge.add(rbox(0.5, 0.85, 0.5, 0.02, new T.MeshStandardMaterial({ color: 0x15161a, metalness: 0.5, roughness: 0.4 }), 0, 0.43, 0));
    const door = new T.Mesh(new T.PlaneGeometry(0.42, 0.72), new T.MeshStandardMaterial({ color: 0x0a0d12, emissive: 0x7ab8ff, emissiveIntensity: 0.35, roughness: 0.1 })); door.position.set(0, 0.45, 0.252); fridge.add(door);
    for(let r = 0; r < 3; r++) for(let i = 0; i < 4; i++) fridge.add(cyl(0.03, 0.12, new T.MeshStandardMaterial({ color: [0xb02a2a, 0xd9b44a, 0x2a5ab0][r], roughness: 0.3, metalness: 0.6 }), -0.15 + i * 0.1, 0.2 + r * 0.22, 0.12, 12));
    fridge.position.set(2.5, 0, 0.35); g.add(fridge);
    pendant(g, -0.2, 2.25, 2.2, 0x1b1c1e, 0xffb46a, 0.7); floorLamp(g, -2.55, 4.6);
    // the Bar on the slat wall above the TV, the companion on the media console
    if(opts.room !== 2 && !alt('bar', g, housing)) placeAt(g, 'bar', { t: 'wall', x: 0, y: 1.92, z: 0.05 }, housing) /* in front of the slats, not inside them */;
    if(opts.room !== 1 && !alt('pan', g, housing)) standPanel(g, opts.room === 2 ? 0 : 0.75, 0.455, 0.2, housing, -0.1);
    return { group: g, target: new T.Vector3(0.1, 1.25, 0.5), base: new T.Vector3(0.6, 1.4, 3.0), indoor: true, mood: 'cave' };
  }
  function applyIndoorLight() {
    const h = opts.hour, d = sunDir(h), up = Math.max(0, d.y), over = opts.wx >= 3 ? (opts.wx >= 61 ? 0.85 : 0.6) : 0, night = d.y < -0.02;
    const u = sky.material.uniforms, dir = new T.Vector3(-0.8 - Math.abs(d.x) * 0.4, Math.max(0.05, d.y), d.z * 0.5).normalize(); u.sunPosition.value.copy(night ? d : dir); u.turbidity.value = 2 + over * 14; u.rayleigh.value = night ? 0.2 : 1.6 - over; u.mieCoefficient.value = 0.005 + over * 0.02;
    sun.position.copy(rig.target).addScaledVector(dir, 14); sun.intensity = night ? (over < 0.5 ? 0.35 : 0.1) : Math.min(1, up * 3) * 4.5 * (1 - over * 0.8); if(night) sun.color.setHSL(0.62, 0.5, 0.7); else sun.color.setHSL(0.09, 0.85, 0.5 + Math.min(0.45, up * 1.6)); // after dark: moonlight through the window
    Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 40 }); sun.shadow.camera.updateProjectionMatrix();
    const on = !opts.dark && opts.roomLight > 4, lvl = on ? opts.roomLight / 100 : 0;
    lamps.forEach(L => { const k = L.userData.k || 1, spot = L.isSpotLight ? 6 : 1; L.intensity = lvl * (night ? 9 : 4) * k * spot; L.userData.shade.emissiveIntensity = lvl * (night ? 2.2 : 1.2) * k; });
    hemi.intensity = (night ? 0.02 : 0.12 + up * 0.5) + lvl * 0.25; hemi.color.setHSL(0.1, 0.25, 0.75); hemi.groundColor.setHSL(0.08, 0.3, 0.35);
    stars.visible = night && over < 0.5; rain.visible = false; snow.visible = false; scene.fog = null; scene.environment = null;
    R.toneMappingExposure = night ? (on ? 1.15 : 1.9) : 0.85 + over * 0.3;
    M.glass.clearcoat = 0; M.glass.roughness = 0.7; M.glass.opacity = 0.08;
  }

  // ---------------------------------------------------------------- sky, sun, weather
  function sunDir(h) { const t = (h - 6.2) / 13; const elev = Math.sin(t * Math.PI) * 52; const az = -100 + t * 200; const phi = T.MathUtils.degToRad(90 - elev), th = T.MathUtils.degToRad(az); return new T.Vector3().setFromSphericalCoords(1, phi, th); }
  function applyLight() {
    if(rig && rig.indoor) return applyIndoorLight();
    M.glass.clearcoat = 0.15; M.glass.roughness = 0.55; M.glass.opacity = 0.12; // outdoors: an anti-glare (matte) window
    const h = opts.hour, d = sunDir(h), up = Math.max(0, d.y), over = opts.wx >= 3 ? (opts.wx >= 61 ? 0.85 : 0.6) : 0, night = d.y < -0.02;
    const u = sky.material.uniforms; u.sunPosition.value.copy(d); u.turbidity.value = 2 + over * 14; u.rayleigh.value = night ? 0.2 : 1.6 - over; u.mieCoefficient.value = 0.005 + over * 0.02; u.mieDirectionalG.value = 0.8;
    sun.position.copy(d).multiplyScalar(60); sun.intensity = night ? 0 : Math.min(1, up * 3) * 3.2 * (1 - over * 0.85); sun.color.setHSL(0.09, 0.9, 0.5 + Math.min(0.5, up * 1.6));
    hemi.intensity = night ? 0.08 : 0.25 + up * 0.9; hemi.color.setHSL(0.6, 0.5, night ? 0.25 : 0.7); hemi.groundColor.setHSL(0.1, 0.3, night ? 0.05 : 0.3);
    const dusk = d.y < 0.12; lamps.forEach(L => { const k = L.userData.k == null ? 1 : L.userData.k; L.intensity = dusk ? 60 * k : 0; if(L.userData.shade) L.userData.shade.emissiveIntensity = dusk ? 3 : 0; }); M.lampLens.emissiveIntensity = dusk ? 4 : 0;
    stars.visible = night && over < 0.5;
    R.toneMappingExposure = night ? 1.35 : 0.55 + (1 - Math.min(1, up * 2.5)) * 0.5 + over * 0.25;
    scene.fog = opts.wx === 45 ? new T.FogExp2(night ? 0x0b0d10 : 0xbfc5cb, 0.06) : opts.wx >= 51 ? new T.FogExp2(night ? 0x090b0e : 0x9aa1a8, 0.018) : new T.FogExp2(night ? 0x05070c : 0xc9d6e2, 0.0045);
    const wet = opts.wx >= 51 && opts.wx < 71; M.asphalt.roughness = wet ? 0.25 : 0.85; M.concrete.roughness = wet ? 0.35 : 0.92;
    rain.visible = opts.wx >= 51 && opts.wx < 71 || opts.wx >= 95; snow.visible = opts.wx >= 71 && opts.wx < 80;
    // facades: windows lit after dark
    const lit = dusk; if(M.facadeA.userData.lit !== lit) { M.facadeA.userData.lit = lit; M.facadeA.emissiveMap = M.facadeA.map = tex.facade(lit); M.facadeB.emissiveMap = M.facadeB.map = tex.facade(lit); [M.facadeA, M.facadeB].forEach(m => { m.emissive.set(lit ? 0xffffff : 0x000000); m.emissiveIntensity = lit ? 0.9 : 0; m.needsUpdate = true; }); }
    const k = [Math.round(h * 4), opts.wx].join('|'); if(k !== envKey) { envKey = k; const s = new T.Scene(); const sk = new SkyCls(); sk.scale.setScalar(1000); Object.assign(sk.material.uniforms.sunPosition.value, d); for(const key of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG']) sk.material.uniforms[key].value = u[key].value; s.add(sk); if(envRT) envRT.dispose(); envRT = pmrem.fromScene(s, 0.04); scene.environment = envRT.texture; scene.environmentIntensity = night ? 0.15 : 0.6 + up * 0.6; }
  }
  function particles(n, mat, line) {
    const geo = new T.BufferGeometry(), pos = new Float32Array(n * (line ? 6 : 3));
    for(let i = 0; i < n; i++) { const x = (rnd() - 0.5) * 30, y = rnd() * 14, z = (rnd() - 0.5) * 24 + 2; if(line) pos.set([x, y, z, x - 0.03, y - 0.35, z], i * 6); else pos.set([x, y, z], i * 3); }
    geo.setAttribute('position', new T.BufferAttribute(pos, 3)); const o = line ? new T.LineSegments(geo, mat) : new T.Points(geo, mat); o.frustumCulled = false; o.visible = false; return o;
  }
  function stepParticles(o, dy, wrapTop, drift = 0) { if(!o.visible) return; const p = o.geometry.attributes.position.array; for(let i = 1; i < p.length; i += 3) { p[i] -= dy; p[i - 1] += drift * Math.sin(p[i] * 0.7 + i); if(p[i] < 0) p[i] += wrapTop; } o.geometry.attributes.position.needsUpdate = true; }

  // ---------------------------------------------------------------- lifecycle
  function build() {
    R = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    R.setPixelRatio(Math.min(2, devicePixelRatio || 1)); R.toneMapping = T.ACESFilmicToneMapping; R.outputColorSpace = T.SRGBColorSpace; R.shadowMap.enabled = true; R.shadowMap.type = T.PCFSoftShadowMap;
    pmrem = new T.PMREMGenerator(R); makeTextures(); makeMaterials();
    M.brick2 = new T.MeshStandardMaterial({ map: tex.brick, roughness: 0.9 });
    M.shopGlass = new T.MeshPhysicalMaterial({ color: 0x1a2430, metalness: 0.1, roughness: 0.08, clearcoat: 1, emissive: 0x000000 });
    M.awningA = new T.MeshStandardMaterial({ color: 0x24443a, roughness: 0.8 }); M.awningB = new T.MeshStandardMaterial({ color: 0x6a2a24, roughness: 0.8 });
    M.facadeA = new T.MeshStandardMaterial({ map: tex.facade(false), roughness: 0.8 }); M.facadeB = new T.MeshStandardMaterial({ map: tex.facade(false), roughness: 0.8, color: 0xd8d0c4 });
    texBar = new T.CanvasTexture($('barCv')); texPan = new T.CanvasTexture($('panCv')); [texBar, texPan].forEach(t => { t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; });
    cam = new T.PerspectiveCamera(38, 2, 0.1, 400);
    canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw, pitch }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', e => { if(!drag) return; yaw = Math.max(-0.75, Math.min(0.75, drag.yaw - (e.clientX - drag.x) * 0.004)); pitch = Math.max(-0.08, Math.min(0.35, drag.pitch + (e.clientY - drag.y) * 0.003)); });
    canvas.addEventListener('pointerup', () => drag = null); canvas.addEventListener('pointercancel', () => drag = null);
  }
  function setPlace(p) {
    if(scene) scene.traverse(o => { if(o.geometry) o.geometry.dispose(); if(o.isLight && o.shadow && o.shadow.map) o.shadow.map.dispose(); }); // free the last site before building the next
    place = p; lamps = []; glows.length = 0; scene = new T.Scene();
    sky = new SkyCls(); sky.scale.setScalar(450000); scene.add(sky);
    sun = new T.DirectionalLight(0xffffff, 3); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 140 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; scene.add(sun, sun.target);
    hemi = new T.HemisphereLight(0xbfd8ff, 0x3a3226, 0.6); scene.add(hemi);
    const sg = new T.BufferGeometry(), sp = new Float32Array(900); for(let i = 0; i < 300; i++) { const v = new T.Vector3().setFromSphericalCoords(300, Math.acos(rnd() * 0.9), rnd() * Math.PI * 2); sp.set([v.x, Math.abs(v.y), v.z], i * 3); } sg.setAttribute('position', new T.BufferAttribute(sp, 3));
    stars = new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false })); scene.add(stars);
    rain = particles(2600, new T.LineBasicMaterial({ color: 0xaab7c6, transparent: true, opacity: 0.45 }), true); snow = particles(2200, new T.PointsMaterial({ color: 0xffffff, size: 0.05, transparent: true, opacity: 0.9 }), false); scene.add(rain, snow);
    rig = p === 'park' ? parkKiosk() : p === 'finish' ? finishLine() : p === 'living' ? livingRoom() : p === 'bedroom' ? bedroom() : p === 'pub' ? pubScene() : p === 'cafe' ? cafeScene() : p === 'yard' ? backyard() : p === 'cave' ? manCave() : p === 'desk' ? deskScene() : busStop(); scene.add(rig.group); envKey = ''; M.facadeA.userData.lit = undefined; applyLight(); if(D) { D.g = null; demoBuild(); }
    if(opts.barSpot || opts.panSpot) { const pts = []; rig.group.updateMatrixWorld(true); rig.group.traverse(o => { if(o.userData.led) pts.push(o.getWorldPosition(new T.Vector3())); }); if(pts.length) { const c = pts.reduce((a, b) => a.clone().add(b), new T.Vector3()).multiplyScalar(1 / pts.length), off = rig.base.clone().sub(rig.target);
      let spread = 0; pts.forEach(a => pts.forEach(b => spread = Math.max(spread, a.distanceTo(b)))); // screens far apart: step back so both are in view
      off.multiplyScalar(Math.min(2.2, Math.max(1, spread / 1.1))); rig.target.copy(c); rig.base.copy(c).add(off); rig.base.y = place === 'busstop' ? 1.62 : Math.max(rig.base.y, c.y + 0.35, 1.45); } } // at a stop the view is a rider's eye level
  }

  // ---------------------------------------------------------------- sensor demos: see what each sense does, live
  let D = null;
  function ledFaces() { const out = []; rig.group.traverse(o => { if(o.userData.led) out.push(o); }); return out; }
  function demoBuild() {
    const k = D.kind, leds = ledFaces(); if(!leds.length) return;
    const lead = leds[0]; rig.group.updateMatrixWorld(true);
    const at = lead.getWorldPosition(new T.Vector3()), dir = lead.getWorldDirection(new T.Vector3()); dir.y = 0; dir.normalize();
    const side = new T.Vector3(-dir.z, 0, dir.x), g = new T.Group(); scene.add(g);
    D.g = g; D.at = at; D.dir = dir; D.side = side; D.faces = leds.map(l => l.children[0]);
    const range = rig.indoor ? 3.2 : 5, add = (m) => { g.add(m); return m; };
    const fresnel = (col, op) => new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending });
    if(k === 'presence') {
      const r = range * Math.tan(T.MathUtils.degToRad(48)), geo = new T.ConeGeometry(r, range, 64, 1, true); geo.translate(0, -range / 2, 0);
      const cone = add(new T.Mesh(geo, fresnel(0x2ad0ff, 0.09))); cone.position.copy(at); cone.quaternion.setFromUnitVectors(new T.Vector3(0, -1, 0), dir.clone().setY(-0.25).normalize());
      const edges = add(new T.LineSegments(new T.EdgesGeometry(new T.ConeGeometry(r, range, 16, 1, true).translate(0, -range / 2, 0)), new T.LineBasicMaterial({ color: 0x2ad0ff, transparent: true, opacity: 0.35 }))); edges.position.copy(at); edges.quaternion.copy(cone.quaternion);
      D.cone = cone; D.edges = edges; D.range = range;
      D.waves = [0, 1, 2].map(() => { const m = add(new T.Mesh(new T.RingGeometry(0.96, 1, 64, 1, -0.84, 1.68), fresnel(0x6ae4ff, 0.5))); m.rotation.x = -Math.PI / 2; return m; });
      const p0 = at.clone().addScaledVector(dir, range * 1.6).addScaledVector(side, 1.6), p1 = at.clone().addScaledVector(dir, 1.1).addScaledVector(side, 0.15);
      [p0, p1].forEach(v => { v.y = rig.indoor ? 0 : (place === 'busstop' ? 0.15 : 0); if(rig.indoor) { v.x = Math.max(-2.5, Math.min(2.5, v.x)); v.z = Math.max(0.6, Math.min(5.1, v.z)); } });
      D.p0 = p0; D.p1 = p1; D.who = add(person(p0.x, p0.z, 0, 0x3a4a5e)); D.who.position.y = p0.y;
      D.dot = add(new T.Mesh(new T.SphereGeometry(0.014, 12, 8), new T.MeshBasicMaterial({ color: 0x2ad0ff }))); D.dot.position.copy(at).add(new T.Vector3(0, -0.06, 0.03));
    }
    if(k === 'sound') {
      const src = at.clone().addScaledVector(dir, rig.indoor ? 1.6 : 2.6).addScaledVector(side, -0.7); src.y = rig.indoor ? 0.75 : 1.0; D.src = src;
      const spk = new T.Group(); spk.add(new T.Mesh(new T.CylinderGeometry(0.09, 0.1, 0.28, 32), new T.MeshStandardMaterial({ color: 0x1a1b1e, roughness: 0.5 })));
      const grill = new T.Mesh(new T.CylinderGeometry(0.092, 0.092, 0.2, 32, 1, true), new T.MeshStandardMaterial({ color: 0x2a2c30, emissive: 0x4ae0ff, emissiveIntensity: 0.2, roughness: 0.9 })); spk.add(grill); D.grill = grill.material;
      spk.position.copy(src); spk.position.y -= 0.14; if(rig.indoor && src.y < 0.6) spk.position.y = 0.14; add(spk);
      if(rig.indoor) { const stand = add(new T.Mesh(new T.CylinderGeometry(0.16, 0.16, src.y - 0.28, 24), new T.MeshStandardMaterial({ color: 0x5b3a24, roughness: 0.6 }))); stand.position.set(src.x, (src.y - 0.28) / 2, src.z); }
      D.rings = Array.from({ length: 7 }, () => { const m = add(new T.Mesh(new T.SphereGeometry(1, 18, 9), new T.MeshBasicMaterial({ color: 0x7a5cff, transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending, wireframe: true }))); m.visible = false; return m; });
      D.next = 0; D.ri = 0;
      D.mic = add(new T.Mesh(new T.SphereGeometry(0.012, 12, 8), new T.MeshBasicMaterial({ color: 0xff4ae0 }))); D.mic.position.copy(at).add(new T.Vector3(0.12, -0.06, 0.03));
    }
    if(k === 'light') {
      const eye = add(new T.Mesh(new T.SphereGeometry(0.012, 12, 8), new T.MeshBasicMaterial({ color: 0xffd34a }))); eye.position.copy(at).add(new T.Vector3(-0.12, -0.06, 0.03)); D.eye = eye;
      D.rays = Array.from({ length: 18 }, (_, i) => { const a = i / 18 * Math.PI * 2, from = at.clone().addScaledVector(dir, 2.2).add(new T.Vector3(Math.cos(a) * 1.4, 0.9 + Math.sin(a) * 0.7, 0)).addScaledVector(side, Math.cos(a) * 0.6);
        const geo = new T.BufferGeometry().setFromPoints([from, eye.position.clone()]); const l = add(new T.Line(geo, new T.LineBasicMaterial({ color: 0xffd34a, transparent: true, opacity: 0.4, blending: T.AdditiveBlending }))); return l; });
      D.exp0 = R.toneMappingExposure;
    }
    if(k === 'climate') {
      const n = 360, pos = new Float32Array(n * 3), seed = []; for(let i = 0; i < n; i++) { seed.push([Math.random() * 6.283, Math.random(), Math.random() * 2 + 0.6]); }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); D.seed = seed;
      D.air = add(new T.Points(geo, new T.PointsMaterial({ color: 0x6aff9a, size: 0.035, transparent: true, opacity: 0.85, depthWrite: false, blending: T.AdditiveBlending })));
      D.air.frustumCulled = false;
      D.nose = add(new T.Mesh(new T.SphereGeometry(0.012, 12, 8), new T.MeshBasicMaterial({ color: 0x6aff9a }))); D.nose.position.copy(at).add(new T.Vector3(0, -0.06, 0.03));
    }
  }
  function demoStep() {
    if(!D || !D.g) return; const t = (performance.now() - D.t0) / 1000, L = D.loop, ph = t % L, info = { kind: D.kind, t: ph };
    let bright = 1;
    if(D.kind === 'presence') {
      const walk = (a, b, u) => a.clone().lerp(b, Math.max(0, Math.min(1, u)));
      let p, facing; if(ph < 5) { p = walk(D.p0, D.p1, ph / 5); facing = D.p1.clone().sub(D.p0); } else if(ph < 8) { p = D.p1.clone(); facing = D.at.clone().sub(D.p1); } else if(ph < 13) { p = walk(D.p1, D.p0, (ph - 8) / 5); facing = D.p0.clone().sub(D.p1); } else { p = D.p0.clone(); facing = D.p1.clone().sub(D.p0); }
      D.who.position.set(p.x, p.y, p.z); D.who.rotation.y = Math.atan2(facing.x, facing.z); D.who.visible = ph < 13.4;
      const bob = (ph < 5 || (ph > 8 && ph < 13)) ? Math.abs(Math.sin(ph * 7)) * 0.03 : 0; D.who.position.y += bob;
      const rel = new T.Vector3(p.x - D.at.x, 0, p.z - D.at.z), dist = rel.length(), ang = rel.angleTo(D.dir), seen = D.who.visible && dist < D.range && ang < T.MathUtils.degToRad(50);
      if(seen) D.lastSeen = t; const here = D.lastSeen != null && t - D.lastSeen < 1.5;
      D.awake = D.awake == null ? 0 : D.awake + ((here ? 1 : 0) - D.awake) * 0.06; bright = 0.06 + 0.94 * D.awake;
      const col = new T.Color(here ? 0x3aff8a : 0x2ad0ff); D.cone.material.color.copy(col); D.edges.material.color.copy(col); D.dot.material.color.copy(col);
      D.cone.material.opacity = 0.07 + (here ? 0.08 : 0.03) * (0.6 + 0.4 * Math.sin(t * 6));
      D.waves.forEach((w, i) => { const u = ((t * 0.7 + i / 3) % 1); w.position.copy(D.at).setY(0.02 + (rig.indoor ? 0 : place === 'busstop' ? 0.15 : 0)); const rr = u * D.range; w.scale.set(rr, rr, rr); w.rotation.z = Math.atan2(D.dir.x, D.dir.z) - Math.PI / 2; w.material.opacity = 0.5 * (1 - u); w.material.color.copy(col); });
      Object.assign(info, { seen, here, dist: dist.toFixed(1), awake: D.awake });
    }
    if(D.kind === 'sound') {
      const beat = 60 / 128; if(t >= D.next) { const m = D.rings[D.ri++ % D.rings.length]; m.userData.t0 = t; m.visible = true; D.next = t + beat * (Math.random() < 0.2 ? 0.5 : 1); }
      const dmax = D.src.distanceTo(D.at) + 0.6; let hit = 0;
      D.rings.forEach(m => { if(!m.visible) return; const u = (t - m.userData.t0) / 1.6; if(u > 1) { m.visible = false; return; } const r = 0.15 + u * dmax; m.scale.setScalar(r); m.position.copy(D.src); m.material.opacity = 0.4 * (1 - u) ** 1.6; m.rotation.y = t * 0.3;
        if(Math.abs(r - D.src.distanceTo(D.at)) < 0.25) hit = Math.max(hit, 1 - u); });
      D.level = Math.max(hit, (D.level || 0) * 0.9); D.grill.emissiveIntensity = 0.2 + 2.5 * Math.max(0, 1 - ((t - (D.next - beat)) / beat));
      D.mic.scale.setScalar(1 + D.level * 3); bright = 0.75 + 0.35 * D.level; info.level = D.level;
    }
    if(D.kind === 'light') {
      const f = 0.5 + 0.5 * Math.cos(ph / L * Math.PI * 2); D.f = f; // the room: bright, dims to dark, comes back
      R.toneMappingExposure = D.exp0 * (0.12 + 0.88 * f);
      const scr = 0.25 + 0.75 * f; bright = scr / (0.12 + 0.88 * f); bright = Math.min(bright, 4);
      D.rays.forEach((l, i) => { l.material.opacity = (0.08 + 0.5 * f) * (0.6 + 0.4 * Math.sin(t * 5 + i)); }); D.eye.scale.setScalar(0.8 + f * 0.8);
      Object.assign(info, { room: f, screen: scr });
    }
    if(D.kind === 'climate') {
      const aq = Math.max(0, Math.sin(ph / L * Math.PI)); D.aq = aq; const pos = D.air.geometry.attributes.position.array;
      D.seed.forEach(([a, h, r], i) => { const u = ((t * 0.12 + h) % 1), rr = r * (1 - u), y = (h - 0.5) * 1.2 * (1 - u);
        const v = D.at.clone().addScaledVector(D.dir, Math.cos(a + t * 0.3) * rr + 0.3).addScaledVector(D.side, Math.sin(a + t * 0.3) * rr); pos.set([v.x, D.at.y - 0.06 + y, v.z], i * 3); });
      D.air.geometry.attributes.position.needsUpdate = true; const c = new T.Color().setHSL(0.36 - 0.36 * aq, 0.95, 0.55); D.air.material.color.copy(c); D.nose.material.color.copy(c);
      info.aq = aq;
    }
    D.faces.forEach(f => { f.material.emissiveIntensity = 2.2 * bright; });
    if(D.tick) D.tick(info);
  }
  function demoClear() { if(!D) return; if(D.g) { D.g.traverse(o => { if(o.geometry) o.geometry.dispose(); }); scene.remove(D.g); } if(D.faces) D.faces.forEach(f => f.material.emissiveIntensity = 2.2); if(D.kind === 'light' && D.exp0) R.toneMappingExposure = D.exp0; }
  function frame() {
    raf = requestAnimationFrame(frame);
    const w = canvas.clientWidth, h = canvas.clientHeight; if(!w || !h) return;
    if(canvas.width !== Math.floor(w * R.getPixelRatio()) || canvas.height !== Math.floor(h * R.getPixelRatio())) { R.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); }
    texBar.needsUpdate = true; texPan.needsUpdate = true;
    const k = Math.pow(1 / opts.dist, 1.6), base = rig.base.clone().sub(rig.target).multiplyScalar(k); base.applyAxisAngle(new T.Vector3(0, 1, 0), yaw); base.y += pitch * base.length();
    cam.position.copy(rig.target).add(base); cam.position.y = Math.max(1.2, cam.position.y);
    let look = rig.target;
    if(D && D.g) { const focus = D.kind === 'presence' ? D.p1 : D.kind === 'sound' ? D.src : D.at.clone().addScaledVector(D.dir, 1.2);
      const mid = D.at.clone().lerp(focus, 0.5); mid.y = Math.max(1.0, (D.at.y + (focus.y || 0)) / 2 + 0.2);
      const reach = D.kind === 'presence' ? D.range * 1.35 : D.kind === 'sound' ? 3.9 : 2.6, off = D.dir.clone().applyAxisAngle(new T.Vector3(0, 1, 0), (D.kind === 'presence' ? -0.8 : 0.85) + yaw).multiplyScalar(reach * opts.dist ** -0.5);
      const want = mid.clone().add(off); want.y = mid.y + 0.9 + pitch * 3; D.cam = D.cam ? D.cam.lerp(want, 0.08) : want.clone(); cam.position.copy(D.cam); look = mid; }
    if(rig.indoor) { cam.position.x = Math.max(-2.7, Math.min(2.7, cam.position.x)); cam.position.z = Math.max(0.6, Math.min(5.3, cam.position.z)); cam.position.y = Math.min(2.3, cam.position.y); }
    if((++fc & 7) === 0) updateGlows(); cam.fov = w / h < 1 ? 58 : (D && D.g ? 50 : 38); cam.updateProjectionMatrix(); cam.lookAt(look);
    demoStep();
    sun.target.position.copy(rig.target); stepParticles(rain, 0.55, 14); stepParticles(snow, 0.025, 14, 0.004);
    R.render(scene, cam);
  }
  return {
    async show(p, o, host) {
      const re = o.room !== opts.room || o.finish !== opts.finish || o.barSpot !== opts.barSpot || o.panSpot !== opts.panSpot;
      Object.assign(opts, o);
      if(!canvas) { canvas = document.createElement('canvas'); canvas.id = 'scene3d'; canvas.setAttribute('aria-label', 'Outdoor 3D view: drag to look around'); host.prepend(canvas); }
      canvas.hidden = false;
      if(!(await load())) return false;
      if(!R) build();
      if(p !== place || o.rebuild || re) setPlace(p); else applyLight();
      if(!raf) frame();
      return true;
    },
    update(o) { if(!R || !place) return; const rebuild = o.room !== opts.room || o.finish !== opts.finish || o.barSpot !== opts.barSpot || o.panSpot !== opts.panSpot; Object.assign(opts, o); if(rebuild) setPlace(place); else applyLight(); },
    hide() { if(canvas) canvas.hidden = true; cancelAnimationFrame(raf); raf = 0; },
    get failed() { return failed; },
    spots(p) { return SPOTS[p] || null; },
    demo(kind, tick) { if(!R || !rig) return false; demoClear(); D = { kind, tick, t0: performance.now(), loop: kind === 'presence' ? 15 : kind === 'light' ? 12 : kind === 'climate' ? 14 : 1e9 }; demoBuild(); return true; },
    stopDemo() { demoClear(); D = null; },
    get demoing() { return D ? D.kind : null; },
  };
})();
