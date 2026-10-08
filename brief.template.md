# Project Brief: formulir untuk Universal Design System Generator

> **Skema brief 1.5** · untuk engine **≥ 1.8.0**. Brief 1.0 sampai 1.4 tetap diterima dan dimigrasikan otomatis (§2.7 prompt).
> **Bentuk mesin:** di Phase 0 generator menulis isi brief ini sebagai `brief.normalized.json` (skema `schemas/brief.normalized.schema.json`, contoh di `fixtures/*/brief.normalized.json`). Semua alat engine membaca file itu. Bila kamu menjalankan alat sendiri, kamu boleh langsung mengisi JSON tersebut.
> Isi semua bagian. Tingkat kepentingan: **[WAJIB]** bila kosong generator bertanya (maks 3 pertanyaan), **[PENTING]** bila kosong diturunkan dan dicatat sebagai asumsi `A-nn`, **[OPSIONAL]** boleh dikosongkan.
> Setelah diisi, tempel seluruh isi file ini ke blok `<project_brief>` di akhir `core.prompt.md`.
> Jangan menulis fakta yang tidak kamu ketahui: lebih baik dikosongkan (akan menjadi asumsi tercatat) daripada ditebak.
> **Satu fakta, satu tempat.** Tema default per surface hanya di B3; warna merek operatif hanya di B6 `brands`.

---

## B0. Jalannya generator

```yaml
brief_schema_version: "1.5"   # [PENTING] kosong = dianggap 1.0 dan dimigrasikan
delivery_tier_target: T2      # [OPSIONAL] T0 fondasi | T1 inti (semua tingkat R) | T2 lengkap | T3 ekosistem (§16.5)
run_mode: greenfield          # [PENTING] greenfield | regenerate | brownfield | tenant-add (§2.6 prompt)
                              #   greenfield  = belum ada design system
                              #   regenerate  = paket hasil engine sudah ada; brief/bahasa/engine berubah
                              #   brownfield  = produk sudah berjalan dengan token/CSS/komponen sendiri
                              #   tenant-add  = menambah satu brand/tenant ke paket yang sudah ada
existing_package:             # [WAJIB bila regenerate atau tenant-add] path folder atau zip paket lama
brownfield_sources:           # [WAJIB bila brownfield] minimal satu
  - kind:                     # tokens | css | component-code | design-file-export | style-guide | screenshots
    path:
    notes:                    # mis. "hanya modul admin", "versi produksi per Agustus"
```

## B1. Identitas

```yaml
product_name:            # [WAJIB]
version_label:           # [PENTING] dipakai untuk nama paket, mis. v1, PROJ-01
namespace:               # [PENTING] prefix kode: window.<NS>, paket native, mis. APP
organization:            # [OPSIONAL]
domain_summary: >        # [WAJIB] 2-4 kalimat: produk untuk siapa, menyelesaikan apa, di konteks apa
brand_assets: none       # [PENTING] none | {logo: ..., fonts: ..., guidelines_url: ...}
                         # none = tidak ada logo yang dibuat; wordmark = nama produk dalam tipe heading
                         # warna merek TIDAK ditulis di sini, tetapi di B6 brands
doc_language:            # [WAJIB] satu bahasa untuk seluruh dokumen dan chrome situs, mis. English / Indonesia
report_language: Indonesia  # [PENTING] bahasa laporan fase dan laporan akhir generator
ui_locales:              # [PENTING] bahasa isi UI + default, mis. "id-ID default, en-US lengkap"
                         # locale beraksara RTL (ar, he, fa, ur, ...) otomatis mengaktifkan aturan RTL (§12.4)
formats:                 # [PENTING] contoh persis format yang dipakai produk
  currency:              # mis. "Rp1.150.000"
  time:                  # mis. "06:40"
  timezone:              # mis. "WIB (UTC+7), ditampilkan bila lintas zona"
  date:                  # mis. "3 Okt 2026"
  first_day_of_week:     # mis. Senin
  number:                # mis. "1.234,5"
  phone:                 # mis. "+62 812-3456-7890"
  other:                 # jarak, satuan, dsb.
regional_notes:          # [OPSIONAL] mis. aturan zona waktu, regulasi bahasa
glossary_seed:           # [OPSIONAL] istilah yang wajib dipakai; generator melengkapi sisanya (§12.5)
  - term_id:             # mis. order.cancel
    labels: {}           # per locale, mis. {id-ID: "Batalkan pesanan", en-US: "Cancel order"}
    avoid: []            # sinonim yang tidak boleh dipakai, mis. ["Hapus pesanan"]
```

## B2. Pengguna dan role  `[PENTING]`

```yaml
permission_model: server-authoritative     # server-authoritative | lainnya (jelaskan)
roles:
  - name:                # mis. Admin
    goals:               # apa yang ingin diselesaikan
    surfaces: []         # nama surface dari B3 yang dipakai
    permission_notes:    # hal yang disembunyikan, diblokir, atau butuh otorisasi tambahan
  - name:
    goals:
    surfaces: []
    permission_notes:
external_users:          # [OPSIONAL] pihak tanpa akun yang melihat sebagian data (pelanggan lewat tautan, dsb.)
  - name:
    access_via:          # mis. tautan bertoken
    sees:
```

## B3. Surface  `[WAJIB: minimal satu]`

Satu baris per surface (portal web, aplikasi mobile, kios, tablet, halaman publik, dsb.). Kolom ini satu-satunya sumber tema default per surface.

| name | device | os_runtime | min_version | input_modality | surface_type | orientation | default_theme | density_modes | connectivity | distribution | notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| | desktop / ponsel / tablet / kios | web / Android / iOS / ... | mis. "Android 10+", "Chrome & Safari 2 versi terakhir" | pointer, touch, keyboard, scanner, **glove**, **in-motion** | operational / consumer / content / public | portrait / landscape / both / fixed (+alasan) | Light / Dark / ... | compact / comfortable / spacious (yang pertama = default) | online / offline-first | publik / MDM / internal | |

- `input_modality` boleh beberapa nilai. Surface yang memuat `touch`, `glove`, atau `in-motion` memakai aturan sentuh (≥ 44×44) **di semua lebar layar**; `glove` atau `in-motion` menaikkan area klik menjadi 48×48.
- `surface_type: operational` mengaktifkan aturan decision-first (I9, §13.3 prompt). `consumer`, `content`, dan `public` membaca I9 sebagai hierarki informasi.
- `density_modes`: `compact` (engine 1.9.1, STD-2c) = layar padat. Teks isi 14, caption 12, H1 22, kontrol 24/32/40, header 56, sel tabel dan status lebih rapat. Di layar sentuh, input tetap ≥ 16 (iOS zoom), dan tinggi kontrol serta area klik kembali ke ukuran sentuh. Pilih hanya bila pengguna memang butuh kepadatan data (back-office, tabel besar).
- `min_version` kosong = usulan generator, dicatat `A-nn`.
- Kunci orientasi hanya untuk perangkat yang secara fisik terpasang tetap.

## B4. Target implementasi  `[WAJIB: primary_web_reference]`

```yaml
primary_web_reference:   # [WAJIB] react | vue | svelte | angular | web-components | html-first | lainnya
                         # html-first = HTML semantik + CSS + JS opsional; journey inti jalan tanpa JavaScript (§6.4)
production_targets: []   # mis. [flutter, swiftui, compose, nextjs]; kosong = hanya web reference
foundation_libraries: [] # mis. [shadcn_ui, radix, material]; kosong = none (keputusan dicatat sebagai ADR)
adapters: []             # [OPSIONAL] A01-antd-v6 | A02-mui-v7 | A03-shadcn-tailwind4 | A04-flutter-material3 (folder adapters/); build.mjs membangkitkan file tema library
offline_required_surfaces: []   # nama surface dari B3 yang harus jalan offline
font_delivery: bundled   # bundled (default, tanpa CDN) | cdn (tidak boleh bila ada surface offline)
browser_support:         # [OPSIONAL] mis. "Chrome, Edge, Safari, Firefox: 2 versi mayor terakhir"
design_tool: none        # [OPSIONAL] none | figma | penpot | lainnya (§14A)
design_tool_limits:      # [OPSIONAL] mis. {max_modes: 4}; batas paket alat desain yang kamu pakai
design_tool_export:      # [OPSIONAL] path ekspor variabel dari alat desain, untuk cek drift
package_registry:        # [OPSIONAL] mis. "npm privat @org", "GitHub Packages", "pub privat"; kosong = tidak dipublikasikan
ci_platform:             # [OPSIONAL] github-actions | gitlab-ci | bitbucket | lainnya | none
```

## B5. Domain  `[PENTING]`

```yaml
entities:                # satu item per entitas yang punya state
  - name:                # mis. Order
    states: []           # urutan state bila diketahui; kosong = diturunkan dan dicatat A-nn
    owner_roles: []      # role yang bertanggung jawab memindahkan state
    stagnation_threshold:   # mis. "status Menunggu > 2 jam"; kosong = tanpa overlay stagnasi
                            # ini kebijakan organisasi: jangan diisi tebakan
journeys:
  - id:                  # id internal brief, bebas, mis. J1
    name:
    steps: []            # urutan langkah singkat
    failure_path:        # langkah paling berisiko dan apa yang terjadi bila gagal
critical_events:         # [OPSIONAL] memerlukan perlakuan khusus (I5)
  - name:
    severity:            # safety | financial | legal
    required_behaviors:  # mis. layar penuh, suara, getar, aksi penutup eksplisit, tidak dibatasi izin
    sound_asset:         # [OPSIONAL] path file suara; kosong = bunyi sistem (generator tidak membuat audio)
spatial_or_geo_needs:    # [OPSIONAL] peta, denah, diagram spasial (memicu token geografi domain)
data_viz_needs:          # [OPSIONAL] jenis chart yang dibutuhkan (tren, heatmap, perbandingan, dsb.)
```

## B6. Bahasa desain  `[WAJIB]`

```yaml
language_mode: archetype        # archetype | derive | custom | inherit
archetype:                      # bila archetype: ink-graphite | brand-led-tonal | soft-friendly
                                #                 | editorial-contrast | dense-console | quiet-luxury
                                #                 | playful-vivid | immersive-glass | neo-brutalist
visual_profile: engine          # [engine 1.9.0] engine | antd-v6 | shadcn. Tampilan pustaka yang dituju: token, anatomi
                                # komponen, ikon, dan template halaman mengikuti Ant Design v6 atau shadcn/ui. Baseline tetap
                                # menang (teks isi >= 16, target sentuh). Tidak bisa digabung dengan language_mode: inherit.
personality:                    # bila derive: skala 1-5
  formality:                    # 1 santai ... 5 formal
  warmth:                       # 1 dingin ... 5 hangat
  expressiveness:               # 1 tenang ... 5 ekspresif
  density:                      # 1 lega ... 5 padat
  risk_criticality:             # 1 rendah ... 5 sangat berisiko (salah klik berdampak besar)
inherits_from:                  # bila inherit: design-language.json lapis org yang sudah disetujui
  path:
  version:                      # semver lapis org, mis. 2.1.0
brands:                         # [PENTING bila ada merek] entri pertama = default; >1 entri = multi-brand / tenant (§4.8)
  - id: default                 # kebab-case, dipakai sebagai [data-brand="..."]
    name:
    interaction_hex:            # warna merek/aksen utama; kosong = seed archetype (dicatat A-nn)
    accent_hexes: []
    neutral_temperature:        # warm | cool | neutral; kosong = default archetype
    wordmark:                   # teks wordmark bila tanpa logo
    logo:                       # path file, atau kosong
    ui_family:                  # [OPSIONAL] hanya bila lisensinya tersedia untuk di-bundle
type_preferences:               # [OPSIONAL] berlaku untuk semua brand
  ui_family:
  display_family:
  mono_family:
  license_constraint:           # mis. hanya lisensi terbuka
themes:                         # [PENTING] minimal Light
  - name: Light
    purpose:
    base:                       # [WAJIB untuk nama tema selain Light/Dark/High-contrast/Outdoor] light | dark | hc-light | hc-dark
  # - name: Dark / High-contrast / Outdoor / lainnya (tulis aturan penurunannya di purpose)
language_overrides: []          # override per keputusan L1-L17: {decision: L7, value: ..., reason: ...}
                                # bentuk mesin (engine 1.8.0): {decision: L6, path: radius.control, value: 6, reason: ...}
                                # path mengikuti struktur catalog/archetypes.json
                                # inherit: maks 2 keputusan di L2-L12 dan L14-L17
                                # L14 platform · L15 material · L16 umpan balik (state, haptic, suara) · L17 layout
likes: []                       # referensi produk atau gaya yang disukai
dislikes: []
must_not_look_like: []          # veto archetype atau gaya
```

- `custom`: tulis keputusan L1-L17 sebanyak yang kamu tahu di `language_overrides`; sisanya diturunkan dari archetype terdekat dan ditandai `derived`.
- `tenant-add`: tambahkan satu entri di `brands`; jangan mengubah entri lama.

## B7. Lingkup komponen dan pattern  `[PENTING]`

```yaml
core_exclusions:                # komponen inti (tingkat S atau O) yang tidak berlaku, dengan alasan
  - component:
    reason:
domain_components:              # kosong = ditemukan otomatis lewat prosedur §6.2
  - name:                       # PascalCase
    group:
    purpose:
    contract_notes:             # perilaku, state, data khas yang diketahui
pattern_exclusions:             # pattern tingkat S atau O (§11.2) yang tidak berlaku, dengan alasan
  - pattern:
    reason:
domain_patterns:                # pola khas domain yang hanya komposisi komponen; kosong = ditemukan otomatis
  - name:                       # PascalCase
    purpose:
    steps: []
component_packs: []             # [OPSIONAL] mis. [P04-b2g-public-service]; daftar pack ada di README
include: []                     # [OPSIONAL] komponen tingkat O yang disertakan: {component: Slider, reason: ...}
pattern_include: []             # [OPSIONAL] pattern tingkat O: {pattern: Wizard, reason: ...}
pack_config: {}                 # [OPSIONAL] konfigurasi per pack, mis.:
                                # P04:
                                #   operator_type: regional_government   # government | regional_government | soe | vendor_on_behalf
                                #   official_domain: go.id
                                #   service_phase: beta                  # alpha | beta | live
                                #   sensitive_service: false
                                #   assisted_channels: [{channel: "Loket layanan", detail: "..."}]
                                #   fees: none                           # none | fixed | variable
                                #   session_timeout:                     # kebijakan; jangan ditebak
                                #   save_retention:
                                #   regulations: []
non_goals: []                   # apa yang sengaja tidak dicakup sistem ini
```

## B8. Batasan  `[OPSIONAL]`

```yaml
extra_a11y: []                  # hanya boleh memperketat baseline (teks isi >= 16, kontras >= 4.5:1, target >= 44x44)
legal_regulatory: []            # persyaratan hukum/regulasi yang diberikan pemilik produk
performance_budgets: []         # mis. [{item: "Paket komponen web", limit: "100 KB gzip", reason: ...}]
                                # default di §14C prompt; pelonggaran wajib alasan (ADR)
tooling_constraints: []         # mis. tanpa jaringan saat build, versi Node, dsb.
```

## B9. Rujukan eksternal yang boleh disebut  `[OPSIONAL]`

Hanya ID di sini yang boleh disebut generator. Selebihnya generator memakai penunjuk generik dan mencatatnya sebagai asumsi.

```yaml
allowed_references:
  - id:                         # mis. F1, ADR-3, SCREEN-A
    title:
    contains:                   # satu kalimat: apa isinya
```

## B10. Override dan kebersihan  `[OPSIONAL]`

```yaml
overrides: []                   # hanya memperketat baseline; tiap item: {rule: STD-2, value: 18, reason: ...}
leak_terms: []                  # istilah dari proyek/contoh lain yang TIDAK boleh muncul di keluaran
                                # (wajib diisi bila brief ini disalin dari contoh proyek lain)
```

## B11. Organisasi  `[OPSIONAL]`

Kosong = generator menulis usulan berlabel `A-nn` di dokumen kontribusi dan metrik adopsi (§15B, §15C).

```yaml
governance_model:        # centralized | federated | hybrid
maintainers: []          # nama tim atau peran
reviewers: {}            # mis. {accessibility: "...", design: "...", engineering: "..."}
consumer_products:       # produk yang memakai sistem ini (untuk metrik adopsi)
  - name:
    repo_path:           # path lokal atau repo yang bisa dibaca generator
support_channels: []     # mis. kanal chat, jam konsultasi
release_cadence:         # mis. "minor tiap 2 minggu"
lts_policy:              # mis. "major sebelumnya didukung 6 bulan"
adoption_targets: {}     # mis. {component_coverage: "80%", version_lag_max: "1 minor"}
```
