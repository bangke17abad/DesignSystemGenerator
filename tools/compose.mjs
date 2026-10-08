#!/usr/bin/env node
// Phase 3-5 (engine 1.8.0): select {N} and {P} from the brief (M03 §6.1, §6.7, M08 §11.2) and compose manifest.json,
// assets/components.json, assets/patterns.json, assets/wcag22.json and reports/scope.md from the canonical catalogue.
// The run then only authors what is project-specific (domain components, locale strings beyond en-US/id-ID, role notes).
// Usage: node tools/compose.mjs <packageDir>   (needs brief.normalized.json, assets/design-language.json, assets/tokens.json)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readJson, writeJson, writeText, resolveToken, modeKeys } from './lib/tokens.mjs';
import { CORE_INDEX } from './check-catalog.mjs';
import { PATTERN_INDEX } from './check-patterns.mjs';

const ENGINE = '1.8.0';
const engine = join(dirname(fileURLToPath(import.meta.url)), '..');
const cat = (n) => readJson(join(engine, 'catalog', 'components', `${n}.json`));
const pcat = (n) => readJson(join(engine, 'catalog', 'patterns', `${n}.json`));
const snake = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

export function selectScope(brief, lang) {
  const surfaces = brief.surfaces || [];
  const excluded = Object.fromEntries((brief.components?.exclusions || []).map((e) => [e.component, e.reason]));
  const include = Object.fromEntries((brief.components?.include || []).map((e) => [e.component, e.reason]));
  const phone = surfaces.some((s) => /ponsel|phone|mobile|handheld/i.test(s.device || '') || (/android|ios/i.test(s.os_runtime || '') && !/tablet/i.test(s.device || '')));
  const unstable = surfaces.some((s) => ['offline-first', 'intermittent'].includes(s.connectivity));
  const native = surfaces.some((s) => /android|ios|ipados/i.test(s.os_runtime || ''));
  const wide = surfaces.some((s) => !/ponsel|phone|mobile|handheld/i.test(s.device || '') || /web/i.test(s.os_runtime || ''));
  const entities = (brief.domain?.entities || []).length > 0;
  const dataviz = (brief.domain?.dataviz || []).length > 0;
  const operational = surfaces.some((s) => s.surface_type === 'operational');
  const critical = brief.domain?.critical_events || [];
  const keyboardFirst = lang.archetype === 'dense-console' || (lang.decisions.L1.value.principles || []).some((p) => /keyboard/i.test(p));
  const comps = new Map(), reasons = [], exclusions = [];
  const add = (n, why) => { if (!comps.has(n)) { comps.set(n, why); reasons.push({ component: n, reason: why }); } };
  for (const [n, c] of Object.entries(CORE_INDEX)) {
    if (c.tier === 'R') { add(n, 'R: wajib'); continue; }
    if (c.tier === 'S') {
      if (excluded[n]) { exclusions.push({ component: n, reason: excluded[n] }); continue; }
      if (n === 'BottomNav' && !phone) { exclusions.push({ component: n, reason: 'tidak ada surface ponsel di B3' }); continue; }
      if (n === 'ConnectionStatus' && !unstable) { exclusions.push({ component: n, reason: 'tidak ada surface offline-first atau konektivitas tidak stabil di B3' }); continue; }
      add(n, 'S: standar'); continue;
    }
    // O
    if (include[n]) add(n, `O: B7 include (${include[n]})`);
    else if (n === 'CommandPalette' && keyboardFirst) add(n, 'O: bahasa keyboard-first (§6.1)');
    else if (n === 'StepUpDialog' && critical.some((e) => /financial|legal/.test(e.severity || ''))) add(n, 'O: event kritis finansial/hukum di B5');
    else if (n === 'Chart' && dataviz) add(n, 'O: B5 data_viz_needs');
    else if (n === 'Timeline' && (brief.domain?.entities || []).some((e) => e.audit || e.history)) add(n, 'O: entitas dengan riwayat/audit');
  }
  if (comps.has('StepUpDialog')) add('PinInput', 'O: wajib bila StepUpDialog dipilih (§6.1)');
  if (comps.has('CommandPalette')) add('Kbd', 'O: CommandPalette menampilkan pintasan dengan Kbd');
  // dependency closure (engine 1.8.0, §6.7): a selected component pulls in what it depends on, even if excluded
  for (let changed = true; changed;) {
    changed = false;
    for (const n of [...comps.keys()]) for (const d of cat(n).depends_on || []) if (!comps.has(d)) {
      add(d, `dependensi ${n}`); changed = true;
      const i = exclusions.findIndex((e) => e.component === d);
      if (i >= 0) { reasons.push({ component: d, reason: `pengecualian "${exclusions[i].reason}" dibatalkan karena ${n} bergantung padanya` }); exclusions.splice(i, 1); }
    }
  }
  const pexcl = Object.fromEntries((brief.components?.pattern_exclusions || []).map((e) => [e.pattern, e.reason]));
  const pinc = Object.fromEntries((brief.components?.pattern_include || []).map((e) => [e.pattern, e.reason]));
  const pats = new Map(), pexclusions = [];
  const padd = (n, why) => { if (!pats.has(n)) pats.set(n, why); };
  for (const [n, tier] of Object.entries(PATTERN_INDEX)) {
    if (tier === 'R') { padd(n, 'R: wajib'); continue; }
    if (pexcl[n]) { pexclusions.push({ pattern: n, reason: pexcl[n] }); continue; }
    if (tier === 'S') {
      if ((n === 'DetailView' || n === 'MasterDetail') && !entities) { pexclusions.push({ pattern: n, reason: 'B5 tidak punya entitas' }); continue; }
      if (n === 'MasterDetail' && !wide) { pexclusions.push({ pattern: n, reason: 'tidak ada surface ≥ tablet' }); continue; }
      if (n === 'Dashboard' && !operational && !dataviz) { pexclusions.push({ pattern: n, reason: 'tidak ada surface operasional atau data_viz_needs' }); continue; }
      if (n === 'AuthAndSession' && !(brief.roles || []).length && brief.auth === false) { pexclusions.push({ pattern: n, reason: 'produk tanpa akun' }); continue; }
      padd(n, 'S: standar'); continue;
    }
    if (pinc[n]) padd(n, `O: B7 include (${pinc[n]})`);
    else if (n === 'OfflineSync' && surfaces.some((s) => s.connectivity === 'offline-first')) padd(n, 'O: surface offline-first');
    else if (n === 'FileUpload' && comps.has('FileDropzone')) padd(n, 'O: FileDropzone dipilih');
    else if (n === 'DataStory' && comps.has('Chart')) padd(n, 'O: Chart dipilih');
    else if (n === 'PermissionRequest' && native) padd(n, 'O: surface native (izin OS)');
    else if (n === 'BulkActions' && brief.components?.bulk_actions) padd(n, 'O: B7 bulk_actions');
  }
  return { components: [...comps.entries()].map(([name, reason]) => ({ name, reason })), exclusions, patterns: [...pats.entries()].map(([name, reason]) => ({ name, reason })), pattern_exclusions: pexclusions, reasons };
}

function deviceClasses(brief) {
  const out = new Set();
  for (const s of brief.surfaces || []) {
    if (/ponsel|phone|mobile|handheld/i.test(s.device || '')) out.add('phone');
    else if (/tablet/i.test(s.device || '')) out.add('tablet');
    else if (/kios|kiosk/i.test(s.device || '')) out.add('tablet');
    else out.add('desktop');
    if (/web/i.test(s.os_runtime || '') && !s.device) ['phone', 'tablet', 'desktop'].forEach((d) => out.add(d));
  }
  return out.size ? out : new Set(['phone', 'tablet', 'desktop']);
}

export function composeComponent(n, scopeTier, brief, lang, tokens, opts) {
  const c = cat(n);
  const mk = modeKeys(tokens);
  const val = (t) => { const tok = tokens.semantic[t] || tokens.component[t]; if (!tok) return null; const vb = tok.$extensions?.ds?.varies_by || []; const v = resolveToken(tokens, tok, vb.includes('density') ? mk.defaultDensity : mk.defaultColor).value; return typeof v === 'number' ? v : parseFloat(v); };
  const ext = tokens.semantic['target-min-extended'] ? val('target-min-extended') : null;
  const strategy = lang.decisions.L16.value.strategy;
  const locales = brief.ui_locales || ['en-US'];
  const pick = (l) => c.content.examples[l] || c.content.examples[Object.keys(c.content.examples).find((k) => k.split('-')[0] === l.split('-')[0])] || [];
  const devices = deviceClasses(brief);
  const targets = [brief.targets.primary_web_reference, ...(brief.targets.production_targets || [])];
  const ns = brief.namespace.toLowerCase(), Ns = brief.namespace.charAt(0).toUpperCase() + brief.namespace.slice(1).toLowerCase();
  const group = kebab(c.group).replace(/ /g, '-');
  const pathFor = (t) => ({
    'html-first': [`<${c.target_hints.html.element}> .${ns}-${kebab(n)}`, `src/components/${group}/${n}.css`],
    react: [`${Ns}${n}`, `src/components/${group}/${n}.tsx`], vue: [`${Ns}${n}`, `src/components/${group}/${n}.vue`],
    flutter: [`${Ns}${n}`, `packages/${ns}_design/lib/src/components/${group}/${ns}_${snake(n)}.dart`],
    swiftui: [`${Ns}${n}`, `packages/${Ns}Design/Sources/${Ns}Design/Components/${Ns}${n}.swift`],
    compose: [`${Ns}${n}`, `packages/${ns}-design/src/main/kotlin/${ns}/design/components/${Ns}${n}.kt`],
  }[t] || [`${Ns}${n}`, `src/components/${group}/${n}`]);
  const swapStates = c.states.map((s) => {
    const sw = { ...s.token_swaps };
    if (strategy === 'state-layer' && /hover|pressed|dragged/.test(s.name)) {
      for (const [k, v] of Object.entries(sw)) sw[k] = v.replace(/-(hover|pressed)$/, '-default').replace('color-interaction-default-default', 'color-interaction-default');
      const layer = s.name.match(/hover|pressed|dragged/)[0];
      sw['state-layer'] = `state-layer-${layer}-opacity`;
    }
    return { name: s.name, token_swaps: sw };
  });
  const fam = { C1: 'critical', C2: 'warning', C3: 'neutral-negative', C4: 'positive', C5: 'info', C6: null };
  const glyph = lang.decisions.L9.value.glyphs;
  return {
    name: n, tier: scopeTier, group: c.group, status: 'Draft',
    purpose: c.purpose,
    anatomy: c.anatomy.map((a) => ({ part: a.part, tokens: a.tokens })),
    variants: c.variants,
    sizes: Array.isArray(c.sizes) ? c.sizes.map((s) => {
      const v = val(s.size_token) ?? 0;
      return { name: s.name, visual_px: v, hit_pointer_px: Math.max(v, 24), hit_touch_px: Math.max(v, 44), ...(ext ? { hit_extended_px: Math.max(v, ext) } : {}),
        per_device: Object.fromEntries([...devices].map((d) => [d, d === 'desktop' ? `${v}px visual, area klik ≥ 24px` : `${v}px visual, area klik ≥ ${ext || 44}px`])) };
    }) : c.sizes,
    states: swapStates,
    state_combinations: c.state_combinations.map((x) => ({ base: x.base, interaction: x.interaction, focus: x.focus, availability: x.availability, supported: x.supported, tokens: {} })),
    behaviour: c.behaviour,
    accessibility: { role: c.accessibility.role, attributes: c.accessibility.attributes, ...(c.accessibility.politeness ? { politeness: c.accessibility.politeness } : {}), focus_order: c.accessibility.focus_order, sr_label: c.accessibility.sr_label, wcag: c.accessibility.wcag },
    content: Object.fromEntries(locales.map((l) => [l, { rules: c.content.rules, examples: pick(l) }])),
    roles: Array.isArray(c.roles) ? c.roles.map((r) => ({ role: '*', pattern: r.pattern, note: r.when })) : c.roles,
    responsive: c.responsive.filter((r) => devices.has(r.device_class)).length ? c.responsive.filter((r) => devices.has(r.device_class)) : c.responsive,
    semantic_mapping: c.carries_status ? Object.entries(fam).map(([k, f]) => ({ state: f ? `${k} (${f})` : `${k} (netral)`, class: k, token: `attention-${k.toLowerCase()}-background`, icon: f ? glyph[f] : 'tanpa ikon status', treatment: lang.decisions.L3.value.attention[k] })) : { not_applicable: 'Komponen ini tidak membawa status.' },
    do: c.do, dont: c.dont, edge_cases: c.edge_cases,
    token_usage: c.anatomy.some((a) => a.tokens.length) ? c.anatomy.flatMap((a) => a.tokens.map((t) => ({ part: a.part, token: t }))) : { not_applicable: 'Komponen tanpa tampilan visual; tidak membaca token.' },
    api: c.api, rtl: c.rtl,
    target_mapping: Object.fromEntries(targets.map((t) => { const [w, p] = pathFor(t); return [t, { widget: w, path: p, props: c.api.props.map((x) => x.name), state_strategy: strategy }]; })),
    preview: { path: `previews/${n}.html`, variants: c.preview.variants, states: c.preview.states },
    assumptions: [],
  };
}

export function composePattern(n, tier, brief, selected) {
  const p = pcat(n);
  const dropped = selected ? p.composition.filter((c) => !selected.has(c.component)).map((c) => c.component) : [];
  const devices = deviceClasses(brief);
  const locales = brief.ui_locales || ['en-US'];
  const pick = (l) => p.content.examples[l] || p.content.examples[Object.keys(p.content.examples).find((k) => k.split('-')[0] === l.split('-')[0])] || [];
  return {
    name: n, tier, status: 'Draft', problem: p.problem, composition: selected ? p.composition.filter((c) => selected.has(c.component)) : p.composition, flow: p.flow,
    variants: (brief.surfaces || []).flatMap((s) => p.variants.filter((v) => [...deviceClasses({ surfaces: [s] })].includes(v.device_class)).map((v) => ({ surface: s.name, device_class: v.device_class, behaviour: v.behaviour }))),
    states: p.states, accessibility: p.accessibility,
    content: Object.fromEntries(locales.map((l) => [l, pick(l)])),
    roles: Array.isArray(p.roles) ? p.roles.map((r) => ({ role: '*', pattern: r.pattern, note: r.when })) : p.roles,
    do: p.do, dont: p.dont, edge_cases: p.edge_cases,
    preview: { path: `previews/patterns/${n}.html` }, journeys: [], assumptions: [],
    ...(dropped.length ? { manual_notes: `Komponen opsional di luar {N} tidak dipakai: ${dropped.join(', ')}. Langkah yang membutuhkannya hanya berlaku bila komponen itu ditambahkan lewat B7.` } : {}),
  };
}

export function compose(dir) {
  const brief = readJson(join(dir, 'brief.normalized.json'));
  const lang = readJson(join(dir, 'assets', 'design-language.json'));
  const tokens = readJson(join(dir, 'assets', 'tokens.json'));
  const scope = selectScope(brief, lang);
  const tierOf = (n) => CORE_INDEX[n]?.tier || 'domain';
  const components = scope.components.map((c) => composeComponent(c.name, tierOf(c.name), brief, lang, tokens));
  const selected = new Set(components.map((c) => c.name));
  const patterns = scope.patterns.map((p) => composePattern(p.name, PATTERN_INDEX[p.name], brief, selected));
  const targets = { reference: brief.targets.primary_web_reference, production: brief.targets.production_targets || [], ...(brief.targets.adapters?.length ? { adapters: brief.targets.adapters } : {}) };
  const docs = [['05', 'design-language'], ['10', 'components-states'], ['20', 'semantic-lifecycle'], ['30', 'layout-responsive'], ['40', 'accessibility'], ['50', 'role-permission'], ['60', 'journeys-screens'], ['70', 'content-errors-loading'], ['80', 'quality-gate'], ['85', 'governance-versioning'], ['90', 'implementation-targets'], ['95', 'platform-variants']];
  const briefText = readFileSync(join(dir, 'brief.normalized.json'), 'utf8').replace(/\s+/g, ' ').trim();
  const bm = existsSync(join(dir, 'reports', 'build-manifest.json')) ? Object.keys(readJson(join(dir, 'reports', 'build-manifest.json')).files) : [];
  const manifest = {
    engine_version: ENGINE, brief_schema_version: brief.brief_schema_version, brief_sha256: createHash('sha256').update(briefText).digest('hex'),
    run_mode: brief.run_mode, package_version: brief.package_version || '0.1.0', delivery_tier: brief.delivery_tier_target || 'T2',
    version_label: brief.version_label || brief.namespace, namespace: brief.namespace, doc_language: brief.doc_language, report_language: brief.report_language || 'Indonesia',
    language: { mode: lang.mode, ...(lang.archetype ? { archetype: lang.archetype } : {}) },
    axes: tokens.$metadata.axes,
    surfaces: (brief.surfaces || []).map((s) => ({ name: s.name, surface_type: s.surface_type, default_theme: s.default_theme, default_density: s.density_modes[0], modalities: s.input_modality })),
    targets,
    components: components.map((c) => ({ name: c.name, tier: c.tier, group: c.group, status: 'Draft', page: `components/${c.name}.html`, preview: `previews/${c.name}.html`, target_files: Object.fromEntries(Object.entries(c.target_mapping).filter(([t]) => t !== targets.reference).map(([t, m]) => [t, m.path])), assumptions: [] })),
    patterns: patterns.map((p) => ({ name: p.name, tier: p.tier, status: 'Draft', page: `patterns/${p.name}.html`, preview: `previews/patterns/${p.name}.html` })),
    core_exclusions: scope.exclusions, pattern_exclusions: scope.pattern_exclusions,
    packs: (brief.components?.packs || []).map((id) => ({ id: id.slice(0, 3), name: id, version: '1.0.1', config: brief.components?.pack_config?.[id.slice(0, 3)] || {} })),
    packages: [], budgets: [{ item: 'paket token web', limit_kb: 30, measured_kb: null, source: 'engine' }, { item: 'paket komponen web', limit_kb: 120, measured_kb: null, source: 'engine' }],
    support_matrix: [{ platform: 'Chrome, Edge, Firefox, Safari (2 versi mayor terakhir)', min: 'evergreen-2', source: 'assumption' }],
    documents: docs.map(([id, slug]) => ({ id, path: `docs/${id}-${slug}.html`, status: 'Draft' })),
    generated: [...bm, 'assets/components.json', 'assets/patterns.json', 'manifest.json'].sort(), manual_zones: [],
  };
  const seed = readJson(join(engine, 'catalog', 'wcag22.seed.json'));
  const wcag = { version: '2.2', criteria: seed.criteria.map((c) => ({ ...c, ...(c.status === 'Open decision' ? { assumption: 'A-01' } : {}) })) };
  writeJson(join(dir, 'manifest.json'), manifest);
  writeJson(join(dir, 'assets', 'components.json'), { components });
  writeJson(join(dir, 'assets', 'patterns.json'), { patterns });
  writeJson(join(dir, 'assets', 'wcag22.json'), wcag);
  const L = [`# Cakupan terkunci (Phase 3)`, '', `{N} = ${components.length} komponen · {P} = ${patterns.length} pattern · engine ${ENGINE}`, '', '## Komponen', '', '| Komponen | Tingkat | Alasan |', '|---|---|---|',
    ...scope.components.map((c) => `| ${c.name} | ${tierOf(c.name)} | ${c.reason} |`), '', '## Pengecualian komponen', '', ...(scope.exclusions.length ? scope.exclusions.map((e) => `- ${e.component}: ${e.reason}`) : ['- tidak ada']),
    '', '## Pattern', '', '| Pattern | Tingkat | Alasan |', '|---|---|---|', ...scope.patterns.map((p) => `| ${p.name} | ${PATTERN_INDEX[p.name]} | ${p.reason} |`), '', '## Pengecualian pattern', '', ...(scope.pattern_exclusions.length ? scope.pattern_exclusions.map((e) => `- ${e.pattern}: ${e.reason}`) : ['- tidak ada']),
    '', '## Masih harus ditulis oleh run', '', '- Komponen domain (§6.2) dan pattern domain: tiga uji, kontrak minimum, 18 seksi.', `- Contoh konten untuk locale di luar en-US/id-ID: ${(brief.ui_locales || []).filter((l) => !/^(en|id)/.test(l)).join(', ') || 'tidak ada'}.`, '- Catatan role per komponen (kolom role "*" diganti nama role B2).', '- Journey dan layar dari B5/B9; register asumsi A-nn untuk Open decision WCAG (A-01).'];
  writeText(join(dir, 'reports', 'scope.md'), L.join('\n'));
  return { manifest, components, patterns, scope };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const dir = process.argv[2];
  if (!dir) { console.error('usage: compose.mjs <packageDir>'); process.exit(2); }
  const r = compose(dir);
  console.log(`OK compose: {N}=${r.components.length} (R ${r.components.filter((c) => c.tier === 'R').length}, S ${r.components.filter((c) => c.tier === 'S').length}, O ${r.components.filter((c) => c.tier === 'O').length}) · {P}=${r.patterns.length} · exclusions ${r.scope.exclusions.length}`);
}
