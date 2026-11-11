// Luftstrom-Strudel: tausende feine Linien auf einem Hyperboloid, die sich
// spiralförmig auf die Wärmepumpe herabwinden und am Boden auslaufen.
// Dazu schwebende Partikel. Alles additiv, monochrom, ein Hauch Wärme-Orange.
import * as THREE from 'three';

const YW = 2.0;          // Höhe der Taille
const RW = 1.0;          // Radius der Taille
const A_TOP = 1.5;       // Aufweitung nach oben
const A_BOT = 0.55;      // Aufweitung nach unten (schnell → Bodenteller)

function radiusAt(y) {
  const a = y > YW ? A_TOP : A_BOT;
  return RW * Math.sqrt(1 + ((y - YW) / a) ** 2);
}

const lineVS = /* glsl */`
  attribute float aU;
  attribute float aSeed;
  attribute float aBright;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uCool;
  varying float vA;
  varying vec3 vC;
  void main() {
    float flow = fract(aU * 1.6 - uTime * 0.07 + aSeed);
    float pulse = pow(flow, 7.0);
    float ends = smoothstep(0.0, 0.12, aU) * smoothstep(1.0, 0.8, aU);
    vA = aBright * ends * (0.28 + 1.4 * pulse);
    // warme Linien kippen im Bad-Modus zu Wasserblau
    float warm = step(aColor.b + 0.2, aColor.r);
    vC = mix(aColor, vec3(0.42, 0.78, 1.0), uCool * warm);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const lineFS = /* glsl */`
  uniform float uOpacity;
  varying float vA;
  varying vec3 vC;
  void main() { gl_FragColor = vec4(vC, vA * uOpacity); }`;

const ptsVS = /* glsl */`
  attribute float aSeed;
  attribute float aSize;
  uniform float uTime;
  uniform float uPx;
  varying float vA;
  void main() {
    vec3 p = position;
    float t = uTime * (0.15 + aSeed * 0.25);
    p.y += sin(t + aSeed * 40.0) * 0.06;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * uPx * (6.0 / -mv.z), 1.0, 6.0 * uPx);
    vA = 0.35 + 0.65 * (0.5 + 0.5 * sin(uTime * (1.0 + aSeed * 2.0) + aSeed * 90.0));
  }`;
const ptsFS = /* glsl */`
  uniform float uOpacity;
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vec3(1.0), a * vA * uOpacity);
  }`;

export function createVortex(pixelRatio = 1) {
  const group = new THREE.Group();
  const rnd = mulberry(7);
  const white = [1, 1, 1], warm = [1.0, 0.62, 0.36], cool = [0.78, 0.82, 1.0];

  // ---------- Linien ----------
  const pos = [], u = [], seed = [], bright = [], col = [];
  function addLine(pts, b, c) {
    const s = rnd();
    for (let i = 0; i < pts.length - 1; i++) {
      pos.push(...pts[i], ...pts[i + 1]);
      u.push(i / (pts.length - 1), (i + 1) / (pts.length - 1));
      seed.push(s, s); bright.push(b, b); col.push(...c, ...c);
    }
  }
  const pickColor = () => { const r = rnd(); return r < 0.09 ? warm : r < 0.16 ? cool : white; };

  // Trichter: von oben auf die Taille, dann nach außen auf den Boden
  const N = 520, SEG = 110;
  for (let n = 0; n < N; n++) {
    const th0 = rnd() * Math.PI * 2;
    const twist = 0.75 + rnd() * 0.5;
    const jit = 1 + (rnd() - 0.5) * 0.22;
    const yTop = 5.2 + rnd() * 2.5;
    const yEnd = 0.02 + rnd() * 0.05;
    const pts = [];
    for (let i = 0; i <= SEG; i++) {
      const s = i / SEG;
      const y = yTop + (yEnd - yTop) * Math.pow(s, 0.9);
      const r = radiusAt(y) * jit;
      const th = th0 + twist * (yTop - y) + 0.9 * Math.log(r);
      pts.push([Math.cos(th) * r, y, Math.sin(th) * r]);
    }
    addLine(pts, 0.25 + rnd() * 0.75, pickColor());
  }
  // Bodenteller: Spiralen, die nach außen laufen
  const NF = 300;
  for (let n = 0; n < NF; n++) {
    const th0 = rnd() * Math.PI * 2;
    const r0 = 1.6 + rnd() * 1.2, r1 = 6 + rnd() * 4;
    const pts = [];
    for (let i = 0; i <= 90; i++) {
      const s = i / 90;
      const r = r0 * Math.pow(r1 / r0, s);
      const th = th0 + 1.7 * Math.log(r);
      pts.push([Math.cos(th) * r, 0.004 + rnd() * 0.002, Math.sin(th) * r]);
    }
    addLine(pts, 0.15 + rnd() * 0.5, pickColor());
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  lg.setAttribute('aU', new THREE.Float32BufferAttribute(u, 1));
  lg.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
  lg.setAttribute('aBright', new THREE.Float32BufferAttribute(bright, 1));
  lg.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
  const lineMat = new THREE.ShaderMaterial({
    vertexShader: lineVS, fragmentShader: lineFS,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.5 }, uCool: { value: 0 } },
    transparent: false, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(lg, lineMat);
  lines.frustumCulled = false;
  group.add(lines);

  // ---------- Partikel ----------
  const P = 2600;
  const pp = [], ps = [], psz = [];
  for (let i = 0; i < P; i++) {
    const onFloor = rnd() < 0.35;
    let x, y, z;
    if (onFloor) {
      const r = 1.4 + Math.pow(rnd(), 0.6) * 8, th = rnd() * Math.PI * 2;
      x = Math.cos(th) * r; y = 0.01 + rnd() * 0.05; z = Math.sin(th) * r;
    } else {
      y = 0.1 + rnd() * 7;
      const r = radiusAt(y) * (0.85 + rnd() * 0.35), th = rnd() * Math.PI * 2;
      x = Math.cos(th) * r; z = Math.sin(th) * r;
    }
    pp.push(x, y, z); ps.push(rnd()); psz.push(0.6 + rnd() * rnd() * 2.4);
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.Float32BufferAttribute(pp, 3));
  pg.setAttribute('aSeed', new THREE.Float32BufferAttribute(ps, 1));
  pg.setAttribute('aSize', new THREE.Float32BufferAttribute(psz, 1));
  const ptsMat = new THREE.ShaderMaterial({
    vertexShader: ptsVS, fragmentShader: ptsFS,
    uniforms: { uTime: { value: 0 }, uOpacity: { value: 0.8 }, uPx: { value: pixelRatio } },
    transparent: false, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(pg, ptsMat);
  points.frustumCulled = false;
  group.add(points);

  // Vor allem anderen zeichnen → die Wärmepumpe liegt immer sauber davor
  lines.renderOrder = -20; points.renderOrder = -19;

  return {
    group,
    update(time, opacity, cool = 0) {
      lineMat.uniforms.uTime.value = time;
      lineMat.uniforms.uCool.value = cool;
      ptsMat.uniforms.uTime.value = time;
      lineMat.uniforms.uOpacity.value = 0.55 * opacity;
      ptsMat.uniforms.uOpacity.value = 0.85 * opacity;
      group.rotation.y = -time * 0.045;
    },
  };
}

function mulberry(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
