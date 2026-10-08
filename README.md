# Universal Design System Generator

**Engine `1.8.0`** · **Brief schema `1.5`**

> Engine untuk menghasilkan design system yang lengkap, terstruktur, dan matang untuk **proyek apa pun**. Fakta proyek masuk lewat *brief*. **Bahasa desain** (prinsip, warna, bentuk, kepadatan, gerak, suara, platform, material, layout) dipilih atau diturunkan per proyek. Mesin (proses, aturan, gerbang mutu, verifikasi) tidak berubah antar proyek.
>
> Sejak 1.8.0 engine bukan hanya spesifikasi: ia membawa **alat yang benar-benar jalan**, **katalog kanonis** 74 komponen dan 21 pattern, **implementasi referensi** 74 komponen yang lolos QA Chromium, **skema JSON jadi**, **adapter library** yang sudah di-type-check, dan **golden fixtures yang bisa dijalankan**. Run tidak lagi menulis ulang mesin; ia menjalankannya dan hanya menulis yang khas proyek.

## Isi paket

| Bagian | Fungsi |
|---|---|
| `core.prompt.md` | Prompt inti, selalu dimuat: peran, aturan R1-R19, baseline, invarian, DoD-1..22, alur fase, tier pengiriman, ringkasan validator, laporan akhir, blok `<project_brief>` |
| `modules/M00` … `M13` | 14 modul rincian yang dimuat per fase |
| `packs/` | Domain pack opsional P01-P04 |
| `catalog/` | `archetypes.json` (bentuk normatif §4.5), `components/*.json` (74 record kanonis), `patterns/*.json` (21 pattern), `token-names.json`, `wcag22.seed.json` |
| `reference/html-first/` | CSS + JS referensi 74 komponen (token saja, logical properties, html-first), fixture preview, `CONTRIBUTING.md`; `reference/site/` chrome situs dokumentasi |
| `tools/` | alat engine (lihat tabel di bawah) |
| `schemas/` | 17 JSON Schema 2020-12 (kontrak §16A + brief, katalog, verifikasi) |
| `adapters/` | A01 Ant Design v6, A02 MUI v7, A03 shadcn/ui + Tailwind 4, A04 Flutter Material 3 |
| `fixtures/` | 13 golden brief dalam bentuk mesin + `expect.json` (109 asersi) |
| `engine-findings/` | register temuan engine (44 ditutup di 1.8.0, 15 terbuka) dan template |
| `rubric/` | rubrik kematangan paket dan daftar tinjauan visual |
| `SKILL.md` | pemakaian engine sebagai skill (progressive disclosure) |
| `brief.template.md` · `golden-briefs.md` | formulir brief (skema 1.5) · golden brief dalam prosa (sumber fixtures) |

## Alat engine

| Alat | Fase | Fungsi |
|---|---|---|
| `resolve-language.mjs` | 0B | brief → `design-language.json` (archetype, derive dengan skor, custom, inherit, override, penyesuaian baseline) + `lint-rules.json` |
| `derive-tokens.mjs` | 1 | solver palet OKLCH: ramp terang/gelap, pemisahan hue, pemilihan langkah per peran yang membuktikan 150+ pasangan kontras per mode, simulasi buta warna, translucency, blok merek, token komponen dari L3/L16 → `tokens.json`, `contrast-report.md` |
| `build.mjs` | 1, 9, 13 | `tokens.css` (sumbu tema/brand/kepadatan, sentuh, RTL, reduced motion/transparency, forced colors), `tokens.js/.d.ts`, Flutter, SwiftUI, Compose, Tailwind 4, AntD v6, MUI v7, shadcn, variabel alat desain; `build-manifest.json` untuk V16 |
| `compose.mjs` | 3-5 | seleksi {N}/{P} dengan alasan dan penutupan dependensi → `manifest.json`, `components.json`, `patterns.json`, `wcag22.json`, `scope.md` |
| `render-previews.mjs` | 11-12 | merakit referensi untuk {N} (bundle terminifikasi + sumber per komponen) dan preview per komponen |
| `render-site.mjs` | 2, 8, 12 | situs dokumentasi dari JSON: Overview, 12 dokumen, halaman komponen 18 seksi, pattern 10 seksi, pencarian offline, pemilih sumbu |
| `qa.mjs` | 12, 14 | V9 di Chromium: axe-core, ukuran teks, area klik, ring fokus, reflow 320, RTL, forced colors, tanpa JS, screenshot |
| `validate.mjs` | setiap gerbang, 14 | V1-V22 + VB1-VB12, sifat blocking/advisory, tier T0-T3 → `verification.json`, `verification-report.md` |
| `score.mjs` | 15 | skor kematangan paket per dimensi dari `verification.json` (rubric/maturity-rubric.md) |
| `run-fixtures.mjs` | regresi engine | menjalankan semua golden fixture dan memeriksa asersi |
| `check-catalog.mjs` · `check-patterns.mjs` | pemeliharaan | memvalidasi katalog kanonis |
| `assemble.mjs` | opsional | core + modul (+ pack) menjadi satu file |
| `dev/` | pemeliharaan | `gen-schemas`, `gen-token-names`, `gen-fixtures`, `ref-check` (lint + QA referensi di 4 archetype) |

Semua alat: Node 18+, tanpa dependensi dan tanpa jaringan. `qa.mjs` butuh Playwright (dan axe-core bila ada); tanpa itu V9 ditulis NOT RUN.

## Cara pakai

1. **Isi brief.** Salin `brief.template.md`, isi, tempel di blok `<project_brief>` di akhir `core.prompt.md`. Phase 0 menulisnya sebagai `brief.normalized.json`.
2. **Pilih bahasa desain** di B6: salah satu dari sembilan archetype, `derive`, `custom`, atau `inherit`.
3. **Lingkungan dengan akses file dan Node** (Claude Code atau chat dengan code execution): taruh folder engine di workspace, minta "Baca `core.prompt.md` dan jalankan Phase 0". Pipeline mesin untuk paket di folder `out/`:

   ```bash
   node tools/resolve-language.mjs out/brief.normalized.json out
   node tools/derive-tokens.mjs   out/brief.normalized.json out
   node tools/build.mjs            out
   node tools/compose.mjs          out
   node tools/render-previews.mjs  out --ns NS
   node tools/render-site.mjs      out
   node tools/qa.mjs               out          # butuh Playwright
   node tools/validate.mjs         out          # tier + laporan
   node tools/score.mjs            out          # skor kematangan per dimensi
   ```

   Hasilnya paket tier T0-T2 tanpa konten domain. Run kemudian menulis yang khas proyek (komponen dan pattern domain, lifecycle, glosarium, journey, string locale tambahan, catatan role) dan menjalankan `validate.mjs` lagi.
4. **Chat tanpa akses file:** tempel `core.prompt.md` + modul per fase seperti sebelumnya. Alat tidak bisa dijalankan, jadi semua validator ditulis NOT RUN dan tier maksimum yang boleh diklaim adalah tidak ada (R4, R18).
5. **Domain khusus:** pilih pack di B7 `component_packs`. **Library fondasi:** pilih adapter di B4 `adapters`.
6. **Setelah mengubah engine:** `node tools/run-fixtures.mjs` (harus 109/109), `node tools/check-catalog.mjs`, `node tools/check-patterns.mjs`, dan untuk referensi `node tools/dev/ref-check.mjs <Nama…>`. Naikkan versi di header core, semua modul, `catalog/archetypes.json`, dan alat bersamaan.

## Peta modul dan beban konteks

| Modul | Isi | Section |
|---|---|---|
| M00 `run-modes` | mode jalan, migrasi brief (sampai 1.5) | §2.6-2.7 |
| M01 `design-language` | sembilan archetype (normatif di `catalog/archetypes.json`), `derive`, lapisan org → produk → brand | §4.5-4.8 |
| M02 `tokens` | grup token, ramp terang/gelap, solver, pasangan kontras, sumbu mode, token runtime dan timing | §5 |
| M03 `components` | katalog 74 komponen (record kanonis), 18 seksi, kontrak, konvensi API, model state, penutupan dependensi | §6 |
| M04 `lifecycle` | kelas perhatian per state entitas | §7 |
| M05 `layout-platform` | breakpoint, region, platform, matriks dukungan | §8 |
| M06 `accessibility` | aturan operasional, 55 SC WCAG 2.2, preferensi pengguna, uji AT, fokus | §9 |
| M07 `roles` | pola permission, matriks coverage | §10 |
| M08 `journeys-patterns` | journey dan 21 pattern | §11 |
| M09 `content` | penulisan, error (termasuk forbidden), loading, lokalisasi dan RTL, glosarium | §12 |
| M10 `targets` | reference web, paket native, adapter library, haptic | §14 |
| M11 `ecosystem` | alat desain, regresi, performa, governance, distribusi, kontribusi, adopsi | §14A-14C, §15 |
| M12 `data-contracts` | tipe normatif semua file JSON | §16A |
| M13 `verification` | kriteria lulus V1-V22 dan VB, implementasi di `tools/` | §17 |

Ukuran prompt per fase (core + modul, KB; semua sekaligus 209 KB). Lebih besar sekitar 10 KB dari 1.7.0, tetapi keluaran yang harus ditulis run berkurang drastis karena katalog, token, situs, dan validator dibangkitkan alat.

| Fase | KB | Fase | KB | Fase | KB |
|---|---|---|---|---|---|
| 0R | 73 | 0 | 73 | 0A | 107 |
| 0B | 86 | 1 | 78 | 2 | 86 |
| 3 | 87 | 4 | 100 | 5 | 56 |
| 6 | 67 | 7 | 79 | 8 | 66 |
| 9 | 85 | 10 | 64 | 11 | 95 |
| 12 | 96 | 13 | 74 | 14 | 63 |
| 15 | 54 | | | | |

## Domain pack

| Pack | Domain | Status | Isi |
|---|---|---|---|
| P01 `b2b-ops` | back-office, SaaS, admin, alat internal | tersedia 1.1.0 | 13 aturan domain, 19 komponen, 14 pattern (Dashboard memperluas pattern dasar), 9 pemeriksaan |
| P02 `b2c-commerce` | commerce dan transaksi konsumen | tersedia 1.0.1 | 14 aturan domain, 21 komponen, 17 pattern, 9 pemeriksaan |
| P03 `b2c-media-social` | media, konten, sosial | tersedia 1.0.0 | 14 aturan domain, 20 komponen (1 dipakai bersama P02), 16 pattern, 9 pemeriksaan |
| P04 `b2g-public-service` | layanan publik untuk warga dan badan usaha | tersedia 1.0.1 | 13 aturan domain, 16 komponen, 14 pattern, 9 pemeriksaan |

Kompatibilitas antar pack (§0 aturan 6 dan 8):

| | P01 | P02 | P03 | P04 |
|---|---|---|---|---|
| P01 | - | kompatibel (surface berbeda) | kompatibel (surface berbeda) | kompatibel (surface berbeda) |
| P02 | | - | kompatibel, berbagi ChatThread | bertentangan di surface `public` |
| P03 | | | - | bertentangan di surface `public` |

Menulis pack baru: ikuti struktur P01 atau P04 (lingkup, konfigurasi, aturan domain, komponen, pattern, glosarium, validasi, override engine) dan header `ds-pack` dengan `engine_min` dan `phases`. Pack tidak boleh melonggarkan baseline atau invarian (§0). Tambahkan satu fixture golden untuk pack baru dan satu baris "0 jejak" di fixture yang tidak memilihnya.

## Pola kegagalan yang dicegah engine

Pola-pola ini sering muncul pada paket design system hasil generate, termasuk pada paket referensi TGC-11 yang dianalisis saat prompt ini disusun.

| ID | Pola kegagalan | Dampak | Dicegah oleh |
|---|---|---|---|
| F1 | Alias token belum ter-resolve di CSS (`{color-...}`) atau nilai elevasi berupa literal dict | Deklarasi invalid saat dihitung: panel, border, atau bayangan komponen penting bisa tidak tampil | R2, V1, V9 |
| F2 | Dokumen menyebut `tokens.json` sebagai sumber kebenaran, tetapi file itu tidak ada | Token tidak bisa diverifikasi dan target native tidak bisa di-generate | R1, §16.1, V3 |
| F3 | Dua angka breakpoint berbeda di dokumen berbeda | Ambang layout tidak konsisten | §8.1, V8 |
| F4 | Jumlah file komponen target native tidak sama dengan jumlah komponen web | Parity tidak terjaga | R7, V10 |
| F5 | Bahasa dokumentasi campur | Dokumentasi tidak konsisten | R5, DoD-8, V7 |
| F6 | Rujukan ke dokumen eksternal (flow, layar, ADR) yang tidak ada di paket | Tidak bisa diverifikasi, berisiko dikarang ulang | §2.4, R3 |
| F7 | Tanpa changelog, versioning, atau laporan verifikasi; kematangan hanya diklaim | Sistem tidak bisa dikelola | R12, §15, §17, §18 |
| F8 | Teks isi di bawah 16 px dan "minimum 12px" untuk semua teks | Baseline keterbacaan tidak terpenuhi | STD-2, V11 |
| F9 | Target sentuh 44 disebut tanpa dimensi pada kedua sisi dan tanpa verifikasi otomatis | Tidak ada bukti 44×44 tercapai | STD-4, V9, V11 |
| F10 | Klaim "WCAG 2.2 AA" tanpa pemetaan per kriteria; pengecualian "teks besar 3:1" | Klaim kesesuaian tidak bisa diaudit | STD-1, STD-3, §9.2, V12 |
| F11 | Nilai estetika tersebar tanpa sumber keputusan (bahasa desain implisit) | Sulit diganti atau diaudit; mengganti "gaya" berarti menulis ulang semua | L1-L17, R14, V13 |
| F12 | Istilah, nilai, atau struktur proyek lain terbawa ke proyek baru | Hasil bocor dari konteks lain | R15, V3 |
| F13 | Archetype hanya punya sebagian nilai; tiap run mengarang sisanya | Bahasa desain yang sama menghasilkan tampilan berbeda | §4.5(c), V13, `golden-briefs.md` |
| F14 | Struktur JSON berbeda antar run dan antar proyek | Tooling dan validator tidak bisa dipakai ulang | R16, §16A, V14 |
| F15 | Generate ulang menimpa edit manual atau menghapus token tanpa deprecation | Tim kehilangan pekerjaan; aplikasi rusak saat upgrade | §2.6, V15 |
| F16 | Warna tenant lolos kontras di satu tema tetapi gagal di tema lain | Brand tertentu tidak terbaca di dark mode | §4.8, §5.9, V2 per brand × tema |
| F17 | Token `on-*` hanya untuk sebagian status | Status ber-fill tidak punya warna konten yang teruji | §5.2, §5.5 |
| F18 | Jarak antar komponen diatur margin masing-masing komponen | Spasi tidak konsisten dan sulit diubah per kepadatan | primitif layout §6.1, §6.5 |
| F19 | Nama prop dan event berbeda antar komponen (`onChange`, `onSelect`, `onUpdate`) | API sulit dipelajari dan parity antar target rusak | §6.8, V5 |
| F20 | Pola umum (hapus, cari, upload) didesain ulang di setiap fitur | Perilaku tidak konsisten dan aksesibilitas bolong | §11.2-11.3, V17 |
| F21 | Kontrol hilang atau fokus tak terlihat di Windows High Contrast; translucency tidak terbaca | Pengguna dengan kebutuhan kontras tidak bisa memakai produk | §9.3, V6, V9 |
| F22 | Istilah berbeda untuk konsep yang sama ("Batal", "Batalkan", "Cancel") | Pengguna ragu dan terjemahan membengkak | §12.5, V3 |
| F23 | Layout rusak di bahasa RTL karena properti fisik | Produk tidak bisa dilokalkan ke pasar RTL | §12.4, V6, V9 |
| F24 | Nilai di variabel alat desain menyimpang dari token kode | Desainer dan developer memakai nilai berbeda | §14A, V18 |
| F25 | Perubahan visual tak sengaja lolos ke rilis | Regresi baru ketahuan di produk | §14B, V19 |
| F26 | Seluruh pustaka ikut terbundel; font berat | Performa produk turun | §14C, V20 |
| F27 | Major baru tanpa jalur migrasi | Produk berhenti upgrade; versi terfragmentasi | §15A, V21 |
| F28 | Tidak jelas siapa boleh berkontribusi dan bagaimana | Tim produk membuat komponen sendiri | §15B |
| F29 | Adopsi tidak diukur | Keberhasilan sistem hanya klaim | §15C |
| F30 | Setiap run menulis ulang solver, validator, build, dan situs; hasil berbeda antar run dan run berhenti di tengah | Spek bagus tidak pernah sampai ke keluaran (TGC 2.1.0: 20/98 komponen, 0/32 pattern) | `tools/`, R17, tier §16.5 |
| F31 | Skala tipe archetype tidak lengkap; token tipe sisanya dikarang | Hierarki terbalik (h3 < body-lg) | `catalog/archetypes.json`, VB1 |
| F32 | Tingkat elevasi tidak dideklarasikan | Elevasi duplikat, kedalaman tidak terbaca | M01 §4.5, VB2 |
| F33 | Hex mentah di lapis semantik | Arsitektur 3 lapis runtuh; brand dan tema tidak bisa diganti | V1 diperketat |
| F34 | Pemeriksaan kebocoran hanya di dokumen | Istilah proyek lain bocor di kode situs | V3 seluruh paket |
| F35 | Gerbang gagal tetap lanjut | Paket dengan ratusan pelanggaran aksesibilitas dikirim | blocking vs advisory §16.3 |
| F36 | Adapter library ditulis ulang tiap proyek; default library melanggar baseline (14px, darkAlgorithm) | Bug yang sama berulang di setiap produk | `adapters/`, M10 §14.5 |
| F37 | Temuan dari run tidak kembali ke engine | Engine tidak belajar | R19, `engine-findings/` |

## Menambah atau mengganti bahasa desain

- **Mengganti bahasa untuk proyek yang sama:** ubah B6 di brief, jalankan ulang dari Phase 0B. Data domain (B2, B3, B5, B7) tidak berubah; token, komponen, dan dokumen dihasilkan ulang. Bandingkan dua hasil lewat `verification-report.md` masing-masing.
- **Menambah archetype baru ke perpustakaan:** tambahkan satu baris di **setiap** tabel §4.5(a), (b), dan (c1)-(c10), satu baris di tabel skor §4.6, dan satu fixture di `golden-briefs.md`; wajib memenuhi baseline (teks isi ≥ 16, kontras 4.5:1, target 44×44) dan menyediakan nilai untuk L1-L17. Uji dengan brief contoh lewat Phase 0B dan V13 sebelum dipakai.
- **Bahasa kustom per organisasi:** simpan `design-language.json` yang sudah disetujui sebagai lapis org berversi, lalu pakai `language_mode: inherit` dengan `inherits_from` di brief proyek-proyek berikutnya (§4.8) agar konsisten antar produk.

## Riwayat engine

**1.8.0**

- Ditambahkan: **alat engine yang jalan** (`resolve-language`, `derive-tokens`, `build`, `compose`, `render-previews`, `render-site`, `qa`, `validate`, `score`, `run-fixtures`, `check-catalog`, `check-patterns`) dan R17 · **katalog kanonis** 74 komponen + 21 pattern (`catalog/`), lolos checker · **implementasi referensi html-first** 74 komponen, lolos QA Chromium + axe di 4 archetype · **skema JSON jadi** (17) · **adapter library** A01-A04 (AntD 6.6.5, MUI 7.3.11, Tailwind 4.3.3 lolos type-check/compile) · **golden fixtures yang bisa dijalankan** (13 fixture, 109 asersi) · **tier pengiriman** T0-T3 (§16.5) dan R18 · **gerbang kualitas visual** VB1-VB12 (§13.4) dan DoD-21/22 · **gerbang blocking** (§16.3) · **temuan engine** R19 dan `engine-findings/` · rubrik kematangan dan tinjauan visual · `SKILL.md` · 6 pattern dasar baru: AppNavigation (R), DetailView, MasterDetail, Dashboard (S), DataStory, PermissionRequest (O) · token baru: `target-current` (runtime), `timing-*`, `focus-ring-width/offset`, `shape-circle`, lapis komponen `button-*`, `control-*`, `row-*`, `nav-item-*`, `attention-c1..c6-*` · brief skema 1.5 (`delivery_tier_target`, `adapters`, `themes[].base`, `include`, `pattern_include`, `brief.normalized.json`).
- Diperbaiki: skala tipe 9 token per archetype (F31) · jumlah tingkat elevasi eksplisit (F32) · semantik wajib alias primitif (F33) · cakupan V3 (F34) · syarat data-viz sekuensial yang mustahil · rotasi urutan kategori data-viz terhadap warna interaksi · aturan fokus Form/ErrorSummary · indeterminate hanya Checkbox · blokir input dengan `aria-disabled` · panah hanya untuk widget komposit · offline dan forbidden di §12.2 · aturan fokus perpindahan rute · penutupan dependensi komponen · ramp warna terpisah terang/gelap · token komponen ter-resolve ulang di region bersarang · bayangan dicerminkan di RTL · daftar lengkap di `engine-findings/findings-1.8.0.md`.
- Ditemukan oleh demo end-to-end (brief G1 → `score`) dan diperbaiki sebelum rilis: fixture referensi yang membawa konten domain run sebelumnya (EF-041, lint `leak-terms.json`), selector QA yang tidak ikut namespace (EF-042), bundle preview yang memuat semua 74 komponen alih-alih {N} (EF-043). Hasil demo setelah perbaikan: tier T3, skor 23/24, QA browser PASS di 62 halaman.
- Diubah: P01 menjadi 1.1.0 (Dashboard memperluas pattern dasar, `engine_min` 1.8.0). Pack lain tidak berubah.

**1.7.0**

- Ditambahkan: definisi konflik antar pack (hasil berbeda untuk elemen atau override yang sama, bukan sekadar surface yang sama), pernyataan kompatibilitas di setiap pack, dan pertanyaan blocking untuk pack tanpa surface yang cocok (§0 aturan 6) · komponen bersama antar pack lewat header `shares` (§0 aturan 8) · V22 memeriksa nama komponen ganda · Phase 7 ikut memuat pack · pack P03 `b2c-media-social` 1.0.0 · P01, P02, P04 menjadi 1.0.1 (pernyataan kompatibilitas, perbaikan teks) · fixture G15.

**1.6.1** (patch)

- Tabel pack di core tidak lagi memuat status; ketersediaan dibaca dari folder `packs/` dan README. Definisi versi patch ditambahkan di §0. Tidak ada aturan yang berubah.
- Pack baru P02 `b2c-commerce` 1.0.0 (engine_min 1.6.0): 14 aturan domain, 21 komponen, 17 pattern, 9 pemeriksaan. Fixture G14.

**1.6.0**

- Ditambahkan: pack P01 `b2b-ops` 1.0.0 (13 aturan domain, 19 komponen, 14 pattern, 9 pemeriksaan) · aturan §0 bahwa pack dengan cakupan surface berbeda tidak bertentangan, dan bahwa komponen atau pattern domain yang sama fungsinya dengan milik pack memakai milik pack (§0 aturan 7, §6.2 langkah g) · fixture G13 dan varian dua pack di G12.

**1.5.0**

- Ditambahkan: mekanisme domain pack (§0, prioritas PACK, V22, DoD-20) dan pack pertama P04 `b2g-public-service` · reference web `html-first` (§6.4) untuk progressive enhancement · delapan komponen inti baru: SkipLink, VisuallyHidden, LiveAnnouncer, ErrorSummary (R), PasswordInput, FormattedInput, Image (S), Tree (O): katalog 66 → 74 · brief B7 `component_packs` dan `pack_config` (skema 1.4) · `assemble.mjs` menerima ID pack · fixture G12.

**1.4.0**

- Diubah: prompt monolit dipecah menjadi core (selalu dimuat) dan 14 modul yang dimuat per fase. Isi aturan tidak berubah; nomor § tetap.
- Ditambahkan: protokol pemuatan modul dan peta section → modul (§0) · kolom "Modul" di tabel fase (§16.4) · ringkasan validator di core, kriteria lengkap di M13 · pemeriksaan versi modul di Phase 0 dan V14 · `tools/assemble.mjs` untuk mode monolit.

**1.3.0**

- Ditambahkan: pernyataan lingkup engine (§1) dan keluaran F (ekosistem) · matriks dukungan browser dan OS serta aturan format warna `tokens.css` (§8.3) · paritas alat desain: variabel, style, properti komponen, pemetaan kode, drift (§14A) · regresi visual dan interaksi serta pipeline CI (§14B) · anggaran performa (§14C) · distribusi, kanal rilis, `changes/`, codemod, lint konsumen (§15A) · model kontribusi (§15B) · metrik adopsi dan halaman Kesehatan sistem (§15C) · pencarian offline dan tabel props otomatis di situs (§16.2) · V18-V21, DoD-18, DoD-19 · brief B4 alat desain, registry, CI dan B11 organisasi.

**1.2.0**

- Ditambahkan: keputusan bahasa L14-L17 (adaptasi platform, material, umpan balik interaksi, komposisi layout) beserta nilainya untuk semua archetype (§4.5(c10)) · empat archetype ekspresif: `quiet-luxury`, `playful-vivid`, `immersive-glass`, `neo-brutalist` · token material, state layer, haptic, suara, `highlight`, `skeleton`, `aspect-*`, `layout-content-max`, `space-section*`, `color-brand-{default,subtle,on}` · pasangan kontras komposit, translucency, blok merek, dan simulasi buta warna · 21 komponen baru termasuk primitif layout (45 → 66) · konvensi API komponen (§6.8) dan model state (§6.9) · katalog 15 pattern (§11.2-11.3) · preferensi pengguna dan forced colors (§9.3), matriks uji teknologi bantu (§9.4), manajemen fokus (§9.5) · lokalisasi, RTL, dan glosarium (§12.4-12.5) · safe area dan keyboard virtual (§8.3) · pemetaan haptic dan perilaku selalu-native (§14.3) · V17, DoD-16, DoD-17 · seksi API pada halaman komponen (17 → 18 seksi).
- Diperbaiki: rumus tinggi baris §4.5(c2) kini membulatkan ke genap terdekat sehingga cocok dengan tabel (b).

**1.1.0**

- Ditambahkan: versi engine dan kompatibilitas (§0) · mode jalan `regenerate`, `brownfield`, `tenant-add` (§2.6) · `language_mode: inherit` dan lapisan org → produk → brand (§4.8) · spesifikasi archetype lengkap §4.5(c) · sumbu mode theme/brand/density (§5.9) · token `text-placeholder`, `text-disabled`, `scrim`, `selection`, `shadow`, `focus-ring-inverse`, `on-{positive,info,neutral-negative}`, `chart-hatch-line`, `icon-stroke`, `layout-row-height`, `layout-measure` · komponen TextArea (R), Menu (S), PinInput (O): katalog 42 → 45 · kontrak data §16A dan R16 · V14-V16, DoD-14, DoD-15 · `report_language` · `golden-briefs.md`.
- Diperbaiki: istilah domain yang bocor di §5.6 dan contoh copy §10/§12 · definisi "mobile" di STD-4 kini berbasis modalitas input · pasangan kontras untuk `surface-overlay`, placeholder, `selection`, dan fokus di atas fill · `components.json` dan `lifecycle.json` kini ada di struktur paket · I9 dan overlay stagnasi kini punya field brief yang jelas.

**1.0.0** · versi awal (tanpa nomor).

Tabel migrasi brief ada di §2.7 (modul M00).
