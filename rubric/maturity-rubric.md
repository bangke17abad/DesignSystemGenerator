# Rubrik kematangan design system

Engine 1.8.0 · dipakai `tools/score.mjs` (fase 15) dan oleh peninjau manusia. Skor menunjukkan **di mana** paket masih tipis; ia tidak menggantikan tier pengiriman (core §16.5) dan tidak pernah menaikkan tier.

## Aturan hitung

- Enam dimensi, masing-masing level 0-4. Skor total = jumlah level (maks 24).
- Satu validator **blocking** FAIL di sebuah dimensi → dimensi itu level 0, apa pun hasil lainnya.
- **NOT RUN** dihitung sebagai belum terbukti, bukan PASS (R4, R10). **NOT APPLICABLE** tidak dihitung.
- D2 juga membaca `reports/qa.json`: QA browser NOT RUN membatasi D2 di level 3; QA FAIL membatasi D2 di level 1.

| Level | Arti | Syarat mekanis |
|---|---|---|
| 4 | teruji penuh | semua validator yang berlaku PASS, tidak ada NOT RUN |
| 3 | matang | tidak ada FAIL; sebagian NOT RUN |
| 2 | cukup | satu FAIL advisory, atau lebih dari sepertiga NOT RUN |
| 1 | rapuh | dua FAIL advisory atau lebih, atau kurang dari separuh yang berlaku PASS |
| 0 | gagal blocking | ada FAIL blocking |

## Dimensi

| ID | Dimensi | Validator | Pertanyaan peninjau |
|---|---|---|---|
| D1 | Fondasi token | V1, V14, V16, VB3-VB6 | Apakah setiap nilai lahir dari primitif lewat alias semantik, dan apakah build dua kali menghasilkan byte yang sama? |
| D2 | Aksesibilitas | V2, V11, V12, VB8 + QA | Apakah baseline STD-1..4 terbukti di browser (axe, fokus, reflow 320, forced-colors, RTL, tanpa JS), bukan hanya di laporan kontras? |
| D3 | Kualitas visual | V6, V13, VB1, VB2, VB7, VB9-VB12 | Apakah skala, elevasi, dan hierarki teks terbedakan, dan apakah layar lolos `visual-review.md` tanpa catatan "terlihat dibuat mesin"? |
| D4 | Komponen dan pattern | V5, V9, V10, V17, V19 | Apakah setiap komponen di {N} punya halaman, preview, konten per locale, dan pattern {P} hanya merujuk {N}? |
| D5 | Dokumentasi dan bahasa | V3, V4, V7 | Apakah dokumen dan token sepakat, tautan hidup, dan bahasa situs sesuai brief? |
| D6 | Mode, platform, ekosistem | V8, V15, V18, V20-V22 | Apakah semua mode jalan (tema × brand × kepadatan), adapter sinkron, anggaran ukuran terpenuhi, aturan pack dipatuhi? |

## Membaca skor

- **Dimensi terlemah lebih penting dari total.** Paket 20/24 dengan D2 = 0 tidak boleh dikirim; paket 16/24 dengan semua dimensi ≥ 2 bisa dikirim di tier T1.
- Hubungan wajar dengan tier: T0 biasanya D1 dan D3 ≥ 3; T1 menambah D4 ≥ 3; T2 menambah D2 = 4 dan D5 ≥ 3; T3 menambah D6 ≥ 3.
- Paket referensi engine (archetype tanpa konten run) wajar mendapat D4 = 0 karena V5 menandai locale yang belum ditulis. Itu benar: konten adalah tugas run, bukan engine.

## Yang tidak diukur skor

Skor tidak menilai selera, kecocokan merek, atau apakah produk memecahkan masalah pengguna. Untuk itu: tinjauan visual manusia (`visual-review.md`), uji pengguna, dan ADR yang ditulis selama run. Catat temuan yang berulang lintas paket ke `engine-findings/` (R19) agar engine yang berubah, bukan tiap paket ditambal tangan.
