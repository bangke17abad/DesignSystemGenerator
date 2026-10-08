# Golden Briefs: fixture regresi engine 1.7.0

> Lima belas brief **fiktif** dan minimal yang mencakup kesembilan archetype dan keempat pack. Tujuannya menguji engine, bukan menghasilkan produk. Setiap kali core atau modul engine diubah, jalankan kelimanya dan bandingkan keluaran dengan bagian **Hasil yang diharapkan**. Engine lolos regresi bila semua butir cocok dan validator yang relevan PASS.
>
> Cakupan: G1 `archetype` + modalitas `glove` + offline · G2 multi-brand + pemisahan hue · G3 `derive` + fallback seed · G4 `greenfield` lalu `regenerate` · G5 `brownfield` · G6 RTL + aksen merek non-teks · G7 translucency · G8 haptic dan perayaan · G9 blok merek + `tenant-add` · G10 `inherit` · G11 ekosistem (alat desain, paket, CI, organisasi) · G12 pack P04 layanan publik (dan varian P04 + P01) · G13 pack P01 operasi B2B · G14 pack P02 + P01 marketplace · G15 pack P03 + P02 komunitas kreatif.
>
> G1-G5 sengaja memakai skema brief 1.1 untuk menguji migrasi §2.7 (tanpa `A-nn` tambahan); G6-G10 memakai skema 1.2; G11 memakai skema 1.3; G12-G15 memakai skema 1.4.
>
> Nilai hue OKLCH di bawah dihitung dari hex dengan konversi sRGB → OKLab standar dan dibulatkan; toleransi perbandingan ±1°. Rasio kontras dihitung dengan rumus WCAG 2.x; toleransi ±0.01.
>
> Jalankan setiap fixture dalam mode modular (core memuat modul per fase) dan mode monolit (`tools/assemble.mjs`); hasil keduanya harus sama. Perbedaan berarti protokol pemuatan modul (§0) atau peta fase (§16.4) bocor.
>
> Field yang tidak ditulis sengaja dikosongkan: generator wajib mencatatnya sebagai `A-nn`, bukan mengarang.

---

## G1. Lumbung · `ink-graphite`

```yaml
# B0
brief_schema_version: "1.1"
run_mode: greenfield
# B1
product_name: Lumbung
version_label: LBG-01
namespace: LBG
domain_summary: >
  Sistem gudang untuk distributor sembako. Admin mengatur daftar ambil barang di web,
  picker mengambil barang dengan ponsel genggam bersarung tangan di area gudang yang sinyalnya putus-putus.
doc_language: Indonesia
report_language: Indonesia
ui_locales: "id-ID"
formats: {currency: "Rp1.150.000", time: "14:05", timezone: "WIB", date: "3 Okt 2026", number: "1.234,5"}
# B2
roles:
  - {name: Admin gudang, goals: "membuat dan membagi daftar ambil", surfaces: [web-admin]}
  - {name: Picker, goals: "mengambil barang sesuai daftar", surfaces: [handheld]}
# B4
primary_web_reference: react
production_targets: [flutter]
offline_required_surfaces: [handheld]
font_delivery: bundled
# B5
entities:
  - name: PickList
    states: [draft, assigned, picking, picked, cancelled, failed]
    owner_roles: [Admin gudang, Picker]
    stagnation_threshold: "assigned lebih dari 30 menit tanpa dimulai"
journeys:
  - {id: J1, name: Ambil barang, steps: [buka daftar, pindai rak, pindai barang, konfirmasi], failure_path: "barang tidak ada di rak"}
# B6
language_mode: archetype
archetype: ink-graphite
brands: [{id: default, name: Lumbung, neutral_temperature: cool}]
themes: [{name: Light, purpose: "kantor"}, {name: High-contrast, purpose: "gudang dengan cahaya tidak merata"}]
# B10
leak_terms: [golf, caddie, tee time, handicap, Rainbow Hills, The Green Clubs, TGC]
```

| name | device | os_runtime | input_modality | surface_type | orientation | default_theme | density_modes | connectivity | distribution |
|---|---|---|---|---|---|---|---|---|---|
| web-admin | desktop | web | pointer, keyboard | operational | landscape | Light | comfortable, compact | online | internal |
| handheld | ponsel | Android | touch, scanner, glove | operational | portrait | High-contrast | comfortable | offline-first | MDM |

**Hasil yang diharapkan**

1. `design-language.json`: `archetype: ink-graphite`, 0 override; nilai L2-L13 identik dengan §4.5 (Inter, JetBrains Mono, Lucide, interaksi hue 250 · chroma 0.020, `info` netral).
2. `manifest.axes`: theme `[Light, High-contrast]`, brand `[default]`, density `[comfortable, compact]`.
3. Token `target-min-extended` = 48 ada; semua kontrol di surface `handheld` punya area klik ≥ 48×48.
4. `compact` tidak pernah aktif di `handheld` (STD-4).
5. Komponen: semua tingkat R dan S terpilih (BottomNav karena ada surface ponsel; ConnectionStatus karena offline-first; Menu wajib). PinInput tidak dipilih kecuali StepUpDialog dipilih.
6. `lifecycle.json` PickList: `failed` → C1, `cancelled` → C3, `picked` → C4; `stagnation.threshold` terisi dari brief, tanpa `A-nn` untuk ambangnya.
7. Langkah pindai punya alternatif input manual (§9.1 Pemindai).
8. Pattern: kelima pattern R, ketiga pattern S, dan OfflineSync (surface offline-first) terpilih; `{P}` = 9.
9. V3: 0 kemunculan `leak_terms`. V1-V14, V16, dan V17 PASS; V15 NOT APPLICABLE.
10. V22: tanpa pack terpilih; 0 nama komponen, pattern, atau aturan P01-P04 (mis. JobStatus, ApprovalChain, PriceDisplay, Checkout, Feed, PostCard, OfficialSiteBanner, QuestionPage) di keluaran.

---

## G2. Seduh · `brand-led-tonal`, multi-brand

```yaml
brief_schema_version: "1.1"
run_mode: greenfield
product_name: Seduh
version_label: SDH-01
namespace: SDH
domain_summary: >
  Platform pemesanan kopi untuk jaringan kedai. Pelanggan memesan dan membayar lewat aplikasi bermerek kedai;
  staf outlet memproses pesanan di web. Setiap jaringan kedai tampil dengan mereknya sendiri.
doc_language: Indonesia
ui_locales: "id-ID"
roles:
  - {name: Pelanggan, goals: "memesan dan membayar", surfaces: [customer-app]}
  - {name: Staf outlet, goals: "memproses pesanan", surfaces: [outlet-web]}
primary_web_reference: react
production_targets: [flutter]
entities:
  - {name: Order, states: [diterima, diproses, siap, selesai, dibatalkan]}
  - {name: Payment, states: [menunggu, berhasil, gagal, kedaluwarsa]}
journeys:
  - {id: J1, name: Pesan dan bayar, steps: [pilih menu, keranjang, bayar, ambil], failure_path: "pembayaran gagal"}
language_mode: archetype
archetype: brand-led-tonal
brands:
  - {id: default,    name: Seduh,      interaction_hex: "#4F46E5"}
  - {id: kopi-senja, name: Kopi Senja, interaction_hex: "#C2410C"}
  - {id: kopi-pagi,  name: Kopi Pagi,  interaction_hex: "#0F766E"}
themes: [{name: Light}, {name: Dark}]
leak_terms: [golf, caddie, handicap, The Green Clubs, TGC]
```

| name | device | os_runtime | input_modality | surface_type | orientation | default_theme | density_modes | connectivity | distribution |
|---|---|---|---|---|---|---|---|---|---|
| customer-app | ponsel | iOS, Android | touch | consumer | portrait | Light | comfortable | online | publik |
| outlet-web | desktop | web | pointer, keyboard | operational | landscape | Light | comfortable | online | internal |

**Hasil yang diharapkan**

1. `manifest.axes.brand` = `[default, kopi-senja, kopi-pagi]`; V2 dijalankan untuk 6 kombinasi brand × tema dan `contrast-report.md` punya 6 bagian.
2. Hue interaksi: default ≈ 277°, kopi-senja ≈ 38° (chroma ≈ 0.17), kopi-pagi ≈ 186° (chroma ≈ 0.09).
3. Pemisahan hue global (§4.8 aturan 3):
   - `info` memakai varian netral karena 277° berjarak < 30° dari 250°.
   - `critical` digeser ke 15° (menjauh dari 38°); selisih tetap ≈ 23° < 30°, maka ADR tertulis, warna kopi-senja **tidak** diubah, dan catatan muncul di `contrast-report.md`.
   - `warning` (75°) dan `positive` (155°) tidak bergeser: selisih ≈ 37° dan ≈ 31°.
4. Token semantik punya `varies_by` tanpa `brand`; nilainya identik di ketiga brand.
5. L3 mengizinkan C4 filled: `color-semantic-on-positive` dipakai dan lolos 4.5:1 di semua kombinasi.
6. `lifecycle.json` Payment mengikuti seed §7.3: `menunggu` C5, `berhasil` C4, `gagal` C1, `kedaluwarsa` C3.
7. Situs dokumentasi punya pemilih brand dan tema.

---

## G3. Ruang Baca · `derive` → `soft-friendly`

```yaml
brief_schema_version: "1.1"
run_mode: greenfield
product_name: Ruang Baca
version_label: RB-01
namespace: RB
domain_summary: >
  Aplikasi komunitas taman baca untuk orang tua dan anak. Anggota meminjam buku, ikut kegiatan baca bersama,
  dan mencatat bacaan keluarga.
doc_language: Indonesia
ui_locales: "id-ID"
roles:
  - {name: Anggota, goals: "meminjam buku dan ikut kegiatan", surfaces: [member-app]}
primary_web_reference: react
production_targets: [flutter]
entities:
  - {name: Loan, states: [diajukan, dipinjam, terlambat, dikembalikan, dibatalkan]}
journeys:
  - {id: J1, name: Pinjam buku, steps: [cari buku, ajukan pinjam, ambil di taman baca], failure_path: "buku sudah dipinjam orang lain"}
language_mode: derive
personality: {formality: 2, warmth: 5, expressiveness: 4, density: 1, risk_criticality: 1}
brands: [{id: default, name: Ruang Baca}]
themes: [{name: Light}, {name: Dark}]
```

| name | device | os_runtime | input_modality | surface_type | orientation | default_theme | density_modes | connectivity | distribution |
|---|---|---|---|---|---|---|---|---|---|
| member-app | ponsel | iOS, Android | touch | consumer | portrait | Light | comfortable | online | publik |

**Hasil yang diharapkan**

1. Tabel skor di dokumen 05: `soft-friendly` 20 · `playful-vivid` 17 · `brand-led-tonal` 15 · `immersive-glass` 14 · `neo-brutalist` 13 · `quiet-luxury` 12 · `editorial-contrast` 11 · `ink-graphite` 6 · `dense-console` 4. Terpilih `soft-friendly`.
2. Tanpa `interaction_hex`: seed fallback hue 175 · chroma 0.10 dengan entri `A-nn`.
3. Pemisahan hue: `positive` digeser dari 155° ke 145° (selisih menjadi 30°); tanpa ADR.
4. `type-body` 17/26, `type-caption` 12/18, `control-height` 40 · 48 · 56, ikon Phosphor 20 · 24 · 28.
5. Tidak ada `target-min-extended` (tidak ada modalitas `glove` atau `in-motion`).
6. I9 dibaca sebagai hierarki informasi (surface `consumer`); tidak ada aturan decision-first di dokumen 80 untuk surface ini.
7. `lifecycle.json` Loan: `terlambat` → C1 atau C2 sesuai pertanyaan berurutan §7.1, dengan alasan tertulis; tidak ada overlay stagnasi karena `stagnation_threshold` kosong.

---

## G4. Pasal · `editorial-contrast`, dua langkah

**Langkah 1: `greenfield`**

```yaml
brief_schema_version: "1.1"
run_mode: greenfield
product_name: Pasal
version_label: PSL-01
namespace: PSL
domain_summary: >
  Portal riset regulasi untuk konsultan hukum. Pengguna menelusuri, membaca, dan menandai pasal
  dari peraturan perundang-undangan beserta riwayat perubahannya.
doc_language: English
report_language: Indonesia
ui_locales: "id-ID default, en-US lengkap"
roles:
  - {name: Peneliti, goals: "menelusuri dan menandai pasal", surfaces: [portal]}
  - {name: Editor, goals: "memperbarui status berlaku pasal", surfaces: [portal]}
primary_web_reference: react
entities:
  - {name: Regulation, states: [rancangan, berlaku, diubah, dicabut]}
journeys:
  - {id: J1, name: Telusuri pasal, steps: [cari, saring, baca, tandai], failure_path: "pasal yang dibaca ternyata sudah dicabut"}
language_mode: archetype
archetype: editorial-contrast
brands: [{id: default, name: Pasal}]
themes: [{name: Light}, {name: Dark}]
```

| name | device | os_runtime | input_modality | surface_type | orientation | default_theme | density_modes | connectivity | distribution |
|---|---|---|---|---|---|---|---|---|---|
| portal | desktop | web | pointer, keyboard, touch | content | both | Light | comfortable | online | publik |

Setelah langkah 1 selesai, tambahkan zona manual di `docs/05-design-language.html`:
`<!-- ds:manual:start id="editor-note" -->Catatan editor: uji dengan pengguna senior.<!-- ds:manual:end -->`

**Langkah 2: `regenerate`**

Ubah hanya: `run_mode: regenerate`, `existing_package: <folder hasil langkah 1>`, dan tambahkan `{name: High-contrast, purpose: "presentasi di ruang terang"}` ke `themes`.

**Hasil yang diharapkan**

1. Langkah 1: seluruh prosa dokumen berbahasa Inggris (V7), laporan akhir berbahasa Indonesia, contoh UI `en-US` ditandai `lang`.
2. Langkah 1: tidak ada nilai bayangan selain `none` di `elevation-*`; `radius-sm` = 0; `layout-measure` dipakai pada teks berjalan; keluarga font Source Sans 3, Source Serif 4, Source Code Pro.
3. Langkah 1: surface `portal` memuat `touch`, sehingga aturan sentuh 44×44 berlaku di semua lebar, termasuk desktop.
4. Langkah 1: interaksi chroma 0.03 < 0.08, pemeriksaan pemisahan hue tidak diterapkan.
5. Langkah 2: `package_version` naik minor (1.0.0 → 1.1.0); `migration-map.json` berisi `semver_bump: minor` dan entri `added` untuk mode High-contrast; 0 token `removed`.
6. Langkah 2: zona manual `editor-note` byte-identik; `CHANGELOG.md` punya dua entri; V15 PASS.

---

## G5. Pantau · `dense-console`, `brownfield`

```yaml
brief_schema_version: "1.1"
run_mode: brownfield
brownfield_sources:
  - {kind: css, path: fixtures/pantau-legacy.css, notes: "seluruh stylesheet produksi"}
product_name: Pantau
version_label: PTU-02
namespace: PTU
domain_summary: >
  Konsol pemantauan jaringan untuk tim NOC penyedia internet. Operator memantau perangkat dan menangani insiden
  di desktop; teknisi jaga menerima insiden kritis di ponsel.
doc_language: Indonesia
ui_locales: "id-ID"
roles:
  - {name: Operator NOC, goals: "triase dan tangani insiden", surfaces: [noc-console]}
  - {name: Teknisi jaga, goals: "menerima dan mengakui insiden kritis", surfaces: [oncall-app]}
primary_web_reference: react
production_targets: [flutter]
entities:
  - {name: Incident, states: [terbuka, diakui, ditangani, selesai, ditutup-tanpa-tindakan]}
critical_events:
  - {name: Core link down, severity: financial, required_behaviors: [overlay layar penuh, suara, aksi pengakuan eksplisit, tidak dibatasi izin]}
language_mode: archetype
archetype: dense-console
brands: [{id: default, name: Pantau, interaction_hex: "#2f81f7"}]
themes: [{name: Dark}, {name: Light}]
```

| name | device | os_runtime | input_modality | surface_type | orientation | default_theme | density_modes | connectivity | distribution |
|---|---|---|---|---|---|---|---|---|---|
| noc-console | desktop | web | pointer, keyboard | operational | landscape | Dark | comfortable, compact | online | internal |
| oncall-app | ponsel | Android, iOS | touch | operational | portrait | Dark | comfortable | online | MDM |

Isi `fixtures/pantau-legacy.css`:

```css
:root{
  --bg:#0f141a; --panel:#161d26; --text:#e6edf3; --muted:#7d8590;
  --accent:#2f81f7; --ok:#3fb950; --warn:#d29922; --err:#f85149;
}
body{font:13px/18px "Segoe UI",sans-serif;background:var(--bg);color:var(--text)}
.btn{height:28px;padding:0 10px;border-radius:3px;background:var(--accent);color:#fff}
.badge-ok{background:var(--ok);color:#fff;font-size:11px}
.badge-err{background:var(--err);color:#fff}
.row{height:30px;border-bottom:1px solid #222a33}
.card{box-shadow:0 2px 6px rgba(0,0,0,.4);border-radius:6px}
@media (max-width:768px){.sidebar{display:none}}
```

**Hasil yang diharapkan** (`brownfield-audit.md` dan `migration-map.json`)

| Nilai lama | Keputusan | Alasan yang diharapkan |
|---|---|---|
| `--accent` #2f81f7 | `keep` sebagai brand seed interaksi | hue ≈ 258°; tidak diubah diam-diam (§4.6 langkah 5) |
| `body` 13px | `violation` → 16 | STD-2 |
| `.badge-ok` 11px | `violation` → 16 | STD-2 (teks status adalah teks isi) |
| #fff di atas `--ok` | `violation` | 2.54:1 < 4.5:1 (STD-3) |
| #fff di atas `--accent` | `violation` | 3.75:1 < 4.5:1; diganti `interaction-on-solid` hasil solver |
| #fff di atas `--err` | `violation` | 3.35:1 < 4.5:1 |
| `--muted` di atas `--bg` / `--panel` | `keep` atau `merge` ke `text-secondary` | 4.96:1 dan 4.55:1, lolos tetapi tipis |
| border #222a33 | `keep` sebagai `color-structure-border` (bingkai) | 1.27:1, sengaja < 3:1; tidak boleh dipakai sebagai `border-control` |
| `.card` box-shadow | `violation` | LB-02 `dense-console` (bayangan hanya popover dan menu) |
| `.btn` height 28px | `keep` untuk `control-height-sm` pointer; `violation` di `oncall-app` | STD-4 pada sentuh |
| radius 3px / 6px | `merge` ke `radius-sm` (2) / `radius-md` (4) | menurut peran (kontrol, wadah), bukan nilai terdekat; radius 6 milik overlay |
| `"Segoe UI"` | `drop` | L4 archetype memakai IBM Plex Sans |
| breakpoint 768px | `merge` ke satu `bp-*` dengan alasan tertulis | V8: tidak ada angka 768 tersisa |

Tambahan:

1. `info` netral (interaksi ≈ 258° berjarak < 30° dari 250°; sama dengan default archetype).
2. Token `z-critical` ada; overlay Core link down hanya bisa ditutup lewat aksi pengakuan dan memakai `focus-ring-inverse`.
3. `codemod-plan.md` ada; engine tidak menjalankan codemod.
4. CommandPalette dan Kbd terpilih (`dense-console`); L16 `token-swap`, haptic hanya `error` dan `critical` di `oncall-app`.
5. V15 PASS: setiap nilai di tabel punya entri `migration-map.json`; tidak ada nilai `violation` yang muncul di `tokens.json`.

---

## G6. Serambi · `quiet-luxury`, RTL

```yaml
brief_schema_version: "1.2"
run_mode: greenfield
product_name: Serambi
version_label: SRB-01
namespace: SRB
domain_summary: >
  Aplikasi anggota untuk klub hunian dan resor premium. Anggota memesan fasilitas dan restoran,
  serta menerima tamu internasional dari Timur Tengah.
doc_language: Indonesia
ui_locales: "id-ID default, en-US lengkap, ar-SA lengkap"
roles:
  - {name: Anggota, goals: "memesan fasilitas dan restoran", surfaces: [member-app]}
primary_web_reference: react
production_targets: [flutter]
entities:
  - {name: Reservation, states: [diminta, dikonfirmasi, hadir, selesai, dibatalkan, tidak-hadir]}
journeys:
  - {id: J1, name: Reservasi restoran, steps: [pilih tanggal, pilih waktu, konfirmasi], failure_path: "slot penuh saat konfirmasi"}
language_mode: archetype
archetype: quiet-luxury
brands: [{id: default, name: Serambi, interaction_hex: "#B08D57", wordmark: "SERAMBI"}]
themes: [{name: Light}, {name: Dark}]
```

| name | device | os_runtime | input_modality | surface_type | orientation | default_theme | density_modes | connectivity | distribution |
|---|---|---|---|---|---|---|---|---|---|
| member-app | ponsel | iOS, Android | touch | consumer | portrait | Light | comfortable | online | publik |

**Hasil yang diharapkan**

1. Warna interaksi = tinta (hue 70 · chroma 0.015); #B08D57 (hue ≈ 77°) menjadi `color-brand-default` untuk aksen non-teks saja. Teks putih di atas emas hanya 3.09:1, sehingga emas tidak pernah menjadi fill di belakang teks; LB-02 melarangnya sebagai warna teks.
2. `ar-SA` mengaktifkan aturan RTL: V6 tidak menemukan properti fisik di komponen; V9 merender preview dengan `dir="rtl"`; setiap komponen punya field `rtl.mirrored_icons`.
3. DM Sans tidak mencakup aksara Arab: Noto Sans Arabic (OFL) ditambahkan ke fallback dan di-bundle; rasio tinggi baris untuk `ar-SA` +0.15.
4. Wordmark tetap teks "SERAMBI" (bukan logo buatan); LB-04 (kapital penuh) tidak berlaku untuk wordmark karena wordmark adalah logotype, dicatat di register.
5. `type-body` 17/28, `space-section` 64 / `space-section-lg` 96, `layout-content-max` 1200, Phosphor Light, `state-layer-*-opacity` = 0 (`token-swap`).
6. `glossary.json` memuat label `id-ID`, `en-US`, dan `ar-SA` untuk setiap state Reservation; `lifecycle.json` hanya memakai label itu.

---

## G7. Layar · `immersive-glass`

```yaml
brief_schema_version: "1.2"
run_mode: greenfield
product_name: Layar
version_label: LYR-01
namespace: LYR
domain_summary: >
  Aplikasi streaming film independen Indonesia. Pengguna menjelajah katalog bergambar besar dan menonton di ponsel atau web.
doc_language: Indonesia
ui_locales: "id-ID"
roles:
  - {name: Penonton, goals: "menemukan dan menonton film", surfaces: [viewer-app, viewer-web]}
primary_web_reference: react
production_targets: [flutter]
entities:
  - {name: Subscription, states: [aktif, akan-berakhir, berakhir, gagal-bayar]}
journeys:
  - {id: J1, name: Tonton film, steps: [jelajah, detail, putar], failure_path: "langganan gagal bayar saat mulai menonton"}
language_mode: archetype
archetype: immersive-glass
brands: [{id: default, name: Layar, interaction_hex: "#22D3EE"}]
themes: [{name: Dark}, {name: Light}]
```

| name | device | os_runtime | input_modality | surface_type | orientation | default_theme | density_modes | connectivity | distribution |
|---|---|---|---|---|---|---|---|---|---|
| viewer-app | ponsel | iOS, Android | touch | content | both | Dark | comfortable | online | publik |
| viewer-web | desktop | web | pointer, keyboard | content | landscape | Dark | comfortable | online | publik |

**Hasil yang diharapkan**

1. Hue interaksi ≈ 211.5° (chroma ≈ 0.13): berjarak ≈ 38° dari `info` (250°) dan ≈ 56° dari `positive`, sehingga tidak ada penggeseran hue semantik.
2. `interaction-on-solid` gelap (teks hitam di atas #22D3EE = 11.62:1).
3. `material-surface-alpha` dipilih solver sehingga teks lolos 4.5:1 di atas komposit hitam, putih, dan dua titik ekstrem kanvas; nilainya tercatat di `derivation`.
4. Di bawah `prefers-reduced-transparency` dan `forced-colors`, `surface-translucent` menjadi padat (V6, V9).
5. Orientasi `both` tidak dikunci (SC 1.3.4).
6. LB-03 memastikan `backdrop-filter` hanya di chrome dan overlay.

---

## G8. Gerak · `playful-vivid`

```yaml
brief_schema_version: "1.2"
run_mode: greenfield
product_name: Gerak
version_label: GRK-01
namespace: GRK
domain_summary: >
  Aplikasi tantangan olahraga keluarga. Anggota keluarga menyelesaikan tantangan harian dan mengumpulkan lencana bersama.
doc_language: Indonesia
ui_locales: "id-ID"
roles:
  - {name: Anggota keluarga, goals: "menyelesaikan tantangan", surfaces: [family-app]}
primary_web_reference: react
production_targets: [flutter]
entities:
  - {name: Challenge, states: [tersedia, berjalan, selesai, terlewat]}
journeys:
  - {id: J1, name: Selesaikan tantangan, steps: [pilih tantangan, catat aktivitas, klaim lencana], failure_path: "aktivitas gagal tersimpan"}
language_mode: archetype
archetype: playful-vivid
brands: [{id: default, name: Gerak}]
themes: [{name: Light}, {name: Dark}]
```

| name | device | os_runtime | input_modality | surface_type | orientation | default_theme | density_modes | connectivity | distribution |
|---|---|---|---|---|---|---|---|---|---|
| family-app | ponsel | iOS, Android | touch, in-motion | consumer | portrait | Light | comfortable | online | publik |

**Hasil yang diharapkan**

1. Tanpa seed: interaksi 300 · 0.20 dengan `A-nn`; selisih ke `info` 50° dan ke `critical` 85°, tanpa penggeseran.
2. `in-motion` memunculkan `target-min-extended` = 48; `control-height-sm` 44 tetap diperluas area kliknya ke 48.
3. `state-press-transform` = `scale(0.97)`, menjadi `none` di bawah reduced motion.
4. `haptic-success` dipakai saat `selesai` (C4, filled, `on-positive` lolos 4.5:1); animasi perayaan hanya untuk C4 (LB-04).
5. `sound-success` = `none` karena brief tidak mengizinkan efek suara.
6. Lexend dan Fredoka, Phosphor Bold 20 · 24 · 28, `control-height` 44 · 52 · 60.

---

## G9. Kolektif · `neo-brutalist`, dua langkah

**Langkah 1: `greenfield`**

```yaml
brief_schema_version: "1.2"
run_mode: greenfield
product_name: Kolektif
version_label: KLT-01
namespace: KLT
domain_summary: >
  Platform portofolio untuk komunitas desainer dan studio kreatif. Studio memamerkan karya dan menerima permintaan proyek.
doc_language: Indonesia
ui_locales: "id-ID"
roles:
  - {name: Studio, goals: "memamerkan karya dan menerima permintaan", surfaces: [studio-web]}
primary_web_reference: react
entities:
  - {name: ProjectRequest, states: [baru, ditinjau, diterima, ditolak]}
journeys:
  - {id: J1, name: Kirim karya, steps: [unggah, isi detail, terbitkan], failure_path: "unggahan gagal"}
language_mode: archetype
archetype: neo-brutalist
brands: [{id: default, name: Kolektif, interaction_hex: "#FF5A1F"}]
themes: [{name: Light}, {name: Dark}]
```

| name | device | os_runtime | input_modality | surface_type | orientation | default_theme | density_modes | connectivity | distribution |
|---|---|---|---|---|---|---|---|---|---|
| studio-web | desktop | web | pointer, keyboard, touch | public | both | Light | comfortable | online | publik |

**Langkah 2: `tenant-add`**

Ubah hanya: `run_mode: tenant-add`, `existing_package: <folder hasil langkah 1>`, dan tambahkan `{id: studio-biru, name: Studio Biru, interaction_hex: "#2B59FF"}` di akhir `brands`.

**Hasil yang diharapkan**

1. Langkah 1: interaksi tinta (chroma 0), sehingga pemeriksaan pemisahan hue tidak diterapkan; #FF5A1F menjadi `color-brand-default` (blok) dengan `color-brand-on` gelap (6.73:1).
2. Langkah 1: semua `radius-*` = 0 kecuali `radius-full`; `elevation-1` = `4 4 0 / 1` dengan warna `text-primary`; `state-press-transform` = `translate(4px,4px)`; Space Grotesk dan Space Mono; Tabler stroke 2.
3. Langkah 2: untuk `studio-biru`, teks gelap di atas #2B59FF hanya 3.98:1, sehingga solver memilih `color-brand-on` terang (5.28:1); warna merek tidak diubah.
4. Langkah 2: hanya token ber-`varies_by` brand yang berubah; `package_version` naik minor; `contrast-report.md` mendapat bagian `studio-biru` untuk Light dan Dark; V15 PASS.

---

## G10. Seduh Kasir · `inherit`

Jalankan G2 lebih dulu. Simpan `assets/design-language.json` hasil G2 sebagai lapis org versi 1.0.0.

```yaml
brief_schema_version: "1.2"
run_mode: greenfield
product_name: Seduh Kasir
version_label: SDK-01
namespace: SDK
domain_summary: >
  Aplikasi kasir tablet untuk kedai di platform Seduh. Kasir menerima pesanan langsung dan pembayaran di konter.
doc_language: Indonesia
ui_locales: "id-ID"
roles:
  - {name: Kasir, goals: "menerima pesanan dan pembayaran", surfaces: [pos-tablet]}
primary_web_reference: react
production_targets: [flutter]
entities:
  - {name: Payment, states: [menunggu, berhasil, gagal, kedaluwarsa]}
journeys:
  - {id: J1, name: Bayar di konter, steps: [pilih menu, total, bayar], failure_path: "pembayaran gagal"}
language_mode: inherit
inherits_from: {path: org/seduh-design-language.json, version: "1.0.0"}
language_overrides:
  - {decision: L16, value: "token-swap", reason: "kasir menekan cepat dan berulang; umpan balik harus instan"}
  - {decision: L17, value: "fluid, space-section 24 / 32, kiri", reason: "layar kerja operasional"}
brands: [{id: default, name: Seduh, interaction_hex: "#4F46E5"}]
themes: [{name: Light}]
```

| name | device | os_runtime | input_modality | surface_type | orientation | default_theme | density_modes | connectivity | distribution |
|---|---|---|---|---|---|---|---|---|---|
| pos-tablet | tablet | Android | touch | operational | landscape | Light | comfortable | online | MDM |

**Hasil yang diharapkan**

1. `design-language.json`: `mode: inherit`, `org_language.version` = 1.0.0; L16 dan L17 bertanda `source: brief`, keputusan lain `source: org`.
2. Nilai warisan identik dengan G2 (Plus Jakarta Sans, radius 8 / 12 / 16, `info` netral).
3. Varian negatif: tambahkan override ketiga `{decision: L7, ...}`. Hasil yang diharapkan: mode berubah menjadi `custom`, ADR tertulis, dan Phase 0B mencatat alasannya (§4.8 aturan 5).

---

## G11. Seduh · ekosistem

Jalankan ulang G2 dengan `brief_schema_version: "1.3"` dan tambahan berikut (bagian lain tidak berubah):

```yaml
# B4
design_tool: figma
design_tool_limits: {max_modes: 4}
package_registry: "GitHub Packages"
ci_platform: github-actions
# B8
performance_budgets:
  - {item: "Paket komponen web", limit: "100 KB gzip", reason: "aplikasi pelanggan dibuka di jaringan seluler"}
# B11
governance_model: federated
maintainers: [Tim Platform Seduh]
consumer_products:
  - {name: Seduh Pelanggan, repo_path: ../seduh-customer}
```

**Hasil yang diharapkan**

1. `design-tool/variables.json`: koleksi `primitive` (tersembunyi), `color` dengan mode Light dan Dark, koleksi `brand` terpisah dengan mode default, kopi-senja, kopi-pagi (karena 3 × 2 = 6 mode melebihi batas 4), dan `size` dengan satu mode `comfortable`.
2. `component-properties.json` untuk Button: variant property `variant` (primary, secondary, tertiary, destructive) dan `size` (sm, md, lg), boolean `disabled` dan `loading`, teks `label`, variant `state`; sama persis dengan `api` di `components.json` (V18).
3. Bagian drift V18 NOT RUN karena `design_tool_export` kosong.
4. `packages/` berisi `@sdh/tokens`, `@sdh/react`, dan `sdh_design` (Flutter) dengan versi = `package_version`; tidak ada yang dipublikasikan oleh engine.
5. `ci/` memuat `pipeline.md` dan konfigurasi GitHub Actions berlabel "Not verified".
6. `perf-report.md` memakai anggaran 100 KB dari brief untuk paket komponen; anggaran lain dari §14C.
7. `governance/CONTRIBUTING.md` menjelaskan model `federated`; SLA triase dan LTS tercatat sebagai `A-nn`.
8. `adoption-report.md` NOT RUN bila `../seduh-customer` tidak bisa dibaca; `tools/adoption-scan.mjs` tetap ada.
9. Codemod NOT APPLICABLE (belum ada major kedua); V19 melaporkan "baseline created" pada run pertama.

---

## G12. Izinku · pack P04 layanan publik

```yaml
brief_schema_version: "1.4"
run_mode: greenfield
product_name: Izinku
version_label: IZK-01
namespace: IZK
domain_summary: >
  Layanan perizinan usaha mikro milik sebuah pemerintah kabupaten fiktif. Pelaku usaha mengajukan izin
  secara daring dan mengecek status; petugas memverifikasi pengajuan di aplikasi internal.
doc_language: Indonesia
ui_locales: "id-ID"
roles:
  - {name: Pelaku usaha, goals: "mengajukan izin dan mengecek status", surfaces: [public-web]}
  - {name: Petugas verifikasi, goals: "memverifikasi pengajuan", surfaces: [officer-web]}
primary_web_reference: html-first
entities:
  - {name: Application, states: [draf, diajukan, diverifikasi, perlu-perbaikan, disetujui, ditolak]}
journeys:
  - {id: J1, name: Ajukan izin, steps: [mulai, data usaha, data pemilik, unggah dokumen, periksa jawaban, kirim], failure_path: "dokumen tidak terbaca saat unggah"}
  - {id: J2, name: Cek status, steps: [masukkan nomor referensi, lihat status], failure_path: "nomor referensi salah"}
language_mode: archetype
archetype: editorial-contrast
brands: [{id: default, name: Izinku}]
themes: [{name: Light}]
component_packs: [P04-b2g-public-service]
pack_config:
  P04:
    operator_type: regional_government
    official_domain: go.id
    service_phase: beta
    sensitive_service: false
    assisted_channels: [{channel: "Loket perizinan kabupaten", detail: "jam kerja"}]
    fees: none
```

| name | device | os_runtime | input_modality | surface_type | orientation | default_theme | density_modes | connectivity | distribution |
|---|---|---|---|---|---|---|---|---|---|
| public-web | ponsel, desktop | web | touch, pointer, keyboard | public | both | Light | comfortable | online | publik |
| officer-web | desktop | web | pointer, keyboard | operational | landscape | Light | comfortable | online | internal |

**Hasil yang diharapkan**

1. `manifest.packs` = P04 versi 1.0.0 dengan config dari brief.
2. Komponen pack: 10 tingkat R (OfficialSiteBanner ikut karena `regional_government`) + PhaseBanner (`beta`). TaskList, LanguageSelector, ConsentBanner, ExitThisPage, dan DocumentViewer tidak dipilih, masing-masing dengan alasan tertulis; ConsentBanner dicatat `A-nn` karena kebijakan cookie tidak disebut.
3. Pattern pack: 6 tingkat R + StatusTracking (J2) + ServiceFeedback. FeePayment tidak dipilih (`fees: none`).
4. Surface `public-web`: CrudFlow diganti StartPage → QuestionPage → CheckAnswers → Confirmation (P04.8 butir 4). Surface `officer-web`: CrudFlow core tetap berlaku dan komponen P04 bertanda "tidak dipakai" di tabel §8.4.
5. Reference `html-first`: V9 merender setiap preview dengan JavaScript dimatikan; P04-V1 PASS atau NOT RUN, tidak pernah diklaim tanpa dijalankan.
6. OfficialSiteBanner menyebut `go.id`; ServiceFooter menyebut "Loket perizinan kabupaten".
7. `A-nn` tercatat untuk `session_timeout`, `save_retention`, dan `regulations` (dengan catatan tinjauan hukum, tanpa klaim kepatuhan).
8. Varian negatif: ganti `archetype` menjadi `playful-vivid`. Phase 0B berhenti dengan pertanyaan blocking karena veto P04-R10; tidak lanjut diam-diam.
9. Varian negatif: ganti `primary_web_reference` menjadi `react`. Phase 0 mengajukan pertanyaan P04-R1 (ganti ke `html-first` atau ADR).
10. Varian dua pack: `component_packs: [P04-b2g-public-service, P01-b2b-ops]` dengan `pack_config.P01: {approval_levels: 1, audit_required: true}`. Tidak ada pertanyaan konflik (cakupan surface berbeda, §0 aturan 6). `officer-web` mendapat BulkActionBar, JobStatus, DiffView, ApprovalChain, dan AuditLog; `public-web` tidak mendapat komponen P01; `manifest.packs` memuat keduanya.

---

## G13. Lumbung · pack P01 operasi B2B

Jalankan ulang G1 dengan `brief_schema_version: "1.4"` dan tambahan berikut (bagian lain tidak berubah):

```yaml
component_packs: [P01-b2b-ops]
pack_config:
  P01:
    multi_tenant: none
    approval_levels: 1                 # penyesuaian stok perlu persetujuan supervisor
    audit_required: true
    hierarchies: ["zona > rak > bin"]
    scheduling: shift
    keyboard_power_users: true
    large_lists: "5.000"
    bulk_job_threshold: 200
```

Tambahkan juga role `{name: Supervisor, goals: "menyetujui penyesuaian stok", surfaces: [web-admin]}` dan entitas `{name: StockAdjustment, states: [draf, diajukan, disetujui, ditolak, dikembalikan]}`.

**Hasil yang diharapkan**

1. Komponen P01 tingkat R: BulkActionBar, JobStatus, TreeTable (hierarki lokasi), Scheduler (`shift`), DiffView, ShortcutHelp. TenantSwitcher dan Board tidak dipilih, dengan alasan tertulis.
2. Pattern P01: BackgroundJobs, SavedViewsAndFilters, ApprovalChain, AuditLog, PermissionManagement (lebih dari 2 role), serta Scheduling. TenantSwitching tidak dipilih.
3. ApprovalChain: `dikembalikan` dipetakan ke C2; pengaju tidak bisa menyetujui pengajuannya sendiri dicatat sebagai `A-nn`; setiap keputusan punya entri audit dengan DiffView.
4. CommandPalette wajib (`keyboard_power_users`); ShortcutHelp dibuka dengan Ctrl/⌘ + `/`; P01-V3 memeriksa tidak ada pintasan satu huruf global.
5. Surface `handheld` (operasional, sentuh): komponen P01 dipakai dengan aturan sentuh; `compact` tidak pernah aktif; TreeTable menjadi drill-down; Scheduler menampilkan alternatif agenda.
6. Aksi massal di atas 200 item menjadi job (P01-V2); daftar di atas 5.000 baris memakai paginasi server atau virtualisasi (P01-V1).
7. V22: P04 tidak dipilih dan tidak meninggalkan jejak.

---

## G14. Pasar Tetangga · pack P02 + P01

```yaml
brief_schema_version: "1.4"
run_mode: greenfield
product_name: Pasar Tetangga
version_label: PTG-01
namespace: PTG
domain_summary: >
  Marketplace produk UMKM lokal. Pembeli belanja dari banyak toko lewat aplikasi dan web;
  penjual mengelola produk, pesanan, dan promosi di dasbor web.
doc_language: Indonesia
ui_locales: "id-ID"
formats: {currency: "Rp1.150.000", time: "14:05", timezone: "WIB", date: "3 Okt 2026", number: "1.234,5"}
roles:
  - {name: Pembeli, goals: "menemukan dan membeli produk", surfaces: [buyer-app, storefront-web]}
  - {name: Penjual, goals: "mengelola produk, pesanan, dan promosi", surfaces: [seller-web]}
primary_web_reference: react
production_targets: [flutter]
entities:
  - {name: Order, states: [menunggu-pembayaran, memverifikasi-pembayaran, diproses, dikirim, diterima, dibatalkan, gagal-bayar]}
journeys:
  - {id: J1, name: Beli produk, steps: [cari, lihat produk, keranjang, checkout, bayar, lacak], failure_path: "virtual account kedaluwarsa sebelum dibayar"}
  - {id: J2, name: Proses pesanan penjual, steps: [lihat pesanan baru, proses, input resi], failure_path: "stok ternyata habis"}
language_mode: archetype
archetype: brand-led-tonal
brands: [{id: default, name: Pasar Tetangga, interaction_hex: "#0F766E"}]
themes: [{name: Light}, {name: Dark}]
component_packs: [P02-b2c-commerce, P01-b2b-ops]
pack_config:
  P02:
    commerce_model: [marketplace]
    payment_methods: [kartu, e-wallet, virtual account, QR]
    fulfillment: [shipping]
    promotions: [vouchers, flash_sale]
    reviews: true
    guest_checkout: false
    chat_with_seller: true
  P01:
    multi_tenant: org_switch
    bulk_job_threshold: 100
    reporting: fixed
```

| name | device | os_runtime | input_modality | surface_type | orientation | default_theme | density_modes | connectivity | distribution |
|---|---|---|---|---|---|---|---|---|---|
| buyer-app | ponsel | iOS, Android | touch | consumer | portrait | Light | comfortable | online | publik |
| storefront-web | ponsel, desktop | web | touch, pointer, keyboard | public | both | Light | comfortable | online | publik |
| seller-web | desktop | web | pointer, keyboard | operational | landscape | Light | comfortable, compact | online | publik |

**Hasil yang diharapkan**

1. `buyer-app` dan `storefront-web` mendapat komponen P02 tingkat R (8, termasuk PaymentMethodSelector dan AddressSelector), S yang kondisinya terpenuhi (RatingDisplay, ReviewItem, ProductGallery, DiscountTag, VoucherInput, StockIndicator, WishlistToggle), dan O ChatThread. CountdownTimer inti ikut terpilih untuk flash sale.
2. `seller-web` mendapat P01, termasuk TenantSwitcher (penjual dengan beberapa toko) dan ReportExport; komponen P02 bertanda "tidak dipakai" di surface ini.
3. `lifecycle.json` Order: `menunggu-pembayaran` C2 dengan batas waktu dari server, `memverifikasi-pembayaran` C5, `gagal-bayar` C1, `diterima` C4, `dibatalkan` C3 (P02-R4).
4. Tombol bayar berlabel "Bayar Rp…" dengan total; rincian biaya terlihat sebelum tombol (P02-V1).
5. `guest_checkout: false`: GuestToAccount tidak dipilih; AccountAndAddresses dipilih.
6. Tidak ada add-on atau persetujuan pemasaran yang tercentang default (P02-V2); input kartu hanya lewat komponen penyedia pembayaran (P02-V4).
7. Varian negatif: ganti `archetype` menjadi `dense-console`. Phase 0B bertanya karena veto P02-R13.
8. Varian negatif: tambahkan `P04-b2g-public-service` ke `component_packs`. Phase 0 bertanya pack mana yang berlaku untuk `storefront-web` karena P02 dan P04 sama-sama mencakup surface `public` (§0 aturan 6).
9. V22: P03 dan P04 tidak meninggalkan jejak.

---

## G15. Ruang Karya · pack P03 + P02

```yaml
brief_schema_version: "1.4"
run_mode: greenfield
product_name: Ruang Karya
version_label: RKY-01
namespace: RKY
domain_summary: >
  Komunitas perajin dan desainer lokal. Anggota membagikan proses kerja lewat foto dan video pendek,
  saling mengikuti dan berkirim pesan, serta menjual karya langsung dari profilnya.
doc_language: Indonesia
ui_locales: "id-ID"
formats: {currency: "Rp1.150.000", time: "14:05", timezone: "WIB", date: "3 Okt 2026", number: "1.234,5"}
roles:
  - {name: Anggota, goals: "berbagi karya, mengikuti, membeli", surfaces: [member-app, member-web]}
primary_web_reference: react
production_targets: [flutter]
entities:
  - {name: Post, states: [draf, mengunggah, terbit, disembunyikan, dihapus]}
  - {name: Order, states: [menunggu-pembayaran, memverifikasi-pembayaran, diproses, dikirim, diterima, dibatalkan, gagal-bayar]}
journeys:
  - {id: J1, name: Bagikan karya, steps: [buat postingan, tambah media, teks alternatif, terbitkan], failure_path: "unggahan video gagal"}
  - {id: J2, name: Beli karya, steps: [lihat postingan, buka produk, checkout, bayar], failure_path: "pembayaran gagal"}
language_mode: archetype
archetype: neo-brutalist
brands: [{id: default, name: Ruang Karya, interaction_hex: "#FF5A1F"}]
themes: [{name: Light}, {name: Dark}]
component_packs: [P03-b2c-media-social, P02-b2c-commerce]
pack_config:
  P03:
    content_types: [image, video]
    ugc: true
    social_graph: follow
    messaging: direct
    reactions: [like, comment, share, save]
    ranking: both
  P02:
    commerce_model: [marketplace]
    payment_methods: [e-wallet, virtual account]
    fulfillment: [shipping]
    reviews: true
    guest_checkout: false
    chat_with_seller: true
```

| name | device | os_runtime | input_modality | surface_type | orientation | default_theme | density_modes | connectivity | distribution |
|---|---|---|---|---|---|---|---|---|---|
| member-app | ponsel | iOS, Android | touch | consumer | portrait | Light | comfortable | online | publik |
| member-web | desktop | web | pointer, keyboard | consumer | landscape | Light | comfortable | online | publik |

**Hasil yang diharapkan**

1. Tidak ada pertanyaan konflik: P02 dan P03 mencakup surface yang sama tetapi menyatakan diri kompatibel (§0 aturan 6).
2. ChatThread hanya satu di `{N}` dengan `pack: "P02+P03"` dan kontrak gabungan (pesan dengan penjual + percakapan langsung antaranggota, folder permintaan pesan); V22 menemukan 0 nama komponen ganda.
3. Gulir tak berujung hanya di Feed (P03-R1, P03.8 butir 1); daftar produk tetap memakai "Muat lagi" (P02-R9).
4. `wcag22.json`: SC 1.2.1-1.2.5 tidak N/A; konten buatan pengguna berstatus `Open decision` dengan `A-nn` kebijakan takarir (P03.8 butir 2).
5. Tidak ada putar otomatis bersuara; putar otomatis tanpa suara mati di bawah reduced motion (P03-V2).
6. `audience_age` kosong: dicatat `A-nn` dan diperlakukan `includes_minors`, sehingga default akun privat dan pesan dari bukan koneksi mati (P03-R9).
7. `ranking: both`: ContentPreferences dengan pilihan kronologis dan "Mengapa saya melihat ini".
8. Pattern R P03 (BrowseFeed, ContentDetail, CreatePost, ReportBlockMute, PrivacyControls, ContentPreferences) dan pattern R P02 sama-sama ada; CreatorSupport tidak dipilih (`monetization` kosong).
9. Varian negatif: ubah `member-web` menjadi `surface_type: public` lalu tambahkan `P04-b2g-public-service`. Phase 0 bertanya karena P03 dan P04 bertentangan di surface `public` (feed tak berujung), dan P02 juga bertentangan dengan P04 (penggantian CrudFlow).
10. Varian negatif: hapus deklarasi `shares` dari header P03. Phase 0 bertanya karena ChatThread didefinisikan dua pack tanpa deklarasi (§0 aturan 8).
