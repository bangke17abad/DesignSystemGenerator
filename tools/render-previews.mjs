#!/usr/bin/env node
// Phase 11/12: assemble the html-first reference into a package and render one preview page per component (R1: from data).
// Copies base.css + component CSS/JS into assets/bundle.css / assets/bundle.js, substitutes breakpoint placeholders with the
// bp-* token values (V8), renames the "ds" prefix to the namespace when --ns is given, and writes previews/<Name>.html.
// Usage: node tools/render-previews.mjs <outDir> [--components A,B] [--ns NS] [--lang en]
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, writeText } from './lib/tokens.mjs';

const engine = join(dirname(fileURLToPath(import.meta.url)), '..');
const ref = join(engine, 'reference', 'html-first');

export function renderPreviews(outDir, opts = {}) {
  const tokens = readJson(join(outDir, 'assets', 'tokens.json'));
  const sem = tokens.semantic;
  const bp = (k) => sem[`bp-${k}`]?.$value ?? { tablet: 600, desktop: 1024, wide: 1440 }[k];
  const available = readdirSync(join(ref, 'fixtures')).filter((f) => f.endsWith('.html')).map((f) => f.slice(0, -5)).sort();
  // include every reference component the requested ones depend on or compose (catalog depends_on + related), transitively
  const closure = (names) => {
    const out = new Set(names), queue = [...names];
    while (queue.length) {
      const n = queue.shift();
      const p = join(engine, 'catalog', 'components', `${n}.json`);
      if (!existsSync(p)) continue;
      const c = readJson(p);
      for (const d of [...(c.depends_on || [])]) if (!out.has(d)) { out.add(d); queue.push(d); }
    }
    return [...out];
  };
  // default scope = the package's {N} (manifest.json from compose.mjs); without a manifest (engine dev) every reference component
  const scoped = !opts.components && existsSync(join(outDir, 'manifest.json')) ? readJson(join(outDir, 'manifest.json')).components.map((c) => c.name) : null;
  const requested = (opts.components || scoped || available).filter((n) => available.includes(n));
  const list = requested;
  const cssList = closure(requested).filter((n) => available.includes(n) || existsSync(join(ref, 'components', `${n}.css`)));
  // fixtures may compose other components (Button inside PageHeader…): bundle every component whose class appears in the fixtures
  for (const n of available) {
    if (cssList.includes(n)) continue;
    const cls = `ds-${n.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}`;
    if (requested.some((r) => new RegExp(`class="[^"]*\\b${cls}\\b`).test(readFileSync(join(ref, 'fixtures', `${r}.html`), 'utf8')))) cssList.push(n);
  }
  const missing = (opts.components || []).filter((n) => !available.includes(n));
  const order = ['base.css'];
  let css = readFileSync(join(ref, 'base.css'), 'utf8');
  for (const n of cssList.sort()) if (existsSync(join(ref, 'components', `${n}.css`))) { css += '\n' + readFileSync(join(ref, 'components', `${n}.css`), 'utf8'); order.push(`components/${n}.css`); }
  css = css
    .replace(/\(--bp-tablet-up\)/g, `(min-width: ${bp('tablet')}px)`)
    .replace(/\(--bp-desktop-up\)/g, `(min-width: ${bp('desktop')}px)`)
    .replace(/\(--bp-wide-up\)/g, `(min-width: ${bp('wide')}px)`)
    .replace(/\(--bp-tablet-down\)/g, `(max-width: ${bp('tablet') - 0.02}px)`)
    .replace(/\(--bp-desktop-down\)/g, `(max-width: ${bp('desktop') - 0.02}px)`)
    .replace(/\(--bp-wide-down\)/g, `(max-width: ${bp('wide') - 0.02}px)`);
  const leftover = css.match(/--bp-[a-z]+-(up|down)/);
  if (leftover) throw new Error(`unknown breakpoint placeholder ${leftover[0]} (allowed: --bp-tablet|desktop|wide-up|down)`);
  let js = readFileSync(join(ref, 'ds.js'), 'utf8');
  for (const n of cssList.sort()) if (existsSync(join(ref, 'components', `${n}.js`))) js += '\n' + readFileSync(join(ref, 'components', `${n}.js`), 'utf8');
  const icons = readJson(join(ref, 'icons.json'));
  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" hidden aria-hidden="true" style="display:none">${Object.entries(icons).filter(([k]) => !k.startsWith('$')).map(([k, v]) => `<symbol id="ds-i-${k}" viewBox="0 0 24 24">${v.replace(/'/g, '"')}</symbol>`).join('')}</svg>`;
  const ns = (opts.ns || 'ds').toLowerCase();
  const rename = (s) => (ns === 'ds' ? s : s.replace(/\bds-/g, `${ns}-`).replace(/data-ds-/g, `data-${ns}-`).replace(/\bwindow\.DS\b/g, `window.${ns.toUpperCase()}`).replace(/\bDS\./g, `${ns.toUpperCase()}.`).replace(/\[DS\]/g, `[${ns.toUpperCase()}]`));
  // packaged bundles are stripped of comments and indentation (§14C budget); sources stay readable in reference/html-first
  const minCss = (c) => c.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\n\s+/g, '\n').replace(/\n{2,}/g, '\n').replace(/\s*([{};])\s*/g, '$1').trim();
  const minJs = (c) => c.replace(/^\s*\/\*[\s\S]*?\*\/\s*$/gm, '').replace(/^\s*\/\/.*$/gm, '').replace(/^\s+/gm, '').replace(/\n{2,}/g, '\n').trim();
  writeText(join(outDir, 'assets', 'bundle.css'), `/* GENERATED by tools/render-previews.mjs from reference/html-first (${order.length} files). */\n` + rename(opts.pretty ? css : minCss(css)));
  writeText(join(outDir, 'assets', 'bundle.js'), `/* GENERATED by tools/render-previews.mjs from reference/html-first. */\n` + rename(opts.pretty ? js : minJs(js)));
  // per-component sources at the target_mapping path (src/components/<group>/<Name>.css|js), renamed to the namespace; V6 lints these
  for (const n of cssList) {
    const c = existsSync(join(engine, 'catalog', 'components', `${n}.json`)) ? readJson(join(engine, 'catalog', 'components', `${n}.json`)) : null;
    const group = (c?.group || 'internal').toLowerCase().replace(/ /g, '-');
    for (const ext of ['css', 'js']) {
      const src = join(ref, 'components', `${n}.${ext}`);
      if (!existsSync(src)) continue;
      let t = readFileSync(src, 'utf8');
      if (ext === 'css') t = t.replace(/\(--bp-tablet-up\)/g, `(min-width: ${bp('tablet')}px)`).replace(/\(--bp-desktop-up\)/g, `(min-width: ${bp('desktop')}px)`).replace(/\(--bp-wide-up\)/g, `(min-width: ${bp('wide')}px)`).replace(/\(--bp-tablet-down\)/g, `(max-width: ${bp('tablet') - 0.02}px)`).replace(/\(--bp-desktop-down\)/g, `(max-width: ${bp('desktop') - 0.02}px)`).replace(/\(--bp-wide-down\)/g, `(max-width: ${bp('wide') - 0.02}px)`);
      writeText(join(outDir, 'src', 'components', group, `${n}.${ext}`), rename(t));
    }
  }
  const catalog = (n) => { const p = join(engine, 'catalog', 'components', `${n}.json`); return existsSync(p) ? readJson(p) : null; };
  const lang = opts.lang || 'en';
  for (const n of list) {
    const fx = readFileSync(join(ref, 'fixtures', `${n}.html`), 'utf8');
    const c = catalog(n);
    const body = fx.replace(/<section\b([^>]*\bdata-ds-demo="([^"]+)"[^>]*)>/g, (m, attrs, id) => `<section${attrs}${/aria-label=/.test(attrs) ? '' : ` aria-label="${id}"`}>\n  <span class="ds-demo__label" data-ds-text="supporting">${id}</span>`);
    const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${n} · preview</title>
<link rel="stylesheet" href="../assets/tokens.css">
<link rel="stylesheet" href="../assets/bundle.css">
</head>
<body>
${sprite}
<main class="ds-preview" id="main" tabindex="-1">
<header class="ds-stack" data-gap="2">
  <h1 class="ds-text-h2">${n}</h1>
  ${c ? `<p class="ds-text-secondary">${escapeHtml(c.purpose.purpose)}</p>` : ''}
</header>
${body}
</main>
<script src="../assets/bundle.js"></script>
</body>
</html>
`;
    writeText(join(outDir, 'previews', `${n}.html`), rename(html));
  }
  return { rendered: list, missing };
}
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const outDir = args[0];
  const get = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
  const comps = get('--components');
  const r = renderPreviews(outDir, { components: comps ? comps.split(',') : null, ns: get('--ns'), lang: get('--lang') });
  console.log(`OK previews: ${r.rendered.length} rendered${r.missing.length ? `; no reference fixture yet: ${r.missing.join(', ')}` : ''}`);
}
