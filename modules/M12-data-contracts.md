<!-- ds-module id="M12" name="data-contracts" engine="1.9.1" sections="§16A" -->
# Modul M12 · Kontrak data

> Bagian dari Universal Design System Generator, engine `1.9.1`. Berisi §16A. Dimuat di fase: 0, dan setiap kali skema di `schemas/` belum ada. Core menang bila bertentangan; modul ini hanya merinci.

---

# 16A. KONTRAK DATA (tipe normatif) `[ENGINE]`

Tipe di bawah normatif: nama field persis, field opsional ditandai `?`, tidak ada field lain (R16). Engine 1.8.0 menyediakan JSON Schema 2020-12 yang sudah jadi di `schemas/*.schema.json` (dibangkitkan `tools/dev/gen-schemas.mjs`); Phase 0 menyalinnya ke paket, tidak menurunkannya ulang. V14 memvalidasi setiap file JSON terhadapnya. Format token mengikuti struktur W3C Design Tokens Community Group (`$value`, `$type`, `$description`, `$extensions`); versi spesifikasi DTCG yang dirujuk dicatat di `$metadata` dengan label "Not verified against the pinned version" sampai dicocokkan (R4).

```ts
type Source = "baseline" | "invariant" | "archetype" | "brief" | "derived" | "org" | "adr";
type Status = "Draft" | "Reviewed" | "Stable";
type AttentionClass = "C1" | "C2" | "C3" | "C4" | "C5" | "C6";
type Locale = string;                      // dari B1 ui_locales, mis. "id-ID"

// manifest.json
interface Manifest {
  engine_version: string;                  // "1.8.0"
  brief_schema_version: string;            // "1.4"
  brief_sha256: string;                    // isi <project_brief>, whitespace dinormalkan
  run_mode: "greenfield" | "regenerate" | "brownfield" | "tenant-add";
  package_version: string;                 // semver paket keluaran
  delivery_tier?: "T0" | "T1" | "T2" | "T3";  // target tier (§16.5); engine 1.8.0
  version_label: string; namespace: string; doc_language: string; report_language: string;
  language: { mode: "archetype" | "derive" | "custom" | "inherit"; archetype?: string;
              org_language?: { path: string; version: string } };
  axes: { theme: string[]; brand: string[]; density: string[] };   // indeks 0 = default
  surfaces: { name: string; surface_type: "operational" | "consumer" | "content" | "public";
              default_theme: string; default_density: string; modalities: string[] }[];
  targets: { reference: string; production: string[] };
  components: { name: string; tier: "R" | "S" | "O" | "domain" | "pack"; pack?: string; group: string; status: Status;
                page: string; preview: string; target_files: Record<string, string>;
                assumptions: string[] }[];
  patterns: { name: string; tier: "R" | "S" | "O" | "domain" | "pack"; pack?: string; status: Status; page: string; preview: string }[];
  core_exclusions: { component: string; reason: string }[];
  pattern_exclusions: { pattern: string; reason: string }[];
  packs: { id: string; name: string; version: string; config: object }[];
  packages: { target: string; name: string; version: string; path: string; registry: string | null }[];
  budgets: { item: string; limit_kb: number; measured_kb: number | null; source: "engine" | "brief" | "adr" }[];
  support_matrix: { platform: string; min: string; source: "brief" | "assumption" }[];
  documents: { id: "05"|"10"|"20"|"30"|"40"|"50"|"60"|"70"|"80"|"85"|"90"|"95"; path: string; status: Status }[];
  generated: string[];                     // file yang di-generate; tidak diedit tangan
  manual_zones: { file: string; id: string }[];
}

// assets/tokens.json
interface TokenFile {
  $metadata: { engine_version: string; package_version: string; dtcg_reference: string;
               axes: Manifest["axes"] };
  primitive: TokenGroup;                   // tidak pernah dirujuk komponen (I3)
  semantic: TokenGroup;
  component: TokenGroup;
}
interface TokenGroup { [name: string]: TokenGroup | Token }
interface Token {
  $type: "color" | "dimension" | "duration" | "cubicBezier" | "fontFamily" | "fontWeight"
       | "number" | "shadow" | "strokeStyle"
       | "string";                         // ekstensi engine untuk haptic, suara, transform; bukan tipe DTCG
  $value: string | number | object;        // nilai mode default; alias "{semantic.x.y}" hanya di file ini
  $description?: string;
  $extensions: { ds: {
    role: string;                          // satu peran (I3)
    text_class?: "body" | "supporting";    // wajib untuk token type-* (§3A.2)
    runtime?: boolean;                     // true = nilai berubah saat runtime (target-current), engine 1.8.0
    varies_by: ("theme" | "brand" | "density")[];   // kosong = sama di semua mode (§5.9)
    modes?: Record<string, string | number | object>; // kunci "<brand>/<theme>" atau "<density>"
    source: Source; trace: string;         // mis. "L6", "STD-4", "I3"
    derivation?: { seed: string; ramp_step?: number; contrast?: Record<string, number> };
    deprecated?: { since: string; replaced_by: string | null; remove_in: string };
  } };
}

// assets/design-language.json
type DecisionId = "L1"|"L2"|"L3"|"L4"|"L5"|"L6"|"L7"|"L8"|"L9"|"L10"|"L11"|"L12"|"L13"|"L14"|"L15"|"L16"|"L17";
interface DesignLanguage {
  engine_version: string; mode: Manifest["language"]["mode"]; archetype?: string;
  org_language?: { path: string; version: string };
  scores?: Record<string, number>; vetoes?: { archetype: string; reason: string }[];
  decisions: Record<DecisionId, { value: object; rationale: string; source: Source;
                                  testable_consequence: string[];
                                  overrides?: { from: unknown; to: unknown; reason: string; source: Source }[] }>;
  baseline_adjustments: { decision: DecisionId; from: unknown; to: unknown; rule: "STD-1"|"STD-2"|"STD-3"|"STD-4" }[];
  adr: string[];
  manual_notes?: string;
}

// assets/components.json — satu entri per komponen; urutan seksi = §6.3
type NA = { not_applicable: string };      // satu kalimat alasan
interface ComponentRecord {
  name: string; tier: "R" | "S" | "O" | "domain" | "pack"; pack?: string; group: string; status: Status;
  purpose: { purpose: string; when_not_to_use: string[] };
  anatomy: { part: string; tokens: string[] }[];
  variants: { name: string; description: string }[] | NA;
  sizes: { name: string; visual_px: number; hit_pointer_px: number; hit_touch_px: number;
           hit_extended_px?: number; per_device: Record<string, string> }[] | NA;
  states: { name: string; token_swaps: Record<string, string> }[];
  state_combinations: { base: "default" | "selected" | "error";
                        interaction: "rest" | "hover" | "pressed" | "dragged";
                        focus: boolean; availability: "enabled" | "disabled" | "loading" | "read-only";
                        supported: boolean; tokens: Record<string, string> }[];   // §6.9
  behaviour: { input: "keyboard" | "pointer" | "touch"; trigger: string; result: string }[];
  accessibility: { role: string; attributes: string[]; politeness?: "polite" | "assertive";
                   focus_order: string; sr_label: string; wcag: string[] };
  content: Record<Locale, { rules: string[]; examples: string[] }>;
  roles: { role: string; pattern: "hidden" | "disabled-with-reason" | "step-up" | "read-only" | "full";
           note: string }[] | NA;
  responsive: { device_class: string; behaviour: string }[];
  semantic_mapping: { state: string; class: AttentionClass; token: string; icon: string;
                      treatment: "quiet" | "outline" | "tinted" | "filled" }[] | NA;
  do: string[]; dont: { text: string; ref?: string }[];       // masing-masing ≥ 2
  edge_cases: { case: string; behaviour: string }[];
  token_usage: { part: string; token: string }[] | NA;   // NA untuk komponen tanpa visual (engine 1.8.0)
  api: { props: { name: string; type: string; default?: string; required: boolean; description: string }[];
         events: { name: string; payload: string; when: string }[];
         parts: string[] };                // §6.8
  rtl: { mirrored_icons: string[]; notes: string } | NA;
  target_mapping: Record<string, { widget: string; path: string; props: string[]; state_strategy: string }>;
  preview: { path: string; variants: string[]; states: string[] };
  assumptions: string[]; manual_notes?: string;
}

// Engine 1.8.0: file JSON pembungkus. components.json = { components: ComponentRecord[] }, patterns.json = { patterns: PatternRecord[] }.
// ComponentRecord.state_combinations[].base juga menerima "mixed" | "open" | "current" | "complete";
// accessibility.politeness juga menerima "both" (LiveAnnouncer).

// brief.normalized.json — brief dalam bentuk mesin, ditulis di Phase 0 (schemas/brief.normalized.schema.json)
// verification.json — keluaran tools/validate.mjs (schemas/verification.schema.json)
// catalog/components/*.json, catalog/patterns/*.json — record kanonis engine (schemas/catalog-component, catalog-pattern)

// assets/patterns.json — satu entri per pattern; urutan seksi = §11.3
interface PatternRecord {
  name: string; tier: "R" | "S" | "O" | "domain" | "pack"; pack?: string; status: Status;
  problem: { problem: string; when: string[]; when_not: string[] };
  composition: { component: string; parts?: string[]; role_in_pattern: string }[];
  flow: { step: string; state_class: AttentionClass; transition: string }[];
  variants: { surface: string; device_class: string; behaviour: string }[] | NA;
  states: { empty: string; loading: string; error: string; partial: string; success: string };
  accessibility: { step: string; focus: string; announcement?: string }[];
  content: Record<Locale, string[]>;      // label dari glosarium
  roles: { role: string; pattern: "hidden" | "disabled-with-reason" | "step-up" | "read-only" | "full"; note: string }[] | NA;
  do: string[]; dont: { text: string; ref?: string }[];
  edge_cases: { case: string; behaviour: string }[];
  preview: { path: string }; journeys: string[]; assumptions: string[]; manual_notes?: string;
}

// assets/glossary.json
interface Glossary { terms: {
  id: string;                              // mis. "order.cancel"
  kind: "entity" | "state" | "role" | "action" | "ui";
  labels: Record<Locale, string>; definition: string; avoid: string[];
  source: "brief" | "glossary_seed" | "derived"; assumption?: string;
}[] }

// design-tool/variables.json — §14A
interface DesignToolVariables { tool: string; collections: {
  name: "primitive" | "color" | "brand" | "size" | "component";
  modes: string[]; hidden_from_publishing: boolean;
  variables: { name: string;              // jalur bergaris miring, mis. "color/structure/text/primary"
               token: string;             // nama token sumber
               type: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN";
               scopes: string[];          // nama scope alat desain: Not verified against the pinned version
               values: Record<string, string | number | boolean | { alias: string }> }[];
}[] }

// design-tool/component-properties.json — §14A
interface ComponentProperties { components: {
  name: string; design_tool_name: string;
  properties: { name: string; kind: "VARIANT" | "BOOLEAN" | "TEXT" | "INSTANCE_SWAP";
                values?: string[]; maps_to_prop: string | "state" }[];
}[] }

// assets/lifecycle.json
interface Lifecycle { entities: {
  name: string; source: "brief" | "derived"; assumption?: string;
  states: { name: string; class: AttentionClass; token: string; icon: string | null;
            treatment: "quiet" | "outline" | "tinted" | "filled";
            ui_text: Record<Locale, string>; visible_to: string[]; next_actions: string[] }[];
  stagnation?: { threshold: string; assumption?: string };   // overlay C2
  critical_events: { name: string; severity: "safety" | "financial" | "legal";
                     treatment: string[]; dismiss_action: string; sound: string; haptic: string }[];
}[] }

// assets/lint-rules.json
interface LintRules { rules: {
  id: string;                              // "UB1".."UB12" atau "LB-01".."LB-nn"
  statement: string; kind: "css-pattern" | "token-rule" | "manual-review";
  pattern?: string;                        // regex (css-pattern) atau ekspresi token (token-rule)
  question?: string;                       // wajib untuk manual-review
  applies_to: string[];                    // glob file atau nama komponen
  source: string; severity: "error" | "review";
}[] }

// assets/wcag22.json — tepat 55 entri
interface Wcag22 { version: "2.2"; criteria: {
  sc: string; name: string; level: "A" | "AA";
  status: "Applied" | "Applied · Not verified" | "N/A" | "Open decision";
  application: string; verified_by: string; assumption?: string;
}[] }

// reports/assumptions.json — assumptions-register.md dirender dari file ini
interface Assumptions { entries: {
  id: string;                              // "A-01"
  statement: string; reason: string; default_taken: string; confirm_by: string;
  status: "open" | "needs owner confirmation" | "confirmed" | "rejected";
  files: string[];
}[] }

// migration-map.json — regenerate dan brownfield
interface MigrationMap {
  from: { kind: "package" | "brownfield"; version?: string };
  to_version: string;
  tokens: { old: string; new: string | null;
            change: "added" | "renamed" | "value" | "deprecated" | "removed" | "keep" | "merge" | "drop" | "violation";
            rule?: string; note: string }[];
  components: { old: string; new: string | null; change: string; note: string }[];
  semver_bump: "major" | "minor" | "patch";  // dihitung dari §15.1
}
```
