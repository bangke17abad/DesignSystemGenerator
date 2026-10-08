#!/usr/bin/env node
// Engine regression: runs every fixtures/G*/brief.normalized.json through the engine tools and checks expect.json.
// Run after every change to core, modules, catalog or tools. Exit 1 on any failed assertion.
// Usage: node tools/run-fixtures.mjs [G1 G2 ...] [--keep <dir>] [--site]
import { readdirSync, existsSync, mkdtempSync, rmSync, cpSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { readJson, writeJson, writeText, resolveToken, modeKeys, getByPath } from './lib/tokens.mjs';
import { contrast, hexToOklch } from './lib/color.mjs';

const engine = join(dirname(fileURLToPath(import.meta.url)), '..');
const T = (name, args) => execFileSync('node', [join(engine, 'tools', name), ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

export function runFixture(id, opts = {}) {
  const fx = join(engine, 'fixtures', id);
  const dir = opts.dir || mkdtempSync(join(tmpdir(), `ds-${id}-`));
  cpSync(join(fx, 'brief.normalized.json'), join(dir, 'brief.normalized.json'));
  const exp = readJson(join(fx, 'expect.json'));
  const results = [];
  const step = (n, args) => { try { T(n, args); } catch (e) { if (!/derive-tokens/.test(n)) throw e; } };
  try {
    step('resolve-language.mjs', [join(dir, 'brief.normalized.json'), dir]);
    step('derive-tokens.mjs', [join(dir, 'brief.normalized.json'), dir]);
    step('build.mjs', [dir]);
    step('compose.mjs', [dir]);
    if (opts.site) { step('render-previews.mjs', [dir]); step('render-site.mjs', [dir]); }
    else { T('render-site.mjs', [dir]); }
    try { T('validate.mjs', [dir]); } catch { /* exit 1 on blocking failures; assertions decide */ }
  } catch (e) { results.push({ ok: false, what: 'pipeline', detail: String(e.stderr || e.message).slice(0, 400) }); return { id, dir, results }; }
  const lang = readJson(join(dir, 'assets', 'design-language.json'));
  const tokens = readJson(join(dir, 'assets', 'tokens.json'));
  const manifest = readJson(join(dir, 'manifest.json'));
  const contrastJson = readJson(join(dir, 'reports', 'contrast.json'));
  const ver = readJson(join(dir, 'reports', 'verification.json'));
  const engineAss = readJson(join(dir, 'reports', 'engine-assumptions.json'));
  const mk = modeKeys(tokens);
  const tok = (n, mode) => { const t = tokens.semantic[n] || tokens.component[n]; if (!t) return undefined; const vb = t.$extensions.ds.varies_by; return resolveToken(tokens, t, mode || (vb.includes('density') ? mk.defaultDensity : mk.defaultColor)).value; };
  const famHue = (f) => { const ramp = tokens.primitive.color[f]; if (!ramp) return null; const seed = ramp.light['8'].$extensions.ds.derivation.seed; return +seed.match(/oklch\([\d.]+ [\d.]+ ([\d.]+)\)/)[1]; };
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const add = (a, ok, detail) => results.push({ ok, what: JSON.stringify(a), detail });
  for (const a of exp.assertions) {
    if (a.lang) { const v = getByPath(lang, a.lang); add(a, eq(v, a.eq), `got ${JSON.stringify(v)}`); }
    else if (a.manifest) { const v = getByPath(manifest, a.manifest); add(a, eq(v, a.eq), `got ${JSON.stringify(v)}`); }
    else if (a.token_absent) add(a, tok(a.token_absent) === undefined, `got ${JSON.stringify(tok(a.token_absent))}`);
    else if (a.token_mode) { const v = tok(a.token_mode, a.mode); add(a, String(v).toLowerCase() === String(a.eq).toLowerCase(), `got ${v}`); }
    else if (a.token_gt) { const v = tok(a.token_gt); add(a, v > a.value, `got ${v}`); }
    else if (a.token && a.every_mode_border) { const ok = mk.color.every((m) => { const v = tok(a.token, m); return Array.isArray(v) && v.every((l) => !l.blur && !l.offsetY && l.spread); }); add(a, ok, 'elevation bukan border di semua mode'); }
    else if (a.token) { const v = tok(a.token); add(a, eq(v, a.eq), `got ${JSON.stringify(v)}`); }
    else if (a.scope_includes) { const n = new Set(manifest.components.map((c) => c.name)); const miss = a.scope_includes.filter((x) => !n.has(x)); add(a, !miss.length, `missing ${miss.join(', ')}`); }
    else if (a.scope_excludes) { const n = new Set(manifest.components.map((c) => c.name)); const bad = a.scope_excludes.filter((x) => n.has(x)); add(a, !bad.length, `present ${bad.join(', ')}`); }
    else if (a.patterns_include) { const n = new Set(manifest.patterns.map((p) => p.name)); const miss = a.patterns_include.filter((x) => !n.has(x)); add(a, !miss.length, `missing ${miss.join(', ')}`); }
    else if (a.contrast_blocking != null) { const n = Object.values(contrastJson.modes).flat().filter((c) => !c.pass && c.group !== 'cvd-semantic').length + contrastJson.failures.length; add(a, n === a.contrast_blocking, `got ${n}`); }
    else if (a.contrast_modes != null) add(a, Object.keys(contrastJson.modes).length === a.contrast_modes, `got ${Object.keys(contrastJson.modes).length}`);
    else if (a.family_hue) { const h = famHue(a.family_hue); add(a, h != null && Math.abs(h - a.approx) <= a.tol, `got ${h}`); }
    else if (a.notes_contain) add(a, contrastJson.notes.some((n) => n.includes(a.notes_contain)), `notes: ${contrastJson.notes.join(' | ').slice(0, 200)}`);
    else if (a.adr) add(a, contrastJson.adrs.some((x) => x.id === a.adr), `adrs: ${contrastJson.adrs.map((x) => x.id).join(', ')}`);
    else if (a.no_adr) add(a, contrastJson.adrs.length === 0, `adrs: ${contrastJson.adrs.map((x) => x.id).join(', ')}`);
    else if (a.no_semantic_shift) add(a, !contrastJson.notes.some((n) => /^hue .* digeser|varian netral karena bentrok/.test(n)), contrastJson.notes.join(' | ').slice(0, 200));
    else if (a.assumptions_contain) add(a, engineAss.entries.some((e) => e.statement.includes(a.assumptions_contain)), engineAss.entries.map((e) => e.statement).join(' | ').slice(0, 200));
    else if (a.semantic_not_varies_by_brand) { const bad = Object.entries(tokens.semantic).filter(([n, t]) => n.startsWith('color-semantic') && t.$extensions.ds.varies_by.includes('brand')).map(([n]) => n); add(a, !bad.length, bad.join(', ')); }
    else if (a.on_solid_dark) { const v = tok('color-interaction-on-solid', a.on_solid_dark); add(a, hexToOklch(v)[0] < 0.5, `got ${v}`); }
    else if (a.contrast) { const r = contrast(tok(a.contrast.fg, a.contrast.mode), tok(a.contrast.bg, a.contrast.mode)); add(a, r >= a.contrast.min, `got ${r}`); }
    else if (a.css_contains) add(a, readFileSync(join(dir, 'assets', 'tokens.css'), 'utf8').includes(a.css_contains), 'tidak ada di tokens.css');
    else if (a.file_exists) add(a, existsSync(join(dir, a.file_exists)), 'file tidak ada');
    else if (a.site_lang) add(a, readFileSync(join(dir, 'index.html'), 'utf8').includes(`<html lang="${a.site_lang}">`), 'lang situs berbeda');
    else if (a.content_locale_missing) { const c = readJson(join(dir, 'assets', 'components.json')).components; add(a, c.some((x) => !x.content[a.content_locale_missing]?.examples.length), `${a.content_locale_missing} seharusnya kosong sampai run menulisnya (V5 menandai)`); }
    else if (a.validators) { const bad = a.validators.filter((id) => ver.validators.find((v) => v.id === id)?.status !== a.status); add(a, !bad.length, bad.map((id) => `${id}=${ver.validators.find((v) => v.id === id)?.status}: ${ver.validators.find((v) => v.id === id)?.failures[0] || ''}`).join(' | ')); }
    else add(a, false, 'jenis asersi tidak dikenal');
  }
  return { id, dir, results, run_only: exp.run_only, tier: ver.tier_reached };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const ids = args.filter((a) => /^G\d+$/.test(a));
  const all = readdirSync(join(engine, 'fixtures')).filter((d) => /^G\d+$/.test(d)).sort((a, b) => +a.slice(1) - +b.slice(1));
  let failed = 0, total = 0;
  const summary = [];
  for (const id of ids.length ? ids : all) {
    const r = runFixture(id, { site: args.includes('--site') });
    const bad = r.results.filter((x) => !x.ok);
    total += r.results.length; failed += bad.length;
    console.log(`${bad.length ? 'FAIL' : 'PASS'} ${id}: ${r.results.length - bad.length}/${r.results.length} asersi · tier ${r.tier || '-'}${r.run_only?.length ? ` · ${r.run_only.length} butir run-only` : ''}`);
    for (const b of bad) console.log(`   ✗ ${b.what} → ${b.detail}`);
    summary.push({ id, pass: !bad.length, assertions: r.results.length, failed: bad.length, tier: r.tier });
    if (!args.includes('--keep')) rmSync(r.dir, { recursive: true, force: true });
  }
  writeJson(join(engine, 'fixtures', 'last-run.json'), { engine_version: '1.9.0', summary });
  console.log(`fixtures: ${total - failed}/${total} asersi lolos`);
  process.exitCode = failed ? 1 : 0;
}
