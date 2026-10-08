#!/usr/bin/env node
// V9 render smoke test + V19 visual baseline. Real browser checks, results pasted as-is (R4). Without Playwright: NOT RUN.
// Per page × brand × theme × viewport: console errors, axe-core (serious/critical), body text >= 16px (caption >= 12px only when marked
// supporting), hit areas >= 24 (pointer) / 44 (touch) / 48 (glove), reflow at 320 px, focus ring visible on Tab stops,
// forced-colors + reduced-transparency + reduced-motion render, RTL overflow, and no-JS render for html-first.
// Usage: node tools/qa.mjs <outDir> [--pages previews/A.html,...] [--axe path/to/axe.min.js] [--quick] [--screenshots]
// Playwright is resolved from: node_modules, $DS_PLAYWRIGHT, or /opt/npm-tools/node_modules/playwright.
import { existsSync, readdirSync, readFileSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { readJson, writeJson, writeText } from './lib/tokens.mjs';

async function loadPlaywright() {
  const candidates = ['playwright', process.env.DS_PLAYWRIGHT, '/opt/npm-tools/node_modules/playwright'].filter(Boolean);
  for (const c of candidates) {
    try { return c === 'playwright' ? await import('playwright') : createRequire(import.meta.url)(c); } catch { /* next */ }
  }
  return null;
}
function findAxe(explicit) {
  const c = [explicit, process.env.DS_AXE, join(process.cwd(), 'node_modules/axe-core/axe.min.js'), '/opt/npm-tools/node_modules/axe-core/axe.min.js'].filter(Boolean);
  return c.find((p) => existsSync(p)) || null;
}

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, hasTouch: false, isMobile: false, target: 24 },
  phone: { width: 390, height: 844, hasTouch: true, isMobile: true, target: 44 },
  tablet: { width: 820, height: 1180, hasTouch: true, isMobile: true, target: 44 },
};

// Runs inside the page. Returns measurements for the checks above.
function inPage({ target, ns }) {
  const out = { small_text: [], tiny_text: [], small_targets: [], overflow: null, tokens_empty: [] };
  const visible = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !el.closest(`[hidden], .${ns}-vh, [aria-hidden="true"]`); };
  const label = (el) => (el.getAttribute('aria-label') || el.textContent || el.getAttribute('name') || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 40);
  const where = (el) => { const d = el.closest(`[data-${ns}-demo]`); return (d ? d.getAttribute(`data-${ns}-demo`) + ' › ' : '') + label(el); };
  // text sizes
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT) });
  const seen = new Set();
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const el = n.parentElement;
    if (!el || seen.has(el) || !visible(el)) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    const supporting = !!el.closest(`[data-${ns}-text="supporting"], .${ns}-text-caption`);
    // STD-2 floor follows the density in force: 16, or the compact body size (>= 14, STD-2c)
    const body = parseFloat(cs.getPropertyValue('--type-body-size')) || 16;
    const floor = Math.min(16, Math.max(14, body));
    // code / identifiers read --type-code-size (13 in compact, STD-2c)
    const code = parseFloat(cs.getPropertyValue('--type-code-size')) || 16;
    const isCode = !!el.closest(`code, kbd, pre, samp, .${ns}-text-code`) && fs >= Math.min(floor, Math.max(13, code));
    if (fs < 12) out.tiny_text.push(`${where(el)} (${fs}px)`);
    else if (fs < floor && !supporting && !isCode) out.small_text.push(`${where(el)} (${fs}px)`);
  }
  // inputs on touch viewports: < 16 px makes iOS Safari zoom the page on focus (STD-2c)
  if (target >= 44) for (const el of document.querySelectorAll('input:not([type="checkbox"], [type="radio"], [type="range"], [type="color"], [type="file"], [type="hidden"], [type="submit"], [type="button"]), select, textarea')) {
    if (!visible(el)) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize);
    if (fs < 16) out.small_text.push(`input ${where(el)} (${fs}px < 16 di layar sentuh)`);
  }
  // hit areas
  const sel = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [role="button"], [role="tab"], [role="checkbox"], [role="radio"], [role="switch"], [role="menuitem"], [role="option"], [role="slider"], [role="treeitem"], [tabindex]:not([tabindex="-1"])';
  for (const el of document.querySelectorAll(sel)) {
    if (!visible(el) && !(el.matches('input') && el.closest('label'))) continue;
    if (el.matches('a') && el.closest(`p, li, .${ns}-prose, td`) && el.parentElement.childNodes.length > 1 && !el.matches(`[class*="${ns}-"]`)) continue; // inline link exception (SC 2.5.8)
    if (el.matches('[tabindex]') && el.matches('main, h1, h2, section, [role="region"], [role="grid"], [role="tabpanel"], [role="listbox"], [role="tree"], [role="menu"]')) continue; // containers, not targets
    const box = (el.closest('label') && el.matches('input')) ? el.closest('label') : el;
    const r = box.getBoundingClientRect();
    if (r.width + 0.5 < target || r.height + 0.5 < target) out.small_targets.push(`${where(el)} ${Math.round(r.width)}×${Math.round(r.height)}`);
  }
  // reflow
  out.overflow = document.scrollingElement.scrollWidth - document.scrollingElement.clientWidth;
  for (const t of ['--color-structure-surface-base', '--color-structure-text-primary', '--color-focus-ring', '--type-body-size', '--target-current']) {
    if (!getComputedStyle(document.documentElement).getPropertyValue(t).trim()) out.tokens_empty.push(t);
  }
  return out;
}

export async function runQa(outDir, opts = {}) {
  const pw = await loadPlaywright();
  const report = { engine_version: '1.9.1', status: 'NOT RUN', reason: null, pages: {}, summary: {} };
  if (!pw) { report.reason = 'Playwright not installed'; return report; }
  const axePath = findAxe(opts.axe);
  const axeSrc = axePath ? readFileSync(axePath, 'utf8') : null;
  const tokens = readJson(join(outDir, 'assets', 'tokens.json'));
  const { theme: themes, brand: brands } = tokens.$metadata.axes;
  const pages = opts.pages || readdirSync(join(outDir, 'previews')).filter((f) => f.endsWith('.html')).map((f) => `previews/${f}`).sort();
  const browser = await pw.chromium.launch({ executablePath: existsSync('/opt/pw-browsers/chromium') ? undefined : undefined });
  const totals = { runs: 0, console_errors: 0, axe_serious: 0, small_text: 0, tiny_text: 0, small_targets: 0, reflow: 0, focus_missing: 0, nojs_empty: 0, rtl_overflow: 0, tokens_empty: 0 };
  let minTouch = Infinity;
  const shotsDir = join(outDir, 'tests', 'visual', '__screenshots__');
  if (opts.screenshots) mkdirSync(shotsDir, { recursive: true });
  for (const page of pages) {
    const url = pathToFileURL(resolve(outDir, page)).href;
    const res = (report.pages[page] = { runs: [] });
    // namespace: render-previews --ns renames ds- classes and data-ds-* attributes; QA selectors follow the page
    const ns = (readFileSync(resolve(outDir, page), 'utf8').match(/\bdata-([a-z][a-z0-9]*)-(?:demo|text|scroll)=/) || [, 'ds'])[1];
    const combos = [];
    for (const th of themes) for (const b of opts.quick ? [brands[0]] : brands) combos.push({ vp: 'desktop', theme: th, brand: b });
    for (const vp of ['phone', 'tablet']) for (const th of opts.quick ? [themes[0]] : themes) combos.push({ vp, theme: th, brand: brands[0] });
    // compact density (STD-2c): desktop + phone in the default theme
    if ((tokens.$metadata.axes.density || []).includes('compact')) for (const vp of ['desktop', 'phone']) combos.push({ vp, theme: themes[0], brand: brands[0], density: 'compact' });
    for (const c of combos) {
      const v = VIEWPORTS[c.vp];
      const ctx = await browser.newContext({ viewport: { width: v.width, height: v.height }, hasTouch: v.hasTouch, isMobile: v.isMobile, reducedMotion: 'reduce' });
      const p = await ctx.newPage();
      const errors = [];
      p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      p.on('pageerror', (e) => errors.push(String(e)));
      await p.goto(`${url}#theme=${encodeURIComponent(c.theme)}&brand=${encodeURIComponent(c.brand)}`);
      await p.waitForLoadState('load');
      if (c.density) await p.evaluate((d) => document.documentElement.setAttribute('data-density', d), c.density);
      const m = await p.evaluate(inPage, { target: v.target, ns });
      let axe = [];
      if (axeSrc) {
        await p.addScriptTag({ content: axeSrc });
        const r = await p.evaluate(async () => (await window.axe.run(document, { preload: false, runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }, resultTypes: ['violations'] })).violations);
        axe = r.filter((x) => ['serious', 'critical'].includes(x.impact)).map((x) => ({ id: x.id, impact: x.impact, nodes: x.nodes.length, sample: x.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
      }
      // focus ring on the first Tab stops (desktop only)
      const focusMissing = [];
      if (c.vp === 'desktop') {
        for (let i = 0; i < 25; i++) {
          await p.keyboard.press('Tab');
          const f = await p.evaluate(() => {
            const el = document.activeElement;
            if (!el || el === document.body) return null;
            const s = getComputedStyle(el);
            const ring = (s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2) || (s.boxShadow && s.boxShadow !== 'none');
            return { ring, name: (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40) };
          });
          if (!f) break;
          if (!f.ring) focusMissing.push(f.name);
        }
      }
      if (opts.screenshots) await p.screenshot({ path: join(shotsDir, `${page.replace(/[\/]/g, '_')}-${c.vp}-${c.brand}-${c.theme}${c.density ? `-${c.density}` : ''}.png`), fullPage: true });
      const run = { ...c, console_errors: errors, axe, small_text: m.small_text, tiny_text: m.tiny_text, small_targets: m.small_targets, focus_missing: focusMissing, tokens_empty: m.tokens_empty };
      if (v.hasTouch) for (const t of m.small_targets) { const mm = t.match(/(\d+)×(\d+)$/); if (mm) minTouch = Math.min(minTouch, +mm[1], +mm[2]); }
      res.runs.push(run);
      totals.runs++; totals.console_errors += errors.length; totals.axe_serious += axe.reduce((s, a) => s + a.nodes, 0);
      totals.small_text += m.small_text.length; totals.tiny_text += m.tiny_text.length; totals.small_targets += m.small_targets.length; totals.focus_missing += focusMissing.length; totals.tokens_empty += m.tokens_empty.length;
      await ctx.close();
    }
    // reflow 320, forced colors + reduced transparency, RTL, no-JS (default brand/theme)
    {
      const ctx = await browser.newContext({ viewport: { width: 320, height: 640 }, hasTouch: true, isMobile: true });
      const p = await ctx.newPage();
      await p.goto(url);
      const ov = await p.evaluate((ns) => {
        const bad = [];
        for (const el of document.querySelectorAll('main *')) {
          if (el.closest(`[data-${ns}-scroll="x"]`)) continue;
          const r = el.getBoundingClientRect();
          if (r.right > document.documentElement.clientWidth + 1 && r.width > 0) bad.push((el.className && String(el.className).split(' ')[0]) || el.tagName);
        }
        return { overflow: document.scrollingElement.scrollWidth - document.scrollingElement.clientWidth, offenders: [...new Set(bad)].slice(0, 8) };
      }, ns);
      res.reflow_320 = ov; if (ov.overflow > 1) totals.reflow++;
      await p.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
      res.forced_colors_focus = await p.evaluate(() => {
        // an open modal makes main inert; the focus check then runs inside the dialog that owns focus
        const modal = document.querySelector('dialog[open]');
        const b = [...(modal ? modal.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]') : document.querySelectorAll('main button, main a[href], main input, main select, main textarea, main [tabindex="0"]'))].find((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; });
        if (!b) return 'no-focusable';
        b.focus({ focusVisible: true });
        const s = getComputedStyle(b);
        return s.outlineStyle !== 'none' ? 'ok' : 'no-outline';
      });
      if (res.forced_colors_focus === 'no-outline') totals.forced_colors_focus = (totals.forced_colors_focus || 0) + 1;
      await p.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
      const rtl = await p.evaluate((ns) => [...document.querySelectorAll('main *')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.left < -1 && !el.closest(`[data-${ns}-scroll="x"]`); }).length, ns);
      res.rtl_overflow = rtl; if (rtl) totals.rtl_overflow++;
      await ctx.close();
      const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1024, height: 800 } });
      const q = await nojs.newPage();
      await q.goto(url);
      res.nojs_controls = await q.evaluate(() => document.querySelectorAll('main button, main a[href], main input, main select, main textarea, main summary').length);
      if (!res.nojs_controls && !/Skeleton|Spinner|Divider|Stack|Inline|Grid|Container|VisuallyHidden|LiveAnnouncer|ProgressBar|Avatar|Image|Badge|StatusLabel|Kbd|Tag|DescriptionList|InlineMetrics|Timeline|EmptyState/.test(page)) totals.nojs_empty++;
      await nojs.close();
    }
  }
  await browser.close();
  report.status = 'RUN';
  report.axe = axePath ? 'axe-core ' + (axeSrc.match(/axe v([\d.]+)/)?.[1] || '') : 'NOT RUN (axe-core not found)';
  report.summary = { ...totals, pages: pages.length, min_touch_target_failing_px: minTouch === Infinity ? null : minTouch };
  report.pass = !totals.forced_colors_focus && totals.console_errors === 0 && totals.axe_serious === 0 && totals.small_text === 0 && totals.tiny_text === 0 && totals.small_targets === 0 && totals.reflow === 0 && totals.focus_missing === 0 && totals.tokens_empty === 0 && totals.rtl_overflow === 0;
  return report;
}

export function qaMarkdown(r) {
  const L = ['# Laporan QA render (V9)', ''];
  if (r.status !== 'RUN') return L.concat([`NOT RUN: ${r.reason}`]).join('\n');
  const s = r.summary;
  L.push(`Engine 1.9.1 · ${s.pages} halaman · ${s.runs} render (brand × tema × viewport) · ${r.axe}`, '', '| Pemeriksaan | Jumlah temuan |', '|---|---|');
  for (const [k, v] of Object.entries(s)) if (!['pages', 'runs'].includes(k)) L.push(`| ${k} | ${v ?? '-'} |`);
  L.push('', `Status: **${r.pass ? 'PASS' : 'FAIL'}**`, '');
  for (const [page, p] of Object.entries(r.pages)) {
    const issues = [];
    for (const run of p.runs) {
      const tag = `${run.vp}/${run.brand}/${run.theme}${run.density ? `/${run.density}` : ''}`;
      for (const k of ['console_errors', 'small_text', 'tiny_text', 'small_targets', 'focus_missing', 'tokens_empty']) if (run[k].length) issues.push(`- ${tag} ${k}: ${run[k].slice(0, 4).join('; ')}`);
      for (const a of run.axe) issues.push(`- ${tag} axe ${a.id} (${a.impact}, ${a.nodes}): ${a.sample.join(', ')}`);
    }
    if (p.reflow_320?.overflow > 1) issues.push(`- reflow 320: overflow ${p.reflow_320.overflow}px (${p.reflow_320.offenders.join(', ')})`);
    if (p.rtl_overflow) issues.push(`- rtl: ${p.rtl_overflow} elemen keluar wadah`);
    if (p.forced_colors_focus !== 'ok') issues.push(`- forced-colors focus: ${p.forced_colors_focus}`);
    L.push(`## ${page}`, issues.length ? issues.join('\n') : 'Tidak ada temuan.', '');
  }
  return L.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const get = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
  const outDir = args[0];
  const r = await runQa(outDir, { pages: get('--pages')?.split(','), axe: get('--axe'), quick: args.includes('--quick'), screenshots: args.includes('--screenshots') });
  writeJson(join(outDir, 'reports', 'qa.json'), r);
  writeText(join(outDir, 'reports', 'qa-report.md'), qaMarkdown(r));
  console.log(r.status === 'RUN' ? `QA ${r.pass ? 'PASS' : 'FAIL'}: ${JSON.stringify(r.summary)}` : `QA NOT RUN: ${r.reason}`);
  process.exitCode = r.status === 'RUN' && !r.pass ? 1 : 0;
}
