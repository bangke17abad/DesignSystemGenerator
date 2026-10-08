<!-- ds-adapters engine_min="1.8.0" -->
# Adapter pack

**Adapter pack** adalah pemetaan satu arah dari token sistem (`assets/tokens.json` → `tokens.css`) ke API tema sebuah library fondasi pihak ketiga, beserta override yang menjaga baseline STD-1..STD-4 tetap berlaku di dalam library itu. Setiap adapter terdiri dari:

1. **Generator** di `tools/adapters/index.mjs` (deterministik, tanpa dependensi, dipanggil `tools/build.mjs`).
2. **Dokumen** `adapters/A0n-*.md`: lingkup, cara pakai, tabel pemetaan token → field library, override baseline, pitfall, tanggung jawab sistem, bukti verifikasi, dan daftar Not verified.

Adapter tidak membuat komponen. Komponen library tetap komponen library; komponen sistem (status C1-C6, pola, layout) tetap dibangun dari token.

## Cara brief memilih adapter

Di B4 brief:

```yaml
targets:
  adapters: ["A01-antd-v6", "A03-shadcn-tailwind4"]
```

`tools/build.mjs` (`defaultTargets`) memetakan id ke generator:

| Id adapter | Generator | Output |
|---|---|---|
| `A01-antd-v6` | `antd` | `adapters/antd/theme.g.ts` |
| `A02-mui-v7` | `mui` | `adapters/mui/theme.g.ts` |
| `A03-shadcn-tailwind4` | `shadcn` + `tailwind` | `adapters/shadcn/shadcn.css`, `assets/tailwind.theme.css` |
| `A04-flutter-material3` | `flutter` | `packages/<ns>_design/lib/src/tokens/<ns>_{colors,tokens,theme}.g.dart` |

Manual: `node tools/build.mjs <outDir> --targets antd,mui,shadcn,tailwind,flutter --ns <NS>`.

## Aturan

1. **Adapter tidak pernah melonggarkan baseline (R13).** Bila default library melanggar STD (mis. AntD `fontSizeSM` 14, MUI `body2` 14, shadcn `text-sm` 14, M3 `bodySmall` 12, tinggi kontrol < 44 di sentuh, warna status sebagai teks < 4.5:1), adapter wajib meng-override-nya. Adapter boleh memperketat, tidak boleh melonggarkan.
2. **Nama field library berlabel "Not verified" sampai sebuah run mem-pin versinya (R4).** Pin = memasang versi library yang tepat dan membuktikan file hasil generator lolos type-check/kompilasi terhadapnya. Hasilnya dicatat di atribut `verified_version` header dokumen dan di baris header file hasil (`Library field names verified against ...`). Target yang belum dikompilasi tetap memuat label `Not verified against the pinned version`.
3. **Tidak ada algoritma turunan library di atas token yang sudah dibuktikan.** Algoritma warna library (AntD `darkAlgorithm`, M3 `surfaceTint`, dll.) tidak dipakai; setiap turunan yang memengaruhi teks atau kontrol dipin ke token sistem.
4. **Peran warna tetap terpisah (I1).** Slot interaksi library hanya menerima token interaksi; slot status hanya token semantik. Token tanpa slot library tidak dipaksakan ke slot yang salah; dibaca langsung dari `tokens.css` / ekstensi tema.
5. **Tema mengikuti `[data-theme]` sistem**, bukan mekanisme tema library (`.dark`, `prefers-color-scheme`), kecuali library butuh objek tema per mode (AntD, MUI, Flutter): maka satu objek per mode `brand/theme` digenerate.
6. **File hasil adalah hasil build (R1).** Ubah generator atau token, jangan file `*.g.*`.
7. **Upgrade versi library = run verifikasi ulang** dan pembaruan tabel di bawah.

## Status adapter

| Id | Library | Versi terverifikasi | Bukti | Status |
|---|---|---|---|---|
| [A01-antd-v6](A01-antd-v6.md) | antd | **6.6.5** | `tsc --strict` (TS 7.0.2 dan 5.9.3) 4 paket: 0 error di file hasil; 2 error upstream di `@rc-component/*` d.ts saat `skipLibCheck false` | PASS (type-check) |
| [A02-mui-v7](A02-mui-v7.md) | @mui/material | **7.3.11** | `tsc --strict --skipLibCheck false` 4 paket: exit 0 | PASS (type-check) |
| [A03-shadcn-tailwind4](A03-shadcn-tailwind4.md) | tailwindcss + shadcn/ui | **tailwindcss 4.3.3**; kontrak shadcn new-york-v4 (2026-10-08) | `@tailwindcss/cli` kompilasi 4 paket: exit 0, utilitas sistem dan shadcn terbentuk, 0 var cycle | PASS (compile) |
| [A04-flutter-material3](A04-flutter-material3.md) | Flutter (Material 3) | — (API dicek di api.flutter.dev 2026-10-08) | SDK tidak tersedia; review manual | Not compiled (SDK not available) |

Target non-adapter dari generator yang sama: Compose (`compose`) dikompilasi `kotlinc` 2.0.21 terhadap stub signature Compose (bukan artefak asli) — PASS terbatas; SwiftUI (`swiftui`) Not compiled; variabel alat desain (`figma`) — nilai `scopes` lolos type-check terhadap `VariableScope` di `@figma/plugin-typings` 1.141.0, semua alias variabel ter-resolve.
