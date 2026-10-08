<!-- ds-adapter id="A01" engine_min="1.8.0" library="antd" verified_version="6.6.5" -->
# A01 · Ant Design v6

Adapter ini memetakan token sistem ke `ThemeConfig` Ant Design 6. Generator: `antd()` di `tools/adapters/index.mjs`. Output: `adapters/antd/theme.g.ts`.

## Lingkup

- **Masuk lingkup:** global token (seed, map, alias) dan component token untuk `Form`, `Button`, `Table`, `Tag`, `Layout`; satu `ThemeConfig` per mode `brand/theme`; satu `ThemeConfig` tambahan untuk mode sentuh (STD-4).
- **Di luar lingkup:** komponen status sistem (kelas perhatian C1-C6), token tanpa slot AntD, layout halaman, ikon. Lihat "Tanggung jawab sistem".
- **Versi:** diverifikasi terhadap `antd@6.6.5` (React 19.3.0, TypeScript 7.0.2 dan 5.9.3). Versi lain: Not verified sampai run baru mengulang verifikasi (R4).

## Instalasi dan pemakaian

1. Bangun paket dengan target AntD: brief `targets.adapters: ["A01-antd-v6"]`, atau manual `node tools/build.mjs <outDir> --targets antd --ns <NS>`.
2. Muat `assets/tokens.css` di halaman (komponen sistem di luar AntD tetap membaca variabel CSS).
3. Pasang provider di akar aplikasi:

```tsx
import { ConfigProvider } from 'antd';
import { refAntdTheme, refAntdTouch } from './adapters/antd/theme.g';
import type { RefAntdMode } from './adapters/antd/theme.g';

const coarse = typeof window !== 'undefined' && window.matchMedia('(any-pointer: coarse)').matches;

export function AppTheme({ mode, children }: { mode: RefAntdMode; children: React.ReactNode }) {
  return (
    <ConfigProvider theme={refAntdTheme[mode]}>
      {coarse ? <ConfigProvider theme={refAntdTouch}>{children}</ConfigProvider> : children}
    </ConfigProvider>
  );
}
```

- Ganti tema = ganti key `mode` (mis. `'default/Light'` → `'default/Dark'`) **dan** set `data-theme` di `<html>` supaya `tokens.css` ikut berganti.
- `RefAntdMode` adalah union literal semua mode; salah ketik mode gagal di type-check.
- Jangan menambah `algorithm`. Jangan menulis `cssVar: true`: di antd 6 `cssVar` adalah objek `{ prefix?, key? }` dan CSS variables selalu aktif.

## Pemetaan token → field AntD

Nilai diambil per mode `brand/theme`. Token yang bervariasi menurut density diambil dari density pertama (`comfortable`). `firstOf(a, b)` = token pertama yang ada.

### Global token (`theme.token`)

| Field AntD | Token sistem | Catatan |
|---|---|---|
| `colorPrimary` | `color-interaction-default` | seed |
| `colorPrimaryHover` | `color-interaction-hover` | dipin; tanpa ini AntD menurunkan dari palet terang |
| `colorPrimaryActive` | `color-interaction-pressed` | dipin |
| `colorPrimaryBorder` | `firstOf(color-interaction-border, color-interaction-default)` | dipin |
| `colorPrimaryBg`, `colorPrimaryBgHover` | `color-interaction-subtle` | dipin |
| `colorPrimaryText` | `color-interaction-default` | |
| `colorPrimaryTextHover` | `color-interaction-hover` | |
| `colorPrimaryTextActive` | `color-interaction-pressed` | |
| `colorLink` / `colorLinkHover` / `colorLinkActive` | `color-interaction-default` / `-hover` / `-pressed` | |
| `colorError` | `color-semantic-critical` | fill dan border status; **bukan teks** (lihat pitfall) |
| `colorErrorText` | `color-semantic-critical-strong` | Typography `type="danger"` |
| `colorErrorBg` | `color-semantic-critical-subtle` | |
| `colorErrorBorder` | `color-semantic-critical` | |
| `colorErrorHover` | `firstOf(button-destructive-container-background-hover, color-semantic-critical)` | pasangan teks sudah diuji QA sistem |
| `colorErrorActive` | `firstOf(button-destructive-container-background-pressed, color-semantic-critical)` | |
| `colorWarning` / `colorWarningText` / `colorWarningBg` | `color-semantic-warning` / `-strong` / `-subtle` | |
| `colorSuccess` / `colorSuccessText` / `colorSuccessBg` | `color-semantic-positive` / `-strong` / `-subtle` | |
| `colorInfo` / `colorInfoText` / `colorInfoBg` | `color-semantic-info` / `-strong` / `-subtle` | |
| `colorTextBase` | `color-structure-text-primary` | seed netral |
| `colorBgBase` | `color-structure-surface-base` | seed netral |
| `colorText` | `color-structure-text-primary` | |
| `colorTextSecondary` | `color-structure-text-secondary` | |
| `colorTextTertiary` | `color-structure-text-tertiary` | |
| `colorTextPlaceholder` | `color-structure-text-placeholder` | alias token |
| `colorTextDisabled` | `color-structure-text-disabled` | |
| `colorTextLightSolid` | `color-interaction-on-solid` | teks di atas tombol primary |
| `colorBgContainer` | `color-structure-surface-raised` | |
| `colorBgLayout` | `color-structure-surface-sunken` | |
| `colorBgElevated` | `color-structure-surface-overlay` | popover, dropdown, modal |
| `colorBgMask` | `color-structure-scrim` | |
| `colorBorder` | `color-structure-border-control` | border kontrol (≥ 3:1) |
| `colorBorderSecondary`, `colorSplit` | `color-structure-border` | |
| `controlOutline` | `color-focus-ring` | warna ring fokus |
| `controlOutlineWidth`, `lineWidthFocus` | `2` (literal) | |
| `fontFamily` | `font-sans` | daftar CSS |
| `fontFamilyCode` | `font-mono` | |
| `fontSize` | `max(16, type-body-size)` | STD-2 |
| `fontSizeSM` | `max(16, type-body-size)` | STD-2: default AntD `fontSize - 2` = 14 |
| `fontSizeLG` | `type-body-lg-size` | |
| `fontSizeXL` | `type-h3-size` | |
| `fontSizeHeading1` / `2` / `3` | `type-h1-size` / `type-h2-size` / `type-h3-size` | |
| `fontSizeHeading4` | `type-body-lg-size` | |
| `fontSizeHeading5` | `max(16, type-body-size)` | |
| `lineHeight` | `type-body-line / type-body-size` (3 desimal) | rasio, bukan px |
| `borderRadius` | `radius-sm` | |
| `borderRadiusSM`, `borderRadiusXS` | `radius-xs` | |
| `borderRadiusLG` | `radius-md` | |
| `controlHeight` / `controlHeightSM` / `controlHeightLG` | `control-height-md` / `-sm` / `-lg` | density pertama |
| `lineWidth` | `border-width-thin` | |
| `motionDurationFast` / `Mid` / `Slow` | `motion-fast-duration` / `motion-base-duration` / `motion-slow-duration` | ms → string detik (`"0.2s"`) |
| `zIndexPopupBase` | `z-popover × 20` | skala sistem 0-70 → basis AntD 1000 |
| `wireframe` | `false` (literal) | |

### Component token (`theme.components`)

| Komponen.field | Token sistem | Alasan |
|---|---|---|
| `Form.labelFontSize` | `type-label-size` | |
| `Form.verticalLabelPadding` | `'0 0 4px'` (literal) | |
| `Form.colorError` | `color-semantic-critical-strong` | override alias token per komponen: teks explain error (EF-005) |
| `Form.colorWarning` | `color-semantic-warning-strong` | teks explain warning |
| `Button.contentFontSizeSM` | `max(16, type-body-size)` | STD-2 |
| `Button.primaryShadow` / `defaultShadow` / `dangerShadow` | `'none'` | elevasi tombol dari bahasa desain, bukan AntD |
| `Table.cellFontSize` / `cellFontSizeMD` / `cellFontSizeSM` | `max(16, type-body-size)` | STD-2 (isi sel = teks isi) |
| `Tag.defaultBg` | `color-structure-surface-sunken` | |
| `Layout.siderBg`, `Layout.lightSiderBg` | `color-structure-surface-raised` | |
| `Layout.headerBg` | `color-structure-surface-raised` | |
| `Layout.headerColor` | `color-structure-text-primary` | |
| `Layout.headerHeight` | `layout-bar-height` | hanya bila token ada |
| `Layout.bodyBg`, `Layout.footerBg` | `color-structure-surface-sunken` | |
| `Layout.triggerBg`, `Layout.lightTriggerBg` | `color-structure-surface-raised` | default AntD `#002140` |
| `Layout.triggerColor`, `Layout.lightTriggerColor` | `color-structure-text-primary` | |

### Tema sentuh (`<ns>AntdTouch`)

| Field | Nilai |
|---|---|
| `token.controlHeight` | `max(44, target-min-touch, control-height-md)` |
| `token.controlHeightSM` | `max(44, target-min-touch, control-height-sm)` |
| `token.controlHeightLG` | `max(44, target-min-touch, control-height-lg)` |
| `components.Layout.zeroTriggerWidth` / `zeroTriggerHeight` | `max(44, target-min-touch)` (default AntD 40) |

## Override baseline

- **STD-2 (teks isi ≥ 16):** AntD menurunkan `fontSizeSM = fontSize - 2` (14 px) dan memakainya di Tag, Badge, Table `size="small"`, Pagination, Dropdown, Tabs kecil, dll. Semua ukuran font yang bisa dipakai teks isi dipin ke `max(16, type-body-size)`: `fontSize`, `fontSizeSM`, `fontSizeHeading5`, `Button.contentFontSizeSM`, ketiga `Table.cellFontSize*`. Konsekuensi: varian `size="small"` tidak lagi mengecilkan huruf; kepadatan dicapai lewat `controlHeightSM` dan padding (I8).
- **STD-3 (kontras ≥ 4.5:1):** AntD memakai `colorError` sebagai warna teks di Form explain dan ikon feedback (`form/style/index.js`, antd 6.6.5). Rasio `color-semantic-critical` terhadap `surface-raised` di tema gelap ke-4 paket referensi: 4.25-4.42:1. `Form.colorError`/`Form.colorWarning` dipin ke varian `-strong` (9.0-11.7:1). Semua turunan warna primary dipin agar AntD tidak menghitung hover/active dari palet terang di tema gelap.
- **STD-4 (target sentuh ≥ 44):** token AntD tidak bisa mengikuti media query. Mode sentuh = `ConfigProvider` bersarang dengan `<ns>AntdTouch` saat `(any-pointer: coarse)` cocok (`inherit` default `true` menggabungkan token). Contoh ink-graphite: `control-height-sm/md` comfortable 32/40 → 44/44.

## Pitfall yang diketahui

| Pitfall | Gejala | Perbaikan |
|---|---|---|
| `theme.algorithm = darkAlgorithm` | AntD menghitung ulang `colorPrimary*` dan palet netral; pasangan teks yang sudah dibuktikan `contrast-report.md` tidak berlaku lagi (EF-004) | Jangan pakai algorithm. Mode gelap = `refAntdTheme['<brand>/Dark']`; semua turunan sudah dipin |
| `hashed: false` dengan `ConfigProvider` bersarang | token provider dalam (mis. tema sentuh, area tema terbalik) bocor ke provider luar karena class tanpa hash berbagi selector (EF-006) | Biarkan `hashed` di default (`true`). Jangan set `false` meski hanya ada satu versi antd |
| `colorError` dipakai sebagai teks | teks "Field wajib diisi" 4.25-4.42:1 di tema gelap | `colorErrorText` untuk Typography; `components.Form.colorError` = critical-strong (sudah di generator). Komponen kustom membaca `--color-semantic-critical-strong` |
| Posisi trigger `Sider` | `.ant-layout-sider-trigger` memakai `position: fixed; bottom: 0`; bila Sider tidak menempel ke bawah viewport, trigger menutupi footer/konten dan warnanya default `#002140` | Warna sudah dipin (`triggerBg`/`triggerColor`). Untuk posisi: `trigger={null}` dan tombol collapse sendiri di header, atau Sider `position: sticky; top: 0; height: 100vh`. Pakai `theme="light"` pada Sider dan Menu |
| `fontSizeSM` 14 px | Tag, Badge, Table kecil di bawah 16 | sudah dipin (lihat STD-2). Jangan override `fontSizeSM` di level aplikasi |
| `cssVar: true` (pola antd 5) | error TS2559 di antd 6 | hapus; CSS variables selalu aktif di v6. Prefix kustom: `cssVar: { prefix: 'ant' }` |
| `controlHeightSM` di sentuh | tombol/select kecil 28-40 px | nested provider `<ns>AntdTouch` |

## Tanggung jawab sistem (bukan adapter)

- **Komponen status** (kelas perhatian C1-C6: `attention-c*-background/border/foreground/icon`) tidak punya slot AntD. `Alert`, `Tag` berwarna, dan `Badge` status AntD tidak dipakai untuk status; pakai komponen status sistem atau bungkus komponen AntD dan beri warna dari variabel CSS `--attention-c*-*`.
- **Token semantik tanpa slot** (chart, selection, highlight, skeleton, surface-inverse, translucent/material, state-layer, haptic, sound, timing, z-scale lengkap) dibaca langsung dari `tokens.css` / `tokens.js`, bukan dari `theme.token`.
- **I1 (peran warna terpisah):** `colorPrimary` hanya interaksi. Jangan memakai `colorPrimary` untuk status, atau `colorSuccess` untuk aksi utama. `colorInfo` di AntD juga dipakai untuk elemen netral tertentu (mis. Progress default): bila itu melanggar I1, set warna per komponen.
- Kontras pasangan baru yang muncul karena kustomisasi aplikasi harus dihitung ulang (V2).

## Bukti verifikasi

Run 2026-10-08, folder kerja `scratchpad/adapters-verify`, paket referensi disalin ke scratch (refpkgs tidak diubah).

```
npm i antd@6 @mui/material@7 @emotion/react @emotion/styled react react-dom typescript @types/react @types/react-dom tailwindcss@4 @tailwindcss/cli
# → antd 6.6.5, react 19.3.0, typescript 7.0.2
node tools/build.mjs <copy>/{soft-friendly,ink-graphite,neo-brutalist,immersive-glass} --targets antd,mui,shadcn,tailwind,flutter,swiftui,compose,figma --ns REF
npx tsc --noEmit --strict --jsx react-jsx --moduleResolution bundler --module esnext --target es2022 --skipLibCheck false -p tsconfig.json
```

Harness: `harness.tsx` per paket me-render `<ConfigProvider theme={refAntdTheme[mode]}>` bersarang `<ConfigProvider theme={refAntdTouch}>` dengan `Layout.Sider collapsible`, `Form.Item validateStatus="error"`, `Button danger`, `Table size="small"`, `Tag`.

| Pemeriksaan | Hasil |
|---|---|
| File hasil generator (4 paket × `theme.g.ts`), `--strict`, `skipLibCheck false` | **PASS** — 0 error di file hasil generator |
| Seluruh harness `skipLibCheck false` | exit 1, hanya 2 error di deklarasi pihak ketiga: `@rc-component/image/es/PreviewGroup.d.ts` dan `@rc-component/picker/es/PickerPanel/index.d.ts` (TS2430). Direproduksi dengan harness kosong yang hanya mengimpor `ConfigProvider`, dan dengan TypeScript 5.9.3 → bukan dari adapter |
| Seluruh harness `skipLibCheck true` | exit 0 |
| Kontrol negatif: output generator lama, harness sama | 3 error nyata: `cellFontSizeLG` tidak ada di `Table` (TS2353 × 3 mode), `cssVar: true` (TS2559) |
| Determinisme | build dua kali → `build-manifest.json` identik (4 paket) |
| Kontras yang mendasari override | skrip WCAG 2.x di token resolved: critical/surface-raised gelap 4.25-4.42; critical-strong 9.00-9.05 |

Sumber nama field: deklarasi `node_modules/antd/es/theme/interface/{seeds,alias,maps/*}.d.ts`, `form|button|table|tag|layout/style/*.d.ts` dan source style `form/style/index.js`, `layout/style/sider.js` (antd 6.6.5). Context7 tidak tersedia (kuota habis); deklarasi tipe terpasang dipakai sebagai sumber primer.

## Not verified

- Render visual nyata di browser (screenshot, axe) untuk tema AntD: Not verified pada run ini.
- `zIndexPopupBase = z-popover × 20`: konsistensi tumpukan antara overlay AntD dan overlay sistem (skala 0-70) Not verified: needs device test.
- `colorBgSpotlight` (latar Tooltip) tidak dipin; AntD menurunkannya dari `colorTextBase`. Kontras teks tooltip di tema gelap Not verified.
- Turunan netral AntD lain (`colorFill*`, `colorBgTextHover`, `controlItemBgHover`) masih dihitung `defaultAlgorithm` dari seed; kontras teks di atasnya Not verified.
- Perilaku `ConfigProvider` bersarang untuk mode sentuh pada perangkat sentuh nyata: Not verified: needs device test.
- antd selain 6.6.5.
