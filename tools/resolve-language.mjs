#!/usr/bin/env node
// Phase 0B: brief.normalized.json + catalog/archetypes.json -> assets/design-language.json, assets/lint-rules.json,
// reports/engine-assumptions.json. Deterministic: same input, byte-identical output.
// Usage: node tools/resolve-language.mjs <brief.normalized.json> <outDir> [--org <org design-language.json>]
import { existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, writeJson } from './lib/tokens.mjs';

const ENGINE = '1.9.1';
const here = dirname(fileURLToPath(import.meta.url));
const catalog = readJson(join(here, '..', 'catalog', 'archetypes.json'));

export function resolveLanguage(brief, opts = {}) {
  const L = brief.language || {};
  const assumptions = [];
  const assume = (statement, reason, default_taken, files = ['assets/design-language.json']) =>
    assumptions.push({ statement, reason, default_taken, confirm_by: 'product owner', status: 'needs owner confirmation', files });

  let mode = L.mode || 'archetype';
  let archetype = L.archetype;
  let scores, vetoes = [];
  const ids = Object.keys(catalog.archetypes);
  const vetoSet = new Set([...(L.must_not_look_like || []), ...(L.dislikes || []).filter((d) => ids.includes(d)), ...(L.pack_vetoes || [])]);
  vetoes = [...vetoSet].filter((v) => ids.includes(v)).sort().map((a) => ({ archetype: a, reason: (L.pack_vetoes || []).includes(a) ? 'pack veto' : 'brief must_not_look_like/dislikes' }));

  if (mode === 'derive' || (mode === 'custom' && !archetype)) {
    const p = L.personality;
    if (!p) throw new Error('language.personality required for derive/custom without archetype');
    scores = {};
    for (const id of ids) {
      const ap = catalog.archetypes[id].personality;
      scores[id] = ['formality', 'warmth', 'expressiveness', 'density', 'risk_criticality'].reduce((s, k) => s + (4 - Math.abs(ap[k] - p[k])), 0);
    }
    const ranked = ids.filter((id) => !vetoSet.has(id)).sort((a, b) => scores[b] - scores[a] || catalog.risk_order.indexOf(a) - catalog.risk_order.indexOf(b));
    if (!ranked.length) throw new Error('every archetype vetoed');
    archetype = ranked[0];
  }
  if (mode === 'inherit') {
    if (!opts.org) throw new Error('inherit mode requires --org <design-language.json>');
  }
  if (mode !== 'inherit' && !catalog.archetypes[archetype]) throw new Error(`unknown archetype: ${archetype}`);
  if (vetoSet.has(archetype) && mode === 'archetype') throw new Error(`archetype ${archetype} is vetoed by the brief or a selected pack (open only via brief + ADR)`);

  const A = mode === 'inherit' ? null : structuredClone(catalog.archetypes[archetype]);
  const src = mode === 'inherit' ? 'org' : mode === 'custom' ? 'derived' : 'archetype';

  // Brand handling (§4.6 step 5, §4.8)
  const brands = (L.brands && L.brands.length ? L.brands : [{ id: 'default' }]).map((b) => ({ id: b.id, interaction_hex: b.interaction_hex || null, accent_hexes: b.accent_hexes || [], font_ui: b.font_ui || null }));

  let decisions;
  if (mode === 'inherit') {
    decisions = structuredClone(opts.org.decisions);
    for (const d of Object.values(decisions)) { d.source = 'org'; delete d.overrides; }
  } else {
    const neutral = { ...A.color.neutral };
    if (L.neutral_temperature === 'warm') neutral.h = 70;
    if (L.neutral_temperature === 'cool') neutral.h = 250;
    if (L.neutral_temperature === 'neutral') neutral.c = 0;
    if (A.color.interaction.source === 'brand' && !brands.some((b) => b.interaction_hex) && A.color.interaction.default_is_assumption) {
      assume(`Warna interaksi memakai seed default archetype ${archetype} (OKLCH ${A.color.interaction.h} · ${A.color.interaction.c} · ${A.color.interaction.l}) karena brief tidak memberi warna merek.`, 'B6 brands[].interaction_hex kosong', 'seed default archetype (§4.5 c1)');
    }
    const themes = (L.themes && L.themes.length ? L.themes : A.themes.map((name) => ({ name }))).map((t) => ({ name: t.name, base: t.base || baseOf(t.name), purpose: t.purpose || defaultPurpose(t.name) }));
    for (const t of themes) if (!t.base) throw new Error(`theme ${t.name}: base (light|dark|hc-light|hc-dark) required for custom theme names (L12)`);
    const densityModes = uniq((brief.surfaces || []).flatMap((s) => s.density_modes || [])).filter((d) => ['comfortable', 'compact', 'spacious'].includes(d));
    decisions = {
      L1: { value: { principles: A.principles }, rationale: `Prinsip archetype ${archetype}.` },
      L2: { value: { ...A.color, neutral, brands }, rationale: 'Strategi warna archetype; seed per brand dari B6.' },
      L3: { value: { attention: A.attention }, rationale: 'Kebijakan perhatian archetype.' },
      L4: { value: { ...A.type, fallbacks: catalog.font_fallbacks }, rationale: 'Tipografi archetype; skala 9 token lengkap (engine 1.8.0).' },
      L5: { value: { space: A.space, control_height: A.control_height, touch_rule: A.touch_rule, density_modes: densityModes.length ? densityModes : ['comfortable'] }, rationale: 'Ruang dan kepadatan archetype; mode kepadatan dari B3.' },
      L6: { value: { radius: A.radius, border_width: A.border_width, container_rule: A.container_rule }, rationale: 'Bentuk archetype.' },
      L7: { value: A.elevation, rationale: 'Elevasi archetype; jumlah tingkat eksplisit (engine 1.8.0).' },
      L8: { value: A.motion, rationale: 'Gerak archetype.' },
      L9: { value: { ...A.icons, glyphs: catalog.icon_sets[A.icons.set].glyphs, license: catalog.icon_sets[A.icons.set].license, illustration: A.illustration }, rationale: 'Set ikon archetype; nama glyph Not verified against the pinned version.' },
      L10: { value: { ...A.dataviz, categorical_hues: catalog.dataviz.categorical_hues, diverging: catalog.dataviz.diverging, hatch: catalog.dataviz.hatch }, rationale: 'Palet data-viz turunan Okabe-Ito.' },
      L11: { value: A.voice, rationale: 'Suara archetype.' },
      L12: { value: { themes }, rationale: 'Tema dari B6 atau bawaan archetype.' },
      L13: { value: { bans: A.bans }, rationale: 'Larangan archetype.' },
      L14: { value: { platform: A.platform, note: A.platform_note }, rationale: 'Adaptasi platform archetype.' },
      L15: { value: A.material, rationale: 'Material archetype.' },
      L16: { value: A.feedback, rationale: 'Umpan balik interaksi archetype.' },
      L17: { value: A.layout, rationale: 'Komposisi layout archetype.' },
    };
    for (const d of Object.values(decisions)) d.source = src;
    if (L.neutral_temperature) { decisions.L2.source = 'brief'; }
    if (L.themes && L.themes.length) decisions.L12.source = 'brief';
  }

  // Visual profile (engine 1.9.0): a known library look (antd-v6, shadcn) owns the visual primitives; the archetype keeps
  // personality, voice, principles and non-visual bans. Applied before brief overrides, so the brief still wins.
  let profile = null;
  const pid = L.visual_profile && L.visual_profile !== 'engine' ? L.visual_profile : null;
  if (pid) {
    const pf = join(here, '..', 'catalog', 'profiles', `${pid}.json`);
    if (!existsSync(pf)) throw new Error(`unknown visual_profile: ${pid} (available: engine, ${listProfiles().join(', ')})`);
    profile = readJson(pf);
    if (mode === 'inherit') throw new Error('visual_profile cannot be combined with language.mode inherit; put the profile in the org language instead');
    for (const [k, v] of Object.entries(profile.overlay)) {
      const d = decisions[k];
      if (k === 'L2') {
        const neutral = { ...v.neutral };
        if (L.neutral_temperature === 'warm') { neutral.h = 70; neutral.c = Math.max(neutral.c, 0.01); }
        if (L.neutral_temperature === 'cool') { neutral.h = 250; neutral.c = Math.max(neutral.c, 0.012); }
        if (L.neutral_temperature === 'neutral') neutral.c = 0;
        d.value = { ...d.value, neutral, interaction: { ...v.interaction } };
      } else if (k === 'L4') d.value = { ...d.value, ...structuredClone(v), fallbacks: d.value.fallbacks };
      else if (k === 'L9') { const set = catalog.icon_sets[v.set] || {}; d.value = { ...d.value, ...structuredClone(v), glyphs: set.glyphs || d.value.glyphs, license: set.license || d.value.license }; }
      else if (k === 'L3') d.value = { attention: { ...v.attention } };
      else d.value = { ...d.value, ...structuredClone(v) };
      d.source = 'profile';
      d.rationale = `${d.rationale} Profil visual ${profile.id} (${profile.name}) menimpa nilai visual.`;
    }
    const visualBan = (b) => {
      const c = b.check || {};
      return /^radius/.test(c.token || '') || /^radius/.test(c.tokens || '') || ['shadow_blur_min', 'shadow_blur_max', 'shadow_alpha_max', 'elevation_levels_max', 'neutral_chroma_min', 'neutral_hue_follows'].some((k) => k in c) || /bayangan|radius|sudut/i.test(b.statement || '');
    };
    decisions.L13.value.bans = decisions.L13.value.bans.map((b) => (visualBan(b) ? { ...b, suspended_by: profile.id } : b));
  }

  // Overrides (hybrid / custom / inherit)
  const overrides = L.overrides || [];
  const touched = new Set();
  for (const o of overrides) {
    const d = decisions[o.decision];
    if (!d) throw new Error(`override: unknown decision ${o.decision}`);
    const from = getPath(d.value, o.path);
    setPath(d.value, o.path, o.value);
    (d.overrides ||= []).push({ from: from === undefined ? null : from, to: o.value, reason: o.reason || '', source: 'brief' });
    d.source = 'brief';
    if (o.decision !== 'L1' && o.decision !== 'L13') touched.add(o.decision);
  }
  if (mode === 'archetype' && touched.size > 4) mode = 'custom';
  if (mode === 'inherit' && touched.size > 2) mode = 'custom';

  // Baseline adjustments (R13): body text >= 16, caption >= 12.
  const baseline_adjustments = [];
  const scale = decisions.L4.value.scale;
  for (const k of ['body', 'label', 'code', 'body_lg', 'h3', 'h2', 'h1', 'display']) {
    if (scale[k] < 16) { baseline_adjustments.push({ decision: 'L4', from: { [k]: scale[k] }, to: { [k]: 16 }, rule: 'STD-2' }); scale[k] = 16; }
  }
  if (scale.caption < 12) { baseline_adjustments.push({ decision: 'L4', from: { caption: scale.caption }, to: { caption: 12 }, rule: 'STD-2' }); scale.caption = 12; }

  const testable = {
    L1: ['Setiap prinsip merujuk larangan LB-nn atau aturan engine (V13)'],
    L2: ['Pemisahan hue interaksi vs semantik ≥ 30° atau ADR (derive-tokens)', 'Semua pasangan §5.5 lolos (V2)'],
    L3: ['Kelas yang tidak boleh filled tidak memakai fill semantik solid (lint token-rule)'],
    L4: ['Skala tipe naik ketat: caption < body < body-lg < h3 < h2 < h1 < display (VB1)', 'Teks isi ≥ 16 (V11)'],
    L5: ['Langkah spasi naik ketat di grid 4 px (VB3)', 'compact tidak aktif di mode sentuh (V11)'],
    L6: ['radius-xs ≤ sm ≤ md ≤ lg (VB4)'],
    L7: ['Elevasi naik ketat di tema berstrategi bayangan, atau flat dinyatakan (VB2)'],
    L8: ['fast < base < slow (VB5)'],
    L9: ['Satu glyph per makna status (§5.7)'],
    L10: ['chart-cat ≥ 3:1 dan lolos simulasi buta warna (V2)'],
    L11: ['Contoh microcopy per ui_locale di components.json (V5)'],
    L12: ['Himpunan token identik di semua tema (V1)'],
    L13: ['Setiap larangan menjadi aturan lint atau item tinjauan (V6, V13)'],
    L14: ['Daftar kontrol native di dokumen 95'],
    L15: ['backdrop-filter punya fallback padat (V6)'],
    L16: ['Strategi state tercermin di token state-layer-* (V13)'],
    L17: ['layout-content-max dan space-section* sesuai L17 (V13)'],
  };
  for (const [k, d] of Object.entries(decisions)) d.testable_consequence = testable[k];

  const out = {
    engine_version: ENGINE,
    mode,
    ...(archetype && mode !== 'inherit' ? { archetype } : {}),
    ...(opts.org ? { org_language: { path: opts.orgPath, version: opts.org.version || '0.0.0' } } : {}),
    ...(scores ? { scores } : {}),
    ...(vetoes.length ? { vetoes } : {}),
    ...(profile ? { profile: { id: profile.id, name: profile.name, library: profile.library, adapter: profile.adapter, icon_set: profile.icon_set, reference_css: profile.reference_css, components: profile.components, layout: profile.layout, baseline_adjustments: profile.baseline_adjustments } } : { profile: { id: 'engine', name: 'Engine reference', icon_set: 'engine', reference_css: null } }),
    decisions,
    baseline_adjustments,
    adr: ['ADR-L1'],
  };
  return { language: out, assumptions, lint: lintRules(decisions) };
}

function lintRules(decisions) {
  const universal = [
    ['UB1', 'Hex mentah, nilai ramp primitif, atau ukuran/jarak ajaib di dalam komponen', 'css-pattern', '#[0-9a-fA-F]{3,8}\\b', ['components/**/*.css', 'src/**/*.css', 'src/**/*.js'], 'I3'],
    ['UB2', 'Status atau seleksi yang hanya dibedakan lewat warna', 'manual-review', null, ['components/*'], 'I2', 'Apakah setiap status punya ikon terkunci + teks, dan setiap seleksi punya penanda non-warna?'],
    ['UB3', 'Teks isi di bawah 16 px/dp; teks pendukung di bawah 12', 'css-pattern', 'font-size\\s*:\\s*(?:[0-9]|1[0-5])(?:\\.[0-9]+)?px', ['**/*.css'], 'STD-2'],
    ['UB4', 'Kontras teks di bawah 4.5:1', 'token-rule', 'V2', ['assets/tokens.json'], 'STD-3'],
    ['UB5', 'Area klik di bawah 44×44 pada sentuh (24×24 pointer)', 'token-rule', 'V9,V11', ['previews/*'], 'STD-4'],
    ['UB6', 'Tautan di teks berjalan tanpa penanda non-warna', 'css-pattern', '(?:^|[\\s,}])(?:p|li|td|dd|\\.ds-prose) a(?::[a-z-]+)?\\s*\\{[^}]*text-decoration\\s*:\\s*none', ['**/*.css'], 'SC 1.4.1'],
    ['UB7', 'Drag tanpa alternatif satu-pointer dan keyboard', 'manual-review', null, ['components/*'], 'SC 2.5.7', 'Apakah setiap drag punya alternatif Menu/form dan keyboard?'],
    ['UB8', 'Menghapus indikator fokus; fokus tertutup header atau bar sticky', 'css-pattern', 'outline\\s*:\\s*(?:none|0)\\s*[;}]', ['**/*.css'], 'SC 2.4.7, 2.4.11'],
    ['UB9', 'Informasi penting hanya di tooltip, hover, atau animasi', 'manual-review', null, ['components/*'], 'SC 1.4.13, 2.2.2', 'Apakah ada informasi penting yang hanya muncul di tooltip, hover, atau animasi?'],
    ['UB10', 'Placeholder sebagai satu-satunya label; aksi diblokir tanpa alasan terlihat', 'css-pattern', '<button[^>]*\\sdisabled(?![-\\w])', ['components/**/*.html', 'previews/**/*.html'], 'SC 3.3.2, I2'],
    ['UB11', 'Elemen sehat (C4-C6) lebih keras daripada C1-C2', 'token-rule', 'attention-order', ['assets/design-language.json'], 'I7'],
    ['UB12', 'Warna interaksi atau merek dipakai sebagai warna status', 'token-rule', 'hue-separation', ['assets/tokens.json'], 'I1'],
    ['ENG-RTL', 'Properti CSS fisik di komponen (§12.4)', 'css-pattern', '(?<![-\\w])(?:margin|padding|border)-(?:left|right)\\s*:|(?<![-\\w])(?:left|right)\\s*:|text-align\\s*:\\s*(?:left|right)', ['components/**/*.css', 'src/**/*.css'], '§12.4'],
    ['ENG-BLUR', 'backdrop-filter tanpa fallback padat (§9.3)', 'manual-review', null, ['**/*.css'], '§9.3', 'Apakah setiap backdrop-filter punya fallback padat di prefers-reduced-transparency dan forced-colors?'],
  ];
  const rules = universal.map(([id, statement, kind, pattern, applies_to, source, question]) => ({
    id, statement, kind, ...(pattern ? { pattern } : {}), ...(question ? { question } : {}), applies_to, source, severity: kind === 'manual-review' ? 'review' : 'error',
  }));
  for (const b of decisions.L13.value.bans.filter((x) => !x.suspended_by)) {
    const kind = b.kind === 'css-pattern' && !b.pattern ? 'manual-review' : b.kind;
    rules.push({
      id: b.id, statement: b.statement, kind,
      ...(b.pattern ? { pattern: b.pattern } : {}),
      ...(b.check ? { pattern: JSON.stringify(b.check) } : {}),
      ...(kind === 'manual-review' ? { question: b.question || `Apakah ada: ${b.statement}?` } : {}),
      applies_to: b.applies_to || ['assets/tokens.json'], source: 'L13', severity: kind === 'manual-review' ? 'review' : 'error',
    });
  }
  return { rules };
}

function baseOf(name) {
  const n = name.toLowerCase();
  if (n === 'light') return 'light';
  if (n === 'dark') return 'dark';
  if (n === 'high-contrast' || n === 'outdoor') return 'hc-light';
  if (n === 'high-contrast-dark') return 'hc-dark';
  return null;
}
function defaultPurpose(name) {
  return { Light: 'tema terang standar', Dark: 'tema gelap; luminans dibalik, chroma dikurangi', 'High-contrast': 'kontras tinggi: teks mendekati hitam, border kuat, bayangan diganti border', Outdoor: 'sinar matahari langsung: diturunkan dari High-contrast' }[name] || name;
}
const uniq = (a) => [...new Set(a)];
function listProfiles() { return readdirSync(join(here, '..', 'catalog', 'profiles')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5)).sort(); }
function getPath(o, p) { return p.split('.').reduce((n, k) => (n == null ? undefined : n[k]), o); }
function setPath(o, p, v) { const ks = p.split('.'); let n = o; for (const k of ks.slice(0, -1)) n = n[k] ??= {}; n[ks.at(-1)] = v; }

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [briefPath, outDir] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  if (!briefPath || !outDir) { console.error('usage: resolve-language.mjs <brief.normalized.json> <outDir> [--org <path>]'); process.exit(2); }
  const orgIdx = process.argv.indexOf('--org');
  const orgPath = orgIdx > 0 ? process.argv[orgIdx + 1] : null;
  const brief = readJson(briefPath);
  const { language, assumptions, lint } = resolveLanguage(brief, orgPath && existsSync(orgPath) ? { org: readJson(orgPath), orgPath } : {});
  writeJson(join(outDir, 'assets', 'design-language.json'), language);
  writeJson(join(outDir, 'assets', 'lint-rules.json'), lint);
  writeJson(join(outDir, 'reports', 'engine-assumptions.json'), { entries: assumptions });
  console.log(`OK design-language: mode=${language.mode} archetype=${language.archetype || '-'} profile=${language.profile.id} themes=${language.decisions.L12.value.themes.map((t) => t.name).join(',')} lint=${lint.rules.length} assumptions=${assumptions.length}`);
}
