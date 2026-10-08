<!-- ds-module id="M10" name="targets" engine="1.9.1" sections="§14" -->
# Modul M10 · Target implementasi

> Bagian dari Universal Design System Generator, engine `1.9.1`. Berisi §14. Dimuat di fase: 9, 11. Core menang bila bertentangan; modul ini hanya merinci.

---

# 14. TARGET IMPLEMENTASI `[ENGINE]` + `[BRIEF]`

Dokumen 90. Target berasal dari B4: satu **reference web** (wajib, dipakai untuk preview) dan nol atau lebih **production target** (Flutter, SwiftUI, Jetpack Compose, framework web lain, dsb.).

## 14.1 Prinsip

1. Reference web adalah implementasi yang benar-benar berjalan di situs dokumentasi. Target lain ditulis sebagai **spesifikasi + generator token + pemetaan komponen 1:1**; jangan mengklaim kode sudah dikompilasi bila tidak dijalankan (R4).
2. Library fondasi (mis. shadcn/ui, Radix, Material, Cupertino) **boleh** dipakai sebagai lapisan dasar bila terdaftar di B4 `foundation_libraries`. Keputusan itu dicatat sebagai ADR. Token, aturan, bahasa desain, dan komponen domain tetap milik sistem ini; library fondasi hanya penyedia perilaku dasar.
3. Kode aplikasi hanya mengimpor dari paket sistem (satu pintu masuk). Import langsung library fondasi di kode aplikasi adalah pelanggaran lint, agar fondasi bisa diganti di satu tempat.
4. Setiap field library pihak ketiga yang kamu rujuk diberi label **"Not verified against the pinned version"** sampai dicocokkan; catat sebagai asumsi `A-nn` untuk Sprint 0.

## 14.2 Struktur paket per target native (contoh generik)

```text
packages/{ns}_design/
  lib/
    {ns}_design.dart                 # satu-satunya import yang dipakai kode app
    src/tokens/
      {ns}_tokens.g.dart             # GENERATED: spacing, radius, size, z, opacity, layout, motion
      {ns}_colors.g.dart             # GENERATED: ThemeExtension bertipe (semua brand × tema)
      {ns}_type.dart                 # TextStyle dari skala tipe; angka tabular
    src/theme/                       # pembangun tema + pemetaan ke skema warna library fondasi
    src/components/<grup>/{ns}_<nama>.dart   # tepat satu file per komponen: {N} file
    src/internal/                    # helper non-komponen, berlabel "internal helper" (R7)
    src/icons/                       # ikon dengan makna terkunci (§5.7)
  assets/fonts/                      # font ter-bundle + file lisensi
  tool/generate_tokens.dart          # membaca tokens.json dari sistem ini
  test/                              # golden per tema, kontras, semantics, ukuran target, ukuran font
```

Untuk target lain (SwiftUI, Compose, framework web lain), pertahankan susunan yang sama: satu pintu masuk, token ter-generate, satu file komponen per komponen, folder helper internal, tes.

## 14.3 Aturan adapter

1. `tokens.json` adalah sumber kebenaran; file token target di-generate di CI dan tidak diedit tangan; CI gagal bila hasil generate berbeda dari yang di-commit (R1).
2. Font di-bundle sebagai asset bila ada surface offline-first atau `font_delivery: bundled`; tidak ada pemuatan font saat runtime.
3. Warna hanya dibaca dari objek tema sistem (ekstensi tema **bertipe** dengan `copyWith` dan `lerp`, bukan map tak bertipe), tidak pernah hex mentah.
4. State hanya menukar token, tidak mengubah ukuran atau posisi (I4).
5. **Pemilihan tema, brand, dan kepadatan** dibaca dari konfigurasi per surface di B3 dan konfigurasi tenant (mis. registry perangkat), bukan dari pengaturan sistem, bila brief menetapkan tema wajib untuk suatu surface. Pergantian tema tidak dianimasikan.
6. **Pemetaan ke library fondasi:** buat tabel peran token → field skema warna library (mis. `background`, `foreground`, `primary`, `destructive`, `border`, `input`, `ring`). Token yang tidak punya slot di library fondasi (semantik non-destruktif, data-viz, geografi domain, komponen) masuk ke ekstensi tema sistem. Sertakan contoh kelas ekstensi tema lengkap dengan semua field struktur, interaksi, dan semantik.
7. Setiap target menjaga kontrak STD-2 (font isi ≥ 16 dp), STD-4 (area klik ≥ 44×44 dp), dan text scale sampai 2.0 tanpa overflow.
8. **Selalu native, apa pun L14:** gestur dan navigasi kembali, fisika gulir, seleksi teks dan handle-nya, jenis keyboard dan autofill, lembar berbagi, dialog izin sistem, API aksesibilitas, safe area. L14 hanya menentukan tampilan kontrol (switch, picker, segmented control, alert) dan chrome navigasi.
9. **Pemetaan haptic** (label "Not verified against the pinned version" sampai dicocokkan; haptic tidak pernah satu-satunya kanal dan mengikuti pengaturan sistem):

   | Token | iOS | Android | Flutter | Web |
   |---|---|---|---|---|
   | `haptic-selection` | `UISelectionFeedbackGenerator` | `HapticFeedbackConstants.CLOCK_TICK` | `HapticFeedback.selectionClick` | tidak dipakai |
   | `haptic-success` | `UINotificationFeedbackGenerator` `.success` | `CONFIRM` (API 30+) | `HapticFeedback.lightImpact` | tidak dipakai |
   | `haptic-warning` | `UINotificationFeedbackGenerator` `.warning` | `LONG_PRESS` | `HapticFeedback.mediumImpact` | tidak dipakai |
   | `haptic-error` | `UINotificationFeedbackGenerator` `.error` | `REJECT` (API 30+) | `HapticFeedback.heavyImpact` | tidak dipakai |
   | `haptic-critical` | pola dari brief | `VibrationEffect` pola dari brief | `HapticFeedback.vibrate` | `navigator.vibrate` bila tersedia, selain itu tidak dipakai |

10. **Suara:** hanya aset dari brief atau bunyi sistem; tidak ada pemutaran otomatis selain event kritis (SC 1.4.2); volume dan bisu mengikuti sistem.

## 14.5 Adapter library fondasi (engine 1.8.0)

Bila brief B4 `targets.adapters` memilih adapter, `build.mjs` membangkitkan file tema library dari `tokens.json` dan aturan di `adapters/A0n-*.md` berlaku. Adapter tersedia: A01 Ant Design v6, A02 MUI v7, A03 shadcn/ui + Tailwind CSS 4, A04 Flutter Material 3. Aturan umum:

1. Adapter tidak pernah melonggarkan baseline. Default library yang melanggar STD-2 (AntD `fontSizeSM` 14, MUI `body2`/`button` 14, shadcn `text-sm` 14) dipaku ke token teks isi; default yang melanggar STD-4 diberi varian tema sentuh (`<ns>AntdTouch`, `MaterialTapTargetSize.padded`).
2. Turunan warna otomatis library (mis. `theme.darkAlgorithm`) tidak dipakai: semua slot diisi token yang sudah dibuktikan V2.
3. Slot yang dipakai library sebagai **teks** diisi varian `-strong`, bukan warna semantik solid (mis. error Form AntD, helper error MUI): warna solid hanya dijamin 3:1.
4. Token tanpa slot library (semantik non-destruktif, data-viz, kelas perhatian) masuk ekstensi tema sistem; komponen status tetap milik sistem.
5. Nama field library diberi label "verified against <versi>" hanya bila adapter sudah di-type-check atau dikompilasi terhadap versi itu (lihat bagian Verifikasi tiap adapter); selain itu "Not verified against the pinned version".

## 14.4 Tes yang dispesifikasikan per target

Golden test per brand × tema · tes kontras terhadap semua pasangan §5.5 · tes semantics (label dan role) · tes ukuran target pada **area klik**, bukan ukuran visual · tes ukuran font teks isi ≥ 16 · tes `textScaler`/Dynamic Type 2.0 tanpa teks terpotong · tes bahwa tidak ada hex mentah di folder komponen · tes parity daftar komponen (V10).
