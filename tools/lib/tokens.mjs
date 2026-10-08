// Shared helpers for reading tokens.json (§16A). Zero dependencies.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

export const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));

/** Stable stringify: keys sorted alphabetically, 2-space indent, LF, trailing newline (R16). */
export function stableStringify(value) {
  const sort = (v) => {
    if (Array.isArray(v)) return v.map(sort);
    if (v && typeof v === 'object') {
      return Object.keys(v).sort().reduce((o, k) => { o[k] = sort(v[k]); return o; }, {});
    }
    return v;
  };
  return JSON.stringify(sort(value), null, 2) + '\n';
}
export function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, stableStringify(value));
}
export function writeText(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text.endsWith('\n') ? text : text + '\n');
}

const isToken = (o) => o && typeof o === 'object' && '$value' in o;

/** Flatten a token group into [{path, name, layer, token}]. name = css-style name (semantic/component keys are already flat). */
export function flatten(file) {
  const out = [];
  const walk = (node, path, layer) => {
    for (const k of Object.keys(node).sort()) {
      if (k.startsWith('$')) continue;
      const v = node[k];
      const p = [...path, k];
      if (isToken(v)) out.push({ path: p.join('.'), name: layer === 'primitive' ? p.slice(1).join('-') : p.slice(1).join('-'), layer, token: v });
      else if (v && typeof v === 'object') walk(v, p, layer);
    }
  };
  for (const layer of ['primitive', 'semantic', 'component']) if (file[layer]) walk(file[layer], [layer], layer);
  return out;
}

export function getByPath(file, path) {
  return path.split('.').reduce((n, k) => (n == null ? undefined : n[k]), file);
}

export const isAlias = (v) => typeof v === 'string' && /^\{[^{}]+\}$/.test(v);
export const aliasPath = (v) => v.slice(1, -1);

/** All mode keys declared by the file: colour modes "<brand>/<theme>" and size modes "<density>". */
export function modeKeys(file) {
  const { theme, brand, density } = file.$metadata.axes;
  return {
    color: brand.flatMap((b) => theme.map((t) => `${b}/${t}`)),
    density: [...density],
    defaultColor: `${brand[0]}/${theme[0]}`,
    defaultDensity: density[0],
  };
}

/** Value of a token for a mode key, alias-resolved (depth-limited). Returns {value, chain, error}. */
export function resolveToken(file, token, mode) {
  const chain = [];
  let v = valueFor(token, mode);
  for (let i = 0; i < 12 && isAlias(v); i++) {
    const p = aliasPath(v);
    chain.push(p);
    const t = getByPath(file, p);
    if (!isToken(t)) return { value: undefined, chain, error: `unresolved alias {${p}}` };
    v = valueFor(t, mode);
  }
  if (isAlias(v)) return { value: undefined, chain, error: 'alias chain too deep' };
  return { value: v, chain, error: null };
}
function valueFor(token, mode) {
  const modes = token.$extensions?.ds?.modes;
  if (mode && modes) {
    if (mode in modes) return modes[mode];
    const [b, t] = mode.split('/');
    // density modes are keyed by density name only
    if (t === undefined && modes[b] !== undefined) return modes[b];
  }
  return token.$value;
}

/** Resolve every semantic + component token for one colour mode and one density mode into {name: literal}. */
export function resolveAll(file, colorMode, densityMode) {
  const out = {};
  for (const e of flatten(file)) {
    if (e.layer === 'primitive') continue;
    const vb = e.token.$extensions?.ds?.varies_by || [];
    const mode = vb.includes('density') ? densityMode : colorMode;
    const r = resolveToken(file, e.token, mode);
    out[e.name] = r.value;
  }
  return out;
}

export function cssValue(token, value) {
  const t = token.$type;
  if (value == null) return null;
  if (t === 'dimension') return typeof value === 'number' ? `${value}px` : String(value);
  if (t === 'duration') return typeof value === 'number' ? `${value}ms` : String(value);
  if (t === 'cubicBezier') return Array.isArray(value) ? `cubic-bezier(${value.join(', ')})` : String(value);
  if (t === 'shadow') return shadowCss(value);
  if (t === 'fontFamily') return Array.isArray(value) ? value.map((f) => (/[\s"]/.test(f) && !f.startsWith('"') && !/^[a-z-]+$/.test(f) ? `"${f}"` : f)).join(', ') : String(value);
  return String(value);
}
export function shadowCss(v) {
  if (v === 'none' || v == null) return 'none';
  const layers = Array.isArray(v) ? v : [v];
  return layers.map((l) => `${l.inset ? 'inset ' : ''}${l.offsetX}px ${l.offsetY}px ${l.blur}px ${l.spread || 0}px ${l.color}`).join(', ');
}
