# Reference html-first · aturan implementasi

Implementasi referensi ini dipakai ulang oleh setiap paket yang dibuat engine 1.8.0. CSS yang sama harus benar untuk kesembilan archetype, semua tema (terang, gelap, kontras tinggi), pointer dan sentuh, LTR dan RTL. Karena itu komponen hanya membaca token, tidak pernah memutuskan estetika sendiri.

## Berkas per komponen

| Berkas | Isi |
|---|---|
| `components/<Name>.css` | Gaya komponen. Wajib ada untuk setiap komponen yang punya fixture. |
| `components/<Name>.js` | Opsional. Script klasik (bukan module, agar jalan dari `file://`): `DS.register('kebab-name', function (el) { … })`. Hanya memperkaya; isi dan aksi inti tetap jalan tanpa JavaScript (§6.4). |
| `fixtures/<Name>.html` | Fragmen HTML: blok `<section class="ds-demo" data-ds-demo="<label>">…</section>` yang memperlihatkan setiap varian, ukuran, state, dan kombinasi wajib di field `preview` record katalog, ditambah edge case (label panjang, konten RTL-sensitif). |

Sumber perilaku adalah `catalog/components/<Name>.json`: anatomi, varian, ukuran, state, behaviour, aksesibilitas, responsive, dan edge case diterapkan apa adanya.

## Konvensi

- Prefiks kelas `ds-`, bagian BEM `ds-<name>__<part>`, varian dan ukuran sebagai atribut (`data-variant`, `data-size`). Prefiks `ds`/`DS` diganti namespace proyek saat dipaketkan (`tools/render-previews.mjs --ns`).
- State statis untuk preview: setiap `:hover` punya kembaran `[data-force~="hover"]`, `:active` punya `[data-force~="pressed"]`, `:focus-visible` punya `[data-force~="focus"]`.
- `:hover` hanya di dalam `@media (hover: hover)` (§6.9).
- Area klik: `min-block-size: max(<token ukuran visual>, var(--target-current))` dan `min-inline-size: var(--target-current)`. Untuk checkbox, radio, dan switch, label adalah target.
- Aksi diblokir: `aria-disabled="true"` + alasan yang terlihat (UB10). Atribut `disabled` native hanya untuk kontrol yang benar-benar tidak relevan. Input teks yang diblokir: `readonly` + `aria-disabled` + alasan.
- Read-only bukan disabled: nilai berkontras penuh, `aria-readonly`.
- Fokus: ring dari base.css (`--focus-ring-width`, `--focus-ring-offset`, `--color-focus-ring`); inset (`outline-offset: calc(-1 * var(--focus-ring-width))`) untuk baris, item navigasi, dan tab; `--color-focus-ring-inverse` di atas fill solid atau `surface-inverse`.
- Status: tidak pernah perlakuan tetap. Pakai token kelas perhatian `--attention-c1..c6-{background,foreground,border,icon}` (L3). Setiap status = ikon terkunci + teks; C6 tanpa ikon status.
- Breakpoint hanya lewat placeholder `(--bp-tablet-up)`, `(--bp-desktop-up)`, `(--bp-wide-up)`, `(--bp-tablet-down)`, `(--bp-desktop-down)`, `(--bp-wide-down)`; boleh digabung (`@media (hover: hover) and (--bp-tablet-up)`).
- Ikon: `<svg class="ds-icon" aria-hidden="true"><use href="#ds-i-NAME"/></svg>` dari `icons.json` (glyph placeholder; run menggantinya dengan set L9). Ikon berarah diberi `data-mirror`.
- Komposisi: fixture boleh memakai komponen lain (Button, StatusLabel, …). `render-previews` membundel otomatis komponen di `depends_on` dan komponen yang kelasnya muncul di fixture.
- Pengumuman lewat `DS.announce(pesan, 'polite' | 'assertive')`; assertive hanya untuk C1 dan event kritis.

## Larangan (dicek `tools/dev/ref-check.mjs` dan V6)

Tanpa hex, tanpa fungsi warna (`rgb()`, `oklch()`, …), tanpa angka px ajaib (hanya `0`, `1px`, `-1px`), tanpa durasi literal (pakai `--motion-*` atau `--timing-*`), `font-size` hanya dari token tipe, `z-index` hanya token `--z-*` (atau -1..2 lokal), hanya properti logis (tanpa `left`, `right`, `margin-left`, `text-align: left`), tanpa `outline: none`, tanpa `!important`. Bentuk lingkaran semantik (radio, avatar bulat, spinner) memakai `--shape-circle`, bukan `--radius-full` (yang 0 di bahasa tertentu). Gradien hanya bila fungsional (shimmer Skeleton, ProgressBar indeterminate) dan tetap dari token warna; gradien dekoratif di latar, tombol, atau kartu dilarang (`rubric/visual-review.md` VR-01).

Tanpa garis aksen satu sisi (VR-16): jangan pakai border atas/kiri tebal atau berwarna aksen pada kotak, bar pseudo-element di satu sisi, atau `box-shadow: inset` satu sisi untuk menandai terpilih, current, status, atau aktif. Pakai latar selection + bobot label, ring di semua sisi, atau ikon + teks. `ref-check` dan V6 menolaknya lewat `tools/lib/stripes.mjs`.

Konten fixture domain-netral (booking venue, tim, dokumen, pesanan generik). Jangan memakai domain atau nama dari run proyek nyata; `ref-check` menolak istilah di `leak-terms.json` (R15).

Token yang boleh dipakai ada di `catalog/token-names.json` (`always` dan `component_always`).

## Verifikasi

```bash
node tools/dev/ref-check.mjs <Name> [...] --screenshots
```

Perintah ini melint CSS lalu merender preview di empat archetype (ink-graphite, soft-friendly, neo-brutalist, immersive-glass) dengan pemeriksaan Chromium nyata: axe serious/critical = 0, teks isi ≥ 16px, target sentuh ≥ 44px, ring fokus di setiap Tab stop, reflow 320px, RTL, forced-colors, render tanpa JavaScript. Setelah lolos, lihat screenshot terang dan gelap minimal dua archetype; lolos pemeriksaan otomatis belum berarti rapi secara visual.
