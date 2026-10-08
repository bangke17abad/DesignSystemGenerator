#!/usr/bin/env node
// Generates engine/schemas/*.schema.json from the normative types in M12 §16A (plus engine 1.8.0 additions).
// Run: node tools/dev/gen-schemas.mjs   (output is committed; runs copy schemas/ instead of re-deriving them in Phase 0)
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeJson } from '../lib/tokens.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const S = 'https://json-schema.org/draft/2020-12/schema';
const str = (extra = {}) => ({ type: 'string', ...extra });
const nstr = { type: 'string', minLength: 1 };
const num = { type: 'number' };
const bool = { type: 'boolean' };
const arr = (items, extra = {}) => ({ type: 'array', items, ...extra });
const en = (...v) => ({ enum: v });
const obj = (props, required = Object.keys(props).filter((k) => !k.endsWith('?')), extra = {}) => {
  const p = {};
  for (const [k, v] of Object.entries(props)) p[k.replace(/\?$/, '')] = v;
  return { type: 'object', properties: p, required: required.map((r) => r.replace(/\?$/, '')), additionalProperties: false, ...extra };
};
const rec = (v) => ({ type: 'object', additionalProperties: v });
const NA = obj({ not_applicable: nstr });
const orNA = (s) => ({ anyOf: [s, { $ref: '#/$defs/NA' }] });
const Source = en('baseline', 'invariant', 'archetype', 'brief', 'derived', 'org', 'adr');
const Status = en('Draft', 'Reviewed', 'Stable');
const AC = en('C1', 'C2', 'C3', 'C4', 'C5', 'C6');
const Tier = en('R', 'S', 'O', 'domain', 'pack');
const RolePattern = en('hidden', 'disabled-with-reason', 'step-up', 'read-only', 'full');
const Treatment = en('quiet', 'outline', 'tinted', 'filled');
const semver = str({ pattern: '^\\d+\\.\\d+\\.\\d+(-[0-9A-Za-z.-]+)?$' });
const doc = (title, body, defs = {}) => ({ $schema: S, $id: `https://ds-engine.local/schemas/${title}.schema.json`, title, ...body, $defs: { NA, ...defs } });

const schemas = {};
const axes = obj({ theme: arr(nstr, { minItems: 1 }), brand: arr(nstr, { minItems: 1 }), density: arr(en('comfortable', 'compact', 'spacious'), { minItems: 1 }) });

schemas.manifest = doc('manifest', obj({
  engine_version: semver, brief_schema_version: str({ pattern: '^\\d+\\.\\d+$' }), brief_sha256: str({ pattern: '^[0-9a-f]{64}$' }),
  run_mode: en('greenfield', 'regenerate', 'brownfield', 'tenant-add'), package_version: semver,
  'delivery_tier?': en('T0', 'T1', 'T2', 'T3'),
  version_label: nstr, namespace: nstr, doc_language: nstr, report_language: nstr,
  language: obj({ mode: en('archetype', 'derive', 'custom', 'inherit'), 'archetype?': nstr, 'org_language?': obj({ path: nstr, version: nstr }) }),
  axes,
  surfaces: arr(obj({ name: nstr, surface_type: en('operational', 'consumer', 'content', 'public'), default_theme: nstr, default_density: nstr, modalities: arr(nstr) })),
  targets: obj({ reference: nstr, production: arr(nstr), 'adapters?': arr(nstr) }),
  components: arr(obj({ name: str({ pattern: '^[A-Z][A-Za-z0-9]*$' }), tier: Tier, 'pack?': nstr, group: nstr, status: Status, page: nstr, preview: nstr, target_files: rec(nstr), assumptions: arr(nstr) })),
  patterns: arr(obj({ name: str({ pattern: '^[A-Z][A-Za-z0-9]*$' }), tier: Tier, 'pack?': nstr, status: Status, page: nstr, preview: nstr })),
  core_exclusions: arr(obj({ component: nstr, reason: nstr })),
  pattern_exclusions: arr(obj({ pattern: nstr, reason: nstr })),
  packs: arr(obj({ id: nstr, name: nstr, version: semver, config: { type: 'object' } })),
  packages: arr(obj({ target: nstr, name: nstr, version: semver, path: nstr, registry: { type: ['string', 'null'] } })),
  budgets: arr(obj({ item: nstr, limit_kb: num, measured_kb: { type: ['number', 'null'] }, source: en('engine', 'brief', 'adr') })),
  support_matrix: arr(obj({ platform: nstr, min: nstr, source: en('brief', 'assumption') })),
  documents: arr(obj({ id: en('05', '10', '20', '30', '40', '50', '60', '70', '80', '85', '90', '95'), path: nstr, status: Status })),
  generated: arr(nstr), manual_zones: arr(obj({ file: nstr, id: nstr })),
}));

const token = obj({
  $type: en('color', 'dimension', 'duration', 'cubicBezier', 'fontFamily', 'fontWeight', 'number', 'shadow', 'strokeStyle', 'string'),
  $value: { type: ['string', 'number', 'object', 'array'] }, '$description?': str(),
  $extensions: obj({ ds: obj({
    role: nstr, 'text_class?': en('body', 'supporting'), 'runtime?': bool, varies_by: arr(en('theme', 'brand', 'density'), { uniqueItems: true }),
    'modes?': rec({ type: ['string', 'number', 'object', 'array'] }), source: Source, trace: nstr,
    'derivation?': obj({ seed: nstr, 'ramp_step?': { type: 'integer' }, 'contrast?': rec(num) }),
    'deprecated?': obj({ since: semver, replaced_by: { type: ['string', 'null'] }, remove_in: semver }),
  }) }),
});
schemas.tokens = doc('tokens', obj({
  $metadata: obj({ engine_version: semver, package_version: semver, dtcg_reference: nstr, axes }),
  primitive: { $ref: '#/$defs/group' }, semantic: { $ref: '#/$defs/group' }, component: { $ref: '#/$defs/group' },
}), { token, group: { type: 'object', additionalProperties: { anyOf: [{ $ref: '#/$defs/token' }, { $ref: '#/$defs/group' }] } } });

const D = (k) => ({ $ref: '#/$defs/decision' });
schemas['design-language'] = doc('design-language', obj({
  engine_version: semver, mode: en('archetype', 'derive', 'custom', 'inherit'), 'archetype?': nstr,
  'org_language?': obj({ path: nstr, version: nstr }), 'scores?': rec(num), 'vetoes?': arr(obj({ archetype: nstr, reason: nstr })),
  decisions: obj(Object.fromEntries(Array.from({ length: 17 }, (_, i) => [`L${i + 1}`, D()]))),
  baseline_adjustments: arr(obj({ decision: str({ pattern: '^L(1[0-7]|[1-9])$' }), from: {}, to: {}, rule: en('STD-1', 'STD-2', 'STD-3', 'STD-4') })),
  adr: arr(nstr), 'manual_notes?': str(),
}), { decision: obj({ value: { type: 'object' }, rationale: nstr, source: Source, testable_consequence: arr(nstr, { minItems: 1 }), 'overrides?': arr(obj({ from: {}, to: {}, reason: str(), source: Source })) }) });

const content = rec(obj({ rules: arr(nstr, { minItems: 1 }), examples: arr(nstr, { minItems: 1 }) }));
const componentRecord = obj({
  name: str({ pattern: '^[A-Z][A-Za-z0-9]*$' }), tier: Tier, 'pack?': nstr, group: nstr, status: Status,
  purpose: obj({ purpose: nstr, when_not_to_use: arr(nstr, { minItems: 1 }) }),
  anatomy: arr(obj({ part: nstr, tokens: arr(nstr) }), { minItems: 1 }),
  variants: orNA(arr(obj({ name: nstr, description: nstr }), { minItems: 1 })),
  sizes: orNA(arr(obj({ name: nstr, visual_px: num, hit_pointer_px: num, hit_touch_px: num, 'hit_extended_px?': num, per_device: rec(nstr) }), { minItems: 1 })),
  states: arr(obj({ name: nstr, token_swaps: rec(nstr) }), { minItems: 1 }),
  state_combinations: arr(obj({ base: en('default', 'selected', 'error', 'mixed', 'open', 'current', 'complete'), interaction: en('rest', 'hover', 'pressed', 'dragged'), focus: bool, availability: en('enabled', 'disabled', 'loading', 'read-only'), supported: bool, tokens: rec(nstr) })),
  behaviour: arr(obj({ input: en('keyboard', 'pointer', 'touch'), trigger: nstr, result: nstr }), { minItems: 1 }),
  accessibility: obj({ role: nstr, attributes: arr(nstr), 'politeness?': en('polite', 'assertive', 'both'), focus_order: nstr, sr_label: nstr, wcag: arr(str({ pattern: '^\\d\\.\\d\\.\\d{1,2}$' }), { minItems: 1 }) }),
  content,
  roles: orNA(arr(obj({ role: nstr, pattern: RolePattern, note: nstr }), { minItems: 1 })),
  responsive: arr(obj({ device_class: nstr, behaviour: nstr }), { minItems: 1 }),
  semantic_mapping: orNA(arr(obj({ state: nstr, class: AC, token: nstr, icon: nstr, treatment: Treatment }), { minItems: 1 })),
  do: arr(nstr, { minItems: 2 }), dont: arr(obj({ text: nstr, 'ref?': nstr }), { minItems: 2 }),
  edge_cases: arr(obj({ case: nstr, behaviour: nstr }), { minItems: 5 }),
  token_usage: orNA(arr(obj({ part: nstr, token: nstr }), { minItems: 1 })),
  api: obj({ props: arr(obj({ name: str({ pattern: '^[a-z][A-Za-z0-9]*$' }), type: nstr, 'default?': str(), required: bool, description: nstr })), events: arr(obj({ name: str({ pattern: '^on[A-Z][A-Za-z]*$' }), payload: nstr, when: nstr })), parts: arr(nstr) }),
  rtl: orNA(obj({ mirrored_icons: arr(nstr), notes: nstr })),
  target_mapping: rec(obj({ widget: nstr, path: nstr, props: arr(nstr), state_strategy: nstr })),
  preview: obj({ path: nstr, variants: arr(nstr), states: arr(nstr) }),
  assumptions: arr(str({ pattern: '^A-\\d{2,}$' })), 'manual_notes?': str(),
});
schemas.components = doc('components', obj({ components: arr({ $ref: '#/$defs/component' }) }), { component: componentRecord });

schemas.patterns = doc('patterns', obj({ patterns: arr({ $ref: '#/$defs/pattern' }) }), { pattern: obj({
  name: str({ pattern: '^[A-Z][A-Za-z0-9]*$' }), tier: Tier, 'pack?': nstr, status: Status,
  problem: obj({ problem: nstr, when: arr(nstr, { minItems: 1 }), when_not: arr(nstr, { minItems: 1 }) }),
  composition: arr(obj({ component: nstr, 'parts?': arr(nstr), role_in_pattern: nstr }), { minItems: 1 }),
  flow: arr(obj({ step: nstr, state_class: AC, transition: nstr }), { minItems: 1 }),
  variants: orNA(arr(obj({ surface: nstr, device_class: nstr, behaviour: nstr }), { minItems: 1 })),
  states: obj({ empty: nstr, loading: nstr, error: nstr, partial: nstr, success: nstr }),
  accessibility: arr(obj({ step: nstr, focus: nstr, 'announcement?': nstr }), { minItems: 1 }),
  content: rec(arr(nstr, { minItems: 1 })),
  roles: orNA(arr(obj({ role: nstr, pattern: RolePattern, note: nstr }), { minItems: 1 })),
  do: arr(nstr, { minItems: 2 }), dont: arr(obj({ text: nstr, 'ref?': nstr }), { minItems: 2 }),
  edge_cases: arr(obj({ case: nstr, behaviour: nstr }), { minItems: 5 }),
  preview: obj({ path: nstr }), journeys: arr(nstr), assumptions: arr(nstr), 'manual_notes?': str(),
}) });

schemas.glossary = doc('glossary', obj({ terms: arr(obj({ id: str({ pattern: '^[a-z0-9_.-]+$' }), kind: en('entity', 'state', 'role', 'action', 'ui'), labels: rec(nstr), definition: nstr, avoid: arr(nstr), source: en('brief', 'glossary_seed', 'derived', 'pack'), 'assumption?': nstr })) }));
schemas.lifecycle = doc('lifecycle', obj({ entities: arr(obj({
  name: nstr, source: en('brief', 'derived'), 'assumption?': nstr,
  states: arr(obj({ name: nstr, class: AC, token: nstr, icon: { type: ['string', 'null'] }, treatment: Treatment, ui_text: rec(nstr), visible_to: arr(nstr), next_actions: arr(nstr) }), { minItems: 1 }),
  'stagnation?': obj({ threshold: nstr, 'assumption?': nstr }),
  critical_events: arr(obj({ name: nstr, severity: en('safety', 'financial', 'legal'), treatment: arr(nstr), dismiss_action: nstr, sound: nstr, haptic: nstr })),
})) }));
schemas['lint-rules'] = doc('lint-rules', obj({ rules: arr(obj({ id: str({ pattern: '^(UB\\d{1,2}|LB-\\d{2}|ENG-[A-Z]+|VB\\d{1,2}|P\\d{2}-[A-Z0-9-]+)$' }), statement: nstr, kind: en('css-pattern', 'token-rule', 'manual-review'), 'pattern?': nstr, 'question?': nstr, applies_to: arr(nstr), source: nstr, severity: en('error', 'review') })) }));
schemas.wcag22 = doc('wcag22', obj({ version: { const: '2.2' }, criteria: arr(obj({ sc: str({ pattern: '^\\d\\.\\d\\.\\d{1,2}$' }), name: nstr, level: en('A', 'AA'), status: en('Applied', 'Applied · Not verified', 'N/A', 'Open decision'), application: nstr, verified_by: nstr, 'assumption?': nstr }), { minItems: 55, maxItems: 55 }) }));
schemas.assumptions = doc('assumptions', obj({ entries: arr(obj({ id: str({ pattern: '^A-\\d{2,}$' }), statement: nstr, reason: nstr, default_taken: nstr, confirm_by: nstr, status: en('open', 'needs owner confirmation', 'confirmed', 'rejected'), files: arr(nstr) })) }));
schemas['migration-map'] = doc('migration-map', obj({
  from: obj({ kind: en('package', 'brownfield'), 'version?': nstr }), to_version: semver,
  tokens: arr(obj({ old: nstr, new: { type: ['string', 'null'] }, change: en('added', 'renamed', 'value', 'deprecated', 'removed', 'keep', 'merge', 'drop', 'violation'), 'rule?': nstr, note: str() })),
  components: arr(obj({ old: nstr, new: { type: ['string', 'null'] }, change: nstr, note: str() })),
  semver_bump: en('major', 'minor', 'patch'),
}));
schemas['design-tool-variables'] = doc('design-tool-variables', obj({ tool: nstr, collections: arr(obj({
  name: en('primitive', 'color', 'brand', 'size', 'component'), modes: arr(nstr, { minItems: 1 }), hidden_from_publishing: bool,
  variables: arr(obj({ name: nstr, token: nstr, type: en('COLOR', 'FLOAT', 'STRING', 'BOOLEAN'), scopes: arr(nstr), values: rec({ anyOf: [{ type: ['string', 'number', 'boolean'] }, obj({ alias: nstr })] }) })),
})) }));
schemas['component-properties'] = doc('component-properties', obj({ components: arr(obj({ name: nstr, design_tool_name: nstr, properties: arr(obj({ name: nstr, kind: en('VARIANT', 'BOOLEAN', 'TEXT', 'INSTANCE_SWAP'), 'values?': arr(nstr), maps_to_prop: nstr })) })) }));

// ---- engine 1.8.0 additions ----
schemas['brief.normalized'] = doc('brief.normalized', obj({
  brief_schema_version: str({ pattern: '^1\\.[0-5]$' }), run_mode: en('greenfield', 'regenerate', 'brownfield', 'tenant-add'),
  'package_version?': semver, product_name: nstr, 'version_label?': nstr, namespace: str({ pattern: '^[A-Za-z][A-Za-z0-9]{1,15}$' }),
  doc_language: nstr, 'report_language?': nstr, ui_locales: arr(str({ pattern: '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$' }), { minItems: 1 }),
  'domain_summary?': str(), 'formats?': { type: 'object' },
  surfaces: arr(obj({ name: nstr, 'device?': nstr, 'os_runtime?': nstr, input_modality: arr(en('pointer', 'touch', 'keyboard', 'scanner', 'glove', 'in-motion', 'voice', 'switch'), { minItems: 1 }),
    surface_type: en('operational', 'consumer', 'content', 'public'), 'orientation?': nstr, default_theme: nstr, density_modes: arr(en('comfortable', 'compact', 'spacious'), { minItems: 1 }),
    'connectivity?': en('online', 'offline-first', 'intermittent'), 'distribution?': nstr }), { minItems: 1 }),
  targets: obj({ primary_web_reference: nstr, 'production_targets?': arr(nstr), 'foundation_libraries?': arr(nstr), 'adapters?': arr(en('A01-antd-v6', 'A02-mui-v7', 'A03-shadcn-tailwind4', 'A04-flutter-material3')),
    'design_tool?': nstr, 'design_tool_limits?': { type: 'object' }, 'package_registry?': { type: ['string', 'null'] }, 'ci_platform?': { type: ['string', 'null'] } }),
  language: obj({ mode: en('archetype', 'derive', 'custom', 'inherit'), 'archetype?': nstr,
    'personality?': obj({ formality: { type: 'integer', minimum: 1, maximum: 5 }, warmth: { type: 'integer', minimum: 1, maximum: 5 }, expressiveness: { type: 'integer', minimum: 1, maximum: 5 }, density: { type: 'integer', minimum: 1, maximum: 5 }, risk_criticality: { type: 'integer', minimum: 1, maximum: 5 } }),
    'neutral_temperature?': en('warm', 'cool', 'neutral'), 'themes?': arr(obj({ name: nstr, 'base?': en('light', 'dark', 'hc-light', 'hc-dark'), 'purpose?': str() })),
    'brands?': arr(obj({ id: str({ pattern: '^[a-z0-9-]+$' }), 'interaction_hex?': { type: ['string', 'null'], pattern: '^#[0-9a-fA-F]{6}$' }, 'accent_hexes?': arr(str({ pattern: '^#[0-9a-fA-F]{6}$' })), 'font_ui?': { type: ['string', 'null'] } })),
    'overrides?': arr(obj({ decision: str({ pattern: '^L(1[0-7]|[1-9])$' }), path: nstr, value: {}, 'reason?': str() })),
    'must_not_look_like?': arr(nstr), 'dislikes?': arr(nstr), 'likes?': arr(nstr), 'pack_vetoes?': arr(nstr), 'inherits_from?': nstr }),
  'domain?': obj({ 'entities?': arr({ type: 'object' }), 'journeys?': arr({ type: 'object' }), 'critical_events?': arr({ type: 'object' }), 'spatial?': bool, 'dataviz?': arr(nstr) }),
  'components?': obj({ 'include?': arr(obj({ component: nstr, reason: nstr })), 'pattern_include?': arr(obj({ pattern: nstr, reason: nstr })), 'bulk_actions?': bool, 'exclusions?': arr(obj({ component: nstr, reason: nstr })), 'domain_components?': arr({ type: 'object' }), 'packs?': arr(nstr), 'pack_config?': { type: 'object' }, 'pattern_exclusions?': arr(obj({ pattern: nstr, reason: nstr })), 'domain_patterns?': arr({ type: 'object' }) }),
  'roles?': arr(obj({ name: nstr, 'goals?': str(), 'surfaces?': arr(nstr), 'permission_notes?': str() })),
  'breakpoints?': obj({ 'mobile?': num, 'tablet?': num, 'desktop?': num, 'wide?': num }),
  'overrides?': { type: 'object' }, 'hygiene?': obj({ 'leak_terms?': arr(nstr) }), 'budgets?': arr({ type: 'object' }), 'glossary_seed?': arr({ type: 'object' }),
  'delivery_tier_target?': en('T0', 'T1', 'T2', 'T3'),
}));

const tokenName = str({ pattern: '^[a-z][a-z0-9-]*$' });
schemas['catalog-component'] = doc('catalog-component', obj({
  name: str({ pattern: '^[A-Z][A-Za-z0-9]*$' }), engine_version: semver, group: nstr, tier: en('R', 'S', 'O'), inclusion: nstr,
  purpose: obj({ purpose: nstr, when_not_to_use: arr(nstr, { minItems: 1 }) }),
  anatomy: arr(obj({ part: nstr, role: nstr, tokens: arr(tokenName) }), { minItems: 1 }),
  variants: orNA(arr(obj({ name: nstr, description: nstr }), { minItems: 1 })),
  sizes: orNA(arr(obj({ name: en('sm', 'md', 'lg'), size_token: tokenName, axis: en('block', 'inline', 'both'), hit_area: nstr, notes: str() }), { minItems: 1 })),
  states: arr(obj({ name: nstr, treatment: nstr, token_swaps: rec(tokenName) }), { minItems: 1 }),
  state_combinations: arr(obj({ base: en('default', 'selected', 'error', 'mixed', 'open', 'current', 'complete'), interaction: en('rest', 'hover', 'pressed', 'dragged'), focus: bool, availability: en('enabled', 'disabled', 'loading', 'read-only'), supported: bool, note: str() })),
  behaviour: arr(obj({ input: en('keyboard', 'pointer', 'touch'), trigger: nstr, result: nstr }), { minItems: 1 }),
  accessibility: obj({ role: nstr, attributes: arr(nstr), 'politeness?': en('polite', 'assertive', 'both'), focus_order: nstr, sr_label: nstr, wcag: arr(str({ pattern: '^\\d\\.\\d\\.\\d{1,2}$' }), { minItems: 1 }), native: obj({ flutter: nstr, swiftui: nstr, compose: nstr }) }),
  content: obj({ rules: arr(nstr, { minItems: 1 }), examples: obj({ 'en-US': arr(nstr, { minItems: 1 }), 'id-ID': arr(nstr, { minItems: 1 }) }) }),
  roles: orNA(arr(obj({ pattern: RolePattern, when: nstr }), { minItems: 1 })),
  responsive: arr(obj({ device_class: en('phone', 'tablet', 'desktop'), behaviour: nstr }), { minItems: 3, maxItems: 3 }),
  carries_status: bool,
  do: arr(nstr, { minItems: 2 }), dont: arr(obj({ text: nstr, 'ref?': nstr }), { minItems: 2 }),
  edge_cases: arr(obj({ case: nstr, behaviour: nstr }), { minItems: 5 }),
  api: obj({ props: arr(obj({ name: str({ pattern: '^[a-z][A-Za-z0-9]*$' }), type: nstr, 'default?': str(), required: bool, description: nstr })), events: arr(obj({ name: str({ pattern: '^on[A-Z][A-Za-z]*$' }), payload: nstr, when: nstr })), parts: arr(nstr) }),
  rtl: orNA(obj({ mirrored_icons: arr(nstr), notes: nstr })),
  target_hints: obj({ html: obj({ element: nstr, notes: str() }), flutter: nstr, swiftui: nstr, compose: nstr }),
  preview: obj({ variants: arr(nstr), states: arr(nstr), combinations: arr(nstr) }),
  related: arr(nstr), depends_on: arr(nstr), lint: arr(nstr),
}));

schemas['catalog-pattern'] = doc('catalog-pattern', obj({
  name: str({ pattern: '^[A-Z][A-Za-z0-9]*$' }), engine_version: semver, tier: en('R', 'S', 'O'), inclusion: nstr,
  problem: obj({ problem: nstr, when: arr(nstr, { minItems: 1 }), when_not: arr(nstr, { minItems: 1 }) }),
  composition: arr(obj({ component: str({ pattern: '^[A-Z][A-Za-z0-9]*$' }), 'parts?': arr(nstr), role_in_pattern: nstr }), { minItems: 2 }),
  flow: arr(obj({ step: nstr, state_class: AC, transition: nstr }), { minItems: 2 }),
  variants: arr(obj({ device_class: en('phone', 'tablet', 'desktop'), behaviour: nstr }), { minItems: 3, maxItems: 3 }),
  states: obj({ empty: nstr, loading: nstr, error: nstr, partial: nstr, success: nstr }),
  accessibility: arr(obj({ step: nstr, focus: nstr, 'announcement?': nstr }), { minItems: 2 }),
  content: obj({ rules: arr(nstr, { minItems: 1 }), examples: obj({ 'en-US': arr(nstr, { minItems: 2 }), 'id-ID': arr(nstr, { minItems: 2 }) }) }),
  roles: orNA(arr(obj({ pattern: RolePattern, when: nstr }), { minItems: 1 })),
  do: arr(nstr, { minItems: 2 }), dont: arr(obj({ text: nstr, 'ref?': nstr }), { minItems: 2 }),
  edge_cases: arr(obj({ case: nstr, behaviour: nstr }), { minItems: 5 }),
  wcag: arr(str({ pattern: '^\\d\\.\\d\\.\\d{1,2}$' }), { minItems: 1 }),
  related_patterns: arr(nstr), lint: arr(nstr),
}));

schemas.verification = doc('verification', obj({
  engine_version: semver, package: nstr, generated_by: nstr, tier_reached: en('none', 'T0', 'T1', 'T2', 'T3'),
  summary: obj({ checks: { type: 'integer' }, pass: { type: 'integer' }, fail_blocking: { type: 'integer' }, fail_advisory: { type: 'integer' }, not_run: { type: 'integer' }, not_applicable: { type: 'integer' } }),
  validators: arr(obj({ id: str({ pattern: '^(V\\d{1,2}|VB\\d{1,2}|P\\d{2}-V\\d+)$' }), name: nstr, status: en('PASS', 'FAIL', 'NOT RUN', 'NOT APPLICABLE'), severity: en('blocking', 'advisory'), checks: { type: 'integer' }, failures: arr(nstr), notes: arr(str()) })),
  baseline: obj({ min_text_contrast: { type: ['number', 'null'] }, min_body_font_px: { type: ['number', 'null'] }, min_touch_target_px: { type: ['number', 'null'] }, wcag_sc_status: rec({ type: 'integer' }) }),
}));

for (const [name, s] of Object.entries(schemas)) writeJson(join(root, 'schemas', `${name}.schema.json`), s);
console.log(`OK schemas: ${Object.keys(schemas).length} → schemas/`);
