<!-- ds-pack id="P03" name="b2c-media-social" version="1.0.0" engine_min="1.7.0" shares="P02:ChatThread" phases="0, 0B, 3, 4, 7, 8, 11, 12, 14" -->
# Pack P03 · Media, konten, dan sosial (B2C)

> Pack opsional untuk Universal Design System Generator, engine `1.7.0` atau lebih baru dengan major yang sama. Dipilih lewat B7 `component_packs: [P03-b2c-media-social]`. Baseline, invarian, dan brief eksplisit menang atas pack ini (§0). Pack ini memperketat aturan engine, menambah 20 komponen dan 16 pattern, berbagi satu komponen dengan P02 (§0 aturan 8), dan hanya mengganti default engine pada butir di P03.8.

---

## P03.1 Lingkup

- **Untuk:** feed konten, video dan audio, artikel, komunitas, profil dan mengikuti, pesan langsung, siaran langsung, dan cerita (story) di aplikasi konsumen.
- **Bukan untuk:** moderasi konten di sisi admin (pakai P01 untuk surface `operational`), transaksi jual beli (P02).
- **Cakupan surface:** aturan P03 berlaku untuk elemen feed, media, dan interaksi sosial di surface `consumer`, `content`, dan `public`.
- **Kompatibilitas** (§0 aturan 6):
  - **P01:** kompatibel; cakupan surface berbeda.
  - **P02:** kompatibel di surface yang sama. P02 mengatur elemen commerce (daftar produk tetap memakai "Muat lagi"), P03 mengatur feed dan konten. ChatThread dipakai bersama.
  - **P04:** bertentangan di surface `public`, karena P04-R12 melarang feed tak berujung dan gerak otomatis. Bila keduanya dipilih dan ada surface `public`, Phase 0 bertanya.

## P03.2 Konfigurasi (`pack_config.P03` di B7)

| Field | Isi | Bila kosong |
|---|---|---|
| `content_types` | subset `text`, `image`, `video`, `audio`, `article`, `story`, `live` | `A-nn`; diturunkan dari journey B5 |
| `ugc` | `true` bila pengguna membuat konten | `A-nn`; diperlakukan `true` bila ada journey membuat konten |
| `social_graph` | `none` · `follow` · `friends` · `communities` | `none` |
| `messaging` | `none` · `direct` · `group` | `none` |
| `reactions` | subset `like`, `comment`, `share`, `save` | `A-nn` |
| `ranking` | `chronological` · `algorithmic` · `both` | `A-nn`; diperlakukan `algorithmic` (aturan transparansi P03-R6 berlaku) |
| `ads` | `true` bila ada konten iklan atau bersponsor | `false` |
| `audience_age` | `adults_only` · `general` · `includes_minors` | `A-nn`; diperlakukan `includes_minors` (default aman P03-R9) |
| `offline_downloads` | `true` bila media bisa diunduh untuk diputar offline | `false` |
| `monetization` | subset `tipping`, `creator_subscription` | kosong |

## P03.3 Aturan domain

| ID | Aturan |
|---|---|
| P03-R1 | **Feed yang aman.** Gulir tak berujung hanya boleh di komponen Feed, dengan pola ARIA feed: `role="feed"`, setiap item `article` dengan `aria-setsize` dan `aria-posinset`, `aria-busy` saat memuat. Page Down/Page Up berpindah antar item; Ctrl+End/Ctrl+Home keluar dari feed. Ada tautan "Lewati feed" dan footer tetap bisa dijangkau. Posisi baca dipulihkan saat kembali. Jumlah item yang baru dimuat diumumkan polite. Konten baru **tidak** disisipkan di atas posisi baca secara otomatis; pengguna menekan tombol "n postingan baru". Feed kronologis punya akhir yang jelas ("Anda sudah melihat semuanya"). |
| P03-R2 | **Pemutaran media.** Tidak ada putar otomatis dengan suara (SC 1.4.2). Video tanpa suara boleh berputar otomatis hanya bila pengaturan pengguna mengizinkan dan `prefers-reduced-motion` bukan `reduce`; apa pun yang bergerak > 5 detik punya kontrol jeda (SC 2.2.2). Pemutaran otomatis video berikutnya menampilkan hitung mundur yang bisa dibatalkan. Konten buatan platform wajib punya teks takarir (video) atau transkrip (audio); konten buatan pengguna mendapat alat unggah takarir dan takarir otomatis berlabel "otomatis". |
| P03-R3 | **Kedipan.** Antarmuka tidak berkedip lebih dari 3 kali per detik (SC 2.3.1). Peringatan fotosensitif untuk konten pengguna adalah keputusan produk (`A-nn`). |
| P03-R4 | **Teks alternatif konten pengguna.** Composer meminta teks alternatif per gambar (opsional, dengan pengingat sebelum terbit); gambar dengan teks alternatif bertanda "ALT"; teks alternatif otomatis diberi label "otomatis". |
| P03-R5 | **Keterlibatan yang jujur.** Fitur pemicu kebiasaan (putar berikutnya otomatis, notifikasi pengingat, streak) bisa dimatikan pengguna; notifikasi bisa digabung; feed menyampaikan bila sudah tidak ada konten baru. |
| P03-R6 | **Transparansi urutan.** Bila `ranking` memuat `algorithmic`: setiap item punya "Mengapa saya melihat ini" di Menu item; bila `both`, pengguna bisa beralih ke urutan kronologis dan pilihannya diingat. |
| P03-R7 | **Iklan dan konten bersponsor.** Diberi label teks ("Iklan", "Bersponsor") di bagian atas item, sama menonjolnya dengan nama pembuat; tidak memakai warna status (I1); bisa dilaporkan dan disembunyikan. |
| P03-R8 | **Alat keamanan.** Laporkan, blokir, dan bisukan bisa dicapai paling banyak dalam 2 aksi dari Menu item atau profil; pelapor bisa melihat status laporannya; media sensitif ditutup ContentWarning dengan alasan dan tombol tampilkan; kontrol privasi (siapa yang bisa melihat, mengomentari, mengirim pesan) mudah ditemukan. |
| P03-R9 | **Pengguna di bawah umur.** Bila `audience_age` `includes_minors`: default akun privat, pesan dari bukan koneksi mati, lokasi tidak dibagikan, dan iklan tertarget dimatikan untuk pengguna yang dinyatakan di bawah umur. Kebijakan verifikasi usia dan detailnya dari brief (`A-nn`). |
| P03-R10 | **Pesan.** ChatThread (bersama P02); indikator mengetik tampil visual tetapi tidak diumumkan; tanda dibaca bisa dimatikan pengguna; pesan yang hilang otomatis ditandai jelas beserta durasinya. |
| P03-R11 | **Angka dan waktu.** Angka diringkas ("1,2 rb") selalu punya nilai lengkap yang bisa dibaca teknologi bantu; waktu relatif selalu punya waktu absolut di elemen `time` (core Timeline). |
| P03-R12 | **Hemat data.** Kualitas gambar dan video menyesuaikan jaringan dan pengaturan hemat data; unduhan offline (bila ada) menampilkan ruang penyimpanan yang dipakai dan bisa dihapus per item. |
| P03-R13 | **Siaran langsung.** Label teks "Live" (bukan hanya titik merah); jumlah penonton dengan nilai lengkap; obrolan langsung bisa dijeda gulirnya dan tidak mengumumkan setiap pesan. |
| P03-R14 | **Bahasa desain.** Veto default untuk surface `consumer`, `content`, dan `public`: `dense-console` (hanya dibuka lewat brief eksplisit + ADR). Rekomendasi: `immersive-glass` untuk media, `playful-vivid` atau `brand-led-tonal` untuk komunitas umum, `editorial-contrast` untuk artikel, `neo-brutalist` untuk komunitas kreatif. |

## P03.4 Komponen (20)

R wajib bila pack dipilih dan kondisinya terpenuhi; S dipilih bila kondisinya terpenuhi atau tidak dikecualikan; O dipilih bila brief memerlukannya. Setiap komponen diperluas ke 18 seksi §6.3.

| Komponen | Tingkat | Kontrak minimum |
|---|---|---|
| Feed | R | P03-R1 lengkap: pola ARIA feed, tombol "n postingan baru", "Lewati feed", pemulihan posisi, akhir feed, state memuat dan gagal per batch dengan Retry. |
| PostCard | R | UserIdentity, waktu (P03-R11), isi (teks, MediaGrid, VideoPlayer, AudioPlayer, atau tautan), label bersponsor bila ada, ReactionBar, Menu item (laporkan, blokir, bisukan, mengapa saya melihat ini). Satu `article` dengan judul yang bisa dibaca; tautan ke detail tidak membungkus aksi lain. |
| ReactionBar | R | Tombol reaksi bersemantik toggle (`aria-pressed`) dengan label yang menyebut aksi dan jumlah ("Suka, 1.204"); jumlah diringkas secara visual saja; hasil diumumkan polite; area klik ≥ 44 di sentuh. |
| UserIdentity | R | Avatar + nama + handle; tanda terverifikasi berupa ikon berlabel teks, bukan warna; nama dan handle tidak terpotong untuk pembaca layar. |
| VideoPlayer | R bila `content_types` memuat `video` atau `live` | Kontrol native-like yang bisa dijangkau keyboard dan tetap tersedia bagi pembaca layar; putar/jeda, posisi, volume, bisu, takarir (ukuran teks ≥ `type-body`), kecepatan, layar penuh; P03-R2; pintasan hanya aktif saat player fokus. |
| AudioPlayer | R bila `content_types` memuat `audio` | Putar/jeda, posisi dengan `aria-valuetext` waktu, kecepatan, lompat maju dan mundur; tautan transkrip; tetap berjalan saat layar berpindah bila brief menyebutnya. |
| Composer | R bila `ugc` | Teks dengan penghitung karakter, lampiran media dengan teks alternatif per gambar (P03-R4), pemilih audiens (siapa yang bisa melihat), pratinjau, simpan draf, terbitkan; unggahan besar memakai progress dan bisa dibatalkan. |
| ContentWarning | R bila `ugc` | Media sensitif tertutup blur dengan alasan tertulis dan tombol "Tampilkan"; pilihan pengguna untuk selalu menampilkan per kategori; blur tidak berlaku untuk teks peringatannya sendiri. |
| PostComments | R bila `reactions` memuat `comment` | Komentar dengan balasan bertingkat maksimal 2 tingkat secara visual (lebih dalam menjadi "lihat balasan"); urutan bisa dipilih; komentar baru dari orang lain tidak menggeser posisi baca; Menu per komentar dengan alat keamanan (P03-R8). |
| FollowButton | S bila `social_graph` bukan `none` | Toggle dengan label yang menyebut orangnya ("Ikuti Rina", "Berhenti mengikuti Rina"); berhenti mengikuti tidak butuh konfirmasi kecuali brief menyebutnya; status permintaan untuk akun privat. |
| ProfileHeader | S bila `social_graph` bukan `none` | UserIdentity besar, bio, jumlah pengikut dan diikuti (P03-R11), FollowButton, Menu profil (blokir, bisukan, laporkan, bagikan). |
| MediaGrid | S bila `content_types` memuat `image` | 1-4 gambar dalam tata letak tetap, lebih dari 4 diringkas "+n"; setiap gambar memakai Image dan membuka penampil dengan navigasi keyboard dan posisi "2 dari 5". |
| ShareSheet | S | Lembar berbagi platform bila tersedia, salin tautan (CopyButton), dan bagikan ke pesan bila `messaging`; tidak memaksa memilih aplikasi tertentu. |
| ChatThread | S bila `messaging` bukan `none` | **Dipakai bersama P02** (§0 aturan 8). Kontrak P02 ditambah: percakapan grup dengan daftar anggota, indikator mengetik dan tanda dibaca sesuai P03-R10, pesan hilang otomatis, pesan dari bukan koneksi masuk ke folder permintaan. |
| SponsoredLabel | S bila `ads` | Label teks "Iklan" atau "Bersponsor" di bagian atas item dengan tautan "tentang iklan ini" (P03-R7). |
| StoryViewer | O bila `content_types` memuat `story` | Maju otomatis per item dengan progress terlihat; jeda saat ditekan lama, fokus, atau pembaca layar aktif (SC 2.2.1); tombol berlabel untuk maju, mundur, jeda, dan tutup; setiap item punya teks alternatif. |
| LiveChat | O bila `content_types` memuat `live` | P03-R13: gulir bisa dijeda dengan tombol "lanjutkan" yang menyebut jumlah pesan baru, batas kecepatan kirim dijelaskan, moderasi lewat Menu per pesan. |
| ArticleReader | O bila `content_types` memuat `article` | Tipografi baca dengan `layout-measure`, daftar isi untuk artikel panjang, perkiraan waktu baca, kemajuan baca yang tidak mengandalkan warna, mode baca yang tetap mengikuti ukuran teks sistem. |
| PollCard | O | Pilihan sebagai RadioGroup; hasil setelah memilih berupa persentase dengan angka dan bar (angka selalu ditulis); waktu berakhir dan jumlah suara. |
| DownloadManager | O bila `offline_downloads` | Daftar unduhan dengan ukuran, progress, jeda, hapus per item, total ruang terpakai (P03-R12). |

## P03.5 Pattern (16)

Setiap pattern diperluas ke 10 seksi §11.3.

| Pattern | Tingkat | Kontrak minimum |
|---|---|---|
| BrowseFeed | R | Feed beranda dengan tab sumber (mis. Mengikuti, Untuk Anda) bila `ranking` `both`; tombol konten baru; akhir feed; pengaturan feed. |
| ContentDetail | R | Halaman satu konten dengan media, PostComments, konten terkait yang tidak berputar otomatis, dan jalan kembali ke posisi feed. |
| CreatePost | R bila `ugc` | Composer → pratinjau → terbitkan; pengingat teks alternatif; unggahan gagal tidak menghapus draf; konten terbit diumumkan polite dengan tautan ke konten. |
| ReportBlockMute | R bila `ugc` atau `social_graph` bukan `none` | P03-R8: laporkan dengan kategori dan catatan opsional, blokir, bisukan, status laporan, daftar akun yang diblokir dan dibisukan di pengaturan. |
| PrivacyControls | R bila `ugc` atau `social_graph` bukan `none` | Siapa yang bisa melihat, mengomentari, menandai, dan mengirim pesan; default sesuai P03-R9; perubahan berlaku langsung dan dijelaskan akibatnya. |
| ContentPreferences | R bila `ranking` memuat `algorithmic` | Mengapa saya melihat ini, tampilkan lebih sedikit, tidak tertarik, pilihan kronologis bila `both` (P03-R6), pengaturan fitur pemicu kebiasaan (P03-R5). |
| ProfileAndFollow | S bila `social_graph` bukan `none` | Profil sendiri dan orang lain, ubah profil, daftar pengikut dan diikuti dengan pencarian, permintaan mengikuti untuk akun privat. |
| DirectMessaging | S bila `messaging` bukan `none` | Daftar percakapan, folder permintaan pesan, ChatThread, mulai percakapan, bisukan dan laporkan percakapan. |
| NotificationsActivity | S | Aktivitas dikelompokkan per hari dan jenis, digabung bila banyak ("Rina dan 12 lainnya menyukai…"), pengaturan per jenis notifikasi. |
| SearchAndExplore | S | Cari orang, tag, dan konten dengan tab hasil; jelajah tanpa putar otomatis bersuara; hasil kosong menawarkan alternatif. |
| ShareContent | S | ShareSheet dari setiap konten; tautan yang dibagikan membuka konten yang benar walau penerima belum masuk, sesuai pengaturan privasi. |
| Collections | S bila `reactions` memuat `save` | Simpan ke koleksi, buat dan ganti nama koleksi, koleksi privat secara default. |
| StoriesFlow | O bila `content_types` memuat `story` | Baris cerita, StoryViewer, balas cerita lewat pesan bila `messaging`, cerita kedaluwarsa dijelaskan. |
| LiveStreamViewing | O bila `content_types` memuat `live` | VideoPlayer langsung, LiveChat, jumlah penonton, pemberitahuan siaran berakhir dengan tautan rekaman bila ada. |
| OfflineDownloads | O bila `offline_downloads` | Unduh, DownloadManager, putar offline, status konten yang sudah tidak tersedia. |
| CreatorSupport | O bila `monetization` terisi | Tip atau langganan ke kreator memakai PaymentFlow P02 bila P02 dipilih; tanpa P02, alur pembayaran menjadi komponen dan pattern domain (§6.2) dengan aturan harga transparan setara P02-R1. |

## P03.6 Glosarium awal

Usulan label (`source: derived`). `glossary_seed` di brief dan nada L11 menang.

| ID istilah | `id-ID` | `en-US` |
|---|---|---|
| `feed.new_posts` | {n} postingan baru | {n} new posts |
| `feed.caught_up` | Anda sudah melihat semuanya | You're all caught up |
| `feed.skip` | Lewati feed | Skip feed |
| `reaction.like` | Suka | Like |
| `social.follow` | Ikuti {nama} | Follow {name} |
| `safety.report` | Laporkan | Report |
| `safety.block` | Blokir | Block |
| `safety.mute` | Bisukan | Mute |
| `ranking.why` | Mengapa saya melihat ini | Why am I seeing this |
| `ads.sponsored` | Bersponsor | Sponsored |
| `media.show_sensitive` | Tampilkan | Show |
| `media.auto_caption` | Takarir otomatis | Auto-generated captions |

`{n}` dan `{nama}` ditulis dengan ICU MessageFormat (§12.4).

## P03.7 Validasi (dijalankan V22)

| ID | Lulus bila |
|---|---|
| P03-V1 | Feed memakai `role="feed"` dengan `article`, `aria-setsize`, `aria-posinset`, dan `aria-busy`; tes interaksi Page Down/Page Up dan Ctrl+End/Ctrl+Home lulus; "Lewati feed" ada; footer terjangkau; posisi pulih saat kembali; konten baru tidak disisipkan di atas posisi baca |
| P03-V2 | Tidak ada putar otomatis bersuara; putar otomatis tanpa suara mati di bawah `prefers-reduced-motion: reduce`; setiap yang bergerak > 5 detik punya kontrol jeda; putar berikutnya punya hitung mundur yang bisa dibatalkan |
| P03-V3 | VideoPlayer dan AudioPlayer: semua kontrol terjangkau keyboard dan berlabel; takarir bisa dinyalakan; transkrip tersedia untuk audio; pintasan hanya aktif saat player fokus |
| P03-V4 | Composer punya field teks alternatif per gambar dan pengingat sebelum terbit; teks alternatif otomatis berlabel |
| P03-V5 | Laporkan, blokir, dan bisukan tercapai ≤ 2 aksi dari PostCard dan ProfileHeader |
| P03-V6 | Item bersponsor berlabel teks di bagian atas; tidak memakai warna status |
| P03-V7 | ContentWarning menampilkan alasan dan tombol tampilkan; preferensi per kategori tersimpan |
| P03-V8 | Setiap angka yang diringkas punya nilai lengkap yang terbaca; setiap waktu relatif punya elemen `time` dengan nilai ISO |
| P03-V9 | `wcag22.json` memperbarui SC 1.2.1-1.2.5 sesuai P03.8 butir 2 (tidak N/A bila ada video atau audio); `dense-console` tidak dipakai tanpa ADR |

## P03.8 Override engine

Hanya butir berikut yang mengganti default engine; aturan lain di pack ini memperketat.

1. §6.5 (aturan daftar panjang di kontrak Table): gulir tak berujung diizinkan **hanya** di komponen Feed dengan semua syarat P03-R1. Daftar lain tetap memakai paginasi atau "Muat lagi".
2. §9.2: bila `content_types` memuat `video`, `audio`, atau `live`, status SC 1.2.1-1.2.5 tidak lagi N/A. Konten buatan platform: `Applied` dengan bukti di VideoPlayer dan AudioPlayer. Konten buatan pengguna: `Open decision` dengan `A-nn` (kebijakan takarir dan transkrip). SC 1.2.4 (takarir siaran langsung): `Open decision` bila `live`.
3. §4.6: veto `dense-console` untuk surface `consumer`, `content`, dan `public` (P03-R14).
