#!/usr/bin/env node
// Validates catalog/patterns/*.json: schema, tier = M08 §11.2 (engine 1.8.0 list), composition only names catalogue components,
// wcag ids in the 55-SC seed, dont.ref ids. Usage: node tools/check-patterns.mjs [Name ...]
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from './lib/schema.mjs';
import { readJson } from './lib/tokens.mjs';
import { CORE_INDEX } from './check-catalog.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const BASE_PATTERNS = {
  R: ['CrudFlow', 'FormFlow', 'DestructiveAction', 'SystemPages', 'AsyncFeedback', 'AppNavigation'],
  S: ['SearchAndFilter', 'AuthAndSession', 'Settings', 'DetailView', 'MasterDetail', 'Dashboard'],
  O: ['BulkActions', 'Wizard', 'Onboarding', 'NotificationCenter', 'ImportExport', 'FileUpload', 'OfflineSync', 'DataStory', 'PermissionRequest'],
};
export const PATTERN_INDEX = Object.fromEntries(Object.entries(BASE_PATTERNS).flatMap(([t, ns]) => ns.map((n) => [n, t])));

export function checkPatterns(only) {
  const schema = readJson(join(root, 'schemas', 'catalog-pattern.schema.json'));
  const wcag = new Set(readJson(join(root, 'catalog', 'wcag22.seed.json')).criteria.map((c) => c.sc));
  const res = {};
  for (const f of readdirSync(join(root, 'catalog', 'patterns')).filter((x) => x.endsWith('.json')).sort()) {
    const r = readJson(join(root, 'catalog', 'patterns', f));
    if (only?.length && !only.includes(r.name)) continue;
    const errs = validate(schema, r).map((e) => `schema ${e}`);
    if (`${r.name}.json` !== f) errs.push(`file ${f} != name ${r.name}`);
    if (!PATTERN_INDEX[r.name]) errs.push(`${r.name} not in base pattern list`);
    else if (PATTERN_INDEX[r.name] !== r.tier) errs.push(`tier ${r.tier} != ${PATTERN_INDEX[r.name]}`);
    for (const c of r.composition || []) if (!CORE_INDEX[c.component]) errs.push(`composition uses "${c.component}" which is not a catalogue component (patterns add no components)`);
    for (const sc of r.wcag || []) if (!wcag.has(sc)) errs.push(`wcag ${sc} not in the 55 A/AA criteria`);
    for (const d of r.dont || []) if (d.ref && !/^(UB\d{1,2}|I[1-9]|STD-[1-4]|SC \d\.\d\.\d{1,2}|LB-\d{2}|§\d+(\.\d+)*|VB\d{1,2})$/.test(d.ref)) errs.push(`dont.ref "${d.ref}" is not a rule id`);
    for (const p of r.related_patterns || []) if (!PATTERN_INDEX[p]) errs.push(`related pattern "${p}" unknown`);
    res[r.name] = errs;
  }
  return res;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const only = process.argv.slice(2);
  const res = checkPatterns(only);
  const expected = only.length ? only : Object.keys(PATTERN_INDEX);
  const missing = expected.filter((n) => !(n in res));
  let bad = 0;
  for (const [n, e] of Object.entries(res)) if (e.length) { bad++; console.log(`FAIL ${n}\n  - ${e.slice(0, 15).join('\n  - ')}`); }
  console.log(`patterns: ${Object.keys(res).length - bad}/${Object.keys(res).length} pass; ${missing.length} of ${expected.length} missing${missing.length ? ': ' + missing.join(', ') : ''}`);
  process.exit(bad ? 1 : 0);
}
