# Tinjauan visual: "terlihat dibuat mesin"

Engine 1.8.0 · dirujuk core §13.4 dan DoD-21/22. Validator VB1-VB12 memeriksa urutan dan jarak secara mekanis; daftar ini menangkap yang tidak bisa diukur angka. Tinjau setiap halaman pattern {P} dan preview komponen di tema terang dan gelap, desktop dan ponsel. Setiap butir yang kena dicatat di `reports/visual-review.md` dengan halaman, screenshot, dan perbaikan; butir yang dibiarkan butuh ADR.

## Daftar periksa

| # | Gejala | Kenapa buruk | Perbaikan default |
|---|---|---|---|
| VR-01 | Gradien tanpa fungsi (latar, tombol, kartu) | Tidak membawa informasi, menurunkan kontras di sebagian permukaan, tanda generik AI | Warna solid dari token; gradien hanya untuk data (skala sekuensial) atau bila archetype mengizinkannya lewat ADR |
| VR-02 | Emoji sebagai ikon | Tidak konsisten antar OS, tidak ikut warna token, nama aksesibel kacau | Ikon dari sprite `icons.json` dengan `aria-hidden` + label teks |
| VR-03 | Grid kartu seragam tanpa hierarki | Semua tampak sama penting; pengguna tidak tahu mulai dari mana | Satu fokus utama per layar; kartu sekunder lebih kecil atau jadi daftar |
| VR-04 | Warna aksen di mana-mana | Aksen kehilangan arti "tindakan utama" | Aksen hanya untuk satu tindakan primer per area dan status terpilih (L3 C1-C2) |
| VR-05 | Teks abu-abu di atas abu-abu | Lolos 4.5:1 secara teknis tapi terasa pudar; hierarki hilang | `text-secondary` hanya di atas `surface-base`/`raised`; jangan tumpuk subtle di atas subtle |
| VR-06 | Bayangan di semua wadah | Elevasi tidak berarti apa-apa lagi | Bayangan hanya untuk lapisan yang benar-benar melayang (popover, modal, toast); wadah statis memakai border |
| VR-07 | Ikon dekoratif di setiap heading | Bising, memperlambat pemindaian | Ikon hanya bila membantu pengenalan (navigasi, status) |
| VR-08 | Radius besar di semua elemen | Terlihat seperti template; menabrak archetype tegas | Ikuti skala radius archetype; kontrol dan wadah berbeda radius sesuai VB4 |
| VR-09 | Spasi seragam di mana-mana | Pengelompokan tidak terbaca (hukum kedekatan) | Spasi dalam grup < spasi antar grup; minimal dua langkah skala berbeda |
| VR-10 | Badge/pill untuk semua metadata | Mengalihkan perhatian dari status yang benar-benar penting | Metadata biasa sebagai teks; badge hanya untuk status yang bisa berubah |
| VR-11 | Hero besar di aplikasi kerja | Membuang layar di produk yang dipakai berulang | Mulai langsung dengan konten kerja; hero hanya di halaman pemasaran |
| VR-12 | Ilustrasi placeholder generik di empty state | Tidak membantu tindakan berikutnya | Kalimat jelas apa yang kosong + satu tindakan; ilustrasi opsional dari brief |
| VR-13 | Angka KPI tanpa konteks | Dashboard indah tapi tidak bisa diputuskan | Setiap metrik punya pembanding (periode, target) dan arah yang dijelaskan dengan teks, bukan warna saja |
| VR-14 | Teks lorem atau "Judul di sini" tersisa | Langsung merusak kepercayaan | Konten contoh realistis per locale (V5) |
| VR-15 | Pola latar (hatch, noise) dekoratif | Mengganggu keterbacaan teks di atasnya | Pola hanya untuk keadaan (disabled, area drop) dan tidak di bawah teks isi |

## Cara meninjau

1. Buka `index.html`, lalu setiap halaman pattern. Lihat sekilas tiga detik: apa yang pertama terlihat? Kalau bukan tindakan atau informasi utama, catat VR-03/VR-04.
2. Ganti tema (terang/gelap/kontras tinggi) dan brand. Hierarki harus bertahan di semua mode.
3. Ponsel 390 px dan 320 px: tidak ada scroll horizontal, target sentuh tetap 44 px.
4. Bandingkan dua komponen yang mirip (Card vs Panel, Banner vs InlineAlert): bedanya harus terlihat dan beralasan.
5. Catat hasil: `PASS`, atau butir VR + halaman + perbaikan. Butir yang muncul di lebih dari satu paket adalah temuan engine (R19).
