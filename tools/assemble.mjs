#!/usr/bin/env node
// Merakit core + 14 modul (+ pack terpilih) menjadi satu file (mode monolit) di dist/.
// Pakai: node tools/assemble.mjs [P04 ...]
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const core = readFileSync(join(root, 'core.prompt.md'), 'utf8');
const engine = core.match(/\*\*Engine `([^`]+)`\*\*/)?.[1];
if (!engine) fail('Versi engine tidak ditemukan di header core.prompt.md');

const modDir = join(root, 'modules');
const files = readdirSync(modDir).filter((f) => /^M\d{2}-[a-z-]+\.md$/.test(f)).sort();
if (files.length !== 14) fail(`Butuh 14 modul, ditemukan ${files.length}`);
const modules = files.map((f) => {
  const text = readFileSync(join(modDir, f), 'utf8');
  const v = text.match(/engine="([^"]+)"/)?.[1];
  if (v !== engine) fail(`${f}: engine ${v} tidak sama dengan core ${engine}`);
  return text.trim();
});

// Pack hanya disertakan bila disebut di argumen (sama dengan B7 component_packs).
const packDir = join(root, 'packs');
const wanted = process.argv.slice(2).map((a) => a.toUpperCase());
const available = existsSync(packDir) ? readdirSync(packDir).filter((f) => /^P\d{2}-[a-z0-9-]+\.md$/.test(f)).sort() : [];
const packs = wanted.map((id) => {
  const f = available.find((x) => x.startsWith(id + '-'));
  if (!f) fail(`Pack ${id} tidak ditemukan di packs/`);
  const text = readFileSync(join(packDir, f), 'utf8');
  const min = text.match(/engine_min="([^"]+)"/)?.[1];
  if (!min || !compatible(engine, min)) fail(`${f}: butuh engine ${min}, core ${engine}`);
  return text.trim();
});

const at = core.lastIndexOf('\n<project_brief>\n');
if (at < 0) fail('Blok <project_brief> tidak ditemukan di core.prompt.md');
const sep = '\n\n---\n\n';
const note = `> MODE MONOLIT: semua modul${packs.length ? ` dan pack ${wanted.join(', ')}` : ''} sudah ada di bawah ini (§0, aturan 5). Nomor § tetap; urutan section berbeda dari nomornya.`;
const out = core.slice(0, at).trimEnd() + sep + note + sep + [...modules, ...packs].join(sep) + sep + core.slice(at + 1);

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'design-system-generator.full.md'), out);
console.log(`OK: ${files.length} modul, ${packs.length} pack, engine ${engine}, ${Buffer.byteLength(out)} byte → dist/design-system-generator.full.md`);

function compatible(have, min) {
  const a = have.split('.').map(Number), b = min.split('.').map(Number);
  if (a[0] !== b[0]) return false;
  for (let i = 1; i < 3; i++) { if (a[i] > b[i]) return true; if (a[i] < b[i]) return false; }
  return true;
}
function fail(msg) { console.error(`assemble: ${msg}`); process.exit(1); }
