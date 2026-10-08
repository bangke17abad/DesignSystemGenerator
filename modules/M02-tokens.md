<!-- ds-module id="M02" name="tokens" engine="1.9.1" sections="§5" -->
# Modul M02 · Arsitektur token

> Bagian dari Universal Design System Generator, engine `1.9.1`. Berisi §5. Dimuat di fase: 0A, 1, 9. Core menang bila bertentangan; modul ini hanya merinci.

---

# 5. ARSITEKTUR TOKEN `[ENGINE]`

## 5.1 Tiga lapis

1. **Primitif:** dua ramp warna per keluarga (12 langkah `light` dengan resolusi halus dekat putih, 12 langkah `dark` dengan resolusi halus dekat hitam), seed merek persis, dan primitif alfa. **Tidak pernah dipakai komponen.**
2. **Semantik (peran):** setiap token warna semantik di setiap mode **wajib alias** `{primitive.color.<keluarga>.<polaritas>.<langkah>}` (V1, perbaikan F33: hex mentah di lapis semantik ditolak). `color-structure-*`, `color-interaction-*`, `color-semantic-*`, `color-brand-*` (opsional, hanya bila L2 memisahkan merek dari interaksi), data-viz, tipe, ruang, bentuk, dst.
3. **Komponen:** alias per komponen yang di-resolve ke token semantik per tema (R2). `derive-tokens.mjs` membangkitkan lapis ini dari L3 dan L16 (daftar di `catalog/token-names.json` → `component_always`): `button-*`, `control-*`, `row-background-*`, `nav-item-*`, dan `attention-c1..c6-{background,foreground,border,icon}` yang menerjemahkan kebijakan perhatian L3 menjadi token, sehingga CSS referensi yang sama benar untuk setiap bahasa.

## 5.2 Grup token wajib

| Grup | Nama | Catatan |
|---|---|---|
| Struktur | `color-structure-surface-{base,sunken,raised,overlay,inverse}` · `color-structure-border` · `-border-strong` · `-border-control` · `color-structure-text-{primary,secondary,tertiary,placeholder,disabled,oninverse}` · `color-structure-scrim` · `color-structure-selection` · `color-structure-shadow` · `color-structure-highlight` · `color-structure-skeleton` | `border` dan `border-strong` sengaja < 3:1 (bingkai); `border-control` ≥ 3:1 (kontrol); `text-placeholder` ≥ 4.5:1 (STD-3); `text-disabled` hanya untuk komponen disabled (dikecualikan SC 1.4.3); `scrim` = warna + alfa latar overlay, dipakai di `z-nav-scrim` dan `z-overlay-scrim`; `selection` = latar baris atau item terpilih; `shadow` = warna dasar bayangan; `highlight` = latar kecocokan pencarian; `skeleton` = isi placeholder loading |
| Interaksi | `color-interaction-{default,hover,pressed,subtle,border,on-solid}` · `color-focus-ring` · `color-focus-ring-inverse` | sumber nilai sesuai L2; `focus-ring-inverse` dipakai di atas `surface-inverse`, fill semantik solid, dan overlay event kritis |
| Semantik | `color-semantic-{critical,warning,positive,info,neutral-negative}` dengan sufiks `-strong` (teks), `-subtle` (latar), dan `color-semantic-on-{critical,warning,positive,info,neutral-negative}` | tanpa sufiks = grafis dan fill solid; kelima `on-*` **selalu** dibuat agar himpunan token identik antar bahasa desain, walau L3 tidak mengizinkan fill untuk kelas tertentu |
| Merek | `color-brand-{default,subtle,on}` | selalu dibuat; hanya dipakai bila L2 mengizinkan; tidak pernah untuk status; `color-brand-on` dipilih solver (teks gelap atau terang yang lolos 4.5:1 di atas `default` dan `subtle`) dan hanya relevan bila L2 memakai blok merek |
| Data-viz | `chart-cat-1..5`, `chart-cat-other`, `chart-seq-{100,300,500,700,900}`, `chart-hatch-line`, opsional `chart-div-*` | L10, §4.5(c6) |
| Geografi domain | `map-*` atau sejenisnya | hanya bila B5 memerlukan peta atau diagram spasial; tidak muncul di luar konteksnya |
| Tipe | `font-sans`, `font-mono`, `font-display` (opsional), `type-{display,h1,h2,h3,label,body,body-lg,caption,code}-{size,line,weight}` plus token tampilan angka bila B5 butuh | lantai STD-2 |
| Ruang | `space-half` (2 px) dan `space-{k}` (k × 4 px) | k dari §4.5(c4) atau L5; nomor = kelipatan, bukan urutan; langkah yang tidak dipakai bahasa tidak dibuat |
| Bentuk | `radius-{none,xs,sm,md,lg,full}` · `border-width-{thin,thick}` | L6; penugasan radius di §4.5(c4) |
| Elevasi | `elevation-{0,1,2,...}` | nilai per tema, valid CSS (R2) |
| Gerak | `motion-{instant,fast,base,slow}-duration` · `motion-easing-*` · `motion-stagger-max` | L8 |
| Ukuran | `icon-{sm,md,lg}` · `icon-stroke` · `aspect-{square,photo,video}` (1/1, 4/3, 16/9) · `control-height-{sm,md,lg}` · `avatar-*` · `target-min-{pointer,touch}` (+ `target-min-extended` bila B3 punya modalitas `glove` atau `in-motion`) | STD-4 |
| Lapisan | `z-{base,sticky,panel,nav-scrim,nav-overlay,overlay-scrim,modal,popover,toast,tooltip,critical}` = 0, 10, 20, 29, 30, 39, 40, 50, 60, 70, 80 | `z-critical` hanya bila ada event kritis (I5) |
| Opasitas | `opacity-disabled` | |
| Material | `material-blur-{sm,md,lg}` · `material-surface-alpha` · `color-structure-surface-translucent` | L15; selalu dibuat; bahasa tanpa translucency memberi blur 0 dan alfa 1 |
| State | `state-layer-{hover,pressed,selected,dragged}-opacity` · `state-press-transform` | L16, §6.9; bahasa `token-swap` memberi 0 dan `none` |
| Haptic dan suara | `haptic-{selection,success,warning,error,critical}` · `sound-{critical,success}` | L16; haptic bernilai `none` atau nama pola netral (§14.3); suara bernilai path aset dari brief atau `none`; engine tidak membuat file audio |
| Target runtime | `target-current` | bernilai 24 di pointer halus, 44 di `(any-pointer: coarse)`, `target-min-extended` di surface glove/in-motion; ditulis `build.mjs`; semua area klik = max(ukuran visual, `target-current`) |
| Fokus dan bentuk | `focus-ring-width`, `focus-ring-offset` (2 / 2) · `shape-circle` (50%) | `shape-circle` untuk lingkaran semantik (radio, avatar bulat, spinner); tidak terkena larangan radius L13 |
| Waktu | `timing-{tooltip-delay,close-delay,toast-default,toast-with-action,spinner-max,indicator-delay,indicator-min-visible,debounce,typeahead}` | 500 · 100 · 6000 · 10000 · 2000 · 300 · 500 · 300 · 500 ms; sebelumnya ditulis sebagai angka ajaib di komponen |
| Layout | `layout-*` (tinggi bar global, lebar nav, rail, panel, minimum konten, lebar modal, `layout-row-height`, `layout-measure`, `layout-content-max`, `space-section`, `space-section-lg`) dan `bp-*` | §8, L17; `layout-measure` = lebar baca maksimum teks berjalan, default 72ch |

## 5.3 Penurunan palet (`tools/derive-tokens.mjs`, disediakan engine) `[ENGINE]`

Palet diturunkan oleh skrip, bukan ditebak. Bila brief memberi palet persis, skrip memakainya dan hanya memverifikasi.

1. **Seed:** netral (hue dan chroma dari suhu di L2), warna interaksi/aksen (dari brand seed atau L2), target hue semantik dalam OKLCH: `critical` ≈ 25°, `warning` ≈ 75°, `positive` ≈ 155°, `info` ≈ 250° (atau netral bila L2 menetapkan info netral), toleransi ±10°.
   - **Pemisahan peran (I1):** selisih hue antara warna interaksi (bila chroma ≥ 0.08) dan setiap keluarga semantik minimal 30°. Bila bentrok dengan `info`, info memakai varian netral (ramp netral + ikon info). Bila bentrok dengan `critical`, `warning`, atau `positive`, hue semantik digeser menjauh dari interaksi dalam toleransi ±10°; bila selisih masih < 30°, warna merek **tidak** diubah: tulis ADR, andalkan ikon dan teks (I2), dan tandai di `contrast-report.md`. Dengan lebih dari satu brand, pemeriksaan ini dijalankan terhadap semua brand (§4.8).
2. **Ramp:** dua ramp per keluarga. `light`: L 0.993, 0.975, 0.95, 0.92, 0.88, 0.82, 0.73, 0.62, 0.52, 0.44, 0.35, 0.24. `dark`: L 0.97, 0.91, 0.83, 0.74, 0.64, 0.54, 0.44, 0.36, 0.30, 0.255, 0.215, 0.18. Chroma dibatasi gamut sRGB (pengurangan chroma, hue tetap) dan batas L2, dengan taper di ujung terang/gelap.
3. **Penugasan peran per tema:** untuk setiap peran di §5.2, pilih langkah ramp terdekat dari target L2 yang memenuhi semua pasangan di §5.5. Solver naik atau turun langkah sampai lolos; bila tidak ada langkah yang lolos, ubah chroma, lalu hue (maksimal ±6°), dan catat.
4. **Penurunan tema:**
   - *Light:* permukaan terang, teks gelap.
   - *Dark:* balikkan hubungan luminans (bukan sekadar membalik hex); kurangi chroma 10-20%; elevasi lewat border atau tonal.
   - *High-contrast / Outdoor:* teks mendekati hitam, border dan border-kontrol lebih kuat, bayangan diganti border, fill warning solid dengan teks kontras tinggi.
   - Tema lain di brief: tulis aturan penurunannya di L12 sebelum membuat nilainya.
5. **Hatch dan pola:** token warna garis hatch ditentukan terpisah dan diuji terhadap teks di atasnya (STD-3).
6. **Keluaran:** `tokens.json` (nilai akhir + `derivation` per token: seed, langkah ramp, rasio kontras), `contrast-report.md` (semua pasangan, rasio per tema, rasio terendah).
7. **Kunci:** nama token identik di semua tema dan brand (V1). Perbedaan hanya pada nilai.
8. **Brand:** langkah 1-7 dijalankan per entri B6 `brands`; seed tiap brand dicatat di `derivation`.

## 5.4 Penurunan skala non-warna

Skala tipe, spasi, radius, elevasi, dan gerak diambil dari L4-L8 dan L17. Setiap nilai harus memenuhi lantai baseline (teks isi ≥ 16, caption ≥ 12, area klik ≥ 44×44 pada sentuh). Nilai yang melanggar otomatis dinaikkan dan dicatat sebagai penyesuaian baseline di `design-language.json` (R13).

## 5.5 Pasangan kontras wajib (V2), setiap brand × tema

| Kelompok | Pasangan | Minimum |
|---|---|---|
| Teks di surface | `text-primary`, `text-secondary`, `text-tertiary`, `text-placeholder` di atas `surface-base`, `surface-sunken`, `surface-raised`, `surface-overlay` | 4.5:1 |
| Teks di fill subtle | `text-primary`, `text-secondary`, `text-tertiary` di atas kelima `*-subtle`, `interaction-subtle`, `selection`, dan `highlight` | 4.5:1 |
| Teks tautan dan interaksi | `interaction-default` dan `interaction-hover` (tautan, tab, tombol tersier) di atas tiga surface dan `interaction-subtle` | 4.5:1 |
| Teks semantik | `*-strong` di atas semua surface, dan di atas `*-subtle` masing-masing | 4.5:1 |
| Konten di atas fill | setiap `on-{status}` di atas warna semantik solid-nya (kelima status); `interaction-on-solid` di `interaction-default`, `-hover`, `-pressed`; `text-oninverse` di `surface-inverse` | 4.5:1 |
| Teks di atas pola | teks di atas pola hatch: diuji terhadap warna latar dan warna garis, ambil terburuk | 4.5:1 |
| Teks di atas state layer | `text-primary`, `text-secondary`, dan warna teks kontrol di atas warna **komposit** surface + `state-layer-*` (hover, pressed, selected, dragged) dan fill solid + state layer | 4.5:1 |
| Teks di atas translucency | `text-primary` dan `text-secondary` di atas `surface-translucent` yang dikomposit di atas latar terburuk: hitam, putih, dan dua titik ekstrem kanvas bila kanvas dideklarasikan; bila gagal, solver menaikkan `material-surface-alpha` | 4.5:1 |
| Blok merek | `color-brand-on` di atas `color-brand-default` dan `color-brand-subtle` (bila L2 memakai blok merek) | 4.5:1 |
| Kontrol | `border-control` di atas tiga surface | 3:1 |
| Fokus dan interaksi (grafis) | `focus-ring` dan `interaction-default` di atas tiga surface dan `surface-overlay`; `focus-ring` (inset) di atas `selection`, `interaction-subtle`, dan kelima `*-subtle`; `focus-ring-inverse` di atas `surface-inverse` dan kelima warna semantik solid | 3:1 |
| Grafis semantik | kelima warna semantik tanpa sufiks di atas empat surface (termasuk `surface-overlay`), dan di atas `*-subtle` masing-masing | 3:1 |
| Hover destruktif | `color-semantic-on-critical` di atas `color-semantic-critical-strong` (dipakai `button-destructive-*-hover`) | 4.5:1 |
| Data-viz | tiap `chart-cat-*` di atas `surface-base` dan `surface-raised` (3:1); `chart-seq-*`: selisih lightness OKLab tetangga ≥ 0.08 dan `chart-seq-900` ≥ 3:1 terhadap `surface-base` | lihat kolom |
| Simulasi buta warna | pasangan `chart-cat-*` bertetangga (blocking) dan pasangan grafis semantik critical–positive, warning–positive (advisory: makna dibawa ikon + teks, I2; solver menggeser lightness positive satu langkah bila bisa) setelah simulasi protan, deutan, dan tritan (Machado dkk. 2009, severity 1.0) | jarak OKLab ≥ 0.04 |
| Sengaja rendah | `border` dan `border-strong` di atas `surface-base` | **harus < 3:1** (dicatat "by design", hanya untuk bingkai) |
| Cakupan | setiap baris di atas dihitung untuk **setiap kombinasi brand × tema** (§5.9) | sesuai baris |

## 5.6 Tipografi

- Keluarga dari L4; wajib berlisensi terbuka atau berlisensi yang ditunjukkan di brief. Sertakan file lisensi (mis. OFL). **Bila `offline_required_surfaces` tidak kosong atau `font_delivery: bundled`, font di-bundle sebagai file lokal, tanpa CDN dan tanpa pemuatan runtime.**
- Fallback stack wajib untuk setiap keluarga. Bobot hanya yang dideklarasikan di L4.
- Semua angka (harga, waktu, jarak, skor, kuantitas, identifier numerik) memakai `font-variant-numeric: tabular-nums` atau padanan di target.
- Token tipe memuat ukuran, tinggi baris, bobot, dan tracking; tiap token diberi label **teks isi** atau **teks pendukung** (§3A.2).

## 5.7 Ikon dan makna terkunci

Set ikon dari L9. Ikon mewarisi warna teks, kecuali ikon status yang memakai `color-semantic-{status}`. Kunci satu glyph per makna dan jangan dipakai ulang untuk makna lain:

| Makna | Konsep glyph (tulis nama persis dari set terpilih) |
|---|---|
| critical | segi delapan + tanda seru |
| warning | segitiga + tanda seru |
| positive | lingkaran + centang |
| info | lingkaran + huruf i |
| neutral-negative | lingkaran + minus |
| waktu | jam (bukan status) |
| riwayat | panah melingkar balik |
| aksi terbatas peran | gembok |

Nama glyph persis per set ikon archetype ada di §4.5(c3). Bahasa `custom` wajib mengisi tabel yang sama.

## 5.8 Format keluaran per target

`tokens.json` → `tokens.css` (selektor sumbu `[data-theme="..."]`, `[data-brand="..."]`, `[data-density="..."]` dan kombinasi `[data-brand="..."][data-theme="..."]`; mode pertama tiap sumbu = `:root` dan fallback) dan, per target di B4: tipe Dart/`ThemeExtension`, Swift `Color`/`Font` extension, Kotlin object/`CompositionLocal`, preset Tailwind, atau format yang diminta. Generator membaca satu `tokens.json`; CI gagal bila hasil generate berbeda dari yang di-commit (R1).

## 5.9 Sumbu mode

Setiap token mendeklarasikan sumbu yang memengaruhi nilainya di `$extensions.ds.varies_by` (§16A). Hanya tiga sumbu yang dikenal engine ini.

| Sumbu | Nilai | Sumber | Token yang boleh bervariasi | Aturan |
|---|---|---|---|---|
| `theme` | nama tema di B6 `themes` | L12 | semua warna, `elevation-*` | semua tema lolos V2 |
| `brand` | `id` di B6 `brands` (default `default`) | §4.8 | `color-interaction-*`, `color-focus-ring*`, `color-brand-*`, ramp netral beserta token struktur turunannya, `font-sans` bila brand menyediakannya | token semantik tidak pernah bervariasi per brand |
| `density` | subset `compact`, `comfortable`, `spacious` dari B3 `density_modes` | L5 | `control-height-*`, `layout-row-height`, `layout-bar-height`, `space-cell-*`, `space-chip-*`, `type-*-size/line`, `type-input-size` | `comfortable` = nilai §4.5(c4); `spacious` = +4 px. `compact` (engine 1.9.1, STD-2c): kontrol 24/32/40, baris = md + 8, header 56, sel tabel 4 × 8, chip/status 0 × 6, tipe body/label 14, code 13, caption 12, h3/h2/h1/display 18/20/22/28 (masing-masing min dengan archetype). Di pointer kasar, compact mempertahankan tipe dan padding, tetapi `control-height-*`, `layout-row-height`, dan `type-input-size` kembali ke comfortable (input ≥ 16 agar iOS tidak zoom; target tetap `target-current`). Skala spasi `space-1..` tidak berubah. |

- Kunci mode: warna `"<brand>/<theme>"`; ukuran `"<density>"`.
- Modalitas pointer vs sentuh **bukan** sumbu token. Area klik dihitung saat runtime = max(ukuran visual, `target-min-touch` atau `target-min-pointer`) sesuai STD-4.
- Default per surface: tema dan kepadatan dari B3; brand dari konfigurasi tenant saat runtime.
- V1 memeriksa bahwa setiap token punya nilai di setiap kombinasi sumbu yang dideklarasikannya; V2 dijalankan per brand × tema.
