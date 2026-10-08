#!/usr/bin/env node
// Phase 15: maturity score of a generated package, per dimension, from reports/verification.json (+ qa.json when present).
// Rubric: rubric/maturity-rubric.md. Levels 0-4 per dimension; a dimension with a blocking FAIL is capped at 0.
// The score never replaces the tier (§16.5); it shows WHERE a package is thin. NOT RUN counts as "not proven", never as pass.
// Usage: node tools/score.mjs <packageDir> [--json]
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, writeJson, writeText } from './lib/tokens.mjs';

export const DIMENSIONS = [
  { id: 'D1', name: 'Fondasi token', validators: ['V1', 'V14', 'V16', 'VB3', 'VB4', 'VB5', 'VB6'] },
  { id: 'D2', name: 'Aksesibilitas', validators: ['V2', 'V11', 'V12', 'VB8'], qa: true },
  { id: 'D3', name: 'Kualitas visual', validators: ['V6', 'V13', 'VB1', 'VB2', 'VB7', 'VB9', 'VB10', 'VB11', 'VB12'] },
  { id: 'D4', name: 'Komponen dan pattern', validators: ['V5', 'V9', 'V10', 'V17', 'V19'] },
  { id: 'D5', name: 'Dokumentasi dan bahasa', validators: ['V3', 'V4', 'V7'] },
  { id: 'D6', name: 'Mode, platform, ekosistem', validators: ['V8', 'V15', 'V18', 'V20', 'V21', 'V22'] },
];

const LEVEL_TEXT = ['0 · gagal blocking', '1 · rapuh', '2 · cukup', '3 · matang', '4 · teruji penuh'];

export function scorePackage(dir) {
  const vpath = join(dir, 'reports', 'verification.json');
  if (!existsSync(vpath)) throw new Error(`${vpath} tidak ada: jalankan tools/validate.mjs dulu`);
  const ver = readJson(vpath);
  const qa = existsSync(join(dir, 'reports', 'qa.json')) ? readJson(join(dir, 'reports', 'qa.json')) : null;
  const by = Object.fromEntries(ver.validators.map((v) => [v.id, v]));
  const dims = DIMENSIONS.map((d) => {
    const rows = d.validators.map((id) => by[id] || { id, status: 'NOT RUN', severity: 'advisory', failures: [] });
    const blocking = rows.filter((r) => r.status === 'FAIL' && r.severity === 'blocking');
    const advisory = rows.filter((r) => r.status === 'FAIL' && r.severity !== 'blocking');
    const notRun = rows.filter((r) => r.status === 'NOT RUN');
    const applicable = rows.filter((r) => r.status !== 'NOT APPLICABLE');
    const pass = rows.filter((r) => r.status === 'PASS');
    let level;
    if (blocking.length) level = 0;
    else if (advisory.length > 1 || (applicable.length && pass.length / applicable.length < 0.5)) level = 1;
    else if (advisory.length === 1 || notRun.length > applicable.length / 3) level = 2;
    else if (notRun.length) level = 3;
    else level = 4;
    const notes = [];
    if (d.qa) {
      if (!qa || qa.status !== 'RUN') { notes.push('QA browser NOT RUN: aksesibilitas hanya terbukti statis'); level = Math.min(level, 3); }
      else if (!qa.pass) { notes.push(`QA browser FAIL: ${JSON.stringify(qa.summary).slice(0, 160)}`); level = Math.min(level, 1); }
      else notes.push(`QA browser PASS di ${qa.summary.pages} halaman`);
    }
    return {
      id: d.id, name: d.name, level, label: LEVEL_TEXT[level],
      pass: pass.map((r) => r.id), fail_blocking: blocking.map((r) => r.id), fail_advisory: advisory.map((r) => r.id),
      not_run: notRun.map((r) => r.id), not_applicable: rows.filter((r) => r.status === 'NOT APPLICABLE').map((r) => r.id),
      first_failures: [...blocking, ...advisory].map((r) => `${r.id}: ${r.failures?.[0] || ''}`).slice(0, 3), notes,
    };
  });
  const total = dims.reduce((s, d) => s + d.level, 0);
  const weakest = [...dims].sort((a, b) => a.level - b.level)[0];
  return { engine_version: ver.engine_version, package: ver.package, generated_by: 'tools/score.mjs', tier_reached: ver.tier_reached, score: total, max: dims.length * 4, dimensions: dims, weakest: weakest.id };
}

export function scoreMarkdown(s) {
  const L = [`# Skor kematangan`, '', `Engine ${s.engine_version} · paket ${s.package} · **tier ${s.tier_reached}** · skor **${s.score}/${s.max}** · dimensi terlemah ${s.weakest}`, '',
    'Skor tidak menggantikan tier (§16.5). NOT RUN dihitung sebagai belum terbukti. Rubrik: `rubric/maturity-rubric.md`.', '',
    '| Dimensi | Level | PASS | FAIL | NOT RUN | Catatan |', '|---|---|---|---|---|---|'];
  for (const d of s.dimensions) L.push(`| ${d.id} ${d.name} | ${d.label} | ${d.pass.join(', ') || '-'} | ${[...d.fail_blocking.map((x) => `**${x}**`), ...d.fail_advisory].join(', ') || '-'} | ${d.not_run.join(', ') || '-'} | ${[...d.first_failures, ...d.notes].join('<br>') || '-'} |`);
  return L.join('\n') + '\n';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const dir = process.argv[2];
  if (!dir) { console.error('Pakai: node tools/score.mjs <packageDir> [--json]'); process.exit(2); }
  const s = scorePackage(dir);
  writeJson(join(dir, 'reports', 'score.json'), s);
  writeText(join(dir, 'reports', 'score-report.md'), scoreMarkdown(s));
  if (process.argv.includes('--json')) console.log(JSON.stringify(s, null, 2));
  else { console.log(`tier ${s.tier_reached} · skor ${s.score}/${s.max}`); for (const d of s.dimensions) console.log(`  ${d.id} ${d.name.padEnd(28)} ${d.label}`); }
}
