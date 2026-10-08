<!-- ds-pack id="P04" name="b2g-public-service" version="1.0.1" engine_min="1.5.0" phases="0, 0B, 3, 4, 8, 11, 12, 14" -->
# Pack P04 · Layanan publik (B2G untuk warga dan badan usaha)

> Pack opsional untuk Universal Design System Generator, engine `1.5.0` atau lebih baru dengan major yang sama. Dipilih lewat B7 `component_packs: [P04-b2g-public-service]`. Baseline, invarian, dan brief eksplisit menang atas pack ini (§0). Pack ini memperketat aturan engine, menambah 16 komponen dan 14 pattern, dan hanya mengganti default engine pada butir di P04.8.

---

## P04.1 Lingkup

- **Untuk:** layanan transaksional yang dipakai warga atau badan usaha: perizinan, pendaftaran, pengaduan, pembayaran retribusi atau pajak daerah, bantuan sosial, administrasi kependudukan, janji temu layanan. Operatornya instansi pemerintah pusat atau daerah, BUMN atau BUMD yang menjalankan layanan publik, atau vendor atas nama mereka.
- **Bukan untuk:** back-office internal instansi (pakai P01), portal berita atau informasi murni tanpa transaksi (pakai core dengan bahasa `editorial-contrast`).
- **Cakupan surface:** aturan P04 berlaku untuk surface dengan `surface_type: public`. Surface lain di proyek yang sama (mis. aplikasi petugas) tetap memakai aturan core; komponen P04 di surface itu ditulis "tidak dipakai" di tabel §8.4.
- **Kompatibilitas** (§0 aturan 6): P01 kompatibel (surface berbeda); P02 bertentangan di surface `public` (penggantian CrudFlow berbeda); P03 bertentangan di surface `public` (feed tak berujung dan gerak otomatis dilarang P04-R12).

## P04.2 Konfigurasi (`pack_config.P04` di B7)

| Field | Isi | Bila kosong |
|---|---|---|
| `operator_type` | `government` · `regional_government` · `soe` · `vendor_on_behalf` | `A-nn`; OfficialSiteBanner tidak dipilih |
| `official_domain` | akhiran domain resmi, mis. `go.id` | `A-nn`; OfficialSiteBanner tidak menyebut domain |
| `service_phase` | `alpha` · `beta` · `live` | `live` (PhaseBanner tidak dipilih) |
| `sensitive_service` | `true` bila pengguna bisa terancam bila ketahuan memakai layanan | `false` |
| `assisted_channels` | daftar `{channel, detail}` kanal non-digital (loket, call center) | `A-nn`; teks kanal berlabel "Assumption A-nn" |
| `fees` | `none` · `fixed` · `variable` | `A-nn`; FeePayment dipilih hanya bila journey memuat pembayaran |
| `session_timeout` | mis. "20 menit" | `A-nn`; aturan peringatan P04-R7 tetap berlaku |
| `save_retention` | masa simpan isian untuk SaveAndReturn | `A-nn` |
| `regulations` | daftar regulasi yang wajib dipenuhi, dari pemilik produk | `A-nn` "perlu tinjauan hukum" |

## P04.3 Aturan domain

| ID | Aturan |
|---|---|
| P04-R1 | **Progressive enhancement.** Reference web untuk surface publik memakai `html-first` (§6.4): journey inti bisa diselesaikan tanpa JavaScript, dengan form HTML yang dikirim ke server. Bila B4 memilih framework lain, Phase 0 bertanya: ganti ke `html-first`, atau tulis ADR alasan layanan boleh bergantung pada JavaScript. Framework tetap boleh menjadi production target. |
| P04-R2 | **Satu pertanyaan per halaman** untuk alur transaksional (QuestionPage). Pengecualian hanya untuk field yang menyatu secara alami: alamat, nama lengkap, MemorableDate. Label pertanyaan adalah `h1` halaman (label sebagai heading). |
| P04-R3 | **Bahasa lugas.** Microcopy per kalimat rata-rata ≤ 15 kata, maksimum 25; kalimat aktif; sapaan konsisten dengan L11; singkatan ditulis kepanjangannya saat pertama muncul; tanpa jargon birokrasi. Daftar awal untuk `id-ID`: "dalam rangka", "sehubungan dengan", "terkait hal tersebut", "adapun", "guna", "sebagaimana dimaksud", "berkenaan dengan". Daftar ini masuk `avoid` di glosarium dan bisa ditambah. Ini proksi terukur, bukan pengganti uji dengan pengguna. |
| P04-R4 | **Identitas resmi dan bantuan.** OfficialSiteBanner di setiap halaman bila `operator_type` pemerintah. ServiceHeader menampilkan nama layanan, bukan hanya nama instansi. ServiceFooter memuat kanal bantuan, kebijakan privasi, pernyataan aksesibilitas, dan pemilik layanan, di posisi yang sama di setiap halaman (SC 3.2.6). |
| P04-R5 | **Data minimal.** Setiap field harus berasal dari journey di brief. Field data sensitif (nomor identitas, kesehatan, pendapatan) disertai helper "Mengapa kami meminta ini". Kebijakan penyamaran nilai sensitif di ringkasan adalah keputusan pemilik produk (`A-nn`). |
| P04-R6 | **Error.** Setiap halaman yang gagal validasi memakai ErrorSummary; judul dokumen diawali penanda error dari glosarium; pesan per field menyebut cara memperbaiki dengan contoh format dari B1. |
| P04-R7 | **Waktu.** Peringatan sesi muncul sebelum sesi habis dengan aksi perpanjang yang sederhana; pengguna punya minimal 20 detik untuk memperpanjang (SC 2.2.1). Lama sesi dari `session_timeout`. Bila SaveAndReturn aktif, isian tidak hilang saat sesi habis. |
| P04-R8 | **Kanal alternatif.** Setiap layanan punya AssistedDigital. Tidak ada langkah yang hanya bisa diselesaikan secara digital tanpa jalur alternatif yang disebut. |
| P04-R9 | **Performa.** Halaman pertanyaan ≤ 200 KB transfer gzip pada kunjungan pertama (termasuk CSS, JavaScript, font) dan ≤ 50 KB pada halaman berikutnya dengan cache. Bila anggaran tidak tercapai dengan font L4, system font stack dipakai dan dicatat sebagai ADR. Tidak ada gambar dekoratif di halaman pertanyaan. |
| P04-R10 | **Bahasa desain.** Veto default: `playful-vivid`, `immersive-glass`, `neo-brutalist` (hanya dibuka lewat brief eksplisit + ADR). L15 tanpa translucency dan gradien. L16 tanpa efek suara dan tanpa transformasi saat ditekan. L17 halaman pertanyaan satu kolom dibatasi `layout-measure`. Rekomendasi: `ink-graphite` atau `editorial-contrast`; `derive` tetap boleh. |
| P04-R11 | **Bukti dan cetak.** CheckAnswers dan Confirmation punya stylesheet cetak tanpa navigasi. Nomor referensi bisa disalin (CopyButton) dan dicetak. |
| P04-R12 | **Tanpa gerak dan konten tak berujung.** Tidak ada carousel, infinite scroll, atau konten yang bergerak otomatis di surface publik. |
| P04-R13 | **Regulasi.** Isi `regulations` dipetakan di dokumen 40 sebagai tabel: persyaratan → di mana dipenuhi → bukti → Not verified. Tidak ada klaim kepatuhan hukum (§2.4). Untuk layanan di Indonesia, pemilik produk perlu memastikan regulasi yang berlaku, mis. UU No. 8 Tahun 2016 tentang Penyandang Disabilitas dan ketentuan SPBE; engine mencatatnya sebagai `A-nn`, bukan fakta. |

## P04.4 Komponen (16)

R wajib bila pack dipilih dan kondisinya terpenuhi; S dipilih bila kondisinya terpenuhi; O dipilih bila brief memerlukannya. Setiap komponen diperluas ke 18 seksi §6.3.

| Komponen | Tingkat | Kontrak minimum |
|---|---|---|
| OfficialSiteBanner | R bila `operator_type` `government` atau `regional_government` | Bar tipis paling atas sebelum ServiceHeader. Teks "situs resmi" dari brief dan glosarium. Details yang menjelaskan cara mengenali situs resmi (domain `official_domain`, koneksi aman). Tidak memakai warna status. Tidak bisa ditutup. |
| ServiceHeader | R | Nama layanan sebagai tautan ke StartPage; navigasi layanan bila ada; LanguageSelector bila ada. SkipLink berada sebelum header. |
| ServiceFooter | R | Kanal bantuan (AssistedDigital), tautan privasi, pernyataan aksesibilitas, syarat, pemilik layanan, pengaturan cookie bila ConsentBanner dipilih. Posisi tautan bantuan sama di setiap halaman. |
| BackLink | R | Di atas konten halaman pertanyaan; kembali ke langkah sebelumnya tanpa kehilangan isian; berupa tautan dengan `href` eksplisit sehingga bekerja tanpa JavaScript. |
| SummaryList | R | Pasangan istilah–nilai (`dl`) dengan aksi "Ubah" per baris yang membawa nama field secara tersembunyi ("Ubah tanggal lahir"); setelah diubah kembali ke CheckAnswers; nilai panjang dibungkus, tidak dipotong. |
| ConfirmationPanel | R | `h1` hasil dan nomor referensi dengan token tampilan angka (tetap ≥ 16, angka tabular, bisa disalin); fokus ke `h1` saat dimuat; bukan alert; diikuti "apa yang terjadi selanjutnya". |
| MemorableDate | R | Tiga field (hari, bulan, tahun) dalam fieldset dengan legend; `inputmode="numeric"`; `autocomplete` `bday-day`, `bday-month`, `bday-year` untuk tanggal lahir; urutan field mengikuti format B1; error menandai field yang salah saja. Untuk tanggal yang diingat (lahir, terbit dokumen), bukan DatePicker. |
| InsetText | R | Menonjolkan teks penting yang bukan status: garis tepi `border-strong` netral, bukan warna semantik (I1); tidak dipakai untuk severity. |
| WarningText | R | Ikon warning terkunci + teks tebal `text-primary` (mis. "Anda dapat dikenai sanksi bila ..."); teks tersembunyi "Peringatan" untuk pembaca layar. Statis dan tidak diumumkan; bukan InlineAlert. |
| Details | R | `<details>`/`<summary>` native untuk bantuan opsional ("Saya tidak tahu nomor ini"); tidak menyembunyikan informasi wajib. Berbeda dengan Accordion (banyak panel). |
| TaskList | S bila pengajuan punya beberapa bagian | Daftar bagian dengan status teks dari glosarium (mis. Belum dimulai, Sedang diisi, Selesai, Belum bisa dimulai) yang dipetakan ke kelas C; bagian yang terkunci dijelaskan alasannya; nama bagian adalah tautan. |
| PhaseBanner | S bila `service_phase` `alpha` atau `beta` | Label fase + tautan masukan, di bawah ServiceHeader. |
| LanguageSelector | S bila lebih dari satu `ui_locale` | Nama bahasa ditulis dalam bahasanya sendiri dengan atribut `lang`; berupa tautan atau form yang bekerja tanpa JavaScript; tetap di halaman yang sama setelah berganti bahasa. |
| ConsentBanner | S bila ada cookie atau pelacakan non-esensial | Pilihan terima dan tolak setara; tidak memblokir konten; pilihan bisa diubah dari ServiceFooter. Kebijakan dari brief, selain itu `A-nn`. |
| ExitThisPage | O bila `sensitive_service: true` | Tombol tetap terlihat di setiap halaman dan bisa dipicu lewat pintasan; membawa pengguna ke situs netral. Penghapusan jejak riwayat browser: Not verified. Dijelaskan di StartPage. |
| DocumentViewer | O bila layanan menampilkan dokumen | Isi dokumen tersedia sebagai HTML yang dapat diakses; tombol unduh menyebut format dan ukuran; PDF tidak boleh menjadi satu-satunya bentuk informasi wajib. |

## P04.5 Pattern (14)

Setiap pattern diperluas ke 10 seksi §11.3.

| Pattern | Tingkat | Kontrak minimum |
|---|---|---|
| StartPage | R | Apa yang bisa dilakukan, siapa yang berhak, apa yang perlu disiapkan, perkiraan waktu, kanal alternatif; satu tombol mulai. |
| QuestionPage | R | P04-R2: BackLink, `h1` pertanyaan, helper, satu tombol lanjut; error memakai ErrorSummary. |
| CheckAnswers | R | SummaryList semua jawaban per bagian dengan Ubah per baris; pernyataan kebenaran data bila perlu; tombol kirim menyebut aksinya. |
| Confirmation | R | ConfirmationPanel + nomor referensi + apa yang terjadi selanjutnya + cara cek status + cetak atau simpan bukti. Notifikasi email atau SMS hanya bila disebut brief. |
| SaveAndReturn | R | Simpan dan lanjutkan nanti dengan cara kembali yang jelas; masa simpan dari `save_retention`. |
| AssistedDigital | R | Kanal alternatif ditampilkan di StartPage, ServiceFooter, dan halaman error sistem. |
| TaskListFlow | S bila pengajuan multi-bagian | TaskList sebagai pusat; setiap bagian berisi QuestionPage dan CheckAnswers bagiannya. |
| EligibilityChecker | S bila brief menyebut syarat penerima | Pertanyaan singkat sebelum mulai; hasil "tidak memenuhi syarat" menjelaskan alasan dan alternatif; jawaban tidak disimpan. |
| StatusTracking | S bila journey memuat cek status | Cek dengan nomor referensi; Timeline status; kelas C per state dari `lifecycle.json`. |
| AppointmentBooking | S bila ada layanan tatap muka | Pilih lokasi, tanggal (DatePicker), dan slot (RadioGroup); slot penuh dijelaskan; ubah dan batal tersedia. |
| FeePayment | S bila `fees` bukan `none` | Rincian biaya sebelum bayar; pembayaran gagal (C1) tidak menghapus pengajuan; bukti bayar bisa dicetak. |
| ServiceFeedback | S | Survei kepuasan singkat setelah Confirmation; opsional; tidak menghalangi alur. |
| SignAndDeclare | O | Pernyataan kebenaran data berupa Checkbox wajib dengan teks pernyataan lengkap. Tanda tangan elektronik tersertifikasi hanya lewat penyedia eksternal yang disebut brief (`A-nn`); engine tidak mendesain alur sertifikasinya. |
| ExitSafely | O bila `sensitive_service: true` | ExitThisPage di setiap halaman dan panduan privasi di StartPage. |

## P04.6 Glosarium awal

Usulan label (`source: derived`). `glossary_seed` di brief dan nada L11 menang.

| ID istilah | `id-ID` | `en-US` |
|---|---|---|
| `service.start` | Mulai sekarang | Start now |
| `form.continue` | Lanjutkan | Continue |
| `summary.change` | Ubah | Change |
| `error.summary.title` | Ada yang perlu diperbaiki | There is a problem |
| `error.title.prefix` | Perlu diperbaiki: | Error: |
| `confirmation.reference` | Nomor referensi Anda | Your reference number |
| `banner.official` | Situs resmi pemerintah | An official government website |
| `session.extend` | Lanjutkan sesi | Stay signed in |

## P04.7 Validasi (dijalankan V22)

| ID | Lulus bila |
|---|---|
| P04-V1 | Dengan JavaScript dimatikan, setiap journey R (StartPage → QuestionPage → CheckAnswers → Confirmation) bisa diselesaikan di preview. Tanpa browser headless: NOT RUN |
| P04-V2 | Setiap halaman surface publik punya SkipLink, ServiceHeader, ServiceFooter, tepat satu `h1`, dan OfficialSiteBanner bila operator pemerintah |
| P04-V3 | Setiap QuestionPage: `h1` = label pertanyaan yang terhubung ke field lewat `label` atau `legend`; satu aksi primer; BackLink ada |
| P04-V4 | Microcopy per locale: rata-rata ≤ 15 kata per kalimat, tidak ada kalimat > 25 kata, 0 frasa dari daftar `avoid` |
| P04-V5 | Setiap state error halaman punya ErrorSummary dengan tautan ke field dan judul dokumen berprefiks penanda error |
| P04-V6 | Anggaran P04-R9 terukur dan terpenuhi, atau ada ADR |
| P04-V7 | CheckAnswers dan Confirmation punya `@media print` tanpa navigasi |
| P04-V8 | Peringatan sesi memberi aksi perpanjang dan minimal 20 detik untuk merespons (tes interaksi) |
| P04-V9 | Tidak ada carousel, infinite scroll, atau gerak otomatis di surface publik; archetype yang diveto P04-R10 tidak dipakai tanpa ADR |

## P04.8 Override engine

Hanya butir berikut yang mengganti default engine; aturan lain di pack ini memperketat.

1. §6.4: reference web untuk surface publik `html-first` (P04-R1).
2. §14C: anggaran lebih ketat untuk halaman pertanyaan (P04-R9).
3. §4.6: veto archetype (P04-R10).
4. §11.2: di surface publik, CrudFlow diganti rangkaian StartPage → QuestionPage → CheckAnswers → Confirmation, dan SearchAndFilter tidak wajib. Di surface internal pada proyek yang sama, keduanya tetap berlaku.
