<!-- ds-pack id="P02" name="b2c-commerce" version="1.0.1" engine_min="1.6.0" phases="0, 0B, 3, 4, 8, 11, 12, 14" -->
# Pack P02 · Commerce konsumen (B2C)

> Pack opsional untuk Universal Design System Generator, engine `1.6.0` atau lebih baru dengan major yang sama. Dipilih lewat B7 `component_packs: [P02-b2c-commerce]`. Baseline, invarian, dan brief eksplisit menang atas pack ini (§0). Pack ini memperketat aturan engine, menambah 21 komponen dan 17 pattern, dan hanya mengganti default engine pada butir di P02.8.

---

## P02.1 Lingkup

- **Untuk:** sisi pembeli di toko daring, marketplace, pemesanan layanan atau tiket, pesan-antar, langganan berbayar, dan program loyalitas.
- **Bukan untuk:** dasbor penjual, admin toko, dan operasi gudang (pakai P01 untuk surface `operational`); feed konten dan sosial (P03); layanan publik pemerintah (P04).
- **Cakupan surface:** aturan P02 berlaku untuk surface dengan `surface_type` `consumer` dan `public`. Komponen P02 di surface lain ditulis "tidak dipakai" di tabel §8.4.
- **Kompatibilitas** (§0 aturan 6): P01 kompatibel (surface berbeda); P03 kompatibel di surface yang sama dan berbagi ChatThread; P04 bertentangan di surface `public` karena keduanya mengganti CrudFlow dengan alur berbeda.

## P02.2 Konfigurasi (`pack_config.P02` di B7)

| Field | Isi | Bila kosong |
|---|---|---|
| `commerce_model` | subset `retail`, `marketplace`, `booking`, `subscription`, `delivery` | `A-nn`; diturunkan dari journey B5 |
| `currencies` | mata uang yang dipakai; format dari B1 | mata uang di B1 `formats.currency` |
| `payment_methods` | mis. kartu, e-wallet, transfer bank atau virtual account, QR, bayar di tempat, paylater | `A-nn`; PaymentMethodSelector tetap dipilih bila ada pembayaran |
| `card_payment_via_provider` | `true` bila data kartu ditangani SDK atau hosted fields penyedia pembayaran | `true` (P02-R3) |
| `fulfillment` | subset `shipping`, `pickup`, `digital`, `service` | `A-nn` |
| `promotions` | subset `vouchers`, `flash_sale`, `loyalty_points` | kosong |
| `reviews` | `true` bila ada ulasan pembeli | `false` |
| `guest_checkout` | `true` bila pembelian tanpa akun diizinkan | `A-nn`; diperlakukan `false` |
| `chat_with_seller` | `true` bila pembeli bisa mengobrol dengan penjual atau toko | `false` |
| `age_restricted` | `true` bila ada produk dengan batas usia | `false` |
| `cart_persistence` | masa simpan keranjang | `A-nn` |

## P02.3 Aturan domain

| ID | Aturan |
|---|---|
| P02-R1 | **Harga transparan.** Total yang harus dibayar, termasuk semua biaya wajib (ongkir, biaya layanan, pajak) dan potongan, terlihat sebelum pembeli berkomitmen; tidak ada biaya yang baru muncul di langkah terakhir. Tombol bayar menyebut totalnya ("Bayar Rp…"). Harga coret selalu disertai teks tersembunyi atau terlihat ("Harga awal"), karena garis coret tidak dibacakan pembaca layar. |
| P02-R2 | **Tanpa dark pattern.** Dilarang: urgensi palsu (hitung mundur dan sisa stok hanya dari data server yang nyata); copy yang mempermalukan penolakan; add-on, asuransi, atau donasi yang tercentang otomatis; menambah barang ke keranjang tanpa aksi pengguna; berhenti langganan lebih sulit daripada berlangganan (kanal sama, jumlah langkah tidak lebih banyak); biaya tersembunyi; memaksa membuat akun bila `guest_checkout` diizinkan; tombol terima dan tolak dengan bobot visual yang tidak setara. |
| P02-R3 | **Keamanan pembayaran di UI.** Nomor kartu dan CVV hanya dimasukkan lewat komponen penyedia pembayaran; sistem hanya menata wadahnya dan menulis di dokumen 90 bagian mana yang tidak bisa ditata. Kartu tersimpan hanya ditampilkan dengan 4 digit terakhir. Tantangan 3DS atau OTP berjalan di alur penyedia dengan jalan kembali ke pesanan. Engine tidak membuat klaim kepatuhan standar keamanan pembayaran (§2.4). |
| P02-R4 | **Status pesanan jujur (I6).** "Menunggu pembayaran dari Anda" (pembeli harus bertindak) adalah C2 dengan batas waktu dari server; "Memverifikasi pembayaran" adalah C5; gagal bayar C1; diproses dan dikirim C5; diterima C4; dibatalkan C3; pengembalian dana diproses C5. Tidak ada tampilan "Berhasil" sebelum konfirmasi server atau callback penyedia pembayaran. |
| P02-R5 | **Gambar produk.** Selalu memakai Image (§6.5): `alt` dari nama produk dan varian, bukan "gambar produk"; rasio dari `aspect-*`; baris pertama dimuat segera, sisanya lazy. Informasi penting (harga, promo, syarat) ditulis sebagai teks, tidak di dalam gambar banner. |
| P02-R6 | **Pemilihan varian.** Ukuran, warna, dan opsi lain berupa pilihan dengan label teks (nama warna, bukan swatch saja); varian yang tidak tersedia disabled-with-reason ("Habis"); perubahan harga dan stok akibat pilihan diumumkan polite. |
| P02-R7 | **Keranjang.** Jumlah memakai NumberInput dengan batas stok; hapus item memakai undo (DestructiveAction); total yang berubah diumumkan polite; perubahan stok atau harga sejak item ditambahkan diberitahukan di keranjang sebelum checkout. |
| P02-R8 | **Checkout.** Langkah sesedikit mungkin; alamat dengan atribut `autocomplete` (SC 1.3.5) dan alamat tersimpan; ringkasan pesanan selalu terlihat (sidebar di desktop, Details dengan total di header di ponsel); setiap bagian bisa diubah tanpa mengulang dari awal. |
| P02-R9 | **Pencarian dan daftar produk.** SearchField dengan saran (Combobox), filter memakai FilterChip dan Sheet di ponsel, jumlah hasil diumumkan, hasil kosong menawarkan alternatif. Daftar produk memakai paginasi atau "Muat lagi" (aturan core), bukan gulir tak berujung otomatis. |
| P02-R10 | **Ulasan dan rating.** Rating selalu disertai teks ("4,5 dari 5, 120 ulasan"); bintang bersifat dekoratif bagi pembaca layar; label "pembelian terverifikasi" berupa Tag, bukan warna status (I1). Moderasi ulasan di luar lingkup engine. |
| P02-R11 | **Persetujuan pemasaran.** Persetujuan menerima promosi terpisah dari syarat transaksi, tidak tercentang otomatis, dan bisa dicabut dengan satu aksi dari pengaturan maupun dari pesan promosi. |
| P02-R12 | **Promo yang bergerak.** Bila Carousel dipakai: ada kontrol jeda, tidak berputar otomatis tanpa kontrol jeda (SC 2.2.2), setiap slide bisa dijangkau keyboard, berhenti saat hover atau fokus. Grid statis lebih diutamakan. |
| P02-R13 | **Bahasa desain.** Veto default untuk surface `consumer` dan `public`: `dense-console` (hanya dibuka lewat brief eksplisit + ADR). Rekomendasi: `brand-led-tonal`, `soft-friendly`, `playful-vivid`, `quiet-luxury` untuk ritel premium, `immersive-glass` untuk katalog yang sangat visual. |
| P02-R14 | **Performa halaman produk.** Ruang gambar dipesan dengan `aspect-*` agar tidak ada pergeseran layout; gambar responsif dengan beberapa ukuran; target LCP ≤ 2,5 detik di perangkat menengah: Not verified: needs device test. |

## P02.4 Komponen (21)

R wajib bila pack dipilih dan kondisinya terpenuhi; S dipilih bila kondisinya terpenuhi atau tidak dikecualikan; O dipilih bila brief memerlukannya. Setiap komponen diperluas ke 18 seksi §6.3.

| Komponen | Tingkat | Kontrak minimum |
|---|---|---|
| PriceDisplay | R | Harga dengan format B1 dan angka tabular; varian harga coret + harga akhir + persen potongan dengan teks "Harga awal" (P02-R1); rentang harga ("Rp50.000–Rp75.000"); harga per satuan bila relevan; tidak pernah memakai warna status untuk potongan (I1). |
| ProductCard | R | Image, nama (dipotong maksimal 2 baris dengan nama lengkap tersedia bagi pembaca layar), PriceDisplay, RatingDisplay bila ada; seluruh kartu satu tautan dengan nama sebagai teks tautan; aksi sekunder (wishlist) tidak bersarang di dalam tautan. |
| VariantSelector | R | RadioGroup bersemantik dengan label teks per opsi; swatch warna selalu dengan nama warna; opsi habis disabled-with-reason; ukuran membuka panduan ukuran (Details atau Sheet). |
| CartLineItem | R | Image kecil, nama, varian, PriceDisplay, NumberInput jumlah, hapus dengan undo; perubahan harga atau stok ditandai teks + ikon (C2). |
| OrderSummary | R | Rincian subtotal, ongkir, biaya layanan, potongan, pajak, dan total; total diumumkan polite saat berubah; versi ringkas di ponsel berupa Details dengan total terlihat. |
| OrderStatusTracker | R | Langkah status pesanan sesuai P02-R4 dengan langkah saat ini, lampau, dan mendatang yang dibedakan secara non-warna; perkiraan waktu dan nomor resi bila ada; Timeline detail di bawahnya. |
| PaymentMethodSelector | R bila ada pembayaran | RadioGroup metode dengan nama dan ikon penyedia; metode tidak tersedia disabled-with-reason; metode kartu menampung komponen penyedia (P02-R3); kartu tersimpan menampilkan 4 digit terakhir. |
| AddressSelector | R bila `fulfillment` memuat `shipping` | Daftar alamat tersimpan (RadioGroup) + tambah alamat lewat form dengan `autocomplete`; alamat utama ditandai teks, bukan warna; ubah dan hapus. |
| RatingDisplay | S bila `reviews` | Angka rating + jumlah ulasan sebagai teks; bintang dekoratif disembunyikan dari pembaca layar (P02-R10). |
| ReviewItem | S bila `reviews` | Nama atau inisial, rating, tanggal, teks ulasan, foto ulasan (Image), Tag "pembelian terverifikasi", aksi "membantu" dengan jumlah. |
| ProductGallery | S | Gambar utama + thumbnail; navigasi dengan tombol berlabel dan keyboard; zoom lewat tombol (bukan hanya pinch atau hover); posisi "2 dari 6" terbaca. |
| DiscountTag | S bila `promotions` terisi | Tag potongan atau promo memakai warna merek atau aksen, bukan warna status (I1); teks lengkap ("Hemat 20%"). |
| VoucherInput | S bila `promotions` memuat `vouchers` | Field kode + tombol pakai; voucher yang berlaku menampilkan potongan di OrderSummary; voucher gagal menjelaskan alasan (kedaluwarsa, minimum belanja). |
| StockIndicator | S | Hanya dari data stok nyata (P02-R2); teks ("Sisa 3", "Habis", "Pre-order"); tidak dipakai bila data stok tidak tersedia. |
| WishlistToggle | S | Tombol bersemantik toggle (`aria-pressed`) dengan label yang menyebut produk; area klik ≥ 44 di sentuh; hasil diumumkan polite. |
| Carousel | O | P02-R12: kontrol jeda dan putar, tombol sebelumnya dan berikutnya berlabel, indikator posisi bertipe tombol, tidak berputar otomatis tanpa kontrol jeda. |
| LoyaltyBalance | O bila `promotions` memuat `loyalty_points` | Saldo poin, nilai setara mata uang bila ada, dan tanggal kedaluwarsa poin; riwayat poin di Timeline. |
| AgeGate | O bila `age_restricted` | Konfirmasi usia sebelum menampilkan produk berbatas usia; tidak menebak usia dari data lain; kebijakan verifikasi dari brief (`A-nn`). |
| ChatThread | O bila `chat_with_seller` | Pesan berurutan dengan pengirim dan waktu; pesan baru diumumkan polite; status terkirim dan dibaca berupa teks atau ikon berlabel; komposer dengan lampiran dan kirim lewat Enter (Shift+Enter baris baru) yang bisa diubah. |
| SlotPicker | O bila `commerce_model` memuat `booking` | Tanggal (DatePicker) + slot waktu sebagai RadioGroup; slot penuh disabled-with-reason; zona waktu lokasi layanan; kursi atau tempat duduk berupa daftar alternatif selain peta. |
| PlanCard | O bila `commerce_model` memuat `subscription` | Nama paket, harga per periode, total per tahun bila dibayar tahunan, fitur sebagai daftar teks, masa uji coba dan tanggal penagihan pertama tertulis jelas; paket rekomendasi ditandai teks, bukan hanya warna. |

## P02.5 Pattern (17)

Setiap pattern diperluas ke 10 seksi §11.3.

| Pattern | Tingkat | Kontrak minimum |
|---|---|---|
| ProductDiscovery | R | Beranda, kategori, pencarian, filter, dan urutan (P02-R9); state filter di URL untuk web; hasil kosong menawarkan alternatif. |
| ProductDetail | R | ProductGallery, nama, PriceDisplay, VariantSelector, StockIndicator, aksi tambah ke keranjang dan beli sekarang, informasi pengiriman, ulasan bila ada; aksi utama tetap terjangkau di ponsel tanpa menutup konten yang fokus (SC 2.4.11). |
| Cart | R | CartLineItem + OrderSummary; keranjang kosong spesifik dengan jalan kembali belanja; perubahan stok atau harga diberitahukan (P02-R7). |
| Checkout | R | P02-R8: alamat atau metode ambil, pengiriman, pembayaran, ringkasan; satu tombol bayar yang menyebut total; tidak ada biaya baru di langkah akhir. |
| PaymentFlow | R | Bayar → status (berhasil, gagal, menunggu); metode tertunda (transfer, virtual account, QR) menampilkan instruksi per kanal dalam Details, batas waktu dari server (CountdownTimer), dan cara cek status; gagal bayar tidak menghapus pesanan atau keranjang. |
| OrderTracking | R | Daftar pesanan + detail dengan OrderStatusTracker; aksi yang sesuai state (bayar, batalkan, lacak, konfirmasi diterima, ajukan pengembalian). |
| ReturnsAndRefunds | S bila `fulfillment` memuat `shipping` atau `pickup` | Ajukan pengembalian dengan alasan dan foto, status pengajuan, metode dan perkiraan waktu pengembalian dana; kebijakan dari brief (`A-nn`). |
| Reviews | S bila `reviews` | Tulis ulasan setelah pesanan diterima, rating wajib dengan RadioGroup berlabel, foto opsional, ubah ulasan. |
| VouchersAndPromotions | S bila `promotions` terisi | Daftar voucher milik pengguna, syarat tertulis, penerapan di checkout; flash sale hanya dengan waktu dan stok dari server (P02-R2). |
| Wishlist | S | Simpan, lihat daftar, pindahkan ke keranjang, pemberitahuan stok tersedia bila brief menyebutnya. |
| AccountAndAddresses | S | Profil, alamat tersimpan, metode pembayaran tersimpan (4 digit terakhir), riwayat pesanan, hapus akun bila brief menyebutnya. |
| MarketingPreferences | S | P02-R11: pilihan kanal dan topik promosi, semua mati secara default, berhenti berlangganan satu aksi. |
| SubscriptionManagement | O bila `commerce_model` memuat `subscription` | Daftar, ganti paket (dengan selisih biaya dijelaskan), jeda bila tersedia, berhenti berlangganan di kanal yang sama dengan jumlah langkah tidak lebih banyak dari saat mendaftar (P02-R2), konfirmasi tanggal akses berakhir. |
| BookingFlow | O bila `commerce_model` memuat `booking` | Pilih layanan atau acara → SlotPicker → data peserta → bayar → tiket atau bukti dengan kode yang bisa dibaca mesin dan teks alternatifnya. |
| GuestToAccount | O bila `guest_checkout` | Checkout tanpa akun; tawaran membuat akun hanya setelah pesanan selesai, tanpa mengulang data yang sudah diisi (SC 3.3.7). |
| AgeVerification | O bila `age_restricted` | AgeGate sebelum produk berbatas usia dan sebelum checkout; kebijakan verifikasi dari brief. |
| ChatWithSeller | O bila `chat_with_seller` | ChatThread dari detail produk atau pesanan dengan konteks produk atau pesanan terlampir; jam respons penjual bila ada. |

## P02.6 Glosarium awal

Usulan label (`source: derived`). `glossary_seed` di brief dan nada L11 menang.

| ID istilah | `id-ID` | `en-US` |
|---|---|---|
| `cart.add` | Tambah ke keranjang | Add to cart |
| `checkout.buy_now` | Beli sekarang | Buy now |
| `checkout.pay_total` | Bayar {total} | Pay {total} |
| `price.original` | Harga awal | Original price |
| `price.total` | Total pembayaran | Total |
| `fee.shipping` | Ongkos kirim | Shipping |
| `stock.out` | Habis | Out of stock |
| `stock.left` | Sisa {n} | {n} left |
| `order.awaiting_payment` | Menunggu pembayaran Anda | Awaiting your payment |
| `order.verifying_payment` | Memverifikasi pembayaran | Verifying payment |
| `review.count` | {n} ulasan | {n} reviews |
| `subscription.cancel` | Berhenti berlangganan | Cancel subscription |

`{n}` dan `{total}` ditulis dengan ICU MessageFormat (§12.4).

## P02.7 Validasi (dijalankan V22)

| ID | Lulus bila |
|---|---|
| P02-V1 | Preview Checkout menampilkan rincian biaya lengkap sebelum tombol bayar, dan label tombol bayar memuat total |
| P02-V2 | 0 Checkbox atau Switch untuk add-on, asuransi, donasi, atau persetujuan pemasaran yang bernilai `true` secara default di `components.json` dan `patterns.json`; CountdownTimer dan StockIndicator di pattern P02 terikat ke field data server; jumlah langkah berhenti berlangganan ≤ langkah berlangganan |
| P02-V3 | Setiap harga coret punya teks "Harga awal" yang terbaca; setiap rating punya padanan teks |
| P02-V4 | Tidak ada komponen sistem yang merender input nomor kartu atau CVV sendiri bila `card_payment_via_provider`; kartu tersimpan hanya menampilkan 4 digit terakhir |
| P02-V5 | `lifecycle.json` pesanan dan pembayaran mengikuti P02-R4; tidak ada state C4 sebelum konfirmasi server |
| P02-V6 | Setiap Image produk di preview punya aturan `alt` dari data produk dan rasio `aspect-*`; baris pertama tidak lazy |
| P02-V7 | Setiap swatch varian punya label teks; varian habis disabled-with-reason |
| P02-V8 | Bila Carousel dipilih: kontrol jeda ada, tidak ada putar otomatis tanpa kontrol jeda, semua slide terjangkau keyboard (tes interaksi) |
| P02-V9 | Tombol tolak dan terima pada persetujuan memakai varian dan ukuran yang setara; copy penolakan netral (item tinjauan manual); `dense-console` tidak dipakai di surface `consumer` atau `public` tanpa ADR |

## P02.8 Override engine

Hanya butir berikut yang mengganti default engine; aturan lain di pack ini memperketat.

1. §4.6: veto `dense-console` untuk surface `consumer` dan `public` (P02-R13).
2. §11.2: di surface `consumer` dan `public`, CrudFlow diganti rangkaian ProductDiscovery → ProductDetail → Cart → Checkout → PaymentFlow → OrderTracking, dan SearchAndFilter menyatu ke ProductDiscovery. Di surface `operational` pada proyek yang sama, keduanya tetap berlaku.
