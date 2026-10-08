// VR-16 / ENG-STRIPE: one-sided accent edges ("side lines") on boxes are banned.
// Catches the three ways they are drawn:
//   a) a one-sided border (border-inline/block-start/end, or physical top/left/...) that is thick or accent-coloured,
//      on a block that is a box (has border-radius, background or padding): cards with a coloured top edge,
//      nav items with a left bar, alerts with a left stripe;
//   b) a pseudo-element bar pinned to one side (position absolute, inset at 0 on that side, thin in one axis,
//      filled with an accent): the "selected" bar on rows and nav items;
//   c) an inset box-shadow with an offset and no blur in an accent colour (the shadow trick for the same bar).
// Allowed: underline indicators at block-end (tabs, horizontal nav), connectors/rails without a box (Stepper),
// legend swatches, neutral thin dividers (structure-border), full rings on all sides (outline / 0 0 0 spread).
const ACCENT = /var\(--(?:color-interaction|color-semantic|attention-c\d|nav-item-indicator|color-focus-ring|color-brand|button-[a-z-]*background)[a-z0-9-]*\)|\b(?:Highlight)\b/;
const THICK = /var\(--border-width-(?:thick|medium|heavy)\)|\b(?:[3-9]|\d{2,})px\b/;
// split on a separator at paren depth 0 (values like calc(-1 * var(--x)) stay whole)
function splitTop(v, sep) {
  const out = []; let d = 0, cur = '';
  for (const ch of v) {
    if (ch === '(') d++; else if (ch === ')') d--;
    if (d === 0 && (sep === ' ' ? /\s/.test(ch) : ch === sep)) { if (cur.trim()) out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
const ONE_SIDE = /^(border-(?:inline|block)-(?:start|end)|border-(?:top|bottom|left|right))(?:-(color|width))?$/;

function blocks(css) {
  const out = [];
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
  const re = /([^{};]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(clean))) {
    const line = clean.slice(0, m.index).split('\n').length + (m[1].match(/^\s*\n*/)[0].split('\n').length - 1);
    const decls = {};
    for (const d of m[2].split(';')) {
      const i = d.indexOf(':');
      if (i < 0) continue;
      decls[d.slice(0, i).trim()] = d.slice(i + 1).trim();
    }
    out.push({ selector: m[1].trim().replace(/\s+/g, ' '), decls, line });
  }
  return out;
}

export function findStripes(css, file = '') {
  const hits = [];
  for (const { selector, decls, line } of blocks(css)) {
    if (/@keyframes|^(?:from|to|\d+%)$/.test(selector)) continue;
    const isBox = ['border-radius', 'background', 'background-color', 'padding', 'padding-inline', 'padding-block'].some((k) => k in decls && !/^(?:0|none|transparent)$/.test(decls[k]));
    // a) one-sided border on a box
    for (const [k, v] of Object.entries(decls)) {
      const p = k.match(ONE_SIDE);
      if (!p) continue;
      const accent = ACCENT.test(v) && !/transparent/.test(v);
      const thick = p[2] !== 'color' && THICK.test(v);
      const transparentThick = thick && /transparent/.test(v); // reserved space for a stripe added on a state rule
      if ((accent || thick || transparentThick) && isBox) hits.push({ file, line, selector, rule: 'a', detail: `${k}: ${v}` });
      else if (p[2] === 'color' && accent && /\[(?:aria-(?:current|selected|checked|pressed)|data-(?:status|active|selected|current))/.test(selector) && !/::(?:before|after)/.test(selector)) hits.push({ file, line, selector, rule: 'a', detail: `${k}: ${v} (state colours a one-sided edge)` });
    }
    // b) pseudo-element bar on one side
    if (/::(?:before|after)/.test(selector) && /absolute|fixed/.test(decls.position || '')) {
      const bg = decls.background || decls['background-color'] || '';
      const thinInline = /var\(--(?:border-width-[a-z]+|space-1)\)|\b[1-6]px\b/.test(decls['inline-size'] || '');
      const thinBlock = /var\(--(?:border-width-[a-z]+|space-1)\)|\b[1-6]px\b/.test(decls['block-size'] || '');
      const pinnedSide = /^0\b/.test(decls['inset-inline-start'] || '') || /^0\b/.test(decls['inset-inline-end'] || '') || /var\(--space-1\)/.test(decls['inset-inline-start'] || '');
      const pinnedTop = /^0\b/.test(decls['inset-block-start'] || '') && !('inset-block-end' in decls);
      if (ACCENT.test(bg) && ((thinInline && pinnedSide) || (thinBlock && pinnedTop))) hits.push({ file, line, selector, rule: 'b', detail: `pseudo-element bar (${thinInline ? 'inline' : 'block'}-size ${decls['inline-size'] || decls['block-size']})` });
    }
    // c) inset shadow stripe
    const sh = decls['box-shadow'] || '';
    const sides = new Set();
    let first = '';
    for (const part of splitTop(sh, ',')) {
      const t = part.trim();
      if (!/^inset\b/.test(t) || !ACCENT.test(t)) continue;
      const nums = splitTop(t.replace(/^inset\s+/, '').replace(ACCENT, '').trim(), ' ');
      const [x = '0', y = '0', blur = '0'] = nums;
      if (blur !== '0' || (x === '0' && y === '0')) continue;
      sides.add(x !== '0' ? (x.startsWith('calc(-1') || x.startsWith('-') ? 'end' : 'start') : (y.startsWith('calc(-1') || y.startsWith('-') ? 'bottom' : 'top'));
      first = first || t;
    }
    // one side only = stripe; top+bottom or start+end = a band/frame (date range), allowed
    if (sides.size === 1) hits.push({ file, line, selector, rule: 'c', detail: `box-shadow: ${first}` });
  }
  return hits;
}
