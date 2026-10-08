#!/usr/bin/env node
// Phase 1: design-language.json + brief.normalized.json -> assets/tokens.json (DTCG, 3 layers, all brand × theme × density modes),
// reports/contrast-report.md, reports/contrast.json. Deterministic; no network; no dependencies.
// Usage: node tools/derive-tokens.mjs <brief.normalized.json> <outDir>   (reads <outDir>/assets/design-language.json)
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { oklchToHex, hexToOklch, contrast, hueDistance, oklabDistance, round } from './lib/color.mjs';
import { checkPairs, STATUSES, ADVISORY_GROUPS } from './lib/pairs.mjs';
import { readJson, writeJson, writeText } from './lib/tokens.mjs';

const ENGINE = '1.8.0';
const STEPS = 12;
// Two ramps per family (engine 1.8.0): fine resolution near white for light themes and near black for dark themes.
// Step 1 is always the lightest, step 12 the darkest.
const LTABLE = {
  light: [null, 0.993, 0.975, 0.95, 0.92, 0.88, 0.82, 0.73, 0.62, 0.52, 0.44, 0.35, 0.24],
  dark: [null, 0.97, 0.91, 0.83, 0.74, 0.64, 0.54, 0.44, 0.36, 0.30, 0.255, 0.215, 0.18],
};
const Lstep = (i, pol = "light") => LTABLE[pol][i];
const SEM_HUE = { critical: 25, warning: 75, positive: 155, info: 250 };

// Role plan per theme base. dir = direction (in steps) that increases contrast of a foreground against the surfaces.
const PLAN = {
  light: { dir: 1, surf: { base: 1, sunken: 2, raised: 1, overlay: 1, inverse: 12 }, text: { primary: 12, secondary: 10, tertiary: 9, placeholder: 9, disabled: 6, oninverse: 1 },
    border: { border: 4, strong: 6, control: 8 }, skeleton: 4, solid: { critical: 10, warning: 7, positive: 10, info: 10, 'neutral-negative': 10 }, strong: 11, subtle: 2,
    isub: 2, iborder: 8, sel: 3, hl: 2, hatch: 5, seq: [2, 5, 7, 9, 11], scrimAlpha: 0.48, catStart: 9 },
  dark: { dir: -1, surf: { base: 11, sunken: 12, raised: 10, overlay: 10, inverse: 2 }, text: { primary: 1, secondary: 3, tertiary: 5, placeholder: 5, disabled: 7, oninverse: 12 },
    border: { border: 9, strong: 7, control: 6 }, skeleton: 9, solid: { critical: 5, warning: 4, positive: 5, info: 5, 'neutral-negative': 5 }, strong: 3, subtle: 9,
    isub: 9, iborder: 6, sel: 9, hl: 9, hatch: 9, seq: [10, 8, 6, 4, 2], scrimAlpha: 0.64, catStart: 5 },
  'hc-light': { dir: 1, surf: { base: 1, sunken: 2, raised: 1, overlay: 1, inverse: 12 }, text: { primary: 12, secondary: 12, tertiary: 11, placeholder: 11, disabled: 7, oninverse: 1 },
    border: { border: 4, strong: 6, control: 11 }, skeleton: 4, solid: { critical: 11, warning: 7, positive: 11, info: 11, 'neutral-negative': 11 }, strong: 12, subtle: 2,
    isub: 2, iborder: 11, sel: 3, hl: 2, hatch: 5, seq: [2, 5, 7, 9, 12], scrimAlpha: 0.64, catStart: 10 },
  'hc-dark': { dir: -1, surf: { base: 12, sunken: 12, raised: 11, overlay: 11, inverse: 1 }, text: { primary: 1, secondary: 1, tertiary: 2, placeholder: 2, disabled: 6, oninverse: 12 },
    border: { border: 9, strong: 8, control: 3 }, skeleton: 9, solid: { critical: 4, warning: 3, positive: 4, info: 4, 'neutral-negative': 4 }, strong: 2, subtle: 9,
    isub: 9, iborder: 3, sel: 9, hl: 9, hatch: 9, seq: [10, 8, 6, 4, 1], scrimAlpha: 0.72, catStart: 4 },
};

function makeRamp(h, cmax, neutral = false) {
  return { light: rampFor(h, cmax, neutral, "light"), dark: rampFor(h, cmax, neutral, "dark") };
}
function rampFor(h, cmax, neutral, pol) {
  const r = [null];
  for (let i = 1; i <= STEPS; i++) {
    const L = Lstep(i, pol);
    const taper = neutral ? 1 : Math.min(1, Math.max(0.18, 1 - ((L - 0.62) / 0.42) ** 2));
    const { hex } = oklchToHex(L, cmax * taper, h);
    r.push(hex);
  }
  return r;
}
function order(start, dir) {
  const o = [start];
  for (let s = start + dir; s >= 1 && s <= STEPS; s += dir) o.push(s);
  for (let s = start - dir; s >= 1 && s <= STEPS; s -= dir) o.push(s);
  return o;
}
function pick(start, dir, test) {
  for (const s of order(Math.min(STEPS, Math.max(1, start)), dir)) if (test(s)) return { step: s, ok: true };
  return { step: start, ok: false };
}
const nearestStep = (L, pol = "light") => { let best = 1; for (let i = 1; i <= STEPS; i++) if (Math.abs(Lstep(i, pol) - L) < Math.abs(Lstep(best, pol) - L)) best = i; return best; };
const hex2 = (a) => Math.round(a * 255).toString(16).padStart(2, '0');

export function deriveTokens(brief, lang) {
  const D = lang.decisions;
  const notes = [], assumptions = [], adrs = [];
  const themes = D.L12.value.themes;
  const brands = D.L2.value.brands;
  const multi = brands.length > 1;
  const fname = (f, b) => (multi ? `${f}-${b}` : f);
  const densities = D.L5.value.density_modes;
  const axes = { theme: themes.map((t) => t.name), brand: brands.map((b) => b.id), density: densities };

  // ---------- families ----------
  const C2 = D.L2.value;
  const fam = {}; // name -> {h, c, ramp, seed?}
  const addFam = (name, h, c, neutral = false, seed = null) => { fam[name] = { h, c, ramp: makeRamp(h, c, neutral), seed }; };
  const interaction = {};
  for (const b of brands) {
    let ih = C2.interaction.h, ic = C2.interaction.c, il = C2.interaction.l, seed = null;
    if (C2.interaction.source === 'neutral') { ih = typeof C2.neutral.h === 'number' ? C2.neutral.h : ih; }
    if (C2.interaction.source === 'brand' && b.interaction_hex) { [il, ic, ih] = hexToOklch(b.interaction_hex); seed = b.interaction_hex.toLowerCase(); }
    interaction[b.id] = { h: ih, c: ic, l: il, l_dark: C2.interaction.l_dark, seed };
    addFam(fname('interaction', b.id), ih, ic, ic < 0.03, seed);
    const nh = C2.neutral.h === 'interaction' ? ih : C2.neutral.h;
    addFam(fname('neutral', b.id), nh, C2.neutral.c, true);
    // brand family
    let bh = ih, bc = ic, bl = il, bseed = seed;
    if (C2.brand_role !== 'interaction') {
      const bx = b.interaction_hex || b.accent_hexes?.[0];
      if (bx) { [bl, bc, bh] = hexToOklch(bx); bseed = bx.toLowerCase(); }
      else if (C2.brand_role === 'block') {
        ({ h: bh, c: bc, l: bl } = C2.brand_default_block);
        assumptions.push({ statement: `Blok merek default OKLCH ${bh} · ${bc} · ${bl} dipakai untuk brand ${b.id}.`, reason: 'B6 brands tanpa warna merek', default_taken: 'blok default archetype (§4.5 c1)' });
      }
    }
    fam[fname('brand', b.id)] = { h: bh, c: bc, l: bl, ramp: makeRamp(bh, Math.max(bc, 0.001), bc < 0.03), seed: bseed };
    // sequential data-viz family follows interaction hue (250 when interaction is near-neutral)
    addFam(fname('seq', b.id), ic < 0.06 ? 250 : ih, Math.max(0.08, D.L10.value.chroma));
  }
  // semantic hues, jointly for all brands (§5.3 step 1, §4.8 rule 3)
  const semHue = { ...SEM_HUE };
  let infoNeutral = C2.info === 'neutral';
  for (const s of ['critical', 'warning', 'positive', 'info']) {
    if (s === 'info' && infoNeutral) continue;
    const clashing = Object.values(interaction).filter((i) => i.c >= 0.08);
    const worst = (h) => Math.min(...clashing.map((i) => hueDistance(h, i.h)), 360);
    if (!clashing.length || worst(semHue[s]) >= 30) continue;
    if (s === 'info') { infoNeutral = true; notes.push('info memakai varian netral karena bentrok hue dengan warna interaksi (§5.3).'); continue; }
    let best = semHue[s];
    for (let d = -10; d <= 10; d++) if (worst(SEM_HUE[s] + d) > worst(best)) best = SEM_HUE[s] + d;
    semHue[s] = (best + 360) % 360;
    if (worst(best) < 30) adrs.push({ id: `ADR-HUE-${s}`, statement: `Hue ${s} (${best}°) berjarak ${round(worst(best), 1)}° dari warna interaksi (< 30°). Warna merek tidak diubah; status dibedakan oleh ikon dan teks (I2).` });
    notes.push(`hue ${s} digeser ke ${semHue[s]}° (pemisahan dari interaksi).`);
  }
  const semC = C2.semantic_chroma_max;
  for (const s of ['critical', 'warning', 'positive']) addFam(s, semHue[s], semC);
  addFam('info', infoNeutral ? 250 : semHue.info, infoNeutral ? 0 : semC, infoNeutral);
  addFam('gray', 0, 0, true); // neutral-negative and brand-independent ink
  // categorical data-viz
  const catHues = [...D.L10.value.categorical_hues];
  const strongInter = Object.values(interaction).filter((i) => i.c >= 0.08);
  if (strongInter.length && strongInter.some((i) => hueDistance(catHues[0], i.h) < 20)) {
    const idx = catHues.findIndex((h) => strongInter.every((i) => hueDistance(h, i.h) >= 20));
    if (idx > 0) { const [h] = catHues.splice(idx, 1); catHues.unshift(h); notes.push(`urutan chart-cat diputar: hue ${h}° menjadi chart-cat-1 agar tidak sama dengan warna interaksi (engine 1.8.0).`); }
  }
  catHues.forEach((h, i) => addFam(`chart-${i + 1}`, h, D.L10.value.chroma));
  const [divA, divB] = D.L10.value.diverging;
  addFam('div-a', divA, D.L10.value.chroma);
  addFam('div-b', divB, D.L10.value.chroma);

  // ---------- solve per theme ----------
  const assign = {}; // mode -> name -> {fam, step} | {seed:fam} | {alpha: {base, a}} | {literal}
  const failures = [];
  const L16 = D.L16.value, L15 = D.L15.value;
  const stateLayer = L16.strategy === 'state-layer' ? { hover: 0.08, pressed: 0.12, selected: 0.12, dragged: 0.16 } : null;
  const brandBlock = C2.brand_role === 'block';

  for (const theme of themes) {
    const P = PLAN[theme.base];
    const dir = P.dir;
    const tonal = theme.base === 'dark' && D.L7.value.dark_strategy === 'tonal';
    const pol = theme.base.includes("dark") ? "dark" : "light";
    const H = (f, s) => fam[f].ramp[pol][s];
    const E = (f, s) => ({ fam: f, step: s, pol, hex: H(f, s) });
    // surfaces per brand
    const surf = {};
    for (const b of brands) {
      const nf = fname('neutral', b.id);
      const sp = { ...P.surf };
      if (tonal) { sp.raised = sp.base - 1; sp.overlay = sp.base - 2; }
      surf[b.id] = Object.fromEntries(Object.entries(sp).map(([k, s]) => [k, E(nf, s)]));
    }
    const allSurf = (keys = ['base', 'sunken', 'raised', 'overlay']) => brands.flatMap((b) => keys.map((k) => surf[b.id][k].hex));
    // semantic families (joint across brands)
    const sem = {};
    for (const st of STATUSES) {
      const f = st === 'neutral-negative' ? 'gray' : st;
      const subtle = E(f, P.subtle);
      const onFor = (hx) => { const lo = H(f, 1), hi = H(f, 12); return contrast(lo, hx) >= contrast(hi, hx) ? 1 : 12; };
      const solidPick = pick(P.solid[st], dir, (s) => {
        const hx = H(f, s);
        return allSurf(['base', 'sunken', 'raised']).every((x) => contrast(hx, x) >= 3) && contrast(hx, subtle.hex) >= 3 && contrast(H(f, onFor(hx)), hx) >= 4.5;
      });
      if (!solidPick.ok) failures.push(`${theme.name}: color-semantic-${st} tidak menemukan langkah yang lolos`);
      const solidHex = H(f, solidPick.step);
      const onStep = onFor(solidHex);
      const strongPick = pick(P.strong, dir, (s) => [...allSurf(), subtle.hex].every((x) => contrast(H(f, s), x) >= 4.5));
      if (!strongPick.ok) failures.push(`${theme.name}: color-semantic-${st}-strong tidak lolos 4.5:1`);
      sem[st] = { solid: { fam: f, step: solidPick.step }, strong: { fam: f, step: strongPick.step }, subtle: { fam: f, step: P.subtle }, on: { fam: f, step: onStep } };
    }
    // CVD separation for semantic pairs: nudge positive lightness if needed (advisory if it cannot be fixed; I2 carries meaning)
    for (const other of ['critical', 'warning']) {
      const d = () => require_cvd(H('positive', sem.positive.solid.step), H(other, sem[other].solid.step));
      if (d() >= 0.04) continue;
      for (const delta of [-dir, dir]) {
        const s = sem.positive.solid.step + delta;
        if (s < 1 || s > STEPS) continue;
        const hx = H('positive', s);
        const onS = contrast(H('positive', 1), hx) >= contrast(H('positive', 12), hx) ? 1 : 12;
        const ok = allSurf(['base', 'sunken', 'raised']).every((x) => contrast(hx, x) >= 3) && contrast(H('positive', onS), hx) >= 4.5 && require_cvd(hx, H(other, sem[other].solid.step)) >= 0.04;
        if (ok) { sem.positive.solid.step = s; sem.positive.on.step = onS; notes.push(`${theme.name}: positive digeser ke langkah ${s} untuk pemisahan buta warna terhadap ${other}.`); break; }
      }
    }

    for (const b of brands) {
      const mode = `${b.id}/${theme.name}`;
      const A = (assign[mode] = {});
      const nf = fname('neutral', b.id), inf = fname('interaction', b.id), bf = fname('brand', b.id);
      const S = surf[b.id];
      for (const k of ['base', 'sunken', 'raised', 'overlay', 'inverse']) A[`color-structure-surface-${k}`] = S[k];
      const surf4 = ['base', 'sunken', 'raised', 'overlay'].map((k) => S[k].hex);
      const surf3 = ['base', 'sunken', 'raised'].map((k) => S[k].hex);
      for (const st of STATUSES) {
        const x = sem[st];
        A[`color-semantic-${st}`] = E(x.solid.fam, x.solid.step);
        A[`color-semantic-${st}-strong`] = E(x.strong.fam, x.strong.step);
        A[`color-semantic-${st}-subtle`] = E(x.subtle.fam, x.subtle.step);
        A[`color-semantic-on-${st}`] = E(x.on.fam, x.on.step);
      }
      // interaction
      const I = interaction[b.id];
      const isub = E(inf, P.isub);
      const onBest = (hx) => (contrast(H(nf, 1), hx) >= contrast(H(nf, 12), hx) ? 1 : 12);
      const layerOk = (hx) => !stateLayer || Object.values(stateLayer).every((a) => contrast(H(nf, onBest(hx)), mix(H(nf, onBest(hx)), a, hx)) >= 4.5);
      const interOk = (hx) => [...surf4, isub.hex].every((x) => contrast(hx, x) >= 4.5) && contrast(H(nf, onBest(hx)), hx) >= 4.5 && layerOk(hx);
      const targetL = theme.base.startsWith('hc') ? (dir > 0 ? Math.min(I.l, 0.35) : Math.max(1.05 - I.l, 0.8))
        : dir > 0 ? I.l : (I.l_dark ?? Math.min(0.82, Math.max(0.62, 1.05 - I.l)));
      let def;
      if (I.seed && !theme.base.startsWith('hc') && interOk(I.seed)) {
        def = { seed: inf, hex: I.seed };
        notes.push(`${mode}: warna merek ${I.seed} dipakai persis sebagai interaction-default.`);
      } else {
        const p = pick(nearestStep(targetL, pol), dir, (s) => interOk(H(inf, s)));
        if (!p.ok) failures.push(`${mode}: color-interaction-default tidak lolos`);
        def = E(inf, p.step);
        if (I.seed && dir > 0 && !theme.base.startsWith('hc')) {
          const dE = round(oklabDistance(I.seed, def.hex) * 100, 1);
          assumptions.push({ statement: `Warna merek ${I.seed} (brand ${b.id}) tidak lolos sebagai teks/interaksi di ${theme.name}; dipakai langkah ramp ${p.step} (${def.hex}, ΔE_OK ${dE}). Warna asli tetap di color-brand-default untuk peran non-teks.`, reason: '§4.6 langkah 5: warna merek tidak diubah diam-diam', default_taken: `langkah ${p.step}` });
        }
      }
      A['color-interaction-default'] = def;
      const baseStep = def.step ?? nearestStep(hexToOklch(def.hex)[0], pol);
      const clampS = (s) => Math.min(STEPS, Math.max(1, s));
      // hover/pressed move away from the surface; at the end of the ramp they move back (I4: the state must change a token)
      const hd = baseStep + 2 * dir >= 1 && baseStep + 2 * dir <= STEPS ? dir : -dir;
      A['color-interaction-hover'] = E(inf, clampS(baseStep + hd));
      A['color-interaction-pressed'] = E(inf, clampS(baseStep + 2 * hd));
      A['color-interaction-subtle'] = isub;
      const ib = pick(P.iborder, dir, (s) => surf3.every((x) => contrast(H(inf, s), x) >= 3));
      A['color-interaction-border'] = E(inf, ib.step);
      const onS = [1, 12].sort((a, c) => Math.min(...['default', 'hover', 'pressed'].map((k) => contrast(H(nf, c), A[`color-interaction-${k}`].hex))) - Math.min(...['default', 'hover', 'pressed'].map((k) => contrast(H(nf, a), A[`color-interaction-${k}`].hex))))[0];
      A['color-interaction-on-solid'] = E(nf, onS);
      // selection, highlight
      const selF = I.c < 0.03 ? nf : inf;
      A['color-structure-selection'] = E(selF, P.sel);
      A['color-structure-highlight'] = E('warning', P.hl);
      // text
      const subtleBgs = [...STATUSES.map((st) => A[`color-semantic-${st}-subtle`].hex), isub.hex, A['color-structure-selection'].hex, A['color-structure-highlight'].hex];
      for (const [role, start] of Object.entries(P.text)) {
        const name = `color-structure-text-${role}`;
        if (role === 'disabled') { A[name] = E(nf, start); continue; }
        if (role === 'oninverse') {
          const p = pick(start, -dir, (s) => contrast(H(nf, s), S.inverse.hex) >= 4.5);
          A[name] = E(nf, p.step);
          continue;
        }
        const bgs = role === 'placeholder' ? surf4 : [...surf4, ...subtleBgs];
        const p = pick(start, dir, (s) => bgs.every((x) => contrast(H(nf, s), x) >= 4.5));
        if (!p.ok) failures.push(`${mode}: ${name} tidak lolos 4.5:1 di semua latar`);
        A[name] = E(nf, p.step);
      }
      // borders
      const low = (start) => pick(start, -dir, (s) => contrast(H(nf, s), S.base.hex) < 3 && H(nf, s) !== S.base.hex);
      A['color-structure-border'] = E(nf, low(P.border.border).step);
      A['color-structure-border-strong'] = E(nf, low(P.border.strong).step);
      const bc = pick(P.border.control, dir, (s) => surf3.every((x) => contrast(H(nf, s), x) >= 3));
      A['color-structure-border-control'] = E(nf, bc.step);
      A['color-structure-skeleton'] = E(nf, P.skeleton);
      A['color-structure-shadow'] = D.L7.value.shadow_color === 'text-primary' ? { ...A['color-structure-text-primary'] } : E(nf, 12);
      A['color-structure-scrim'] = { alpha: { fam: 'gray', step: 12, pol: 'dark', a: P.scrimAlpha }, hex: fam.gray.ramp.dark[12] + hex2(P.scrimAlpha) };
      // focus
      const ringBgs = [...surf4];
      const insetBgs = [A['color-structure-selection'].hex, isub.hex, ...STATUSES.map((st) => A[`color-semantic-${st}-subtle`].hex)];
      const fr = pick(baseStep, dir, (s) => ringBgs.every((x) => contrast(H(inf, s), x) >= 3) && insetBgs.every((x) => contrast(H(inf, s), x) >= 3));
      if (!fr.ok) failures.push(`${mode}: color-focus-ring tidak lolos 3:1`);
      A['color-focus-ring'] = E(inf, fr.step);
      const invBgs = [S.inverse.hex, ...STATUSES.map((st) => A[`color-semantic-${st}`].hex)];
      const fri = [1, 12, 2, 11].map((s) => ({ s, m: Math.min(...invBgs.map((x) => contrast(H(nf, s), x))) })).sort((a, c) => c.m - a.m)[0];
      if (fri.m < 3) failures.push(`${mode}: color-focus-ring-inverse ${fri.m}:1 < 3:1`);
      A['color-focus-ring-inverse'] = E(nf, fri.s);
      // material
      let alpha = L15.translucency ? L15.surface_alpha : 1;
      if (L15.translucency) {
        const okA = (a) => ['#000000', '#ffffff'].every((u) => ['text-primary', 'text-secondary'].every((t) => contrast(A[`color-structure-${t}`].hex, mix(S.base.hex, a, u)) >= 4.5));
        while (alpha < 1 && !okA(alpha)) alpha = round(alpha + 0.04, 2);
        if (alpha !== L15.surface_alpha) notes.push(`${mode}: material-surface-alpha dinaikkan ke ${alpha} agar teks lolos 4.5:1 di atas latar terburuk.`);
      }
      A['color-structure-surface-translucent'] = alpha < 1 ? { alpha: { fam: nf, step: S.base.step, pol, a: alpha }, hex: S.base.hex + hex2(alpha) } : { ...S.base };
      A.__surfaceAlpha = alpha;
      // brand
      if (C2.brand_role === 'interaction') {
        A['color-brand-default'] = { ...def }; A['color-brand-subtle'] = { ...isub }; A['color-brand-on'] = { ...A['color-interaction-on-solid'] };
      } else {
        const B = fam[bf];
        const nonText = (hx) => surf3.every((x) => contrast(hx, x) >= 3);
        let bd;
        if (C2.brand_role === 'block') {
          // brand-on must reach 4.5:1 on brand-default and brand-subtle with ONE colour (§5.5 blok merek)
          const sub = H(bf, P.subtle);
          const okWith = (hx) => [1, 12].some((o) => contrast(H(nf, o), hx) >= 4.5 && contrast(H(nf, o), sub) >= 4.5);
          if (B.seed && okWith(B.seed)) bd = { seed: bf, hex: B.seed };
          else {
            const p = pick(nearestStep(B.l ?? 0.9, pol), -dir, (s2) => okWith(H(bf, s2)));
            bd = E(bf, p.step);
            if (B.seed) assumptions.push({ statement: `Blok merek ${B.seed} (brand ${b.id}) tidak bisa memuat teks 4.5:1 di ${theme.name}; dipakai langkah ${p.step} (${bd.hex}). Warna asli tetap sebagai primitif seed.`, reason: '§4.6 langkah 5', default_taken: `langkah ${p.step}` });
          }
        } else if (B.seed && [S.base.hex, S.raised.hex].every((x) => contrast(B.seed, x) >= 3)) bd = { seed: bf, hex: B.seed }; // accents sit on base/raised, not sunken wells
        else { const p = pick(nearestStep(B.l ?? 0.5, pol), dir, (s) => nonText(H(bf, s))); bd = E(bf, p.step); }
        A['color-brand-default'] = bd;
        A['color-brand-subtle'] = E(bf, P.subtle);
        const onB = [1, 12].map((s) => ({ s, m: Math.min(contrast(H(nf, s), bd.hex), contrast(H(nf, s), H(bf, P.subtle))) })).sort((a, c) => c.m - a.m)[0];
        A['color-brand-on'] = E(nf, onB.s);
      }
      // data-viz
      let prevL = null;
      for (let i = 1; i <= 5; i++) {
        const f = `chart-${i}`;
        const p = pick(P.catStart, dir, (s) => [S.base.hex, S.raised.hex].every((x) => contrast(H(f, s), x) >= 3) && (prevL == null || Math.abs(Lstep(s, pol) - prevL) >= 0.05));
        if (!p.ok) failures.push(`${mode}: chart-cat-${i} tidak lolos`);
        A[`chart-cat-${i}`] = E(f, p.step);
        prevL = Lstep(p.step, pol);
      }
      A['chart-cat-other'] = E(nf, theme.base.includes('dark') ? 6 : 7);
      const sf = fname('seq', b.id);
      [100, 300, 500, 700, 900].forEach((k, i) => { A[`chart-seq-${k}`] = E(sf, P.seq[i]); });
      A['chart-hatch-line'] = E(nf, P.hatch);
      const divS = theme.base.includes('dark') ? [4, 6] : [9, 7];
      A['chart-div-neg-strong'] = E('div-a', divS[0]);
      A['chart-div-neg'] = E('div-a', divS[1]);
      A['chart-div-mid'] = E(nf, theme.base.includes('dark') ? 9 : 3);
      const posFam = 'div-b';
      A['chart-div-pos'] = E(posFam, divS[1]);
      A['chart-div-pos-strong'] = E(posFam, divS[0]);
      if (brief.domain?.spatial) {
        A['map-land'] = E(nf, theme.base.includes('dark') ? 11 : 2);
        A['map-water'] = E('info', theme.base.includes('dark') ? 10 : 3);
        A['map-boundary'] = { ...A['color-structure-border-control'] };
        A['map-route'] = { ...A['color-interaction-default'] };
      }
    }
  }
  function require_cvd(a, b) { return CVD(a, b); }

  // ---------- verification of the solved palette ----------
  const contrastModes = {};
  for (const [mode, A] of Object.entries(assign)) {
    const c = Object.fromEntries(Object.entries(A).filter(([k]) => !k.startsWith('__')).map(([k, v]) => [k, v.hex]));
    const checks = checkPairs(c, { stateLayer, translucency: !!L15.translucency, brandBlock });
    contrastModes[mode] = checks;
  }

  // ---------- assemble tokens.json ----------
  const primitive = { color: {} };
  for (const [f, v] of Object.entries(fam)) {
    primitive.color[f] = {};
    for (const pl of ["light", "dark"]) {
      primitive.color[f][pl] = {};
      for (let i = 1; i <= STEPS; i++) primitive.color[f][pl][String(i)] = { $type: 'color', $value: v.ramp[pl][i], $extensions: { ds: { role: `primitive ${f} ${pl} step ${i}`, varies_by: [], source: 'derived', trace: '§5.3', derivation: { seed: `oklch(${Lstep(i, pl)} ${round(v.c)} ${round(typeof v.h === 'number' ? v.h : 0, 1)})`, ramp_step: i } } } };
    }
    if (v.seed) primitive.color[f].seed = { $type: 'color', $value: v.seed, $extensions: { ds: { role: `brand seed ${f}`, varies_by: [], source: 'brief', trace: 'B6 brands' } } };
  }
  const alphaPrims = {};
  const refOf = (a) => {
    if (a.seed) return `{primitive.color.${a.seed}.seed}`;
    if (a.alpha) {
      const key = `${a.alpha.fam}-${a.alpha.pol}-${a.alpha.step}-a${Math.round(a.alpha.a * 100)}`;
      alphaPrims[key] = fam[a.alpha.fam].ramp[a.alpha.pol][a.alpha.step] + hex2(a.alpha.a);
      return `{primitive.color.alpha.${key}}`;
    }
    return `{primitive.color.${a.fam}.${a.pol}.${a.step}}`;
  };
  const semantic = {};
  const modesList = Object.keys(assign);
  const names = Object.keys(assign[modesList[0]]).filter((k) => !k.startsWith('__')).sort();
  const defMode = modesList[0];
  for (const n of names) {
    const modes = {};
    for (const m of modesList) modes[m] = refOf(assign[m][n]);
    const brandsVary = brands.length > 1 && themes.some((t) => new Set(brands.map((b) => modes[`${b.id}/${t.name}`])).size > 1);
    const themesVary = new Set(modesList.map((m) => modes[m])).size > 1 && (brands.length === 1 || brands.some((b) => new Set(themes.map((t) => modes[`${b.id}/${t.name}`])).size > 1));
    const ratio = n.startsWith('color-structure-surface') ? null : contrast(assign[defMode][n].hex.slice(0, 7), assign[defMode]['color-structure-surface-base'].hex);
    semantic[n] = {
      $type: 'color', $value: modes[defMode],
      $extensions: { ds: {
        role: roleOf(n), varies_by: [...(brandsVary ? ['brand'] : []), ...(themesVary || brands.length === 1 ? ['theme'] : [])], modes,
        source: 'derived', trace: traceOf(n),
        derivation: { seed: assign[defMode][n].seed ? 'brand seed' : assign[defMode][n].alpha ? `alpha ${assign[defMode][n].alpha.a}` : `${assign[defMode][n].fam} step ${assign[defMode][n].step}`, ...(ratio ? { contrast: { 'color-structure-surface-base': ratio } } : {}) },
      } },
    };
  }
  primitive.color.alpha = Object.fromEntries(Object.keys(alphaPrims).sort().map((k) => [k, { $type: 'color', $value: alphaPrims[k], $extensions: { ds: { role: `alpha primitive ${k}`, varies_by: [], source: 'derived', trace: '§5.2' } } }]));

  addScales(semantic, D, brief, themes, brands, assign, densities);
  const component = componentTokens(D);
  const tokens = {
    $metadata: { engine_version: ENGINE, package_version: brief.package_version || '0.1.0', dtcg_reference: 'W3C DTCG format (Not verified against the pinned version)', axes },
    primitive, semantic, component,
  };
  return { tokens, contrastModes, notes, assumptions, adrs, failures };
}

// Component layer (§5.1 lapis 3, §6.8 naming): aliases to semantic tokens, resolved from L3 (attention treatment) and L16 (state strategy).
// Components read these, never raw semantic choices, so the same reference CSS renders every design language correctly.
function componentTokens(D) {
  const C = {};
  const sem = (n) => `{semantic.${n}}`;
  const add = (name, $type, $value, trace, role) => { C[name] = { $type, $value, $extensions: { ds: { role: role || name.replace(/-/g, ' '), varies_by: [], source: 'derived', trace } } }; };
  const layer = D.L16.value.strategy === 'state-layer';
  // actions
  const swap = (hover, base) => (layer ? base : hover);
  add('button-primary-container-background', 'color', sem('color-interaction-default'), 'L2, L16');
  add('button-primary-container-background-hover', 'color', sem(swap('color-interaction-hover', 'color-interaction-default')), 'L16');
  add('button-primary-container-background-pressed', 'color', sem(swap('color-interaction-pressed', 'color-interaction-default')), 'L16');
  add('button-primary-label-color', 'color', sem('color-interaction-on-solid'), 'L2');
  add('button-secondary-container-background', 'color', sem('color-structure-surface-raised'), 'L2');
  add('button-secondary-container-background-hover', 'color', sem(swap('color-structure-surface-sunken', 'color-structure-surface-raised')), 'L16');
  add('button-secondary-container-background-pressed', 'color', sem(swap('color-structure-selection', 'color-structure-surface-raised')), 'L16');
  add('button-secondary-container-border', 'color', sem('color-structure-border-control'), 'L6, SC 1.4.11');
  add('button-secondary-label-color', 'color', sem('color-structure-text-primary'), 'L2');
  add('button-tertiary-container-background-hover', 'color', sem(swap('color-interaction-subtle', 'color-structure-surface-base')), 'L16');
  add('button-tertiary-container-background-pressed', 'color', sem(swap('color-interaction-subtle', 'color-structure-surface-base')), 'L16');
  add('button-tertiary-label-color', 'color', sem('color-interaction-default'), 'L2');
  add('button-destructive-container-background', 'color', sem('color-semantic-critical'), 'L3');
  add('button-destructive-container-background-hover', 'color', sem(swap('color-semantic-critical-strong', 'color-semantic-critical')), 'L16');
  add('button-destructive-container-background-pressed', 'color', sem(swap('color-semantic-critical-strong', 'color-semantic-critical')), 'L16');
  add('button-destructive-label-color', 'color', sem('color-semantic-on-critical'), 'L3');
  const lip = /tombol|kontrol/.test(D.L7.value.usage || '');
  add('button-container-shadow', 'shadow', lip ? sem('elevation-1') : 'none', 'L7', lip ? 'bayangan tombol dari L7' : 'tombol datar (L7)');
  // form controls
  add('control-container-background', 'color', sem('color-structure-surface-raised'), 'L2');
  add('control-container-background-readonly', 'color', sem('color-structure-surface-sunken'), '§6.9');
  add('control-container-border', 'color', sem('color-structure-border-control'), 'SC 1.4.11');
  add('control-container-border-hover', 'color', sem('color-structure-text-tertiary'), 'L16');
  add('control-container-border-invalid', 'color', sem('color-semantic-critical'), '§12.2');
  add('control-value-color', 'color', sem('color-structure-text-primary'), 'L2');
  add('control-placeholder-color', 'color', sem('color-structure-text-placeholder'), 'STD-3');
  add('control-checked-background', 'color', sem('color-interaction-default'), 'L2');
  add('control-checked-mark', 'color', sem('color-interaction-on-solid'), 'L2');
  // rows, navigation, selection
  add('row-background-hover', 'color', sem(swap('color-structure-surface-sunken', 'color-structure-surface-base')), 'L16');
  add('row-background-selected', 'color', sem('color-structure-selection'), 'I2');
  add('nav-item-background-selected', 'color', sem('color-structure-selection'), 'I2');
  add('nav-item-indicator', 'color', sem('color-interaction-default'), 'I2');
  // attention classes (L3): background / foreground / border / icon per class
  const fam = { C1: 'critical', C2: 'warning', C3: 'neutral-negative', C4: 'positive', C5: 'info', C6: null };
  for (const [cls, f] of Object.entries(fam)) {
    const t = D.L3.value.attention[cls];
    const k = cls.toLowerCase();
    let bg, fg, border, icon;
    if (!f) { bg = t === 'tinted' ? sem('color-structure-surface-sunken') : 'transparent'; fg = sem('color-structure-text-primary'); border = t === 'outline' ? sem('color-structure-border-control') : 'transparent'; icon = sem('color-structure-text-secondary'); }
    else if (t === 'filled') { bg = sem(`color-semantic-${f}`); fg = sem(`color-semantic-on-${f}`); border = sem(`color-semantic-${f}`); icon = sem(`color-semantic-on-${f}`); }
    else if (t === 'tinted') { bg = sem(`color-semantic-${f}-subtle`); fg = sem(`color-semantic-${f}-strong`); border = sem(`color-semantic-${f}-subtle`); icon = sem(`color-semantic-${f}`); }
    else if (t === 'outline') { bg = 'transparent'; fg = sem('color-structure-text-primary'); border = sem(`color-semantic-${f}`); icon = sem(`color-semantic-${f}`); }
    else { bg = 'transparent'; fg = sem('color-structure-text-primary'); border = 'transparent'; icon = sem(`color-semantic-${f}`); }
    const role = `kelas ${cls} (${t})`;
    add(`attention-${k}-background`, 'color', bg, 'L3', `${role} latar`);
    add(`attention-${k}-foreground`, 'color', fg, 'L3', `${role} teks`);
    add(`attention-${k}-border`, 'color', border, 'L3', `${role} garis`);
    add(`attention-${k}-icon`, 'color', icon, 'L3', `${role} ikon`);
  }
  return C;
}

function CVD(a, b) {
  return minCvd(a, b);
}
import { minCvdDistance } from './lib/color.mjs';
const minCvd = (a, b) => minCvdDistance(a, b).distance;
const mix = (fg, a, bg) => {
  const f = [1, 3, 5].map((i) => parseInt(fg.slice(i, i + 2), 16)), g = [1, 3, 5].map((i) => parseInt(bg.slice(i, i + 2), 16));
  return '#' + f.map((c, i) => Math.round(c * a + g[i] * (1 - a)).toString(16).padStart(2, '0')).join('');
};

function roleOf(n) {
  if (n.startsWith('color-structure-text')) return `teks ${n.split('-').slice(3).join(' ')}`;
  if (n.startsWith('color-structure-surface')) return `permukaan ${n.split('-').slice(3).join(' ')}`;
  if (n.startsWith('color-semantic')) return `status ${n.replace('color-semantic-', '')}`;
  if (n.startsWith('color-interaction')) return `interaksi ${n.replace('color-interaction-', '')}`;
  if (n.startsWith('chart')) return `data-viz ${n.replace('chart-', '')}`;
  return n.replace(/^color-/, '').replace(/-/g, ' ');
}
function traceOf(n) {
  if (n.startsWith('chart')) return 'L10';
  if (n.startsWith('color-brand')) return 'L2';
  if (n.startsWith('color-semantic')) return 'L3';
  if (n.startsWith('map')) return 'B5';
  return 'L2';
}

const evenRound = (x) => Math.round(x / 2) * 2;
function addScales(T, D, brief, themes, brands, assign, densities) {
  const tok = (name, $type, $value, ds, desc) => { T[name] = { $type, $value, ...(desc ? { $description: desc } : {}), $extensions: { ds: { varies_by: [], source: 'archetype', ...ds } } }; };
  const L4 = D.L4.value, L5 = D.L5.value, L6 = D.L6.value, L7 = D.L7.value, L8 = D.L8.value, L9 = D.L9.value, L15 = D.L15.value, L16 = D.L16.value, L17 = D.L17.value;
  const src = (k) => (D[k].source === 'brief' ? 'brief' : D[k].source === 'org' ? 'org' : 'archetype');
  // fonts
  const fam = (f, fb) => [f, ...fb.split(',').map((s) => s.trim().replace(/^"|"$/g, ''))];
  tok('font-sans', 'fontFamily', fam(L4.families.ui, L4.fallbacks.sans), { role: 'keluarga UI', source: src('L4'), trace: 'L4' });
  tok('font-mono', 'fontFamily', fam(L4.families.mono, L4.fallbacks.mono), { role: 'keluarga mono', source: src('L4'), trace: 'L4' });
  if (L4.families.display) tok('font-display', 'fontFamily', fam(L4.families.display, /Serif|Playfair/.test(L4.families.display) ? L4.fallbacks.serif : L4.fallbacks.sans), { role: 'keluarga display', source: src('L4'), trace: 'L4' });
  const sc = L4.scale, rb = L4.line_ratio.body, rh = L4.line_ratio.heading;
  const spec = {
    caption: [sc.caption, L4.caption_line, 400, 'supporting'], body: [sc.body, evenRound(sc.body * rb), 400, 'body'], 'body-lg': [sc.body_lg, evenRound(sc.body_lg * rb), 400, 'body'],
    label: [sc.label, evenRound(sc.label * rb), L4.label_weight, 'body'], code: [sc.code, evenRound(sc.code * rb), 400, 'body'],
    h3: [sc.h3, evenRound(sc.h3 * rh), L4.heading_weight, 'body'], h2: [sc.h2, evenRound(sc.h2 * rh), L4.heading_weight, 'body'], h1: [sc.h1, evenRound(sc.h1 * rh), L4.heading_weight, 'body'], display: [sc.display, evenRound(sc.display * rh), L4.heading_weight, 'body'],
  };
  for (const [k, [size, line, weight, cls]] of Object.entries(spec)) {
    const ds = { role: `tipe ${k}`, text_class: cls, source: src('L4'), trace: cls === 'body' ? 'L4, STD-2' : 'L4' };
    tok(`type-${k}-size`, 'dimension', size, ds);
    tok(`type-${k}-line`, 'dimension', line, ds);
    tok(`type-${k}-weight`, 'fontWeight', weight, ds);
    const familyTok = k === 'code' ? 'font-mono' : (['display', 'h1', 'h2'].includes(k) && L4.families.display ? 'font-display' : 'font-sans');
    tok(`type-${k}-family`, 'fontFamily', `{semantic.${familyTok}}`, ds);
    tok(`type-${k}-tracking`, 'dimension', ['h3', 'h2', 'h1', 'display'].includes(k) && size >= 24 ? L4.tracking_heading.replace(/^0$/, '0em') : '0em', ds);
  }
  // space
  for (const k of L5.space.steps) tok(k === 0.5 ? 'space-half' : `space-${k}`, 'dimension', k * 4, { role: `spasi ${k}×4`, source: src('L5'), trace: 'L5' });
  // shape
  const r = L6.radius;
  for (const [k, v] of Object.entries({ none: 0, xs: Math.floor(r.control / 2), sm: r.control, md: r.container, lg: r.overlay, full: r.full ?? 9999 })) tok(`radius-${k}`, 'dimension', v, { role: `radius ${k}`, source: src('L6'), trace: 'L6' });
  tok('shape-circle', 'dimension', '50%', { role: 'bentuk lingkaran semantik (radio, avatar bulat, spinner); bukan radius dekoratif, tidak terkena larangan radius L13', source: 'baseline', trace: '§6.5' });
  tok('focus-ring-width', 'dimension', 2, { role: 'tebal ring fokus', source: 'baseline', trace: '§6.4, SC 2.4.7' });
  tok('focus-ring-offset', 'dimension', 2, { role: 'jarak ring fokus', source: 'baseline', trace: '§6.4' });
  tok('border-width-thin', 'dimension', L6.border_width.thin, { role: 'border tipis', source: src('L6'), trace: 'L6' });
  tok('border-width-thick', 'dimension', L6.border_width.thick, { role: 'border tebal', source: src('L6'), trace: 'L6' });
  // elevation (per brand × theme)
  const levels = Object.keys(L7.levels).map(Number).sort();
  const modes = Object.keys(assign);
  const elevFor = (lvl, mode) => {
    const theme = themes.find((t) => mode.endsWith('/' + t.name));
    const A = assign[mode];
    const hc = theme.base.startsWith('hc');
    const strategy = hc ? 'border' : theme.base === 'dark' ? L7.dark_strategy : L7.light_strategy;
    const def = L7.levels[lvl];
    const border = [{ color: A['color-structure-border-strong'].hex, offsetX: 0, offsetY: 0, blur: 0, spread: L6.border_width.thin }];
    if (def === 'border' || strategy === 'border') return border;
    const factor = strategy === 'tonal' ? (L7.dark_alpha_factor || 1) : 1;
    const shadowHex = A['color-structure-shadow'].hex;
    const layers = def.map(([x, y, blur, a]) => ({ color: shadowHex + hex2(Math.min(1, a * factor)), offsetX: x, offsetY: y, blur, spread: 0 }));
    if (L7.translucent_border && theme.base === 'dark') layers.push({ color: '#ffffff1f', offsetX: 0, offsetY: 0, blur: 0, spread: 1 });
    return layers;
  };
  T['elevation-0'] = { $type: 'shadow', $value: 'none', $extensions: { ds: { role: 'elevasi 0 (rest)', varies_by: [], source: src('L7'), trace: 'L7' } } };
  for (const l of levels) {
    const m = Object.fromEntries(modes.map((mm) => [mm, elevFor(l, mm)]));
    T[`elevation-${l}`] = { $type: 'shadow', $value: m[modes[0]], $extensions: { ds: { role: `elevasi ${l}`, varies_by: brands.length > 1 ? ['brand', 'theme'] : ['theme'], modes: m, source: src('L7'), trace: 'L7' } } };
  }
  // motion
  tok('motion-instant-duration', 'duration', 0, { role: 'gerak instan', source: 'archetype', trace: 'L8' });
  for (const k of ['fast', 'base', 'slow']) tok(`motion-${k}-duration`, 'duration', L8[k], { role: `gerak ${k}`, source: src('L8'), trace: 'L8' });
  for (const k of ['standard', 'enter', 'exit']) tok(`motion-easing-${k}`, 'cubicBezier', L8.easing[k], { role: `easing ${k}`, source: src('L8'), trace: 'L8' });
  tok('motion-stagger-max', 'duration', L8.stagger_max, { role: 'stagger maksimum', source: src('L8'), trace: 'L8' });
  // sizes
  const [isz, imd, ilg] = L9.sizes;
  tok('icon-sm', 'dimension', isz, { role: 'ikon kecil', source: src('L9'), trace: 'L9' });
  tok('icon-md', 'dimension', imd, { role: 'ikon sedang', source: src('L9'), trace: 'L9' });
  tok('icon-lg', 'dimension', ilg, { role: 'ikon besar', source: src('L9'), trace: 'L9' });
  tok('icon-stroke', 'number', L9.stroke ?? 0, { role: 'tebal garis ikon (0 = set berbasis fill)', source: src('L9'), trace: 'L9' });
  for (const [k, v] of Object.entries({ square: '1/1', photo: '4/3', video: '16/9' })) tok(`aspect-${k}`, 'string', v, { role: `rasio ${k}`, source: 'baseline', trace: '§5.2' });
  const densDelta = { comfortable: 0, compact: -4, spacious: 4 };
  const ch = L5.control_height;
  for (const k of ['sm', 'md', 'lg']) {
    const m = Object.fromEntries(densities.map((d) => [d, ch[k] + densDelta[d]]));
    T[`control-height-${k}`] = { $type: 'dimension', $value: m[densities[0]], $extensions: { ds: { role: `tinggi kontrol ${k} (pointer)`, varies_by: ['density'], modes: m, source: src('L5'), trace: 'L5, STD-4' } } };
  }
  const row = Object.fromEntries(densities.map((d) => [d, Math.max(44, ch.md + 8 + densDelta[d])]));
  T['layout-row-height'] = { $type: 'dimension', $value: row[densities[0]], $extensions: { ds: { role: 'tinggi baris daftar/tabel', varies_by: ['density'], modes: row, source: 'derived', trace: 'L5, STD-4' } } };
  for (const [k, v] of Object.entries({ sm: 24, md: 32, lg: 48, xl: 64 })) tok(`avatar-${k}`, 'dimension', v, { role: `avatar ${k}`, source: 'derived', trace: '§5.2' });
  tok('target-min-pointer', 'dimension', 24, { role: 'area klik minimum pointer', source: 'baseline', trace: 'STD-4, SC 2.5.8' });
  tok('target-min-touch', 'dimension', 44, { role: 'area klik minimum sentuh', source: 'baseline', trace: 'STD-4' });
  T['target-current'] = { $type: 'dimension', $value: 24, $description: 'Runtime: 24 pada pointer halus, 44 di bawah (any-pointer: coarse), target-min-extended di surface glove/in-motion. Ditulis build.mjs ke tokens.css; komponen memakai max(ukuran visual, var(--target-current)).', $extensions: { ds: { role: 'area klik aktif saat runtime', runtime: true, varies_by: [], source: 'baseline', trace: 'STD-4, §5.9' } } };
  const extended = (brief.surfaces || []).some((s) => (s.input_modality || []).some((m) => m === 'glove' || m === 'in-motion'));
  if (extended) tok('target-min-extended', 'dimension', Math.max(48, brief.overrides?.target_min_extended || 0), { role: 'area klik minimum sarung tangan / bergerak', source: 'baseline', trace: 'STD-4' });
  // timing (engine 1.8.0): delays and limits that components used to hard-code
  const timing = { 'tooltip-delay': 500, 'close-delay': 100, 'toast-default': 6000, 'toast-with-action': 10000, 'spinner-max': 2000, 'indicator-delay': 300, 'indicator-min-visible': 500, 'debounce': 300, 'typeahead': 500 };
  for (const [k, v] of Object.entries(timing)) tok(`timing-${k}`, 'duration', v, { role: `waktu ${k}`, source: 'baseline', trace: k.startsWith('toast') ? '§6.5 Toast, SC 2.2.1' : '§6.5, §12.3' });
  // layers, opacity
  const z = { base: 0, sticky: 10, panel: 20, 'nav-scrim': 29, 'nav-overlay': 30, 'overlay-scrim': 39, modal: 40, popover: 50, toast: 60, tooltip: 70 };
  if ((brief.domain?.critical_events || []).length) z.critical = 80;
  for (const [k, v] of Object.entries(z)) tok(`z-${k}`, 'number', v, { role: `lapisan ${k}`, source: 'baseline', trace: '§5.2' });
  tok('opacity-disabled', 'number', 0.4, { role: 'opasitas ikon/gambar disabled', source: 'baseline', trace: '§5.2' });
  // material
  const [b1, b2, b3] = L15.blur;
  tok('material-blur-sm', 'dimension', b1, { role: 'blur material kecil', source: src('L15'), trace: 'L15' });
  tok('material-blur-md', 'dimension', b2, { role: 'blur material sedang', source: src('L15'), trace: 'L15' });
  tok('material-blur-lg', 'dimension', b3, { role: 'blur material besar', source: src('L15'), trace: 'L15' });
  const alphas = Object.fromEntries(Object.entries(assign).map(([m, A]) => [m, A.__surfaceAlpha]));
  T['material-surface-alpha'] = { $type: 'number', $value: alphas[modes[0]], $extensions: { ds: { role: 'alfa permukaan translucent', varies_by: new Set(Object.values(alphas)).size > 1 ? ['theme'] : [], ...(new Set(Object.values(alphas)).size > 1 ? { modes: alphas } : {}), source: src('L15'), trace: 'L15, §5.5' } } };
  // state & feedback
  const sl = L16.strategy === 'state-layer' ? { hover: 0.08, pressed: 0.12, selected: 0.12, dragged: 0.16 } : { hover: 0, pressed: 0, selected: 0, dragged: 0 };
  for (const [k, v] of Object.entries(sl)) tok(`state-layer-${k}-opacity`, 'number', v, { role: `opasitas state layer ${k}`, source: src('L16'), trace: 'L16, §6.9' });
  tok('state-press-transform', 'string', L16.press_transform, { role: 'transformasi saat ditekan', source: src('L16'), trace: 'L16' });
  const hasCritical = (brief.domain?.critical_events || []).length > 0;
  for (const h of ['selection', 'success', 'warning', 'error', 'critical']) tok(`haptic-${h}`, 'string', (L16.haptics || []).includes(h) || (h === 'critical' && hasCritical) ? h : 'none', { role: `pola haptic ${h}`, source: src('L16'), trace: 'L16, §14.3' });
  tok('sound-critical', 'string', brief.domain?.critical_events?.find((e) => e.sound_asset)?.sound_asset || 'none', { role: 'suara event kritis', source: 'brief', trace: 'B5' });
  tok('sound-success', 'string', 'none', { role: 'suara keberhasilan', source: src('L16'), trace: 'L16' });
  // layout and breakpoints
  const bp = { mobile: 0, tablet: 600, desktop: 1024, wide: 1440, ...(brief.breakpoints || {}) };
  for (const [k, v] of Object.entries(bp)) tok(`bp-${k}`, 'dimension', v, { role: `breakpoint ${k}`, source: brief.breakpoints ? 'brief' : 'baseline', trace: '§8.1, R11' });
  const lay = { 'layout-bar-height': 56, 'layout-nav-width': 256, 'layout-rail-width': 72, 'layout-panel-width': 400, 'layout-content-min': 480, 'layout-modal-sm': 400, 'layout-modal-md': 560, 'layout-modal-lg': 800 };
  for (const [k, v] of Object.entries(lay)) tok(k, 'dimension', v, { role: k.replace('layout-', 'layout '), source: 'derived', trace: '§8.2' });
  tok('layout-measure', 'dimension', '72ch', { role: 'lebar baca maksimum', source: 'baseline', trace: 'L17' });
  tok('layout-content-max', 'dimension', L17.content_max_px ? L17.content_max_px : '100%', { role: 'lebar konten maksimum', source: src('L17'), trace: 'L17' });
  tok('space-section', 'dimension', L17.section, { role: 'jarak antar seksi', source: src('L17'), trace: 'L17' });
  tok('space-section-lg', 'dimension', L17.section_lg, { role: 'jarak antar seksi besar', source: src('L17'), trace: 'L17' });
}

export function contrastReportMd(tokens, contrastModes, notes, adrs, failures) {
  const lines = ['# Laporan kontras', '', `Engine ${ENGINE}. Dihitung oleh \`tools/derive-tokens.mjs\` dengan rumus WCAG 2.x (rasio dibulatkan ke bawah, 2 desimal). Simulasi buta warna: Machado dkk. 2009, severity 1.0.`, ''];
  lines.push('## Ringkasan per brand × tema', '', '| Mode | Pasangan | Gagal (blocking) | Gagal (advisory) | Rasio teks terendah | Non-teks terendah |', '|---|---|---|---|---|---|');
  for (const [m, checks] of Object.entries(contrastModes)) {
    const fb = checks.filter((c) => !c.pass && !ADVISORY_GROUPS.has(c.group)).length;
    const fa = checks.filter((c) => !c.pass && ADVISORY_GROUPS.has(c.group)).length;
    const text = checks.filter((c) => c.kind === 'contrast' && c.min === 4.5 && c.ratio != null).map((c) => c.ratio);
    const nonText = checks.filter((c) => c.kind === 'contrast' && c.min === 3 && c.ratio != null).map((c) => c.ratio);
    lines.push(`| ${m} | ${checks.length} | ${fb} | ${fa} | ${Math.min(...text)} | ${Math.min(...nonText)} |`);
  }
  if (failures.length) lines.push('', '## Kegagalan solver', '', ...failures.map((f) => `- ${f}`));
  if (notes.length) lines.push('', '## Catatan solver', '', ...notes.map((n) => `- ${n}`));
  if (adrs.length) lines.push('', '## ADR yang dibutuhkan', '', ...adrs.map((a) => `- **${a.id}**: ${a.statement}`));
  for (const [m, checks] of Object.entries(contrastModes)) {
    lines.push('', `## ${m}`, '', '| Kelompok | Depan | Latar | Nilai | Minimum | Status |', '|---|---|---|---|---|---|');
    for (const c of checks) lines.push(`| ${c.group} | \`${c.fg}\` | \`${c.bg}\` | ${c.ratio ?? c.distance}${c.worst ? ` (${c.worst})` : ''} | ${c.kind === 'max' ? '< ' : '≥ '}${c.min} | ${c.pass ? 'PASS' : ADVISORY_GROUPS.has(c.group) ? 'FAIL (advisory, I2)' : 'FAIL'} |`);
  }
  return lines.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [briefPath, outDir] = process.argv.slice(2);
  if (!briefPath || !outDir) { console.error('usage: derive-tokens.mjs <brief.normalized.json> <outDir>'); process.exit(2); }
  const brief = readJson(briefPath);
  const lang = readJson(join(outDir, 'assets', 'design-language.json'));
  const r = deriveTokens(brief, lang);
  writeJson(join(outDir, 'assets', 'tokens.json'), r.tokens);
  writeJson(join(outDir, 'reports', 'contrast.json'), { failures: r.failures, notes: r.notes, adrs: r.adrs, assumptions: r.assumptions, modes: r.contrastModes });
  writeText(join(outDir, 'reports', 'contrast-report.md'), contrastReportMd(r.tokens, r.contrastModes, r.notes, r.adrs, r.failures));
  const blocking = Object.values(r.contrastModes).flat().filter((c) => !c.pass && !ADVISORY_GROUPS.has(c.group)).length;
  console.log(`OK tokens: ${Object.keys(r.tokens.semantic).length} semantic, modes ${Object.keys(r.contrastModes).join(', ')}; contrast blocking failures ${blocking}; solver failures ${r.failures.length}`);
  if (blocking || r.failures.length) process.exitCode = 1;
}
