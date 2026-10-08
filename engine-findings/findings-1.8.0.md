# Temuan engine yang ditangani di 1.8.0

Sumber: audit 1.7.0 (run TGC 2.1.0, Unigal, AOS 2.0.1, PMS 1.1.1), pembuatan katalog kanonis (11 agent), implementasi referensi dan QA (10 agent), verifikasi adapter.

## Ditutup di 1.8.0

| ID | Temuan | Perbaikan |
|---|---|---|
| EF-001 | Engine hanya membawa `assemble.mjs`; solver palet, validator, build, dan situs ditulis ulang tiap run (hasil tidak deterministik, run berhenti di 20/98 komponen) | `tools/` lengkap + R17 |
| EF-002 | Skala tipe archetype hanya 6 langkah dari 9 token; `body-lg`, `label`, `code` dikarang run → h3 17 < body-lg 18 di TGC | `catalog/archetypes.json` 9 token, VB1 blocking |
| EF-003 | `elevation-3` "-" di 7 archetype tanpa aturan → elevation-2 == elevation-3 di TGC | jumlah tingkat eksplisit, VB2 |
| EF-004 | V1 tidak mewajibkan semantik alias primitif → 70 hex mentah di lapis semantik TGC | V1 diperketat, ramp primitif terang/gelap |
| EF-005 | Cakupan V3 hanya dokumen → "Unigal" bocor di `tools/site/app.js` | V3 seluruh file teks paket |
| EF-006 | Gerbang FAIL "lanjut setelah 3 iterasi" → paket dengan 837 pelanggaran axe dikirim | blocking vs advisory, §16.3 |
| EF-007 | Tidak ada strategi kapasitas sesi → komponen terpotong acak | tier T0-T3 (§16.5), R18 |
| EF-008 | Golden fixtures prosa, tidak bisa dijalankan | `fixtures/` + `run-fixtures.mjs` (109 asersi) |
| EF-009 | Tidak ada adapter library; AntD `darkAlgorithm` menggeser primary, `hashed:false` membocorkan token, `colorError` dipakai sebagai teks 4.29:1 (PMS) | `adapters/A01-A04`, type-check nyata |
| EF-010 | Syarat data-viz sekuensial "tiap langkah ≥ 3:1 terhadap tetangga" mustahil (5 langkah × 3:1 > 21:1) | ΔL ≥ 0.08 + langkah terkuat ≥ 3:1 |
| EF-011 | `chart-cat-1` bisa sama hue dengan warna interaksi (data terbaca sebagai tautan) | rotasi urutan kategori |
| EF-012 | Tidak ada gerbang kualitas visual; semua UB soal kepatuhan | VB1-VB12, `rubric/visual-review.md` |
| EF-013 | Perbaikan dari run (AOS, PMS) tidak kembali ke engine | R19 + folder ini |
| EF-014 | `target-current` dipakai di kontrak tetapi bukan token | token runtime `target-current` |
| EF-015 | Durasi tooltip/toast/debounce/typeahead ditulis sebagai angka ajaib di komponen | token `timing-*` |
| EF-016 | `radius-full` = 0 di neo-brutalist membuat radio persegi | token `shape-circle` |
| EF-017 | Tidak ada token tebal/offset ring fokus | `focus-ring-width`, `focus-ring-offset` |
| EF-018 | Aturan fokus Form (field pertama) vs ErrorSummary (ringkasan) bertentangan | aturan tunggal klien/server §6.5 |
| EF-019 | `aria-disabled` saja tidak memblokir input | readonly / script / fallback §6.4 |
| EF-020 | `aria-checked="mixed"` diterapkan ke Switch dan Radio (tidak didukung ARIA) | hanya Checkbox |
| EF-021 | Panah wajib di semua navigasi, padahal Breadcrumb/Pagination/Stepper adalah daftar tautan | panah hanya untuk widget komposit |
| EF-022 | SearchField dengan saran tidak punya aturan (searchbox vs combobox) | Combobox di landmark search |
| EF-023 | Komponen tingkat O bergantung pada tingkat S yang bisa dikecualikan (CommandPalette → Kbd, Menu → Sheet) | penutupan dependensi §6.7, `compose.mjs` |
| EF-024 | §12.2 offline selalu antre vs FormFlow (antre hanya bila OfflineSync) | §12.2 diperjelas |
| EF-025 | §12.2 tanpa baris Forbidden (tautan langsung ke sumber terlarang) | baris Forbidden |
| EF-026 | §9.5 "fokus ke h1 atau umumkan judul" (dua pilihan) | aturan tunggal |
| EF-027 | M08 tidak punya pattern navigasi/IA, detail, master-detail, dashboard, data-viz, izin | 6 pattern dasar baru |
| EF-028 | Nama pattern dasar `Dashboard` bentrok dengan P01 | P01 1.1.0 memperluas pattern dasar |
| EF-029 | Token komponen `var()` di `:root` tidak ter-resolve ulang di region `[data-theme]` bersarang | dideklarasikan di setiap scope mode |
| EF-030 | Bayangan berarah tidak dicerminkan di RTL | blok `[dir="rtl"]` di tokens.css |
| EF-031 | `border-strong` nyaris sama dengan `border` di ink Light | langkah ramp disesuaikan, VB9 |
| EF-032 | Generator Figma crash pada token warna komponen; `transparent` menjadi kode native invalid | diperbaiki agent adapter |
| EF-033 | Tidak ada pasangan kontras untuk ikon status di `surface-overlay` dan hover destruktif | ditambahkan ke §5.5 |
| EF-034 | V22 mencocokkan kata prosa ("Board") sebagai jejak pack | V22 hanya identifier |
| EF-035 | Bundle referensi melebihi anggaran 120 KB | minifikasi bundle (94 KB) |
| EF-036 | Seed merek tidak dipakai persis di tema gelap walau lolos | solver memakai seed di semua tema non-HC |
| EF-037 | Aksen merek non-teks diuji terhadap surface sunken | diuji terhadap base dan raised |
| EF-038 | Lint magic-px tidak menangkap nilai negatif (`-2px`) di komponen referensi | regex `ref-check` menangkap `-Npx`; offset fokus inset jadi `calc(-1 * var(--focus-ring-width))` (List, Modal, PrimaryNav, SkipLink, Table) |
| EF-039 | Lingkaran semantik masih `--radius-full` (spinner Button, avatar Skeleton/List, dot List) | `--shape-circle` |
| EF-040 | Tidak ada skor kematangan per dimensi; tier saja tidak menunjukkan di mana paket tipis | `tools/score.mjs` + `rubric/maturity-rubric.md` |
| EF-041 | 27 fixture referensi membawa konten demo klub golf dari run TGC; paket baru ketularan (V3 R15 di demo end-to-end) | fixture dinetralkan (booking venue), `leak-terms.json` + lint di `ref-check` |
| EF-042 | Selector QA (caption, `data-ds-scroll`, demo label) tidak ikut namespace `--ns` → ribuan false positive teks kecil dan RTL | QA membaca namespace dari halaman |
| EF-043 | Preview dan bundle selalu memuat 74 komponen walau {N} lebih kecil → 149 KB gzip > anggaran 120 KB | `render-previews` default ke {N} dari `manifest.json` |
| EF-045 | Komponen referensi memakai garis aksen satu sisi untuk current/selected (AppShell, PrimaryNav, List, Tree, ContextPanel, CommandPalette, Combobox, BottomNav sheet, Tabs vertikal); halaman FT Admin mewarisinya dan menambah garis atas di kartu tahap | dihapus semua; ganti latar selection + bobot label atau ring penuh; VR-16 + detektor `tools/lib/stripes.mjs` di `ref-check` dan V6 |
| EF-044 | Nav AppShell di halaman (bukan demo) berhenti setinggi daftarnya, garis tepinya terputus di tengah layar (ditemukan saat membangun halaman FT Admin) | nav sticky setinggi viewport di tablet ke atas |

## Masih terbuka (dijadwalkan 1.8.x / 1.9.0)

| ID | Temuan | Rencana |
|---|---|---|
| EF-103 | QA mengambil screenshot setelah 25 kali Tab (state fokus ikut terekam) | screenshot sebelum langkah Tab |
| EF-104 | QA tidak menjalankan interaksi komponen (hanya render) | `tests/interaction` dari behaviour katalog |
| EF-105 | Emulasi ponsel Playwright melaporkan pointer halus; aturan `any-pointer: coarse` tidak teruji | emulasi media pointer |
| EF-106 | Tidak ada placeholder container query (`@container`) | placeholder `--cq-*` |
| EF-107 | `chart-hatch-line` terlalu samar di tema gelap | target 3:1 terhadap surface-raised |
| EF-108 | Tidak ada token untuk ikon status di luar wadah perhatian (`attention-cN-icon` putih di bahasa filled) | token `status-glyph-*` |
| EF-109 | Tidak ada token bayangan kartu per bahasa (`card-container-shadow`) | tambah token komponen |
| EF-110 | Tidak ada ukuran tipe untuk inisial avatar | token `avatar-initials-*` |
| EF-111 | Prefiks properti internal `--_x` bisa bertabrakan antar komponen bersarang | prefiks per komponen + lint |
| EF-112 | Beberapa record katalog menyebut ukuran caption untuk teks yang menurut STD-2 adalah teks isi (BottomNav label, StepUpDialog sisa percobaan, helper TimePicker/DateRangePicker) | koreksi record katalog |
| EF-113 | Form.js tidak mengenal anatomi error komponen input lanjutan | registry error per komponen |
| EF-114 | Ikon placeholder kurang: folder, trend up/down, zoom | tambah glyph |
| EF-115 | Brownfield (Phase 0A) belum punya alat inventaris otomatis | `tools/brownfield-scan.mjs` |
| EF-116 | Target native (Flutter, SwiftUI) belum dikompilasi di lingkungan engine (SDK tidak tersedia) | CI dengan SDK |
| EF-117 | Belum ada alat `regenerate` / `tenant-add` (V15) dan fixture G10/G11 | `tools/diff-package.mjs` |
