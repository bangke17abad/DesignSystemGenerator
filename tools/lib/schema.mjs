// Minimal JSON Schema (2020-12 subset) validator used by V14. Zero dependencies.
// Supports: $ref (#/$defs/...), type, enum, const, properties, required, additionalProperties, items, prefixItems,
// minItems, maxItems, uniqueItems, minLength, pattern, minimum, maximum, oneOf, anyOf, allOf, not, propertyNames.
export function validate(schema, data, { root = schema, path = '$', errors = [], max = 200 } = {}) {
  const err = (msg) => { if (errors.length < max) errors.push(`${path}: ${msg}`); };
  if (schema === true) return errors;
  if (schema === false) { err('not allowed'); return errors; }
  if (schema.$ref) {
    const target = schema.$ref.replace(/^#\//, '').split('/').reduce((n, k) => n?.[k], root);
    if (!target) { err(`unresolved $ref ${schema.$ref}`); return errors; }
    validate(target, data, { root, path, errors, max });
  }
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => typeOk(t, data))) { err(`expected ${types.join('|')}, got ${typeOf(data)}`); return errors; }
  }
  if ('const' in schema && JSON.stringify(schema.const) !== JSON.stringify(data)) err(`must equal ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(data))) err(`must be one of ${schema.enum.map((e) => JSON.stringify(e)).join(', ')} (got ${JSON.stringify(data)})`);
  if (typeof data === 'string') {
    if (schema.minLength != null && data.length < schema.minLength) err(`shorter than ${schema.minLength}`);
    if (schema.pattern && !new RegExp(schema.pattern, 'u').test(data)) err(`does not match /${schema.pattern}/`);
  }
  if (typeof data === 'number') {
    if (schema.minimum != null && data < schema.minimum) err(`< ${schema.minimum}`);
    if (schema.maximum != null && data > schema.maximum) err(`> ${schema.maximum}`);
  }
  if (Array.isArray(data)) {
    if (schema.minItems != null && data.length < schema.minItems) err(`fewer than ${schema.minItems} items`);
    if (schema.maxItems != null && data.length > schema.maxItems) err(`more than ${schema.maxItems} items`);
    if (schema.uniqueItems && new Set(data.map((d) => JSON.stringify(d))).size !== data.length) err('items not unique');
    const pre = schema.prefixItems || [];
    data.forEach((d, i) => {
      const s = i < pre.length ? pre[i] : schema.items;
      if (s !== undefined) validate(s, d, { root, path: `${path}[${i}]`, errors, max });
    });
  }
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    for (const r of schema.required || []) if (!(r in data)) err(`missing required "${r}"`);
    const props = schema.properties || {};
    for (const [k, v] of Object.entries(data)) {
      if (schema.propertyNames) validate(schema.propertyNames, k, { root, path: `${path}{${k}}`, errors, max });
      if (k in props) validate(props[k], v, { root, path: `${path}.${k}`, errors, max });
      else if (schema.additionalProperties === false) err(`unexpected field "${k}" (R16)`);
      else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') validate(schema.additionalProperties, v, { root, path: `${path}.${k}`, errors, max });
    }
  }
  if (schema.allOf) for (const s of schema.allOf) validate(s, data, { root, path, errors, max });
  if (schema.anyOf && !schema.anyOf.some((s) => validate(s, data, { root, path, errors: [], max }).length === 0)) {
    const sub = schema.anyOf.map((s) => validate(s, data, { root, path, errors: [], max: 3 }));
    err(`matches none of anyOf (${sub.map((e) => e[0]).filter(Boolean).slice(0, 2).join(' / ')})`);
  }
  if (schema.oneOf) {
    const n = schema.oneOf.filter((s) => validate(s, data, { root, path, errors: [], max }).length === 0).length;
    if (n !== 1) err(`must match exactly one of oneOf (matched ${n})`);
  }
  if (schema.not && validate(schema.not, data, { root, path, errors: [], max }).length === 0) err('must not match "not" schema');
  return errors;
}
function typeOf(d) { return d === null ? 'null' : Array.isArray(d) ? 'array' : Number.isInteger(d) ? 'integer' : typeof d; }
function typeOk(t, d) {
  if (t === 'integer') return Number.isInteger(d);
  if (t === 'number') return typeof d === 'number' && Number.isFinite(d);
  if (t === 'array') return Array.isArray(d);
  if (t === 'object') return d !== null && typeof d === 'object' && !Array.isArray(d);
  if (t === 'null') return d === null;
  return typeof d === t;
}
