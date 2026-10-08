<!-- ds-pack id="P01" name="b2b-ops" version="1.1.0" engine_min="1.8.0" phases="0, 0B, 3, 4, 8, 11, 12, 14" -->
# Pack P01 · Operasi B2B (back-office, SaaS, admin, alat internal)

> Pack opsional untuk Universal Design System Generator, engine `1.6.0` atau lebih baru dengan major yang sama. Dipilih lewat B7 `component_packs: [P01-b2b-ops]`. Baseline, invarian, dan brief eksplisit menang atas pack ini (§0). Pack ini memperketat aturan engine, menambah 19 komponen dan 14 pattern, dan hanya mengganti default engine pada butir di P01.8.

---

## P01.1 Lingkup

- **Untuk:** alat kerja yang dipakai berulang oleh staf atau pelanggan bisnis: back-office, konsol admin SaaS, ERP ringan, operasi gudang dan lapangan, CRM, helpdesk, penjadwalan sumber daya, back-office instansi pemerintah.
- **Bukan untuk:** aplikasi konsumen (P02, P03) dan layanan publik untuk warga (P04).
- **Cakupan surface:** aturan P01 berlaku untuk surface dengan `surface_type: operational`. Pack ini bisa dipilih bersama P04 pada proyek yang sama: P04 untuk surface `public`, P01 untuk surface `operational`. Komponen P01 di surface lain ditulis "tidak dipakai" di tabel §8.4.
- **Kompatibilitas** (§0 aturan 6): kompatibel dengan P02, P03, dan P04 karena cakupan surface-nya berbeda.

## P01.2 Konfigurasi (`pack_config.P01` di B7)

| Field | Isi | Bila kosong |
|---|---|---|
| `multi_tenant` | `none` · `org_switch` (satu pengguna di beberapa organisasi) · `tenant_isolated` | `none` |
| `approval_levels` | jumlah tingkat persetujuan atau daftar tingkatnya | `0` (ApprovalChain tidak dipilih) |
| `audit_required` | `true` bila perubahan data wajib tercatat | `A-nn`; diperlakukan `true` untuk entitas finansial atau hukum di B5 |
| `audit_retention` | masa simpan log | `A-nn` |
| `scheduling` | `none` · `resource` · `shift` · `appointment` | `none` |
| `hierarchies` | daftar struktur bertingkat, mis. "zona > rak > bin" | kosong (TreeTable tidak dipilih) |
| `boards` | `true` bila ada alur kerja berbentuk kolom | `false` |
| `reporting` | `none` · `fixed` · `builder` | `fixed` bila B5 `data_viz_needs` terisi, selain itu `none` |
| `collaboration` | subset `comments`, `mentions`, `presence` | kosong |
| `keyboard_power_users` | `true` bila pengguna bekerja seharian di sistem | `true` untuk archetype `dense-console`, selain itu `false` |
| `large_lists` | ambang baris yang dianggap besar, mis. "5.000" | `A-nn`; usulan 1.000 baris |
| `bulk_job_threshold` | jumlah item yang membuat aksi massal menjadi job latar | `A-nn`; usulan 100 item |
| `time_zones` | `single` · `multi` | `single` |
| `spreadsheet_editing` | `true` bila pengguna mengedit banyak sel seperti spreadsheet | `false` |

## P01.3 Aturan domain

| ID | Aturan |
|---|---|
| P01-R1 | **Padat tanpa mengecilkan huruf.** Mode `compact` boleh menjadi default di surface pointer bila ada di `density_modes`; teks tetap ≥ 16 (STD-2, I8) dan `compact` tidak pernah aktif di sentuh (STD-4). |
| P01-R2 | **Keyboard-first** bila `keyboard_power_users: true`: CommandPalette wajib; setiap aksi primer di layar kerja punya pintasan bermodifier; ShortcutHelp dibuka dengan Ctrl/⌘ + `/`; pintasan tidak memakai kombinasi yang dicadangkan browser, OS, atau pembaca layar; pintasan satu huruf hanya aktif saat widget-nya fokus atau bisa dimatikan (SC 2.1.4). |
| P01-R3 | **Tampilan tersimpan.** Filter, urutan, kolom yang tampil, dan kepadatan per pengguna disimpan; keadaan filter dan urutan tercermin di URL agar bisa dibagikan; satu tampilan default per role. |
| P01-R4 | **Aksi massal dan proses panjang.** Aksi pada item di atas `bulk_job_threshold` atau proses > 5 detik berjalan sebagai job latar: progress terlihat (JobStatus), bisa dibatalkan bila aman, hasil dilaporkan per item (berhasil C4, gagal C1, dilewati C3), UI tidak terkunci. |
| P01-R5 | **Jejak audit.** Bila `audit_required`, setiap buat, ubah, hapus, setujui, dan tolak pada entitas yang diaudit menghasilkan entri: pelaku, waktu dengan zona, aksi, nilai sebelum dan sesudah (DiffView). Detail objek menampilkan siapa dan kapan terakhir mengubah. AuditLog hanya baca. |
| P01-R6 | **Penyuntingan bersamaan.** Bila objek berubah oleh orang lain sejak dibuka, simpan menampilkan konflik (C2) dengan DiffView dan pilihan penyelesaian; tidak pernah menimpa diam-diam (I6). |
| P01-R7 | **Zona waktu.** Bila `time_zones: multi`, setiap stempel waktu menyebut zona atau menampilkan waktu absolut berzona saat hover dan fokus; penjadwalan memakai zona lokasi sumber daya, bukan zona perangkat. |
| P01-R8 | **Izin sampai tingkat field.** Selain pola §10, field bisa hidden, read-only, atau disabled-with-reason per role; aksi yang tidak diizinkan menawarkan jalur "minta akses" bila brief menyebutnya. |
| P01-R9 | **Kejelasan tenant.** Bila `multi_tenant` bukan `none`: organisasi aktif selalu terlihat di global bar; berganti organisasi mereset konteks dan meminta konfirmasi bila ada perubahan belum tersimpan; daftar lintas organisasi selalu punya kolom organisasi; warna tenant (sumbu brand §5.9) tidak pernah dipakai sebagai status. |
| P01-R10 | **Ekspor.** Setiap tabel dapat diekspor (CSV atau XLSX) sesuai filter dan izin yang aktif; ekspor di atas `bulk_job_threshold` berjalan sebagai job (P01-R4). |
| P01-R11 | **Draf otomatis.** Form dengan lebih dari 10 field atau lebih dari satu layar menyimpan draf otomatis dengan indikator "Menyimpan…" (C5) lalu "Tersimpan" (C6); kebijakan masa simpan draf `A-nn`. |
| P01-R12 | **Daftar besar.** Daftar di atas `large_lists` memakai paginasi server atau virtualisasi (`aria-rowcount`, `aria-rowindex`); filter dan sort dijalankan di server; skeleton baris saat memuat. |
| P01-R13 | **Bahasa desain.** Veto default untuk surface operasional: `playful-vivid` dan `immersive-glass` (hanya dibuka lewat brief eksplisit + ADR). Rekomendasi: `ink-graphite`, `dense-console`, atau `brand-led-tonal` untuk konsol admin SaaS yang dilihat pelanggan. |

## P01.4 Komponen (19)

R wajib bila pack dipilih dan kondisinya terpenuhi; S dipilih bila kondisinya terpenuhi atau tidak dikecualikan; O dipilih bila brief memerlukannya. Setiap komponen diperluas ke 18 seksi §6.3.

| Komponen | Tingkat | Kontrak minimum |
|---|---|---|
| BulkActionBar | R | Muncul saat ada item terpilih, sticky tanpa menggeser layout dan tanpa menutup fokus (SC 2.4.11); menyebut jumlah terpilih (diumumkan polite); aksi destruktif memakai DestructiveAction; dipakai oleh Table, TreeTable, Board, dan List. |
| JobStatus | R | Daftar job latar dengan nama, progress determinate, waktu mulai, aksi batal bila aman, dan ringkasan hasil per item; bisa dibuka dari global bar; selesai diumumkan polite, gagal lewat NotificationItem dan InlineAlert C1. |
| TreeTable | R bila `hierarchies` terisi | Tabel dengan baris bertingkat: `role="treegrid"`, `aria-level`, `aria-expanded`; panah kanan/kiri membuka dan menutup; agregat induk diberi label jelas; seleksi induk memilih anak hanya bila dinyatakan; di bawah `bp-tablet` menjadi drill-down per tingkat. |
| Board | R bila `boards: true` | Kolom state dengan kartu; setiap pemindahan punya alternatif Menu "Pindahkan ke…" dan keyboard (ambil dengan Space, pindah dengan panah, lepas dengan Space, batal dengan Esc), diumumkan polite (UB7); batas WIP per kolom ditampilkan bila brief menyebutnya; kolom memakai kelas C dari `lifecycle.json`; di ponsel menjadi daftar per kolom dengan SegmentedControl. |
| Scheduler | R bila `scheduling` bukan `none` | Tampilan hari, minggu, dan sumber daya; slot dan acara bisa dibuat lewat form, bukan hanya drag; bentrok jadwal C2 dengan penjelasan; acara berulang punya pilihan "ini saja" atau "semua"; zona waktu sesuai P01-R7; alternatif daftar (agenda) yang bisa dibaca pembaca layar. |
| TenantSwitcher | R bila `multi_tenant` bukan `none` | Di global bar; menampilkan nama organisasi aktif (bukan hanya logo); daftar organisasi bisa dicari; berganti mengikuti P01-R9. |
| DiffView | R bila `audit_required` | Perbandingan nilai sebelum dan sesudah per field: perbedaan ditandai teks ("dihapus", "ditambah") dan penanda non-warna, bukan hanya merah-hijau (I2); mode berdampingan di desktop, bertumpuk di ponsel. |
| ShortcutHelp | R bila `keyboard_power_users: true` | Dialog daftar pintasan per konteks, dibuka Ctrl/⌘ + `/`; simbol tombol memakai Kbd sesuai OS; bisa dicari; menyebut cara mematikan atau mengganti pintasan. |
| QueryBuilder | S | Filter lanjutan dengan grup DAN/ATAU, field, operator, dan nilai; hasil ditulis ulang sebagai kalimat yang bisa dibaca ("Status adalah Gagal dan dibuat setelah 1 Okt"); bisa disimpan sebagai tampilan; dapat dioperasikan penuh dengan keyboard. |
| SavedViews | S | Pemilih tampilan tersimpan (pribadi, tim, default role); tampilan yang diubah ditandai "belum disimpan"; bisa dibagikan lewat URL (P01-R3). |
| MetricTile | S | Angka utama (token tampilan angka, tabular), label, periode, perbandingan dengan periode sebelumnya sebagai teks dan ikon arah (bukan hanya warna), kesegaran data (I6); bisa diklik menuju daftar yang sudah tersaring. |
| CommentThread | S bila `collaboration` memuat `comments` | Komentar berurutan dengan pelaku dan waktu; mention dengan Combobox; perubahan baru diumumkan polite; komentar yang diedit atau dihapus tetap terlihat jejaknya bila `audit_required`. |
| PresenceIndicator | S bila `collaboration` memuat `presence` | Avatar orang lain yang sedang membuka objek yang sama dengan nama (bukan hanya foto); jumlah lebih dari 3 diringkas "+n" dengan daftar lengkap di Popover. |
| DataGrid | O bila `spreadsheet_editing: true` | Sel bisa dinavigasi dengan panah, diedit dengan Enter atau mulai mengetik, Esc membatalkan; salin dan tempel rentang sel; validasi per sel; perubahan belum tersimpan ditandai per sel dan diringkas; `role="grid"`. |
| SplitPane | O | Dua panel yang bisa diubah ukurannya dengan pemisah ber-`role="separator"` yang bisa digeser dengan keyboard; ukuran diingat per pengguna; runtuh menjadi satu panel di bawah `bp-desktop`. |
| TransferList | O | Dua daftar (tersedia dan terpilih) dengan pencarian, tombol pindah berlabel, pindah semua, dan jumlah di tiap sisi; tidak bergantung pada drag. |
| RichTextEditor | O | Toolbar dengan tombol berlabel dan pintasan standar; struktur semantik (heading, daftar, tautan) bukan gaya visual saja; hasil disimpan dalam format yang disebut brief (`A-nn` bila kosong); tempel dari luar dibersihkan. |
| CodeViewer | O | Blok kode atau JSON dengan font mono, nomor baris yang tidak ikut tersalin, lipat untuk JSON, CopyButton, dan gulir horizontal di dalam wadahnya (SC 1.4.10 pengecualian). |
| Gantt | O | Bar tugas pada sumbu waktu dengan dependensi; setiap perubahan tanggal punya form alternatif; tabel tugas sebagai alternatif yang bisa dibaca pembaca layar. |

## P01.5 Pattern (14)

Setiap pattern diperluas ke 10 seksi §11.3.

| Pattern | Tingkat | Kontrak minimum |
|---|---|---|
| BackgroundJobs | R | Mulai job, lihat progress di JobStatus, notifikasi saat selesai, laporan hasil per item, coba lagi untuk item gagal saja. |
| SavedViewsAndFilters | R | QueryBuilder + SavedViews + FilterChip; tampilan default per role; status filter di URL. |
| ApprovalChain | R bila `approval_levels` > 0 | Ajukan → setiap tingkat menyetujui, menolak, atau mengembalikan untuk perbaikan (C2) dengan alasan wajib; delegasi saat penyetuju tidak ada; overlay stagnasi memakai `stagnation_threshold` (§7.1); pengaju tidak bisa menyetujui pengajuannya sendiri kecuali brief menyatakan lain (`A-nn`); setiap keputusan tercatat di audit. |
| AuditLog | R bila `audit_required` | Log hanya baca dengan filter pelaku, objek, aksi, dan rentang waktu; DiffView per entri; ekspor; masa simpan dari `audit_retention`. |
| PermissionManagement | R bila B2 punya lebih dari 2 role atau role bisa dibuat pengguna | Daftar role; matriks role × izin (Table dengan Checkbox berkelompok); izin tingkat field; pratinjau "lihat sebagai role"; perubahan tercatat di audit; tidak bisa menghapus admin terakhir. |
| Dashboard | S | **Memperluas pattern dasar Dashboard (engine 1.8.0)**: bila P01 dipilih, kontraknya = kontrak dasar ditambah butir ini. Kumpulan MetricTile dan Chart; setiap angka punya kesegaran data dan bisa ditelusuri ke daftar tersaring; jumlah tile per layar dibatasi (usulan 8, `A-nn`); ekspor dan cetak. |
| ReportExport | S bila `reporting` bukan `none` | `fixed`: daftar laporan dengan parameter dan unduhan; `builder`: pilih dimensi dan metrik, pratinjau, simpan. Laporan besar berjalan sebagai job. Penjadwalan laporan otomatis hanya bila brief menyebutnya. |
| TenantSwitching | S bila `multi_tenant` bukan `none` | TenantSwitcher + aturan P01-R9; tautan ke objek di organisasi lain meminta pindah organisasi lebih dulu. |
| AdminSetupChecklist | S | Daftar langkah persiapan organisasi baru dengan status dan tautan langsung; bisa disembunyikan setelah selesai. |
| ConflictResolution | S | P01-R6: tampilkan perubahan orang lain dengan DiffView; pilihan simpan versi saya, pakai versi mereka, atau gabungkan per field. |
| UserLifecycle | S | Undang (dengan status menunggu dan kirim ulang), ubah role, nonaktifkan (bukan hapus bila `audit_required`), alihkan kepemilikan objek sebelum menonaktifkan. |
| Scheduling | O bila `scheduling` bukan `none` | Scheduler + form buat/ubah; deteksi bentrok; berulang; pembatalan dengan alasan; zona waktu P01-R7. |
| DataImportMapping | O bila ada impor | Perluasan ImportExport core: pemetaan kolom file ke field, pratinjau, validasi per baris, uji coba tanpa menyimpan (dry run), lalu impor sebagai job. |
| SplitViewWorkspace | O | Daftar dan detail berdampingan dengan SplitPane; pilihan item tetap saat daftar disaring; navigasi atas/bawah antar item dari panel detail. |

## P01.6 Glosarium awal

Usulan label (`source: derived`). `glossary_seed` di brief dan nada L11 menang.

| ID istilah | `id-ID` | `en-US` |
|---|---|---|
| `view.save` | Simpan tampilan | Save view |
| `selection.count` | {n} dipilih | {n} selected |
| `approval.approve` | Setujui | Approve |
| `approval.reject` | Tolak | Reject |
| `approval.return` | Kembalikan untuk perbaikan | Return for changes |
| `audit.history` | Riwayat perubahan | Change history |
| `job.running` | Sedang diproses | In progress |
| `tenant.switch` | Ganti organisasi | Switch organization |
| `permission.view_as` | Lihat sebagai | View as |
| `draft.saving` | Menyimpan… | Saving… |
| `draft.saved` | Tersimpan | Saved |

`{n}` ditulis dengan ICU MessageFormat plural (§12.4).

## P01.7 Validasi (dijalankan V22)

| ID | Lulus bila |
|---|---|
| P01-V1 | Setiap daftar yang bisa melebihi `large_lists` menyatakan paginasi server atau virtualisasi; status filter dan sort ada di URL pada reference web |
| P01-V2 | Setiap aksi massal yang bisa melebihi `bulk_job_threshold` memakai BackgroundJobs; tidak ada spinner pemblokir lebih dari 2 detik di preview |
| P01-V3 | Bila `keyboard_power_users`: setiap pintasan bermodifier atau terbatas pada widget yang fokus; tidak ada bentrok dengan daftar kombinasi yang dicadangkan (ditulis di dokumen 40); ShortcutHelp memuat semua pintasan |
| P01-V4 | Bila `audit_required`: setiap aksi yang mengubah data di `components.json` dan `patterns.json` punya catatan audit; DiffView dipakai di AuditLog dan ConflictResolution |
| P01-V5 | Setiap form pada entitas yang bisa disunting bersamaan punya preview state konflik |
| P01-V6 | Board, Scheduler, dan Gantt: setiap perpindahan punya alternatif Menu atau form dan keyboard; tes interaksi lulus |
| P01-V7 | Bila `multi_tenant` bukan `none`: organisasi aktif terlihat di global bar di semua preview; daftar lintas organisasi punya kolom organisasi; berganti organisasi dengan perubahan belum tersimpan meminta konfirmasi |
| P01-V8 | Bila `time_zones: multi`: setiap stempel waktu di preview menyebut zona atau punya waktu absolut berzona di hover dan fokus |
| P01-V9 | Preview form menunjukkan state field hidden, read-only, dan disabled-with-reason per role; archetype yang diveto P01-R13 tidak dipakai di surface operasional tanpa ADR |

## P01.8 Override engine

Hanya butir berikut yang mengganti default engine; aturan lain di pack ini memperketat.

1. §4.6: veto archetype untuk surface operasional (P01-R13).

Catatan: P01-R1 tidak mengganti default engine; urutan `density_modes` di B3 tetap menentukan kepadatan default (§5.9).
