#!/usr/bin/env node
// Dev tool: packs the engine as an uploadable Claude skill zip.
// Claude's skill upload accepts at most 200 files and requires the folder name to equal the skill `name`.
// The engine has ~440 files, so the zip carries: every *.md at its own path (readable without unpacking),
// `unpack.mjs`, and `engine.bundle.json.gz` holding the complete tree (tools, catalog, schemas, reference, fixtures, and the .md too).
// At run time the skill runs `node <skill>/unpack.mjs <workdir>/dsg-engine` once and uses that folder as the engine root.
// Usage: node tools/dev/pack-skill.mjs [out dir]   (default: dist/)
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, deflateRawSync } from 'node:zlib';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outDir = process.argv[2] || join(root, 'dist');
const MAX_FILES = 200;
const IGNORE = new Set(['.git', 'node_modules', 'dist', 'out', '.DS_Store']);

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  if (IGNORE.has(n) || n.endsWith('.log')) return [];
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : [relative(root, p).split(sep).join('/')];
}).sort();

const skill = readFileSync(join(root, 'SKILL.md'), 'utf8');
const fm = /^---\n([\s\S]*?)\n---/.exec(skill)?.[1] ?? '';
const name = /^name:\s*(.+)$/m.exec(fm)?.[1].trim();
const desc = /^description:\s*(.+)$/m.exec(fm)?.[1].trim();
if (!name || !/^[a-z0-9-]{1,64}$/.test(name) || /anthropic|claude/.test(name)) throw new Error(`SKILL.md name tidak valid: ${name}`);
if (!desc || desc.length > 1024 || /<[^>]+>/.test(desc)) throw new Error('SKILL.md description kosong, > 1024 karakter, atau berisi tag');
const engine = /^# .*?(\d+\.\d+\.\d+)/m.exec(skill)?.[1] ?? '0.0.0';

const files = walk(root);
const bundle = { format: 'dsg-engine-bundle/1', engine, files: Object.fromEntries(files.map((f) => [f, readFileSync(join(root, f), 'utf8')])) };

const NOTE = `
> **Paket upload skill.** Alat, katalog, skema, referensi, adapter, dan fixture dikemas di \`engine.bundle.json.gz\` (batas upload 200 file).
> Sebelum fase pertama yang menjalankan alat atau membaca \`catalog/\`, \`schemas/\`, \`reference/\`, \`fixtures/\`, jalankan sekali per sesi:
> \`node <folder skill ini>/unpack.mjs <direktori kerja>/dsg-engine\`, lalu pakai folder itu sebagai \`E\` di bagian Pipeline.
> Semua dokumen \`.md\` juga ada langsung di folder skill ini dan boleh dibaca tanpa unpack.
`;
const skillUpload = skill.replace(/^(# .*\n)/m, `$1${NOTE}`);

const UNPACK = `#!/usr/bin/env node
// Restores the full Design System Generator engine tree from engine.bundle.json.gz.
// Usage: node unpack.mjs [dest]   (default: ./dsg-engine)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { join, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const dest = resolve(process.argv[2] || 'dsg-engine');
const b = JSON.parse(gunzipSync(readFileSync(join(here, 'engine.bundle.json.gz'))).toString('utf8'));
if (b.format !== 'dsg-engine-bundle/1') throw new Error('format bundle tidak dikenal: ' + b.format);
let n = 0;
for (const [p, text] of Object.entries(b.files)) {
  const f = resolve(dest, p);
  if (!f.startsWith(dest + sep)) throw new Error('path di luar tujuan: ' + p);
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, text);
  n++;
}
console.log(\`Design System Generator \${b.engine}: \${n} file dipulihkan ke \${dest}\`);
console.log(\`E=\${dest}\`);
`;

const entries = [
  ...files.filter((f) => f.endsWith('.md')).map((f) => [f, f === 'SKILL.md' ? skillUpload : readFileSync(join(root, f), 'utf8')]),
  ['unpack.mjs', UNPACK],
  ['engine.bundle.json.gz', gzipSync(JSON.stringify(bundle), { level: 9 })],
];
if (entries.length > MAX_FILES) throw new Error(`${entries.length} file > batas ${MAX_FILES}`);

// minimal zip writer (deflate, no directory entries)
const CRC = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const now = new Date();
const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
const locals = []; const centrals = []; let offset = 0;
for (const [path, content] of entries) {
  const data = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
  const fname = Buffer.from(`${name}/${path}`, 'utf8');
  const comp = deflateRawSync(data, { level: 9 });
  const crc = crc32(data);
  const head = Buffer.alloc(30); head.writeUInt32LE(0x04034b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(0x0800, 6); head.writeUInt16LE(8, 8);
  head.writeUInt16LE(dosTime, 10); head.writeUInt16LE(dosDate, 12); head.writeUInt32LE(crc, 14); head.writeUInt32LE(comp.length, 18); head.writeUInt32LE(data.length, 22);
  head.writeUInt16LE(fname.length, 26); head.writeUInt16LE(0, 28);
  locals.push(head, fname, comp);
  const cen = Buffer.alloc(46); cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6); cen.writeUInt16LE(0x0800, 8); cen.writeUInt16LE(8, 10);
  cen.writeUInt16LE(dosTime, 12); cen.writeUInt16LE(dosDate, 14); cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(comp.length, 20); cen.writeUInt32LE(data.length, 24);
  cen.writeUInt16LE(fname.length, 28); cen.writeUInt32LE(offset, 42);
  centrals.push(cen, fname);
  offset += 30 + fname.length + comp.length;
}
const cdir = Buffer.concat(centrals);
const end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
end.writeUInt32LE(cdir.length, 12); end.writeUInt32LE(offset, 16);
mkdirSync(outDir, { recursive: true });
const out = join(outDir, `${name}-skill-${engine}.zip`);
writeFileSync(out, Buffer.concat([...locals, cdir, end]));
console.log(`${out}\n${entries.length} file di zip (batas ${MAX_FILES}) · ${files.length} file engine di bundle · folder ${name}/`);
