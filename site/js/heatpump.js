// Luft-Wasser-Wärmepumpe (Außeneinheit) – komplett prozedural in three.js gebaut.
// Einheiten ~ Meter. Ursprung: Bodenmitte. x = rechts, y = oben, z = zum Betrachter.
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';

export const W = 1.10;   // Breite Gehäuse
export const H = 0.92;   // Höhe Gehäuse
export const D = 0.44;   // Tiefe Gehäuse
export const B = 0.08;   // Fußhöhe (Unterkante Gehäuse)
const FX = -0.18;        // Ventilatormitte x
const FY = B + 0.47;     // Ventilatormitte y
const DIV = 0.18;        // Trennwand x

export function createMaterials(logoTexture) {
  const m = {};
  m.shell = new THREE.MeshPhysicalMaterial({ color: 0xd3d6da, roughness: 0.34, metalness: 0.2, clearcoat: 0.8, clearcoatRoughness: 0.15 });
  m.slat = new THREE.MeshStandardMaterial({ color: 0x33373d, roughness: 0.5, metalness: 0.35 });
  m.shellInner = new THREE.MeshStandardMaterial({ color: 0xd9dce1, roughness: 0.6 });
  m.anthracite = new THREE.MeshStandardMaterial({ color: 0x2b2f36, roughness: 0.5, metalness: 0.35 });
  m.dark = new THREE.MeshStandardMaterial({ color: 0x15171b, roughness: 0.45, metalness: 0.55 });
  m.black = new THREE.MeshStandardMaterial({ color: 0x050506, roughness: 0.7, metalness: 0.1 });
  m.compressor = new THREE.MeshPhysicalMaterial({ color: 0x1d2025, roughness: 0.32, metalness: 0.7, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  m.copper = new THREE.MeshStandardMaterial({ color: 0xc27a4e, roughness: 0.26, metalness: 1.0 });
  m.copperDark = new THREE.MeshStandardMaterial({ color: 0x8e5233, roughness: 0.35, metalness: 1.0 });
  m.brass = new THREE.MeshStandardMaterial({ color: 0xc9a54e, roughness: 0.3, metalness: 1.0 });
  m.fin = new THREE.MeshStandardMaterial({ color: 0x7d8796, roughness: 0.35, metalness: 0.85 });
  m.galv = new THREE.MeshStandardMaterial({ color: 0x8d939c, roughness: 0.4, metalness: 0.8 });
  m.blade = new THREE.MeshStandardMaterial({ color: 0x2c3138, roughness: 0.42, metalness: 0.15, side: THREE.DoubleSide });
  m.blue = new THREE.MeshPhysicalMaterial({ color: 0xb9bec6, metalness: 0.9, roughness: 0.3, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.1 });
  m.yellow = new THREE.MeshPhysicalMaterial({ color: 0xff8a3d, roughness: 0.32, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.1 });
  m.yellowGlow = new THREE.MeshStandardMaterial({ color: 0xff8a3d, emissive: 0xff7a1a, emissiveIntensity: 2.2 });
  m.blueGlow = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xdfe8ff, emissiveIntensity: 1.6 });
  m.glass = new THREE.MeshPhysicalMaterial({ color: 0x0b0d10, roughness: 0.05, metalness: 0.2, clearcoat: 1 });
  m.rubber = new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.95 });
  m.pcb = new THREE.MeshStandardMaterial({ color: 0x11402c, roughness: 0.45, metalness: 0.2 });
  m.chip = new THREE.MeshStandardMaterial({ color: 0x101114, roughness: 0.35, metalness: 0.3 });
  m.capBlue = new THREE.MeshPhysicalMaterial({ color: 0x163d7a, roughness: 0.3, clearcoat: 0.8 });
  m.silver = new THREE.MeshStandardMaterial({ color: 0xd6d9de, roughness: 0.25, metalness: 1.0 });
  m.terminal = new THREE.MeshStandardMaterial({ color: 0x8b9099, roughness: 0.55 });
  m.wireBlue = new THREE.MeshStandardMaterial({ color: 0x1f5fd1, roughness: 0.5 });
  m.wireBrown = new THREE.MeshStandardMaterial({ color: 0x6b3b1f, roughness: 0.5 });
  m.wireGY = new THREE.MeshStandardMaterial({ color: 0x9cc23a, roughness: 0.5 });
  m.wireBlack = new THREE.MeshStandardMaterial({ color: 0x18191c, roughness: 0.5 });
  m.foam = new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.95 });
  m.logo = new THREE.MeshPhysicalMaterial({ map: logoTexture, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });
  return m;
}

// ---------- Helfer ----------
const put = (g, o) => (g.add(o), o);
function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, mat);
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  return o;
}
function box(w, h, d, mat, x, y, z) { return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z); }
function rbox(w, h, d, r, mat, x, y, z) { return mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, x, y, z); }
function cyl(r, h, mat, axis = 'y', seg = 24) {
  const g = new THREE.CylinderGeometry(r, r, h, seg);
  if (axis === 'x') g.rotateZ(Math.PI / 2);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  return mesh(g, mat);
}
function tube(points, r, mat, seg = 48) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'centripetal');
  return mesh(new THREE.TubeGeometry(curve, seg, r, 10, false), mat);
}
function roundedRectShape(x, y, w, h, r) {
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function instanced(geo, mat, matrices) {
  const im = new THREE.InstancedMesh(geo, mat, matrices.length);
  matrices.forEach((m4, i) => im.setMatrixAt(i, m4));
  im.castShadow = true; im.receiveShadow = true;
  return im;
}
const M4 = (x, y, z, rx = 0, ry = 0, rz = 0, s = 1) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s));

// Schraubenköpfe (Kreuzschlitz angedeutet)
function screws(positions, mat, facing = 'z') {
  const g = new THREE.CylinderGeometry(0.0062, 0.0062, 0.003, 14);
  const rx = facing === 'z' ? Math.PI / 2 : 0;
  const rz = facing === 'x' ? Math.PI / 2 : 0;
  return instanced(g, mat, positions.map(p => M4(p[0], p[1], p[2], rx, 0, rz)));
}

// ---------- Baugruppen ----------
function buildFrame(m) {
  const g = new THREE.Group(); g.name = 'frame';
  // Bodenwanne
  g.add(rbox(W, 0.035, D, 0.006, m.anthracite, 0, B + 0.0175, 0));
  // Standfüße (Schienen) mit Gummipuffern
  for (const x of [-0.42, 0.42]) {
    g.add(rbox(0.075, 0.05, D + 0.1, 0.006, m.anthracite, x, 0.04, 0));
    for (const z of [-0.2, 0.2]) g.add(mesh(new THREE.CylinderGeometry(0.03, 0.034, 0.018, 20), m.rubber, x, 0.009, z));
  }
  // Trennwand Ventilator-/Technikraum
  g.add(box(0.012, H - 0.05, D - 0.05, m.galv, DIV, B + H / 2, -0.01));
  // Rückwand Technikraum
  g.add(box(W / 2 - DIV, H - 0.02, 0.012, m.shell, (W / 2 + DIV) / 2, B + H / 2, -D / 2 + 0.006));
  // Eckpfosten
  for (const [x, z] of [[-W / 2 + 0.012, D / 2 - 0.02], [-W / 2 + 0.012, -D / 2 + 0.02], [W / 2 - 0.012, -D / 2 + 0.02], [W / 2 - 0.012, D / 2 - 0.02]])
    g.add(box(0.022, H - 0.02, 0.022, m.galv, x, B + H / 2, z));
  // Düsenring (Bellmouth) hinter der Frontöffnung
  const bell = mesh(new THREE.TorusGeometry(0.29, 0.022, 14, 96), m.foam, FX, FY, D / 2 - 0.04);
  g.add(bell);
  // Schutzgitter links (senkrechte Stäbe)
  const bars = [];
  for (let i = 0; i < 12; i++) bars.push(M4(-W / 2 - 0.004, B + H / 2, -D / 2 + 0.03 + i * 0.034));
  g.add(instanced(new THREE.CylinderGeometry(0.0028, 0.0028, H - 0.06, 8), m.anthracite, bars));
  // Ventilator-Halterung (Motorbock)
  g.add(box(0.03, H - 0.06, 0.02, m.anthracite, FX - 0.05, B + H / 2, -0.07));
  g.add(box(0.03, H - 0.06, 0.02, m.anthracite, FX + 0.05, B + H / 2, -0.07));
  g.add(box(0.16, 0.035, 0.02, m.anthracite, FX, FY, -0.07));
  // Kondensatwanne-Heizband (gelber Akzent unten)
  g.add(tube([[-0.5, B + 0.04, -0.15], [-0.2, B + 0.04, -0.16], [0.12, B + 0.04, -0.15]], 0.004, m.wireBlack, 20));

  // Rohrleitungen (Kältekreis)
  const r1 = 0.0085, r2 = 0.0062;
  // Druckleitung Verdichter -> 4-Wege-Ventil
  g.add(tube([[0.34, B + 0.37, -0.02], [0.34, B + 0.43, -0.03], [0.32, B + 0.48, -0.06], [0.3, B + 0.5, -0.06]], r1, m.copper));
  // 4-Wege-Ventil
  const fwv = cyl(0.017, 0.1, m.brass, 'x'); fwv.position.set(0.345, B + 0.5, -0.06); g.add(fwv);
  const coilv = rbox(0.035, 0.03, 0.03, 0.004, m.black, 0.345, B + 0.53, -0.06); g.add(coilv);
  // 4-Wege -> Verdampfer-Sammler (oben)
  g.add(tube([[0.39, B + 0.5, -0.06], [0.42, B + 0.56, -0.08], [0.32, B + 0.66, -0.15], [0.19, B + 0.7, -0.19], [0.172, B + 0.72, -0.2]], r1, m.copper));
  // 4-Wege -> Abscheider
  g.add(tube([[0.33, B + 0.48, -0.06], [0.39, B + 0.42, -0.1], [0.46, B + 0.36, -0.1], [0.48, B + 0.31, -0.1]], r1, m.copper));
  // 4-Wege -> Absperrventil Gas
  g.add(tube([[0.36, B + 0.48, -0.05], [0.42, B + 0.36, 0.0], [0.5, B + 0.2, 0.06], [0.53, B + 0.17, 0.08]], r1, m.copper));
  // Flüssigkeitsleitung Absperrventil -> EEV -> Verteiler
  g.add(tube([[0.53, B + 0.1, 0.13], [0.42, B + 0.09, 0.12], [0.3, B + 0.16, 0.08], [0.24, B + 0.22, 0.06], [0.2, B + 0.3, -0.04], [0.15, B + 0.35, -0.12]], r2, m.copper));
  // Elektronisches Expansionsventil (Spule)
  const eev = cyl(0.016, 0.045, m.black); eev.position.set(0.245, B + 0.24, 0.055); g.add(eev);
  const eevCap = cyl(0.011, 0.01, m.blue); eevCap.position.set(0.245, B + 0.268, 0.055); g.add(eevCap);
  // Absperrventile (Service)
  for (const [y, z] of [[B + 0.17, 0.08], [B + 0.1, 0.13]]) {
    g.add(rbox(0.04, 0.04, 0.035, 0.004, m.brass, 0.535, y, z));
    const cap = cyl(0.011, 0.02, m.brass, 'x'); cap.position.set(0.565, y, z); g.add(cap);
  }
  // Kältemittel-Verteiler mit Kapillaren
  const dist = mesh(new THREE.CylinderGeometry(0.006, 0.014, 0.035, 16), m.brass, 0.15, B + 0.37, -0.12); g.add(dist);
  for (let i = 0; i < 10; i++) {
    const ty = B + 0.1 + i * 0.075;
    const tz = i % 2 ? -0.17 : -0.2;
    const bow = 0.02 + (i % 3) * 0.008;
    g.add(tube([[0.15, B + 0.39, -0.12], [0.16 + bow, (B + 0.39 + ty) / 2, -0.13 + bow * 0.5], [0.168, ty, tz]], 0.0022, m.copperDark, 30));
  }
  // Sammler (Gasseite) senkrecht
  const header = cyl(0.011, 0.78, m.copper); header.position.set(0.172, B + 0.47, -0.2); g.add(header);
  return g;
}

function buildCoil(m) {
  const g = new THREE.Group(); g.name = 'coil';
  const x0 = -W / 2 + 0.03, x1 = DIV - 0.02;
  const zc = -D / 2 + 0.035;
  const finH = H - 0.07, finD = 0.055;
  const fins = [];
  for (let x = x0 + 0.004; x < x1; x += 0.0072) fins.push(M4(x, B + H / 2, zc));
  g.add(instanced(new THREE.BoxGeometry(0.0011, finH, finD), m.fin, fins));
  // Endplatten
  g.add(box(0.006, finH + 0.01, finD + 0.01, m.galv, x0, B + H / 2, zc));
  g.add(box(0.006, finH + 0.01, finD + 0.01, m.galv, x1, B + H / 2, zc));
  // Kupferrohre (2 Reihen)
  const rows = 14, len = x1 - x0 + 0.02;
  const tubes = [];
  const ys = [];
  for (let i = 0; i < rows; i++) ys.push(B + 0.07 + i * (finH - 0.08) / (rows - 1));
  for (const z of [zc - 0.014, zc + 0.014]) for (const y of ys) tubes.push(M4((x0 + x1) / 2, y, z, 0, 0, Math.PI / 2));
  g.add(instanced(new THREE.CylinderGeometry(0.0048, 0.0048, len, 10), m.copper, tubes));
  // Rohrbögen (Hairpins) an beiden Enden
  const dy = ys[1] - ys[0];
  const bendGeo = new THREE.TorusGeometry(dy / 2, 0.0048, 8, 16, Math.PI);
  const bendsR = [], bendsL = [];
  for (const z of [zc - 0.014, zc + 0.014]) for (let i = 0; i < rows - 1; i += 2) {
    bendsR.push(M4(x1 + 0.01, ys[i] + dy / 2, z, 0, 0, -Math.PI / 2));
    if (i + 2 < rows) bendsL.push(M4(x0 - 0.01, ys[i + 1] + dy / 2, z, 0, 0, Math.PI / 2));
  }
  g.add(instanced(bendGeo, m.copper, bendsR));
  g.add(instanced(bendGeo, m.copper, bendsL));
  // Schutzgitter Rückseite
  const wires = [];
  for (let y = B + 0.04; y < B + H - 0.02; y += 0.036) wires.push(M4((x0 + x1) / 2, y, -D / 2 - 0.006, 0, 0, Math.PI / 2));
  g.add(instanced(new THREE.CylinderGeometry(0.002, 0.002, x1 - x0 + 0.04, 6), m.anthracite, wires));
  const vwires = [];
  for (let x = x0; x <= x1 + 0.001; x += (x1 - x0) / 6) vwires.push(M4(x, B + H / 2, -D / 2 - 0.009));
  g.add(instanced(new THREE.CylinderGeometry(0.0028, 0.0028, H - 0.04, 6), m.anthracite, vwires));
  // Fühler (Temperatur) mit Kabel
  put(g, cyl(0.004, 0.03, m.black, 'x')).position.set(x0 + 0.1, B + 0.62, zc + 0.04);
  g.add(tube([[x0 + 0.115, B + 0.62, zc + 0.04], [0.0, B + 0.66, zc + 0.05], [x1, B + 0.7, zc + 0.04]], 0.002, m.wireBlack, 20));
  return g;
}

function bladeGeometry() {
  const U = 14, V = 10;
  const pos = [], idx = [];
  for (let i = 0; i <= U; i++) {
    const u = i / U;
    const r = 0.068 + u * (0.258 - 0.068);
    const span = 0.95 - 0.38 * u;
    const sweep = 0.42 * u * u;
    for (let j = 0; j <= V; j++) {
      const v = j / V;
      const th = sweep + (v - 0.5) * span;
      const camber = Math.sin(v * Math.PI) * 0.008;
      pos.push(r * Math.cos(th), r * Math.sin(th), -(v - 0.5) * 0.085 * (1 - 0.45 * u) + camber);
    }
  }
  for (let i = 0; i < U; i++) for (let j = 0; j < V; j++) {
    const a = i * (V + 1) + j, b = a + V + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function buildFan(m) {
  const g = new THREE.Group(); g.name = 'fan';
  g.position.set(FX, FY, 0.03);
  const rotor = new THREE.Group(); rotor.name = 'rotor';
  const bg = bladeGeometry();
  for (let k = 0; k < 3; k++) {
    const b = mesh(bg, m.blade); b.rotation.z = k * Math.PI * 2 / 3; rotor.add(b);
  }
  const hub = cyl(0.068, 0.06, m.blade, 'z'); rotor.add(hub);
  const cap = mesh(new THREE.SphereGeometry(0.05, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), m.yellow, 0, 0, 0.03);
  cap.rotation.x = Math.PI / 2; cap.scale.set(1, 0.55, 1); rotor.add(cap);
  // Wuchtgewichte / Rippen am Nabenring
  const ribs = [];
  for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; ribs.push(M4(Math.cos(a) * 0.064, Math.sin(a) * 0.064, 0, 0, 0, a)); }
  rotor.add(instanced(new THREE.BoxGeometry(0.012, 0.006, 0.058), m.anthracite, ribs));
  g.add(rotor);
  // EC-Motor
  const motor = cyl(0.072, 0.075, m.dark, 'z'); motor.position.z = -0.07; g.add(motor);
  const fins = [];
  for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; fins.push(M4(Math.cos(a) * 0.074, Math.sin(a) * 0.074, -0.07, 0, 0, a)); }
  g.add(instanced(new THREE.BoxGeometry(0.008, 0.003, 0.07), m.anthracite, fins));
  const ring = mesh(new THREE.TorusGeometry(0.073, 0.004, 8, 48), m.blue, 0, 0, -0.03); g.add(ring);
  g.add(tube([[0.06, -0.05, -0.08], [0.12, -0.14, -0.09], [0.3, -0.2, -0.1], [0.36, -0.12, -0.08]], 0.0035, m.wireBlack, 24));
  g.userData.rotor = rotor;
  return g;
}

// Lamellenfront (große dunkle Fläche über dem Ventilator, horizontale Lamellen)
const GX0 = -W / 2 + 0.05, GX1 = DIV - 0.03, GY0 = 0.075, GY1 = H - 0.075;
function buildGrille(m) {
  const g = new THREE.Group(); g.name = 'grille';
  g.position.set(0, B, D / 2 + 0.006);
  const w = GX1 - GX0, cx = (GX0 + GX1) / 2;
  const n = 30, step = (GY1 - GY0) / n;
  const slats = [];
  for (let i = 0; i < n; i++) slats.push(M4(cx, GY0 + step * (i + 0.5), 0.004, -0.55, 0, 0));
  g.add(instanced(new THREE.BoxGeometry(w - 0.01, step * 0.78, 0.0035), m.slat, slats));
  // Rahmen
  g.add(box(w, 0.012, 0.016, m.slat, cx, GY0, 0.002));
  g.add(box(w, 0.012, 0.016, m.slat, cx, GY1, 0.002));
  g.add(box(0.012, GY1 - GY0, 0.016, m.slat, GX0, (GY0 + GY1) / 2, 0.002));
  g.add(box(0.012, GY1 - GY0, 0.016, m.slat, GX1, (GY0 + GY1) / 2, 0.002));
  // zwei senkrechte Stege
  for (const x of [cx - w / 6, cx + w / 6]) g.add(box(0.006, GY1 - GY0, 0.01, m.slat, x, (GY0 + GY1) / 2, -0.004));
  return g;
}

function buildFront(m) {
  const g = new THREE.Group(); g.name = 'front';
  const depth = 0.014;
  const shape = roundedRectShape(-W / 2, 0, W, H, 0.04);
  const hole = new THREE.Path();
  const r = 0.025;
  hole.moveTo(GX0 + r, GY0); hole.lineTo(GX1 - r, GY0); hole.quadraticCurveTo(GX1, GY0, GX1, GY0 + r);
  hole.lineTo(GX1, GY1 - r); hole.quadraticCurveTo(GX1, GY1, GX1 - r, GY1);
  hole.lineTo(GX0 + r, GY1); hole.quadraticCurveTo(GX0, GY1, GX0, GY1 - r);
  hole.lineTo(GX0, GY0 + r); hole.quadraticCurveTo(GX0, GY0, GX0 + r, GY0);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 4, curveSegments: 24 });
  g.add(mesh(geo, m.shell));
  g.position.set(0, B, D / 2 - 0.004);
  const zf = depth + 0.0065;
  // schmale Schattenfuge um die Lamellenfläche
  g.add(box(GX1 - GX0 + 0.012, 0.003, 0.002, m.black, (GX0 + GX1) / 2, GY0 - 0.006, zf - 0.004));
  // Logo-Schild rechts oben
  const logo = mesh(new THREE.PlaneGeometry(0.075, 0.075), m.logo, 0.37, H - 0.12, zf);
  logo.castShadow = false; g.add(logo);
  // kleine Status-LED
  g.add(mesh(new THREE.CircleGeometry(0.004, 16), m.yellowGlow, 0.37, 0.12, zf));
  g.userData.anchor = new THREE.Vector3(0.37, H - 0.2, zf);
  return g;
}

function buildTop(m) {
  const g = new THREE.Group(); g.name = 'top';
  g.add(rbox(W + 0.014, 0.028, D + 0.03, 0.009, m.shell, 0, B + H + 0.014, 0));
  // dunkle Fugen-Linie / Kante
  g.add(box(W - 0.05, 0.002, 0.012, m.blue, 0, B + H + 0.029, D / 2 - 0.03));
  const sp = [];
  for (const x of [-0.5, -0.17, 0.17, 0.5]) for (const z of [-0.18, 0.18]) sp.push([x, B + H + 0.029, z]);
  g.add(screws(sp, m.galv, 'y'));
  return g;
}

function buildSide(m) {
  const g = new THREE.Group(); g.name = 'side';
  const x = W / 2 + 0.009;
  g.add(rbox(0.018, H, D + 0.004, 0.006, m.shell, x, B + H / 2, 0));
  // Griffmulde
  g.add(rbox(0.004, 0.035, 0.14, 0.006, m.black, x + 0.008, B + H * 0.74, 0));
  // Lamellen hinten unten
  for (let i = 0; i < 8; i++) g.add(rbox(0.003, 0.006, 0.12, 0.002, m.black, x + 0.0085, B + 0.08 + i * 0.022, -0.1));
  // Anschluss-Abdeckung (blau)
  g.add(rbox(0.006, 0.12, 0.13, 0.008, m.blue, x + 0.008, B + 0.2, 0.12));
  const sp = [];
  for (const y of [B + 0.03, B + H - 0.03]) for (const z of [-0.19, 0.19]) sp.push([x + 0.0095, y, z]);
  g.add(screws(sp, m.galv, 'x'));
  return g;
}

function buildCompressor(m) {
  const g = new THREE.Group(); g.name = 'compressor';
  const cx = 0.34, cz = -0.02, by = B + 0.06;
  // Grundplatte + Gummidämpfer
  g.add(box(0.2, 0.008, 0.2, m.galv, cx, by - 0.012, cz));
  for (let k = 0; k < 3; k++) {
    const a = k / 3 * Math.PI * 2 + 0.3;
    const px = cx + Math.cos(a) * 0.08, pz = cz + Math.sin(a) * 0.08;
    g.add(mesh(new THREE.CylinderGeometry(0.014, 0.016, 0.018, 16), m.rubber, px, by - 0.002, pz));
    g.add(mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.006, 6), m.galv, px, by + 0.01, pz));
  }
  // Verdichter-Mantel
  const shell = cyl(0.085, 0.24, m.compressor, 'y', 40); shell.position.set(cx, by + 0.14, cz); g.add(shell);
  const dome = mesh(new THREE.SphereGeometry(0.085, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), m.compressor, cx, by + 0.26, cz); dome.scale.y = 0.55; g.add(dome);
  const domeB = mesh(new THREE.SphereGeometry(0.085, 40, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), m.compressor, cx, by + 0.02, cz); domeB.scale.y = 0.35; g.add(domeB);
  put(g, mesh(new THREE.TorusGeometry(0.086, 0.004, 8, 64), m.dark, cx, by + 0.26, cz)).rotation.x = Math.PI / 2;
  put(g, mesh(new THREE.TorusGeometry(0.0865, 0.003, 8, 64), m.blue, cx, by + 0.08, cz)).rotation.x = Math.PI / 2;
  // Typenschild
  g.add(rbox(0.05, 0.035, 0.004, 0.003, m.yellow, cx, by + 0.17, cz + 0.085));
  // Klemmkasten
  put(g, rbox(0.05, 0.06, 0.03, 0.006, m.black, cx - 0.06, by + 0.18, cz + 0.06)).rotation.y = -0.6;
  // Abscheider (Akkumulator)
  const ax = 0.48, az = -0.1;
  const acc = cyl(0.036, 0.18, m.compressor, 'y', 28); acc.position.set(ax, by + 0.14, az); g.add(acc);
  for (const [yy, s] of [[by + 0.23, 1], [by + 0.05, -1]]) {
    const d = mesh(new THREE.SphereGeometry(0.036, 28, 10, 0, Math.PI * 2, s > 0 ? 0 : Math.PI / 2, Math.PI / 2), m.compressor, ax, yy, az); d.scale.y = 0.6; g.add(d);
  }
  put(g, mesh(new THREE.TorusGeometry(0.037, 0.003, 8, 40), m.galv, ax, by + 0.15, az)).rotation.x = Math.PI / 2;
  // Saugleitung Abscheider -> Verdichter
  g.add(tube([[ax, by + 0.03, az], [ax, by - 0.0, az + 0.02], [0.44, by + 0.04, cz - 0.02], [cx + 0.08, by + 0.07, cz - 0.02]], 0.0085, m.copper));
  // Kabel vom Klemmkasten nach oben
  g.add(tube([[cx - 0.07, by + 0.21, cz + 0.07], [cx - 0.1, by + 0.33, cz + 0.1], [cx - 0.08, by + 0.5, cz + 0.13], [cx - 0.05, by + 0.56, cz + 0.13]], 0.004, m.wireBlack, 24));
  g.userData.anchor = new THREE.Vector3(cx + 0.06, by + 0.2, cz + 0.06);
  return g;
}

function buildElectronics(m) {
  const g = new THREE.Group(); g.name = 'electronics';
  const ex = 0.365, ey = B + 0.72, ez = 0.15;
  g.add(rbox(0.3, 0.28, 0.012, 0.004, m.galv, ex, ey, ez));
  g.add(box(0.27, 0.235, 0.003, m.pcb, ex, ey - 0.005, ez + 0.0075));
  const zt = ez + 0.009;
  // Kühlkörper
  g.add(box(0.1, 0.08, 0.008, m.dark, ex - 0.07, ey + 0.06, zt + 0.004));
  const hs = [];
  for (let i = 0; i < 12; i++) hs.push(M4(ex - 0.115 + i * 0.0082, ey + 0.06, zt + 0.026));
  g.add(instanced(new THREE.BoxGeometry(0.0025, 0.08, 0.035), m.dark, hs));
  // Kondensatoren
  for (let i = 0; i < 3; i++) {
    const c = cyl(0.017, 0.05, m.capBlue, 'z', 24); c.position.set(ex + 0.03 + i * 0.038, ey + 0.07, zt + 0.025); g.add(c);
    const t = cyl(0.0165, 0.002, m.silver, 'z', 24); t.position.set(ex + 0.03 + i * 0.038, ey + 0.07, zt + 0.051); g.add(t);
  }
  // Drosseln
  for (let i = 0; i < 2; i++) {
    g.add(mesh(new THREE.TorusGeometry(0.021, 0.009, 10, 28), m.copperDark, ex - 0.085 + i * 0.055, ey - 0.03, zt + 0.012));
    put(g, cyl(0.011, 0.02, m.black, 'z')).position.set(ex - 0.085 + i * 0.055, ey - 0.03, zt + 0.01);
  }
  // Relais
  for (let i = 0; i < 4; i++) g.add(rbox(0.024, 0.018, 0.02, 0.002, i % 2 ? m.blue : m.chip, ex + 0.015 + i * 0.03, ey - 0.02, zt + 0.01));
  // Chips
  const chips = [];
  for (let i = 0; i < 12; i++) chips.push(M4(ex - 0.11 + (i % 6) * 0.04, ey - 0.075 - Math.floor(i / 6) * 0.018, zt + 0.0025));
  g.add(instanced(new THREE.BoxGeometry(0.016, 0.01, 0.004), m.chip, chips));
  // LEDs
  g.add(mesh(new THREE.CircleGeometry(0.003, 12), m.yellowGlow, ex + 0.12, ey + 0.1, zt + 0.002));
  g.add(mesh(new THREE.CircleGeometry(0.003, 12), m.blueGlow, ex + 0.12, ey + 0.088, zt + 0.002));
  // Klemmleiste + Kabel
  const wireMats = [m.wireBrown, m.wireBlue, m.wireGY, m.wireBlack, m.wireBrown, m.wireBlue, m.wireGY, m.wireBlack];
  for (let i = 0; i < 8; i++) {
    const tx = ex - 0.105 + i * 0.03;
    g.add(box(0.026, 0.026, 0.022, m.terminal, tx, ey - 0.125, zt + 0.01));
    put(g, cyl(0.0045, 0.003, m.silver, 'z', 10)).position.set(tx, ey - 0.12, zt + 0.0225);
    g.add(tube([[tx, ey - 0.138, zt + 0.012], [tx + (i - 3.5) * 0.004, ey - 0.2, zt + 0.02 + (i % 3) * 0.006], [tx * 0.9 + 0.03, ey - 0.3, zt - 0.02]], 0.0028, wireMats[i], 20));
  }
  g.userData.anchor = new THREE.Vector3(ex - 0.07, ey + 0.06, zt + 0.04);
  return g;
}

// ---------- Gesamtaufbau ----------
export function buildHeatPump(m) {
  const root = new THREE.Group();
  const parts = {
    frame: buildFrame(m),
    coil: buildCoil(m),
    fan: buildFan(m),
    compressor: buildCompressor(m),
    electronics: buildElectronics(m),
    grille: buildGrille(m),
    front: buildFront(m),
    side: buildSide(m),
    top: buildTop(m),
  };
  for (const k in parts) {
    const p = parts[k];
    p.userData.base = p.position.clone();
    root.add(p);
  }
  // Explosionsvektoren (lokal)
  parts.front.userData.offset = new THREE.Vector3(0, 0.03, 0.55);
  parts.front.userData.slide = new THREE.Vector3(-1.7, 0, 0.1);
  parts.grille.userData.slide = new THREE.Vector3(-1.9, 0.05, 0.05);
  parts.grille.userData.offset = new THREE.Vector3(0, 0.03, 0.85);
  parts.fan.userData.offset = new THREE.Vector3(0, 0, 0.36);
  parts.side.userData.offset = new THREE.Vector3(0.42, 0, -0.75);
  parts.top.userData.offset = new THREE.Vector3(0, 0.55, 0);
  parts.compressor.userData.offset = new THREE.Vector3(0.32, 0.03, 0.05);
  parts.coil.userData.offset = new THREE.Vector3(0, 0, -0.52);
  parts.electronics.userData.offset = new THREE.Vector3(0.05, 0.36, 0.1);
  parts.frame.userData.offset = new THREE.Vector3();

  parts.coil.userData.anchor = new THREE.Vector3(-0.3, B + 0.7, -D / 2);
  parts.fan.userData.anchor = new THREE.Vector3(0.16, 0.14, 0.02);
  parts.grille.userData.anchor = new THREE.Vector3(-0.2, 0.6, 0.01);
  return { root, parts };
}
