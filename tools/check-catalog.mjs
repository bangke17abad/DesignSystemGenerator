#!/usr/bin/env node
// Validates the engine's canonical component catalog (catalog/components/*.json):
// schema, file name = name, tier/group = M03 §6.1, token names exist in catalog/token-names.json, API conventions §6.8,
// cross references (related/depends_on) point at catalog components. Exit 1 on any failure.
// Usage: node tools/check-catalog.mjs [Name ...]
import { readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validate } from './lib/schema.mjs';
import { readJson } from './lib/tokens.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const CORE = {
  Layout: { R: ['Stack', 'Inline', 'Grid', 'Container', 'Divider', 'AppShell', 'PageHeader'], S: [], O: [] },
  Accessibility: { R: ['SkipLink', 'VisuallyHidden', 'LiveAnnouncer'], S: [], O: [] },
  Actions: { R: ['Button', 'Link'], S: ['IconButton', 'Menu'], O: ['CommandPalette', 'CopyButton'] },
  Inputs: { R: ['TextField', 'TextArea', 'Select', 'Checkbox', 'RadioGroup', 'Switch', 'Form', 'ErrorSummary'], S: ['DatePicker', 'FilterChip', 'Combobox', 'SearchField', 'NumberInput', 'PasswordInput', 'FormattedInput'], O: ['FileDropzone', 'PinInput', 'TimePicker', 'DateRangePicker', 'Slider'] },
  Navigation: { R: ['PrimaryNav', 'Tabs'], S: ['BottomNav', 'SegmentedControl', 'Breadcrumb', 'Pagination', 'Stepper'], O: [] },
  Feedback: { R: ['StatusLabel', 'Badge', 'InlineAlert', 'Toast', 'Skeleton', 'EmptyState'], S: ['ProgressBar', 'ConnectionStatus', 'NotificationItem', 'Spinner', 'Banner'], O: ['CountdownTimer'] },
  'Data display': { R: ['Table', 'List', 'Tooltip'], S: ['Card', 'InlineMetrics', 'Avatar', 'Tag', 'DescriptionList', 'Accordion', 'Image'], O: ['Timeline', 'Chart', 'Kbd', 'Tree'] },
  Overlays: { R: ['Modal'], S: ['Sheet', 'ContextPanel', 'Popover'], O: ['StepUpDialog'] },
};
export const CORE_INDEX = Object.fromEntries(Object.entries(CORE).flatMap(([g, t]) => Object.entries(t).flatMap(([tier, names]) => names.map((n) => [n, { group: g, tier }]))));
const STD_PROP_ALIASES = { onChange: 'onValueChange', onSelect: 'onSelectedChange', onToggle: 'onOpenChange', onClick: 'onPress', small: 'size', compact: 'size' };

export function checkCatalog(only) {
  const schema = readJson(join(root, 'schemas', 'catalog-component.schema.json'));
  const names = new Set(readJson(join(root, 'catalog', 'token-names.json')).always);
  const wcag = new Set(readJson(join(root, 'catalog', 'wcag22.seed.json')).criteria.map((c) => c.sc));
  const files = readdirSync(join(root, 'catalog', 'components')).filter((f) => f.endsWith('.json')).sort();
  const all = new Set([...Object.keys(CORE_INDEX)]);
  const results = {};
  for (const f of files) {
    const rec = readJson(join(root, 'catalog', 'components', f));
    if (only?.length && !only.includes(rec.name)) continue;
    const errs = validate(schema, rec).map((e) => `schema ${e}`);
    if (`${rec.name}.json` !== f) errs.push(`file name ${f} != name ${rec.name}`);
    const core = CORE_INDEX[rec.name];
    if (!core) errs.push(`${rec.name} is not in the M03 §6.1 catalogue`);
    else {
      if (core.group !== rec.group) errs.push(`group ${rec.group} != ${core.group}`);
      if (core.tier !== rec.tier) errs.push(`tier ${rec.tier} != ${core.tier}`);
    }
    const toks = [
      ...(rec.anatomy || []).flatMap((a) => a.tokens || []),
      ...(rec.states || []).flatMap((s) => Object.values(s.token_swaps || {})),
      ...(Array.isArray(rec.sizes) ? rec.sizes.map((s) => s.size_token) : []),
    ];
    for (const t of new Set(toks)) if (!names.has(t)) errs.push(`unknown token "${t}" (catalog/token-names.json → always)`);
    for (const p of rec.api?.props || []) if (STD_PROP_ALIASES[p.name]) errs.push(`prop "${p.name}" violates §6.8 (use ${STD_PROP_ALIASES[p.name]})`);
    for (const e of rec.api?.events || []) if (STD_PROP_ALIASES[e.name]) errs.push(`event "${e.name}" violates §6.8 (use ${STD_PROP_ALIASES[e.name]})`);
    const sizeProp = (rec.api?.props || []).find((p) => p.name === 'size');
    if (sizeProp && !/"sm"/.test(sizeProp.type)) errs.push('size prop must be "sm" | "md" | "lg" (§6.8)');
    for (const r of [...(rec.related || []), ...(rec.depends_on || [])]) if (!all.has(r)) errs.push(`related/depends_on "${r}" is not a catalogue component`);
    if (rec.content?.rules?.some((r) => /lorem|TBD|\.\.\.$/i.test(r))) errs.push('placeholder text in content (DoD-11)');
    for (const sc of rec.accessibility?.wcag || []) if (!wcag.has(sc)) errs.push(`wcag ${sc} is not one of the 55 WCAG 2.2 A/AA criteria (catalog/wcag22.seed.json)`);
    for (const d of rec.dont || []) if (d.ref && !/^(UB\d{1,2}|I[1-9]|STD-[1-4]|SC \d\.\d\.\d{1,2}|LB-\d{2}|§\d+(\.\d+)*|VB\d{1,2}|V\d{1,2}|P\d{2}-[A-Z0-9-]+)$/.test(d.ref)) errs.push(`dont.ref "${d.ref}" is not a rule id (UBn, In, STD-n, SC x.y.z, LB-nn, §x.y, VBn)`);
    const statusProp = (rec.api?.props || []).find((p) => p.name === 'status');
    if (statusProp) {
      for (const st of ['critical', 'warning', 'positive', 'info', 'neutral-negative']) if (!statusProp.type.includes(`"${st}"`)) errs.push(`status prop must accept "${st}" (§6.4)`);
      if (/"(success|error|danger|default)"/.test(statusProp.type)) errs.push('status prop accepts only the five semantic values (§6.4)');
      const swaps = JSON.stringify(rec.states || []);
      for (const st of ['critical', 'warning', 'positive', 'info', 'neutral-negative']) if (!swaps.includes(`color-semantic-${st}`) && !swaps.includes(`color-semantic-on-${st}`) && !statusProp.description.includes(st)) errs.push(`status component must show token swaps for ${st} or state in the status prop description why it is not used`);
    }
    results[rec.name] = errs;
  }
  return results;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const only = process.argv.slice(2);
  const res = checkCatalog(only);
  const missing = only.length ? only.filter((n) => !(n in res)) : Object.keys(CORE_INDEX).filter((n) => !(n in res));
  let bad = 0;
  for (const [n, errs] of Object.entries(res)) { if (errs.length) { bad++; console.log(`FAIL ${n}\n  - ${errs.slice(0, 15).join('\n  - ')}`); } }
  console.log(`catalog: ${Object.keys(res).length - bad}/${Object.keys(res).length} records pass; ${missing.length} of ${only.length || Object.keys(CORE_INDEX).length} expected records missing${missing.length ? ': ' + missing.join(', ') : ''}`);
  process.exit(bad ? 1 : 0);
}
