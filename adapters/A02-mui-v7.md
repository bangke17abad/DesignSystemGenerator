<!-- ds-adapter id="A02" engine_min="1.8.0" library="@mui/material" verified_version="7.3.11" -->
# A02 · MUI (Material UI) v7

Adapter ini memetakan token sistem ke tema MUI v7 (`createTheme`). Generator: `mui()` di `tools/adapters/index.mjs`. Output: `adapters/mui/theme.g.ts`.

## Lingkup

- **Masuk lingkup:** `palette` per mode `brand/theme`, `shape`, `typography` (semua varian), override komponen untuk ripple/fokus, target sentuh, dan teks error/helper/chip/badge.
- **Di luar lingkup:** komponen status sistem, token tanpa slot MUI, MUI X (DataGrid, DatePicker) dan Joy UI.
- **Versi:** diverifikasi terhadap `@mui/material@7.3.11`, `@emotion/react@11.14.0`, `@emotion/styled`, React 19.3.0. Versi lain: Not verified (R4).

## Instalasi dan pemakaian

1. Target di brief: `targets.adapters: ["A02-mui-v7"]`, atau manual `node tools/build.mjs <outDir> --targets mui --ns <NS>`.
2. **Wajib** memuat `assets/tokens.css`: override komponen membaca `var(--target-current)`, `var(--control-height-md)`, `var(--color-focus-ring)`, `var(--color-semantic-critical-strong)`.
3. Pemakaian:

```tsx
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { refMuiTheme } from './adapters/mui/theme.g';
import type { RefMuiMode } from './adapters/mui/theme.g';

export function AppTheme({ mode, children }: { mode: RefMuiMode; children: React.ReactNode }) {
  const theme = React.useMemo(() => refMuiTheme(mode), [mode]);
  return <ThemeProvider theme={theme}><CssBaseline />{children}</ThemeProvider>;
}
```

- Satu tema per mode. Ganti tema = panggil `refMuiTheme('<brand>/<Theme>')` lagi **dan** set `data-theme` di `<html>` agar `tokens.css` ikut berganti.
- `RefMuiMode = keyof typeof refMuiSchemes` (union literal); `refMuiSchemes` diekspor `as const` sehingga `palette.mode` bertipe `'light' | 'dark'`.
- `cssVariables: true`: MUI menulis `--mui-*` sendiri. Nilai palette berupa literal hex (bukan `var(--...)`) karena MUI menghitung channel warna (`mainChannel`) dan `alpha()` dari literal.

## Pemetaan token → field MUI

### `palette` (per mode)

| Field MUI | Token sistem | Catatan |
|---|---|---|
| `palette.mode` | luminans `color-structure-surface-base` (< 128 → `'dark'`) | aturan sama dengan `color-scheme` di tokens.css |
| `primary.main` | `color-interaction-default` | |
| `primary.dark` | `color-interaction-pressed` | |
| `primary.contrastText` | `color-interaction-on-solid` | |
| `error.main` / `error.contrastText` | `color-semantic-critical` / `color-semantic-on-critical` | fill; teks error lewat override (lihat STD-3) |
| `warning.main` / `.contrastText` | `color-semantic-warning` / `color-semantic-on-warning` | |
| `success.main` / `.contrastText` | `color-semantic-positive` / `color-semantic-on-positive` | |
| `info.main` / `.contrastText` | `color-semantic-info` / `color-semantic-on-info` | |
| `text.primary` / `.secondary` / `.disabled` | `color-structure-text-primary` / `-secondary` / `-disabled` | |
| `background.default` | `color-structure-surface-base` | |
| `background.paper` | `color-structure-surface-raised` | |
| `divider` | `color-structure-border` | |

`primary.light`, `secondary`, `action.*`, `grey` diturunkan MUI (tonalOffset dan `palette.mode`).

### `shape` dan `typography` (dari mode pertama; tipe tidak bervariasi per tema)

| Field MUI | Token sistem |
|---|---|
| `shape.borderRadius` | `radius-sm` |
| `typography.htmlFontSize` | `16` (literal) |
| `typography.fontSize` | `max(16, type-body-size)` — basis `pxToRem`; ukuran hard-coded komponen diskalakan `body/14` |
| `typography.fontFamily` | `font-sans` |
| `h1` / `h2` / `h3` | `type-h1-*` / `type-h2-*` / `type-h3-*` (`size`, `line`, `weight`; px) |
| `h4` | `type-body-lg-*` |
| `h5` | `type-body-*` |
| `h6` | `type-label-*` |
| `body1`, `body2` | `type-body-*` (STD-2: default MUI `body2` 14 px) |
| `subtitle1` / `subtitle2` | `type-body-lg-*` / `type-label-*` |
| `button` | `type-label-*` + `textTransform: 'none'` (default MUI 14 px uppercase) |
| `caption` | `type-caption-*` |
| `overline` | `type-caption-*` + `textTransform: 'none'` |

### `components`

| Komponen | Override | Token |
|---|---|---|
| `MuiButtonBase.defaultProps.disableRipple` | `true` bila `state-layer-pressed-opacity = 0` | bahasa desain tanpa state layer (ink-graphite, neo-brutalist) |
| `MuiButtonBase.styleOverrides.root['&.Mui-focusVisible']` | `outline: 2px solid var(--color-focus-ring); outline-offset: 2px` | `color-focus-ring` |
| `MuiButton.root` | `minHeight: max(var(--control-height-md), var(--target-current))`, `boxShadow: none` | `control-height-md`, `target-current` |
| `MuiIconButton.root`, `MuiCheckbox.root`, `MuiRadio.root` | `minWidth`/`minHeight: var(--target-current)` | `target-current` (24 pointer / 44 coarse) |
| `MuiMenuItem.root` | `minHeight: var(--target-current)` | default MUI `auto` (≥ sm) / 32 (dense) |
| `MuiFormHelperText.root` | `fontSize`/`lineHeight` body; `&.Mui-error` → `var(--color-semantic-critical-strong)` | `type-body-*`, `color-semantic-critical-strong` |
| `MuiFormLabel.root['&.Mui-error']` | `color: var(--color-semantic-critical-strong)` | juga berlaku untuk `InputLabel` |
| `MuiChip.label` | `fontSize`/`lineHeight` body | default `pxToRem(13)` |
| `MuiBadge.badge` | `fontSize` body, `lineHeight: 1`, `minWidth`/`height: 24` | default `pxToRem(12)`, tinggi 20 |
| `MuiBottomNavigationAction.label` | `fontSize` body (juga saat `Mui-selected`) | default `pxToRem(12)` / 14 |

## Override baseline

- **STD-2:** `body2` dan `button` default 14 px → body. Komponen yang memakai `typography.caption` atau `pxToRem(12-13)` untuk teks isi (FormHelperText, Chip, Badge, BottomNavigationAction; sumber: `@mui/material` 7.3.11) dipin ke ukuran body. `typography.fontSize = body` menskalakan sisa ukuran hard-coded (`pxToRem(14)` → body). `caption`/`overline` tetap `type-caption` (12) untuk teks pendukung saja; Tooltip `pxToRem(11)` → 12.6-14.1 px (meta tooltip, lantai 12 terpenuhi).
- **STD-3:** `palette.error.main` dipakai MUI sebagai warna teks helper/label error. `color-semantic-critical` sebagai teks: 4.25-4.42:1 di tema gelap paket referensi. Override `Mui-error` memakai `color-semantic-critical-strong` (≥ 9:1). `palette.mode` kini diisi; tanpa itu MUI menghitung `action.*` dan `getContrastText` untuk mode terang di tema gelap.
- **STD-4:** tombol mengikuti `max(control-height-md, target-current)`; IconButton/Checkbox/Radio/MenuItem minimal `--target-current` (tokens.css: 44 px pada `(any-pointer: coarse)`).

## Pitfall yang diketahui

| Pitfall | Gejala | Perbaikan |
|---|---|---|
| `body2` / `button` 14 px | tabel, alert, tombol di bawah 16 | sudah dipin ke `type-body` / `type-label` |
| Ripple vs state layer | ripple MUI beropasitas 0.3 dan beranimasi; state layer sistem (`state-layer-pressed-opacity`, mis. 0.12) statis. Dua umpan balik bertumpuk bila komponen sistem juga menggambar state layer | Bahasa tanpa state layer → `disableRipple: true` (generator). Bahasa dengan state layer → ripple dipertahankan sebagai implementasi pressed MUI; jangan menambah state layer kedua di komponen MUI. Bila ripple dimatikan, fokus wajib terlihat: generator menambah outline `Mui-focusVisible` |
| `error.main` sebagai teks | helper text error < 4.5:1 di tema gelap | override `Mui-error` (generator); komponen kustom membaca `--color-semantic-critical-strong` |
| Tema tidak mengikuti `data-theme` | palette MUI literal per mode | panggil ulang `refMuiTheme(mode)` saat tema berganti; alternatif `colorSchemes` + `colorSchemeSelector` tidak dipakai karena nama tema sistem (`Light`, `Dark`, `High-contrast`) bukan key MUI (`light`/`dark`) |
| `mode` bertipe `string` | error TS7053 (implicit any) pada `--strict` | generator kini mengekspor `as const` + `RefMuiMode` |
| Override CSS var tanpa tokens.css | `minHeight` dan warna error jatuh ke `initial` | muat `tokens.css` sebelum aplikasi |

## Tanggung jawab sistem (bukan adapter)

- **Komponen status** (C1-C6) tidak dipetakan ke `Alert`/`Chip color`. MUI `Alert` memakai `palette.*.light/dark` turunan: tidak dibuktikan kontrasnya. Pakai komponen status sistem atau isi `sx` dari `--attention-c*-*`.
- **Token tanpa slot palette** (chart, selection, highlight, skeleton, surface-sunken/overlay/inverse, scrim, material, motion, z, timing) dibaca dari `tokens.css` / `tokens.js`. Bila perlu di tema MUI, tambahkan lewat module augmentation `Palette`/`Theme` di kode aplikasi, bukan di file generated.
- **I1:** `primary` = interaksi, `error/warning/success/info` = semantik. `secondary` sengaja tidak dipetakan; jangan memakai warna merek atau status sebagai `secondary` untuk aksi.
- Motion MUI (`transitions.duration`) tidak dipetakan; komponen sistem membaca `--motion-*`.

## Bukti verifikasi

Run 2026-10-08 (lihat A01 untuk perintah `npm i` dan `build.mjs`).

```
npx tsc --noEmit --strict --jsx react-jsx --moduleResolution bundler --module esnext --target es2022 --skipLibCheck false -p ts.mui.json
```

Harness: impor `theme.g.ts` dari 4 paket, `refMuiTheme('default/Dark')`, `('default/High-contrast')`, `('default/Light')`, render `<ThemeProvider>` + `Button` + `TextField error helperText`.

| Pemeriksaan | Hasil |
|---|---|
| MUI-only, `--strict`, `skipLibCheck false`, 4 paket | **PASS** (exit 0) |
| Harness gabungan AntD + MUI, `skipLibCheck true` | PASS (exit 0) |
| Kontrol negatif: output generator lama | 1 error: TS7053 `refMuiSchemes[mode]` dengan `mode: string` (implicit any) |
| Determinisme | `build-manifest.json` identik di dua build berturut-turut |

Sumber: deklarasi `@mui/material/styles/*.d.ts` dan source `FormHelperText.js`, `Chip.js`, `Badge.js`, `BottomNavigationAction.js`, `Tooltip.js`, `MenuItem.js` (7.3.11). Context7 tidak tersedia (kuota habis).

## Not verified

- Render visual nyata (screenshot, axe) tema MUI: Not verified pada run ini.
- Urutan `styleOverrides.root` vs varian `dense` MenuItem dan breakpoint `sm` (spesifisitas sama, override ditambahkan belakangan): perilaku runtime Not verified.
- `MuiBadge` 24 px dengan teks body: kecocokan bentuk (dot vs count) Not verified: needs visual test.
- Kontras `primary.light`/`*.light`/`*.dark` turunan MUI dan `action.hover/selected` di atas surface: Not verified.
- `@mui/material` selain 7.3.11; MUI X; Pigment CSS.
