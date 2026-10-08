---
name: design-system-generator
description: Generate a complete, verified design system package (tokens, components, patterns, docs site, library adapters) from a product brief. Use when asked to create, regenerate or extend a design system, design tokens, or a component library for a product.
---

# Design System Generator 1.8.0

Engine untuk menghasilkan paket design system dari brief: token tiga lapis (primitive → semantic → component), 74 komponen kanonis, 21 pattern dasar, situs dokumentasi, preview, adapter (AntD, MUI, shadcn/Tailwind, Flutter, SwiftUI, Compose, Figma), dan bukti verifikasi. Prioritas aturan: **BASELINE > INVARIANT > BRIEF > PACK > LANGUAGE > ENGINE**.

## Progressive disclosure: baca seperlunya

Jangan memuat semua modul sekaligus. Mulai dari `core.prompt.md`, lalu buka modul hanya untuk fase yang sedang jalan:

| Fase | Baca | Jalankan |
|---|---|---|
| 0 brief | `brief.template.md`, `modules/M00-run-modes.md` | tulis `out/brief.normalized.json` (skema `schemas/brief.normalized.schema.json`) |
| 0B / 1 bahasa + token | `M01-design-language.md`, `M02-tokens.md` | `resolve-language.mjs`, `derive-tokens.mjs`, `build.mjs` |
| 3-5 komponen + lifecycle | `M03-components.md`, `M04-lifecycle.md`, `catalog/components/` | `compose.mjs` |
| 6-7 layout + aksesibilitas | `M05-layout-platform.md`, `M06-accessibility.md` | `render-previews.mjs`, `qa.mjs` |
| 8-10 role, journey, konten | `M07-roles.md`, `M08-journeys-patterns.md`, `M09-content.md`, `catalog/patterns/` | tulis konten per locale |
| 11-12 target + ekosistem | `M10-targets.md`, `M11-ecosystem.md`, `adapters/` | `build.mjs` (adapter dari B4) |
| 13-15 kontrak + verifikasi | `M12-data-contracts.md`, `M13-verification.md`, `rubric/` | `render-site.mjs`, `validate.mjs`, `score.mjs` |

Pack domain (`packs/P01..P04`) hanya dibaca bila brief B7 memilihnya.

## Pipeline

```bash
E=<folder engine>; O=out
node $E/tools/resolve-language.mjs $O/brief.normalized.json $O
node $E/tools/derive-tokens.mjs    $O/brief.normalized.json $O
node $E/tools/build.mjs            $O
node $E/tools/compose.mjs          $O
node $E/tools/render-previews.mjs  $O --ns <NS>
node $E/tools/render-site.mjs      $O
node $E/tools/qa.mjs               $O      # Playwright + axe; tanpa browser → NOT RUN
node $E/tools/validate.mjs         $O      # exit 1 bila ada FAIL blocking
node $E/tools/score.mjs            $O
```

Setelah pipeline mesin, run menulis yang khas proyek (komponen dan pattern domain, glosarium, journey, konten locale tambahan), lalu menjalankan `validate.mjs` dan `score.mjs` lagi.

## Aturan yang tidak boleh dilanggar

- **Jangan edit file hasil generate dengan tangan** (`tokens.css`, `tokens.json`, adapter, preview). Ubah brief atau engine, lalu generate ulang. V16 menangkap edit tangan.
- **Baseline**: WCAG 2.2 AA; teks isi ≥ 16 px (caption ≥ 12); semua teks ≥ 4.5:1; target sentuh ≥ 44 px (48 untuk glove/in-motion). Tidak ada pengecualian "teks besar 3:1".
- **Semantik selalu alias primitif**; tidak ada hex di lapis semantic/component.
- **Jujur soal bukti (R4, R10)**: validator yang tidak bisa jalan ditulis NOT RUN, bukan PASS. Klaim tier hanya dari `reports/verification.json`.
- **Gerbang blocking**: V1, V2, V4, V5, V11, V14, V16, VB1, VB2, VB4, VB5, VB8. Jangan kirim paket dengan FAIL blocking.
- **Tier**: T0 fondasi, T1 komponen R + pattern R, T2 lengkap, T3 ekosistem (core §16.5). Kirim sesuai `delivery_tier_target` di brief; kalau belum tercapai, kirim tier yang tercapai dan sebutkan apa yang kurang.
- **Tinjauan visual**: setiap halaman pattern dicek terhadap `rubric/visual-review.md` (VR-01..15) di tema terang dan gelap.

## Saat engine yang salah

Kalau masalah yang sama muncul di lebih dari satu paket, itu temuan engine (R19): catat di `engine-findings/` dengan bukti dan usulan perubahan, jangan menambal paket satu per satu. Setelah mengubah engine:

```bash
node tools/run-fixtures.mjs        # golden fixtures, harus lolos semua
node tools/check-catalog.mjs
node tools/check-patterns.mjs
node tools/dev/ref-check.mjs <Komponen…>   # bila menyentuh reference/html-first
```

## Lingkungan tanpa Node

Di chat tanpa eksekusi kode, engine tetap bisa dipakai sebagai prompt (`core.prompt.md` + modul per fase), tetapi semua validator NOT RUN dan tidak ada tier yang boleh diklaim (R18).
