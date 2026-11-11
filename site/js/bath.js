// Bad als Schnittmodell (Diorama) – komplett prozedural in three.js.
// Freistehende Rechteck-Wanne mit dünnem Rand, Eichen-Waschtisch mit schwarzem
// Aufsatzbecken, wandhängendes WC mit Vorwandelement, Fußbodenheizung im Estrich.
// Einheiten: Meter (lokal). Die ganze Gruppe wird auf 0,5 skaliert.
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';

const put = (g, o) => (g.add(o), o);
function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, mat);
  o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true;
  return o;
}
// Box über Min/Max-Koordinaten
function boxMM(x0, y0, z0, x1, y1, z1, mat) {
  return mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
}
function rbox(w, h, d, r, mat, x, y, z) { return mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, x, y, z); }
function cyl(r, h, mat, axis = 'y', seg = 24) {
  const g = new THREE.CylinderGeometry(r, r, h, seg);
  if (axis === 'x') g.rotateZ(Math.PI / 2);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  return mesh(g, mat);
}
function tube(points, r, mat, seg = 64, closed = false) {
  const c = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed, 'centripetal');
  return mesh(new THREE.TubeGeometry(c, seg, r, 10, closed), mat);
}
function roundedRect(path, x, y, w, h, r) {
  path.moveTo(x + r, y);
  path.lineTo(x + w - r, y); path.quadraticCurveTo(x + w, y, x + w, y + r);
  path.lineTo(x + w, y + h - r); path.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  path.lineTo(x + r, y + h); path.quadraticCurveTo(x, y + h, x, y + h - r);
  path.lineTo(x, y + r); path.quadraticCurveTo(x, y, x + r, y);
  return path;
}
function instanced(geo, mat, list) {
  const im = new THREE.InstancedMesh(geo, mat, list.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(1, 1, 1);
  list.forEach((p, i) => { e.set(p[3] || 0, p[4] || 0, p[5] || 0); q.setFromEuler(e); m4.compose(new THREE.Vector3(p[0], p[1], p[2]), q, s); im.setMatrixAt(i, m4); });
  im.castShadow = true; im.receiveShadow = true;
  return im;
}

function woodTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#8b6744'; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * 256, w = 0.6 + Math.random() * 2.2;
    g.strokeStyle = `rgba(${Math.random() < 0.5 ? '60,38,20' : '170,130,90'},${0.08 + Math.random() * 0.18})`;
    g.lineWidth = w; g.beginPath(); g.moveTo(x, 0);
    for (let y = 0; y <= 512; y += 32) g.lineTo(x + Math.sin(y * 0.02 + i) * 3, y);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function createBathMaterials() {
  const m = {};
  m.concrete = new THREE.MeshStandardMaterial({ color: 0x8a8782, roughness: 0.95 });
  m.slab = new THREE.MeshStandardMaterial({ color: 0x5d5b58, roughness: 0.95 });
  m.screed = new THREE.MeshStandardMaterial({ color: 0xa19d96, roughness: 0.9 });
  m.insul = new THREE.MeshStandardMaterial({ color: 0xc3c7cc, roughness: 0.35, metalness: 0.65 });
  m.grid = new THREE.MeshStandardMaterial({ color: 0x5b6470, roughness: 0.6 });
  m.floorTile = new THREE.MeshPhysicalMaterial({ color: 0x3a3b3e, roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.3 });
  m.wallStone = new THREE.MeshStandardMaterial({ color: 0xcfc7bb, roughness: 0.7 });
  m.wallDark = new THREE.MeshStandardMaterial({ color: 0x2c2a28, roughness: 0.65 });
  m.joint = new THREE.MeshStandardMaterial({ color: 0x8e877d, roughness: 0.9 });
  m.jointDark = new THREE.MeshStandardMaterial({ color: 0x1c1b1a, roughness: 0.9 });
  m.ceramic = new THREE.MeshPhysicalMaterial({ color: 0xf6f6f3, roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.06, side: THREE.DoubleSide });
  m.blackCeramic = new THREE.MeshPhysicalMaterial({ color: 0x141414, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.35, side: THREE.DoubleSide });
  m.blackMetal = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.4, metalness: 0.6 });
  m.stoneTop = new THREE.MeshPhysicalMaterial({ color: 0x2a2826, roughness: 0.35, clearcoat: 0.6 });
  m.wood = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.62 });
  m.galv = new THREE.MeshStandardMaterial({ color: 0x9aa1aa, roughness: 0.4, metalness: 0.8 });
  m.cistern = new THREE.MeshStandardMaterial({ color: 0x3f4650, roughness: 0.55 });
  m.drain = new THREE.MeshStandardMaterial({ color: 0x9da3a8, roughness: 0.5 });
  m.pipeHeat = new THREE.MeshStandardMaterial({ color: 0xd8532d, roughness: 0.45 });
  m.pipeBlue = new THREE.MeshStandardMaterial({ color: 0x2f6fd6, roughness: 0.45 });
  m.pipeRed = new THREE.MeshStandardMaterial({ color: 0xc8372a, roughness: 0.45 });
  m.mirror = new THREE.MeshPhysicalMaterial({ color: 0xc9ced4, roughness: 0.04, metalness: 1 });
  m.glowWarm = new THREE.MeshStandardMaterial({ color: 0xffd9a8, emissive: 0xffc483, emissiveIntensity: 2.2 });
  m.water = new THREE.MeshPhysicalMaterial({ color: 0x9fd6f0, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.42, clearcoat: 1 });
  m.leaf = new THREE.MeshStandardMaterial({ color: 0x4f7a4a, roughness: 0.55 });
  m.pot = new THREE.MeshStandardMaterial({ color: 0x1b1b1c, roughness: 0.7 });
  m.towel = new THREE.MeshStandardMaterial({ color: 0xe8e1d6, roughness: 1 });
  return m;
}

// ---------------------------------------------------------------
export function buildBath(m) {
  const root = new THREE.Group();
  root.scale.setScalar(0.5);
  root.position.y = 0.1;
  const P = {};
  const grp = (name) => { const g = new THREE.Group(); g.name = name; P[name] = g; root.add(g); return g; };

  // ---------- Rohbau (statisch) ----------
  const s = grp('structure');
  s.add(boxMM(-1.5, -0.2, -1.2, 1.5, -0.12, 1.2, m.slab));                 // Bodenplatte
  s.add(boxMM(-1.5, -0.12, -1.2, 1.5, -0.085, 1.2, m.insul));              // Dämmung
  s.add(boxMM(-1.5, -0.2, -1.2, 1.5, 2.5, -1.08, m.concrete));             // Rückwand (Schnitt)
  s.add(boxMM(-1.5, -0.2, -1.08, -1.38, 2.5, 0.45, m.concrete));           // linke Wand
  // Wandbelag Rückwand: großformatige Platten mit Fugen
  s.add(boxMM(-1.38, 0, -1.08, 1.5, 2.5, -1.068, m.wallStone));
  const j = [];
  for (let y = 0.6; y < 2.5; y += 0.6) j.push([0.06, y, -1.067, 0, 0, 0]);
  s.add(instanced(new THREE.BoxGeometry(2.88, 0.004, 0.002), m.joint, j));
  const jv = [];
  for (let x = -0.78; x < 1.5; x += 1.2) jv.push([x, 1.25, -1.067]);
  s.add(instanced(new THREE.BoxGeometry(0.004, 2.5, 0.002), m.joint, jv));
  // Wandbelag links: dunkler Naturstein
  s.add(boxMM(-1.38, 0, -1.068, -1.366, 2.5, 0.45, m.wallDark));
  const jl = [];
  for (let z = -0.48; z < 0.45; z += 0.6) jl.push([-1.365, 1.25, z]);
  s.add(instanced(new THREE.BoxGeometry(0.002, 2.5, 0.004), m.jointDark, jl));
  // Nische mit LED-Linie über der Wanne
  s.add(boxMM(-1.366, 1.22, -0.85, -1.33, 1.24, -0.05, m.wallDark));
  s.add(boxMM(-1.364, 1.5, -0.85, -1.35, 1.512, -0.05, m.glowWarm));
  // Vorwand: Waschtisch-Teil (statisch), Seitenwange, Ablage
  s.add(boxMM(0.3, 0, -1.068, 1.5, 1.2, -0.88, m.wallStone));
  s.add(boxMM(-0.57, 0, -1.068, -0.55, 1.2, -0.88, m.wallStone));
  s.add(boxMM(-0.57, 1.2, -1.068, 1.5, 1.225, -0.87, m.stoneTop));
  // Spiegel mit Hinterleuchtung
  const mirror = mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.012, 64), m.mirror, 0.875, 1.68, -1.05);
  mirror.rotation.x = Math.PI / 2; mirror.name = 'mirror';
  P.mirrorMesh = mirror;
  const glow = mesh(new THREE.TorusGeometry(0.315, 0.008, 8, 96), m.glowWarm, 0.875, 1.68, -1.06);
  const mirrorG = grp('mirror'); mirrorG.add(mirror, glow);
  const lamp = new THREE.PointLight(0xffc98f, 1.2, 2.4, 2); lamp.position.set(0.875, 1.5, -0.7); root.add(lamp);
  // Handtücher auf der Ablage
  s.add(rbox(0.36, 0.06, 0.2, 0.02, m.towel, 1.2, 1.255, -0.97));
  s.add(rbox(0.34, 0.06, 0.19, 0.02, m.towel, 1.2, 1.315, -0.97));

  // ---------- Fußbodenheizung (statisch, unter dem Estrich) ----------
  const heat = grp('heating');
  const pts = [];
  const rows = 15, x0 = -1.32, x1 = 1.32, R = 0.07;
  for (let i = 0; i < rows; i++) {
    const z = -1.02 + i * 0.145;
    const L = i % 2 === 0;
    const xs = L ? x0 : x1, xe = L ? x1 : x0;
    pts.push([xs, -0.074, z], [xe, -0.074, z]);
    if (i < rows - 1) {
      const dir = L ? 1 : -1;
      for (let k = 1; k < 8; k++) { const a = -Math.PI / 2 + (k / 8) * Math.PI; pts.push([xe + dir * Math.cos(a) * R, -0.074, z + R + Math.sin(a) * R]); }
    }
  }
  const curve = new THREE.CurvePath();
  for (let i = 0; i < pts.length - 1; i++) curve.add(new THREE.LineCurve3(new THREE.Vector3(...pts[i]), new THREE.Vector3(...pts[i + 1])));
  heat.add(mesh(new THREE.TubeGeometry(curve, 1600, 0.0095, 8, false), m.pipeHeat));
  // Vor- und Rücklauf in die Wand
  heat.add(tube([[-1.32, -0.074, -1.02], [-1.36, -0.074, -1.06], [-1.36, 0.1, -1.075]], 0.0095, m.pipeHeat, 20));
  heat.add(tube([[-1.32, -0.074, 1.01], [-1.35, -0.074, 0.6], [-1.37, -0.074, -1.0], [-1.365, 0.1, -1.072]], 0.0095, m.pipeBlue, 40));
  // Rasterfolie auf der Dämmung
  const gl = [];
  for (let x = -1.4; x <= 1.4; x += 0.1) gl.push([x, -0.0845, 0]);
  heat.add(instanced(new THREE.BoxGeometry(0.003, 0.001, 2.38), m.grid, gl));
  const gl2 = [];
  for (let z = -1.1; z <= 1.1; z += 0.1) gl2.push([0, -0.0845, z]);
  heat.add(instanced(new THREE.BoxGeometry(2.98, 0.001, 0.003), m.grid, gl2));

  // ---------- Estrich & Fliesen ----------
  grp('screed').add(boxMM(-1.5, -0.085, -1.2, 1.5, -0.012, 1.2, m.screed));
  const tiles = grp('tiles');
  for (let ix = 0; ix < 5; ix++) for (let iz = 0; iz < 4; iz++) {
    const t = mesh(new THREE.BoxGeometry(0.596, 0.012, 0.596), m.floorTile, -1.2 + ix * 0.6, -0.006, -0.9 + iz * 0.6);
    t.userData.k = Math.random(); t.userData.y0 = t.position.y; t.userData.r = (Math.random() - 0.5);
    tiles.add(t);
  }
  P.tiles.userData.stagger = true;

  // ---------- Badewanne (freistehend, Rechteck, dünner Rand) ----------
  const tub = grp('tub');
  const TX = -0.975, TZ = -0.15, TW = 0.78, TL = 1.75, TH = 0.58, T = 0.022, TB = 0.05;
  const outer = roundedRect(new THREE.Shape(), -TW / 2, -TL / 2, TW, TL, 0.07);
  const inner = roundedRect(new THREE.Path(), -TW / 2 + T, -TL / 2 + T, TW - 2 * T, TL - 2 * T, 0.05);
  outer.holes.push(inner);
  const wallGeo = new THREE.ExtrudeGeometry(outer, { depth: TH - TB, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 16 });
  wallGeo.rotateX(-Math.PI / 2);
  tub.add(mesh(wallGeo, m.ceramic, TX, TB, TZ));
  // Wannenboden (innen leicht gemuldet) + Sockel
  tub.add(rbox(TW - 0.01, 0.08, TL - 0.01, 0.06, m.ceramic, TX, TB - 0.02, TZ));
  tub.add(rbox(TW - 0.12, TB, TL - 0.14, 0.02, m.blackMetal, TX, TB / 2 - 0.005, TZ));
  // Ab- und Überlauf
  put(tub, cyl(0.032, 0.006, m.blackMetal)).position.set(TX, TB + 0.022, TZ - TL / 2 + 0.25);
  const ov = put(tub, cyl(0.03, 0.01, m.blackMetal, 'z')); ov.position.set(TX, TH - 0.12, TZ - TL / 2 + T + 0.004);
  // Wasser
  const water = mesh(new THREE.BoxGeometry(TW - 2 * T - 0.004, 0.004, TL - 2 * T - 0.004), m.water, TX, TH - 0.16, TZ);
  water.castShadow = false; tub.add(water);
  tub.userData.anchor = new THREE.Vector3(TX + TW / 2, TH, TZ + 0.3);

  // Wannenträger, Füße, Ablaufgarnitur (sichtbar, wenn die Wanne abhebt)
  const tf = grp('tubFrame');
  for (const dx of [-0.22, 0.22]) {
    tf.add(boxMM(TX + dx - 0.02, 0.02, TZ - TL / 2 + 0.12, TX + dx + 0.02, 0.045, TZ + TL / 2 - 0.12, m.galv));
    for (const dz of [-0.65, 0, 0.65]) {
      put(tf, cyl(0.006, 0.03, m.galv)).position.set(TX + dx, 0.01, TZ + dz);
      put(tf, cyl(0.022, 0.006, m.blackMetal)).position.set(TX + dx, 0.003, TZ + dz);
    }
  }
  const dz0 = TZ - TL / 2 + 0.25;
  tf.add(tube([[TX, 0.06, dz0], [TX, 0.035, dz0], [TX + 0.05, 0.025, dz0 - 0.04], [TX + 0.12, 0.02, dz0 - 0.14], [TX + 0.12, -0.04, dz0 - 0.2]], 0.02, m.drain, 40));
  put(tf, cyl(0.04, 0.05, m.blackMetal)).position.set(TX, 0.05, dz0);
  // Überlaufschlauch
  tf.add(tube([[TX, TH - 0.12, TZ - TL / 2 + 0.005], [TX + 0.02, 0.3, TZ - TL / 2 - 0.0], [TX + 0.03, 0.08, dz0 - 0.08], [TX + 0.02, 0.04, dz0 - 0.02]], 0.012, m.drain, 40));

  // Bodenstand-Wannenarmatur (schwarz)
  const fil = grp('filler');
  const FX = -0.47, FZ = 0.2;
  put(fil, cyl(0.045, 0.012, m.blackMetal)).position.set(FX, 0.006, FZ);
  put(fil, cyl(0.017, 0.94, m.blackMetal)).position.set(FX, 0.47, FZ);
  fil.add(tube([[FX, 0.93, FZ], [FX, 1.0, FZ], [FX - 0.08, 1.04, FZ], [FX - 0.2, 1.0, FZ], [FX - 0.22, 0.95, FZ]], 0.015, m.blackMetal, 32));
  put(fil, cyl(0.022, 0.05, m.blackMetal)).position.set(FX + 0.02, 0.8, FZ + 0.01);
  const hand = put(fil, cyl(0.014, 0.2, m.blackMetal)); hand.position.set(FX + 0.035, 0.62, FZ);

  // ---------- WC + Vorwandelement ----------
  const fr = grp('vorwand');   // Tragrahmen mit Spülkasten (statisch, wird freigelegt)
  for (const x of [-0.45, 0.25]) fr.add(boxMM(x - 0.02, 0, -1.06, x + 0.02, 1.15, -1.0, m.galv));
  for (const y of [0.18, 0.6, 1.12]) fr.add(boxMM(-0.47, y - 0.02, -1.06, 0.27, y + 0.02, -1.0, m.galv));
  fr.add(rbox(0.4, 0.36, 0.12, 0.02, m.cistern, -0.1, 0.92, -1.0));
  fr.add(rbox(0.16, 0.12, 0.03, 0.01, m.galv, -0.1, 0.98, -0.93));
  fr.add(tube([[-0.1, 0.74, -1.0], [-0.1, 0.55, -0.98], [-0.1, 0.4, -0.96], [-0.1, 0.32, -0.93]], 0.025, m.drain, 30));
  fr.add(tube([[-0.1, 0.24, -0.9], [-0.1, 0.24, -1.0], [-0.1, 0.05, -1.03], [-0.1, -0.05, -1.05]], 0.045, m.drain, 30));
  fr.add(tube([[0.2, 1.1, -1.04], [0.2, 1.2, -1.04], [-0.05, 1.12, -1.02]], 0.008, m.pipeBlue, 24));
  for (const x of [-0.19, -0.01]) put(fr, cyl(0.008, 0.16, m.galv, 'z')).position.set(x, 0.33, -0.95);
  fr.userData.anchor = new THREE.Vector3(-0.1, 0.92, -0.94);

  const cover = grp('wcCover');
  cover.add(boxMM(-0.55, 0, -0.9, 0.3, 1.2, -0.88, m.wallStone));
  cover.add(rbox(0.25, 0.165, 0.012, 0.004, m.blackMetal, -0.1, 0.98, -0.874));
  cover.add(boxMM(-0.13, 0.905, -0.869, -0.07, 1.055, -0.866, m.stoneTop));

  const wc = grp('wc');
  wc.add(rbox(0.36, 0.24, 0.54, 0.11, m.ceramic, -0.1, 0.3, -0.61));
  wc.add(rbox(0.37, 0.022, 0.47, 0.06, m.ceramic, -0.1, 0.43, -0.6));
  wc.add(rbox(0.3, 0.05, 0.1, 0.02, m.ceramic, -0.1, 0.25, -0.86));

  // ---------- Waschtisch ----------
  const VX = 0.875;
  const cab = grp('cabinet');
  cab.add(boxMM(VX - 0.5, 0.42, -0.88, VX + 0.5, 0.78, -0.4, m.wood));
  cab.add(boxMM(VX - 0.49, 0.6, -0.399, VX + 0.49, 0.604, -0.398, m.jointDark));
  cab.add(boxMM(VX - 0.12, 0.76, -0.399, VX + 0.12, 0.768, -0.396, m.blackMetal));
  const counter = grp('counter');
  counter.add(boxMM(VX - 0.51, 0.78, -0.88, VX + 0.51, 0.81, -0.385, m.stoneTop));
  // Aufsatzbecken rund, schwarz (Drehkörper mit dünner Wandung)
  const prof = [[0.0, 0], [0.07, 0], [0.11, 0.006], [0.17, 0.035], [0.2, 0.085], [0.212, 0.135], [0.206, 0.137], [0.196, 0.09], [0.163, 0.042], [0.1, 0.017], [0.0, 0.015]].map(([x, y]) => new THREE.Vector2(x, y));
  const basin = grp('basin');
  basin.add(mesh(new THREE.LatheGeometry(prof, 72), m.blackCeramic, VX, 0.81, -0.63));
  put(basin, cyl(0.022, 0.003, m.blackMetal)).position.set(VX, 0.827, -0.63);
  basin.userData.anchor = new THREE.Vector3(VX + 0.21, 0.95, -0.63);
  const fau = grp('faucet');
  put(fau, cyl(0.035, 0.012, m.blackMetal, 'z')).position.set(VX, 1.06, -0.874);
  put(fau, cyl(0.012, 0.21, m.blackMetal, 'z')).position.set(VX, 1.06, -0.765);
  put(fau, cyl(0.007, 0.08, m.blackMetal)).position.set(VX + 0.06, 1.1, -0.86);
  put(fau, cyl(0.02, 0.012, m.blackMetal, 'z')).position.set(VX + 0.06, 1.06, -0.874);
  // Installation hinter dem Unterschrank
  const vp = grp('vanityPlumbing');
  vp.add(tube([[VX, 0.81, -0.63], [VX, 0.7, -0.63], [VX, 0.62, -0.66], [VX, 0.58, -0.75], [VX, 0.56, -0.87]], 0.018, m.blackMetal, 30));
  put(vp, cyl(0.03, 0.08, m.blackMetal)).position.set(VX, 0.66, -0.63);
  for (const [dx, mat] of [[-0.12, m.pipeBlue], [0.12, m.pipeRed]]) {
    put(vp, cyl(0.012, 0.05, m.galv, 'z')).position.set(VX + dx, 0.66, -0.855);
    put(vp, cyl(0.014, 0.02, mat)).position.set(VX + dx, 0.69, -0.85);
  }

  // ---------- Deko: Pflanze ----------
  const deco = grp('deco');
  put(deco, cyl(0.12, 0.34, m.pot, 'y', 32)).position.set(1.22, 0.17, 0.75);
  // Gras-artige Pflanze: schmale, gebogene Halme
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + (i % 2) * 0.3, h = 0.4 + ((i * 37) % 9) * 0.04, lean = 0.12 + ((i * 13) % 5) * 0.05;
    const c = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(1.22 + Math.cos(a) * 0.03, 0.33, 0.75 + Math.sin(a) * 0.03),
      new THREE.Vector3(1.22 + Math.cos(a) * lean * 0.5, 0.33 + h * 0.75, 0.75 + Math.sin(a) * lean * 0.5),
      new THREE.Vector3(1.22 + Math.cos(a) * lean * 1.6, 0.33 + h, 0.75 + Math.sin(a) * lean * 1.6));
    const leaf = mesh(new THREE.TubeGeometry(c, 10, 0.006, 4, false), m.leaf);
    leaf.scale.set(1, 1, 1); deco.add(leaf);
  }

  for (const k in P) if (P[k].isGroup) P[k].userData.base = P[k].position.clone();

  // Explosionsvektoren (lokal, Meter)
  const off = (n, x, y, z) => { P[n].userData.offset = new THREE.Vector3(x, y, z); };
  off('tub', 0, 1.0, 0);
  off('tubFrame', 0, 0.55, 0);
  off('filler', 0, 0.55, 0);
  off('tiles', 0, 0.55, 0);
  off('screed', 0, 0.3, 0);
  off('deco', 0, 0.55, 0);
  off('wc', 0, 0, 0.7);
  off('wcCover', 0, 0, 0.42);
  off('basin', 0, 0.5, 0);
  off('faucet', 0, 0.12, 0.3);
  off('counter', 0, 0.26, 0);
  off('cabinet', 0, 0, 0.5);
  off('mirror', 0, 0.1, 0.25);
  for (const k of ['structure', 'heating', 'vorwand', 'vanityPlumbing']) off(k, 0, 0, 0);
  P.heating.userData.anchor = new THREE.Vector3(0.6, -0.07, 0.4);

  const parts = {};
  for (const k in P) if (P[k].isGroup) parts[k] = P[k];
  return { root, parts };
}
