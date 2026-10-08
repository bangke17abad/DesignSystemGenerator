#!/usr/bin/env node
// Developer check for reference/html-first components: CSS lint + render + QA across four archetypes.
// Usage: node tools/dev/ref-check.mjs <Name> [Name ...] [--full] [--screenshots]
// Test packages are cached in $DS_REFPKGS (default /home/claude/dsg/refpkgs); delete the folder to rebuild them.
import { findStripes } from '../lib/stripes.mjs';
import { existsSync, readFileSync, mkdirSync, writeFileSync, cpSync, rmSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const engine = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const pkgRoot = process.env.DS_REFPKGS || '/home/claude/dsg/refpkgs';
const AXE = process.env.DS_AXE || '/tmp/claude-0/-home-claude/e370fe57-aa6b-5bb8-87f5-0290f2b3d27e/scratchpad/qa/node_modules/axe-core/axe.min.js';
const PKGS = {
  'ink-graphite': { themes: [{ name: 'Light' }, { name: 'Dark' }, { name: 'High-contrast' }], modality: ['touch', 'glove'] },
  'soft-friendly': { themes: [{ name: 'Light' }, { name: 'Dark' }], modality: ['touch'] },
  'neo-brutalist': { themes: [{ name: 'Light' }, { name: 'Dark' }], modality: ['pointer'] },
  'immersive-glass': { themes: [{ name: 'Dark' }, { name: 'Light' }], modality: ['touch'] },
};

function ensurePkg(a) {
  mkdirSync(pkgRoot, { recursive: true });
  const dir = join(pkgRoot, a);
  if (existsSync(join(dir, 'assets', 'tokens.css'))) return dir;
  mkdirSync(dir, { recursive: true });
  const brief = {
    brief_schema_version: '1.5', run_mode: 'greenfield', product_name: `Ref ${a}`, namespace: 'REF', doc_language: 'English', ui_locales: ['en-US', 'id-ID'],
    surfaces: [
      { name: 'web', input_modality: ['pointer', 'keyboard'], surface_type: 'operational', default_theme: PKGS[a].themes[0].name, density_modes: ['comfortable', 'compact'] },
      { name: 'mobile', input_modality: PKGS[a].modality, surface_type: 'consumer', default_theme: PKGS[a].themes[0].name, density_modes: ['comfortable'] },
    ],
    targets: { primary_web_reference: 'html-first' },
    language: { mode: 'archetype', archetype: a, themes: PKGS[a].themes, brands: [{ id: 'default' }] },
  };
  writeFileSync(join(dir, 'brief.normalized.json'), JSON.stringify(brief, null, 2));
  for (const t of ['resolve-language.mjs', 'derive-tokens.mjs']) execFileSync('node', [join(engine, 'tools', t), join(dir, 'brief.normalized.json'), dir], { stdio: 'pipe' });
  execFileSync('node', [join(engine, 'tools', 'build.mjs'), dir], { stdio: 'pipe' });
  return dir;
}

const LINT = [
  [/#[0-9a-fA-F]{3,8}\b/, 'hex colour (UB1/I3): use tokens'],
  [/(?<![-\w])(?:margin|padding|border)-(?:left|right)\b|(?<![-\w])(?:left|right)\s*:|text-align\s*:\s*(?:left|right)|float\s*:\s*(?:left|right)|clear\s*:\s*(?:left|right)/, 'physical property (§12.4): use logical properties'],
  [/(?<![\w.-])-?(?:[2-9]|\d{2,})(?:\.\d+)?px\b/, 'magic px value (UB1): use tokens (only 0, 1px, -1px allowed)'],
  [/font-size\s*:(?!\s*(?:var\(--type-|inherit|1em|100%))/, 'font-size must come from type tokens (STD-2)'],
  [/outline\s*:\s*(?:none|0)\b/, 'outline removed (UB8)'],
  [/!important/, '!important'],
  [/z-index\s*:(?!\s*(?:var\(--z-|-1\b|0\b|1\b|2\b))/, 'z-index must use z-* tokens'],
  [/(?:transition|animation)(?:-duration)?\s*:[^;]*\b\d+(?:\.\d+)?m?s\b/, 'duration literal: use motion-* or timing-* tokens'],
  [/\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(/, 'colour function: use tokens'],
  [/:hover(?![^{]*\[data-force)/, null], // informational only
];

function lintCss(name) {
  const p = join(engine, 'reference', 'html-first', 'components', `${name}.css`);
  if (!existsSync(p)) return [`missing components/${name}.css`];
  const errs = [];
  const lines = readFileSync(p, 'utf8').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).split('\n');
  lines.forEach((l, i) => {
    for (const [re, msg] of LINT) if (msg && re.test(l)) errs.push(`${name}.css:${i + 1} ${msg}: ${l.trim().slice(0, 90)}`);
  });
  const css = lines.join('\n');
  if (/:hover/.test(css) && !/\(hover:\s*hover\)/.test(css)) errs.push(`${name}.css: :hover must be inside @media (hover: hover) (§6.9.4)`);
  if (/:hover/.test(css) && !/data-force~?="?hover/.test(css)) errs.push(`${name}.css: every :hover style needs a [data-force~="hover"] twin for static previews`);
  if (/<(?:button|input|select|textarea|fieldset|option|optgroup)\b[^>]*\sdisabled(?:[\s>=/])/.test(readFileSync(join(engine, 'reference', 'html-first', 'fixtures', `${name}.html`), 'utf8'))) errs.push(`fixtures/${name}.html: native disabled attribute; use aria-disabled + visible reason (UB10) unless the control is truly irrelevant`);
  for (const h of findStripes(readFileSync(p, 'utf8'), `${name}.css`)) errs.push(`${name}.css:${h.line} side stripe (VR-16): ${h.selector.slice(0, 60)} → ${h.detail.slice(0, 70)}; use selection background + weight, an all-sides ring, or icon + text`);
  const fx = readFileSync(join(engine, 'reference', 'html-first', 'fixtures', `${name}.html`), 'utf8');
  for (const t of LEAK) if (new RegExp(`\\b${t.replace(/[-]/g, '\\-')}\\b`, 'i').test(fx)) errs.push(`fixtures/${name}.html: domain term from an earlier run "${t}" (R15): fixtures stay domain-neutral`);
  return errs;
}
const LEAK = JSON.parse(readFileSync(join(engine, 'reference', 'html-first', 'leak-terms.json'), 'utf8')).terms;

const args = process.argv.slice(2);
const names = args.filter((a) => !a.startsWith('--'));
if (!names.length) { console.error('usage: ref-check.mjs <Name> [...] [--full] [--screenshots] [--lint-only]'); process.exit(2); }
let failed = 0;
const lint = Object.fromEntries(names.map((n) => [n, existsSync(join(engine, 'reference', 'html-first', 'fixtures', `${n}.html`)) ? lintCss(n) : [`missing fixtures/${n}.html`]]));
for (const [n, e] of Object.entries(lint)) { if (e.length) { failed++; console.log(`LINT FAIL ${n}\n  - ${e.slice(0, 20).join('\n  - ')}`); } else console.log(`LINT PASS ${n}`); }
if (args.includes('--lint-only')) { console.log(`lint: ${names.length - failed}/${names.length} PASS`); process.exit(failed ? 1 : 0); }
mkdirSync(pkgRoot, { recursive: true });
const work = mkdtempSync(join(pkgRoot, `_work-${process.pid}-`));
for (const a of Object.keys(PKGS)) {
  // each invocation renders into its own copy, so parallel runs never overwrite each other's bundle.css / previews
  const dir = join(work, a);
  rmSync(dir, { recursive: true, force: true });
  cpSync(ensurePkg(a), dir, { recursive: true, filter: (src) => !/previews|__screenshots__|reports/.test(src) });
  execFileSync('node', [join(engine, 'tools', 'render-previews.mjs'), dir, '--components', names.join(',')], { stdio: 'pipe' });
  const qaArgs = [join(engine, 'tools', 'qa.mjs'), dir, '--pages', names.map((n) => `previews/${n}.html`).join(','), '--axe', AXE];
  if (!args.includes('--full')) qaArgs.push('--quick');
  if (args.includes('--screenshots')) qaArgs.push('--screenshots');
  let out = '';
  try { out = execFileSync('node', qaArgs, { encoding: 'utf8' }); } catch (e) { out = e.stdout || String(e); failed++; }
  console.log(`QA ${a}: ${out.trim()}`);
  if (/FAIL/.test(out)) console.log(`   details: ${join(dir, 'reports', 'qa-report.md')}`);
}
if (args.includes('--screenshots')) console.log(`screenshots: ${work}/<archetype>/tests/visual/__screenshots__/ (view them with the Read tool)`);
process.exit(failed ? 1 : 0);
