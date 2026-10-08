<!-- ds-module id="M06" name="accessibility" engine="1.9.1" sections="§9" -->
# Modul M06 · Aksesibilitas

> Bagian dari Universal Design System Generator, engine `1.9.1`. Berisi §9. Dimuat di fase: 4, 7. Core menang bila bertentangan; modul ini hanya merinci.

---

# 9. AKSESIBILITAS `[BASELINE]`

Dokumen 40. Mengimplementasikan STD-1 sampai STD-4 (§3A): WCAG 2.2 AA untuk semua portal web dan aplikasi mobile, teks isi ≥ 16, kontras teks ≥ 4.5:1, dan target sentuh ≥ 44×44, diperiksa di semua tema. Setiap aturan memiliki kolom **Diverifikasi oleh**; aturan yang hanya bisa diuji manual diberi label "Not verified: needs device test" sampai ada bukti.

## 9.1 Aturan operasional

| Aturan | Persyaratan | Diverifikasi oleh |
|---|---|---|
| Kontras | semua teks, semua ukuran, semua tema, semua latar: ≥ 4.5:1, tanpa pengecualian teks besar (STD-3); non-teks (ikon status, border kontrol, ring fokus, grafis informatif) ≥ 3:1 | V2 (otomatis) |
| Batas kontrol | setiap kontrol memakai `border-control`; `border` dan `border-strong` tidak pernah satu-satunya tanda kontrol | V6 (lint) + tinjauan |
| Tautan | bergaris bawah (atau penanda non-warna lain) di dalam teks berjalan | V6 |
| Fokus | outline 2px `focus-ring`, offset 2px (inset untuk baris dan nav) pada semua elemen interaktif | V6 + V9 |
| Warna tidak sendirian | setiap status punya ikon terkunci; seleksi punya penanda non-warna | V5 + tinjauan |
| Ukuran target | area klik ≥ 44×44 px/dp di semua perangkat sentuh (STD-4); pointer ≥ 24×24 (SC 2.5.8); perluasan modalitas dari B3; jarak ≥ 8 antar target | V9 + V11 + tes target native |
| Keyboard | Tab/Shift+Tab; Enter dan Space mengaktifkan; Esc selalu membatalkan/menutup (Esc pada konfirmasi destruktif = Cancel) **kecuali** overlay event kritis yang hanya tertutup lewat aksinya; panah memindahkan antar item grid, tab, dan radio; pintasan global hanya dengan modifier | manual (keyboard) |
| Pemindai | setiap langkah QR/barcode/kamera punya alternatif input manual | V5 |
| Waktu | toast dengan aksi ≥ 10 detik dan berhenti saat hover/fokus; timer yang membatasi pengguna mengumumkan di ambang dan di habis | tinjauan + uji |
| Pengumuman | error form memindahkan fokus ke error pertama dan mengumumkan jumlah secara assertive; simpan yang berhasil diumumkan polite; badge kritis baru dan peringatan event kritis assertive | Not verified: needs device test (screen reader) |
| Ukuran teks | teks isi ≥ 16 px/dp (STD-2); teks pendukung (`type-caption`) ≥ 12; teks mengikuti ukuran sistem sampai 200% tanpa terpotong; web reflow di 320 CSS px dan zoom 400%; `lang` mengikuti bahasa sesi | V11 + V9 + manual |
| Gerak | semua gerak runtuh menjadi fade satu frame di bawah reduced motion; tidak ada informasi yang bergantung pada animasi | V6 |
| Peringatan event kritis | suara, getar, dan visual masing-masing cukup sendirian | Not verified: needs device test |
| Drag | setiap interaksi drag punya alternatif satu-pointer dan keyboard | V5 + tinjauan |

## 9.2 Pemetaan WCAG 2.2 A + AA (55 kriteria)

WCAG 2.2 memuat 55 kriteria level A dan AA (31 A + 24 AA; 4.1.1 Parsing dihapus di 2.2 dan tidak dihitung). Tabel ini adalah **seed generik**: generator menyimpannya di `wcag22.json`, menyesuaikan kolom "Penerapan" dengan komponen nyata proyek, merendernya ke dokumen 40, dan hanya boleh menulis `Applied` bila ada bukti di kolom verifikasi (R4). Status: `Applied` (dirancang dan punya bukti di paket), `Applied · Not verified` (dirancang, butuh perangkat atau pengguna nyata), `N/A` (tidak berlaku, wajib beralasan), `Open decision` (butuh keputusan pemilik produk, dicatat `A-nn`). Untuk aplikasi native, kriteria dibaca lewat WCAG2ICT dan ARIA digantikan API semantik platform. Dokumen dan laporan tidak boleh menulis "compliant" (§3A.1).

| SC | Nama | Level | Status | Penerapan di sistem ini | Diverifikasi oleh |
|---|---|---|---|---|---|
| 1.1.1 | Non-text Content | A | Applied | Ikon dekoratif disembunyikan dari pembaca layar dan teks membawa makna; gambar informatif, peta, dan QR punya alternatif teks atau ringkasan | V5 + tinjauan |
| 1.2.1 | Audio-only and Video-only (Prerecorded) | A | N/A | Sistem tidak memuat media berwaktu; bila produk menambahkannya, alternatif teks wajib | tinjauan |
| 1.2.2 | Captions (Prerecorded) | A | N/A | Alasan sama dengan 1.2.1 | tinjauan |
| 1.2.3 | Audio Description or Media Alternative (Prerecorded) | A | N/A | Alasan sama dengan 1.2.1 | tinjauan |
| 1.3.1 | Info and Relationships | A | Applied | Label terkait field, fieldset dan legend, header tabel, role grid/listbox/radiogroup | V5 + manual |
| 1.3.2 | Meaningful Sequence | A | Applied | Urutan DOM sama dengan urutan baca; panel konteks dan overlay mengikuti urutan fokus | manual |
| 1.3.3 | Sensory Characteristics | A | Applied | Instruksi tidak hanya merujuk bentuk, posisi, atau warna; status selalu ikon + teks | tinjauan |
| 1.4.1 | Use of Color | A | Applied | Ikon status terkunci; seleksi bertanda non-warna; chart memakai bentuk atau pola | V5 + tinjauan |
| 1.4.2 | Audio Control | A | Applied · Not verified | Audio event kritis dapat dihentikan lewat aksi eksplisit; tidak ada audio otomatis lain | Not verified: needs device test |
| 2.1.1 | Keyboard | A | Applied | Semua fungsi dapat dioperasikan lewat keyboard (web) atau keyboard eksternal dan switch access (native) | manual |
| 2.1.2 | No Keyboard Trap | A | Applied | Fokus modal terkunci tetapi selalu bisa keluar lewat Esc; overlay event kritis keluar lewat aksinya yang dapat dijangkau keyboard | manual |
| 2.1.4 | Character Key Shortcuts | A | Applied | Pintasan global hanya bermodifier; tidak ada pintasan satu karakter | V6 + tinjauan |
| 2.2.1 | Timing Adjustable | A | Open decision | Timer yang membatasi pengguna (hold, sesi) diumumkan di ambang dan saat habis; apakah dapat diperpanjang adalah keputusan produk (catat `A-nn`) | tinjauan |
| 2.2.2 | Pause, Stop, Hide | A | Applied | Tidak ada gerak otomatis lebih dari 5 detik selain hitung mundur esensial dan indikator loading | V6 |
| 2.3.1 | Three Flashes or Below Threshold | A | Applied | Tidak ada elemen berkedip; overlay kritis tidak berkedip lebih dari 3 kali per detik | V6 + tinjauan |
| 2.4.1 | Bypass Blocks | A | Applied | Skip link di setiap halaman web; di native memakai heading dan landmark semantik | V5 |
| 2.4.2 | Page Titled | A | Applied | Setiap halaman web punya `<title>` spesifik; setiap layar native punya judul semantik | V4 + V5 |
| 2.4.3 | Focus Order | A | Applied | Urutan fokus mengikuti urutan baca; fokus kembali ke pemicu saat overlay menutup | manual |
| 2.4.4 | Link Purpose (In Context) | A | Applied | Teks tautan menyebut tujuan, bukan "klik di sini" | tinjauan |
| 2.5.1 | Pointer Gestures | A | Applied | Tidak ada gestur multi-titik atau berbasis jalur yang wajib; semuanya punya tombol | tinjauan |
| 2.5.2 | Pointer Cancellation | A | Applied | Aksi berjalan saat pelepasan (up-event); drag dapat dibatalkan | V9 + manual |
| 2.5.3 | Label in Name | A | Applied | Nama aksesibel memuat teks label yang terlihat | V5 + manual |
| 2.5.4 | Motion Actuation | A | Applied | Tidak ada fungsi yang dipicu gerakan perangkat | tinjauan |
| 3.1.1 | Language of Page | A | Applied | `lang` mengikuti bahasa sesi | V7 + V9 |
| 3.2.1 | On Focus | A | Applied | Fokus tidak memicu perubahan konteks | manual |
| 3.2.2 | On Input | A | Applied | Mengubah input tidak memicu perubahan konteks otomatis | tinjauan |
| 3.2.6 | Consistent Help (baru di 2.2) | A | Applied | Mekanisme bantuan (kontak, bantuan kontekstual) berada di posisi relatif yang sama di setiap halaman dan layar yang memilikinya | tinjauan |
| 3.3.1 | Error Identification | A | Applied | Error inline berupa teks + ikon + `aria-describedby`, ditambah ringkasan error | V5 |
| 3.3.2 | Labels or Instructions | A | Applied | Setiap field punya label yang terlihat; format (mata uang, tanggal) ada di helper | V5 |
| 3.3.7 | Redundant Entry (baru di 2.2) | A | Applied | Data yang sudah dimasukkan dalam satu alur diisi otomatis atau dipilih, tidak diminta ulang | tinjauan |
| 4.1.2 | Name, Role, Value | A | Applied | `role` dan `aria-*` atau API semantik native; state lewat `aria-checked`, `aria-current`, `aria-busy`, `aria-disabled` | V5 + manual |
| 1.2.4 | Captions (Live) | AA | N/A | Alasan sama dengan 1.2.1 | tinjauan |
| 1.2.5 | Audio Description (Prerecorded) | AA | N/A | Alasan sama dengan 1.2.1 | tinjauan |
| 1.3.4 | Orientation | AA | Open decision | Tidak ada surface yang mengunci orientasi kecuali perangkat terpasang tetap yang esensial (§8.2); dicatat `A-nn` untuk dikonfirmasi | tinjauan |
| 1.3.5 | Identify Input Purpose | AA | Applied | `autocomplete` untuk data pribadi (nama, email, telepon) | V5 |
| 1.4.3 | Contrast (Minimum) | AA | Applied | Dilampaui STD-3: semua teks ≥ 4.5:1 | V2 |
| 1.4.4 | Resize Text | AA | Applied | Teks mengikuti ukuran sistem sampai 200% tanpa tinggi tetap yang memotong | V9 + manual |
| 1.4.5 | Images of Text | AA | Applied | Tidak ada teks dalam gambar; wordmark berupa teks bila tidak ada logo | V6 |
| 1.4.10 | Reflow | AA | Applied | 320 CSS px tanpa gulir dua arah; pengecualian untuk tabel data, peta, dan diagram (gulir horizontal, kolom identitas sticky) | V9 |
| 1.4.11 | Non-text Contrast | AA | Applied | STD-3: ikon status, border kontrol, ring fokus ≥ 3:1 | V2 |
| 1.4.12 | Text Spacing | AA | Applied | Tidak ada wadah berukuran tetap yang memotong teks saat spasi diperlebar | V9 |
| 1.4.13 | Content on Hover or Focus | AA | Applied | Tooltip dapat ditutup (Esc), dapat di-hover, dan bertahan; info penting tidak hanya di tooltip | manual |
| 2.4.5 | Multiple Ways | AA | Applied | Surface dengan banyak halaman: navigasi + pencarian; halaman yang merupakan langkah dalam satu alur adalah pengecualian SC | tinjauan |
| 2.4.6 | Headings and Labels | AA | Applied | Heading dan label menjelaskan topik atau tujuan | tinjauan |
| 2.4.7 | Focus Visible | AA | Applied | Outline 2px `focus-ring`, offset 2px (inset pada baris dan nav) | V6 + V9 |
| 2.4.11 | Focus Not Obscured (Minimum) (baru di 2.2) | AA | Applied | Header sticky dan bar bawah tidak menutup elemen yang fokus; padding gulir sama dengan tinggi bar; toast tidak menutup kontrol utama | V9 + manual |
| 2.5.7 | Dragging Movements (baru di 2.2) | AA | Applied | Setiap drag punya alternatif satu-pointer (menu aksi) dan keyboard | V5 + manual |
| 2.5.8 | Target Size (Minimum) (baru di 2.2) | AA | Applied | Dilampaui STD-4: 44×44 di sentuh, 24×24 di pointer, perluasan modalitas dari B3 | V9 + V11 |
| 3.1.2 | Language of Parts | AA | Applied | Contoh string locale lain di dalam halaman diberi `lang` bagian | V7 |
| 3.2.3 | Consistent Navigation | AA | Applied | Urutan relatif navigasi sama di setiap halaman dan layar | tinjauan |
| 3.2.4 | Consistent Identification | AA | Applied | Komponen dan ikon dengan fungsi sama berlabel sama (makna ikon terkunci, §5.7) | V6 + tinjauan |
| 3.3.3 | Error Suggestion | AA | Applied | Error menyebut cara memperbaiki (§12) | tinjauan |
| 3.3.4 | Error Prevention (Legal, Financial, Data) | AA | Applied | Aksi finansial, hukum, dan penghapusan data memakai konfirmasi, dapat diperiksa atau dibatalkan, dan langkah otorisasi tambahan bila perlu | tinjauan |
| 3.3.8 | Accessible Authentication (Minimum) (baru di 2.2) | AA | Open decision | Langkah autentikasi atau otorisasi tambahan (PIN, kode) tidak boleh hanya mengandalkan ingatan: sediakan paste/autofill atau mekanisme alternatif; pilihan adalah keputusan produk (`A-nn`) | Not verified: needs device test |
| 4.1.3 | Status Messages | AA | Applied · Not verified | `role="status"` atau `alert`, `aria-live` polite untuk simpan berhasil, hitungan berjalan, dan sisa saldo | Not verified: needs device test (screen reader) |

Ringkasan seed: 55 SC = 45 Applied, 2 Applied · Not verified, 5 N/A, 3 Open decision. Angka akhir ditulis ulang dari `wcag22.json` setelah V12.

## 9.3 Preferensi pengguna dan mode sistem

| Preferensi | Web | Native | Perilaku wajib |
|---|---|---|---|
| Gerak dikurangi | `prefers-reduced-motion: reduce` | Reduce Motion (iOS), Remove animations (Android) | semua gerak menjadi fade satu frame; `state-press-transform` = `none`; tidak ada parallax |
| Kontras ditingkatkan | `prefers-contrast: more` | Increase Contrast, Bold Text (iOS), High contrast text (Android) | memakai tema High-contrast bila ada; bila tidak: `text-secondary` dan `text-tertiary` naik ke `text-primary`, `border-control` diperkuat |
| Transparansi dikurangi | `prefers-reduced-transparency: reduce` | Reduce Transparency (iOS) | `surface-translucent` menjadi padat (alfa 1, blur 0) |
| Warna paksa | `forced-colors: active` | - | warna sistem (`Canvas`, `CanvasText`, `ButtonText`, `ButtonFace`, `Highlight`, `HighlightText`, `LinkText`, `GrayText`); kontrol ber-fill punya border transparan agar batasnya tampil; fokus memakai `outline`, bukan `box-shadow`; ikon status memakai `currentColor` dan tetap tampil; `forced-color-adjust: none` hanya untuk swatch warna dan chart yang punya tabel data |
| Skema warna | `prefers-color-scheme` | tema sistem | memilih tema yang dipetakan di L12 hanya untuk surface yang tidak menetapkan tema di B3 |
| Ukuran teks | zoom browser, ukuran font bawaan | Dynamic Type, font scale | sampai 200% tanpa terpotong (STD-2) |

Setiap baris punya preview yang dapat diaktifkan dari situs dokumentasi.

## 9.4 Matriks uji teknologi bantu

Item berlabel "Not verified" ditutup lewat uji manual berikut. Phase 7 menulis `reports/at-test-plan.md`: satu skenario per komponen dan per pattern (diturunkan dari seksi Accessibility), dengan kolom hasil per kombinasi, semua berisi "Not run" sampai diuji orang.

| Kombinasi | Wajib bila |
|---|---|
| NVDA + Chrome atau Firefox (Windows) | ada surface web |
| VoiceOver + Safari (macOS) | ada surface web |
| VoiceOver (iOS) | ada surface iOS atau web di ponsel |
| TalkBack (Android) | ada surface Android atau web di ponsel |
| Keyboard saja | selalu |
| Windows High Contrast (forced colors) | ada surface web desktop |
| Zoom 400% dan text scale 200% | selalu |
| Switch Access / Switch Control | brief menyebut pengguna dengan disabilitas motorik |

Skenario minimal per komponen: nama, peran, dan state diumumkan benar; dapat dioperasikan; error dan perubahan state diumumkan; fokus tidak hilang.

## 9.5 Manajemen fokus lintas layar

Aturan tunggal perpindahan rute (engine 1.8.0): fokus dipindah ke `h1` halaman baru (`tabindex="-1"`, ring inset), judul dokumen diperbarui, dan judul baru diumumkan polite. Pengecualian: perubahan di dalam ContextPanel atau Tabs tidak memindah fokus halaman.


- Saat pindah rute di aplikasi satu halaman: judul dokumen diperbarui, fokus dipindah ke `h1` halaman (bertabindex −1) atau judul diumumkan polite; posisi gulir dipulihkan saat kembali.
- Setelah item dihapus: fokus ke item berikutnya, atau ke judul daftar bila daftar kosong.
- Setelah overlay ditutup: fokus kembali ke pemicu; bila pemicu sudah tidak ada, ke heading terdekat.
- Native: pengumuman perubahan layar memakai API platform (`UIAccessibility.post(.screenChanged)`, `announceForAccessibility` atau padanannya), dengan label "Not verified against the pinned version".
