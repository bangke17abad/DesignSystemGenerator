#!/usr/bin/env node
// Phase 14 (and every gate): V1-V22 + VB1-VB12 on a generated package. Results are written as-is (R4, R10):
// a check that cannot run is NOT RUN, never PASS. Blocking failures make the exit code 1.
// Usage: node tools/validate.mjs <packageDir> [--only V1,V2,...] [--gate P1]
import { existsSync, readdirSync, readFileSync, statSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { join, dirname, relative, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { readJson, writeJson, writeText, flatten, resolveToken, modeKeys, isAlias, aliasPath, getByPath } from './lib/tokens.mjs';
import { contrast, hexToOklab, oklabDistance } from './lib/color.mjs';
import { checkPairs, ADVISORY_GROUPS } from './lib/pairs.mjs';
import { validate as schemaValidate } from './lib/schema.mjs';
import { findStripes } from './lib/stripes.mjs';

const ENGINE = '1.8.0';
import { CORE_INDEX } from './check-catalog.mjs';
const CORE_NAMES = new Set(Object.keys(CORE_INDEX));
import { PATTERN_INDEX } from './check-patterns.mjs';
const BASE_PATTERN_NAMES = new Set(Object.keys(PATTERN_INDEX));
const engine = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLOCKING = new Set(['V1', 'V2', 'V4', 'V5', 'V11', 'V14', 'V16', 'VB1', 'VB2', 'VB4', 'VB5', 'VB8']);
const GATES = { P0B: ['V13', 'V14'], P1: ['V1', 'V2', 'V11', 'V14', 'VB1', 'VB2', 'VB3', 'VB4', 'VB5', 'VB6', 'VB7', 'VB8', 'VB9', 'VB10', 'VB11', 'VB12'], P6: ['V8'], P7: ['V12'], P12: ['V5', 'V11', 'V17'], P13: ['V4', 'V16', 'V20', 'V21'] };

const NAMES = {
  V1: 'integritas token', V2: 'kontras', V3: 'dokumen ↔ token dan kontaminasi', V4: 'tautan dan aset', V5: 'kelengkapan komponen', V6: 'lint visual dan kode',
  V7: 'bahasa', V8: 'breakpoint', V9: 'render smoke test', V10: 'parity', V11: 'baseline STD', V12: 'cakupan WCAG 2.2', V13: 'kesetiaan bahasa desain',
  V14: 'kontrak data', V15: 'integritas mode jalan', V16: 'determinisme', V17: 'kelengkapan pattern', V18: 'paritas alat desain', V19: 'regresi visual dan interaksi',
  V20: 'anggaran dan dukungan', V21: 'distribusi', V22: 'aturan domain pack',
  VB1: 'skala tipe naik ketat', VB2: 'elevasi naik ketat', VB3: 'skala spasi grid 4 px', VB4: 'urutan radius', VB5: 'urutan durasi gerak', VB6: 'urutan tinggi kontrol',
  VB7: 'rasio tinggi baris', VB8: 'hierarki teks terbedakan', VB9: 'border-strong terlihat lebih kuat', VB10: 'jumlah keluarga dan bobot font', VB11: 'ikon selaras teks', VB12: 'kategori data-viz terbedakan',
};

export function validatePackage(dir, opts = {}) {
  const P = (...p) => join(dir, ...p);
  const has = (...p) => existsSync(P(...p));
  const json = (...p) => (has(...p) ? readJson(P(...p)) : null);
  const results = [];
  const want = (id) => !opts.only || opts.only.includes(id);
  const run = (id, fn) => {
    if (!want(id)) return;
    const r = { id, name: NAMES[id], status: 'PASS', severity: BLOCKING.has(id) ? 'blocking' : 'advisory', checks: 0, failures: [], notes: [] };
    try {
      const out = fn(r);
      if (out === 'NOT RUN' || out === 'NOT APPLICABLE') r.status = out;
      else if (r.failures.length) r.status = 'FAIL';
    } catch (e) { r.status = 'FAIL'; r.failures.push(`validator crashed: ${e.message}`); }
    r.failures = r.failures.slice(0, 200);
    results.push(r);
  };
  const tokens = json('assets', 'tokens.json');
  const lang = json('assets', 'design-language.json');
  const manifest = json('manifest.json');
  const brief = json('brief.normalized.json');
  const sem = (n, mode) => {
    const t = tokens?.semantic[n] || tokens?.component[n];
    if (!t) return undefined;
    const mk = modeKeys(tokens);
    return resolveToken(tokens, t, mode ?? (t.$extensions?.ds?.varies_by?.includes('density') ? mk.defaultDensity : mk.defaultColor)).value;
  };
  const files = walk(dir).filter((f) => !/node_modules|\/tests\/visual\/__screenshots__|refpkgs/.test(f));
  const textFiles = files.filter((f) => /\.(html|css|js|json|md|mjs|ts|dart|swift|kt|txt|svg)$/.test(f));
  const baseline = { min_text_contrast: null, min_body_font_px: null, min_touch_target_px: null, wcag_sc_status: {} };

  // ---------------- V1 ----------------
  run('V1', (r) => {
    if (!tokens) { r.failures.push('assets/tokens.json tidak ada'); return; }
    const mk = modeKeys(tokens);
    for (const e of flatten(tokens)) {
      r.checks++;
      const ds = e.token.$extensions?.ds;
      if (!ds) { r.failures.push(`${e.path}: $extensions.ds hilang`); continue; }
      const vb = ds.varies_by || [];
      const modes = vb.includes('density') ? mk.density : vb.length ? mk.color : [null];
      for (const m of modes) {
        const res = resolveToken(tokens, e.token, m);
        if (res.error) r.failures.push(`${e.path} [${m}]: ${res.error}`);
        const v = res.value;
        if (v === undefined || (typeof v === 'number' && !Number.isFinite(v)) || (typeof v === 'string' && /\{|undefined|NaN/.test(v))) r.failures.push(`${e.path} [${m}]: nilai tidak valid ${JSON.stringify(v)}`);
        if (e.token.$type === 'color' && typeof v === 'string' && v !== 'transparent' && !/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(v)) r.failures.push(`${e.path} [${m}]: warna bukan hex sRGB (${v})`);
      }
      if (vb.length && ds.modes) {
        const need = vb.includes('density') ? mk.density : mk.color;
        for (const m of need) if (!(m in ds.modes)) r.failures.push(`${e.path}: mode ${m} tidak punya nilai (§5.9)`);
      }
      // engine 1.8.0: semantic colours are aliases of primitives (3-layer architecture, I3)
      if (e.layer === 'semantic' && e.token.$type === 'color') {
        const vals = ds.modes ? Object.values(ds.modes) : [e.token.$value];
        for (const v of vals) if (!(isAlias(v) && aliasPath(v).startsWith('primitive.'))) { r.failures.push(`${e.path}: token warna semantik harus alias primitif, ditemukan ${JSON.stringify(v)}`); break; }
      }
      if (e.layer === 'semantic' && e.name.startsWith('color-semantic') && vb.includes('brand')) r.failures.push(`${e.path}: token semantik tidak boleh bervariasi per brand (§5.9)`);
    }
    for (const t of Object.keys(tokens.component || {})) {
      const v = tokens.component[t].$value;
      if (isAlias(v) && aliasPath(v).startsWith('primitive.')) r.failures.push(`component.${t}: token komponen tidak boleh merujuk primitif (I3)`);
    }
  });

  // ---------------- V2 ----------------
  run('V2', (r) => {
    if (!tokens || !lang) { r.failures.push('tokens.json atau design-language.json tidak ada'); return; }
    const mk = modeKeys(tokens);
    const L16 = lang.decisions.L16.value, L15 = lang.decisions.L15.value;
    const stateLayer = L16.strategy === 'state-layer' ? { hover: 0.08, pressed: 0.12, selected: 0.12, dragged: 0.16 } : null;
    let minText = Infinity;
    for (const m of mk.color) {
      const c = {};
      for (const e of flatten(tokens)) if (e.layer !== 'primitive' && e.token.$type === 'color') c[e.name] = resolveToken(tokens, e.token, m).value;
      for (const x of checkPairs(c, { stateLayer, translucency: !!L15.translucency, brandBlock: lang.decisions.L2.value.brand_role === 'block' })) {
        r.checks++;
        if (x.kind === 'contrast' && x.min === 4.5 && x.ratio != null) minText = Math.min(minText, x.ratio);
        if (!x.pass) {
          const msg = `${m} ${x.group}: ${x.fg} / ${x.bg} = ${x.ratio ?? x.distance} (min ${x.kind === 'max' ? '<' : '≥'} ${x.min})`;
          if (ADVISORY_GROUPS.has(x.group)) r.notes.push(`advisory (I2): ${msg}`); else r.failures.push(msg);
        }
      }
      // attention-class component tokens (L3): foreground on background must be text-grade
      for (const k of ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']) {
        const bg = c[`attention-${k}-background`], fg = c[`attention-${k}-foreground`];
        if (!bg || !fg) continue;
        const base = c['color-structure-surface-base'];
        const b = bg === 'transparent' ? base : bg;
        r.checks++;
        const ratio = contrast(fg.slice(0, 7), b.slice(0, 7));
        if (ratio < 4.5) r.failures.push(`${m} attention-${k}: foreground/background ${ratio} < 4.5`);
      }
    }
    baseline.min_text_contrast = minText === Infinity ? null : minText;
  });

  // ---------------- V3 ----------------
  run('V3', (r) => {
    const leak = [...(brief?.hygiene?.leak_terms || [])];
    for (const f of textFiles) {
      if (/reports\/(qa|verification|score)|brief\.normalized\.json/.test(f)) continue;
      const s = readFileSync(f, 'utf8');
      r.checks++;
      if (/\{\{[^}]*\}\}/.test(s)) r.failures.push(`${rel(f)}: placeholder {{…}} belum terisi`);
      if (/\b(lorem ipsum|TBD|TODO:)/i.test(s) && !/PROGRESS\.md|CHANGELOG/.test(f)) r.failures.push(`${rel(f)}: placeholder (lorem/TBD/TODO) (DoD-11)`);
      for (const t of leak) if (new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(s)) r.failures.push(`${rel(f)}: istilah bocor "${t}" (R15)`);
    }
    const g = json('assets', 'glossary.json');
    if (g) {
      const avoid = g.terms.flatMap((t) => t.avoid || []);
      for (const name of ['components.json', 'patterns.json', 'lifecycle.json']) {
        const p = P('assets', name);
        if (!existsSync(p)) continue;
        const s = readFileSync(p, 'utf8');
        for (const a of avoid) if (a && new RegExp(`"[^"]*\\b${a}\\b[^"]*"`, 'i').test(s)) r.failures.push(`assets/${name}: sinonim terlarang "${a}" (§12.5)`);
      }
    } else r.notes.push('glossary.json tidak ada: pemeriksaan glosarium NOT RUN');
  });

  // ---------------- V4 ----------------
  run('V4', (r) => {
    const html = files.filter((f) => f.endsWith('.html'));
    if (!html.length) return 'NOT RUN';
    for (const f of html) {
      const s = readFileSync(f, 'utf8');
      for (const m of s.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
        const u = m[1];
        r.checks++;
        if (/^https?:\/\//.test(u)) { r.failures.push(`${rel(f)}: URL eksternal ${u} (nol permintaan jaringan, §16.2)`); continue; }
        if (/^(#|mailto:|tel:|data:|javascript:)/.test(u)) continue;
        const target = resolve(dirname(f), u.split('#')[0].split('?')[0]);
        if (!existsSync(target)) r.failures.push(`${rel(f)}: tautan rusak ${u}`);
      }
      if (/@import\s+url\(["']?https?:/.test(s) || /fonts\.googleapis/.test(s)) r.failures.push(`${rel(f)}: font/CSS dari CDN`);
    }
    for (const f of files.filter((x) => x.endsWith('.css'))) { r.checks++; if (/url\(["']?https?:|fonts\.googleapis/.test(readFileSync(f, 'utf8'))) r.failures.push(`${rel(f)}: aset eksternal di CSS`); }
  });

  // ---------------- V5 ----------------
  run('V5', (r) => {
    const comps = json('assets', 'components.json');
    if (!manifest || !comps) return 'NOT RUN';
    const schema = readJson(join(engine, 'schemas', 'components.schema.json'));
    const byName = Object.fromEntries(comps.components.map((c) => [c.name, c]));
    const locales = brief?.ui_locales || [];
    for (const m of manifest.components) {
      r.checks++;
      const c = byName[m.name];
      if (!c) { r.failures.push(`${m.name}: tidak ada record di components.json`); continue; }
      for (const e of schemaValidate(schema.$defs.component, c, { root: schema }).slice(0, 5)) r.failures.push(`${m.name}: ${e}`);
      for (const l of locales) if (!c.content[l]?.examples?.length) r.failures.push(`${m.name}: contoh konten untuk ${l} kosong (§6.3 seksi 8)`);
      if (!has(m.page)) r.failures.push(`${m.name}: halaman ${m.page} tidak ada`);
      if (!has(m.preview)) r.failures.push(`${m.name}: preview ${m.preview} tidak ada`);
      const targets = [manifest.targets.reference, ...manifest.targets.production];
      for (const t of targets) if (!c.target_mapping[t]) r.failures.push(`${m.name}: tidak ada target_mapping untuk ${t}`);
      if (c.api.props.some((p) => p.name === 'disabled') && !c.api.props.some((p) => p.name === 'reason')) r.failures.push(`${m.name}: prop disabled tanpa reason (§6.4)`);
    }
    const extra = comps.components.filter((c) => !manifest.components.some((m) => m.name === c.name)).map((c) => c.name);
    if (extra.length) r.failures.push(`record di luar {N}: ${extra.join(', ')} (R6)`);
    r.notes.push(`{N} = ${manifest.components.length}`);
  });

  // ---------------- V6 ----------------
  run('V6', (r) => {
    const rules = json('assets', 'lint-rules.json');
    const css = files.filter((f) => /\/(components|src)\/.*\.css$|assets\/bundle\.css$/.test(f));
    if (!css.length) return 'NOT RUN';
    const builtins = [
      ['UB1', /#[0-9a-fA-F]{3,8}\b/, 'hex di komponen'],
      ['UB3', /font-size\s*:\s*(?:[0-9]|1[0-5])(?:\.[0-9]+)?px/, 'font-size literal < 16px'],
      ['UB8', /outline\s*:\s*(?:none|0)\s*[;}]/, 'outline dihapus'],
      ['ENG-RTL', /(?<![-\w])(?:margin|padding|border)-(?:left|right)\s*:|(?<![-\w])(?:left|right)\s*:|text-align\s*:\s*(?:left|right)/, 'properti fisik'],
    ];
    for (const f of css) {
      const lines = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).split('\n');
      lines.forEach((l, i) => { r.checks++; for (const [id, re, msg] of builtins) if (re.test(l)) r.failures.push(`${rel(f)}:${i + 1} ${id} ${msg}: ${l.trim().slice(0, 80)}`); });
      const body = lines.join('\n');
      for (const h of findStripes(body, rel(f))) r.failures.push(`${rel(f)}:${h.line} VR-16 garis aksen satu sisi (side stripe): ${h.selector.slice(0, 60)} → ${h.detail.slice(0, 70)}`);
      if (/backdrop-filter/.test(body) && !/prefers-reduced-transparency/.test(body)) r.failures.push(`${rel(f)}: backdrop-filter tanpa fallback prefers-reduced-transparency (§9.3)`);
    }
    for (const rule of rules?.rules || []) {
      if (rule.kind === 'manual-review') { r.notes.push(`review ${rule.id}: ${rule.question}`); continue; }
      if (rule.kind !== 'css-pattern' || !rule.pattern || /^UB(1|3|8)$|ENG-RTL/.test(rule.id)) continue;
      let re; try { re = new RegExp(rule.pattern); } catch { r.failures.push(`${rule.id}: pola regex tidak valid`); continue; }
      const srcCss = css.filter((f) => !/bundle\.css$/.test(f)).filter((f) => appliesTo(rule.applies_to, f));
      for (const f of srcCss) { r.checks++; const m = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').match(re); if (m) r.failures.push(`${rule.id} ${rule.statement}: ${rel(f)} (${m[0].slice(0, 60)})`); }
    }
  });

  // ---------------- V7 ----------------
  run('V7', (r) => {
    const html = files.filter((f) => f.endsWith('.html'));
    if (!html.length) return 'NOT RUN';
    for (const f of html) { r.checks++; if (!/<html[^>]*\slang="[a-z]{2,3}/.test(readFileSync(f, 'utf8'))) r.failures.push(`${rel(f)}: atribut lang hilang`); }
    r.notes.push('heuristik stopword prosa lintas bahasa: NOT RUN (butuh daftar stopword per doc_language)');
  });

  // ---------------- V8 ----------------
  run('V8', (r) => {
    if (!tokens) return 'NOT RUN';
    const bps = ['mobile', 'tablet', 'desktop', 'wide'].map((k) => tokens.semantic[`bp-${k}`]?.$value).filter((v) => v != null);
    const ok = new Set(bps.flatMap((v) => [v, +(v - 0.02).toFixed(2)]));
    for (const f of files.filter((x) => /\.(css|html)$/.test(x))) {
      const s = readFileSync(f, 'utf8');
      for (const m of s.matchAll(/@media[^{]*?\((?:min|max)-width:\s*([\d.]+)px\)/g)) { r.checks++; if (!ok.has(+m[1])) r.failures.push(`${rel(f)}: breakpoint ${m[1]}px di luar set bp-* (${bps.join(', ')})`); }
      for (const m of s.matchAll(/@media[^{]*?\((?:min|max)-width:\s*([\d.]+)(em|rem)\)/g)) { r.checks++; if (!ok.has(+m[1] * 16)) r.failures.push(`${rel(f)}: breakpoint ${m[1]}${m[2]} di luar set bp-*`); }
      if (/\(--bp-[a-z]+-(up|down)\)/.test(s) && f.endsWith('.css') && /assets\//.test(f)) r.failures.push(`${rel(f)}: placeholder breakpoint belum diganti`);
    }
  });

  // ---------------- V9 ----------------
  run('V9', (r) => {
    const qa = json('reports', 'qa.json');
    if (!qa || qa.status !== 'RUN') { r.notes.push(qa?.reason || 'reports/qa.json tidak ada: jalankan tools/qa.mjs'); return 'NOT RUN'; }
    r.checks = qa.summary.runs;
    for (const [k, v] of Object.entries(qa.summary)) if (!['runs', 'pages', 'min_touch_target_failing_px', 'nojs_empty'].includes(k) && v) r.failures.push(`${k}: ${v}`);
    if (qa.summary.nojs_empty) r.notes.push(`preview tanpa kontrol saat JavaScript mati: ${qa.summary.nojs_empty}`);
    baseline.min_touch_target_px = qa.summary.small_targets ? qa.summary.min_touch_target_failing_px : 44;
    baseline.min_body_font_px = qa.summary.small_text ? '<16' : 16;
    r.notes.push(qa.axe);
  });

  // ---------------- V10 ----------------
  run('V10', (r) => {
    if (!manifest) return 'NOT RUN';
    const prod = manifest.targets.production || [];
    if (!prod.length) return 'NOT APPLICABLE';
    for (const c of manifest.components) for (const t of prod) { r.checks++; const p = c.target_files?.[t]; if (!p) r.failures.push(`${c.name}: tidak ada file untuk ${t}`); else if (!has(p)) r.notes.push(`${c.name}: ${p} belum ditulis (spesifikasi saja)`); }
  });

  // ---------------- V11 ----------------
  run('V11', (r) => {
    if (!tokens) { r.failures.push('tokens.json tidak ada'); return; }
    for (const k of ['body', 'label', 'code', 'body-lg', 'h3', 'h2', 'h1', 'display']) { r.checks++; const v = sem(`type-${k}-size`); if (!(v >= 16)) r.failures.push(`type-${k}-size = ${v} < 16 (STD-2)`); }
    const cap = sem('type-caption-size');
    r.checks++; if (!(cap >= 12 && cap < 16)) r.failures.push(`type-caption-size = ${cap} (harus 12..15)`);
    r.checks++; if (sem('target-min-touch') !== 44) r.failures.push('target-min-touch ≠ 44 (STD-4)');
    r.checks++; if (sem('target-min-pointer') !== 24) r.failures.push('target-min-pointer ≠ 24 (SC 2.5.8)');
    if ((brief?.surfaces || []).some((s) => (s.input_modality || []).some((m) => m === 'glove' || m === 'in-motion'))) { r.checks++; if (!(sem('target-min-extended') >= 48)) r.failures.push('target-min-extended < 48 untuk surface glove/in-motion'); }
    for (const e of flatten(tokens)) if (/^type-.*-size$/.test(e.name)) { r.checks++; if (!e.token.$extensions?.ds?.text_class) r.failures.push(`${e.name}: text_class hilang (§5.6)`); }
    baseline.min_body_font_px ??= sem('type-body-size');
    for (const f of files.filter((x) => /\.(md|html)$/.test(x) && /docs\//.test(x))) {
      const s = readFileSync(f, 'utf8');
      r.checks++;
      if (/teks besar\s*3[.,]?0?\s*:\s*1|large text\s*3:1/i.test(s)) r.failures.push(`${rel(f)}: menyebut pengecualian teks besar 3:1 (STD-3)`);
      if (/(teks isi|body text)[^.]{0,40}\b(1[0-5]|[0-9])\s*px/i.test(s)) r.failures.push(`${rel(f)}: menyebut teks isi < 16px`);
    }
  });

  // ---------------- V12 ----------------
  run('V12', (r) => {
    const w = json('assets', 'wcag22.json');
    if (!w) return 'NOT RUN';
    r.checks = w.criteria.length;
    if (w.criteria.length !== 55) r.failures.push(`wcag22.json memuat ${w.criteria.length} SC, harus 55`);
    const seed = new Set(readJson(join(engine, 'catalog', 'wcag22.seed.json')).criteria.map((c) => c.sc));
    for (const c of w.criteria) {
      if (!seed.has(c.sc)) r.failures.push(`SC ${c.sc} bukan bagian dari 55 A/AA`);
      if (c.status === 'N/A' && !c.application) r.failures.push(`SC ${c.sc}: N/A tanpa alasan`);
      if (c.status === 'Open decision' && !c.assumption) r.failures.push(`SC ${c.sc}: Open decision tanpa A-nn`);
      baseline.wcag_sc_status[c.status] = (baseline.wcag_sc_status[c.status] || 0) + 1;
    }
    for (const f of textFiles.filter((x) => /docs\/|reports\/|index\.html/.test(x))) if (/\b(WCAG[^.]{0,20}compliant|tersertifikasi)\b/i.test(readFileSync(f, 'utf8'))) r.failures.push(`${rel(f)}: klaim "compliant"/"tersertifikasi" (§3A.1)`);
  });

  // ---------------- V13 ----------------
  run('V13', (r) => {
    if (!lang) { r.failures.push('design-language.json tidak ada'); return; }
    for (let i = 1; i <= 17; i++) { r.checks++; const d = lang.decisions[`L${i}`]; if (!d || !d.source || !d.testable_consequence?.length) r.failures.push(`L${i} tidak lengkap (value/source/testable_consequence)`); }
    if (!tokens) return;
    const D = lang.decisions;
    const expect = [
      ['type-body-size', D.L4.value.scale.body], ['type-h1-size', D.L4.value.scale.h1], ['type-caption-size', D.L4.value.scale.caption],
      ['radius-sm', D.L6.value.radius.control], ['radius-md', D.L6.value.radius.container], ['radius-lg', D.L6.value.radius.overlay],
      ['motion-fast-duration', D.L8.value.fast], ['motion-base-duration', D.L8.value.base], ['motion-slow-duration', D.L8.value.slow],
      ['space-section', D.L17.value.section], ['space-section-lg', D.L17.value.section_lg],
      ['state-layer-hover-opacity', D.L16.value.strategy === 'state-layer' ? 0.08 : 0], ['state-press-transform', D.L16.value.press_transform],
    ];
    for (const [n, v] of expect) { r.checks++; const got = sem(n); if (got !== v) r.failures.push(`${n} = ${JSON.stringify(got)}, bahasa desain menetapkan ${JSON.stringify(v)} (tanpa ADR)`); }
    for (const k of D.L5.value.space.steps) { r.checks++; if (!tokens.semantic[k === 0.5 ? 'space-half' : `space-${k}`]) r.failures.push(`space-${k} dari L5 tidak ada di tokens.json`); }
    const lint = json('assets', 'lint-rules.json');
    for (const b of D.L13.value.bans) { r.checks++; if (!lint?.rules.some((x) => x.id === b.id)) r.failures.push(`${b.id} dari L13 tidak ada di lint-rules.json`); }
    // token-rule bans that can be evaluated on tokens
    for (const b of D.L13.value.bans.filter((x) => x.kind === 'token-rule' && x.check)) {
      r.checks++;
      const c = b.check;
      const num = (n) => { const v = sem(n); return typeof v === 'number' ? v : parseFloat(v); };
      const cmp = (a, op, bv) => ({ '<=': a <= bv, '>=': a >= bv, '<': a < bv, '>': a > bv }[op]);
      if (c.token) { const bv = c.ref ? num(c.ref) : c.value; if (!cmp(num(c.token), c.op, bv)) r.failures.push(`${b.id} ${b.statement}: ${c.token}=${num(c.token)} ${c.op} ${bv} gagal`); }
      if (c.tokens) for (const n of Object.keys(tokens.semantic).filter((x) => new RegExp(`^${c.tokens}$`).test(x))) if (!cmp(num(n), c.op, c.value)) r.failures.push(`${b.id} ${b.statement}: ${n}=${num(n)}`);
      if (c.attention_not_filled) for (const k of c.attention_not_filled) if (D.L3.value.attention[k] === 'filled') r.failures.push(`${b.id}: ${k} filled`);
      if (c.shadow_blur_min != null || c.shadow_blur_max != null || c.shadow_alpha_max != null) {
        for (const n of Object.keys(tokens.semantic).filter((x) => /^elevation-[1-9]$/.test(x))) {
          const v = sem(n);
          for (const l of Array.isArray(v) ? v : []) {
            if (l.spread && !l.blur && !l.offsetY) continue; // border substitute
            if (c.shadow_blur_min != null && l.blur < c.shadow_blur_min && l.blur !== 0) r.failures.push(`${b.id}: ${n} blur ${l.blur}`);
            if (c.shadow_blur_max != null && l.blur > c.shadow_blur_max) r.failures.push(`${b.id}: ${n} blur ${l.blur}`);
            if (c.shadow_alpha_max != null && l.color.length === 9 && parseInt(l.color.slice(7), 16) / 255 > c.shadow_alpha_max + 0.005) r.failures.push(`${b.id}: ${n} alfa ${(parseInt(l.color.slice(7), 16) / 255).toFixed(2)}`);
          }
        }
      }
      if (c.font_families_max != null) { const fams = new Set(['font-sans', 'font-mono', 'font-display'].map((n) => { const v = sem(n); return Array.isArray(v) ? v[0] : null; }).filter(Boolean)); if (fams.size > c.font_families_max) r.failures.push(`${b.id}: ${fams.size} keluarga font`); }
    }
  });

  // ---------------- V14 ----------------
  run('V14', (r) => {
    const map = [['assets/tokens.json', 'tokens'], ['assets/design-language.json', 'design-language'], ['assets/lint-rules.json', 'lint-rules'], ['assets/components.json', 'components'], ['assets/patterns.json', 'patterns'], ['assets/glossary.json', 'glossary'], ['assets/lifecycle.json', 'lifecycle'], ['assets/wcag22.json', 'wcag22'], ['reports/assumptions.json', 'assumptions'], ['manifest.json', 'manifest'], ['migration-map.json', 'migration-map'], ['design-tool/variables.json', 'design-tool-variables'], ['design-tool/component-properties.json', 'component-properties'], ['brief.normalized.json', 'brief.normalized']];
    let any = false;
    for (const [f, s] of map) {
      if (!has(f)) continue;
      any = true; r.checks++;
      const errs = schemaValidate(readJson(join(engine, 'schemas', `${s}.schema.json`)), readJson(P(f)));
      for (const e of errs.slice(0, 8)) r.failures.push(`${f}: ${e}`);
    }
    if (!any) { r.failures.push('tidak ada file JSON paket'); return; }
    if (manifest) {
      r.checks++;
      if (manifest.engine_version !== ENGINE) r.failures.push(`manifest.engine_version ${manifest.engine_version} ≠ ${ENGINE}`);
      if (tokens && tokens.$metadata.engine_version !== ENGINE) r.failures.push(`tokens.$metadata.engine_version ≠ ${ENGINE}`);
    } else r.notes.push('manifest.json belum ada (wajib sejak Phase 0)');
  });

  // ---------------- V15 ----------------
  run('V15', (r) => {
    const mode = brief?.run_mode || manifest?.run_mode || 'greenfield';
    if (mode === 'greenfield') return 'NOT APPLICABLE';
    if (!has('migration-map.json')) r.failures.push(`run_mode ${mode} tanpa migration-map.json`);
    r.notes.push('pemeriksaan zona manual byte-identik butuh paket lama: jalankan dengan paket lama di B0 existing_package');
  });

  // ---------------- V16 ----------------
  run('V16', (r) => {
    const bm = json('reports', 'build-manifest.json');
    if (!bm) return 'NOT RUN';
    const tmp = mkdtempSync(join(tmpdir(), 'ds-v16-'));
    try {
      for (const f of ['assets/tokens.json', 'brief.normalized.json']) if (has(f)) cpSync(P(f), join(tmp, f), { recursive: true });
      const targets = [...new Set(Object.keys(bm.files).map(targetOf).filter(Boolean))];
      execFileSync('node', [join(engine, 'tools', 'build.mjs'), tmp, ...(targets.length ? ['--targets', targets.join(',')] : [])], { stdio: 'pipe' });
      const again = readJson(join(tmp, 'reports', 'build-manifest.json'));
      for (const [f, h] of Object.entries(bm.files)) { r.checks++; if (again.files[f] !== h) r.failures.push(`${f}: hash berbeda pada build ulang`); }
      for (const f of Object.keys(bm.files)) if (has(f)) { const cur = sha(readFileSync(P(f))); if (cur !== bm.files[f]) r.failures.push(`${f}: diedit tangan setelah build (R1)`); }
      for (const f of Object.keys(bm.files)) if (has(f) && /\b20\d\d-\d\d-\d\dT\d\d:\d\d|\/home\/|\/tmp\//.test(readFileSync(P(f), 'utf8'))) r.failures.push(`${f}: timestamp atau path absolut di artefak`);
    } finally { rmSync(tmp, { recursive: true, force: true }); }
  });

  // ---------------- V17 ----------------
  run('V17', (r) => {
    const pats = json('assets', 'patterns.json');
    if (!manifest || !pats) return 'NOT RUN';
    const schema = readJson(join(engine, 'schemas', 'patterns.schema.json'));
    const comps = new Set(manifest.components.map((c) => c.name));
    for (const m of manifest.patterns) {
      r.checks++;
      const p = pats.patterns.find((x) => x.name === m.name);
      if (!p) { r.failures.push(`${m.name}: tidak ada record`); continue; }
      for (const e of schemaValidate(schema.$defs.pattern, p, { root: schema }).slice(0, 5)) r.failures.push(`${m.name}: ${e}`);
      for (const c of p.composition) if (!comps.has(c.component)) r.failures.push(`${m.name}: memakai ${c.component} yang tidak ada di {N}`);
      if (!has(m.page)) r.failures.push(`${m.name}: halaman ${m.page} tidak ada`);
    }
    r.notes.push(`{P} = ${manifest.patterns.length}`);
  });

  // ---------------- V18 ----------------
  run('V18', (r) => {
    const tool = brief?.targets?.design_tool;
    if (!tool || tool === 'none') return 'NOT APPLICABLE';
    const v = json('design-tool', 'variables.json');
    if (!v) { r.failures.push('design-tool/variables.json tidak ada'); return; }
    const colorVars = new Set(v.collections.filter((c) => c.name === 'color').flatMap((c) => c.variables.map((x) => x.token)));
    for (const e of flatten(tokens)) if (e.layer === 'semantic' && e.token.$type === 'color') { r.checks++; if (!colorVars.has(e.name)) r.failures.push(`${e.name} tidak ada di koleksi color`); }
    const prim = v.collections.find((c) => c.name === 'primitive');
    if (prim && !prim.hidden_from_publishing) r.failures.push('koleksi primitive harus hidden_from_publishing');
    if (!brief?.targets?.design_tool_export) r.notes.push('drift NOT RUN (tanpa design_tool_export)');
  });

  // ---------------- V19 ----------------
  run('V19', (r) => {
    if (!has('tests', 'visual', '__baseline__')) { r.notes.push('baseline belum ada; run pertama melaporkan "baseline created" lewat qa.mjs --screenshots'); return 'NOT RUN'; }
    return 'NOT RUN';
  });

  // ---------------- V20 ----------------
  run('V20', (r) => {
    const gz = (fs) => fs.filter((f) => has(f)).reduce((s, f) => s + gzipSync(readFileSync(P(f))).length, 0) / 1024;
    if (!has('assets', 'tokens.css')) return 'NOT RUN';
    const t = gz(['assets/tokens.css', 'assets/tokens.js']);
    r.checks++; if (t > 30) r.failures.push(`paket token ${t.toFixed(1)} KB gzip > 30 KB (§14C)`); r.notes.push(`token: ${t.toFixed(1)} KB gzip`);
    if (has('assets', 'bundle.css')) { const c = gz(['assets/bundle.css', 'assets/bundle.js']); r.checks++; if (c > 120) r.failures.push(`paket komponen ${c.toFixed(1)} KB gzip > 120 KB`); r.notes.push(`komponen: ${c.toFixed(1)} KB gzip`); }
    if (has('assets', 'tokens.css') && /oklch\(/.test(readFileSync(P('assets', 'tokens.css'), 'utf8'))) r.failures.push('tokens.css memakai oklch() (harus hex sRGB, §8.3)');
  });

  // ---------------- V21 ----------------
  run('V21', (r) => {
    if (!has('packages')) return 'NOT RUN';
    const pk = readdirSync(P('packages'));
    r.checks = pk.length;
    for (const p of pk) { const d = P('packages', p); if (!['package.json', 'pubspec.yaml', 'Package.swift', 'build.gradle.kts'].some((m) => existsSync(join(d, m)))) r.notes.push(`packages/${p}: manifest paket belum ditulis (hanya file token)`); }
  });

  // ---------------- V22 ----------------
  run('V22', (r) => {
    const selected = new Set((brief?.components?.packs || []).map((p) => p.slice(0, 3)));
    const packDir = join(engine, 'packs');
    // identifiers only: component/pattern names in the data contracts and page file names (prose words like "Board" are not traces)
    const ids = new Set([...(json('assets', 'components.json')?.components || []).map((c) => c.name), ...(json('assets', 'patterns.json')?.patterns || []).flatMap((p) => [p.name, ...p.composition.map((c) => c.component)]), ...files.filter((f) => /\/(components|patterns)\/[A-Z]\w*\.html$/.test(f)).map((f) => f.split('/').pop().replace('.html', ''))]);
    for (const f of readdirSync(packDir).filter((x) => /^P\d\d-/.test(x))) {
      const id = f.slice(0, 3);
      if (selected.has(id)) { r.notes.push(`${id} terpilih: pemeriksaan ${id}-Vk dijalankan oleh run (bagian Validasi pack)`); continue; }
      for (const n of packNames(readFileSync(join(packDir, f), 'utf8'))) { r.checks++; if (ids.has(n) && !CORE_NAMES.has(n) && !BASE_PATTERN_NAMES.has(n)) r.failures.push(`${n} dari ${id} (tidak dipilih) muncul di keluaran`); }
    }
  });

  // ---------------- VB visual craft ----------------
  const themes = tokens ? tokens.$metadata.axes.theme : [];
  run('VB1', (r) => {
    if (!tokens) return 'NOT RUN';
    const order = ['caption', 'body', 'body-lg', 'h3', 'h2', 'h1', 'display'];
    const v = order.map((k) => sem(`type-${k}-size`));
    for (let i = 1; i < v.length; i++) { r.checks++; if (!(v[i] > v[i - 1])) r.failures.push(`type-${order[i]}-size (${v[i]}) ≤ type-${order[i - 1]}-size (${v[i - 1]})`); }
    const ratio = v[6] / v[1];
    r.checks++; if (ratio < 1.6) r.failures.push(`kontras skala display/body ${ratio.toFixed(2)} < 1.6 (hierarki lemah)`);
    r.checks++; if (sem('type-label-size') < sem('type-body-size')) r.failures.push('type-label-size < type-body-size');
    const w = ['h1', 'h2', 'h3'].map((k) => sem(`type-${k}-weight`));
    r.checks++; if (w.some((x) => x < sem('type-body-weight')) ) r.failures.push('bobot heading lebih ringan dari body');
  });
  run('VB2', (r) => {
    if (!tokens) return 'NOT RUN';
    const levels = Object.keys(tokens.semantic).filter((n) => /^elevation-[1-9]$/.test(n)).sort();
    const flat = lang?.decisions.L7.value.flat;
    const strength = (v) => (Array.isArray(v) ? v.reduce((s, l) => s + (l.blur + Math.abs(l.offsetY) * 2 + (l.spread || 0)) * (l.color.length === 9 ? parseInt(l.color.slice(7), 16) / 255 : 1), 0) : 0);
    for (const m of modeKeys(tokens).color) {
      const th = m.split('/')[1];
      const s = levels.map((n) => strength(sem(n, m)));
      const vals = levels.map((n) => JSON.stringify(sem(n, m)));
      for (let i = 1; i < s.length; i++) {
        r.checks++;
        const borderMode = vals[i] === vals[i - 1] && /"blur":0/.test(vals[i]) && /"offsetY":0/.test(vals[i]);
        if (borderMode) { const ov = sem('color-structure-surface-overlay', m), ra = sem('color-structure-surface-raised', m); if (flat || ov !== ra || th.match(/High|Outdoor|Dark/)) continue; }
        if (!(s[i] > s[i - 1]) && !flat) r.failures.push(`${m}: ${levels[i]} tidak lebih kuat dari ${levels[i - 1]}`);
      }
    }
  });
  run('VB3', (r) => {
    if (!tokens) return 'NOT RUN';
    const sp = Object.keys(tokens.semantic).filter((n) => /^space-(half|\d+)$/.test(n)).map((n) => [n, sem(n)]).sort((a, b) => a[1] - b[1]);
    for (let i = 0; i < sp.length; i++) { r.checks++; if (sp[i][1] % 4 !== 0 && sp[i][0] !== 'space-half') r.failures.push(`${sp[i][0]} = ${sp[i][1]} bukan kelipatan 4`); if (i && sp[i][1] === sp[i - 1][1]) r.failures.push(`${sp[i][0]} sama dengan ${sp[i - 1][0]}`); }
  });
  run('VB4', (r) => {
    if (!tokens) return 'NOT RUN';
    const v = ['none', 'xs', 'sm', 'md', 'lg'].map((k) => sem(`radius-${k}`));
    for (let i = 1; i < v.length; i++) { r.checks++; if (v[i] < v[i - 1]) r.failures.push(`radius-${['none', 'xs', 'sm', 'md', 'lg'][i]} (${v[i]}) < radius-${['none', 'xs', 'sm', 'md', 'lg'][i - 1]} (${v[i - 1]})`); }
  });
  run('VB5', (r) => {
    if (!tokens) return 'NOT RUN';
    const v = ['instant', 'fast', 'base', 'slow'].map((k) => sem(`motion-${k}-duration`));
    for (let i = 1; i < v.length; i++) { r.checks++; if (!(v[i] > v[i - 1])) r.failures.push(`motion durasi tidak naik ketat: ${v.join(' / ')}`); }
    r.checks++; if (v[3] > 500) r.failures.push(`motion-slow ${v[3]}ms > 500ms`);
  });
  run('VB6', (r) => {
    if (!tokens) return 'NOT RUN';
    for (const d of modeKeys(tokens).density) { const v = ['sm', 'md', 'lg'].map((k) => sem(`control-height-${k}`, d)); r.checks++; if (!(v[0] < v[1] && v[1] < v[2])) r.failures.push(`${d}: control-height ${v.join(' / ')} tidak naik`); r.checks++; if (v[0] < sem('target-min-pointer')) r.failures.push(`${d}: control-height-sm ${v[0]} < target pointer 24`); }
  });
  run('VB7', (r) => {
    if (!tokens) return 'NOT RUN';
    for (const k of ['caption', 'body', 'body-lg', 'label', 'code', 'h3', 'h2', 'h1', 'display']) {
      const ratio = sem(`type-${k}-line`) / sem(`type-${k}-size`);
      const [lo, hi] = ['body', 'body-lg', 'label', 'code', 'caption'].includes(k) ? [1.3, 1.75] : [1.05, 1.5];
      r.checks++; if (ratio < lo || ratio > hi) r.failures.push(`type-${k}: tinggi baris ${ratio.toFixed(2)} di luar ${lo}–${hi}`);
      r.checks++; if (sem(`type-${k}-line`) % 2) r.failures.push(`type-${k}-line ganjil (${sem(`type-${k}-line`)}); grid 2 px`);
    }
  });
  run('VB8', (r) => {
    if (!tokens) return 'NOT RUN';
    for (const m of modeKeys(tokens).color) {
      const base = sem('color-structure-surface-base', m);
      const c = ['primary', 'secondary', 'tertiary'].map((k) => contrast(sem(`color-structure-text-${k}`, m), base));
      const th = m.split('/')[1];
      const hc = /High|Outdoor/.test(th);
      r.checks++;
      if (!hc && !(c[0] > c[1] && c[1] > c[2])) r.failures.push(`${m}: hierarki teks primary ${c[0]} / secondary ${c[1]} / tertiary ${c[2]} tidak menurun`);
      if (!hc && c[0] - c[2] < 2) r.failures.push(`${m}: primary vs tertiary hanya berbeda ${(c[0] - c[2]).toFixed(1)} (hierarki tak terlihat)`);
    }
  });
  run('VB9', (r) => {
    if (!tokens) return 'NOT RUN';
    for (const m of modeKeys(tokens).color) {
      const base = sem('color-structure-surface-base', m);
      const a = contrast(sem('color-structure-border', m), base), b = contrast(sem('color-structure-border-strong', m), base), ctl = contrast(sem('color-structure-border-control', m), base);
      r.checks++; if (!(b > a * 1.15)) r.failures.push(`${m}: border-strong (${b}) tidak terlihat lebih kuat dari border (${a})`);
      r.checks++; if (!(a > 1.08)) r.failures.push(`${m}: border (${a}) nyaris tak terlihat di surface-base`);
      r.checks++; if (!(ctl > b)) r.failures.push(`${m}: border-control (${ctl}) tidak lebih kuat dari border-strong (${b})`);
    }
  });
  run('VB10', (r) => {
    if (!lang) return 'NOT RUN';
    const L4 = lang.decisions.L4.value;
    const fams = [L4.families.ui, L4.families.display, L4.families.mono].filter(Boolean);
    r.checks++; if (fams.length > 3) r.failures.push(`${fams.length} keluarga font`);
    const w = new Set([...(L4.weights || []), ...(L4.display_weights || [])]);
    r.checks++; if (w.size > 4) r.failures.push(`${w.size} bobot font (maks 4)`);
  });
  run('VB11', (r) => {
    if (!tokens) return 'NOT RUN';
    const icon = sem('icon-md'), line = sem('type-body-line'), body = sem('type-body-size');
    r.checks++; if (icon > line) r.failures.push(`icon-md ${icon} > tinggi baris body ${line}`);
    r.checks++; if (icon < body) r.failures.push(`icon-md ${icon} < ukuran body ${body} (ikon terlihat kecil di samping teks)`);
  });
  run('VB12', (r) => {
    if (!tokens) return 'NOT RUN';
    for (const m of modeKeys(tokens).color) for (let i = 1; i < 5; i++) {
      r.checks++;
      const d = oklabDistance(sem(`chart-cat-${i}`, m), sem(`chart-cat-${i + 1}`, m));
      if (d < 0.08) r.failures.push(`${m}: chart-cat-${i} vs chart-cat-${i + 1} jarak ${d.toFixed(3)} < 0.08`);
    }
  });

  // ---------------- tier ----------------
  const st = (id) => results.find((x) => x.id === id)?.status;
  const ok = (ids) => ids.every((id) => ['PASS', 'NOT APPLICABLE'].includes(st(id)));
  let tier = 'none';
  const v14 = results.find((x) => x.id === 'V14');
  const v14Foundation = !v14 || v14.failures.every((f) => !/^(assets\/(tokens|design-language|lint-rules)\.json|brief\.normalized\.json)/.test(f));
  if (ok(['V1', 'V2', 'V11', 'V13', 'VB1', 'VB2', 'VB4', 'VB5', 'VB8']) && v14Foundation) tier = 'T0';
  if (tier === 'T0' && manifest && ok(['V5', 'V9', 'V17', 'V4', 'V6', 'V14'])) {
    const r = manifest.components.filter((c) => c.tier === 'R').length >= 32 && manifest.patterns.filter((p) => p.tier === 'R').length >= 6;
    if (r) tier = 'T1';
    const all = manifest.components.every((c) => has(c.page) && has(c.preview));
    if (r && all) tier = 'T2';
    if (tier === 'T2' && ok(['V16', 'V18', 'V20', 'V21', 'V22'])) tier = 'T3';
  }
  const summary = { checks: 0, pass: 0, fail_blocking: 0, fail_advisory: 0, not_run: 0, not_applicable: 0 };
  for (const x of results) {
    summary.checks += x.checks;
    if (x.status === 'PASS') summary.pass++;
    else if (x.status === 'FAIL') x.severity === 'blocking' ? summary.fail_blocking++ : summary.fail_advisory++;
    else if (x.status === 'NOT RUN') summary.not_run++;
    else summary.not_applicable++;
  }
  return { engine_version: ENGINE, package: brief?.product_name || relative(process.cwd(), dir) || '.', generated_by: 'tools/validate.mjs', tier_reached: tier, summary, validators: results, baseline };

  function rel(f) { return relative(dir, f); }
}

// minimal glob semantics for lint-rules applies_to: "**/*.css", "components/**/*.css", "components/**/!(A|B)*.css"
function appliesTo(globs, f) {
  const base = f.split('/').pop();
  return (globs || ['**/*']).some((g) => {
    if (!/\.css$/.test(g) && !/\*\*\/\*$/.test(g)) return false;
    if (/^(components|src)\//.test(g) && !/\/(components|src)\//.test(f)) return false;
    const ex = g.match(/!\(([^)]+)\)/);
    if (ex && ex[1].split('|').some((n) => base.startsWith(n))) return false;
    return true;
  });
}

function walk(d, out = []) {
  if (!existsSync(d)) return out;
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) { if (!['node_modules', '.git'].includes(e)) walk(p, out); } else out.push(p);
  }
  return out;
}
function targetOf(f) {
  if (f.startsWith('adapters/antd')) return 'antd'; if (f.startsWith('adapters/mui')) return 'mui'; if (f.startsWith('adapters/shadcn')) return 'shadcn';
  if (f.includes('tailwind')) return 'tailwind'; if (f.endsWith('.dart')) return 'flutter'; if (f.endsWith('.swift')) return 'swiftui'; if (f.endsWith('.kt')) return 'compose';
  if (f.startsWith('design-tool')) return 'figma'; return null;
}
const sha = (b) => import.meta && createHashSync(b);
import { createHash } from 'node:crypto';
function createHashSync(b) { return createHash('sha256').update(b).digest('hex'); }
function packNames(md) {
  const names = new Set();
  const sec = md.split(/\n## /).filter((s) => /^P\d\d\.[45] (Komponen|Pattern)/.test(s));
  for (const s of sec) for (const m of s.matchAll(/^\|\s*`?([A-Z][A-Za-z0-9]+)`?\s*\|/gm)) if (!['Komponen', 'Pattern', 'Nama', 'Tingkat'].includes(m[1])) names.add(m[1]);
  return [...names];
}

export function reportMd(v) {
  const L = [`# Laporan verifikasi`, '', `Engine ${v.engine_version} · paket ${v.package} · dihasilkan \`${v.generated_by}\` · **tier tercapai: ${v.tier_reached}**`, '',
    `Validator: ${v.summary.pass} PASS · ${v.summary.fail_blocking} FAIL blocking · ${v.summary.fail_advisory} FAIL advisory · ${v.summary.not_run} NOT RUN · ${v.summary.not_applicable} NOT APPLICABLE · ${v.summary.checks} pemeriksaan.`, '',
    `Baseline: rasio kontras teks terendah ${v.baseline.min_text_contrast ?? 'NOT RUN'} · teks isi terkecil ${v.baseline.min_body_font_px ?? 'NOT RUN'} px · target sentuh terkecil ${v.baseline.min_touch_target_px ?? 'NOT RUN'} px · WCAG ${Object.entries(v.baseline.wcag_sc_status).map(([k, n]) => `${k} ${n}`).join(', ') || 'NOT RUN'}.`, '',
    '| ID | Validator | Status | Sifat | Pemeriksaan | Temuan |', '|---|---|---|---|---|---|'];
  for (const x of v.validators) L.push(`| ${x.id} | ${x.name} | ${x.status} | ${x.severity} | ${x.checks} | ${x.failures.length} |`);
  for (const x of v.validators.filter((y) => y.failures.length || y.notes.length)) {
    L.push('', `## ${x.id} ${x.name} · ${x.status}`);
    for (const f of x.failures.slice(0, 40)) L.push(`- ${f}`);
    if (x.failures.length > 40) L.push(`- … ${x.failures.length - 40} temuan lain di verification.json`);
    for (const n of x.notes.slice(0, 15)) L.push(`- catatan: ${n}`);
  }
  L.push('', 'Hasil NOT RUN tidak boleh ditulis sebagai PASS di laporan akhir (§18).');
  return L.join('\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  const dir = args.find((a) => !a.startsWith('--') && !['--only', '--gate'].includes(args[args.indexOf(a) - 1]));
  if (!dir) { console.error('usage: validate.mjs <packageDir> [--only V1,V2] [--gate P1]'); process.exit(2); }
  const oi = args.indexOf('--only'), gi = args.indexOf('--gate');
  const only = oi >= 0 ? args[oi + 1].split(',') : gi >= 0 ? GATES[args[gi + 1]] : null;
  const v = validatePackage(dir, { only });
  writeJson(join(dir, 'reports', 'verification.json'), v);
  writeText(join(dir, 'reports', 'verification-report.md'), reportMd(v));
  for (const x of v.validators) console.log(`${x.id.padEnd(5)} ${x.status.padEnd(15)} ${x.severity.padEnd(9)} ${x.failures.length ? x.failures[0].slice(0, 110) : ''}`);
  console.log(`tier ${v.tier_reached} · blocking FAIL ${v.summary.fail_blocking} · advisory FAIL ${v.summary.fail_advisory} · NOT RUN ${v.summary.not_run}`);
  process.exitCode = v.summary.fail_blocking ? 1 : 0;
}
