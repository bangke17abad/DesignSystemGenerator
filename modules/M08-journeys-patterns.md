<!-- ds-module id="M08" name="journeys-patterns" engine="1.8.0" sections="§11" -->
# Modul M08 · Journey, layar, dan pattern

> Bagian dari Universal Design System Generator, engine `1.8.0`. Berisi §11. Dimuat di fase: 3, 8, 12. Core menang bila bertentangan; modul ini hanya merinci.

---

# 11. JOURNEY DAN LAYAR `[ENGINE]` + `[BRIEF]`

Dokumen 60. Rantai keputusan: **context → state → attention → evidence → decision → action → outcome.**

## 11.1 Prosedur

1. Untuk setiap journey di B5, tulis tabel **Langkah × Touchpoint** dengan kolom: Context, State, Attention, Evidence, Decision, Action, Outcome. Setiap sel menyebut komponen dan token yang dipakai.
2. Wajib ada journey untuk: alur utama (happy path), alur gagal pada langkah paling berisiko, dan setiap event kritis di B5.
3. Tambahkan tabel **Layar per surface**: Surface · Rentang atau daftar layar (hanya dari B9) · Selalu hadir · Komponen sering dipakai.
4. **Rujukan eksternal:** hanya ID di B9 yang boleh disebut. Rentang boleh disebut; **nomor layar atau flow individual yang tidak ada di B9 dilarang** (R3, §2.4).
5. Pola yang hanya komposisi komponen inti didokumentasikan sebagai *Pattern* (§11.2, §6.2d). Setiap langkah journey merujuk pattern atau komponen yang dipakainya.

## 11.2 Katalog pattern dasar (21 pattern, 3 tingkat)

Pattern adalah resep komposisi: tidak menambah token dan tidak menambah komponen. Setiap pattern di bawah punya record kanonis di `catalog/patterns/<Nama>.json` (lolos `tools/check-patterns.mjs`) yang dipakai `compose.mjs`; enam pattern bertanda *1.8.0* baru di engine ini. `R` wajib; `S` disertakan kecuali B7 `pattern_exclusions` memberi alasan; `O` disertakan bila brief memerlukannya.

| Pattern | Tingkat | Kapan | Kontrak minimum |
|---|---|---|---|
| CrudFlow | R | ada entitas yang dibuat atau diubah pengguna | daftar → detail → buat/ubah → hapus; perubahan tak tersimpan dikonfirmasi sebelum keluar; hasil simpan diumumkan; posisi daftar dipertahankan saat kembali |
| FormFlow | R | selalu | validasi saat blur dan saat submit (bukan per ketikan); ringkasan error + fokus ke field pertama; data tidak hilang saat error server; SC 3.3.7 |
| DestructiveAction | R | ada aksi hapus, batal, atau yang tidak bisa dibalik | aksi yang bisa dibalik memakai undo (toast ≥ 10 detik), bukan konfirmasi; yang tidak bisa dibalik memakai Modal yang menamai objek dan akibatnya; SC 3.3.4 |
| SystemPages | R | selalu | halaman tidak ditemukan, error server, pemeliharaan, dan offline; masing-masing menjelaskan apa yang terjadi dan jalan kembali; tidak memakai "Oops" |
| AppNavigation *1.8.0* | R | selalu | AppShell + PrimaryNav (rail di tablet) / BottomNav (ponsel, ≤ 5 tujuan) / Breadcrumb / PageHeader / SkipLink; urutan navigasi konsisten (SC 3.2.3); lokasi saat ini bertanda non-warna + `aria-current`; deep link dan tombol kembali dapat diprediksi; perpindahan rute memindah fokus ke `h1` dan mengumumkan judul (§9.5); judul halaman spesifik (SC 2.4.2); dua cara menemukan halaman (SC 2.4.5); tujuan yang dilarang role disembunyikan |
| AsyncFeedback | R | selalu | penerapan §12.3: skeleton, spinner, progress, optimistic + rollback, status tersimpan |
| SearchAndFilter | S | ada daftar lebih dari satu layar | SearchField + FilterChip; jumlah hasil diumumkan; filter aktif terlihat dan bisa dihapus satu per satu; state filter ada di URL untuk web; kosong karena filter dibedakan dari kosong karena data |
| AuthAndSession | S | ada akun | masuk, keluar, lupa sandi, peringatan sesi habis dengan opsi perpanjang (SC 2.2.1), step-up (SC 3.3.8); kebijakan sesi dari brief, selain itu `A-nn` |
| Settings | S | ada preferensi pengguna atau organisasi | dikelompokkan per topik; perubahan langsung berlaku untuk Switch, eksplisit "Simpan" untuk form; perubahan berisiko memakai DestructiveAction |
| DetailView *1.8.0* | S | ada entitas yang dilihat satu per satu | PageHeader dengan nama entitas + StatusLabel + satu aksi primer + Menu sekunder; DescriptionList; Tabs hanya bila > 1 seksi; Timeline untuk riwayat; status, harga, waktu tidak dipotong; read-only vs dapat diubah per role; skeleton meniru layout; tidak ditemukan → SystemPages |
| MasterDetail *1.8.0* | S | ada daftar entitas dan surface ≥ tablet | List/Table + ContextPanel (desktop docked mendorong konten; tablet overlay tanpa scrim, Esc menutup; ponsel pindah ke DetailView penuh); seleksi menjaga posisi daftar; panah memindah seleksi, Enter membuka, Esc mengembalikan fokus ke baris; URL mencerminkan seleksi; panel tidak menutup elemen fokus (SC 2.4.11) |
| Dashboard *1.8.0* | S | ada surface operasional atau B5 data_viz_needs | decision-first (I9): item C1/C2 lebih dulu, lalu InlineMetrics (maks 3 per grup), Chart dengan tabel alternatif; kesegaran data dan "terakhir diperbarui" (I6); ConnectionStatus untuk data live; state kosong dan data sebagian; tanpa widget dekoratif; telusur ke MasterDetail; refresh tidak memindah fokus. P01 memperluas pattern ini |
| BulkActions | O | ada seleksi banyak item | Table (data kompleks) + bar aksi massal; hasil per item dilaporkan (berhasil, gagal, dilewati) |
| Wizard | O | form lebih dari satu layar atau lebih dari 12 field | Stepper; maju tanpa kehilangan data; kembali tidak menghapus isian; ringkasan sebelum kirim |
| Onboarding | O | brief menyebut pengguna baru atau aktivasi | maks 3 layar, bisa dilewati, bisa diulang dari Settings; tidak memblokir aksi utama |
| NotificationCenter | O | NotificationItem dipilih | dikelompokkan per hari; tandai dibaca satu atau semua; event kritis tidak pernah hanya di sini (I5) |
| ImportExport | O | ada impor atau ekspor data | validasi sebelum impor, pratinjau, progress determinate, laporan per baris (valid C4, gagal C1, dilewati C3) |
| FileUpload | O | FileDropzone dipilih | batas ukuran dan tipe disebut sebelum memilih; progress per file; batal per file; error menyebut file dan alasannya |
| DataStory *1.8.0* | O | Chart dipilih | judul menyatakan kesimpulan; Chart + tabel data alternatif; legenda tidak hanya warna (bentuk/hatch); satuan dan rentang waktu; sumber dan kesegaran (I6); ambang ditulis teks + ikon; status di chart berupa outline + ikon, bukan fill semantik; state kosong, sebagian, basi; ekspor data dasar |
| PermissionRequest *1.8.0* | O | surface native butuh izin OS, atau role meminta akses lebih tinggi | penjelasan sebelum dialog izin sistem (dialog sistem selalu native, §14.3); minta saat dibutuhkan, bukan saat aplikasi dibuka; state ditolak dengan jalan alternatif dan cara mengaktifkan ulang; tidak memblokir seluruh aplikasi; alur minta akses role: diminta → menunggu C5 → disetujui C4 / ditolak C3, dengan jejak siapa yang memberi |
| OfflineSync | O | ada surface offline-first | outbox terlihat, konflik C2 dengan pilihan penyelesaian, tidak ada yang tampil terkonfirmasi sebelum server mengonfirmasi (I6) |

## 11.3 Seksi wajib untuk setiap pattern

Setiap `patterns/<Nama>.html` memuat, berurutan (seksi yang tidak relevan ditulis "Not applicable" dengan alasan):

1. **Masalah dan kapan dipakai** (dan kapan tidak).
2. **Komposisi:** komponen dan parts yang dipakai; tidak ada token atau komponen baru.
3. **Alur:** langkah, state per langkah (kelas C), dan transisi.
4. **Varian per surface dan kelas perangkat.**
5. **State:** kosong, loading, error, sebagian berhasil, berhasil.
6. **Aksesibilitas:** perpindahan fokus dan pengumuman per langkah (§9.5).
7. **Konten:** microcopy per `ui_locale` dari glosarium (§12.5).
8. **Role dan permission** (§10).
9. **Do dan Don't** (minimal 2 masing-masing).
10. **Edge cases:** offline, timeout, data sangat banyak, data kosong, aksi ganda, string terpanjang (+40% locale terpanjang), dan teks 200%.

Setiap pattern punya satu contoh komposisi di `previews/patterns/<Nama>.html` yang dirakit dari komponen reference web, di semua brand × tema.
