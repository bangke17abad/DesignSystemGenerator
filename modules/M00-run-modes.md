<!-- ds-module id="M00" name="run-modes" engine="1.9.0" sections="§2.6-2.7" -->
# Modul M00 · Mode jalan dan migrasi brief

> Bagian dari Universal Design System Generator, engine `1.9.0`. Berisi §2.6-2.7. Dimuat di fase: 0R, 0, 0A bila `run_mode` bukan `greenfield` atau skema brief lebih lama dari 1.3. Core menang bila bertentangan; modul ini hanya merinci.

---

## 2.6 Mode jalan (`run_mode`, B0)

| Mode | Kapan | Input tambahan | Urutan fase | Keluaran tambahan |
|---|---|---|---|---|
| `greenfield` (default) | belum ada design system | - | 0 → 15 | - |
| `regenerate` | paket hasil engine ini sudah ada; brief, bahasa desain, atau engine berubah | `existing_package` | 0R → 0 → 15 | `reports/regeneration-diff.md`, `migration-map.json` |
| `brownfield` | produk sudah berjalan dengan token, CSS, komponen, atau file desain sendiri | `brownfield_sources` | 0 → 0A → 0B → 15 | `reports/brownfield-audit.md`, `migration-map.json`, `reports/codemod-plan.md` |
| `tenant-add` | menambah satu brand atau tenant ke paket yang sudah ada | `existing_package` + entri baru di B6 `brands` | 0R → 1 (hanya token brand baru) → 12 → 13 → 14 → 15 | entri `CHANGELOG.md`, bagian brand baru di `contrast-report.md` |

**Aturan `regenerate`:**

1. Baca `manifest.json` lama. Bila `engine_version` berbeda major, tulis `reports/engine-migration.md` lebih dulu (§0).
2. Dipertahankan apa adanya: `CHANGELOG.md` (hanya ditambah), ADR, entri register berstatus `confirmed` atau `rejected`, dan isi **zona manual** byte-identik. Zona manual ditandai `<!-- ds:manual:start id="..." -->` … `<!-- ds:manual:end -->` (di JSON: field `manual_notes`). Di luar zona manual, semua file di `manifest.generated` ditulis ulang.
3. Token tidak pernah dihapus diam-diam: token yang tidak lagi dihasilkan tetap ada sebagai alias berstatus `deprecated` (`$extensions.ds.deprecated`) selama minimal satu minor, lalu dihapus di major berikutnya.
4. Status `Stable` dipertahankan hanya bila komponen masih lolos semua validator; selain itu turun ke `Reviewed` dengan alasan tertulis.
5. Kenaikan `package_version` dihitung dari diff memakai §15.1, bukan dipilih.

**Aturan `brownfield` (Phase 0A):**

1. Inventaris dari `brownfield_sources`: semua warna unik (dikelompokkan bila jarak OKLab < 0.02), ukuran dan tinggi baris teks, spasi, radius, bayangan, durasi, breakpoint, dan komponen yang ditemukan (dipetakan ke katalog §6.1 atau calon komponen domain §6.2).
2. Setiap nilai diberi tepat satu keputusan: `keep` (menjadi primitif atau brand seed), `merge` (ke token dengan peran yang sama; bila perannya tidak jelas, ke nilai terdekat; sebutkan tujuannya), `drop` (dengan alasan), atau `violation` (melanggar baseline, invarian, atau larangan bahasa terpilih; **tidak** dipertahankan, dicatat dengan nilai pengganti dan aturan yang dilanggar).
3. Warna merek yang ditemukan diperlakukan sebagai brand seed (§4.6 langkah 5): tidak diubah diam-diam.
4. Bila B6 `language_mode: derive` tanpa skor `personality`, skor diusulkan dari metrik inventaris (radius median, kepadatan spasi, jumlah warna aksen, pemakaian bayangan) dan dicatat `A-nn` berstatus "needs owner confirmation".
5. `migration-map.json` memetakan setiap nilai, kelas, variabel, dan komponen lama ke token atau komponen baru; `codemod-plan.md` berisi pola cari-ganti per target. Engine tidak menjalankan codemod pada kode produk.

**Aturan `tenant-add`:** hanya token yang `varies_by` memuat `brand` boleh berubah (§5.9); V1 dan V2 dijalankan untuk brand baru di semua tema; bila brand baru memicu penyesuaian hue semantik global (§5.3 langkah 1), mode berubah menjadi `regenerate` dan versi paket naik sesuai §15.1; selain itu naik minor.

## 2.7 Migrasi brief

Dijalankan di Phase 0; setiap baris yang dipakai dicatat `A-nn`.

| Field 1.0 | Field 1.1 | Aturan |
|---|---|---|
| (tidak ada) | B0 `brief_schema_version` | kosong = 1.0 |
| (tidak ada) | B0 `run_mode` | default `greenfield` |
| B6 `brand_seed` | B6 `brands[0]` dengan `id: default` | disalin apa adanya |
| B3 `density` (satu nilai) | B3 `density_modes` | `[nilai]` |
| (tidak ada) | B3 `surface_type` | diturunkan dari `domain_summary` dan role surface |
| (tidak ada) | B5 `entities[].stagnation_threshold` | kosong = tanpa overlay stagnasi |
| (tidak ada) | B1 `report_language` | default Indonesia |

**Migrasi brief 1.1 → 1.2.** Semua field baru opsional, sehingga tidak ada `A-nn` yang muncul hanya karena migrasi.

| Field 1.1 | Field 1.2 | Aturan |
|---|---|---|
| (tidak ada) | B1 `glossary_seed` | kosong = glosarium diturunkan dari brief (§12.5) |
| (tidak ada) | B5 `critical_events[].sound_asset` | kosong = bunyi sistem platform; dicatat `A-nn` hanya bila event meminta suara |
| (tidak ada) | B7 `pattern_exclusions`, `domain_patterns` | kosong = pattern dasar dipilih menurut §11.2 |
| `language_overrides` L1-L13 | L1-L17 | L14-L17 diambil dari archetype (§4.5(c10)) |

**Migrasi brief 1.2 → 1.3.** Semua field baru opsional; tidak ada `A-nn` yang muncul hanya karena migrasi.

| Field 1.2 | Field 1.3 | Aturan |
|---|---|---|
| (tidak ada) | B4 `design_tool`, `design_tool_limits`, `design_tool_export` | kosong = `none`; §14A tidak dijalankan |
| (tidak ada) | B4 `package_registry`, `ci_platform` | kosong = paket tidak dipublikasikan; pipeline hanya ditulis generik |
| B8 `performance_budgets` (bebas) | B8 `performance_budgets` (`{item, limit, reason}`) | entri bebas dibaca sebagai `reason`; anggaran default §14C tetap berlaku |
| (tidak ada) | B11 organisasi | kosong = usulan engine berlabel `A-nn` di §15B dan §15C |

**Migrasi brief 1.3 → 1.4.** Semua field baru opsional; tidak ada `A-nn` yang muncul hanya karena migrasi.

| Field 1.3 | Field 1.4 | Aturan |
|---|---|---|
| B4 `primary_web_reference` | B4 `primary_web_reference` (+ nilai `html-first`) | nilai lama tetap berlaku |
| (tidak ada) | B7 `component_packs`, `pack_config` | kosong = tanpa pack |

**Migrasi brief 1.4 → 1.5 (engine 1.8.0).** Semua field baru opsional; tidak ada `A-nn` yang muncul hanya karena migrasi.

| Field 1.4 | Field 1.5 | Aturan |
|---|---|---|
| (tidak ada) | B0 `delivery_tier_target` | kosong = T2 (§16.5) |
| (tidak ada) | B4 `adapters` | kosong = tanpa adapter library |
| (tidak ada) | B6 `themes[].base` | Light/Dark/High-contrast/Outdoor diturunkan otomatis; nama lain wajib (pertanyaan blocking bila kosong) |
| (tidak ada) | B7 `include`, `pattern_include` | kosong = tingkat O hanya dari kondisi otomatis §6.1 / §11.2 |
| brief Markdown | `brief.normalized.json` | ditulis Phase 0; skema `schemas/brief.normalized.schema.json` |

