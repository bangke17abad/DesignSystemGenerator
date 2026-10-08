<!-- ds-adapter id="A03" engine_min="1.8.0" library="shadcn/ui + tailwindcss" verified_version="tailwindcss 4.3.3; shadcn/ui new-york-v4 (contract checked 2026-10-08)" -->
# A03 · shadcn/ui di atas Tailwind CSS v4

Adapter ini terdiri dari dua generator:

- `tailwind()` → `assets/tailwind.theme.css`: blok `@theme` Tailwind v4 yang hanya berisi token sistem.
- `shadcn()` → `adapters/shadcn/shadcn.css`: kontrak variabel CSS shadcn/ui (`--background`, `--primary`, `--sidebar-*`, `--chart-*`, ...) dipetakan ke token sistem, plus override teks, bayangan, varian `dark:`, dan target sentuh.

Brief dengan `A03-shadcn-tailwind4` otomatis menghasilkan keduanya (`build.mjs` menambahkan `tailwind` saat `shadcn` dipilih).

## Lingkup

- **Masuk lingkup:** namespace Tailwind `--color-*`, `--text-*` (+ `--line-height`, `--font-weight`, `--letter-spacing`), `--radius-*`, `--font-*`, `--shadow-*`, `--breakpoint-*`, `--ease-*`, `--spacing`; seluruh variabel tema shadcn versi Tailwind v4; `@custom-variant dark`; lapisan base untuk target sentuh.
- **Di luar lingkup:** kode komponen shadcn (disalin ke repo aplikasi oleh CLI shadcn), plugin Tailwind, `tw-animate-css`.
- **Versi:** dikompilasi dengan `tailwindcss@4.3.3` + `@tailwindcss/cli@4.3.3`. Kontrak shadcn dicek terhadap https://ui.shadcn.com/docs/theming dan `apps/v4/registry/new-york-v4/ui/button.tsx` (branch `main`, diambil 2026-10-08).

## Instalasi dan pemakaian

1. Target di brief: `targets.adapters: ["A03-shadcn-tailwind4"]`, atau manual `--targets tailwind,shadcn`.
2. Inisialisasi shadcn seperti biasa, lalu **hapus** blok `:root { ... }`, `.dark { ... }`, `@theme inline { ... }` dan `@custom-variant dark ...` dari `globals.css` hasil CLI shadcn.
3. Ganti dengan urutan impor ini (urutan wajib):

```css
@import "tailwindcss";
@import "../design-system/assets/tokens.css";        /* 1. nilai token + tema [data-theme] */
@import "../design-system/assets/tailwind.theme.css"; /* 2. reset palet Tailwind, utilitas sistem */
@import "../design-system/adapters/shadcn/shadcn.css";/* 3. kontrak shadcn di atas token sistem */

@layer base {
  * { @apply border-border outline-ring/50; }
  body { @apply bg-background text-foreground; }
}
```

4. Ganti tema dengan `document.documentElement.dataset.theme = 'Dark'` (nama tema dari brief), bukan class `.dark`.

Utilitas sistem yang tersedia: `bg-surface-base`, `text-text-primary`, `border-border-control`, `bg-critical`, `text-critical-strong`, `bg-interaction-default`, `text-body`, `text-label`, `text-caption`, `text-h1`, `rounded-md`, `shadow-e1`, `ease-standard`, `tablet:`/`desktop:`/`wide:`, dll. Utilitas shadcn: `bg-primary`, `text-primary-foreground`, `bg-sidebar`, `bg-chart-1`, `ring-ring/50`, dll.

## Pemetaan: `tailwind.theme.css`

Blok: `@theme inline reference { ... }`. `inline` = utilitas menulis `var(--<token sistem>)` langsung. `reference` = Tailwind tidak menulis variabel temanya sendiri ke `:root` (lihat pitfall var cycle).

| Namespace Tailwind | Sumber | Aturan nama |
|---|---|---|
| `--color-*: initial` | — | palet bawaan Tailwind dihapus (I3) |
| `--text-*: initial` | — | skala teks bawaan dihapus |
| `--spacing` | `4px` (literal) | `p-4` = 16 px |
| `--color-<nama>` | semua token `$type: color` (semantic + component) | prefix `color-structure-` dan `color-semantic-` dibuang; `color-interaction-` dipertahankan; `color-` lain dibuang. Contoh: `color-structure-text-primary` → `--color-text-primary` (`text-text-primary`), `color-semantic-critical` → `--color-critical`, `color-interaction-default` → `--color-interaction-default`, `chart-cat-1` → `--color-chart-cat-1`, `button-primary-container-background` → `--color-button-primary-container-background` |
| `--radius-<k>` | `radius-<k>` | nama sama |
| `--font-<k>` | `font-<k>` (`font-sans`, `font-mono`) | nama sama |
| `--text-<k>` | `type-<k>-size` | `k` = body, body-lg, label, caption, code, display, h1, h2, h3 |
| `--text-<k>--line-height` | `type-<k>-line` | |
| `--text-<k>--font-weight` | `type-<k>-weight` | |
| `--text-<k>--letter-spacing` | `type-<k>-tracking` | |
| `--shadow-e<n>` | `elevation-<n>` | `shadow-e0` … `shadow-e2` |
| `--breakpoint-<k>` | `bp-<k>` kecuali `bp-mobile`; px ÷ 16 → rem | `bp-tablet 600` → `37.5rem` |
| `--ease-standard/enter/exit` | `motion-easing-standard/enter/exit` | |

Breakpoint bawaan Tailwind (`sm`…`2xl`) **tidak** di-reset karena komponen shadcn memakai `md:`.

## Pemetaan: `shadcn.css`

### Variabel kontrak (`:root`) → token sistem

| Variabel shadcn | Token sistem |
|---|---|
| `--background` | `color-structure-surface-base` |
| `--foreground` | `color-structure-text-primary` |
| `--card` / `--card-foreground` | `color-structure-surface-raised` / `color-structure-text-primary` |
| `--popover` / `--popover-foreground` | `color-structure-surface-overlay` / `color-structure-text-primary` |
| `--primary` / `--primary-foreground` | `color-interaction-default` / `color-interaction-on-solid` |
| `--secondary` / `--secondary-foreground` | `color-structure-surface-sunken` / `color-structure-text-primary` |
| `--muted` / `--muted-foreground` | `color-structure-surface-sunken` / `color-structure-text-secondary` |
| `--accent` / `--accent-foreground` | `color-interaction-subtle` / `color-structure-text-primary` |
| `--destructive` | `color-semantic-critical` |
| `--destructive-foreground` | `color-semantic-on-critical` (sudah tidak ada di kontrak v4; dipertahankan untuk komponen lama) |
| `--border` | `color-structure-border` |
| `--input` | `color-structure-border-control` |
| `--ring` | `color-focus-ring` |
| `--chart-1` … `--chart-5` | `chart-cat-1` … `chart-cat-5` |
| `--sidebar` / `--sidebar-foreground` | `color-structure-surface-raised` / `color-structure-text-primary` |
| `--sidebar-primary` / `--sidebar-primary-foreground` | `color-interaction-default` / `color-interaction-on-solid` |
| `--sidebar-accent` / `--sidebar-accent-foreground` | `color-interaction-subtle` / `color-structure-text-primary` |
| `--sidebar-border` / `--sidebar-ring` | `color-structure-border` / `color-focus-ring` |
| `--radius` | `var(--radius-md)` |

Variabel hanya ditulis bila token sumbernya ada. Tidak ada blok `.dark`: nilai gelap datang dari `[data-theme]` di `tokens.css`.

### `@theme inline` di `shadcn.css`

| Namespace | Nilai | Alasan |
|---|---|---|
| `--color-<var>` untuk setiap variabel kontrak | `var(--<var>)` | utilitas `bg-primary`, `text-muted-foreground`, … |
| `--text-xs`, `--text-sm`, `--text-base` (+ `--line-height`) | `type-body-*` | STD-2: `text-sm` (14) default komponen; `text-xs` (12) dipakai Badge, label grup sidebar, shortcut |
| `--text-lg` | `type-body-lg-*` | DialogTitle, SheetTitle |
| `--text-xl` / `--text-2xl` / `--text-3xl` | `type-h3-*` / `type-h2-*` / `type-h1-*` | |
| `--color-white` | `color-semantic-on-critical` | palet di-reset; tombol/Badge destructive memakai `text-white` |
| `--color-black` | `firstOf(color-structure-shadow, color-structure-surface-inverse)` | overlay `bg-black/50` Dialog/Sheet/Drawer |
| `--shadow-xs`, `--shadow-sm` | `elevation-1` | |
| `--shadow-md`, `--shadow-lg` | `elevation-2` (atau `elevation-3` bila ada untuk `lg`) | |

### Varian dan base layer

| Aturan | Isi |
|---|---|
| `@custom-variant dark` | `&:where([data-theme="<tema gelap>"], [data-theme="<tema gelap>"] *)` untuk setiap tema yang luminans `surface-base`-nya < 128; bila tema default gelap (mis. immersive-glass) ditambah `:root:not([data-theme])` |
| `@layer base` STD-4 | `[data-slot="button"|"toggle"|"select-trigger"|"input"|"tabs-trigger"] { min-height: var(--target-current) }`; tombol `data-size="icon*"` juga `min-width` |

## Override baseline

- **STD-2:** `text-xs`/`text-sm`/`text-base` → `type-body` (16-18 px pada paket referensi). Teks pendukung asli memakai `text-caption`. Hasil kompilasi: `.text-sm { font-size: var(--type-body-size) }`, `.text-xs { font-size: var(--type-body-size) }`, juga di bawah `md:`.
- **STD-3:** `--color-white` dipetakan ke `color-semantic-on-critical` karena pasangan `on-critical`/`critical` sudah diuji QA sistem; putih murni di atas `critical` hanya 3.56-3.70:1 di tema gelap paket referensi. Pitfall `dark:bg-destructive/60` di bawah.
- **STD-4:** ukuran shadcn `h-8`/`h-9`/`size-9` (32-36 px) di bawah 44. Base layer memberi `min-height`/`min-width: var(--target-current)` (24 pointer, 44 coarse) pada kontrol ber-`data-slot`. `min-height` menang atas `height` utilitas tanpa perlu spesifisitas.

## Pitfall yang diketahui

| Pitfall | Gejala | Perbaikan |
|---|---|---|
| `text-sm` 14 px | hampir semua teks komponen shadcn < 16 | dipetakan ke body (generator) |
| `.dark` class vs `data-theme` | `dark:` utilitas aktif dari class `.dark` atau `prefers-color-scheme`, tidak sinkron dengan tema sistem | `@custom-variant dark` di `shadcn.css` mengikuti `[data-theme]`; jangan menambah class `.dark` |
| `dark:bg-destructive/60` (Button/Badge destructive upstream) | di tema gelap fill destructive jadi 60 % transparan; kontras teks di atas campuran warna tidak terbukti | hapus `dark:bg-destructive/60` dari varian destructive di `components/ui/button.tsx` dan `badge.tsx` setelah `shadcn add`; `dark:bg-input/30` dan `dark:hover:bg-accent/50` juga ditinjau terhadap token |
| Urutan impor terbalik | `shadcn.css` sebelum `tailwind.theme.css` → `--color-*: initial` dan `--text-*: initial` menghapus semua utilitas shadcn (`bg-primary`, `text-sm`, `text-white` tidak terbentuk; terbukti di kompilasi) | urutan: tokens → tailwind.theme → shadcn |
| Blok `@theme inline` bawaan shadcn tidak dihapus | `--radius-md: calc(var(--radius) * 0.8)` dan `--radius: var(--radius-md)` membentuk siklus; warna oklch upstream menimpa token | hapus `:root`, `.dark`, `@theme inline` bawaan |
| Var cycle `@theme inline` (generator lama) | `--radius-md: var(--radius-md)`, `--font-sans: var(--font-sans)`, `--color-interaction-default: var(--color-interaction-default)` ditulis Tailwind ke `@layer theme { :root, :host }`. Di shadow DOM (`:host`) atau bila tokens.css diimpor ke layer lebih rendah, deklarasi itu menang → siklus → nilai invalid | generator kini memakai `@theme inline reference`; hasil kompilasi 0 deklarasi self-reference |
| `text-white` / `bg-black` hilang | palet di-reset → teks tombol destructive mewarisi `foreground` (kontras buruk), overlay transparan | `--color-white`/`--color-black` dipetakan (generator). Lebih baik: ganti `bg-black/50` dengan `bg-scrim` (token `color-structure-scrim` sudah beralfa) |
| Badge `text-xs` | status 12 px | dipetakan ke body |

## Tanggung jawab sistem (bukan adapter)

- **Komponen status** (C1-C6): shadcn hanya punya `destructive`. Alert/Badge status lain memakai kelas utilitas dari token sistem (`bg-attention-c4-background text-attention-c4-foreground`) atau komponen status sistem.
- **Token tanpa slot shadcn** (warning/positive/info, chart sekuensial/divergen, selection, highlight, skeleton, material) tersedia sebagai utilitas dari `tailwind.theme.css` (`bg-warning-subtle`, `bg-chart-seq-500`, …).
- **I1:** `--accent` shadcn adalah latar hover/selected (interaksi), bukan warna merek; `--secondary` adalah surface, bukan aksi kedua berwarna. `--chart-*` hanya data-viz.
- Komponen kecil (Checkbox `size-4`, Switch, RadioGroupItem) tidak diperbesar visualnya; area klik ≥ 44 di sentuh dicapai dengan `<label>` pembungkus atau padding di pola form sistem.

## Bukti verifikasi

Run 2026-10-08, 4 paket referensi (salinan scratch).

```
input.css:  @import "tailwindcss"; @import "./tokens.css"; @import "./tailwind.theme.css"; @import "./shadcn.css"; @source "./index.html";
npx @tailwindcss/cli -i input.css -o out.css            # tailwindcss 4.3.3
```

`index.html` memuat kelas `bg-surface-base text-text-primary text-body rounded-md shadow-e1 desktop:text-h1 tablet:p-4 ease-standard bg-critical font-sans text-caption` dan kelas shadcn `bg-primary text-primary-foreground text-sm text-xs text-base text-lg shadow-xs bg-destructive text-white dark:bg-destructive/60 bg-black/50 ring-ring/50 bg-sidebar bg-chart-1 md:text-sm`, serta kontrol `bg-red-500 text-gray-900`.

| Pemeriksaan (tiap paket: soft-friendly, ink-graphite, neo-brutalist, immersive-glass) | Hasil |
|---|---|
| Kompilasi `tailwind.theme.css` + `shadcn.css` | **PASS** (exit 0) |
| Utilitas terbentuk: `bg-surface-base`, `text-text-primary`, `text-body`, `rounded-md`, `shadow-e1`, `text-sm`, `text-xs`, `text-base`, `bg-primary`, `bg-sidebar`, `bg-chart-1`, `text-white` | 12/12 |
| `.rounded-md { border-radius: var(--radius-md) }`, `.shadow-e1 { --tw-shadow: var(--elevation-1) }`, `.bg-surface-base { background-color: var(--color-structure-surface-base) }` | sesuai |
| Palet bawaan di-reset (`bg-red-500`, `text-gray-900` tidak terbentuk) | PASS |
| Breakpoint: `@media (width >= 37.5rem)` / `48rem` / `64rem` terurut | PASS |
| `dark:` → `:where([data-theme="Dark"], [data-theme="Dark"] *)` | PASS |
| Deklarasi self-reference di output | 0 (generator lama: ada, mis. `--font-sans: var(--font-sans)`) |
| Kontrol urutan impor terbalik | `text-sm`, `text-white`, `bg-primary` tidak terbentuk (pitfall terbukti) |

Kontrak shadcn: halaman Theming (Tailwind v4) mendaftar `--background` … `--sidebar-ring`, `--radius`, `@custom-variant dark (&:is(.dark *))`, radius `calc(var(--radius) * 0.6/0.8/1.4…)`; tidak ada `--destructive-foreground`. Button new-york-v4: `destructive` = `bg-destructive text-white … dark:bg-destructive/60`, ukuran `h-9`/`h-8`/`h-10`/`size-9`. Context7 tidak tersedia (kuota habis); sumber: WebFetch dokumen resmi dan repo.

## Not verified

- Opsi `reference` pada `@theme` terbukti bekerja di 4.3.3 tetapi tidak didokumentasikan sebagai API publik di halaman `@theme`; Not verified untuk versi Tailwind lain.
- Atribut `data-slot`/`data-size` dicek pada Button new-york-v4; komponen shadcn lain (Toggle, SelectTrigger, Input, TabsTrigger) Not verified per file.
- Render nyata komponen shadcn (screenshot, axe, emulasi sentuh 390×844): Not verified pada run ini.
- Kontras utilitas transparansi upstream (`bg-input/30`, `hover:bg-primary/90`, `ring-ring/50`) terhadap surface: Not verified.
- Varian shadcn lain (`radix-lyra`, `base-*`) dan registry pihak ketiga.
