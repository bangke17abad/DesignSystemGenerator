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
  // engine 1.9.0: page templates (reference/html-first/templates). A template renders only when every component it uses is in
  // scope ({N} + closure); otherwise it is skipped with the missing names (never silently widens the package scope).
  const tplDir = join(ref, 'templates');
  const kebab = (n) => n.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  const compNames = readdirSync(join(ref, 'components')).filter((f) => f.endsWith('.css')).map((f) => f.slice(0, -4));
  const usesOf = (html) => compNames.filter((n) => new RegExp(`class="[^"]*\\bds-${kebab(n)}\\b(?!__|-)`).test(html) || new RegExp(`class="[^"]*\\bds-${kebab(n)}__`).test(html));
  const templates = [], skippedTemplates = [];
  if (opts.templates !== false && existsSync(tplDir)) {
    const shell = readFileSync(join(tplDir, '_shell.html'), 'utf8');
    for (const f of readdirSync(tplDir).filter((x) => /^[a-z][a-z0-9-]*\.html$/.test(x)).sort()) {
      // optional regions: <!-- requires: Chart --> … <!-- /requires --> are dropped when that component is out of scope
      const inScope = (n) => !scoped || scoped.includes(n) || cssList.includes(n);
      const src = readFileSync(join(tplDir, f), 'utf8').replace(/<!-- requires: ([A-Za-z, ]+) -->([\s\S]*?)<!-- \/requires -->\n?/g, (m, names, inner) => (names.split(/,\s*/).every(inScope) ? inner : ''));
      const meta = Object.fromEntries([...(src.match(/^<!--([\s\S]*?)-->/)?.[1].split('\n')[0].matchAll(/(\w+):\s*([^·]+?)\s*(?=·|$)/g) || [])].map((m) => [m[1], m[2].trim()]));
      const html = meta.shell === 'none' ? src : shell + '\n' + src;
      const uses = usesOf(html);
      const notInScope = uses.filter((u) => scoped && !scoped.includes(u) && !cssList.includes(u));
      if (notInScope.length) { skippedTemplates.push({ name: meta.template || f.slice(0, -5), missing: notInScope }); continue; }
      for (const u of uses) if (!cssList.includes(u)) cssList.push(u);
      templates.push({ file: f, src, meta, uses });
    }
  }
  const missing = (opts.components || []).filter((n) => !available.includes(n));
  const order = ['base.css'];
  let css = readFileSync(join(ref, 'base.css'), 'utf8');
  for (const n of cssList.sort()) if (existsSync(join(ref, 'components', `${n}.css`))) { css += '\n' + readFileSync(join(ref, 'components', `${n}.css`), 'utf8'); order.push(`components/${n}.css`); }
  if (templates.length && existsSync(join(tplDir, 'templates.css'))) { css += '\n' + readFileSync(join(tplDir, 'templates.css'), 'utf8'); order.push('templates/templates.css'); }
  // engine 1.9.0: visual profile layer (antd-v6, shadcn) comes after the components so it re-skins anatomy with the same tokens
  const dlang = existsSync(join(outDir, 'assets', 'design-language.json')) ? readJson(join(outDir, 'assets', 'design-language.json')) : null;
  const profile = dlang?.profile || { id: 'engine', icon_set: 'engine', reference_css: null };
  if (profile.reference_css && existsSync(join(ref, profile.reference_css))) { css += '\n' + readFileSync(join(ref, profile.reference_css), 'utf8'); order.push(profile.reference_css); }
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
  const sprite = iconSprite(ref, profile.icon_set);
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
  // profile + template layers ship as sources too (V6 lints them like component CSS)
  const bpSub = (t) => t.replace(/\(--bp-tablet-up\)/g, `(min-width: ${bp('tablet')}px)`).replace(/\(--bp-desktop-up\)/g, `(min-width: ${bp('desktop')}px)`).replace(/\(--bp-wide-up\)/g, `(min-width: ${bp('wide')}px)`).replace(/\(--bp-tablet-down\)/g, `(max-width: ${bp('tablet') - 0.02}px)`).replace(/\(--bp-desktop-down\)/g, `(max-width: ${bp('desktop') - 0.02}px)`).replace(/\(--bp-wide-down\)/g, `(max-width: ${bp('wide') - 0.02}px)`);
  if (profile.reference_css && existsSync(join(ref, profile.reference_css))) writeText(join(outDir, 'src', 'profile', `${profile.id}.css`), rename(bpSub(readFileSync(join(ref, profile.reference_css), 'utf8'))));
  if (templates.length) writeText(join(outDir, 'src', 'templates', 'templates.css'), rename(bpSub(readFileSync(join(tplDir, 'templates.css'), 'utf8'))));
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
  // page templates → <outDir>/templates/<name>.html (same bundle, sprite and namespace as the previews)
  const navData = existsSync(join(tplDir, '_nav.json')) ? readJson(join(tplDir, '_nav.json')) : { groups: [] };
  const navHtml = (current) => navData.groups.map((g, gi) => `${g.label ? `<p class="ds-app-shell__nav-group" id="nav-g${gi}" data-ds-text="supporting">${escapeHtml(g.label)}</p>` : ''}<ul class="ds-app-shell__nav-list" role="list"${g.label ? ` aria-labelledby="nav-g${gi}"` : ''}>${g.items.map((it) => `<li><a class="ds-link ds-app-shell__nav-item" data-variant="standalone" href="${it.href}"${it.id === current ? ' aria-current="page"' : ''}><svg class="ds-icon" aria-hidden="true"><use href="#ds-i-${it.icon}"/></svg><span class="ds-app-shell__nav-label">${escapeHtml(it.label)}</span></a></li>`).join('')}</ul>`).join('\n  ');
  for (const t of templates) {
    const body = t.meta.shell === 'none' ? t.src : readFileSync(join(tplDir, '_shell.html'), 'utf8').replace(/^<!--[\s\S]*?-->\s*/, '').replace('{{nav}}', navHtml(t.meta.current)).replace('{{main}}', t.src);
    const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(t.meta.title || t.file)} · ${escapeHtml(profile.name || profile.id)} template</title>
<link rel="stylesheet" href="../assets/tokens.css">
<link rel="stylesheet" href="../assets/bundle.css">
</head>
<body${t.meta.shell === 'none' ? '' : ' class="ds-app-shell" data-variant="standard" data-ds-module="app-shell"'} data-ds-template="${t.meta.template || t.file.slice(0, -5)}" data-ds-profile="${profile.id}">
${sprite}
${body}
<script src="../assets/bundle.js"></script>
</body>
</html>
`;
    writeText(join(outDir, 'templates', t.file), rename(html));
  }
  return { rendered: list, missing, templates: templates.map((t) => t.file.slice(0, -5)), skippedTemplates };
}
const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const outDir = args[0];
  const get = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
  const comps = get('--components');
  const r = renderPreviews(outDir, { components: comps ? comps.split(',') : null, ns: get('--ns'), lang: get('--lang') });
  console.log(`OK previews: ${r.rendered.length} rendered${r.missing.length ? `; no reference fixture yet: ${r.missing.join(', ')}` : ''} · templates: ${r.templates.join(', ') || 'none'}${r.skippedTemplates.length ? ` (skipped ${r.skippedTemplates.map((x) => `${x.name}: needs ${x.missing.join('+')}`).join('; ')})` : ''}`);
}

// Icon sprite for a set: the profile's set (icons/lucide.json, icons/antd.json) over the engine glyphs (icons.json), so every
// engine icon name resolves. Entries are either a 24-unit stroke body (string) or { viewBox, body } for fill sets.
export function iconSprite(ref, set) {
  const base = readJson(join(ref, 'icons.json'));
  const extra = set && set !== 'engine' && existsSync(join(ref, 'icons', `${set}.json`)) ? readJson(join(ref, 'icons', `${set}.json`)) : {};
  // engine profile: names the placeholder set lacks (users, download, dashboard…) fall back to Lucide (ISC) so templates always resolve
  const fallback = existsSync(join(ref, 'icons', 'lucide.json')) ? readJson(join(ref, 'icons', 'lucide.json')) : {};
  const all = { ...fallback, ...base, ...extra };
  return `<svg xmlns="http://www.w3.org/2000/svg" hidden aria-hidden="true" style="display:none">${Object.entries(all).filter(([k]) => !k.startsWith('$')).map(([k, v]) => {
    const vb = typeof v === 'string' ? '0 0 24 24' : v.viewBox;
    const body = (typeof v === 'string' ? v : v.body).replace(/'/g, '"');
    // fill sets: presentation attributes on a wrapper beat the inherited .ds-icon stroke styling without any profile CSS
    return typeof v === 'string' ? `<symbol id="ds-i-${k}" viewBox="${vb}">${body}</symbol>` : `<symbol id="ds-i-${k}" viewBox="${vb}" data-fill><g fill="currentColor" stroke="none">${body}</g></symbol>`;
  }).join('')}</svg>`;
}
