// Color math for the design-system engine. Zero dependencies, deterministic.
// sRGB <-> OKLab/OKLCH (Ottosson), WCAG 2.x contrast, gamut mapping by chroma reduction,
// colour-vision-deficiency simulation (Machado, Oliveira & Fernandes 2009, severity 1.0).

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function hexToRgb(hex) {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`invalid hex: ${hex}`);
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}
export function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((c) => Math.round(clamp01(c) * 255).toString(16).padStart(2, '0')).join('');
}

export function linRgbToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
export function oklabToLinRgb([L, a, b]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}
export const oklchToOklab = ([L, C, h]) => [L, C * Math.cos((h * Math.PI) / 180), C * Math.sin((h * Math.PI) / 180)];
export function oklabToOklch([L, a, b]) {
  const C = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return [L, C, C < 1e-4 ? 0 : h];
}
export const hexToOklab = (hex) => linRgbToOklab(hexToRgb(hex).map(toLin));
export const hexToOklch = (hex) => oklabToOklch(hexToOklab(hex));

const inGamut = (lin) => lin.every((c) => c >= -1e-5 && c <= 1 + 1e-5);

/** OKLCH -> hex, reducing chroma (binary search) until the colour fits sRGB. Returns {hex, C}. */
export function oklchToHex(L, C, h) {
  L = Math.min(1, Math.max(0, L));
  let lin = oklabToLinRgb(oklchToOklab([L, C, h]));
  if (!inGamut(lin)) {
    let lo = 0, hi = C;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklabToLinRgb(oklchToOklab([L, mid, h])))) lo = mid; else hi = mid;
    }
    C = lo;
    lin = oklabToLinRgb(oklchToOklab([L, C, h]));
  }
  return { hex: rgbToHex(lin.map((c) => toGam(clamp01(c)))), C };
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(toLin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** WCAG 2.x contrast ratio, rounded down to 2 decimals so a reported pass is never a rounding artefact. */
export function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  const r = (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  return Math.floor(r * 100) / 100;
}

/** Alpha-composite fg (hex, alpha) over bg (hex) in sRGB gamma space (how browsers paint). */
export function composite(fg, alpha, bg) {
  const f = hexToRgb(fg), b = hexToRgb(bg);
  return rgbToHex(f.map((c, i) => c * alpha + b[i] * (1 - alpha)));
}

const MACHADO = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
export const CVD_TYPES = Object.keys(MACHADO);
export function simulateCvd(hex, type) {
  const M = MACHADO[type];
  const lin = hexToRgb(hex).map(toLin);
  const out = M.map((row) => clamp01(row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2]));
  return rgbToHex(out.map(toGam));
}
export function oklabDistance(h1, h2) {
  const a = hexToOklab(h1), b = hexToOklab(h2);
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
/** Smallest OKLab distance between two colours across all three CVD simulations (and normal vision). */
export function minCvdDistance(h1, h2) {
  let min = oklabDistance(h1, h2), worst = 'normal';
  for (const t of CVD_TYPES) {
    const d = oklabDistance(simulateCvd(h1, t), simulateCvd(h2, t));
    if (d < min) { min = d; worst = t; }
  }
  return { distance: Math.round(min * 1000) / 1000, worst };
}
export const hueDistance = (h1, h2) => { const d = Math.abs(h1 - h2) % 360; return d > 180 ? 360 - d : d; };
export const round = (x, n = 3) => Math.round(x * 10 ** n) / 10 ** n;
