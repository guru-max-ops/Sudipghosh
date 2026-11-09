(function() {
const ADVANCED_DEFAULTS = {
  seed: 7,
  textSize: 11,
  density: 100,
  sketchCount: 100,
  dotCount: 300,
  gap: 3,
  tilt: 10,
  slant: 8,
  wobble: 4,
  hatchSpacing: 3,
  driftRate: 2,
  spawnMs: 250,
  fadeMs: 400,
  blankMs: 300,
  writeMinMs: 1200,
  writeMaxMs: 2e3,
  settleMs: 600,
  flashColor: "#FFFFFF",
  inkOpacity: 100,
  hoverRadius: 15,
  hoverPush: 12,
  hoverInMs: 300,
  hoverOutMs: 600,
  pressBoost: 200,
  grain: 0,
  vignette: 0,
  hover: 100
};
const MOVED_CONTROLS = { "into": {}, "out": { "hover": "advanced" } };
const GROUP_FALLBACKS = { advanced: ADVANCED_DEFAULTS };
function withMovedControls(props) {
  const out = { ...props };
  for (const [k, g2] of Object.entries(MOVED_CONTROLS.into)) out[k] = props?.[g2]?.[k] ?? GROUP_FALLBACKS[g2]?.[k];
  for (const [k, g2] of Object.entries(MOVED_CONTROLS.out)) {
    if (out[k] !== void 0) out[g2] = { ...out[g2] ?? {}, [k]: out[k] };
  }
  return out;
}
function arc(cx, cy, rx, ry, a0, a1, step = 15) {
  const out = [];
  const span = a1 - a0;
  const n = Math.max(2, Math.ceil(Math.abs(span) / step));
  for (let i = 0; i <= n; i++) {
    const a = (a0 + span * i / n) * Math.PI / 180;
    out.push(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry);
  }
  return out;
}
const ell = (cx, cy, rx, ry) => arc(cx, cy, rx, ry, 0, 360);
const P = (...n) => n;
function bounds(s) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const st of s)
    for (let q = 0; q < st.length; q += 2) {
      if (st[q] < x0) x0 = st[q];
      if (st[q] > x1) x1 = st[q];
      if (st[q + 1] < y0) y0 = st[q + 1];
      if (st[q + 1] > y1) y1 = st[q + 1];
    }
  if (!isFinite(x0)) return { x0: 0, y0: 0, x1: 0, y1: 0 };
  return { x0, y0, x1, y1 };
}
function shift(s, dx, dy) {
  for (const st of s)
    for (let q = 0; q < st.length; q += 2) {
      st[q] += dx;
      st[q + 1] += dy;
    }
}
function hatch(poly, deg, gap) {
  const a = deg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  const n = poly.length / 2;
  const U = [], V = [];
  let vmin = Infinity, vmax = -Infinity;
  for (let k = 0; k < n; k++) {
    const x = poly[k * 2], y = poly[k * 2 + 1];
    U.push(x * ca + y * sa);
    const v = -x * sa + y * ca;
    V.push(v);
    if (v < vmin) vmin = v;
    if (v > vmax) vmax = v;
  }
  const out = [];
  if (!(gap > 0)) return out;
  let flip = false;
  for (let v = vmin + gap * 0.5; v < vmax; v += gap) {
    const xs = [];
    for (let k = 0; k < n; k++) {
      const k2 = (k + 1) % n;
      const v1 = V[k], v2 = V[k2];
      if (v1 <= v && v2 > v || v2 <= v && v1 > v) {
        const t = (v - v1) / (v2 - v1);
        xs.push(U[k] + t * (U[k2] - U[k]));
      }
    }
    xs.sort((p, q) => p - q);
    for (let m = 0; m + 1 < xs.length; m += 2) {
      let u1 = xs[m], u2 = xs[m + 1];
      if (flip) [u1, u2] = [u2, u1];
      out.push([u1 * ca - v * sa, u1 * sa + v * ca, u2 * ca - v * sa, u2 * sa + v * ca]);
    }
    flip = !flip;
  }
  return out;
}
const g = (w, ...s) => ({ w, s });
const lemniscate = [];
for (let k = 0; k <= 32; k++) {
  const t = k / 32 * Math.PI * 2;
  const d = 1 + Math.sin(t) ** 2;
  lemniscate.push(0.4 + 0.38 * Math.cos(t) / d, 0.7 + 0.38 * Math.sin(t) * Math.cos(t) / d);
}
const G = {
  "0": g(0.6, ell(0.3, 0.5, 0.29, 0.5)),
  "1": g(0.4, P(0.05, 0.25, 0.28, 0, 0.28, 1)),
  "2": g(0.6, [...arc(0.29, 0.29, 0.27, 0.27, 200, 385), 0, 1, 0.6, 1]),
  "3": g(0.58, [...arc(0.27, 0.25, 0.26, 0.24, 205, 450), ...arc(0.27, 0.72, 0.3, 0.27, 270, 520)]),
  "4": g(0.62, P(0.45, 1, 0.45, 0, 0, 0.68, 0.62, 0.68)),
  "5": g(0.58, [0.52, 0, 0.1, 0, 0.06, 0.46, ...arc(0.28, 0.69, 0.28, 0.31, 215, 515)]),
  "6": g(0.6, P(0.48, 0.02, 0.2, 0.3, 0.03, 0.68), ell(0.3, 0.7, 0.27, 0.29)),
  "7": g(0.58, P(0, 0, 0.58, 0, 0.18, 1)),
  "8": g(0.58, ell(0.29, 0.24, 0.22, 0.24), ell(0.29, 0.73, 0.28, 0.27)),
  "9": g(0.58, ell(0.29, 0.3, 0.27, 0.3), P(0.56, 0.3, 0.48, 1)),
  a: g(0.56, ell(0.24, 0.7, 0.24, 0.3), P(0.5, 0.4, 0.5, 1)),
  b: g(0.55, P(0, 0, 0, 1), ell(0.26, 0.7, 0.25, 0.3)),
  c: g(0.5, arc(0.27, 0.7, 0.26, 0.3, -40, -320)),
  d: g(0.56, ell(0.25, 0.7, 0.25, 0.3), P(0.52, 0, 0.52, 1)),
  e: g(0.55, [0.03, 0.7, 0.53, 0.7, ...arc(0.28, 0.7, 0.26, 0.3, 0, -315)]),
  f: g(0.42, [...arc(0.32, 0.16, 0.14, 0.16, -10, -180), 0.18, 1], P(0, 0.45, 0.36, 0.45)),
  g: g(0.56, ell(0.25, 0.66, 0.24, 0.26), [0.5, 0.4, 0.5, 1.12, ...arc(0.27, 1.12, 0.23, 0.18, 0, 160)]),
  h: g(0.5, P(0, 0, 0, 1), [...arc(0.22, 0.62, 0.22, 0.2, 180, 360), 0.44, 1]),
  i: g(0.16, P(0.06, 0.42, 0.06, 1), P(0.06, 0.17, 0.07, 0.2)),
  j: g(0.3, P(0.2, 0.42, 0.2, 1.15, 0.05, 1.3), P(0.2, 0.17, 0.21, 0.2)),
  k: g(0.45, P(0, 0, 0, 1), P(0.4, 0.4, 0, 0.72, 0.42, 1)),
  l: g(0.22, P(0.08, 0, 0.08, 0.9, 0.2, 1)),
  m: g(0.72, P(0, 0.4, 0, 1), [...arc(0.17, 0.58, 0.17, 0.18, 180, 360), 0.34, 1], [...arc(0.51, 0.58, 0.17, 0.18, 180, 360), 0.68, 1]),
  n: g(0.5, P(0, 0.4, 0, 1), [...arc(0.22, 0.6, 0.22, 0.2, 180, 360), 0.44, 1]),
  o: g(0.55, ell(0.27, 0.7, 0.26, 0.3)),
  p: g(0.55, P(0, 0.4, 0, 1.32), ell(0.26, 0.7, 0.25, 0.3)),
  q: g(0.58, ell(0.25, 0.7, 0.25, 0.3), P(0.5, 0.4, 0.5, 1.32, 0.6, 1.22)),
  r: g(0.4, P(0, 0.4, 0, 1), arc(0.24, 0.64, 0.24, 0.22, 185, 320)),
  s: g(0.48, P(0.44, 0.46, 0.25, 0.4, 0.05, 0.47, 0.08, 0.63, 0.4, 0.75, 0.44, 0.9, 0.24, 1, 0, 0.94)),
  t: g(0.38, P(0.15, 0.08, 0.15, 0.92, 0.32, 1), P(0, 0.4, 0.36, 0.4)),
  u: g(0.5, [0, 0.4, ...arc(0.22, 0.8, 0.22, 0.2, 180, 0), 0.44, 0.4], P(0.44, 0.4, 0.44, 1)),
  v: g(0.48, P(0, 0.4, 0.22, 1, 0.44, 0.4)),
  w: g(0.66, P(0, 0.4, 0.15, 1, 0.31, 0.6, 0.47, 1, 0.62, 0.4)),
  x: g(0.48, P(0, 0.4, 0.44, 1), P(0.44, 0.4, 0, 1)),
  y: g(0.48, P(0, 0.4, 0.22, 0.98), P(0.45, 0.4, 0.12, 1.32)),
  z: g(0.46, P(0, 0.4, 0.42, 0.4, 0, 1, 0.45, 1)),
  A: g(0.62, P(0, 1, 0.31, 0, 0.62, 1), P(0.13, 0.62, 0.5, 0.62)),
  B: g(0.55, P(0, 0, 0, 1), [0, 0, 0.3, 0, ...arc(0.3, 0.24, 0.22, 0.24, -90, 90), 0, 0.48], [0, 0.48, 0.32, 0.48, ...arc(0.32, 0.74, 0.24, 0.26, -90, 90), 0, 1]),
  C: g(0.62, arc(0.34, 0.5, 0.33, 0.5, -40, -320)),
  D: g(0.62, P(0, 0, 0, 1), [0, 0, 0.18, 0, ...arc(0.18, 0.5, 0.42, 0.5, -90, 90), 0, 1]),
  E: g(0.5, P(0.48, 0, 0, 0, 0, 1, 0.5, 1), P(0, 0.5, 0.4, 0.5)),
  F: g(0.5, P(0.48, 0, 0, 0, 0, 1), P(0, 0.5, 0.4, 0.5)),
  G: g(0.68, arc(0.34, 0.5, 0.33, 0.5, -40, -320), P(0.4, 0.58, 0.66, 0.58, 0.66, 0.88)),
  H: g(0.6, P(0, 0, 0, 1), P(0.55, 0, 0.55, 1), P(0, 0.5, 0.55, 0.5)),
  I: g(0.18, P(0.08, 0, 0.08, 1)),
  K: g(0.58, P(0, 0, 0, 1), P(0.52, 0, 0, 0.6), P(0.2, 0.45, 0.55, 1)),
  L: g(0.48, P(0, 0, 0, 1, 0.45, 1)),
  M: g(0.78, P(0, 1, 0.06, 0, 0.37, 0.7, 0.68, 0, 0.74, 1)),
  N: g(0.64, P(0, 1, 0, 0, 0.58, 1, 0.58, 0)),
  P: g(0.55, [0, 1, 0, 0, 0.26, 0, ...arc(0.26, 0.25, 0.25, 0.25, -90, 90), 0, 0.5]),
  Q: g(0.68, ell(0.33, 0.5, 0.32, 0.5), P(0.4, 0.75, 0.68, 1.05)),
  R: g(0.58, [0, 1, 0, 0, 0.26, 0, ...arc(0.26, 0.25, 0.25, 0.25, -90, 90), 0, 0.5], P(0.24, 0.5, 0.56, 1)),
  S: g(0.56, P(0.5, 0.1, 0.3, 0, 0.06, 0.08, 0.05, 0.32, 0.48, 0.58, 0.52, 0.86, 0.28, 1, 0, 0.92)),
  T: g(0.6, P(0, 0, 0.6, 0), P(0.3, 0, 0.3, 1)),
  V: g(0.62, P(0, 0, 0.3, 1, 0.6, 0)),
  X: g(0.62, P(0, 0, 0.6, 1), P(0.6, 0, 0, 1)),
  "+": g(0.5, P(0.04, 0.66, 0.46, 0.66), P(0.25, 0.45, 0.25, 0.87)),
  "-": g(0.42, P(0.04, 0.66, 0.38, 0.66)),
  "=": g(0.5, P(0.04, 0.56, 0.46, 0.56), P(0.04, 0.78, 0.46, 0.78)),
  "\u2260": g(0.5, P(0.04, 0.56, 0.46, 0.56), P(0.04, 0.78, 0.46, 0.78), P(0.34, 0.42, 0.16, 0.92)),
  "\xB1": g(0.5, P(0.04, 0.6, 0.46, 0.6), P(0.25, 0.4, 0.25, 0.8), P(0.04, 0.94, 0.46, 0.94)),
  "(": g(0.3, arc(0.55, 0.5, 0.48, 0.6, -128, -232)),
  ")": g(0.3, arc(-0.25, 0.5, 0.48, 0.6, -52, 52)),
  "/": g(0.42, P(0.38, -0.02, 0.02, 1.04)),
  ".": g(0.14, P(0.05, 0.96, 0.07, 0.99)),
  ",": g(0.16, P(0.08, 0.94, 0.02, 1.14)),
  "\xB7": g(0.18, P(0.07, 0.64, 0.09, 0.67)),
  ":": g(0.16, P(0.06, 0.5, 0.07, 0.53), P(0.06, 0.95, 0.07, 0.98)),
  ";": g(0.16, P(0.06, 0.5, 0.07, 0.53), P(0.08, 0.94, 0.02, 1.12)),
  "'": g(0.14, P(0.08, 0, 0.04, 0.25)),
  "!": g(0.16, P(0.07, 0, 0.07, 0.72), P(0.07, 0.95, 0.08, 0.98)),
  "|": g(0.16, P(0.06, -0.05, 0.06, 1.08)),
  ">": g(0.46, P(0.04, 0.42, 0.42, 0.66, 0.04, 0.9)),
  "<": g(0.46, P(0.42, 0.42, 0.04, 0.66, 0.42, 0.9)),
  "\u222B": g(0.42, P(0.42, 0.02, 0.33, -0.08, 0.24, 0.05, 0.18, 0.95, 0.1, 1.1, 0, 1.04)),
  "\u03A3": g(0.62, P(0.58, 0, 0, 0, 0.32, 0.5, 0, 1, 0.6, 1)),
  "\u03C0": g(0.6, P(0, 0.46, 0.12, 0.4, 0.58, 0.4), P(0.17, 0.4, 0.13, 1), P(0.42, 0.4, 0.43, 0.94, 0.52, 1)),
  "\u221E": g(0.8, lemniscate),
  "\u2192": g(0.62, P(0, 0.66, 0.6, 0.66), P(0.46, 0.56, 0.6, 0.66, 0.46, 0.76)),
  "\u03B1": g(0.6, P(0.56, 0.42, 0.4, 0.86, 0.3, 1, 0.12, 0.98, 0.02, 0.76, 0.1, 0.48, 0.27, 0.42, 0.42, 0.7, 0.56, 1)),
  "\u0394": g(0.62, P(0, 1, 0.31, 0, 0.62, 1, 0, 1)),
  "\xB0": g(0.25, ell(0.1, 0.12, 0.08, 0.1)),
  "\u221A": g(0.6, P(0, 0.65, 0.12, 0.58, 0.26, 1, 0.45, 0, 0.6, 0))
};
function closeOf(s, i, o, c) {
  let d = 0;
  for (let j = i; j < s.length; j++) {
    if (s[j] === o) d++;
    else if (s[j] === c) {
      d--;
      if (d === 0) return j;
    }
  }
  return s.length;
}
function layoutSeq(s, size, r, slant, wob) {
  const out = [];
  let x = 0;
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if ((c === "^" || c === "_") && i + 1 < s.length) {
      let sub;
      if (s[i + 1] === "{") {
        const j = closeOf(s, i + 1, "{", "}");
        sub = s.slice(i + 2, j);
        i = j + 1;
      } else {
        sub = s[i + 1];
        i += 2;
      }
      const b = layoutSeq(sub, size * 0.62, r, slant, wob);
      const bb = bounds(b);
      shift(b, x - bb.x0 + size * 0.03, c === "^" ? -size * 0.52 : size * 0.3);
      out.push(...b);
      x += bb.x1 - bb.x0 + size * 0.1;
      continue;
    }
    if (c === "[") {
      const j = closeOf(s, i, "[", "]");
      const inner = s.slice(i + 1, j);
      i = j + 1;
      let cut = -1;
      let d = 0;
      for (let q = 0; q < inner.length; q++) {
        const ch = inner[q];
        if (ch === "[" || ch === "{") d++;
        else if (ch === "]" || ch === "}") d--;
        else if (ch === "~" && d === 0) {
          cut = q;
          break;
        }
      }
      const k = size * 0.78;
      const num2 = layoutSeq(cut < 0 ? inner : inner.slice(0, cut), k, r, slant, wob);
      const den = layoutSeq(cut < 0 ? "" : inner.slice(cut + 1), k, r, slant, wob);
      const nb = bounds(num2), db = bounds(den);
      const w = Math.max(nb.x1 - nb.x0, db.x1 - db.x0) + size * 0.3;
      const bar = -size * 0.34;
      shift(num2, x + (w - (nb.x1 - nb.x0)) / 2 - nb.x0, bar - size * 0.2);
      shift(den, x + (w - (db.x1 - db.x0)) / 2 - db.x0, bar + size * 0.22 + k);
      out.push(...num2);
      out.push([x, bar + (r() - 0.5) * size * 0.06, x + w / 2, bar + (r() - 0.5) * size * 0.06, x + w, bar + (r() - 0.5) * size * 0.06]);
      out.push(...den);
      x += w + size * 0.16;
      continue;
    }
    if (c === "\u221A" && s[i + 1] === "{") {
      const j = closeOf(s, i + 1, "{", "}");
      const b = layoutSeq(s.slice(i + 2, j), size, r, slant, wob);
      i = j + 1;
      const bb = bounds(b);
      const top = Math.min(bb.y0, -size) - size * 0.18;
      const bw = bb.x1 - bb.x0;
      shift(b, x + size * 0.55 - bb.x0, 0);
      out.push([x, -size * 0.36, x + size * 0.12, -size * 0.44, x + size * 0.26, 0, x + size * 0.45, top, x + size * 0.7 + bw, top]);
      out.push(...b);
      x += size * 0.82 + bw;
      continue;
    }
    i++;
    if (c === " ") {
      x += size * 0.32;
      continue;
    }
    const gl = G[c];
    if (!gl) continue;
    const sc = size * (1 + (r() - 0.5) * 0.12);
    const dy = (r() - 0.5) * size * 0.08;
    const sl = slant + (r() - 0.5) * 0.08;
    for (const st of gl.s) {
      const jx = (r() - 0.5) * size * wob, jy = (r() - 0.5) * size * wob;
      const p = [];
      for (let q = 0; q < st.length; q += 2) {
        const gx = st[q], gy = st[q + 1];
        p.push(x + gx * sc + (1 - gy) * sc * sl + jx, (gy - 1) * sc + dy + jy);
      }
      out.push(p);
    }
    x += gl.w * sc + size * 0.13;
  }
  return out;
}
const yArea = (x) => 0.85 - 0.54 * Math.sin((x - 0.08) / 0.9 * Math.PI);
const SKETCHES = [
  {
    k: [4, 6.5],
    f: (hs) => ({
      w: 1,
      h: 1,
      s: [P(0, 0.78, 0.55, 1, 1, 0.8), P(0.5, 0, 0, 0.78), P(0.5, 0, 0.55, 1), P(0.5, 0, 1, 0.8), P(0, 0.78, 0.45, 0.62, 1, 0.8), P(0.5, 0, 0.45, 0.62), ...hatch([0.5, 0, 0.55, 1, 1, 0.8], 70, hs)]
    })
  },
  {
    k: [3.5, 5.5],
    f: (hs) => ({
      w: 1,
      h: 1,
      s: [P(0, 0.3, 0.7, 0.3, 0.7, 1, 0, 1, 0, 0.3), P(0, 0.3, 0.3, 0, 1, 0, 0.7, 0.3), P(1, 0, 1, 0.7, 0.7, 1), ...hatch([0.7, 0.3, 1, 0, 1, 0.7, 0.7, 1], 45, hs)]
    })
  },
  {
    k: [4.5, 6.5],
    f: () => ({
      w: 1,
      h: 0.9,
      s: [P(0, 0.68, 0.55, 0.9, 1, 0.7), P(0.25, 0.12, 0.55, 0.2, 0.8, 0.1, 0.5, 0.03, 0.25, 0.12), P(0, 0.68, 0.25, 0.12), P(0.55, 0.9, 0.55, 0.2), P(1, 0.7, 0.8, 0.1), P(0, 0.68, 0.45, 0.52, 1, 0.7), P(0.45, 0.52, 0.5, 0.03)]
    })
  },
  {
    k: [3.5, 5.5],
    f: (hs, r) => {
      const s = [ell(0.5, 0.12, 0.38, 0.12), P(0.12, 0.12, 0.12, 0.88), P(0.88, 0.12, 0.88, 0.88), arc(0.5, 0.88, 0.38, 0.12, 0, 180)];
      if (r() < 0.5) s.push(...hatch([...arc(0.5, 0.12, 0.38, 0.12, 180, 0), ...arc(0.5, 0.88, 0.38, 0.12, 0, 180)], 100, hs * 1.3));
      return { w: 1, h: 1, s };
    }
  },
  { k: [4, 6], f: () => ({ w: 0.9, h: 1, s: [P(0.45, 0, 0.05, 0.86), P(0.45, 0, 0.85, 0.86), ell(0.45, 0.86, 0.4, 0.12), P(0.45, 0, 0.45, 0.86), P(0.45, 0.86, 0.85, 0.86)] }) },
  {
    k: [4, 6],
    f: () => ({ w: 1, h: 1, s: [ell(0.5, 0.5, 0.5, 0.5), ell(0.5, 0.5, 0.5, 0.14), arc(0.5, 0.27, 0.42, 0.1, 0, 180), arc(0.5, 0.73, 0.42, 0.1, 0, 180), arc(0.5, 0.5, 0.2, 0.5, -90, 90)] })
  },
  {
    k: [4, 5.5],
    f: (hs) => {
      const a0 = -35, a1 = 55;
      const c0 = a0 * Math.PI / 180, c1 = a1 * Math.PI / 180;
      return {
        w: 1,
        h: 1,
        s: [ell(0.5, 0.5, 0.48, 0.48), P(0.5, 0.5, 0.5 + 0.48 * Math.cos(c0), 0.5 + 0.48 * Math.sin(c0)), P(0.5, 0.5, 0.5 + 0.48 * Math.cos(c1), 0.5 + 0.48 * Math.sin(c1)), ...hatch([0.5, 0.5, ...arc(0.5, 0.5, 0.48, 0.48, a0, a1)], 30, hs)]
      };
    }
  },
  {
    k: [8, 11],
    f: () => {
      const c = [];
      for (let i = 0; i <= 40; i++) c.push(0.04 + 0.94 * i / 40, 0.3 - 0.2 * Math.sin(i / 40 * Math.PI * 3));
      return { w: 1, h: 0.6, s: [P(0, 0.3, 1, 0.3), P(0.95, 0.27, 1, 0.3, 0.95, 0.33), P(0.1, 0.6, 0.1, 0), P(0.07, 0.05, 0.1, 0, 0.13, 0.05), c] };
    }
  },
  {
    k: [6, 8],
    f: () => {
      const b1 = [], b2 = [];
      for (let i = 0; i <= 20; i++) {
        const x = 0.56 + 0.42 * i / 20;
        const y = 0.5 - 0.03 / (x - 0.5);
        b1.push(x, y);
        b2.push(1 - x, 1 - y);
      }
      return { w: 1, h: 1, s: [P(0, 0.5, 1, 0.5), P(0.5, 1, 0.5, 0), b1, b2] };
    }
  },
  { k: [5, 7], f: () => ({ w: 1, h: 1, s: [P(0, 0.6, 1, 0.6), P(0.4, 1, 0.4, 0), P(0.05, 0.95, 0.95, 0.1), P(0.05, 0.15, 0.9, 0.9), P(0.9, 0.57, 0.96, 0.6, 0.9, 0.63)] }) },
  {
    k: [6, 8],
    f: () => {
      const s = [P(0, 0, 1, 0, 1, 0.22, 0, 0.22, 0, 0)];
      for (let k = 1; k < 20; k++) s.push(P(k / 20, 0, k / 20, k % 5 === 0 ? 0.12 : 0.07));
      return { w: 1, h: 0.22, s };
    }
  },
  {
    k: [6, 9],
    f: () => {
      const s = [P(0, 0.92, 1, 0.92), P(0.03, 1, 0.03, 0.02), P(0, 0.08, 0.03, 0.02, 0.06, 0.08)];
      for (let k = 0; k < 5; k++) s.push(arc(0.14 + k * 0.19, 0.92, 0.08, 0.75 - k % 2 * 0.25 - k * 0.04, 180, 360));
      return { w: 1, h: 1, s };
    }
  },
  {
    k: [7, 9],
    f: () => {
      const s = [P(0, 0.5, 1, 0.5), arc(0.5, 0.5, 0.5, 0.5, 180, 360), arc(0.5, 0.5, 0.32, 0.32, 180, 360)];
      for (let a = 190; a < 360; a += 10) {
        const t = a * Math.PI / 180;
        const r0 = a % 30 === 0 ? 0.4 : 0.45;
        s.push(P(0.5 + Math.cos(t) * r0, 0.5 + Math.sin(t) * r0 * 1, 0.5 + Math.cos(t) * 0.5, 0.5 + Math.sin(t) * 0.5));
      }
      return { w: 1, h: 0.5, s };
    }
  },
  {
    k: [5, 7],
    f: (hs) => ({
      w: 1,
      h: 0.7,
      s: [ell(0.35, 0.35, 0.33, 0.33), ell(0.65, 0.35, 0.33, 0.33), ...hatch([...arc(0.35, 0.35, 0.33, 0.33, -63, 63), ...arc(0.65, 0.35, 0.33, 0.33, 117, 243)], 45, hs)]
    })
  },
  {
    k: [3.5, 5],
    f: (hs) => {
      const t = [0, 1, 0.55, 0, 1, 0.85];
      return { w: 1, h: 1, s: [[...t, 0, 1], ...hatch(t, -30, hs)] };
    }
  },
  {
    k: [6, 8],
    f: (hs) => {
      const c = [];
      for (let i = 0; i <= 24; i++) {
        const x = 0.08 + 0.9 * i / 24;
        c.push(x, yArea(x));
      }
      const reg = [];
      for (let i = 0; i <= 12; i++) {
        const x = 0.35 + 0.3 * i / 12;
        reg.push(x, yArea(x));
      }
      reg.push(0.65, 0.88, 0.35, 0.88);
      return { w: 1, h: 1, s: [P(0, 0.88, 1, 0.88), P(0.06, 1, 0.06, 0), c, P(0.35, 0.88, 0.35, yArea(0.35)), P(0.65, 0.88, 0.65, yArea(0.65)), ...hatch(reg, 45, hs)] };
    }
  },
  {
    k: [4.5, 6],
    f: () => {
      const out = [], inn = [];
      for (let k = 0; k <= 10; k++) {
        const a = (-90 + k * 36) * Math.PI / 180;
        out.push(0.5 + 0.5 * Math.cos(a), 0.5 + 0.5 * Math.sin(a));
      }
      for (let k = 0; k <= 5; k++) {
        const a = (-90 + k * 72) * Math.PI / 180;
        inn.push(0.5 + 0.26 * Math.cos(a), 0.5 + 0.26 * Math.sin(a));
      }
      const s = [out, inn];
      for (let k = 0; k < 5; k++) {
        const a = (-90 + k * 72) * Math.PI / 180;
        s.push(P(0.5 + 0.26 * Math.cos(a), 0.5 + 0.26 * Math.sin(a), 0.5 + 0.5 * Math.cos(a), 0.5 + 0.5 * Math.sin(a)));
      }
      return { w: 1, h: 1, s };
    }
  },
  {
    k: [5, 7],
    f: () => {
      const c = [];
      for (let i = 0; i <= 24; i++) {
        const x = 0.1 + 0.8 * i / 24;
        c.push(x, 0.85 - 0.75 * ((x - 0.5) / 0.4) ** 2);
      }
      return { w: 1, h: 1, s: [P(0, 0.7, 1, 0.7), P(0.5, 1, 0.5, 0), c] };
    }
  },
  { k: [4, 5.5], f: (hs) => ({ w: 1, h: 1, s: [ell(0.5, 0.5, 0.48, 0.48), P(0.5, 0.02, 0.5, 0.98), ...hatch(arc(0.5, 0.5, 0.48, 0.48, -90, 90), 45, hs)] }) },
  {
    k: [4, 5.5],
    f: (_hs, _r, txt) => {
      const s = [arc(0.32, 0.5, 0.3, 0.55, -140, -220)];
      ["0 1 0 1", "0 1 1 0", "1 0 0 1"].forEach((row, i) => {
        const t = txt(row, 0.16);
        shift(t, 0.14, 0.32 + i * 0.25);
        s.push(...t);
      });
      s.push(arc(0.53, 0.5, 0.3, 0.55, -40, 40));
      return { w: 0.85, h: 1, s };
    }
  }
];
const FORMULAS = [
  "(a+b)^2=a^2+2ab+b^2",
  "D=b^2-4ac",
  "a_n=a_1+d(n-1)",
  "e=2,718",
  "\u03C0=3,14",
  "tg(2a)=[2tga~1-tg^2a]",
  "cos2x=cos^2x-sin^2x",
  "sin^2x+cos^2x=1",
  "lim_{x\u2192\u221E}f(x)=\u221E",
  "log_ab",
  "log_2=0,693",
  "S_n=[b_1(1-q^n)~1-q]",
  "ctgX=[cosX~sinX]",
  "tgX=[sinX~cosX]",
  "y=kx+b",
  "\u221A{a^2+b^2}",
  "x_{1,2}=[-b\xB1\u221A{D}~2a]",
  "\u222Bf(x)dx=F(x)+C",
  "\u03A3[x^n~n!]",
  "f(x)=\u221A{x}",
  "y=ax^2+bx+c",
  "2x+5=3x-1",
  "x^a\xB7x^b=x^{a+b}",
  "(x^2+a)=([y~2])^2",
  "lg100=2",
  "2^x=8",
  "S=\u03C0R^2",
  "L=2\u03C0R",
  "V=[4~3]\u03C0R^3",
  "a^2+b^2=c^2",
  "sin(a+b)",
  "ctg(-x)=-ctgx",
  "lim[\u221A{n^3+1}+n~n-\u221A{3n+2}]",
  "y=sinx",
  "e^xcosx",
  "log_ax=[1~k]",
  "P=2(a+b)",
  "A(x_1;y_1)",
  "137",
  "lg_{10}e",
  "2,302",
  "k=[y_2-y_1~x_2-x_1]",
  "\u0394t=[1~2]",
  "(a-b)^3",
  "f'(x)=0",
  "\u222B_a^bxdx",
  "sin\u03B1=[a~c]",
  "R2L",
  "3x-2y=6",
  "[x~2]+[x~3]=5",
  "tg(-x)",
  "b_n=b_1q^{n-1}",
  "x\u22600",
  "x>0",
  "|x|=3",
  "S=[a+b~2]h",
  "y=x^3",
  "cos(-x)=cosx",
  "e^{x}=[1~x]",
  "\u222B[du~u]=ln|u|+C",
  "\u03A3_{n=1}^\u221E[1~n^2]",
  "[P(x)~Q(x)]",
  "G(x)+R^2",
  "x+y=7",
  "R_0=3\u03C0L",
  "b=\u221A{c^2-a^2}",
  "[a~sinA]=[b~sinB]",
  "80:00=80,0",
  "(1+[1~n])^n",
  "2\u03C0r",
  "4X+2X-1",
  "\u0394=b^2-4ac",
  "y'=2x",
  "S_\u0394=\u221A{p(p-a)(p-b)}",
  "x^2-y^2=(x-y)(x+y)",
  "tg(x)=[1~ctgx]"
];
const SHORT = ["x", "y", "n", "a", "2", "3", "5", "7", "0", "1", "+", "=", "\u03C0", "\u03A3", "\u221E", "\u2192", "x^2", "\u221A{x}", "e", "k", "f(x)", "n!", "-1", "b", "\u03B1", "\u0394x", "[1~2]", "x_n", "ln", "dx", "4", "9", "n=1", "y^2", "13"];
const TW = 1500, TH = 1e3, CELL = 4;
function rng(seed) {
  let a = seed * 2654435761 >>> 0 || 1;
  return () => {
    a = a + 1831565813 >>> 0;
    let t = a;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const mod = (a, m) => (a % m + m) % m;
const num = (v, d) => typeof v === "number" && isFinite(v) ? v : d;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function makeItem(strokes, cx, cy, angDeg) {
  const b = bounds(strokes);
  const mx = (b.x0 + b.x1) / 2, my = (b.y0 + b.y1) / 2;
  const a = angDeg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  const path = new Path2D();
  const lens = [], cum = [];
  let total = 0, rr = 0;
  const s = strokes.map((st) => {
    const p = [];
    let len = 0;
    for (let q = 0; q < st.length; q += 2) {
      const dx = st[q] - mx, dy = st[q + 1] - my;
      const x = dx * ca - dy * sa, y = dx * sa + dy * ca;
      p.push(x, y);
      rr = Math.max(rr, Math.hypot(x, y));
      if (q === 0) path.moveTo(x, y);
      else {
        path.lineTo(x, y);
        len += Math.hypot(x - p[q - 2], y - p[q - 1]);
      }
    }
    cum.push(total);
    lens.push(len);
    total += len;
    return p;
  });
  return { x: cx, y: cy, path, s, lens, cum, total, r: rr + 3 };
}
function buildField(adv) {
  const r = rng(Math.round(num(adv.seed, 7)));
  const size = clamp(num(adv.textSize, 11), 4, 40);
  const pad = Math.max(0, num(adv.gap, 3)) / 2;
  const slant = num(adv.slant, 8) / 100;
  const wob = num(adv.wobble, 4) / 100;
  const tilt = num(adv.tilt, 10);
  const hsDesign = Math.max(1, num(adv.hatchSpacing, 3));
  const density = Math.max(0, num(adv.density, 100)) / 100;
  const GW = TW / CELL, GH = TH / CELL;
  const occ = new Uint8Array(GW * GH);
  const items = [];
  const picks = [];
  const rotBox = (w, h, ang, p) => {
    const a = ang * Math.PI / 180;
    const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
    return [(w * c + h * s) / 2 + p, (w * s + h * c) / 2 + p];
  };
  const tryPlace = (cx, cy, hw, hh) => {
    const x0 = Math.floor((cx - hw) / CELL), x1 = Math.floor((cx + hw) / CELL);
    const y0 = Math.floor((cy - hh) / CELL), y1 = Math.floor((cy + hh) / CELL);
    if (x1 - x0 >= GW || y1 - y0 >= GH) return false;
    for (let gy = y0; gy <= y1; gy++) {
      const row = mod(gy, GH) * GW;
      for (let gx = x0; gx <= x1; gx++) if (occ[row + mod(gx, GW)]) return false;
    }
    for (let gy = y0; gy <= y1; gy++) {
      const row = mod(gy, GH) * GW;
      for (let gx = x0; gx <= x1; gx++) occ[row + mod(gx, GW)] = 1;
    }
    return true;
  };
  const txt = (s, z) => layoutSeq(s, z, r, slant, wob);
  const sketchCount = Math.round(Math.max(0, num(adv.sketchCount, 100)));
  for (let n = 0; n < sketchCount; n++) {
    const def = SKETCHES[n % SKETCHES.length];
    const S = size * (def.k[0] + r() * (def.k[1] - def.k[0]));
    const res = def.f(hsDesign / S, r, txt);
    const ang = (r() * 2 - 1) * tilt * 0.6;
    const [hw, hh] = rotBox(res.w * S, res.h * S, ang, pad);
    for (let a = 0; a < 80; a++) {
      const cx = r() * TW, cy = r() * TH;
      if (!tryPlace(cx, cy, hw, hh)) continue;
      const strokes = res.s.map((st2) => st2.map((v) => v * S));
      items.push(makeItem(strokes, cx, cy, ang));
      picks.push(items.length - 1);
      break;
    }
  }
  const tpl = (list) => list.map((f) => {
    const b = bounds(layoutSeq(f, 1, () => 0.5, slant, 0));
    return { w: b.x1 - b.x0, h: b.y1 - b.y0 };
  });
  const ft = tpl(FORMULAS);
  const tries = Math.round(16e3 * density);
  for (let t = 0; t < tries; t++) {
    const fi = Math.floor(r() * FORMULAS.length);
    const sz = size * (0.85 + r() * 0.4);
    const ang = (r() * 2 - 1) * tilt;
    const cx = r() * TW, cy = r() * TH;
    const [hw, hh] = rotBox(ft[fi].w * sz, ft[fi].h * sz, ang, pad);
    if (!tryPlace(cx, cy, hw, hh)) continue;
    items.push(makeItem(layoutSeq(FORMULAS[fi], sz, r, slant, wob), cx, cy, ang));
    picks.push(items.length - 1);
  }
  const st = tpl(SHORT);
  const shortTries = Math.round(9e3 * density);
  for (let t = 0; t < shortTries; t++) {
    const fi = Math.floor(r() * SHORT.length);
    const sz = size * (0.8 + r() * 0.3);
    const ang = (r() * 2 - 1) * tilt;
    const cx = r() * TW, cy = r() * TH;
    const [hw, hh] = rotBox(st[fi].w * sz, st[fi].h * sz, ang, pad * 0.7);
    if (!tryPlace(cx, cy, hw, hh)) continue;
    items.push(makeItem(layoutSeq(SHORT[fi], sz, r, slant, wob), cx, cy, ang));
  }
  const dots = Math.round(Math.max(0, num(adv.dotCount, 300)));
  for (let n = 0; n < dots; n++) {
    for (let a = 0; a < 8; a++) {
      const cx = r() * TW, cy = r() * TH;
      const mark = r();
      const w = mark < 0.75 ? 0.6 : size * 0.4;
      if (!tryPlace(cx, cy, w / 2 + 1, w / 2 + 1)) continue;
      const s = mark < 0.75 ? [[0, 0, 0.5, 0.25]] : mark < 0.9 ? [[-w / 2, 0, w / 2, 0], [0, -w / 2, 0, w / 2]] : [[-w / 2, 0, w / 2, 0]];
      items.push(makeItem(s, cx, cy, (r() * 2 - 1) * 20));
      break;
    }
  }
  return { items, picks };
}
function parseColor(c) {
  if (typeof c !== "string") return null;
  const m = c.match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/i);
  if (!m) return null;
  const s = m[0];
  if (s[0] === "#") {
    let h = s.slice(1);
    if (h.length === 3 || h.length === 4) h = h.split("").map((x) => x + x).join("");
    const n = parseInt(h.slice(0, 6), 16);
    if (isNaN(n)) return null;
    return [n >> 16 & 255, n >> 8 & 255, n & 255, h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1];
  }
  const p = s.replace(/rgba?\(|\)/gi, "").split(/[\s,\/]+/).filter(Boolean).map(parseFloat);
  if (p.length < 3) return null;
  return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
}
function colorLut(ink, flash) {
  const a = parseColor(ink) ?? [242, 242, 242, 1];
  const b = parseColor(flash) ?? [255, 255, 255, 1];
  const out = [];
  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    out.push(
      `rgba(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)},${a[3] + (b[3] - a[3]) * t})`
    );
  }
  return out;
}
const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
function strokePart(ctx, pts, len) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  let acc = 0;
  for (let q = 2; q < pts.length; q += 2) {
    const x0 = pts[q - 2], y0 = pts[q - 1], x1 = pts[q], y1 = pts[q + 1];
    const d = Math.hypot(x1 - x0, y1 - y0);
    if (acc + d >= len) {
      const t = d > 0 ? (len - acc) / d : 0;
      ctx.lineTo(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
      break;
    }
    ctx.lineTo(x1, y1);
    acc += d;
  }
  ctx.stroke();
}


const __originkitPresetProps = {
  "advanced": {
    "gap": 3,
    "seed": 7,
    "tilt": 10,
    "grain": 0,
    "slant": 8,
    "fadeMs": 400,
    "wobble": 4,
    "blankMs": 300,
    "density": 100,
    "spawnMs": 250,
    "dotCount": 300,
    "settleMs": 600,
    "textSize": 11,
    "vignette": 0,
    "driftRate": 2,
    "hoverInMs": 300,
    "hoverPush": 12,
    "driftAngle": 215,
    "flashColor": "#FFFFFF",
    "hoverOutMs": 600,
    "inkOpacity": 100,
    "pressBoost": 200,
    "writeMaxMs": 2e3,
    "writeMinMs": 1200,
    "hoverRadius": 15,
    "sketchCount": 100,
    "hatchSpacing": 3
  }
};


window.initChalkflowGeometry = function(root, canvas, customProps) {
  if (!root || !canvas) return null;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const defaultProps = {
    speed: 40,
    direction: 127,
    scale: 140,
    ink: 'rgba(226, 236, 247, 0.75)',
    background: '#071526',
    rewrites: 20,
    stroke: 3.2,
    ...__originkitPresetProps,
    ...(customProps || {}),
    advanced: {
      ...__originkitPresetProps.advanced,
      flashColor: '#e8a020',
      ...((customProps && customProps.advanced) || {})
    }
  };

  const props = withMovedControls(defaultProps);
  const propsRef = { current: props };

  
                        let W = 0, H = 0, dpr = 1;
    const resize = () => {
      W = root.offsetWidth;
      H = root.offsetHeight;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(W * dpr));
      canvas.height = Math.max(1, Math.round(H * dpr));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(root);
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ptr = { x: 0, y: 0, inside: false, down: false };
    let over = 0, down = 0;
    const onMove = (e) => {
      ptr.x = e.offsetX;
      ptr.y = e.offsetY;
      ptr.inside = true;
    };
    const onEnter = (e) => {
      ptr.x = e.offsetX;
      ptr.y = e.offsetY;
      ptr.inside = true;
    };
    const onLeave = () => {
      ptr.inside = false;
    };
    const onDown = (e) => {
      ptr.x = e.offsetX;
      ptr.y = e.offsetY;
      ptr.down = true;
    };
    const onUp = () => {
      ptr.down = false;
    };
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerenter", onEnter);
    canvas.addEventListener("pointerleave", onLeave);
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    const noise = document.createElement("canvas");
    noise.width = noise.height = 160;
    const nctx = noise.getContext("2d");
    let grainPattern = null;
    if (nctx) {
      const img = nctx.createImageData(160, 160);
      for (let i = 0; i < img.data.length; i += 4) {
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
        img.data[i + 3] = Math.random() * 255;
      }
      nctx.putImageData(img, 0, 0);
      grainPattern = ctx.createPattern(noise, "repeat");
    }
    let field = null;
    let fieldKey = "";
    const active = /* @__PURE__ */ new Map();
    let T = 0, ox = 0, oy = 0;
    let spawnAcc = -1;
    let lut = [];
    let lutKey = "";
    let last = -1;
    let raf = 0;
    const loop = (now) => {
      raf = requestAnimationFrame(loop);
      let dt = last < 0 ? 0 : (now - last) / 1e3;
      last = now;
      if (dt > 0.05) dt = 0.05;
      if (W < 2 || H < 2) return;
      const p = propsRef.current;
      const adv = { ...ADVANCED_DEFAULTS, ...p.advanced ?? {} };
      const key = [adv.seed, adv.textSize, adv.density, adv.sketchCount, adv.dotCount, adv.gap, adv.tilt, adv.slant, adv.wobble, adv.hatchSpacing].join("|");
      if (!field || key !== fieldKey) {
        field = buildField(adv);
        fieldKey = key;
        active.clear();
      }
      const items = field.items;
      const lk = `${p.ink}|${adv.flashColor}`;
      if (lk !== lutKey) {
        lut = colorLut(p.ink ?? "#F2F2F2", adv.flashColor);
        lutKey = lk;
      }
      const sp = reduce ? 0 : clamp(num(p.speed, 50), 0, 100) / 50;
      const dtA = dt * sp;
      T += dtA;
      const u = H / 800 * (Math.max(10, num(p.scale, 100)) / 100);
      const VW = W / u, VH = H / u;
      const rate = num(adv.driftRate, 2) / 100 * (W / u);
      const ang = mod(num(p.direction, 215), 360) * Math.PI / 180;
      ox = mod(ox - Math.cos(ang) * rate * dtA, TW);
      oy = mod(oy - Math.sin(ang) * rate * dtA, TH);
      const fade = Math.max(0, num(adv.fadeMs, 400)) / 1e3;
      const blank = Math.max(0, num(adv.blankMs, 300)) / 1e3;
      const settle = Math.max(1e-3, num(adv.settleMs, 600) / 1e3);
      active.forEach((A, idx) => {
        if (T - A.t0 > fade + blank + A.D + settle) active.delete(idx);
      });
      const spawnInt = Math.max(0.05, num(adv.spawnMs, 250) / 1e3);
      const maxActive = clamp(Math.round(num(p.rewrites, 8)), 0, 40);
      if (spawnAcc < 0) spawnAcc = spawnInt;
      spawnAcc += dtA;
      let guard = 0;
      while (sp > 0 && spawnAcc >= spawnInt && guard++ < 8) {
        spawnAcc -= spawnInt;
        if (active.size >= maxActive || field.picks.length === 0) continue;
        for (let tries = 0; tries < 40; tries++) {
          const idx = field.picks[Math.floor(Math.random() * field.picks.length)];
          if (active.has(idx)) continue;
          const it = items[idx];
          const sx = mod(it.x - ox, TW), sy = mod(it.y - oy, TH);
          const m = Math.min(it.r, 40);
          const okX = VW >= TW - 1 || sx > m && sx < VW - m;
          const okY = VH >= TH - 1 || sy > m && sy < VH - m;
          if (!okX || !okY) continue;
          const wMin = Math.max(0.05, num(adv.writeMinMs, 1200) / 1e3);
          const wMax = Math.max(wMin, num(adv.writeMaxMs, 2e3) / 1e3);
          const k2 = clamp(it.total / (num(adv.textSize, 11) * 70), 0, 1);
          active.set(idx, { t0: T, D: wMin + (wMax - wMin) * k2 });
          break;
        }
      }
      if (spawnAcc > spawnInt) spawnAcc = spawnInt;
      const hov = reduce ? 0 : Math.max(0, num(adv.hover, 50)) / 50;
      const tin = Math.max(0.01, num(adv.hoverInMs, 300) / 1e3) / 3;
      const tout = Math.max(0.01, num(adv.hoverOutMs, 600) / 1e3) / 3;
      const tgt = ptr.inside ? 1 : 0;
      over += (tgt - over) * (1 - Math.exp(-dt / (tgt > over ? tin : tout)));
      const dTgt = ptr.down ? 1 : 0;
      down += (dTgt - down) * (1 - Math.exp(-dt / (dTgt > down ? tin : tout)));
      const pAmt = over * hov;
      const R = num(adv.hoverRadius, 15) / 100 * VW;
      const pushMax = num(adv.hoverPush, 12) * (W / 1200) / u * (1 + down * (num(adv.pressBoost, 200) / 100 - 1));
      const mxd = ptr.x / u, myd = ptr.y / u;
      const cw = canvas.width, ch = canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      const bg = parseColor(p.background ?? "#000000") ?? [0, 0, 0, 1];
      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = `rgba(${bg[0]},${bg[1]},${bg[2]},${bg[3]})`;
      ctx.fillRect(0, 0, cw, ch);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineWidth = clamp(num(p.stroke, 2), 0.5, 8) * 0.65 / (Math.max(10, num(p.scale, 100)) / 100);
      const baseAlpha = clamp(num(adv.inkOpacity, 100), 0, 100) / 100;
      ctx.globalAlpha = baseAlpha;
      const k = dpr * u;
      let cur = -1;
      for (let n = 0; n < items.length; n++) {
        const it = items[n];
        const A = active.get(n);
        const sx0 = mod(it.x - ox, TW), sy0 = mod(it.y - oy, TH);
        for (let X = sx0 - TW; X < VW + it.r; X += TW) {
          if (X + it.r < 0) continue;
          for (let Y = sy0 - TH; Y < VH + it.r; Y += TH) {
            if (Y + it.r < 0) continue;
            let px = 0, py = 0, f = 0;
            if (pAmt > 1e-3 && R > 0) {
              const dx = X - mxd, dy = Y - myd;
              const d = Math.hypot(dx, dy);
              if (d < R) {
                const q = 1 - d / R;
                f = q * q * (3 - 2 * q) * pAmt;
                const push = pushMax * f / (d || 1);
                px = dx * push;
                py = dy * push;
              }
            }
            ctx.setTransform(k, 0, 0, k, (X + px) * k, (Y + py) * k);
            if (!A) {
              const li = Math.min(32, Math.round(f * 32));
              if (li !== cur) {
                ctx.strokeStyle = lut[li];
                cur = li;
              }
              ctx.stroke(it.path);
              continue;
            }
            cur = -1;
            const e = T - A.t0;
            if (e < fade) {
              const a = 1 - (e / fade) ** 2;
              ctx.globalAlpha = baseAlpha * a;
              ctx.strokeStyle = lut[Math.min(32, Math.round(f * 32))];
              ctx.stroke(it.path);
              ctx.globalAlpha = baseAlpha;
            } else if (e >= fade + blank) {
              const tw = e - fade - blank;
              for (let s = 0; s < it.s.length; s++) {
                const sk = it.total > 0 ? A.D * it.cum[s] / it.total : 0;
                const dk = it.total > 0 ? A.D * it.lens[s] / it.total : 0;
                if (tw < sk) break;
                let b = 1;
                if (tw >= sk + dk) {
                  b = clamp(1 - (tw - sk - dk) / settle, 0, 1);
                  ctx.strokeStyle = lut[Math.min(32, Math.round(Math.max(b, f) * 32))];
                  strokePart(ctx, it.s[s], Infinity);
                } else {
                  const pr = dk > 1e-6 ? easeInOutCubic((tw - sk) / dk) : 1;
                  ctx.strokeStyle = lut[32];
                  strokePart(ctx, it.s[s], it.lens[s] * pr);
                }
              }
            }
          }
        }
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      const grain = clamp(num(adv.grain, 0), 0, 100) / 100;
      if (grain > 0 && grainPattern) {
        const rx = Math.floor(Math.random() * 160), ry = Math.floor(Math.random() * 160);
        ctx.globalAlpha = grain * 0.45;
        ctx.setTransform(1, 0, 0, 1, -rx, -ry);
        ctx.fillStyle = grainPattern;
        ctx.fillRect(0, 0, cw + rx, ch + ry);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
      }
      const vig = clamp(num(adv.vignette, 0), 0, 100) / 100;
      if (vig > 0) {
        const gr = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.25, cw / 2, ch / 2, Math.hypot(cw, ch) / 2);
        gr.addColorStop(0, "rgba(0,0,0,0)");
        gr.addColorStop(1, `rgba(0,0,0,${vig})`);
        ctx.fillStyle = gr;
        ctx.fillRect(0, 0, cw, ch);
      }
    };
    raf = requestAnimationFrame(loop);
    

  return function destroy() {
    cancelAnimationFrame(raf);
    ro.disconnect();
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerenter', onEnter);
    canvas.removeEventListener('pointerleave', onLeave);
    canvas.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
  };
};
})();
