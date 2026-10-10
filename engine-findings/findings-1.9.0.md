# Temuan engine yang ditangani di 1.9.0

Sumber: review pengguna atas prototipe yang dibuat engine 1.8.0. Keluhannya: hasilnya tidak mirip Ant Design v6 / shadcn/ui, terasa aneh, dan masih banyak yang ambigu. Akar masalahnya ada di engine, bukan di run.

## Ditutup di 1.9.0

| ID | Temuan | Perbaikan |
|---|---|---|
| EF-061 | Engine tidak punya target visual pustaka. Archetype hanya menentukan karakter (radius, kepadatan, warna), dan referensi html-first adalah desain engine sendiri. Akibatnya, brief yang menyebut "seperti AntD" atau "seperti shadcn" tidak punya padanan yang bisa diuji. | Field brief `language.visual_profile` (`engine` \| `antd-v6` \| `shadcn`). Profil disimpan di `catalog/profiles/<id>.json` dan berisi overlay L2-L9 dan L16, anatomi komponen, layout, adapter, serta kebijakan ban. Lihat M01 §4.6A. |
| EF-062 | Tombol tertiary (text/ghost) memakai warna merek, sehingga halaman penuh aksi biru dan hierarki aksi kabur. | Aturan A1: warna merek hanya untuk aksi primer dan link, tertiary selalu netral. Ditegakkan di `derive-tokens` dan dicek VP. |
| EF-063 | Hover tombol secondary, hover input, dan item nav terpilih ditetapkan tetap oleh engine. Pustaka berbeda di sini: AntD memakai primer di ketiganya, shadcn netral. | Token `button-secondary-*-hover`, `control-container-border-hover`, `nav-item-label-selected`, dan `nav-item-background-hover` mengikuti `profile.components`. |
| EF-064 | Anatomi Card, Table, Tabs, Segmented, Badge, Pagination, dan Menu hanya satu bentuk, sehingga tidak mungkin menyerupai pustaka mana pun. | Lapisan CSS profil `reference/html-first/profiles/<id>.css` (hanya token, tanpa garis samping), dimuat setelah semua CSS komponen. Juga dipaketkan ke `src/profile/<id>.css` dan dilint V6. |
| EF-065 | Ikon masih glyph placeholder buatan engine. | Set ikon nyata: Lucide (ISC) dan Ant Design Icons (MIT, berbasis fill) di `icons/<set>.json`, dibuat oleh `tools/dev/gen-icons.mjs`. Sprite mendukung entri `{viewBox, body}` dan glyph fill dibungkus `<g fill="currentColor">`. Profil engine memakai fallback Lucide untuk nama yang tidak ada di set placeholder. |
| EF-066 | Tidak ada template halaman, jadi setiap run menyusun dashboard, list, dan detail dari nol. Hasilnya tidak konsisten antar-run dan "aneh". | Enam template di `reference/html-first/templates/` (dashboard, list, detail, settings, wizard, auth), dirender per profil ke `templates/`. Bagian opsional memakai `<!-- requires: X -->`; template yang butuh komponen di luar {N} dilewati dan dilaporkan. Template ditautkan dari dokumen 10. |
| EF-067 | Tidak ada pemeriksaan bahwa paket benar-benar mengikuti tampilan yang diminta. | Validator **VP**, blocking dan syarat T1. Yang dicek: profil paket sama dengan brief; radius, tinggi kontrol, nav terpilih, dan set ikon sesuai profil; CSS profil ikut dipaketkan; tertiary netral; setiap template punya tepat satu `h1` dan maksimal satu nav `aria-current`. |
| EF-068 | Larangan archetype (mis. "tanpa bayangan" di ink-graphite) bertabrakan dengan pustaka yang dipilih. | Ban ditandai `suspended_by: <profil>`. V13 dan lint tidak menegakkannya, tetapi tetap mencatatnya. |
| EF-069 | Ada domain run sebelumnya yang bocor ke fixture referensi (`rainbowhills.example` di Table, List, dan Stepper). | Diganti `example.com`, begitu juga "Scorecards" (Tabs), "Buggies" (Tabs), dan "Export scorecards" (Menu) yang lolos karena lint hanya mencocokkan bentuk tunggal. `rainbowhills` ditambahkan ke `leak-terms.json`. Lint leak sekarang ikut mencocokkan bentuk jamak (s/es/ies), dan ref-check juga memeriksa template. |
| EF-114 (dari 1.8.0) | Glyph placeholder belum punya folder, trend up/down, zoom | Set Lucide/AntD memuat 64 nama termasuk folder, trend-up/down, zoom-in, users, download, dashboard; profil engine memakai fallback Lucide |
| EF-109 (dari 1.8.0, sebagian) | Belum ada bayangan kartu per bahasa | Bayangan kartu diatur profil (AntD tanpa bayangan + border, shadcn `elevation-1`); token `card-container-shadow` lintas archetype masih terbuka |
| EF-070 | Belum ada cara menguji kombinasi archetype + profil. | `ref-check --profiles` / `--profiles-only` / `--templates`. Lint selalu mencakup `profiles/*.css`, `templates/templates.css`, dan `templates/*.html`. Ditambah fixture G16 (antd-v6) dan G17 (shadcn di atas soft-friendly). |

## Masih terbuka

| ID | Temuan | Rencana |
|---|---|---|
| EF-071 | Profil baru ada dua (antd-v6, shadcn). MUI v7 dan Material 3 belum punya profil walaupun adapter-nya ada. | Profil `mui-v7` dan `m3` di 1.10. |
| EF-072 | Font Geist (shadcn) tidak dibundel, sehingga preview jatuh ke font sistem. | Opsi bundel Geist (OFL) bila lisensi brief mengizinkan. |
| EF-073 | Template belum punya varian kepadatan `compact` khusus tabel AntD (`size="small"`). | Varian template `list-compact`. |

## Ditutup di 1.9.1

| ID | Temuan | Perbaikan |
|---|---|---|
| EF-074 | Density `compact` hanya mengecilkan tinggi kontrol −4 px, dan seluruhnya dibatalkan di layar sentuh. Hasilnya tidak terlihat padat seperti AntD compact / shadcn `text-sm`: teks tetap 16, H1 28–30, header 64. | STD-2c: skala tipe compact (14/12/13, H1 22), kontrol 24/32/40, header 56, padding sel dan chip per density. Di pointer kasar hanya input (≥ 16) dan tinggi kontrol/baris yang kembali comfortable. |
| EF-075 | Input di layar sentuh bisa < 16 px, sehingga iOS Safari memperbesar halaman saat input difokus. | Token `type-input-size`, reset base `:where()`, editor sel Table, dan pemeriksaan QA "input < 16 di layar sentuh". |
| EF-076 | V11, VB1, VB7, VB11, dan QA hanya memeriksa density default, sehingga density kedua tidak pernah diverifikasi. | Semua validator itu memeriksa setiap density; QA menambah run compact (desktop + ponsel). |
| EF-077 | Di compact, track Switch (34 px) lebih tinggi dari baris (32 px), sehingga tombol "Try again" di bawahnya tumpang tindih 1 px dengan target switch (axe target-size). Code 13 px di input CopyButton dan select bulan/tahun DatePicker juga < 16 di layar sentuh. | Baris Switch = max(kontrol, target, track) dan margin tombol retry tidak pernah negatif. Input CopyButton dan select DatePicker memakai `type-input-size`. |
| EF-078 | Zip skill ditolak upload Claude: "Zip contains too many files (maximum 200)" (engine 441 file), dan zip rilis memakai folder `design-system-generator-<versi>/` yang tidak sama dengan `name` skill. | `tools/dev/pack-skill.mjs`: zip berisi semua `.md` di path aslinya, `unpack.mjs`, dan `engine.bundle.json.gz` (pohon engine lengkap) → 37 file, folder `design-system-generator/`. SKILL.md di zip mendapat catatan unpack sekali per sesi. Diverifikasi: pohon hasil unpack identik, katalog 74/74, pattern 21/21, fixtures 139/139. |
