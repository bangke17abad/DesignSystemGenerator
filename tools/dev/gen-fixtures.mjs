#!/usr/bin/env node
// Writes fixtures/G*/brief.normalized.json + expect.json from the golden briefs (golden-briefs.md). Machine-checkable assertions only;
// expectations that need a run author (lifecycle, glossary, pack components) are listed under "run_only" so they stay visible.
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeJson } from '../lib/tokens.mjs';
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const S = (name, device, os, modality, type, theme, density, conn = 'online') => ({ name, device, os_runtime: os, input_modality: modality, surface_type: type, default_theme: theme, density_modes: density, connectivity: conn });
const base = (o) => ({ brief_schema_version: '1.5', run_mode: 'greenfield', doc_language: 'Indonesia', report_language: 'Indonesia', ui_locales: ['id-ID'], ...o });
const F = {
  G1: { brief: base({ product_name: 'Lumbung', version_label: 'LBG-01', namespace: 'LBG', domain_summary: 'Sistem gudang untuk distributor sembako.',
      surfaces: [S('web-admin', 'desktop', 'web', ['pointer', 'keyboard'], 'operational', 'Light', ['comfortable', 'compact']), S('handheld', 'ponsel', 'Android', ['touch', 'scanner', 'glove'], 'operational', 'High-contrast', ['comfortable'], 'offline-first')],
      targets: { primary_web_reference: 'react', production_targets: ['flutter'] },
      language: { mode: 'archetype', archetype: 'ink-graphite', neutral_temperature: 'cool', themes: [{ name: 'Light', purpose: 'kantor' }, { name: 'High-contrast', purpose: 'gudang dengan cahaya tidak merata' }], brands: [{ id: 'default' }] },
      domain: { entities: [{ name: 'PickList', states: ['draft', 'assigned', 'picking', 'picked', 'cancelled', 'failed'] }], critical_events: [] },
      hygiene: { leak_terms: ['golf', 'caddie', 'tee time', 'handicap', 'Rainbow Hills', 'The Green Clubs', 'TGC'] } }),
    expect: [
      { lang: 'archetype', eq: 'ink-graphite' }, { lang: 'mode', eq: 'archetype' },
      { lang: 'decisions.L4.value.families.ui', eq: 'Inter' }, { lang: 'decisions.L9.value.set', eq: 'lucide' }, { lang: 'decisions.L2.value.info', eq: 'neutral' },
      { manifest: 'axes.theme', eq: ['Light', 'High-contrast'] }, { manifest: 'axes.density', eq: ['comfortable', 'compact'] },
      { token: 'target-min-extended', eq: 48 }, { token: 'type-body-size', eq: 16 }, { token: 'type-body-lg-size', eq: 17 },
      { scope_includes: ['BottomNav', 'ConnectionStatus', 'Menu'] }, { scope_excludes: ['PinInput', 'StepUpDialog'] },
      { patterns_include: ['CrudFlow', 'FormFlow', 'DestructiveAction', 'SystemPages', 'AsyncFeedback', 'AppNavigation', 'SearchAndFilter', 'AuthAndSession', 'Settings', 'OfflineSync', 'DetailView', 'MasterDetail', 'Dashboard'] },
      { contrast_blocking: 0 }, { validators: ['V1', 'V2', 'V11', 'V13', 'V14', 'VB1', 'VB2', 'VB4', 'VB5', 'VB8'], status: 'PASS' }, { validators: ['V3', 'V22'], status: 'PASS' },
    ], run_only: ['lifecycle.json PickList: failed C1, cancelled C3, picked C4; stagnation dari brief', 'Langkah pindai punya alternatif input manual (§9.1)'] },
  G2: { brief: base({ product_name: 'Seduh', version_label: 'SDH-01', namespace: 'SDH',
      surfaces: [S('customer-app', 'ponsel', 'iOS', ['touch'], 'consumer', 'Light', ['comfortable']), S('outlet-web', 'desktop', 'web', ['pointer', 'keyboard'], 'operational', 'Light', ['comfortable'])],
      targets: { primary_web_reference: 'react', production_targets: ['flutter'] },
      language: { mode: 'archetype', archetype: 'brand-led-tonal', themes: [{ name: 'Light' }, { name: 'Dark' }], brands: [{ id: 'default', interaction_hex: '#4F46E5' }, { id: 'kopi-senja', interaction_hex: '#C2410C' }, { id: 'kopi-pagi', interaction_hex: '#0F766E' }] },
      domain: { entities: [{ name: 'Order' }, { name: 'Payment' }] }, hygiene: { leak_terms: ['golf', 'caddie', 'handicap', 'The Green Clubs', 'TGC'] } }),
    expect: [
      { manifest: 'axes.brand', eq: ['default', 'kopi-senja', 'kopi-pagi'] }, { contrast_modes: 6 },
      { family_hue: 'interaction-default', approx: 277, tol: 2 }, { family_hue: 'interaction-kopi-senja', approx: 38, tol: 2 }, { family_hue: 'interaction-kopi-pagi', approx: 186, tol: 2 },
      { notes_contain: 'info memakai varian netral' }, { family_hue: 'critical', approx: 15, tol: 1 }, { adr: 'ADR-HUE-critical' },
      { family_hue: 'warning', approx: 75, tol: 1 }, { family_hue: 'positive', approx: 155, tol: 1 },
      { semantic_not_varies_by_brand: true }, { lang: 'decisions.L3.value.attention.C4', eq: 'filled' }, { contrast_blocking: 0 },
      { validators: ['V1', 'V2', 'V11', 'V14', 'VB1', 'VB2', 'VB8'], status: 'PASS' },
    ], run_only: ['lifecycle.json Payment: menunggu C5, berhasil C4, gagal C1, kedaluwarsa C3'] },
  G3: { brief: base({ product_name: 'Ruang Baca', namespace: 'RB', surfaces: [S('member-app', 'ponsel', 'iOS', ['touch'], 'consumer', 'Light', ['comfortable'])],
      targets: { primary_web_reference: 'react', production_targets: ['flutter'] },
      language: { mode: 'derive', personality: { formality: 2, warmth: 5, expressiveness: 4, density: 1, risk_criticality: 1 }, themes: [{ name: 'Light' }, { name: 'Dark' }], brands: [{ id: 'default' }] },
      domain: { entities: [{ name: 'Loan' }] } }),
    expect: [
      { lang: 'archetype', eq: 'soft-friendly' },
      { lang: 'scores', eq: { 'soft-friendly': 20, 'playful-vivid': 17, 'brand-led-tonal': 15, 'immersive-glass': 14, 'neo-brutalist': 13, 'quiet-luxury': 12, 'editorial-contrast': 11, 'ink-graphite': 6, 'dense-console': 4 } },
      { assumptions_contain: 'seed default archetype soft-friendly' }, { family_hue: 'positive', approx: 145, tol: 1 }, { no_adr: true },
      { token: 'type-body-size', eq: 17 }, { token: 'type-body-line', eq: 26 }, { token: 'type-caption-line', eq: 18 },
      { token: 'control-height-sm', eq: 40 }, { token: 'control-height-lg', eq: 56 }, { token: 'icon-md', eq: 24 }, { token_absent: 'target-min-extended' }, { contrast_blocking: 0 },
    ], run_only: ['lifecycle.json Loan: terlambat C1/C2 dengan alasan; tanpa overlay stagnasi'] },
  G4: { brief: base({ product_name: 'Pasal', namespace: 'PSL', doc_language: 'English', ui_locales: ['id-ID', 'en-US'],
      surfaces: [S('portal', 'desktop', 'web', ['pointer', 'keyboard', 'touch'], 'content', 'Light', ['comfortable'])],
      targets: { primary_web_reference: 'react' }, language: { mode: 'archetype', archetype: 'editorial-contrast', themes: [{ name: 'Light' }, { name: 'Dark' }], brands: [{ id: 'default' }] }, domain: { entities: [{ name: 'Regulation' }] } }),
    expect: [
      { token: 'radius-sm', eq: 0 }, { token: 'elevation-1', every_mode_border: true }, { lang: 'decisions.L4.value.families.display', eq: 'Source Serif 4' }, { lang: 'decisions.L7.value.flat', eq: true },
      { no_adr: true }, { contrast_blocking: 0 }, { site_lang: 'en' }, { validators: ['V1', 'V2', 'VB2', 'V7'], status: 'PASS' },
    ], run_only: ['Langkah 2 regenerate: semver minor, zona manual byte-identik (V15)'] },
  G5: { brief: base({ product_name: 'Pantau', namespace: 'PTU',
      surfaces: [S('noc-console', 'desktop', 'web', ['pointer', 'keyboard'], 'operational', 'Dark', ['comfortable', 'compact']), S('oncall-app', 'ponsel', 'Android', ['touch'], 'operational', 'Dark', ['comfortable'])],
      targets: { primary_web_reference: 'react', production_targets: ['flutter'] },
      language: { mode: 'archetype', archetype: 'dense-console', themes: [{ name: 'Dark' }, { name: 'Light' }], brands: [{ id: 'default', interaction_hex: '#2f81f7' }] },
      domain: { entities: [{ name: 'Incident' }], critical_events: [{ name: 'Core link down', severity: 'financial' }] } }),
    expect: [
      { lang: 'decisions.L2.value.info', eq: 'neutral' }, { token: 'z-critical', eq: 80 }, { scope_includes: ['CommandPalette', 'Kbd', 'StepUpDialog', 'PinInput'] },
      { token: 'state-layer-hover-opacity', eq: 0 }, { token: 'haptic-error', eq: 'error' }, { token: 'haptic-critical', eq: 'critical' }, { token: 'haptic-success', eq: 'none' },
      { manifest: 'axes.theme', eq: ['Dark', 'Light'] }, { contrast_blocking: 0 },
    ], run_only: ['brownfield-audit.md dan migration-map.json untuk pantau-legacy.css (Phase 0A)'] },
  G6: { brief: base({ product_name: 'Serambi', namespace: 'SRB', ui_locales: ['id-ID', 'en-US', 'ar-SA'], surfaces: [S('member-app', 'ponsel', 'iOS', ['touch'], 'consumer', 'Light', ['comfortable'])],
      targets: { primary_web_reference: 'react', production_targets: ['flutter'] }, language: { mode: 'archetype', archetype: 'quiet-luxury', themes: [{ name: 'Light' }, { name: 'Dark' }], brands: [{ id: 'default', interaction_hex: '#B08D57' }] }, domain: { entities: [{ name: 'Reservation' }] } }),
    expect: [
      { family_hue: 'interaction', approx: 70, tol: 1 }, { token_mode: 'color-brand-default', mode: 'default/Light', eq: '#b08d57' },
      { token: 'type-body-size', eq: 17 }, { token: 'type-body-line', eq: 28 }, { token: 'space-section', eq: 64 }, { token: 'space-section-lg', eq: 96 }, { token: 'layout-content-max', eq: 1200 },
      { token: 'state-layer-hover-opacity', eq: 0 }, { lang: 'decisions.L9.value.style', eq: 'Light' }, { contrast_blocking: 0 }, { content_locale_missing: 'ar-SA' },
    ], run_only: ['Noto Sans Arabic di fallback dan tinggi baris +0.15 untuk ar-SA', 'glossary.json id-ID, en-US, ar-SA'] },
  G7: { brief: base({ product_name: 'Layar', namespace: 'LYR', surfaces: [S('viewer-app', 'ponsel', 'iOS', ['touch'], 'content', 'Dark', ['comfortable']), S('viewer-web', 'desktop', 'web', ['pointer', 'keyboard'], 'content', 'Dark', ['comfortable'])],
      targets: { primary_web_reference: 'react', production_targets: ['flutter'] }, language: { mode: 'archetype', archetype: 'immersive-glass', themes: [{ name: 'Dark' }, { name: 'Light' }], brands: [{ id: 'default', interaction_hex: '#22D3EE' }] }, domain: { entities: [{ name: 'Subscription' }] } }),
    expect: [
      { family_hue: 'interaction', approx: 211.5, tol: 2 }, { no_semantic_shift: true }, { on_solid_dark: 'default/Dark' }, { token_mode: 'color-interaction-default', mode: 'default/Dark', eq: '#22d3ee' }, { token_gt: 'material-blur-md', value: 0 }, { css_contains: 'prefers-reduced-transparency' }, { contrast_blocking: 0 },
    ], run_only: [] },
  G8: { brief: base({ product_name: 'Gerak', namespace: 'GRK', surfaces: [S('family-app', 'ponsel', 'iOS', ['touch', 'in-motion'], 'consumer', 'Light', ['comfortable'])],
      targets: { primary_web_reference: 'react', production_targets: ['flutter'] }, language: { mode: 'archetype', archetype: 'playful-vivid', themes: [{ name: 'Light' }, { name: 'Dark' }], brands: [{ id: 'default' }] }, domain: { entities: [{ name: 'Challenge' }] } }),
    expect: [
      { assumptions_contain: 'seed default archetype playful-vivid' }, { no_semantic_shift: true }, { token: 'target-min-extended', eq: 48 }, { token: 'state-press-transform', eq: 'scale(0.97)' },
      { css_contains: '--state-press-transform: none' }, { token: 'haptic-success', eq: 'success' }, { token: 'sound-success', eq: 'none' }, { token: 'control-height-sm', eq: 44 }, { token: 'control-height-lg', eq: 60 }, { contrast_blocking: 0 },
    ], run_only: [] },
  G9: { brief: base({ product_name: 'Kolektif', namespace: 'KLT', surfaces: [S('studio-web', 'desktop', 'web', ['pointer', 'keyboard', 'touch'], 'public', 'Light', ['comfortable'])],
      targets: { primary_web_reference: 'react' }, language: { mode: 'archetype', archetype: 'neo-brutalist', themes: [{ name: 'Light' }, { name: 'Dark' }], brands: [{ id: 'default', interaction_hex: '#FF5A1F' }] }, domain: { entities: [{ name: 'ProjectRequest' }] } }),
    expect: [
      { token_mode: 'color-brand-default', mode: 'default/Light', eq: '#ff5a1f' }, { contrast: { fg: 'color-brand-on', bg: 'color-brand-default', mode: 'default/Light', min: 4.5 } },
      { token: 'radius-md', eq: 0 }, { token: 'state-press-transform', eq: 'translate(4px,4px)' }, { lang: 'decisions.L4.value.families.ui', eq: 'Space Grotesk' }, { contrast_blocking: 0 },
    ], run_only: ['Langkah 2 tenant-add studio-biru (V15)'] },
  G12: { brief: base({ product_name: 'Izinku', namespace: 'IZK', surfaces: [S('public-web', 'ponsel, desktop', 'web', ['touch', 'pointer', 'keyboard'], 'public', 'Light', ['comfortable']), S('officer-web', 'desktop', 'web', ['pointer', 'keyboard'], 'operational', 'Light', ['comfortable'])],
      targets: { primary_web_reference: 'html-first' }, language: { mode: 'archetype', archetype: 'editorial-contrast', themes: [{ name: 'Light' }], brands: [{ id: 'default' }] },
      domain: { entities: [{ name: 'Application' }] }, components: { packs: ['P04-b2g-public-service'], pack_config: { P04: { operator_type: 'regional_government', official_domain: 'go.id', service_phase: 'beta', fees: 'none' } } } }),
    expect: [{ manifest: 'packs.0.id', eq: 'P04' }, { contrast_blocking: 0 }, { validators: ['V22'], status: 'PASS' }],
    run_only: ['Komponen dan pattern P04 (10 R + PhaseBanner; pattern 6 R + StatusTracking + ServiceFeedback)', 'P04-V1..Vk'] },
  G13: { brief: base({ product_name: 'Lumbung', namespace: 'LBG', surfaces: [S('web-admin', 'desktop', 'web', ['pointer', 'keyboard'], 'operational', 'Light', ['comfortable', 'compact']), S('handheld', 'ponsel', 'Android', ['touch', 'scanner', 'glove'], 'operational', 'High-contrast', ['comfortable'], 'offline-first')],
      targets: { primary_web_reference: 'react', production_targets: ['flutter'] }, language: { mode: 'archetype', archetype: 'ink-graphite', themes: [{ name: 'Light' }, { name: 'High-contrast' }], brands: [{ id: 'default' }] },
      domain: { entities: [{ name: 'PickList' }, { name: 'StockAdjustment' }] }, components: { packs: ['P01-b2b-ops'], pack_config: { P01: { approval_levels: 1, audit_required: true, keyboard_power_users: true } } } }),
    expect: [{ manifest: 'packs.0.id', eq: 'P01' }, { patterns_include: ['Dashboard'] }, { validators: ['V22'], status: 'PASS' }, { contrast_blocking: 0 }],
    run_only: ['Komponen P01 tingkat R (BulkActionBar, JobStatus, TreeTable, Scheduler, DiffView, ShortcutHelp)', 'CommandPalette wajib karena keyboard_power_users'] },
  G14: { brief: base({ product_name: 'Pasar Tetangga', namespace: 'PTG', surfaces: [S('buyer-app', 'ponsel', 'iOS', ['touch'], 'consumer', 'Light', ['comfortable']), S('storefront-web', 'ponsel, desktop', 'web', ['touch', 'pointer', 'keyboard'], 'public', 'Light', ['comfortable']), S('seller-web', 'desktop', 'web', ['pointer', 'keyboard'], 'operational', 'Light', ['comfortable', 'compact'])],
      targets: { primary_web_reference: 'react', production_targets: ['flutter'], adapters: ['A01-antd-v6'] }, language: { mode: 'archetype', archetype: 'brand-led-tonal', themes: [{ name: 'Light' }, { name: 'Dark' }], brands: [{ id: 'default', interaction_hex: '#0F766E' }] },
      domain: { entities: [{ name: 'Order' }] }, components: { packs: ['P02-b2c-commerce', 'P01-b2b-ops'], include: [{ component: 'CountdownTimer', reason: 'flash sale' }] } }),
    expect: [{ scope_includes: ['CountdownTimer'] }, { file_exists: 'adapters/antd/theme.g.ts' }, { contrast_blocking: 0 }, { validators: ['V22'], status: 'PASS' }],
    run_only: ['Komponen P02 per surface; lifecycle Order P02-R4', 'P02-V1..V4'] },
  G15: { brief: base({ product_name: 'Ruang Karya', namespace: 'RKY', surfaces: [S('member-app', 'ponsel', 'iOS', ['touch'], 'consumer', 'Light', ['comfortable']), S('member-web', 'desktop', 'web', ['pointer', 'keyboard', 'touch'], 'consumer', 'Light', ['comfortable'])],
      targets: { primary_web_reference: 'react', production_targets: ['flutter'], adapters: ['A03-shadcn-tailwind4'] }, language: { mode: 'archetype', archetype: 'neo-brutalist', themes: [{ name: 'Light' }, { name: 'Dark' }], brands: [{ id: 'default', interaction_hex: '#FF5A1F' }] },
      domain: { entities: [{ name: 'Post' }, { name: 'Order' }] }, components: { packs: ['P03-b2c-media-social', 'P02-b2c-commerce'] } }),
    expect: [{ file_exists: 'adapters/shadcn/shadcn.css' }, { file_exists: 'assets/tailwind.theme.css' }, { contrast_blocking: 0 }, { validators: ['V22'], status: 'PASS' }],
    run_only: ['Komponen P03 + P02; shares antar pack'] },
  // engine 1.9.0: visual profiles (catalog/profiles) — the package must look like the library it names
  G16: { brief: base({ product_name: 'Kelola Proyek', namespace: 'KLP', surfaces: [S('web-admin', 'desktop', 'web', ['pointer', 'keyboard'], 'operational', 'Light', ['comfortable', 'compact']), S('mobile', 'ponsel', 'Android', ['touch'], 'operational', 'Light', ['comfortable'])],
      targets: { primary_web_reference: 'react' }, language: { mode: 'archetype', archetype: 'ink-graphite', visual_profile: 'antd-v6', themes: [{ name: 'Light' }, { name: 'Dark' }], brands: [{ id: 'default' }] },
      domain: { entities: [{ name: 'Project', states: ['draft', 'active', 'at-risk', 'done', 'cancelled'] }] } }),
    expect: [{ lang: 'profile.id', eq: 'antd-v6' }, { lang: 'profile.icon_set', eq: 'antd' }, { lang: 'decisions.L9.value.set', eq: 'antd' }, { lang: 'decisions.L16.value.strategy', eq: 'token-swap' },
      { token: 'radius-sm', eq: 6 }, { token: 'radius-md', eq: 8 }, { token: 'control-height-md', eq: 36 }, { token: 'type-body-size', eq: 16 }, { token: 'layout-bar-height', eq: 64 },
      { file_exists: 'adapters/antd/theme.g.ts' }, { contrast_blocking: 0 },
      // engine 1.9.1 compact density (STD-2c)
      { token_mode: 'type-body-size', mode: 'compact', eq: 14 }, { token_mode: 'type-h1-size', mode: 'compact', eq: 22 }, { token_mode: 'type-caption-size', mode: 'compact', eq: 12 },
      { token_mode: 'control-height-md', mode: 'compact', eq: 32 }, { token_mode: 'control-height-sm', mode: 'compact', eq: 24 }, { token_mode: 'control-height-lg', mode: 'compact', eq: 40 },
      { token_mode: 'layout-bar-height', mode: 'compact', eq: 56 }, { token_mode: 'type-input-size', mode: 'comfortable', eq: 16 }, { css_contains: '--type-input-size: 16px;' }, { validators: ['V1', 'V2', 'V11', 'V13', 'V14', 'VP', 'VB1', 'VB2', 'VB4', 'VB5', 'VB8'], status: 'PASS' }],
    run_only: ['Template dashboard/list/detail/settings/wizard/auth dirender dengan profil antd-v6 (render-previews)'] },
  G17: { brief: base({ product_name: 'Kelola Proyek', namespace: 'KLP', surfaces: [S('web-admin', 'desktop', 'web', ['pointer', 'keyboard'], 'operational', 'Light', ['comfortable']), S('mobile', 'ponsel', 'iOS', ['touch'], 'consumer', 'Light', ['comfortable'])],
      targets: { primary_web_reference: 'react' }, language: { mode: 'archetype', archetype: 'soft-friendly', visual_profile: 'shadcn', neutral_temperature: 'neutral', themes: [{ name: 'Light' }, { name: 'Dark' }], brands: [{ id: 'default' }] },
      domain: { entities: [{ name: 'Project' }] } }),
    expect: [{ lang: 'profile.id', eq: 'shadcn' }, { lang: 'profile.icon_set', eq: 'lucide' }, { token: 'radius-sm', eq: 8 }, { token: 'radius-md', eq: 12 }, { token: 'control-height-md', eq: 36 },
      { token: 'layout-nav-width', eq: 256 }, { file_exists: 'adapters/shadcn/shadcn.css' }, { contrast_blocking: 0 }, { validators: ['V1', 'V2', 'V11', 'V13', 'V14', 'VP', 'VB1', 'VB2', 'VB4', 'VB5', 'VB8'], status: 'PASS' }],
    run_only: ['Profil menimpa archetype soft-friendly: radius, bayangan, dan elevation mengikuti shadcn; ban archetype terkait ditandai suspended_by'] },
};
for (const [id, f] of Object.entries(F)) {
  writeJson(join(root, 'fixtures', id, 'brief.normalized.json'), f.brief);
  writeJson(join(root, 'fixtures', id, 'expect.json'), { fixture: id, source: `golden-briefs.md ${id}`, assertions: f.expect, run_only: f.run_only });
}
console.log(`fixtures: ${Object.keys(F).join(', ')}`);
