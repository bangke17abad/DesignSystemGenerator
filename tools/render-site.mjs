#!/usr/bin/env node
// Phase 2/8/12/13: render the documentation site from the package JSON (R1): index.html, docs/05..95, components/<Name>.html
// (18 sections, §6.3), patterns/<Name>.html (10 sections, §11.3), assets/search-index.json, assets/site.css, assets/site.js.
// Zero network requests; works offline from index.html; the site obeys STD-1..4 because it uses the system's own tokens.
// Usage: node tools/render-site.mjs <packageDir>
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, writeJson, writeText, flatten, resolveToken, modeKeys } from './lib/tokens.mjs';
import { contrast } from './lib/color.mjs';

const engine = join(dirname(fileURLToPath(import.meta.url)), '..');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const CHROME = {
  id: { skip: 'Lewati ke konten', overview: 'Ikhtisar', docs: 'Dokumen', components: 'Komponen', patterns: 'Pattern', theme: 'Tema', brand: 'Brand', density: 'Kepadatan', dir: 'Arah', search: 'Cari', results: 'hasil', na: 'Tidak berlaku', preview: 'Pratinjau', noPreview: 'Referensi web untuk komponen ini belum tersedia di paket ini (tier T2). Spesifikasi di halaman ini lengkap; implementasi mengikuti kontrak di bawah.', sections: ['Tujuan dan kapan tidak dipakai', 'Anatomi', 'Varian', 'Ukuran', 'State', 'Perilaku', 'Aksesibilitas', 'Konten', 'Role dan izin', 'Responsif', 'Pemetaan semantik', 'Do dan Don\'t', 'Edge case', 'Pemakaian token', 'API', 'Pemetaan target', 'Pratinjau', 'Status kematangan dan asumsi'], psections: ['Masalah dan kapan dipakai', 'Komposisi', 'Alur', 'Varian per surface', 'State', 'Aksesibilitas', 'Konten', 'Role dan izin', 'Do dan Don\'t', 'Edge case'], docTitles: { '05': 'Bahasa desain', '10': 'Komponen dan state', '20': 'Semantik dan lifecycle', '30': 'Layout dan responsif', '40': 'Aksesibilitas', '50': 'Role dan izin', '60': 'Journey dan layar', '70': 'Konten, error, dan loading', '80': 'Quality gate', '85': 'Governance dan versi', '90': 'Target implementasi', '95': 'Varian platform' } },
  en: { skip: 'Skip to content', overview: 'Overview', docs: 'Documents', components: 'Components', patterns: 'Patterns', theme: 'Theme', brand: 'Brand', density: 'Density', dir: 'Direction', search: 'Search', results: 'results', na: 'Not applicable', preview: 'Preview', noPreview: 'The web reference for this component is not in this package yet (tier T2). The specification on this page is complete; implement against the contract below.', sections: ['Purpose and when not to use', 'Anatomy', 'Variants', 'Sizes', 'States', 'Behaviour', 'Accessibility', 'Content', 'Roles and permissions', 'Responsive', 'Semantic mapping', 'Do and don\'t', 'Edge cases', 'Token usage', 'API', 'Target mapping', 'Preview', 'Maturity and assumptions'], psections: ['Problem and when to use', 'Composition', 'Flow', 'Variants per surface', 'States', 'Accessibility', 'Content', 'Roles and permissions', 'Do and don\'t', 'Edge cases'], docTitles: { '05': 'Design language', '10': 'Components and states', '20': 'Semantics and lifecycle', '30': 'Layout and responsive', '40': 'Accessibility', '50': 'Roles and permissions', '60': 'Journeys and screens', '70': 'Content, errors and loading', '80': 'Quality gate', '85': 'Governance and versioning', '90': 'Implementation targets', '95': 'Platform variants' } },
};

export function renderSite(dir) {
  const J = (...p) => (existsSync(join(dir, ...p)) ? readJson(join(dir, ...p)) : null);
  const brief = J('brief.normalized.json'), manifest = J('manifest.json'), tokens = J('assets', 'tokens.json'), lang = J('assets', 'design-language.json');
  const comps = J('assets', 'components.json')?.components || [], pats = J('assets', 'patterns.json')?.patterns || [];
  const wcag = J('assets', 'wcag22.json'), lint = J('assets', 'lint-rules.json'), lifecycle = J('assets', 'lifecycle.json'), glossary = J('assets', 'glossary.json'), verification = J('reports', 'verification.json');
  const code = /^(indonesia|bahasa)/i.test(brief.doc_language) ? 'id' : 'en';
  const T = CHROME[code];
  const mk = modeKeys(tokens);
  const sem = (n, m) => { const t = tokens.semantic[n]; if (!t) return null; return resolveToken(tokens, t, m ?? (t.$extensions.ds.varies_by.includes('density') ? mk.defaultDensity : mk.defaultColor)).value; };
  const axes = tokens.$metadata.axes;
  const groups = [...new Set(comps.map((c) => c.group))];
  const search = [];
  const pages = [];

  const nav = (depth, current) => {
    const up = depth ? '../' : '';
    const li = (href, label, key) => `<li><a href="${up}${href}"${key === current ? ' aria-current="page"' : ''}>${esc(label)}</a></li>`;
    return `<nav class="site-nav" aria-label="${esc(T.docs)}">
  <ul>${li('index.html', T.overview, 'index')}</ul>
  <h2 class="site-nav__group">${esc(T.docs)}</h2>
  <ul>${manifest.documents.map((d) => li(d.path, `${d.id} ${T.docTitles[d.id]}`, d.path)).join('')}</ul>
  ${groups.map((g) => `<h2 class="site-nav__group">${esc(g)}</h2><ul>${comps.filter((c) => c.group === g).map((c) => li(`components/${c.name}.html`, c.name, `components/${c.name}.html`)).join('')}</ul>`).join('\n  ')}
  <h2 class="site-nav__group">${esc(T.patterns)}</h2>
  <ul>${pats.map((p) => li(`patterns/${p.name}.html`, p.name, `patterns/${p.name}.html`)).join('')}</ul>
</nav>`;
  };
  const picker = (name, label, values) => (values.length > 1 ? `<label class="site-picker"><span>${esc(label)}</span><select data-axis="${name}">${values.map((v) => `<option value="${esc(v)}">${esc(v)}</option>`).join('')}</select></label>` : '');
  const page = (path, title, body, depth, key) => {
    const up = depth ? '../' : '';
    pages.push(path);
    search.push({ path, title, text: body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 600) });
    writeText(join(dir, path), `<!doctype html>
<html lang="${code}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · ${esc(brief.product_name)}</title>
<link rel="stylesheet" href="${up}assets/tokens.css">
<link rel="stylesheet" href="${up}assets/site.css">
</head>
<body>
<a class="site-skip" href="#main">${esc(T.skip)}</a>
<header class="site-header">
  <a class="site-brand" href="${up}index.html">${esc(brief.product_name)} <span>${esc(manifest.version_label)}</span></a>
  <div class="site-tools">
    <form class="site-search" role="search" onsubmit="return false"><label><span class="site-vh">${esc(T.search)}</span><input type="search" id="site-search" placeholder="${esc(T.search)} (Ctrl+K)" autocomplete="off" data-results="${esc(T.results)}"></label><div id="site-search-results" class="site-search__results" hidden></div><p id="site-search-count" class="site-vh" aria-live="polite"></p></form>
    ${picker('theme', T.theme, axes.theme)}${picker('brand', T.brand, axes.brand)}${picker('density', T.density, axes.density)}${picker('dir', T.dir, ['ltr', 'rtl'])}
  </div>
</header>
<div class="site-layout">
${nav(depth, key)}
<main id="main" class="site-main" tabindex="-1">
<h1>${esc(title)}</h1>
${body}
</main>
</div>
<script src="${up}assets/site.js"></script>
</body>
</html>`);
  };
  const table = (head, rows) => `<div class="site-table" data-ds-scroll="x"><table><thead><tr>${head.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c, i) => (i === 0 ? `<th scope="row">${c}</th>` : `<td>${c}</td>`)).join('')}</tr>`).join('')}</tbody></table></div>`;
  const list = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
  const na = (v) => (v && v.not_applicable ? `<p class="site-na">${esc(T.na)}: ${esc(v.not_applicable)}</p>` : null);
  const swatch = (hex) => `<span class="site-swatch" style="background:${esc(hex)}"></span><code>${esc(hex)}</code>`;
  const kv = (o) => `<dl class="site-kv">${Object.entries(o).map(([k, v]) => `<dt>${esc(k)}</dt><dd>${typeof v === 'object' ? `<code>${esc(JSON.stringify(v))}</code>` : esc(v)}</dd>`).join('')}</dl>`;

  // ---------- index ----------
  const D = lang.decisions;
  page('index.html', brief.product_name, `
<p class="site-lead">${esc(brief.domain_summary || '')}</p>
${table([code === 'id' ? 'Ukuran' : 'Measure', code === 'id' ? 'Nilai' : 'Value'], [
    [code === 'id' ? 'Bahasa desain' : 'Design language', esc(`${lang.mode}${lang.archetype ? ' · ' + lang.archetype : ''}`)],
    [code === 'id' ? 'Komponen' : 'Components', `${comps.length} (R ${comps.filter((c) => c.tier === 'R').length} · S ${comps.filter((c) => c.tier === 'S').length} · O ${comps.filter((c) => c.tier === 'O').length})`],
    [code === 'id' ? 'Pattern' : 'Patterns', String(pats.length)],
    [T.theme, esc(axes.theme.join(', '))], [T.brand, esc(axes.brand.join(', '))], [T.density, esc(axes.density.join(', '))],
    [code === 'id' ? 'Target' : 'Targets', esc([manifest.targets.reference, ...manifest.targets.production, ...(manifest.targets.adapters || [])].join(', '))],
    ['Engine', esc(manifest.engine_version)], [code === 'id' ? 'Tier verifikasi' : 'Verification tier', esc(verification?.tier_reached || 'NOT RUN')],
  ])}
<h2>${code === 'id' ? 'Prinsip' : 'Principles'}</h2>
<ol>${D.L1.value.principles.map((p) => `<li>${esc(p)}</li>`).join('')}</ol>
<h2>${code === 'id' ? 'Bukan sistem ini' : 'What this system is not'}</h2>
${list(D.L13.value.bans.map((b) => `<strong>${esc(b.id)}</strong> ${esc(b.statement)}`))}
<p class="site-note">${code === 'id' ? 'Dirancang untuk memenuhi WCAG 2.2 AA; bukti di dokumen 40 dan laporan verifikasi. Kesesuaian produk diputuskan lewat pengujian layar nyata.' : 'Designed to meet WCAG 2.2 AA; evidence in document 40 and the verification report. Product conformance is decided by testing real screens.'}</p>`, 0, 'index');

  // ---------- docs ----------
  const colorNames = Object.keys(tokens.semantic).filter((n) => tokens.semantic[n].$type === 'color').sort();
  const docBody = {
    '05': () => `
<h2>${code === 'id' ? 'Keputusan bahasa L1–L17' : 'Language decisions L1–L17'}</h2>
${Object.entries(D).map(([k, d]) => `<details class="site-decision"><summary><strong>${k}</strong> · ${esc(d.source)} · ${esc(d.rationale)}</summary>${kv(d.value)}<p><strong>${code === 'id' ? 'Konsekuensi teruji' : 'Testable'}:</strong> ${esc(d.testable_consequence.join('; '))}</p>${d.overrides ? `<p>Override: <code>${esc(JSON.stringify(d.overrides))}</code></p>` : ''}</details>`).join('\n')}
${lang.scores ? `<h2>${code === 'id' ? 'Skor archetype' : 'Archetype scores'}</h2>${table(['Archetype', 'Skor'], Object.entries(lang.scores).sort((a, b) => b[1] - a[1]).map(([a, s]) => [esc(a), String(s)]))}` : ''}
<h2>${code === 'id' ? 'Warna per mode' : 'Colour per mode'}</h2>
${table(['Token', ...mk.color], colorNames.map((n) => [`<code>${esc(n)}</code>`, ...mk.color.map((m) => swatch(sem(n, m)))]))}
<h2>${code === 'id' ? 'Tipografi' : 'Typography'}</h2>
${table(['Token', 'Size', 'Line', 'Weight', code === 'id' ? 'Kelas' : 'Class'], ['display', 'h1', 'h2', 'h3', 'body-lg', 'body', 'label', 'code', 'caption'].map((k) => [`<span class="ds-text-${k}">type-${k}</span>`, `${sem(`type-${k}-size`)}px`, `${sem(`type-${k}-line`)}px`, String(sem(`type-${k}-weight`)), esc(tokens.semantic[`type-${k}-size`].$extensions.ds.text_class)]))}
<h2>${code === 'id' ? 'Ruang, bentuk, elevasi, gerak' : 'Space, shape, elevation, motion'}</h2>
${table(['Token', code === 'id' ? 'Nilai' : 'Value'], Object.keys(tokens.semantic).filter((n) => /^(space|radius|border-width|motion|elevation|control-height|icon|layout|focus-ring|shape|timing)-/.test(n)).sort().map((n) => [`<code>${esc(n)}</code>`, `<code>${esc(JSON.stringify(sem(n)))}</code>`]))}`,
    '10': () => `
${table([T.components, 'Tier', 'Group', 'Status', T.preview], comps.map((c) => [`<a href="../components/${c.name}.html">${esc(c.name)}</a>`, c.tier, esc(c.group), c.status, existsSync(join(dir, 'previews', `${c.name}.html`)) ? '✓' : '—']))}
${(() => { const tdir = join(dir, 'templates'); const ts = existsSync(tdir) ? readdirSync(tdir).filter((f) => f.endsWith('.html')).sort() : []; return ts.length ? `<h2>${code === 'id' ? 'Template halaman' : 'Page templates'}</h2><p class="site-note">${code === 'id' ? 'Profil visual' : 'Visual profile'}: <code>${esc(lang.profile?.id || 'engine')}</code>${lang.profile?.library ? ` (${esc(lang.profile.library)})` : ''}</p>${list(ts.map((f) => `<a href="../templates/${esc(f)}">${esc(f.slice(0, -5))}</a>`))}` : ''; })()}
<h2>${code === 'id' ? 'Pengecualian' : 'Exclusions'}</h2>${list((manifest.core_exclusions.length ? manifest.core_exclusions : [{ component: '—', reason: '—' }]).map((e) => `${esc(e.component)}: ${esc(e.reason)}`))}
<h2>${code === 'id' ? 'Model state (§6.9)' : 'State model (§6.9)'}</h2>
${list([code === 'id' ? 'Empat lapisan: dasar (default/selected/error) · interaksi (rest/hover/pressed/dragged) · fokus · ketersediaan (enabled/disabled/loading/read-only).' : 'Four layers: base · interaction · focus · availability.', `${code === 'id' ? 'Strategi' : 'Strategy'} L16: <code>${esc(D.L16.value.strategy)}</code>; state-layer hover ${sem('state-layer-hover-opacity')}, pressed ${sem('state-layer-pressed-opacity')}.`, code === 'id' ? 'Aksi diblokir memakai aria-disabled + alasan terlihat, bukan disabled native (UB10).' : 'Blocked actions use aria-disabled + a visible reason (UB10).'])}`,
    '20': () => `
<h2>${code === 'id' ? 'Kelas perhatian dan perlakuan (L3)' : 'Attention classes and treatment (L3)'}</h2>
${table([code === 'id' ? 'Kelas' : 'Class', code === 'id' ? 'Perlakuan' : 'Treatment', 'Token', code === 'id' ? 'Ikon' : 'Icon'], ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].map((k, i) => [k, esc(D.L3.value.attention[k]), `<code>attention-${k.toLowerCase()}-*</code>`, esc([D.L9.value.glyphs.critical, D.L9.value.glyphs.warning, D.L9.value.glyphs['neutral-negative'], D.L9.value.glyphs.positive, D.L9.value.glyphs.info, '—'][i])]))}
${lifecycle ? lifecycle.entities.map((e) => `<h2>${esc(e.name)}</h2>${table(['State', code === 'id' ? 'Kelas' : 'Class', 'Token', code === 'id' ? 'Ikon' : 'Icon', code === 'id' ? 'Perlakuan' : 'Treatment', 'UI'], e.states.map((s) => [esc(s.name), s.class, `<code>${esc(s.token)}</code>`, esc(s.icon || '—'), esc(s.treatment), esc(Object.values(s.ui_text).join(' / '))]))}`).join('') : `<p class="site-note">lifecycle.json: ${code === 'id' ? 'ditulis run di Phase 5 dari entitas B5.' : 'written by the run in Phase 5 from B5 entities.'}</p>`}`,
    '30': () => `
${table(['Breakpoint', 'px'], ['mobile', 'tablet', 'desktop', 'wide'].map((k) => [`bp-${k}`, String(sem(`bp-${k}`))]))}
${table([code === 'id' ? 'Lebar konten' : 'Content width', code === 'id' ? 'Kolom' : 'Columns', 'Gutter', 'Margin'], [['< 600', '4', '16', '16'], ['600–1023', '8', '20', '24'], ['≥ 1024', '12', '24', '32']])}
${table([T.density, 'control-height sm / md / lg', 'layout-row-height'], axes.density.map((d) => [d, ['sm', 'md', 'lg'].map((k) => sem(`control-height-${k}`, d)).join(' / '), String(sem('layout-row-height', d))]))}
<p>${code === 'id' ? 'Komposisi L17' : 'Composition L17'}: ${esc(JSON.stringify(D.L17.value))}</p>`,
    '40': () => `
${mk.density.includes('compact') ? `<h2>${code === 'id' ? 'Density compact (STD-2c)' : 'Compact density (STD-2c)'}</h2><p>${code === 'id' ? `Paket ini memuat density <code>compact</code> yang dipilih di brief: teks isi ${sem('type-body-size', 'compact')} px, caption ${sem('type-caption-size', 'compact')} px, H1 ${sem('type-h1-size', 'compact')} px, kontrol ${['sm', 'md', 'lg'].map((k) => sem(`control-height-${k}`, 'compact')).join(' / ')} px. Di layar sentuh, input tetap ${sem('type-input-size', mk.density.find((d) => d !== 'compact') || 'compact')} px (iOS tidak zoom) dan area klik tetap 44 px. Kontras tetap ≥ 4.5:1; teks tetap bisa diperbesar 200%. Mode comfortable tetap ≥ 16 px.` : `This package includes the <code>compact</code> density chosen in the brief: body text ${sem('type-body-size', 'compact')} px, caption ${sem('type-caption-size', 'compact')} px, H1 ${sem('type-h1-size', 'compact')} px, controls ${['sm', 'md', 'lg'].map((k) => sem(`control-height-${k}`, 'compact')).join(' / ')} px. On touch screens inputs stay ${sem('type-input-size', mk.density.find((d) => d !== 'compact') || 'compact')} px (no iOS zoom) and hit areas stay 44 px. Contrast stays ≥ 4.5:1; text still scales to 200%. Comfortable stays ≥ 16 px.`}</p>` : ''}
${table(['SC', code === 'id' ? 'Nama' : 'Name', 'Level', 'Status', code === 'id' ? 'Penerapan' : 'Application', code === 'id' ? 'Diverifikasi oleh' : 'Verified by'], (wcag?.criteria || []).map((c) => [c.sc, esc(c.name), c.level, esc(c.status), esc(c.application), esc(c.verified_by)]))}`,
    '50': () => `
${(brief.roles || []).length ? table(['Role', code === 'id' ? 'Tujuan' : 'Goals', 'Surface'], brief.roles.map((r) => [esc(r.name), esc(r.goals || ''), esc((r.surfaces || []).join(', '))])) : `<p class="site-note">${code === 'id' ? 'B2 belum mendaftar role; pola izin di bawah berlaku umum.' : 'B2 lists no roles yet; the permission patterns below apply generally.'}</p>`}
${table([code === 'id' ? 'Pola' : 'Pattern', code === 'id' ? 'Arti' : 'Meaning'], [['hidden', code === 'id' ? 'role tidak pernah boleh' : 'never allowed for the role'], ['disabled-with-reason', code === 'id' ? 'terlihat, diblokir dengan alasan + ikon gembok' : 'visible, blocked with reason + lock icon'], ['step-up', code === 'id' ? 'butuh otorisasi tambahan (StepUpDialog)' : 'needs extra authorisation'], ['read-only', code === 'id' ? 'boleh lihat, tidak boleh ubah' : 'view only'], ['full', code === 'id' ? 'akses penuh' : 'full access']])}`,
    '60': () => `
${table([T.patterns, 'Tier', code === 'id' ? 'Masalah' : 'Problem'], pats.map((p) => [`<a href="../patterns/${p.name}.html">${esc(p.name)}</a>`, p.tier, esc(p.problem.problem)]))}
${(brief.domain?.journeys || []).map((j) => `<h2>${esc(j.name || j.id)}</h2><ol>${(j.steps || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`).join('')}`,
    '70': () => `
<h2>${code === 'id' ? 'Suara (L11)' : 'Voice (L11)'}</h2>${kv(D.L11.value)}
${table([code === 'id' ? 'Tipe error' : 'Error type', code === 'id' ? 'Ditampilkan sebagai' : 'Shown as'], [['Validation', code === 'id' ? 'inline di bawah field: border critical, teks critical-strong, ikon' : 'inline under the field'], ['Policy', 'InlineAlert C2'], ['System', 'InlineAlert C1 + Retry'], ['Permission', code === 'id' ? 'dicegah: hidden atau disabled dengan alasan' : 'prevented'], ['Offline', 'InlineAlert C2 + antrean (OfflineSync)'], ['Not found', 'EmptyState + jalan kembali'], ['Forbidden', code === 'id' ? 'EmptyState restricted + cara meminta akses' : 'EmptyState restricted + how to request access']])}
${glossary ? table(['ID', ...brief.ui_locales, code === 'id' ? 'Hindari' : 'Avoid'], glossary.terms.map((t) => [esc(t.id), ...brief.ui_locales.map((l) => esc(t.labels[l] || '')), esc((t.avoid || []).join(', '))])) : ''}`,
    '80': () => `
${table(['ID', code === 'id' ? 'Larangan' : 'Rule', code === 'id' ? 'Jenis' : 'Kind', code === 'id' ? 'Sumber' : 'Source'], (lint?.rules || []).map((r) => [r.id, esc(r.statement), r.kind, esc(r.source)]))}
${verification ? `<h2>${code === 'id' ? 'Verifikasi terakhir' : 'Latest verification'} · tier ${esc(verification.tier_reached)}</h2>${table(['ID', 'Validator', 'Status', code === 'id' ? 'Sifat' : 'Severity'], verification.validators.map((v) => [v.id, esc(v.name), v.status, v.severity]))}` : ''}`,
    '85': () => `
${list([code === 'id' ? 'Semver: rename token = major; nilai berubah = minor kecuali kontras turun di bawah baseline = major; penambahan = minor; penghapusan = major setelah deprecated satu minor.' : 'Semver rules per §15.1.', code === 'id' ? 'Tangga kematangan: Draft → Reviewed → Stable (R12); Stable hanya bila validator relevan lolos.' : 'Maturity: Draft → Reviewed → Stable (R12).', code === 'id' ? 'Pemilik, SLA tinjauan, dan kebijakan deprecation adalah keputusan organisasi: usulan berlabel A-nn.' : 'Owners, review SLA and deprecation policy are organisational decisions (A-nn).'])}`,
    '90': () => `
${table([code === 'id' ? 'Target' : 'Target', code === 'id' ? 'Peran' : 'Role'], [[esc(manifest.targets.reference), 'reference web'], ...manifest.targets.production.map((t) => [esc(t), 'production']), ...(manifest.targets.adapters || []).map((a) => [esc(a), 'adapter'])])}
${existsSync(join(dir, 'reports', 'build-manifest.json')) ? `<h2>${code === 'id' ? 'File hasil generate' : 'Generated files'}</h2>${list(Object.keys(readJson(join(dir, 'reports', 'build-manifest.json')).files).map((f) => `<code>${esc(f)}</code>`))}` : ''}`,
    '95': () => `
${table(['Surface', 'Device', 'Runtime', code === 'id' ? 'Modalitas' : 'Modalities', T.theme, T.density, code === 'id' ? 'Konektivitas' : 'Connectivity'], (brief.surfaces || []).map((s) => [esc(s.name), esc(s.device || '—'), esc(s.os_runtime || '—'), esc(s.input_modality.join(', ')), esc(s.default_theme), esc(s.density_modes.join(', ')), esc(s.connectivity || '—')]))}
<p>L14: ${esc(D.L14.value.platform)} ${esc(D.L14.value.note || '')}</p>`,
  };
  for (const d of manifest.documents) page(d.path, `${d.id} ${T.docTitles[d.id]}`, docBody[d.id](), 1, d.path);

  // ---------- components ----------
  for (const c of comps) {
    const S = T.sections;
    const sec = (i, html) => `<section class="site-section" aria-labelledby="s${i}"><h2 id="s${i}">${i + 1}. ${esc(S[i])}</h2>${html}</section>`;
    const hasPreview = existsSync(join(dir, 'previews', `${c.name}.html`));
    const body = [
      sec(0, `<p>${esc(c.purpose.purpose)}</p>${list(c.purpose.when_not_to_use.map(esc))}`),
      sec(1, table(['Part', 'Tokens'], c.anatomy.map((a) => [esc(a.part), a.tokens.map((t) => `<code>${esc(t)}</code>`).join(' ')]))),
      sec(2, na(c.variants) || table(['Variant', ''], c.variants.map((v) => [esc(v.name), esc(v.description)]))),
      sec(3, na(c.sizes) || table(['Size', 'Visual', 'Pointer', 'Touch', ...(c.sizes[0].hit_extended_px ? ['Extended'] : [])], c.sizes.map((s) => [s.name, `${s.visual_px}px`, `≥ ${s.hit_pointer_px}px`, `≥ ${s.hit_touch_px}px`, ...(s.hit_extended_px ? [`≥ ${s.hit_extended_px}px`] : [])]))),
      sec(4, table(['State', 'Token swaps'], c.states.map((s) => [esc(s.name), Object.entries(s.token_swaps).map(([k, v]) => `${esc(k)} → <code>${esc(v)}</code>`).join('<br>')]))),
      sec(5, table(['Input', 'Trigger', 'Result'], c.behaviour.map((b) => [b.input, esc(b.trigger), esc(b.result)]))),
      sec(6, kv({ role: c.accessibility.role, attributes: c.accessibility.attributes.join('; '), politeness: c.accessibility.politeness || '—', focus: c.accessibility.focus_order, label: c.accessibility.sr_label, WCAG: c.accessibility.wcag.join(', ') })),
      sec(7, Object.entries(c.content).map(([l, v]) => `<h3 lang="${esc(l.split('-')[0])}">${esc(l)}</h3>${list(v.rules.map(esc))}<p>${v.examples.map((e) => `<q lang="${esc(l.split('-')[0])}">${esc(e)}</q>`).join(' · ')}</p>`).join('')),
      sec(8, na(c.roles) || table(['Role', 'Pattern', ''], c.roles.map((r) => [esc(r.role), r.pattern, esc(r.note)]))),
      sec(9, table(['Device', ''], c.responsive.map((r) => [esc(r.device_class), esc(r.behaviour)]))),
      sec(10, na(c.semantic_mapping) || table(['State', 'Class', 'Token', 'Icon', 'Treatment'], c.semantic_mapping.map((m) => [esc(m.state), m.class, `<code>${esc(m.token)}</code>`, esc(m.icon), m.treatment]))),
      sec(11, `<div class="site-dodont"><div><h3>Do</h3>${list(c.do.map(esc))}</div><div><h3>Don't</h3>${list(c.dont.map((d) => `${esc(d.text)}${d.ref ? ` <code>${esc(d.ref)}</code>` : ''}`))}</div></div>`),
      sec(12, table(['Case', 'Behaviour'], c.edge_cases.map((e) => [esc(e.case), esc(e.behaviour)]))),
      sec(13, na(c.token_usage) || table(['Part', 'Token'], c.token_usage.map((t) => [esc(t.part), `<code>${esc(t.token)}</code>`]))),
      sec(14, table(['Prop', 'Type', 'Default', 'Required', ''], c.api.props.map((p) => [`<code>${esc(p.name)}</code>`, `<code>${esc(p.type)}</code>`, esc(p.default ?? '—'), p.required ? '✓' : '', esc(p.description)])) + (c.api.events.length ? table(['Event', 'Payload', 'When'], c.api.events.map((e) => [`<code>${esc(e.name)}</code>`, esc(e.payload), esc(e.when)])) : '') + (c.api.parts.length ? `<p>Parts: ${c.api.parts.map((p) => `<code>${esc(p)}</code>`).join(' ')}</p>` : '')),
      sec(15, table(['Target', 'Widget', 'Path', 'State'], Object.entries(c.target_mapping).map(([t, m]) => [esc(t), `<code>${esc(m.widget)}</code>`, `<code>${esc(m.path)}</code>`, esc(m.state_strategy)]))),
      sec(16, hasPreview ? `<iframe class="site-preview" src="../previews/${esc(c.name)}.html" title="${esc(T.preview)} ${esc(c.name)}" loading="lazy"></iframe>` : `<p class="site-note">${esc(T.noPreview)}</p>`),
      sec(17, `<p>Status: <strong>${esc(c.status)}</strong> · tier ${esc(c.tier)}</p>${c.assumptions.length ? list(c.assumptions.map(esc)) : ''}`),
    ].join('\n');
    page(`components/${c.name}.html`, c.name, body, 1, `components/${c.name}.html`);
  }
  // ---------- patterns ----------
  for (const p of pats) {
    const S = T.psections;
    const sec = (i, html) => `<section class="site-section" aria-labelledby="s${i}"><h2 id="s${i}">${i + 1}. ${esc(S[i])}</h2>${html}</section>`;
    const body = [
      sec(0, `<p>${esc(p.problem.problem)}</p><h3>${code === 'id' ? 'Kapan' : 'When'}</h3>${list(p.problem.when.map(esc))}<h3>${code === 'id' ? 'Kapan tidak' : 'When not'}</h3>${list(p.problem.when_not.map(esc))}`),
      sec(1, table([T.components, code === 'id' ? 'Peran' : 'Role'], p.composition.map((c) => [comps.some((x) => x.name === c.component) ? `<a href="../components/${c.component}.html">${esc(c.component)}</a>` : esc(c.component), esc(c.role_in_pattern)]))),
      sec(2, table(['Step', 'Class', 'Transition'], p.flow.map((f) => [esc(f.step), f.state_class, esc(f.transition)]))),
      sec(3, na(p.variants) || table(['Surface', 'Device', ''], p.variants.map((v) => [esc(v.surface), esc(v.device_class), esc(v.behaviour)]))),
      sec(4, kv(p.states)),
      sec(5, table(['Step', 'Focus', 'Announcement'], p.accessibility.map((a) => [esc(a.step), esc(a.focus), esc(a.announcement || '—')]))),
      sec(6, Object.entries(p.content).map(([l, v]) => `<p><strong>${esc(l)}</strong>: ${v.map((e) => `<q lang="${esc(l.split('-')[0])}">${esc(e)}</q>`).join(' · ')}</p>`).join('')),
      sec(7, na(p.roles) || table(['Role', 'Pattern', ''], p.roles.map((r) => [esc(r.role), r.pattern, esc(r.note)]))),
      sec(8, `<div class="site-dodont"><div><h3>Do</h3>${list(p.do.map(esc))}</div><div><h3>Don't</h3>${list(p.dont.map((d) => `${esc(d.text)}${d.ref ? ` <code>${esc(d.ref)}</code>` : ''}`))}</div></div>`),
      sec(9, table(['Case', 'Behaviour'], p.edge_cases.map((e) => [esc(e.case), esc(e.behaviour)]))),
    ].join('\n');
    page(`patterns/${p.name}.html`, p.name, body, 1, `patterns/${p.name}.html`);
  }
  writeJson(join(dir, 'assets', 'search-index.json'), { pages: search });
  writeText(join(dir, 'assets', 'site.css'), readFileSync(join(engine, 'reference', 'site', 'site.css'), 'utf8'));
  writeText(join(dir, 'assets', 'site.js'), readFileSync(join(engine, 'reference', 'site', 'site.js'), 'utf8').replace('/*SEARCH_INDEX*/null', JSON.stringify(search.map((s) => ({ p: s.path, t: s.title, x: s.text.slice(0, 240) })))));
  return pages;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const pages = renderSite(process.argv[2]);
  console.log(`OK site: ${pages.length} pages`);
}
