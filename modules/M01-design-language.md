<!-- ds-module id="M01" name="design-language" engine="1.9.0" sections="§4.5-4.8" -->
# Modul M01 · Perpustakaan archetype dan lapisan bahasa desain

> Bagian dari Universal Design System Generator, engine `1.9.0`. Berisi §4.5-4.8. Dimuat di fase: 0A, 0B, 2. Core menang bila bertentangan; modul ini hanya merinci.

---

## 4.5 Perpustakaan archetype

**Bentuk normatif (engine 1.8.0):** `catalog/archetypes.json`. Tabel di bawah adalah tampilan yang bisa dibaca manusia; bila berbeda, JSON yang menang, dan `tools/resolve-language.mjs` membaca JSON itu sehingga dua run dengan brief yang sama menghasilkan `design-language.json` byte-identik.

Sembilan archetype siap pakai: lima untuk produk kerja dan konsumen umum, empat ekspresif (`quiet-luxury`, `playful-vivid`, `immersive-glass`, `neo-brutalist`). Pilih salah satu, modifikasi (hybrid), atau tulis sendiri (`custom`). Nilai di (a), (b), dan (c) adalah **default normatif yang lengkap untuk L1-L17**: dua run dengan archetype dan brief yang sama wajib menghasilkan `design-language.json` yang identik. Generator tidak menambah nilai estetika di luar tabel ini kecuali dari brief (`source: brief`), lapis org (`source: org`, §4.8), atau ADR. Nilai akhir tetap tunduk pada baseline dan dihitung ulang oleh validator.

**(a) Karakter**

| ID | Karakter | Warna interaksi | Netral | Kebijakan perhatian (L3) | Cocok untuk | Hindari bila |
|---|---|---|---|---|---|---|
| `ink-graphite` | Alat kerja operasional yang tenang: bingkai netral, satu aksen interaksi nyaris-netral, warna hanya untuk perhatian | netral-gelap (grafit/tinta); bukan warna merek | hangat atau dingin, chroma ≤ 0.015 | C1 dan C2 boleh filled; C3-C6 quiet (ikon + teks) | back-office, operasi lapangan, admin, keuangan, alat internal | produk konsumen yang dipimpin merek |
| `brand-led-tonal` | Merek hadir di setiap interaksi; permukaan bernuansa tonal dari ramp merek | warna merek (satu ramp) | netral berwarna merek, chroma ≤ 0.03 | C1, C2, C4 boleh filled dengan intensitas berurutan; C3, C5, C6 quiet | aplikasi konsumen, SaaS dengan merek kuat | warna merek tidak bisa lolos kontras sebagai teks tanpa menggelap berlebihan |
| `soft-friendly` | Ramah dan membumi: sudut membulat, ruang lega, ilustrasi | merek atau aksen hangat | netral hangat | semua status boleh tinted (subtle + ikon); solid hanya C1 dan C2 | pendidikan, kesehatan umum, komunitas, onboarding | data padat, operasi berisiko tinggi |
| `editorial-contrast` | Konten adalah antarmuka: tipografi, kontras tinggi, garis tipis, sedikit wadah | satu aksen (sering tinta) | hampir putih / hampir hitam | status = ikon + teks + garis; fill hanya C1 | penerbitan, dokumentasi, laporan, riset, hukum | dasbor penuh widget, gamifikasi |
| `dense-console` | Konsol profesional padat: keyboard-first, angka monospace, legenda status ketat | aksen dingin bersaturasi sedang | dingin, dark-first | chip tinted ringkas untuk C1-C5 dengan legenda; fill hanya C1 dan C2 | monitoring, analitik, trading, devtools, operasi jaringan | pengguna kasual berbasis sentuh |
| `quiet-luxury` | Premium dan tenang: ruang sangat lega, serif display, warna sangat terbatas, aksen merek (sering metalik) hanya non-teks | netral-gelap (tinta); merek menjadi aksen non-interaktif | hangat, chroma ≤ 0.012 | C1 dan C2 tinted; C3-C6 quiet | hospitality, klub dan keanggotaan premium, properti, wealth, fashion | data padat, operasi berisiko tinggi, produk massal yang butuh energi |
| `playful-vivid` | Energik dan bermain: warna jenuh, bentuk sangat bulat, ilustrasi, perayaan kecil untuk keberhasilan | merek bersaturasi tinggi | hangat, chroma ≤ 0.02 | semua status tinted; filled C1, C2, dan C4 (perayaan) | gamifikasi, keluarga, kebugaran, komunitas, edukasi kasual | keuangan, hukum, klinis, operasi |
| `immersive-glass` | Berlapis dan imersif: kanvas foto atau gradien, chrome dan overlay translucent dengan blur, kedalaman lewat lapisan | merek atau aksen terang | dingin, chroma ≤ 0.02 | C1 dan C2 filled; C4 dan C5 tinted; C3 dan C6 quiet | media, hiburan, perjalanan, smart home, konsumen premium di perangkat modern | perangkat low-end, outdoor, data padat |
| `neo-brutalist` | Mentah dan jujur: border tebal, bayangan keras tanpa blur, blok warna jenuh, grotesk besar, grid terlihat | tinta hitam; merek menjadi blok warna di belakang teks | netral murni, chroma 0 | C1 dan C2 filled blok; C3-C6 outline tebal + ikon | brand kreatif, startup, portofolio, komunitas kreatif | institusi konservatif, operasi kritis, audiens yang butuh ketenangan |

**(b) Angka default**

| ID | Radius kontrol / wadah / overlay | Elevasi | Satuan dasar | Teks isi (ukuran/tinggi baris) | Skala tipe (caption · body · h3 · h2 · h1 · display) | Gerak cepat / dasar / lambat (ms) | Tema bawaan |
|---|---|---|---|---|---|---|---|
| `ink-graphite` | 4 / 4 / 8 | 0 saat rest; 1 popover dan toast; 2 modal; border menggantikan bayangan di tema gelap dan kontras tinggi | 4 | 16/24 | 12 · 16 · 18 · 22 · 26 · 36 | 100 / 180 / 240 | Light, Dark, High-contrast |
| `brand-led-tonal` | 8 / 12 / 16 | tonal + bayangan lembut level 1-3 | 4 | 16/24 | 12 · 16 · 20 · 24 · 30 · 40 | 150 / 250 / 350 | Light, Dark |
| `soft-friendly` | 12 / 16 / 24 | bayangan difus lembut level 1-2 | 4 (langkah lega) | 17/26 | 12 · 17 · 20 · 24 · 30 · 40 | 200 / 300 / 400 | Light, Dark |
| `editorial-contrast` | 0 / 2 / 4 | tanpa bayangan; garis tipis 1px | 4 | 18/28 | 12 · 18 · 22 · 28 · 36 · 48 | 100 / 150 / 200 | Light, Dark |
| `dense-console` | 2 / 4 / 6 | border; bayangan hanya popover | 4 (langkah rapat) | 16/22 | 12 · 16 · 18 · 20 · 24 · 32 | 80 / 120 / 160 | Dark, Light, High-contrast |
| `quiet-luxury` | 2 / 4 / 8 | bayangan sangat lembut level 1-2; tonal di gelap | 4 | 17/28 | 12 · 17 · 22 · 28 · 36 · 52 | 160 / 280 / 400 | Light, Dark |
| `playful-vivid` | 16 / 24 / 32 | bayangan "bibir" tanpa blur level 1, difus level 2 | 4 | 17/26 | 12 · 17 · 22 · 28 · 36 · 48 | 150 / 250 / 400 | Light, Dark |
| `immersive-glass` | 12 / 20 / 28 | lapisan translucent + bayangan lembut level 1-3 | 4 | 16/24 | 12 · 16 · 20 · 26 · 34 · 44 | 150 / 250 / 350 | Dark, Light |
| `neo-brutalist` | 0 / 0 / 0 | bayangan keras offset tanpa blur level 1-2 | 4 | 18/28 | 12 · 18 · 24 · 32 · 44 · 64 | 60 / 100 / 150 | Light, Dark, High-contrast |

**Skala tipe lengkap (engine 1.8.0, perbaikan F31).** Selain enam langkah di atas, setiap archetype menetapkan `body-lg` dan bobot heading secara eksplisit, sehingga kesembilan token tipe tidak pernah dikarang run:

| ID | `body-lg` | `label` | `code` | Bobot heading · label |
|---|---|---|---|---|
| `ink-graphite` | 17 | 16 | 16 | 600 · 500 |
| `brand-led-tonal` | 18 | 16 | 16 | 700 · 500 |
| `soft-friendly` | 18 | 17 | 16 | 700 · 600 |
| `editorial-contrast` | 20 | 18 | 16 | 600 · 600 |
| `dense-console` | 17 | 16 | 16 | 600 · 500 |
| `quiet-luxury` | 19 | 17 | 16 | 400 (display) · 500 |
| `playful-vivid` | 19 | 17 | 16 | 600 · 600 |
| `immersive-glass` | 18 | 16 | 16 | 700 · 500 |
| `neo-brutalist` | 20 | 18 | 16 | 700 · 500 |

Invarian skala (VB1): caption < body < body-lg < h3 < h2 < h1 < display. Override brief yang melanggar urutan ini ditolak gerbang Phase 1.

Catatan: `dense-console` mencapai kepadatan lewat spasi, tinggi baris, dan susunan, **bukan** huruf kecil (I8). Pada mode sentuh, kontrol padat tidak dipakai (STD-4).

**(c) Spesifikasi lengkap per archetype**

*(c1) Warna (L2).* Seed OKLCH (hue dalam derajat). L = lightness awal `interaction-default` di tema pertama sebelum solver §5.3.

| ID | Netral (hue · chroma) | Interaksi (hue · chroma · L) | Chroma maks semantik | `info` | Tautan |
|---|---|---|---|---|---|
| `ink-graphite` | 250 · 0.010 | = hue netral · 0.020 · 0.30 | 0.14 | netral (ramp netral + ikon info) | `interaction-default` + garis bawah 1px |
| `brand-led-tonal` | hue interaksi · 0.020 | brand seed; tanpa seed: 265 · 0.16 · 0.50 (`A-nn`) | 0.16 | 250 (cek pemisahan §5.3) | warna interaksi + garis bawah 1px |
| `soft-friendly` | 70 · 0.012 | brand seed; tanpa seed: 175 · 0.10 · 0.50 (`A-nn`) | 0.13 | 250 | warna interaksi + garis bawah 1px |
| `editorial-contrast` | 90 · 0.005 | 260 · 0.03 · 0.25 | 0.12 | netral | `text-primary` + garis bawah 1px; hover garis 2px |
| `dense-console` | 255 · 0.015 | brand seed; tanpa seed: 230 · 0.12 · 0.55 (gelap: 0.75) | 0.15 | netral | warna interaksi + garis bawah 1px |
| `quiet-luxury` | 70 · 0.008 | = hue netral · 0.015 · 0.22 | 0.11 | netral | `text-primary` + garis bawah 1px |
| `playful-vivid` | 60 · 0.015 | brand seed; tanpa seed: 300 · 0.20 · 0.55 (`A-nn`) | 0.18 | 250 | warna interaksi + garis bawah 2px |
| `immersive-glass` | 260 · 0.020 | brand seed; tanpa seed: 220 · 0.14 · 0.70 (gelap) / 0.55 (terang) (`A-nn`) | 0.15 | 250 | warna interaksi + garis bawah 1px |
| `neo-brutalist` | 0 · 0 | tinta: 0 · 0 · 0.15 | 0.20 | 250 | `text-primary` + garis bawah 2px |

`neutral_temperature` di brief menggantikan hue netral: `warm` = 70, `cool` = 250, `neutral` = chroma 0. Pada `ink-graphite`, `editorial-contrast`, `quiet-luxury`, dan `neo-brutalist` brand seed **tidak** menjadi warna interaksi; ia menjadi `color-brand-*`. Di `neo-brutalist`, `color-brand-default` adalah blok warna di belakang teks dengan `color-brand-on` yang dipilih solver (teks gelap atau terang, mana yang lolos 4.5:1); di tiga lainnya hanya aksen non-teks (wordmark, garis, ilustrasi). Tanpa seed, `neo-brutalist` memakai blok 95 · 0.19 · L 0.90 (`A-nn`).

*(c2) Tipografi (L4).* Semua keluarga berlisensi SIL OFL 1.1 dan di-bundle bersama file lisensinya.

| ID | UI | Display | Mono | Bobot | Rasio tinggi baris body / heading | Tracking heading ≥ 24 | Kapital |
|---|---|---|---|---|---|---|---|
| `ink-graphite` | Inter | (UI) | JetBrains Mono | 400 · 500 · 600 | 1.5 / 1.25 | −0.01em | sentence case |
| `brand-led-tonal` | Plus Jakarta Sans | (UI) | JetBrains Mono | 400 · 500 · 700 | 1.5 / 1.25 | −0.01em | sentence case |
| `soft-friendly` | Nunito | (UI) | JetBrains Mono | 400 · 600 · 700 | 1.53 / 1.3 | 0 | sentence case; tanpa kapital penuh |
| `editorial-contrast` | Source Sans 3 | Source Serif 4 | Source Code Pro | 400 · 600 | 1.56 / 1.2 | −0.01em | sentence case |
| `dense-console` | IBM Plex Sans | (UI) | IBM Plex Mono | 400 · 500 · 600 | 1.375 / 1.2 | 0 | sentence case; kapital penuh hanya singkatan satuan dan nama tombol keyboard |
| `quiet-luxury` | DM Sans | Playfair Display | DM Mono | UI 400 · 500; display 400 · 600 | 1.64 / 1.15 | 0 | sentence case |
| `playful-vivid` | Lexend | Fredoka | JetBrains Mono | 400 · 600 · 700 | 1.53 / 1.2 | 0 | sentence case |
| `immersive-glass` | Manrope | (UI) | JetBrains Mono | 400 · 500 · 700 | 1.5 / 1.2 | −0.01em | sentence case |
| `neo-brutalist` | Space Grotesk | (UI) | Space Mono | 400 · 500 · 700 | 1.5 / 1.1 | −0.02em | sentence case; kapital penuh hanya heading ≥ 32 |

- Tinggi baris = ukuran × rasio, dibulatkan ke bilangan genap terdekat (nilai tepat di tengah dibulatkan ke atas). `type-caption` = 12/16, kecuali `soft-friendly`, `quiet-luxury`, `playful-vivid`, `neo-brutalist`: 12/18. Label = ukuran body, bobot tengah. `type-code` = 16 mono.
- Fallback: sans `system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Arial, sans-serif`; serif `Georgia, "Noto Serif", serif`; mono `ui-monospace, "SF Mono", Menlo, Consolas, "Noto Sans Mono", monospace`.

*(c3) Ikon (L9).* Nama glyph diberi label "Not verified against the pinned version" sampai dicocokkan dengan versi set yang di-bundle (R4, `A-nn`).

| | Lucide (ISC) | Material Symbols Rounded (Apache-2.0) | Phosphor (MIT) | Tabler Icons (MIT) |
|---|---|---|---|---|
| Dipakai oleh · gaya | `ink-graphite` stroke 1.5 · `editorial-contrast` stroke 1.25 · `immersive-glass` stroke 1.5 | `brand-led-tonal` weight 400, fill 0 (fill 1 untuk selected) | `soft-friendly` Regular · `quiet-luxury` Light · `playful-vivid` Bold | `dense-console` stroke 1.5 · `neo-brutalist` stroke 2 |
| `icon-{sm,md,lg}` | 16 · 20 · 24 | 16 · 20 · 24 | `soft-friendly` dan `playful-vivid` 20 · 24 · 28; `quiet-luxury` 16 · 20 · 24 | `dense-console` 16 · 20 · 24; `neo-brutalist` 20 · 24 · 28 |
| critical | `octagon-alert` | `report` | `WarningOctagon` | `alert-octagon` |
| warning | `triangle-alert` | `warning` | `Warning` | `alert-triangle` |
| positive | `circle-check` | `check_circle` | `CheckCircle` | `circle-check` |
| info | `info` | `info` | `Info` | `info-circle` |
| neutral-negative | `circle-minus` | `do_not_disturb_on` | `MinusCircle` | `circle-minus` |
| waktu | `clock` | `schedule` | `Clock` | `clock` |
| riwayat | `history` | `history` | `ClockCounterClockwise` | `history` |
| aksi terbatas peran | `lock` | `lock` | `Lock` | `lock` |

Ilustrasi dan foto: `ink-graphite` dan `dense-console` tidak memakai ilustrasi di surface operasional; `brand-led-tonal` boleh di onboarding dan empty state; `soft-friendly` dan `playful-vivid` maks satu ilustrasi per layar; `editorial-contrast` dan `quiet-luxury` mengutamakan foto berkualitas dengan keterangan; `immersive-glass` memakai foto atau gradien sebagai kanvas; `neo-brutalist` memakai blok warna dan tipografi, foto boleh dengan bingkai border tebal.

*(c4) Ruang, kontrol, dan bentuk (L5, L6).* Token spasi `space-{k}` bernilai k × 4 px; `space-half` = 2 px. Hanya langkah yang tercantum yang dibuat.

| ID | Langkah k | `control-height-{sm,md,lg}` (pointer, `comfortable`) | Mode sentuh | `border-width-{thin,thick}` | Aturan wadah |
|---|---|---|---|---|---|
| `ink-graphite` | ½, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16 | 32 · 40 · 48 | sm tidak dipakai; md menjadi 44 | 1 · 2 | kartu hanya untuk objek yang bisa dipilih; daftar memakai baris |
| `brand-led-tonal` | ½, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20 | 36 · 44 · 52 | sm diperluas area kliknya ke 44 | 1 · 2 | kartu boleh untuk pengelompokan; maks satu tingkat bersarang |
| `soft-friendly` | 1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24 | 40 · 48 · 56 | semua tinggi visual ≥ 44 | 1 · 2 | kartu adalah wadah utama |
| `editorial-contrast` | ½, 1, 2, 3, 4, 6, 8, 12, 16, 24 | 32 · 40 · 48 | md menjadi 44 | 1 · 2 | tanpa kartu untuk konten; garis pemisah 1px |
| `dense-console` | ½, 1, 2, 3, 4, 5, 6, 8, 10, 12 | 28 · 32 · 40 | kontrol padat tidak dipakai: semua tinggi 44 | 1 · 2 | panel bergaris, bukan kartu |
| `quiet-luxury` | ½, 1, 2, 3, 4, 6, 8, 10, 12, 16, 20, 24 | 40 · 48 · 56 | semua tinggi visual ≥ 44 | 1 · 1 | tanpa kartu berbayang; kelompok dipisah ruang dan garis tipis |
| `playful-vivid` | 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24 | 44 · 52 · 60 | semua tinggi visual ≥ 44 | 2 · 3 | kartu berwarna adalah wadah utama |
| `immersive-glass` | ½, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20 | 40 · 48 · 56 | semua tinggi visual ≥ 44 | 1 · 2 | panel translucent di atas kanvas; maks 2 lapis translucent bertumpuk |
| `neo-brutalist` | 1, 2, 3, 4, 6, 8, 12, 16, 24 | 40 · 48 · 56 | semua tinggi visual ≥ 44 | 2 · 3 | kotak bergaris tebal dengan bayangan keras |

Radius dari (b): `radius-sm` = kontrol, `radius-md` = wadah, `radius-lg` = overlay, `radius-xs` = ½ kontrol (dibulatkan ke bawah), `radius-none` = 0, `radius-full` = 9999.

*(c5) Elevasi dan gerak (L7, L8).* Format bayangan `x y blur / alfa`; warna = `color-structure-shadow` (langkah 12 ramp netral; `neo-brutalist`: sama dengan `text-primary`, alfa 1). `motion-instant` = 0 ms untuk semua archetype.

| ID | `elevation-1` | `elevation-2` | `elevation-3` | Tema gelap dan kontras tinggi | Easing standard · enter · exit | `motion-stagger-max` |
|---|---|---|---|---|---|---|
| `ink-graphite` | 0 1 2 / .08 + 0 2 8 / .08 | 0 4 12 / .12 + 0 12 32 / .12 | - | border 1px `border-strong` menggantikan bayangan | (0.2,0,0,1) · (0,0,0.2,1) · (0.4,0,1,1) | 0 ms |
| `brand-led-tonal` | 0 1 3 / .10 + 0 1 2 / .06 | 0 4 8 / .10 + 0 2 4 / .06 | 0 12 24 / .12 + 0 4 8 / .08 | tonal: surface naik satu langkah ramp per level; alfa bayangan ×2 | (0.2,0,0,1) · (0.05,0.7,0.1,1) · (0.3,0,0.8,0.15) | 40 ms |
| `soft-friendly` | 0 2 12 / .06 | 0 8 24 / .08 | - | tonal | (0.25,0.1,0.25,1) · (0.34,1.3,0.64,1) hanya untuk overlay masuk · (0.4,0,1,1) | 50 ms |
| `editorial-contrast` | tanpa bayangan (border 1px) | tanpa bayangan (border 1px) | - | border 1px | (0.4,0,0.2,1) untuk semua | 0 ms |
| `dense-console` | tanpa bayangan (border) | 0 4 16 / .24 hanya popover dan menu | - | border | (0.2,0,0,1) untuk semua | 0 ms |
| `quiet-luxury` | 0 1 2 / .04 + 0 4 16 / .06 | 0 8 32 / .08 | - | tonal | (0.4,0,0.2,1) · (0.16,1,0.3,1) · (0.7,0,0.84,0) | 60 ms |
| `playful-vivid` | 0 3 0 / .14 | 0 8 24 / .14 | - | tonal + bayangan bibir tetap | (0.2,0,0,1) · (0.34,1.56,0.64,1) · (0.4,0,1,1) | 60 ms |
| `immersive-glass` | 0 4 16 / .12 | 0 12 32 / .18 | 0 24 64 / .24 | bayangan sama + border translucent 1px | (0.2,0,0,1) · (0.05,0.7,0.1,1) · (0.3,0,0.8,0.15) | 40 ms |
| `neo-brutalist` | 4 4 0 / 1 | 8 8 0 / 1 | - | sama; warna bayangan = `text-primary` tema aktif | (0.2,0,0,1) untuk semua | 0 ms |

**Jumlah tingkat elevasi (engine 1.8.0, perbaikan F32).** Kolom bertanda "-" berarti tingkat itu **tidak dibuat**: token `elevation-n` hanya ada untuk tingkat yang dideklarasikan bahasa (`catalog/archetypes.json` → `elevation.levels`). Komponen yang butuh tingkat lebih tinggi memakai tingkat tertinggi yang ada; tidak boleh membuat token duplikat. Tingkat bertetangga wajib makin kuat di tema berstrategi bayangan, kecuali bahasa menyatakan `flat: true` (`editorial-contrast`) (VB2). Di tema kontras tinggi semua tingkat menjadi border.

*(c6) Data-viz (L10).* Urutan hue kategorikal sama untuk semua archetype (diturunkan dari palet Okabe-Ito yang aman untuk buta warna): `chart-cat-1` 250 · `-2` 55 · `-3` 165 · `-4` 340 · `-5` 85 · `chart-cat-other` = netral langkah 7. Chroma: `ink-graphite` 0.10 · `brand-led-tonal` 0.14 · `soft-friendly` 0.11 · `editorial-contrast` 0.08 · `dense-console` 0.15 · `quiet-luxury` 0.07 · `playful-vivid` 0.17 · `immersive-glass` 0.14 · `neo-brutalist` 0.18. Lightness dipilih solver: ≥ 3:1 terhadap `surface-base` dan `surface-raised`, dan selisih L antar kategori bertetangga ≥ 0.05 agar tetap terbedakan tanpa hue. Sekuensial: hue interaksi (250 bila interaksi netral), lima langkah dengan selisih lightness OKLab tetangga ≥ 0.08 dan langkah terkuat ≥ 3:1 terhadap `surface-base` (engine 1.8.0: syarat lama "tiap langkah ≥ 3:1 terhadap tetangganya" mustahil dipenuhi lima langkah dalam rentang 21:1). Bila warna interaksi berchroma ≥ 0.08 berjarak hue < 20° dari `chart-cat-1`, urutan kategori diputar agar data tidak terbaca sebagai tautan. Divergen: 250 ↔ 55 dengan titik tengah netral. Hatch: diagonal 45°, garis 1px, jarak 6px, warna `chart-hatch-line`.

*(c7) Prinsip (L1).* Konsekuensi yang bisa diuji merujuk ke larangan (c9) atau aturan engine.

| ID | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|
| `ink-graphite` | Tenang sampai ada yang perlu diperhatikan (LB-02) | Bingkai netral, satu aksen (LB-03) | Datar saat diam (LB-01) | Angka dulu, hiasan tidak (LB-07) | Satu keputusan per layar (maks satu tombol primer) |
| `brand-led-tonal` | Merek di setiap interaksi (sumber interaksi = brand) | Permukaan bernuansa, bukan abu-abu (LB-01, LB-07) | Kedalaman bertingkat jelas (LB-02) | Ramah tetapi rapi (LB-03) | Status tidak meminjam merek (UB12) |
| `soft-friendly` | Lega dulu, satu tugas per layar (LB-05) | Membulat dan lembut (LB-01, LB-02) | Bicara seperti teman (L11, LB-03) | Ilustrasi menjelaskan, bukan menghias (LB-04) | Tidak pernah mengagetkan (LB-07) |
| `editorial-contrast` | Isi adalah antarmuka (LB-02) | Garis, bukan kotak (LB-01) | Kontras tinggi dan tenang (LB-03) | Lebar baca terjaga (LB-05) | Satu aksen, dipakai hemat (LB-07) |
| `dense-console` | Pindai dalam sekejap (LB-01) | Keyboard dulu (LB-06) | Legenda ketat (LB-05) | Gerak hanya sebagai sinyal (LB-04) | Padat lewat susunan, bukan huruf kecil (I8) |
| `quiet-luxury` | Ruang adalah kemewahan (L17) | Satu aksen, tidak berteriak (LB-01, LB-02) | Tipografi membawa karakter (L4) | Gerak pelan dan halus (LB-07) | Status santun tetapi jelas (LB-05, I7) |
| `playful-vivid` | Rayakan kemajuan, bukan kegagalan (LB-04) | Warna berenergi, bukan bising (LB-05) | Bulat dan empuk (LB-02) | Main tetapi jujur (LB-06, I6) | Terbaca dulu, lucu kemudian (LB-03) |
| `immersive-glass` | Kedalaman lewat lapisan (LB-02) | Konten padat di atas kaca (LB-01, LB-03) | Kanvas boleh hidup, teks tidak (LB-01) | Selalu ada fallback padat (LB-04) | Gerak menegaskan lapisan (L8) |
| `neo-brutalist` | Struktur terlihat (LB-04) | Keras, bukan kasar (STD-3) | Tanpa ilusi kedalaman lembut (LB-02, LB-03, LB-05) | Blok warna, bukan nuansa (LB-06) | Tipe besar, keputusan cepat (L4) |

*(c8) Suara (L11).* Skala 1-5: formal (5 = formal), ringkas (5 = sangat singkat), tegas (5 = tegas), hangat (5 = hangat). Contoh dalam Bahasa Indonesia hanya ilustrasi nada; string akhir mengikuti `ui_locales`.

| ID | Formal · ringkas · tegas · hangat | Contoh tombol | Contoh error |
|---|---|---|---|
| `ink-graphite` | 4 · 5 · 4 · 2 | "Simpan perubahan" | "Tanggal mulai wajib diisi." |
| `brand-led-tonal` | 3 · 4 · 3 · 3 | "Lanjutkan pembayaran" | "Kartu ditolak bank. Coba kartu lain." |
| `soft-friendly` | 2 · 3 · 2 · 5 | "Mulai membaca" | "Nomor HP-nya kurang 2 digit lagi." |
| `editorial-contrast` | 5 · 2 · 3 · 2 | "Unduh dokumen" | "Dokumen tidak ditemukan. Periksa nomornya atau telusuri ulang." |
| `dense-console` | 4 · 5 · 5 · 1 | "Restart node" | "Timeout 30 dtk. Coba lagi atau periksa koneksi." |
| `quiet-luxury` | 5 · 3 · 2 · 3 | "Reservasi meja" | "Tanggal ini sudah penuh. Silakan pilih tanggal lain." |
| `playful-vivid` | 1 · 3 · 2 · 5 | "Ambil hadiah" | "Kodenya belum cocok. Cek lagi, ya." |
| `immersive-glass` | 3 · 4 · 3 · 3 | "Putar sekarang" | "Koneksi terputus. Kami coba lagi otomatis." |
| `neo-brutalist` | 2 · 5 · 5 · 2 | "Kirim karya" | "Gagal unggah. Ukuran file maks 10 MB." |

*(c9) Larangan (L13).* Setiap baris menjadi entri `LB-nn` di `lint-rules.json` dengan jenis yang tertulis.

| ID | LB-01 | LB-02 | LB-03 | LB-04 | LB-05 | LB-06 | LB-07 |
|---|---|---|---|---|---|---|---|
| `ink-graphite` | bayangan pada komponen non-overlay saat rest (css-pattern) | fill untuk kelas C3-C6 (token-rule) | warna interaksi pada area lebih luas dari satu kontrol (manual-review) | gradien (css-pattern) | rail berwarna di sisi kiri untuk severity (css-pattern) | radius > `radius-sm` di luar overlay (token-rule) | ilustrasi di surface operasional (manual-review) |
| `brand-led-tonal` | netral tanpa hue, chroma 0 (token-rule) | lebih dari 3 tingkat elevasi (token-rule) | `radius-none` pada kontrol (token-rule) | tombol primer berupa outline (manual-review) | lebih dari satu warna aksen per layar (manual-review) | gradien di dalam komponen (css-pattern) | permukaan tonal dari ramp selain merek (token-rule) |
| `soft-friendly` | sudut < `radius-sm` pada kontrol dan wadah (token-rule) | bayangan dengan blur < 8px (token-rule) | teks kapital penuh (css-pattern) | lebih dari satu ilustrasi per layar (manual-review) | tabel lebih dari 4 kolom di ponsel (manual-review) | font mono di luar kode (css-pattern) | fill solid untuk C3-C6 (token-rule) |
| `editorial-contrast` | bayangan apa pun selain ring fokus (css-pattern) | kartu sebagai wadah daftar konten (manual-review) | fill semantik selain C1 (token-rule) | radius > 4 (token-rule) | teks berjalan lebih lebar dari `layout-measure` (css-pattern) | gradien (css-pattern) | ikon dekoratif di samping heading (manual-review) |
| `dense-console` | angka tanpa `tabular-nums` (css-pattern) | bayangan selain popover dan menu (css-pattern) | ilustrasi (manual-review) | durasi animasi > `motion-base` (token-rule) | warna status di layar tanpa legenda (manual-review) | aksi primer desktop tanpa pintasan bermodifier (manual-review) | fill solid untuk C3-C6 (token-rule) |
| `quiet-luxury` | lebih dari satu warna aksen per layar (manual-review) | `color-brand-*` sebagai warna teks (token-rule) | bayangan dengan alfa > .08 (token-rule) | teks kapital penuh (css-pattern) | fill untuk C3-C6 (token-rule) | ikon dekoratif berwarna (manual-review) | easing overshoot atau durasi > `motion-slow` (token-rule) |
| `playful-vivid` | layar utama tanpa aksen warna, abu-abu datar (manual-review) | sudut < `radius-sm` (token-rule) | teks langsung di atas gradien atau ilustrasi (css-pattern) | animasi perayaan untuk kelas selain C4 (manual-review) | lebih dari 3 warna aksen per layar (manual-review) | gamifikasi yang menyembunyikan informasi penting (manual-review) | bayangan abu-abu dengan blur > 24px (token-rule) |
| `immersive-glass` | teks langsung di atas kanvas tanpa lapisan surface (css-pattern) | lebih dari 2 lapis translucent bertumpuk (manual-review) | blur pada area konten yang dibaca (css-pattern: `backdrop-filter` di luar allowlist chrome dan overlay) | translucency tanpa fallback padat (css-pattern) | border panel > 1px (token-rule) | parallax wajib atau gerak berbasis gulir tanpa opsi mati (manual-review) | fill solid untuk C3 dan C6 (token-rule) |
| `neo-brutalist` | radius > 0 (token-rule) | bayangan dengan blur > 0 (token-rule) | gradien (css-pattern) | border < 2px pada kontrol dan wadah (token-rule) | translucency atau blur (css-pattern) | fill aksen pastel, chroma < 0.08 (token-rule) | lebih dari 2 keluarga font (token-rule) |

*(c10) Adaptasi platform, material, umpan balik, dan komposisi layout (L14-L17).* Opasitas state layer, nama pola haptic, dan perilaku yang selalu native diatur engine (§6.9, §14.3).

| ID | L14 Adaptasi platform | L15 Material | L16 State · haptic · suara | L17 Konten maks · `space-section` / `-lg` · perataan · grid |
|---|---|---|---|---|
| `ink-graphite` | `hybrid`: tampilan seragam; date dan time picker native di ponsel | tanpa gradien, translucency, atau tekstur | `token-swap` · selection dan error di surface sentuh · suara hanya event kritis | fluid di surface operasional, 1440 di halaman konten · 24 / 32 · kiri · 12 kolom ketat |
| `brand-led-tonal` | `uniform` | gradien hanya di hero atau halaman marketing; tanpa translucency | `state-layer` · selection, success, error · suara hanya event kritis | 1200 · 32 / 48 · tengah · 12 kolom |
| `soft-friendly` | `hybrid`: picker dan sheet native di ponsel | gradien lembut hanya di ilustrasi dan empty state | `state-layer` · selection dan success · suara hanya event kritis | 960 · 40 / 48 · tengah · satu kolom di layar lebar |
| `editorial-contrast` | `uniform` | tanpa; foto full-bleed dengan keterangan boleh | `token-swap` · tanpa haptic · tanpa suara | `layout-measure` untuk teks, 1280 total · 48 / 64 · kiri · asimetris (teks 7 kolom + catatan 3 kolom) |
| `dense-console` | `uniform`; label pintasan mengikuti OS (⌘ atau Ctrl) | tanpa | `token-swap` · error dan kritis · suara hanya event kritis | fluid 100%, multi-pane · 12 / 16 · kiri · pane, bukan kolom |
| `quiet-luxury` | `uniform` | tanpa gradien kecuali overlay foto demi keterbacaan; tanpa translucency | `token-swap` · selection ringan · tanpa suara (event kritis mengikuti brief) | 1200 · 64 / 96 · tengah · 12 kolom dengan margin lebar |
| `playful-vivid` | `uniform` | gradien boleh di permukaan dekoratif dan ilustrasi, tidak di belakang teks | `state-layer` + tekan `scale(0.97)` · selection, success (perayaan C4), error · efek suara hanya bila brief mengizinkan, default mati | 1080 · 32 / 48 · tengah · grid kartu |
| `immersive-glass` | `hybrid`: material sistem iOS dipetakan ke token material | translucency di chrome dan overlay (`material-blur-md`, `-lg`); kanvas boleh foto atau gradien; fallback padat wajib | `state-layer` · selection, success, error · suara hanya event kritis | 1280 · 32 / 48 · tengah · lapisan di atas kanvas |
| `neo-brutalist` | `uniform` | tanpa gradien, translucency, atau tekstur; blok warna padat | `token-swap` + tekan `translate(4px,4px)` dengan bayangan menjadi 0 · selection dan error · tanpa suara | 1280 · 24 / 48 · kiri · grid terlihat (garis 2px) |

Transformasi saat ditekan tidak memengaruhi layout (I4: hanya `transform`), tidak dipakai pada baris tabel dan item navigasi, dan menjadi `none` di bawah reduced motion.

## 4.6 Memilih atau menurunkan bahasa (Phase 0B)

1. **`language_mode: archetype`** → pakai archetype di brief. Tulis ke `design-language.json` dengan `source: archetype` dan terapkan override brief (bertanda `source: brief`).
2. **`language_mode: derive`** → hitung skor tiap archetype dari lima sumbu `personality` di brief (skala 1-5):

   | Archetype | formality | warmth | expressiveness | density | risk_criticality |
   |---|---|---|---|---|---|
   | `ink-graphite` | 4 | 2 | 2 | 4 | 5 |
   | `brand-led-tonal` | 3 | 3 | 4 | 2 | 2 |
   | `soft-friendly` | 2 | 5 | 4 | 1 | 1 |
   | `editorial-contrast` | 5 | 2 | 3 | 2 | 2 |
   | `dense-console` | 4 | 1 | 1 | 5 | 4 |
   | `quiet-luxury` | 5 | 3 | 2 | 1 | 2 |
   | `playful-vivid` | 1 | 5 | 5 | 2 | 1 |
   | `immersive-glass` | 3 | 3 | 5 | 2 | 2 |
   | `neo-brutalist` | 2 | 2 | 5 | 3 | 2 |

   Skor = Σ untuk lima sumbu dari `(4 − |nilai_preferensi − nilai_brief|)`, rentang 0-20. Pilih skor tertinggi. Seri → pilih yang menurunkan risiko lebih besar (urutan: `ink-graphite`, `dense-console`, `editorial-contrast`, `quiet-luxury`, `brand-led-tonal`, `immersive-glass`, `soft-friendly`, `neo-brutalist`, `playful-vivid`). `must_not_look_like` dan `dislikes` di brief, serta veto dari pack terpilih (§0), dapat memveto archetype. Veto pack hanya bisa dibuka lewat brief eksplisit disertai ADR. **Tampilkan tabel skor dan vetonya di dokumen 05.**
3. **`language_mode: custom`** → isi L1-L17 dari brief; keputusan yang kosong diturunkan dari archetype terdekat berdasarkan skor, dengan `source: derived`.
4. **Hybrid:** archetype dasar + override per keputusan. Bila override mengubah lebih dari **4** keputusan di antara L2-L12 dan L14-L17, perlakukan sebagai `custom`. Bila hybrid menggabungkan keputusan yang berlawanan (mis. radius lembut dengan kepadatan konsol), jalankan **pemeriksaan koherensi**: tulis tiap ketegangan beserta cara meredamnya di ADR-L1.
5. **Brand seed:** untuk setiap entri B6 `brands`, bila brief memberi warna merek, gunakan sebagai seed warna interaksi atau aksen sesuai L2. **Warna merek tidak diubah diam-diam**: bila tidak lolos kontras di salah satu peran, turunkan varian terdekat yang lolos (tahap solver §5.3), catat ΔE dan alasan di register, dan pakai warna asli hanya di peran non-teks yang lolos 3:1.
6. **`language_mode: inherit`** → muat `design-language.json` lapis org dari `inherits_from` (§4.8). Nilai warisan bertanda `source: org`; override brief dibatasi aturan §4.8.

## 4.6A Profil visual pustaka (engine 1.9.0)

Archetype menentukan *karakter*; **profil visual** menentukan *pustaka yang ditiru*. Bila brief mengisi `language.visual_profile` = `antd-v6` atau `shadcn`, engine memuat `catalog/profiles/<id>.json` dan menimpa nilai visual archetype. Default `engine` berarti tampilan referensi engine sendiri.

| Lapisan | Isi profil | Contoh antd-v6 | Contoh shadcn |
|---|---|---|---|
| Token (L2-L9, L16) | warna interaksi default, perlakuan perhatian C1-C6, skala tipe, tinggi kontrol, radius, elevasi, set ikon, strategi state | biru primer, kontrol 28/36/44, radius 6/8/8, bayangan tiga lapis, Ant Design Icons, token-swap | primer netral gelap, kontrol 32/36/40, radius 8/12/12, shadow-sm, Lucide stroke 2 |
| Anatomi (`components`) | token komponen yang mengikuti pustaka | hover tombol default = primer; item menu terpilih = latar primer muda + label primer; hover input = border primer | hover outline netral; item sidebar terpilih = latar accent + label teks utama |
| CSS profil | `reference/html-first/profiles/<id>.css`, dimuat setelah semua CSS komponen, hanya token | Card ber-head divider, header Table abu-abu semibold, Tabs line + ink bar, Segmented, Badge count solid | Card rounded-xl + shadow-sm, Table tanpa fill header, Tabs bergaya segmented, sidebar muted |
| Layout | `layout-bar-height`, `layout-nav-width` | 64 / 224 | 56 / 256 |
| Adapter | adapter pustaka ikut dibuat walau `targets.adapters` kosong | A01 (`adapters/antd/theme.g.ts`) | A03 (`adapters/shadcn/shadcn.css` + Tailwind) |

Aturan:

1. **Prioritas tidak berubah:** 1 BASELINE → 2 INVARIANT → 3 BRIEF → 4 PACK → 5 LANGUAGE → 6 ENGINE; di dalam LANGUAGE, profil menimpa archetype. Profil tidak pernah menurunkan teks isi di bawah 16 px, area klik, atau ring fokus; penyesuaiannya dicatat di `profile.baseline_adjustments` (mis. AntD `fontSize 14 → 16`).
2. Keputusan yang ditimpa profil bertanda `source: profile`. `neutral_temperature` dari brief tetap diterapkan di atas profil.
3. Larangan L13 archetype yang bertentangan dengan profil (radius, bayangan, elevasi) **ditangguhkan**, bukan dihapus: `suspended_by: <id>`. V13 tidak menegakkannya dan mencatatnya.
4. Warna merek hanya untuk aksi primer dan link (A1). Tombol tertiary (text/ghost) selalu netral di semua profil.
5. `language_mode: inherit` + `visual_profile` = galat: lapis org sudah menentukan tampilan.
6. **Template halaman** (`reference/html-first/templates/`: dashboard, list, detail, settings, wizard, auth) dirender per profil ke `templates/<nama>.html`. Bagian opsional (`<!-- requires: Chart -->`) hilang bila komponennya di luar `{N}`; template yang butuh komponen inti di luar `{N}` dilewati dan dilaporkan.
7. **VP (kesesuaian profil)**, blocking, syarat T1: profil paket = brief; radius dan tinggi kontrol = profil; token nav terpilih = profil; set ikon = profil; `src/profile/<id>.css` ikut dipaketkan; tertiary netral; setiap template tepat satu `h1` dan maksimal satu item nav `aria-current`.

## 4.7 Keluaran bahasa desain

- `assets/design-language.json`: L1-L17 dengan `value`, `rationale`, `source`, `testable_consequence`; `archetype` dan `overrides`; tabel skor (bila `derive`); daftar ADR-L.
- Dokumen 05 (dirender dari JSON): prinsip, penjelasan tiap keputusan, contoh Do/Don't visual, tabel skor dan veto.
- `assets/lint-rules.json`: setiap larangan di L13 diterjemahkan menjadi aturan yang bisa dijalankan V6 (pola CSS/JS/token) atau item tinjauan manual bernomor.
- `ADR-L1` di dokumen 85: alasan pemilihan bahasa dan pemeriksaan koherensi.

## 4.8 Lapisan sistem: org → produk → brand

| Lapis | Isi | Sumber | Boleh mengubah | Tidak boleh mengubah |
|---|---|---|---|---|
| E Engine | baseline, invarian, struktur token, template komponen, validator | prompt ini | - | - |
| O Org (opsional) | `design-language.json` yang disetujui organisasi, berversi semver | B6 `inherits_from` | L1-L17 | baseline, invarian |
| P Produk | brief proyek | `<project_brief>` | maks **2** keputusan di L2-L12 dan L14-L17 terhadap lapis O, tema, kepadatan, komponen domain | nama token, kelas C, ikon status terkunci |
| T Brand / tenant | entri B6 `brands` | brief | seed interaksi dan aksen, hue netral, wordmark atau logo, keluarga font UI bila lisensi ada | radius, ruang, kepadatan, gerak, hue semantik, token struktur selain hue netral, komponen |

1. Nama token identik di semua lapis dan brand (V1). Brand hanya mengganti **nilai** token yang `varies_by` memuat `brand` (§5.9).
2. Setiap brand lolos V2 sendiri di semua tema. Brand yang gagal diturunkan oleh solver (§4.6 langkah 5).
3. Pemisahan hue (§5.3 langkah 1) dihitung terhadap **semua** brand sekaligus. Penyesuaian hue semantik berlaku untuk semua brand, karena token semantik tidak bervariasi per brand.
4. Entri pertama `brands` = default (`:root`). Tanpa `brands` = satu brand `default`.
5. Produk yang `inherit` mencatat `org_language.version` di manifest. Lebih dari 2 override = bahasa baru: wajib ADR dan mode berubah menjadi `custom`. Versi org naik major = `regenerate` dengan migrasi.
6. Situs dokumentasi menampilkan pemilih brand bila ada lebih dari satu brand; setiap preview dapat dilihat di semua brand × tema.
