<!-- ds-adapter id="A04" engine_min="1.8.0" library="flutter (material 3)" verified_version="not compiled; API checked against api.flutter.dev 2026-10-08 (latest stable tag 3.47.6)" -->
# A04 · Flutter Material 3

Adapter ini menghasilkan paket Dart dengan warna bertipe (`ThemeExtension`), token non-warna, density, elevasi, dan `ThemeData` Material 3. Generator: `flutter()` dan `flutterTheme()` di `tools/adapters/index.mjs`.

Output (`<ns>` huruf kecil, `<NS>` PascalCase):

- `packages/<ns>_design/lib/src/tokens/<ns>_colors.g.dart` — `class <NS>Colors extends ThemeExtension<<NS>Colors>`
- `packages/<ns>_design/lib/src/tokens/<ns>_tokens.g.dart` — `<NS>Tokens`, `<NS>Density`, `<NS>Elevation`
- `packages/<ns>_design/lib/src/tokens/<ns>_theme.g.dart` — `<NS>Theme.of(mode, {density})` → `ThemeData`

## Lingkup

- **Masuk lingkup:** semua token warna (semantic + component) per mode `brand/theme` sebagai field `Color` bertipe; `ColorScheme` M3; `TextTheme` M3 (15 peran); ukuran minimum tombol; `materialTapTargetSize`; tema Badge dan teks error input.
- **Di luar lingkup:** widget komponen sistem, navigasi, ikon, font asset (`pubspec.yaml` `fonts:` diisi tim aplikasi), Cupertino.
- **Versi:** **tidak dikompilasi** — SDK Flutter/Dart tidak ada di lingkungan run dan unduhan SDK (`storage.googleapis.com`) ditolak proxy. Signature dicek terhadap dokumentasi API resmi (api.flutter.dev, 2026-10-08). Tag stable terbaru yang terlihat di repo: 3.47.6.

## Instalasi dan pemakaian

1. Target di brief: `targets.adapters: ["A04-flutter-material3"]` atau `production_targets: ["flutter"]`; manual `--targets flutter --ns <NS>`.
2. Ekspor file dari library paket (`lib/<ns>_design.dart`: `export 'src/tokens/<ns>_colors.g.dart';` dst.).
3. Pemakaian:

```dart
MaterialApp(
  theme: RefTheme.of('default/Light'),
  darkTheme: RefTheme.of('default/Dark'),
  // Jangan membatasi textScaler di bawah 2.0 (STD-2, SC 1.4.4).
  home: const HomePage(),
);

// Di widget:
final c = RefColors.of(context);        // ThemeExtension bertipe
Container(color: c.attentionC4Background, child: Text('Tersimpan', style: TextStyle(color: c.attentionC4Foreground)));
```

- Density: `RefTheme.of(mode, density: RefDensity.compact)` hanya untuk surface pointer; di sentuh tetap `comfortable` (STD-4). Tinggi tombol dikunci `max(44, controlHeightMd)`.
- Animasi antar tema: `ThemeData.lerp` memanggil `RefColors.lerp` (Color.lerp per field).

## Pemetaan token → Flutter

### `<NS>Colors` (ThemeExtension)

| Field Dart | Token | Aturan |
|---|---|---|
| `<camelCase>` | setiap token `$type: color` (semantic + component) | prefix `color-` dibuang lalu camelCase: `color-structure-text-primary` → `structureTextPrimary`, `chart-cat-1` → `chartCat1`, `attention-c1-background` → `attentionC1Background` |
| nilai | `Color(0xAARRGGBB)` per mode | `#rrggbb` → alfa `ff`; `#rrggbbaa` → alfa di depan; `transparent` → `0x00000000` |
| konstanta mode | `static const defaultLight`, `defaultDark`, `defaultHighContrast` | `brand-theme` camelCase |
| `modes` | `Map<String, <NS>Colors>` key `'brand/Theme'` | |
| `copyWith({Color? …})` | semua field | override `ThemeExtension<T> copyWith()` |
| `lerp(covariant ThemeExtension<<NS>Colors>? other, double t)` | `Color.lerp(a, b, t)!` per field | signature sama dengan API (`covariant`) |
| `of(BuildContext)` | `Theme.of(context).extension<<NS>Colors>()!` | |

### `ColorScheme` (di `<NS>Theme.of`)

| Field `ColorScheme` | Token |
|---|---|
| `brightness` | luminans `color-structure-surface-base` (< 128 → `dark`) |
| `primary` / `onPrimary` | `color-interaction-default` / `color-interaction-on-solid` |
| `primaryContainer` / `onPrimaryContainer` | `color-interaction-subtle` / `color-structure-text-primary` |
| `secondary` / `onSecondary` | `firstOf(color-brand-default, color-interaction-default)` / `firstOf(color-brand-on, color-interaction-on-solid)` |
| `secondaryContainer` / `onSecondaryContainer` | `firstOf(color-brand-subtle, color-interaction-subtle)` / `color-structure-text-primary` |
| `error` / `onError` | `color-semantic-critical` / `color-semantic-on-critical` |
| `errorContainer` / `onErrorContainer` | `color-semantic-critical-subtle` / `color-semantic-critical-strong` |
| `surface` / `onSurface` | `color-structure-surface-base` / `color-structure-text-primary` |
| `onSurfaceVariant` | `color-structure-text-secondary` |
| `surfaceContainerLowest` | `color-structure-surface-base` |
| `surfaceContainerLow`, `surfaceContainer` | `color-structure-surface-raised` |
| `surfaceContainerHigh` | `color-structure-surface-overlay` |
| `surfaceContainerHighest` | `color-structure-surface-sunken` |
| `outline` / `outlineVariant` | `color-structure-border-control` / `color-structure-border` |
| `shadow` / `scrim` | `color-structure-shadow` / `color-structure-scrim` |
| `inverseSurface` / `onInverseSurface` | `color-structure-surface-inverse` / `color-structure-text-oninverse` |
| `surfaceTint` | `Color(0x00000000)` — M3 tidak menumpuk tint primary di surface terangkat |

Field deprecated (`background`, `onBackground`, `surfaceVariant`) tidak dipakai. `tertiary*`, `*Fixed*`, `inversePrimary`, `surfaceDim/Bright` dibiarkan turunan Flutter.

### `TextTheme` (const, dari mode pertama)

| Peran M3 | Token tipe | Default M3 |
|---|---|---|
| `displayLarge`, `displayMedium` | `type-display` (fallback `h1`) | 57 / 45 |
| `displaySmall`, `headlineLarge` | `type-h1` | 36 / 32 |
| `headlineMedium` | `type-h2` | 28 |
| `headlineSmall`, `titleLarge` | `type-h3` | 24 / 22 |
| `titleMedium`, `bodyLarge` | `type-body-lg` (fallback `body`) | 16 |
| `titleSmall`, `labelLarge`, `labelMedium` | `type-label` | 14 / 14 / 12 |
| `bodyMedium`, `bodySmall`, `labelSmall` | `type-body` | 14 / 12 / 11 |

Setiap `TextStyle`: `fontFamily` (nama pertama), `fontFamilyFallback` (tanpa nama generik CSS), `fontSize`, `height = line/size`, `fontWeight: FontWeight.wNNN` (dibulatkan ke ratusan), `letterSpacing = tracking(em) × size`. `type-caption` tidak punya peran M3: dibaca dari `<NS>Tokens` hanya untuk teks pendukung.

### `ThemeData`

| Field | Nilai | Token |
|---|---|---|
| `useMaterial3` | `true` | |
| `colorScheme`, `textTheme`, `extensions` | lihat di atas; `extensions: [<NS>Colors]` | |
| `materialTapTargetSize` | `MaterialTapTargetSize.padded` | STD-4 |
| `visualDensity` | `VisualDensity.standard` | STD-4 |
| `splashFactory` | `NoSplash.splashFactory` bila `state-layer-pressed-opacity = 0` | bahasa tanpa state layer |
| `filled/elevated/outlined/textButtonTheme.style.minimumSize` | `WidgetStatePropertyAll(Size(64, max(44, density.controlHeightMd)))` | `control-height-md`, `target-min-touch` |
| `badgeTheme` | `BadgeThemeData(largeSize: 24)` | label badge = teks body |
| `inputDecorationTheme` | `InputDecorationThemeData(errorStyle: TextStyle(color: c.semanticCriticalStrong))` | STD-3 |

### `<NS>Tokens`, `<NS>Density`, `<NS>Elevation`

| Kelas | Isi |
|---|---|
| `<NS>Tokens` | token `dimension`/`number`/`duration`/`fontWeight` yang tidak bervariasi menurut tema/density: `double` (logical px), `Duration(milliseconds:)`, `FontWeight.wNNN`, string untuk nilai non-angka (`'72ch'`, `'0em'`); nama font pertama tiap `fontFamily` |
| `<NS>Density` | token `varies_by: density` (`control-height-*`, `layout-row-height`) per mode density |
| `<NS>Elevation` | `elevation-1..n` per mode warna → `List<BoxShadow>` |

## Override baseline

- **STD-2:** default M3 `bodyMedium` 14, `bodySmall` 12, `labelLarge` 14, `labelMedium` 12, `labelSmall` 11. Di komponen M3 peran ini membawa teks isi (Text default, helper/error InputDecorator, tombol, tab, label NavigationBar, label Badge), sehingga semuanya ≥ `type-body`/`type-label`. `textScaler` tidak dibatasi: uji dengan `MediaQuery(data: MediaQuery.of(context).copyWith(textScaler: const TextScaler.linear(2.0)))`; tidak boleh ada teks terpotong (SC 1.4.4).
- **STD-3:** `colorScheme.error` sebagai teks error input 4.25-4.42:1 di tema gelap paket referensi → `errorStyle` memakai `semanticCriticalStrong`. `surfaceTint` transparan mencegah M3 mengubah warna surface yang sudah dibuktikan kontrasnya.
- **STD-4:** `MaterialTapTargetSize.padded` (area klik 48×48 untuk tombol, checkbox, radio, switch, IconButton), `VisualDensity.standard`, tinggi visual tombol ≥ 44.

## Pitfall yang diketahui

| Pitfall | Gejala | Perbaikan |
|---|---|---|
| Warna dibaca dari `Colors.*` atau `ColorScheme` untuk peran tanpa slot M3 | status/chart memakai `primary`/`error` (melanggar I1) | baca dari `<NS>Colors.of(context)` (bertipe; salah nama = compile error) |
| `ThemeExtension` tanpa `lerp` yang benar | animasi tema melompat atau error saat `AnimatedTheme` | `lerp` digenerate untuk setiap field, signature `covariant` |
| `textScaler` dibatasi (`clamp(maxScaleFactor: 1.3)`) | gagal SC 1.4.4 | jangan clamp di bawah 2.0; perbaiki layout dengan `Flexible`/wrap |
| `MaterialTapTargetSize.shrinkWrap` atau `VisualDensity.compact` | area klik < 44 | `padded` + `standard` (generator); jangan override di aplikasi sentuh |
| `colorScheme.error` sebagai teks | kontras < 4.5 di gelap | `inputDecorationTheme.errorStyle` (generator); teks error kustom memakai `semanticCriticalStrong` |
| `transparent` di token komponen (generator lama) | output `Color(0xffranspa)` tidak bisa dikompilasi | parser warna generator kini memetakan ke `0x00000000` |
| Badge 16 dp dengan teks body | label terpotong | `BadgeThemeData(largeSize: 24)` |

## Tanggung jawab sistem (bukan adapter)

- **Komponen status** (C1-C6) dibangun dari field `attentionC*` di `<NS>Colors`, bukan dari `ColorScheme` (M3 tidak punya warning/positive/info).
- **Token semantik tanpa slot M3** (warning, positive, info, neutral-negative, chart, selection, highlight, skeleton, material/translucent, focus ring) hanya ada di `<NS>Colors`.
- **I1:** `primary` = interaksi; `secondary` = merek (atau interaksi bila tidak ada merek); `error` = status kritis saja. Komponen sistem tidak memakai `tertiary`.
- Fokus terlihat (ring `focusRing`) pada widget kustom: tanggung jawab komponen sistem (`FocusableActionDetector`).
- Haptik, suara, dan timing (`haptic-*`, `sound-*`, `timing-*`) dibaca komponen sistem dari `<NS>Tokens`.

## Bukti verifikasi

| Pemeriksaan | Hasil |
|---|---|
| `which dart flutter` | tidak ada; unduhan SDK dari `storage.googleapis.com` ditolak proxy (403) |
| Kompilasi Dart/Flutter | **Not compiled (SDK not available)** |
| Review manual terhadap api.flutter.dev (2026-10-08) | `ThemeExtension<T> copyWith()` dan `ThemeExtension<T> lerp(covariant ThemeExtension<T>? other, double t)` cocok; konstruktor `ColorScheme` (9 parameter wajib: brightness, primary, onPrimary, secondary, onSecondary, error, onError, surface, onSurface) dan nama `surfaceContainer*` cocok; `ThemeData.inputDecorationTheme` bertipe `Object?` (menerima `InputDecorationThemeData`); `ThemeData.extensions` = `Iterable<ThemeExtension>?`; `FontWeight` dipakai lewat konstanta `wNNN` |
| Output 4 paket | dibaca manual: literal `const` valid, tidak ada `NaN`/`ranspa`, nama field unik |
| Kontrol negatif (generator lama, ink-graphite) | `attentionC3Background: Color(0xffranspa)` — tidak valid Dart |
| Target saudara (bukan bagian A04): Compose | `RefColors.g.kt`/`RefTokens.g.kt` dikompilasi `kotlinc` 2.0.21 (embeddable dari Gradle) terhadap stub signature `androidx.compose.ui.graphics.Color`/`ui.unit.dp`/`runtime.Immutable`: 4 paket exit 0; generator lama: `unresolved reference 'RANSPA'` |
| Target saudara: SwiftUI | Not compiled (SwiftUI tidak tersedia di Linux); review manual: `Color(.sRGB, red:green:blue:opacity:)` valid, `transparent` → opacity 0 |

## Not verified

- Seluruh file Dart: Not compiled (SDK not available). Jalankan `flutter analyze` pada paket hasil sebelum dipakai; catat versi Flutter di header file ini.
- `InputDecorationThemeData` membutuhkan Flutter versi yang sudah memisahkan `InputDecorationTheme`/`InputDecorationThemeData`; versi minimum Not verified. Pada Flutter lebih lama ganti dengan `InputDecorationTheme(errorStyle: ...)`.
- `WidgetStatePropertyAll` (pengganti `MaterialStatePropertyAll`) dan `BadgeThemeData.largeSize`: Not verified per versi.
- Pemetaan `surfaceContainer*` → surface sistem: dampak visual pada Card/NavigationBar/Dialog M3 Not verified: needs device test.
- Uji `textScaler` 2.0, target sentuh, dan TalkBack/VoiceOver: Not verified: needs device test.
