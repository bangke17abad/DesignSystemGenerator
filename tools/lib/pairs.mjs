// Mandatory contrast pairs (M02 §5.5), shared by derive-tokens (solver check) and validate (V2, independent recompute).
import { contrast, composite, minCvdDistance, hexToOklab } from './color.mjs';

export const STATUSES = ['critical', 'warning', 'positive', 'info', 'neutral-negative'];
const S = (n) => `color-structure-${n}`;
const SURF4 = ['surface-base', 'surface-sunken', 'surface-raised', 'surface-overlay'].map(S);
const SURF3 = ['surface-base', 'surface-sunken', 'surface-raised'].map(S);
const subtle = (s) => `color-semantic-${s}-subtle`;
const solid = (s) => `color-semantic-${s}`;

/**
 * @param c   resolved colour map for one brand/theme {tokenName: '#rrggbb' or '#rrggbbaa'}
 * @param ctx { stateLayer: {hover,pressed,selected,dragged} | null, translucency: boolean, brandBlock: boolean }
 * @returns [{id, group, fg, bg, ratio|distance, min, kind: 'contrast'|'max'|'cvd'|'delta', pass}]
 */
export function checkPairs(c, ctx = {}) {
  const out = [];
  const hex = (n) => {
    const v = c[n];
    if (typeof v !== 'string') return null;
    return v.length === 9 ? v.slice(0, 7) : v; // alpha handled explicitly where it matters
  };
  const add = (group, fg, bg, min, opts = {}) => {
    const f = opts.fgHex || hex(fg), b = opts.bgHex || hex(bg);
    if (!f || !b) { out.push({ id: `${group}:${fg}|${bg}`, group, fg, bg, min, kind: 'contrast', ratio: null, pass: false, note: 'missing token' }); return; }
    const ratio = contrast(f, b);
    const pass = opts.max ? ratio < min : ratio >= min;
    out.push({ id: `${group}:${fg}|${bg}`, group, fg, bg, min, kind: opts.max ? 'max' : 'contrast', ratio, pass });
  };

  for (const t of ['text-primary', 'text-secondary', 'text-tertiary', 'text-placeholder']) for (const s of SURF4) add('text-on-surface', S(t), s, 4.5);
  const subtleBgs = [...STATUSES.map(subtle), 'color-interaction-subtle', S('selection'), S('highlight')];
  for (const t of ['text-primary', 'text-secondary', 'text-tertiary']) for (const s of subtleBgs) add('text-on-subtle', S(t), s, 4.5);
  for (const t of ['color-interaction-default', 'color-interaction-hover']) for (const s of [...SURF3, 'color-interaction-subtle']) add('link-and-interaction-text', t, s, 4.5);
  for (const st of STATUSES) {
    for (const s of SURF4) add('semantic-text', `color-semantic-${st}-strong`, s, 4.5);
    add('semantic-text', `color-semantic-${st}-strong`, subtle(st), 4.5);
  }
  for (const st of STATUSES) add('content-on-fill', `color-semantic-on-${st}`, solid(st), 4.5);
  add('content-on-fill', 'color-semantic-on-critical', 'color-semantic-critical-strong', 4.5); // destructive button hover (component token)
  for (const f of ['default', 'hover', 'pressed']) add('content-on-fill', 'color-interaction-on-solid', `color-interaction-${f}`, 4.5);
  add('content-on-fill', S('text-oninverse'), S('surface-inverse'), 4.5);
  if (hex('chart-hatch-line')) {
    add('text-on-pattern', S('text-primary'), 'chart-hatch-line', 4.5);
    add('text-on-pattern', S('text-primary'), S('surface-base'), 4.5);
  }
  if (ctx.stateLayer) {
    for (const [name, a] of Object.entries(ctx.stateLayer)) {
      if (!a) continue;
      for (const surf of SURF3) {
        const comp = composite(hex(S('text-primary')), a, hex(surf));
        for (const t of ['text-primary', 'text-secondary']) add('text-on-state-layer', S(t), `${surf}+layer-${name}`, 4.5, { bgHex: comp });
      }
      const compSolid = composite(hex('color-interaction-on-solid'), a, hex('color-interaction-default'));
      add('text-on-state-layer', 'color-interaction-on-solid', `color-interaction-default+layer-${name}`, 4.5, { bgHex: compSolid });
    }
  }
  if (ctx.translucency && c[S('surface-translucent')]) {
    const v = c[S('surface-translucent')];
    const a = v.length === 9 ? parseInt(v.slice(7, 9), 16) / 255 : 1;
    for (const under of ['#000000', '#ffffff']) {
      const comp = composite(v.slice(0, 7), a, under);
      for (const t of ['text-primary', 'text-secondary']) add('text-on-translucency', S(t), `surface-translucent/${under}`, 4.5, { bgHex: comp });
    }
  }
  if (ctx.brandBlock) for (const b of ['color-brand-default', 'color-brand-subtle']) add('brand-block', 'color-brand-on', b, 4.5);
  for (const s of SURF3) add('control-border', S('border-control'), s, 3);
  for (const g of ['color-focus-ring', 'color-interaction-default']) for (const s of SURF4) add('focus-and-interaction-graphic', g, s, 3);
  for (const s of [S('selection'), 'color-interaction-subtle', ...STATUSES.map(subtle)]) add('focus-inset', 'color-focus-ring', s, 3);
  for (const s of [S('surface-inverse'), ...STATUSES.map(solid)]) add('focus-inverse', 'color-focus-ring-inverse', s, 3);
  for (const st of STATUSES) {
    for (const s of SURF4) add('semantic-graphic', solid(st), s, 3);
    add('semantic-graphic', solid(st), subtle(st), 3);
  }
  for (let i = 1; i <= 5; i++) for (const s of ['surface-base', 'surface-raised'].map(S)) add('dataviz-categorical', `chart-cat-${i}`, s, 3);
  // Sequential scale (engine 1.8.0 fix): neighbours must differ by ΔL ≥ 0.08 (OKLab); the darkest-emphasis step ≥ 3:1 on the base.
  const seq = [100, 300, 500, 700, 900].map((k) => `chart-seq-${k}`);
  if (seq.every((n) => hex(n))) {
    for (let i = 1; i < seq.length; i++) {
      const d = Math.abs(hexToOklab(hex(seq[i]))[0] - hexToOklab(hex(seq[i - 1]))[0]);
      out.push({ id: `dataviz-sequential:${seq[i]}|${seq[i - 1]}`, group: 'dataviz-sequential', fg: seq[i], bg: seq[i - 1], min: 0.08, kind: 'delta', distance: Math.round(d * 1000) / 1000, pass: d >= 0.08 });
    }
    add('dataviz-sequential', 'chart-seq-900', S('surface-base'), 3);
  }
  const cvdPairs = [['chart-cat-1', 'chart-cat-2'], ['chart-cat-2', 'chart-cat-3'], ['chart-cat-3', 'chart-cat-4'], ['chart-cat-4', 'chart-cat-5'],
    [solid('critical'), solid('positive')], [solid('warning'), solid('positive')]];
  for (const [a, b] of cvdPairs) {
    if (!hex(a) || !hex(b)) continue;
    const { distance, worst } = minCvdDistance(hex(a), hex(b));
    out.push({ id: `cvd:${a}|${b}`, group: a.startsWith('chart') ? 'cvd-dataviz' : 'cvd-semantic', fg: a, bg: b, min: 0.04, kind: 'cvd', distance, worst, pass: distance >= 0.04 });
  }
  for (const b of ['border', 'border-strong']) add('intentionally-low', S(b), S('surface-base'), 3, { max: true });
  return out;
}

/** Groups whose failure blocks (vs advisory). CVD on semantic colours is advisory because I2 guarantees icon + text. */
export const ADVISORY_GROUPS = new Set(['cvd-semantic']);
