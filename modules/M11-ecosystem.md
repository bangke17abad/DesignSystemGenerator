<!-- ds-module id="M11" name="ecosystem" engine="1.8.0" sections="§14A-14C, §15" -->
# Modul M11 · Alat desain, regresi, performa, governance, distribusi

> Bagian dari Universal Design System Generator, engine `1.8.0`. Berisi §14A-14C, §15. Dimuat di fase: 9, 10, 13. Core menang bila bertentangan; modul ini hanya merinci.

---

# 14A. PARITAS ALAT DESAIN `[ENGINE]` + `[BRIEF]`

Berlaku bila B4 `design_tool` bukan `none`. Sumber kebenaran tetap `tokens.json` dan `components.json`; alat desain adalah konsumen. Perubahan yang dibuat di alat desain kembali lewat change request (§15B), tidak langsung ke file token.

1. **Variabel.** `design-tool/variables.json` (tipe §16A) dibangun dari `tokens.json`:

   | Lapis token | Koleksi | Mode | Publikasi |
   |---|---|---|---|
   | primitif | `primitive` | satu mode | disembunyikan; hanya menjadi target alias |
   | semantik warna | `color` | tema | dipublikasikan |
   | brand | koleksi `brand` terpisah, atau mode tambahan di `color` | brand | sesuai batas mode alat desain |
   | ukuran dan ruang | `size` | kepadatan | dipublikasikan |
   | komponen | `component` | mengikuti alias | dipublikasikan |

   Variabel semantik selalu alias ke primitif, sama dengan rantai alias di `tokens.json`. Setiap variabel diberi scope (warna teks hanya untuk isi teks, `space-*` hanya untuk gap dan padding, `radius-*` hanya untuk sudut) agar tidak dipakai di peran lain (I3). Bila kombinasi brand × tema melebihi B4 `design_tool_limits.max_modes`, brand menjadi koleksi sendiri; bila batasnya tidak diketahui, catat `A-nn`.
2. **Style.** Token tipe menjadi text style (nama = token, mis. `type/body`), elevasi menjadi effect style, grid §8.1 menjadi layout grid. Tidak ada style warna lepas yang menduplikasi variabel.
3. **Properti komponen.** `design-tool/component-properties.json`: nama komponen identik dengan manifest; properti alat desain = props §6.8 dengan nama yang sama (`variant` dan `size` sebagai variant property; `disabled`, `loading`, `selected` sebagai boolean; `label` sebagai teks; `iconStart` dan `iconEnd` sebagai instance swap). State interaksi (hover, pressed, focus) menjadi variant `state` karena alat desain tidak punya state runtime.
4. **Pemetaan kode.** `design-tool/code-connect.json` memetakan setiap komponen alat desain ke path dan props di setiap target. Berkas pemetaan khusus alat (mis. Code Connect) hanya dibuat untuk target yang didukung alat itu; dukungannya diberi label "Not verified against the pinned version".
5. **Penerapan.** Engine tidak menggambar file desain. Bila lingkungan punya akses tulis ke alat desain (mis. lewat konektor) **dan** pengguna mengonfirmasi, engine boleh menerapkan variabel dan style langsung. Selain itu engine hanya menulis berkas impor dan `design-tool/README.md` berisi langkah impor.
6. **Drift.** Bila B4 `design_tool_export` diisi, V18 membandingkan ekspor itu dengan `tokens.json` dan `components.json`, lalu menulis `reports/design-tool-drift.md` (variabel hilang, nilai berbeda, alias putus, nama properti berbeda). Tanpa ekspor: bagian drift NOT RUN.

---

# 14B. REGRESI DAN PIPELINE `[ENGINE]`

1. **Regresi visual web.** `tests/visual/` (Playwright): setiap preview komponen dan pattern di setiap kombinasi brand × tema, pada viewport 390×844, 820×1180, dan 1440×900. Font lokal, animasi dimatikan, caret disembunyikan, waktu dan data acak dibekukan. Ambang: maksimal 0.1% piksel berbeda per tangkapan. Baseline hanya diperbarui bersama entri `CHANGELOG.md` yang menyebut komponennya.
2. **Regresi interaksi.** `tests/interaction/` dibangkitkan dari seksi Behaviour di `components.json`: setiap baris keyboard (tombol → hasil) menjadi satu tes, ditambah tes fokus kembali ke pemicu untuk setiap overlay dan tes §9.5 untuk setiap pattern.
3. **Native.** Golden test per brand × tema (§14.4) memakai font yang di-bundle dan ukuran perangkat tetap.
4. **Pipeline.** `ci/pipeline.md` menulis tahap generik: pasang dependensi ter-pin → generate token dan pastikan tidak ada diff (R1) → lint (V6) → build → validator V1-V22 → regresi visual dan interaksi → anggaran (V20) → publikasi hanya dari tag rilis (§15A). Bila B4 `ci_platform` diisi, tulis juga konfigurasi untuk platform itu, berlabel "Not verified" karena tidak dijalankan engine.
5. Tes yang tidak dapat dijalankan di lingkungan generator tetap ditulis lengkap dan dilaporkan NOT RUN, tidak dihapus.

---

# 14C. ANGGARAN PERFORMA `[ENGINE]` + `[BRIEF]`

Default di bawah boleh diganti B8 `performance_budgets`; pelonggaran wajib ADR. Ukuran diukur setelah gzip dari keluaran build nyata (V20) dan ditulis ke `reports/perf-report.md`.

| Item | Default |
|---|---|
| Paket token web (CSS + JS) | ≤ 30 KB |
| Paket komponen web, tanpa framework | ≤ 120 KB untuk seluruh `{N}`; ESM, dapat di-tree-shake, `sideEffects` hanya CSS |
| Biaya impor satu komponen (median) | ≤ 8 KB |
| Font untuk render pertama | maks 2 keluarga × 2 bobot, woff2 ter-subset, total ≤ 150 KB; bobot lain dimuat saat dibutuhkan |
| Ikon | diimpor per ikon, bukan font ikon atau sprite penuh |
| Pergeseran layout karena font | fallback memakai `size-adjust` dan override metrik; CLS halaman dokumentasi ≤ 0.05 |
| Interaksi situs dokumentasi | INP ≤ 200 ms di perangkat menengah: Not verified: needs device test |

Native: hanya aset font dan ikon yang dipakai yang di-bundle; ukuran paket dilaporkan tanpa ambang default kecuali brief memberinya.

---

# 15. GOVERNANCE DAN VERSI `[ENGINE]`

Dokumen 85. Sistem yang matang punya aturan perubahan. **Keputusan organisasi yang tidak ada di brief** (pemilik, SLA tinjauan, kebijakan deprecation) ditandai sebagai usulan dan dicatat sebagai asumsi `A-nn` berstatus "needs owner confirmation", bukan dikarang sebagai fakta.

1. **Versioning.** Semantic versioning untuk `tokens.json` dan paket komponen: rename token = major; nilai berubah = minor kecuali kontras turun di bawah baseline = major; penambahan = minor; penghapusan = major dan didahului status `deprecated` minimal satu minor; penambahan brand = minor. `package_version` terpisah dari versi engine (§0) dan versi lapis org (§4.8).
2. **Definisi Stable.** Gerbang yang harus lolos (R12) dan siapa yang menandatangani.
3. **Proses perubahan.** Template change request: masalah, token/komponen terdampak, bukti kontras, dampak ke setiap target, rencana migrasi.
4. **Deprecation.** Format pemberitahuan, masa transisi usulan, catatan migrasi.
5. **Changelog.** Format Keep a Changelog di `reports/CHANGELOG.md`, dimulai dari versi pertama.
6. **ADR.** Satu berkas ringkas per keputusan penting: ADR-L1 (bahasa desain dan koherensi), serta ADR untuk library fondasi, penyesuaian baseline, dan penyimpangan dari bahasa (R14).
7. **Perubahan bahasa desain.** Mengganti archetype atau mengubah ≥ 3 keputusan L2-L12 dan L14-L17 = perubahan **major** (token dan tampilan berubah); wajib ADR, laporan kontras baru, dan migrasi.
8. **Proposed additions.** Tempat parkir untuk komponen di luar `{N}` (R6).
9. **Lapis org dan tenant.** Pemilik lapis org, proses persetujuan brand baru, dan siapa yang boleh menjalankan `tenant-add` adalah keputusan organisasi: diusulkan dan dicatat `A-nn`.


## 15A. Distribusi dan rilis

1. **Paket per target.** Web: `@{ns}/tokens` (CSS, JSON, konstanta JS) dan `@{ns}/<framework>` (komponen, satu pintu masuk, ESM). Native mengikuti §14.2. `{ns}` ditulis huruf kecil sesuai konvensi registry.
2. **Registry** dari B4 `package_registry`. Kosong = paket ditulis sebagai arsip di `packages/` tanpa dipublikasikan, dicatat `A-nn`. Engine tidak pernah mempublikasikan; publikasi hanya dari pipeline (§14B) pada tag rilis.
3. **Kanal.** `latest` untuk rilis stabil; `next` untuk pra-rilis (`x.y.z-next.n`). Lama dukungan major sebelumnya diambil dari B11 `lts_policy`; kosong = usulan 6 bulan, dicatat `A-nn`.
4. **Catatan perubahan.** Setiap perubahan menulis satu berkas di `changes/` (komponen terdampak, jenis semver, catatan migrasi). `CHANGELOG.md` dan kenaikan versi dihitung dari berkas itu, konsisten dengan §15 butir 1.
5. **Deprecation di kode.** Anotasi bahasa target (`@deprecated` JSDoc, `@Deprecated` Dart dan Kotlin, `@available(*, deprecated)` Swift) dengan pengganti dan versi penghapusan; token deprecated tetap ada sebagai alias (§2.6).
6. **Codemod.** Setiap major menulis `codemods/<dari>-<ke>/` yang dibangkitkan dari `migration-map.json`: transformasi kode web (nama token, prop, impor) dengan dry-run sebagai default, serta skrip cari-ganti dan checklist manual untuk target native. Setiap codemod punya fixture sebelum/sesudah di `codemods/__fixtures__/` (V21).
7. **Lint untuk konsumen.** Konfigurasi lint (mis. ESLint dan Stylelint) dibangkitkan dari `lint-rules.json`: hanya impor dari pintu masuk paket, tanpa hex, nama token valid, peringatan untuk token dan prop deprecated. Untuk target native ditulis spesifikasinya.

## 15B. Model kontribusi

1. **Model** dari B11 `governance_model`: `centralized` (tim inti membangun semua), `federated` (tim produk berkontribusi, tim inti meninjau), atau `hybrid`. Kosong = usulan `hybrid`, dicatat `A-nn`.
2. **Alur:** usulan (RFC) → triase → desain dan build di cabang → tinjauan → `Draft` → `Reviewed` → `Stable` (R12). Komponen baru wajib lolos tiga uji §6.2 dengan bukti dari produk nyata.
3. **Berkas:** `governance/CONTRIBUTING.md` (alur, peninjau, definisi selesai); `governance/rfc-template.md` (masalah, bukti pemakaian, usulan API sesuai §6.8, rencana aksesibilitas, dampak token per brand × tema, rencana migrasi); `governance/review-checklist.md` (Quality Gate §13, validator relevan, skenario §9.4); template isu: bug, permintaan, aksesibilitas.
4. **Peran dan SLA** (pemelihara, peninjau aksesibilitas, perwakilan produk, waktu triase) dari B11; selebihnya usulan berlabel `A-nn`.

## 15C. Metrik adopsi

| Metrik | Cara menghitung | Sumber |
|---|---|---|
| Cakupan komponen | elemen UI dari paket sistem ÷ seluruh elemen interaktif di kode produk | analisis statis repo produk |
| Kepatuhan token | nilai warna, ukuran, dan jarak berupa token ÷ seluruh nilai | lint konsumen |
| Ketertinggalan versi | selisih major dan minor versi terpasang terhadap versi terbaru | manifest dependensi produk |
| Pemakaian deprecated | jumlah token, prop, dan komponen deprecated yang dipakai | lint konsumen |
| Instance terlepas | instance di alat desain yang dilepas dari komponen pustaka | ekspor atau API alat desain; Not verified bila tidak tersedia |
| Cacat aksesibilitas | temuan terbuka dari `at-test-plan.md` dan audit produk | laporan uji |

`tools/adoption-scan.mjs` membaca repo yang terdaftar di B11 `consumer_products` dan menulis `reports/adoption-report.md`. Tanpa repo yang bisa dibaca, skrip tetap ditulis dan laporannya NOT RUN. Target angka adalah keputusan organisasi (B11 `adoption_targets`; kosong = `A-nn`). Situs dokumentasi punya halaman "Kesehatan sistem" yang dirender dari laporan terakhir.
