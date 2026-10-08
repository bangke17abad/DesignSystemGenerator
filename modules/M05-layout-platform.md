<!-- ds-module id="M05" name="layout-platform" engine="1.8.0" sections="§8" -->
# Modul M05 · Layout, responsive, dan platform

> Bagian dari Universal Design System Generator, engine `1.8.0`. Berisi §8. Dimuat di fase: 6, 9. Core menang bila bertentangan; modul ini hanya merinci.

---

# 8. LAYOUT, RESPONSIVE, DAN PLATFORM `[ENGINE]` + `[BRIEF]`

Dokumen 30 dan 95. Layout ditentukan oleh **lebar tersedia** (container query / `LayoutBuilder` / size class), bukan jenis perangkat. Teks dan kontrol tidak mengecil di layar besar; ruang ekstra dipakai untuk pane kedua.

## 8.1 Breakpoint (satu set, R11)

| Token | Default | Dipakai untuk |
|---|---|---|
| `bp-mobile` | 0 | phone |
| `bp-tablet` | 600 | tablet portrait; tabel menjadi kartu bertumpuk di bawah nilai ini |
| `bp-desktop` | 1024 | tablet landscape dan desktop |
| `bp-wide` | 1440 | wide |

Brief boleh mengganti angka; yang berlaku **satu set** di CSS, JS, kode target, dan dokumen (V8).

| Lebar konten | Kolom | Gutter | Margin |
|---|---|---|---|
| < 600 | 4 | 16 | 16 |
| 600-1023 | 8 | 20 | 24 |
| ≥ 1024 | 12 | 24 | 32 |

## 8.2 Region per surface (dihasilkan dari B3)

Bangun satu tabel Region × Surface (kolom = surface di B3, baris = global bar, navigasi, konten, panel konteks, filter bar, overlay kritis). Aturan penentu:

- Navigasi: desktop = nav tetap yang mengerut ke rail bila (nav + panel + minimum konten) melebihi viewport; tablet = rail; ponsel = bottom nav atau menu; surface kiosk atau berbasis state = tanpa nav.
- Panel konteks: docked di desktop; overlay tanpa scrim di tablet (Esc menutup); halaman penuh di ponsel; tidak dipakai di surface sentuh-sarung-tangan bila brief tidak memintanya.
- Orientasi: orientasi di B3 adalah orientasi desain utama, **bukan kunci** (WCAG SC 1.3.4). Hanya surface yang secara fisik terpasang tetap (kios, perangkat terpasang) boleh mengunci orientasi; itu dicatat sebagai asumsi `A-nn` yang harus dikonfirmasi.
- Tabel di bawah `bp-tablet` menjadi kartu bertumpuk; kolom sekunder melipat ke baris ekspandabel di tablet.
- Tidak pernah memotong status, harga, atau waktu; nama boleh dipotong dengan ellipsis + tooltip atau long-press.
- Header sticky dan bar bawah tidak menutup elemen yang sedang fokus (SC 2.4.11); area gulir diberi padding sebesar tinggi bar.

## 8.3 Target platform (dokumen 95)

Salin tabel surface dari B3 (perangkat, OS, orientasi, distribusi, tema default, konektivitas, modalitas) dan tambahkan kelas perangkat:

| Kelas | Lebar | Pola |
|---|---|---|
| Phone | < 600 dp | satu kolom, bottom nav, sheet dari bawah, aksi utama di zona jempol |
| Tablet portrait | 600-1023 dp | satu kolom maks 600dp di tengah; dialog tetap center |
| Tablet landscape / desktop | ≥ 1024 dp | dua pane (daftar · kerja); panel konteks docked bila ruang ada |

Versi OS minimum untuk target native adalah **usulan** sampai dikonfirmasi: catat `A-nn`.

- **Safe area:** kontrol dan teks penting tidak berada di bawah notch, kamera, home indicator, atau bar sistem (inset platform; `env(safe-area-inset-*)` di web dan PWA).
- **Keyboard virtual:** field yang fokus selalu terlihat di atas keyboard; action bar sticky naik di atas keyboard atau disembunyikan selama mengetik.
- **Foldable dan jendela berubah ukuran:** layout mengikuti lebar tersedia (§8); engsel tidak membelah kontrol; state tidak hilang saat ukuran berubah.
- **Adaptasi platform (L14):** daftar kontrol yang dirender native per platform ditulis di dokumen 95; perilaku yang selalu native ada di §14.3.
- **Matriks dukungan:** dari B3 `min_version` dan B4 `browser_support`; kosong = usulan "Chrome, Edge, Firefox, Safari: 2 versi mayor terakhir; Safari iOS: 2 versi terakhir" dicatat `A-nn`. Setiap fitur CSS dan API web yang dipakai reference web harus didukung matriks atau punya fallback yang diuji (V20). `tokens.css` menulis warna sebagai hex sRGB (OKLCH hanya di `derivation`) kecuali seluruh matriks mendukung `oklch()`.

## 8.4 Varian komponen per perangkat

Hasilkan satu tabel Komponen × Kelas perangkat (kolom dari surface di B3) untuk **semua `{N}` komponen**, berisi ukuran kontrol, pola popover vs sheet, pola modal (center vs layar penuh), tabel vs kartu, dan perilaku tooltip (hover vs long-press; tidak pernah satu-satunya tempat info penting). Isi default per kelas perangkat mengikuti §6.5 dan STD-4; komponen yang tidak dipakai di suatu surface ditulis "tidak dipakai" dengan alasan.
