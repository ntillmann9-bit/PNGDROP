import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { createMaterials, buildHeatPump } from './heatpump.js';
import { createBathMaterials, buildBath } from './bath.js';
import { createVortex } from './vortex.js';

// ------------------------------------------------------------------
// Hilfsfunktionen
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const sms = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a, b, t) => a + (b - a) * t;

// Kamera: az = Winkel um die Hochachse (0 = frontal, + = von rechts), h = Kamerahöhe,
// r = horizontaler Abstand, t = Zielpunkt, sx = Bildversatz (Anteil Breite, < 0 → Objekt rechts).
const HERO_CAM = { az: 26, h: 1.55, r: 6.6, t: [0, 1.62, 0], sx: 0.0 };

// ------------------------------------------------------------------
// Drehbuch 1: Wärmepumpe
const WP_ALL = ['front', 'grille', 'fan', 'side', 'top', 'compressor', 'coil', 'electronics'];
const WP_STAGES = [
  { id: 'hero',       from: 0.00, to: 0.09, parts: [], cam: HERO_CAM },
  { id: 'gehaeuse',   from: 0.12, to: 0.25, parts: ['front', 'grille'],           cam: { az: -38, h: 1.1,  r: 3.75, t: [-0.02, 0.52, 0.32], sx: -0.13 } },
  { id: 'ventilator', from: 0.27, to: 0.40, parts: ['front', 'grille', 'fan'],    cam: { az: -16, h: 0.76, r: 2.55, t: [-0.16, 0.55, 0.3],  sx: 0.16 } },
  { id: 'verdichter', from: 0.43, to: 0.55, parts: ['side', 'top', 'compressor'], cam: { az: 66,  h: 0.85, r: 2.5,  t: [0.55, 0.4, 0.0],    sx: -0.15 } },
  { id: 'verdampfer', from: 0.58, to: 0.69, parts: ['coil'],                      cam: { az: 205, h: 1.15, r: 2.45, t: [-0.15, 0.5, -0.38], sx: 0.19 } },
  { id: 'regelung',   from: 0.72, to: 0.81, parts: ['top', 'electronics'],        cam: { az: 28,  h: 1.75, r: 1.85, t: [0.4, 1.0, 0.2],     sx: -0.18 } },
  { id: 'explosion',  from: 0.84, to: 0.94, parts: WP_ALL,                        cam: { az: 30,  h: 1.35, r: 4.1,  t: [0.05, 0.62, 0.15], sx: -0.12 } },
  { id: 'ende',       from: 0.97, to: 1.00, parts: [], cam: { az: 30, h: 1.2, r: 4.4, t: [0, 0.9, 0], sx: 0.0 } },
];

// Drehbuch 2: Bad (Schnittmodell, auf 0,5 skaliert, 0,1 angehoben)
const BAD_ALL = ['tub', 'tubFrame', 'filler', 'tiles', 'screed', 'deco', 'wc', 'wcCover', 'basin', 'faucet', 'counter', 'cabinet', 'mirror'];
const BAD_STAGES = [
  { id: 'hero',        from: 0.00, to: 0.09, parts: [], cam: { ...HERO_CAM, r: 6.9 } },
  { id: 'wanne',       from: 0.12, to: 0.27, parts: ['tub'],                                   cam: { az: 22,  h: 1.3,  r: 2.9, t: [-0.4, 0.55, 0.0],    sx: -0.15 } },
  { id: 'waschtisch',  from: 0.30, to: 0.45, parts: ['basin', 'faucet', 'counter', 'cabinet', 'mirror'], cam: { az: 22, h: 1.05, r: 2.45, t: [0.42, 0.62, -0.3], sx: 0.16 } },
  { id: 'vorwand',     from: 0.48, to: 0.62, parts: ['wc', 'wcCover'],                         cam: { az: 14, h: 0.85, r: 2.15, t: [-0.05, 0.42, -0.35], sx: -0.15 } },
  { id: 'boden',       from: 0.65, to: 0.79, parts: ['tiles', 'screed', 'tub', 'tubFrame', 'filler', 'deco'], cam: { az: 38, h: 2.5, r: 2.5, t: [0, 0.1, 0.05], sx: 0.16 } },
  { id: 'explosion',   from: 0.83, to: 0.94, parts: BAD_ALL,                                   cam: { az: 30,  h: 1.9,  r: 4.6, t: [0, 0.55, 0],         sx: -0.12 } },
  { id: 'ende',        from: 0.97, to: 1.00, parts: [], cam: { az: 30, h: 1.4, r: 4.8, t: [0, 0.7, 0], sx: 0.0 } },
];

function makeKeys(stages) {
  const keys = [];
  for (const s of stages) {
    const c = s.cam;
    keys.push({ p: s.from, ...c });
    keys.push({ p: s.to, ...c, az: c.az + (s.id === 'hero' ? -6 : 4), r: c.r * (s.id === 'explosion' ? 0.94 : 0.9) });
  }
  return keys;
}
function camAt(keys, p) {
  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1].p) i++;
  const a = keys[i], b = keys[i + 1];
  const t = sms(Math.min(1, Math.max(0, (p - a.p) / Math.max(1e-6, b.p - a.p))));
  return {
    az: lerp(a.az, b.az, t), h: lerp(a.h, b.h, t), r: lerp(a.r, b.r, t), sx: lerp(a.sx, b.sx, t),
    t: [0, 1, 2].map(k => lerp(a.t[k], b.t[k], t)),
  };
}
// Fenster einer einzelnen Station (0..1)
function stageWin(stages, id, p) {
  const s = stages.find(x => x.id === id);
  return ss(s.from - 0.01, s.from + 0.02, p) * (1 - ss(s.to - 0.005, s.to + 0.025, p));
}
// Öffnung eines Teils = Maximum über alle Stationen, in denen es offen ist
function partAmount(stages, name, p) {
  let e = 0;
  for (const s of stages) {
    if (!s.parts.includes(name)) continue;
    const rise = s.id === 'explosion' ? 0.035 : 0.03;
    e = Math.max(e, ss(s.from - 0.01, s.from - 0.01 + rise, p) * (1 - ss(s.to - 0.005, s.to + 0.025, p)));
  }
  return e;
}

// ------------------------------------------------------------------
// Renderer & Szene
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setClearColor(0x030304, 1);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 80);

scene.add(new THREE.HemisphereLight(0xffffff, 0x101014, 0.35));
const key = new THREE.DirectionalLight(0xffffff, 2.4);
key.position.set(2.2, 4.2, 3.0);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -2.2; key.shadow.camera.right = 2.2;
key.shadow.camera.top = 2.2; key.shadow.camera.bottom = -2.2;
key.shadow.camera.near = 0.5; key.shadow.camera.far = 10;
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.01;
key.shadow.radius = 6;
scene.add(key);
// Kantenlichter von hinten – zeichnen die Silhouette aus dem Schwarz
const rim = new THREE.DirectionalLight(0xdfe6ff, 3.2);
rim.position.set(-3, 2.5, -3.5);
scene.add(rim);
const rim2 = new THREE.DirectionalLight(0xffffff, 2.2);
rim2.position.set(3.5, 1.5, -3);
scene.add(rim2);

// Boden: Schattenfänger + Lichtkegel
const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: 0.6, depthWrite: false, transparent: true }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; floor.position.y = 0.001; floor.renderOrder = 2;
scene.add(floor);
{
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(128, 128, 10, 128, 128, 128);
  grd.addColorStop(0, 'rgba(255,255,255,0.20)'); grd.addColorStop(0.45, 'rgba(255,255,255,0.07)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.0005; blob.renderOrder = 1;
  scene.add(blob);
}

// HST-Schild als Canvas-Textur
function makeLogoTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#0c0d10'; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 6; g.strokeRect(20, 20, 472, 472);
  g.fillStyle = '#ffffff'; g.font = '600 190px "Inter Tight", "Helvetica Neue", Arial, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText('HST', 256, 300);
  g.fillStyle = '#ff8a3d'; g.fillRect(156, 350, 200, 8);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
const logoTex = makeLogoTexture();
document.fonts?.ready.then(() => { const n = makeLogoTexture(); logoTex.image = n.image; logoTex.needsUpdate = true; });
logoTex.anisotropy = 8;

const pivot = new THREE.Group();
scene.add(pivot);

// ------------------------------------------------------------------
// Modelle
const wp = buildHeatPump(createMaterials(logoTex));
const bad = buildBath(createBathMaterials());
pivot.add(wp.root, bad.root);

const MODELS = {
  wp: {
    ...wp, stages: WP_STAGES, keys: makeKeys(WP_STAGES), cool: 0,
    tags: {
      gehaeuse: { part: 'grille', text: 'Lamellenfront' },
      ventilator: { part: 'fan', text: 'EC-Ventilator' },
      verdichter: { part: 'compressor', text: 'Inverter-Verdichter' },
      verdampfer: { part: 'coil', text: 'Lamellen-Verdampfer' },
      regelung: { part: 'electronics', text: 'Regelung & Inverter' },
    },
    amount(name, p) {
      let e = partAmount(this.stages, name, p);
      if ((name === 'front' || name === 'grille') && p > 0.24 && p < 0.28) e = 1;   // Gehäuse bleibt offen
      return e;
    },
    animate(parts, p, dt, ctx) {
      for (const k of ['front', 'grille']) {   // in der Ventilator-Station seitlich aus dem Bild
        parts[k].position.addScaledVector(parts[k].userData.slide, sms(ss(0.255, 0.295, p) * (1 - ss(0.395, 0.43, p))));
      }
      parts.front.rotation.y = -0.18 * parts.front.userData.e;
      parts.grille.rotation.y = -0.22 * parts.grille.userData.e;
      parts.top.rotation.x = -0.08 * parts.top.userData.e;
      parts.side.rotation.y = 0.55 * parts.side.userData.e;
      parts.coil.rotation.y = -0.08 * parts.coil.userData.e;
      parts.electronics.rotation.x = -0.25 * parts.electronics.userData.e;
      ctx.fan += dt * (2.2 + 5 * parts.fan.userData.e);
      parts.fan.userData.rotor.rotation.z = -ctx.fan;
    },
  },
  bad: {
    ...bad, stages: BAD_STAGES, keys: makeKeys(BAD_STAGES), cool: 1,
    tags: {
      wanne: { part: 'tub', text: 'Freistehende Wanne' },
      waschtisch: { part: 'basin', text: 'Aufsatzbecken' },
      vorwand: { part: 'vorwand', text: 'Vorwandelement' },
      boden: { part: 'heating', text: 'Fußbodenheizung' },
    },
    amount(name, p) { return partAmount(this.stages, name, p); },
    animate(parts, p) {
      // Vorwand-Verkleidung: erst nach vorn, dann nach oben aus dem Bild
      const ec = parts.wcCover.userData.e;
      parts.wcCover.position.copy(parts.wcCover.userData.base).add(new THREE.Vector3(0, 1.5 * ss(0.3, 1, ec), 0.32 * ss(0, 0.3, ec)));
      // Fußbodenheizung: Fliesen & Estrich werden durchsichtig (Röntgenblick)
      const xr = stageWin(this.stages, 'boden', p);
      for (const mat of [parts.tiles.children[0].material, parts.screed.children[0].material]) {
        const want = xr > 0.001;
        if (mat.transparent !== want) { mat.transparent = want; mat.needsUpdate = true; }   // Shader neu bauen
        mat.opacity = 1 - 0.84 * xr; mat.depthWrite = xr < 0.5;
      }
      const e = parts.tiles.userData.e;
      parts.tiles.children.forEach(t => {   // Fliesen heben gestaffelt ab
        t.position.y = t.userData.y0 + 0.28 * e * t.userData.k;
        t.rotation.x = 0.25 * e * t.userData.r; t.rotation.z = 0.2 * e * t.userData.r;
      });
      parts.tub.rotation.z = 0.05 * parts.tub.userData.e;
      parts.wcCover.rotation.y = -0.1 * parts.wcCover.userData.e;
      parts.cabinet.rotation.y = 0.06 * parts.cabinet.userData.e;
    },
  },
};

const vortex = createVortex(renderer.getPixelRatio());
scene.add(vortex.group);

// ------------------------------------------------------------------
// DOM
const story = document.getElementById('story');
const tag = document.getElementById('tag');
const tagLabel = tag.querySelector('span');
const progressBar = document.querySelector('.story-progress i');
const scrollHint = document.querySelector('.scroll-hint');
const fadeEl = document.querySelector('.stage-fade');
const switchBtns = [...document.querySelectorAll('[data-set-mode]')];

let mode = 'wp', M = MODELS.wp;
let cards = [], pills = [], heroEl = null;
function bindDom() {
  const scope = `[data-mode="${mode}"]`;
  cards = [...document.querySelectorAll(`.stage-card${scope}`)];
  pills = [...document.querySelectorAll(`.stage-nav${scope} button`)];
  heroEl = document.querySelector(`.hero-copy${scope}`);
  document.querySelectorAll('.stage-card, .hero-copy').forEach(el => { if (!el.matches(scope)) el.style.opacity = 0; });
}
function applyMode(m) {
  mode = m; M = MODELS[m];
  document.body.dataset.activeMode = m;
  wp.root.visible = m === 'wp';
  bad.root.visible = m === 'bad';
  switchBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.setMode === m));
  document.querySelectorAll('.mode-switch').forEach(s => s.dataset.mode = m);
  bindDom();
}
let switching = false;
function setMode(m, { scroll = true } = {}) {
  if (m === mode || switching) { if (scroll) goToStory(); return; }
  switching = true;
  fadeEl.classList.add('on');
  setTimeout(() => {
    applyMode(m);
    if (scroll) goToStory(true);
    try { history.replaceState(null, '', m === 'bad' ? '?modell=bad' : location.pathname); } catch (e) {}
    setTimeout(() => { fadeEl.classList.remove('on'); switching = false; }, 60);
  }, 260);
}
function goToStory(instant) {
  if (scrollY > story.offsetTop + innerHeight * 0.5 || scrollY < story.offsetTop - 10) {
    window.scrollTo({ top: story.offsetTop, behavior: instant ? 'instant' : 'smooth' });
  }
}
switchBtns.forEach(b => b.addEventListener('click', (ev) => {
  const inStage = b.closest('.stage');
  if (b.tagName === 'A') ev.preventDefault();
  setMode(b.dataset.setMode, { scroll: !inStage || scrollY > story.offsetTop + 10 });
}));

document.querySelectorAll('.stage-nav button').forEach(btn => btn.addEventListener('click', () => {
  const s = M.stages.find(x => x.id === btn.dataset.stage);
  const mid = s.id === 'explosion' ? s.from + 0.06 : (s.from + s.to) / 2;
  window.scrollTo({ top: story.offsetTop + mid * (story.offsetHeight - innerHeight), behavior: 'smooth' });
}));

let pTarget = 0, p = 0, forced = null;
window.__setProgress = (v) => { forced = v; p = v; };              // für Screenshots / Tests
window.__setMode = (m) => applyMode(m);

function readScroll() {
  const max = story.offsetHeight - innerHeight;
  pTarget = Math.min(1, Math.max(0, (scrollY - story.offsetTop) / Math.max(1, max)));
}
addEventListener('scroll', readScroll, { passive: true });

function resize() {
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', () => { resize(); readScroll(); });
resize(); readScroll();

applyMode(new URLSearchParams(location.search).get('modell') === 'bad' ? 'bad' : 'wp');

const tmp = new THREE.Vector3();
const ctx = { fan: 0 };
let last = performance.now(), time = 0, cool = M.cool;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
  // Szene pausieren, solange die Story-Sektion nicht sichtbar ist
  const sr = story.getBoundingClientRect();
  const offscreen = forced === null && (sr.bottom < 0 || sr.top > innerHeight);
  canvas.style.visibility = offscreen ? 'hidden' : '';
  if (offscreen) { requestAnimationFrame(frame); return; }
  if (forced !== null) p = forced;
  else p += (pTarget - p) * (1 - Math.exp(-dt * 7));

  const mobile = camera.aspect < 0.9;
  const parts = M.parts;

  // Teile bewegen
  for (const k in parts) {
    const part = parts[k];
    const e = sms(M.amount(k, p));
    part.position.copy(part.userData.base).addScaledVector(part.userData.offset, e);
    part.userData.e = e;
  }
  M.animate(parts, p, dt, ctx);

  // Drehteller in der Explosion (360°, endet wo er anfing)
  pivot.rotation.y = Math.PI * 2 * sms(ss(0.84, 0.985, p));
  pivot.position.y = 0.012 * Math.sin(time * 1.3) * (1 - ss(0.0, 0.05, p) * 0.5);

  // Kamera
  const c = camAt(M.keys, p);
  const az = THREE.MathUtils.degToRad(c.az + Math.sin(time * 0.35) * 1.2);
  const heroMob = mobile ? 1 - ss(0.03, 0.1, p) : 0;
  const r = mobile ? c.r * (1 + (0.9 - camera.aspect) * (1.25 - 0.55 * heroMob)) : c.r;
  camera.position.set(c.t[0] + Math.sin(az) * r, c.h + (mobile ? 0.15 : 0), c.t[2] + Math.cos(az) * r);
  camera.lookAt(c.t[0], c.t[1] - (mobile ? 0.12 : 0), c.t[2]);
  const vw = canvas.clientWidth, vh = canvas.clientHeight;
  if (mobile) camera.setViewOffset(vw, vh, 0, vh * (0.1 - 0.16 * heroMob), vw, vh);
  else camera.setViewOffset(vw, vh, c.sx * vw, 0, vw, vh);

  // Strudel: im Hero voll, danach leiser Hintergrund, in der Explosion heller.
  // Wärmepumpe: warme Akzente (Luft → Wärme), Bad: kühle Akzente (Wasser).
  cool += (M.cool - cool) * (1 - Math.exp(-dt * 4));
  const vo = lerp(1, 0.32, ss(0.03, 0.13, p)) + 0.45 * ss(0.83, 0.88, p) * (1 - ss(0.94, 0.99, p));
  vortex.update(time, vo, forced !== null ? M.cool : cool);

  renderer.render(scene, camera);

  // UI: Hero, Karten, Etikett, Navigation
  heroEl.style.opacity = 1 - ss(0.03, 0.09, p);
  heroEl.style.transform = `translate(-50%, ${-40 * ss(0.03, 0.09, p)}px)`;
  scrollHint.style.opacity = 1 - ss(0.005, 0.03, p);
  let active = null;
  cards.forEach(card => {
    const s = M.stages.find(x => x.id === card.dataset.stage);
    const v = ss(s.from - 0.005, s.from + 0.025, p) * (1 - ss(s.to - 0.02, s.to + 0.005, p));
    card.style.opacity = v;
    card.style.transform = `translateY(${(1 - v) * 30}px)`;
    card.style.pointerEvents = v > 0.5 ? 'auto' : 'none';
    if (v > 0.5) active = s.id;
  });
  pills.forEach(b => b.classList.toggle('active', b.dataset.stage === active));
  progressBar.style.transform = `scaleY(${p})`;

  const t = active && M.tags[active];
  if (t) {
    const part = parts[t.part];
    tmp.copy(part.userData.anchor || new THREE.Vector3());
    part.localToWorld(tmp);
    tmp.project(camera);
    const x = (tmp.x * 0.5 + 0.5) * vw, y = (-tmp.y * 0.5 + 0.5) * vh;
    const tw = tag.offsetWidth || 160;   // Etikett bleibt im Bild
    tag.style.transform = `translate(${Math.min(Math.max(x, 16), vw - tw - 12)}px, ${Math.min(Math.max(y, 90), vh - 40)}px)`;
    tag.style.opacity = 1;
    if (tagLabel.textContent !== t.text) tagLabel.textContent = t.text;
  } else tag.style.opacity = 0;

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.documentElement.classList.add('ready');
