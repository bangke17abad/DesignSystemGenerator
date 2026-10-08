<!-- ds-module id="M03" name="components" engine="1.9.1" sections="§6" -->
# Modul M03 · Komponen

> Bagian dari Universal Design System Generator, engine `1.9.1`. Berisi §6. Dimuat di fase: 3, 4, 11, 12. Core menang bila bertentangan; modul ini hanya merinci.

---

# 6. KOMPONEN `[ENGINE]` + `[BRIEF]`

## 6.1 Katalog inti (74 komponen, 3 tingkat)

Setiap komponen di tabel ini punya **record kanonis** di `catalog/components/<Nama>.json` (anatomi, varian, ukuran, state, peta keyboard, ARIA dan API native, konten en-US/id-ID, responsif, edge case, API, petunjuk target) yang lolos `tools/check-catalog.mjs`, dan referensi web di `reference/html-first/` bila tersedia. `compose.mjs` mengubahnya menjadi record `components.json` proyek; run tidak menulis ulang isinya, hanya menambah yang khas proyek. Nama grup di katalog memakai bahasa Inggris: Layout, Accessibility, Actions, Inputs, Navigation, Feedback (= Status dan feedback), Data display, Overlays.


`R` = wajib untuk semua proyek. `S` = standar: disertakan kecuali brief B7 menyatakan tidak berlaku dengan alasan. `O` = opsional: disertakan bila journey, entitas, atau surface di brief memerlukannya (alasan dicatat).

| Grup | R | S | O |
|---|---|---|---|
| Layout | Stack, Inline, Grid, Container, Divider, AppShell, PageHeader | | |
| Utilitas aksesibilitas | SkipLink, VisuallyHidden, LiveAnnouncer | | |
| Actions | Button, Link | IconButton, Menu | CommandPalette (wajib untuk `dense-console` atau bila L1 memuat prinsip keyboard-first), CopyButton |
| Inputs | TextField, TextArea, Select, Checkbox, RadioGroup, Switch, Form, ErrorSummary | DatePicker, FilterChip, Combobox, SearchField, NumberInput, PasswordInput, FormattedInput | FileDropzone, PinInput (wajib bila StepUpDialog dipilih), TimePicker, DateRangePicker, Slider |
| Navigation | PrimaryNav, Tabs | BottomNav (bila ada surface ponsel), SegmentedControl, Breadcrumb, Pagination, Stepper | |
| Status dan feedback | StatusLabel, Badge, InlineAlert, Toast, Skeleton, EmptyState | ProgressBar, ConnectionStatus (bila ada konektivitas tidak stabil atau offline), NotificationItem, Spinner, Banner | CountdownTimer |
| Data display | Table, List, Tooltip | Card, InlineMetrics, Avatar, Tag, DescriptionList, Accordion, Image | Timeline (riwayat/audit), Chart, Kbd, Tree (bila ada data hierarkis) |
| Overlays | Modal | Sheet, ContextPanel, Popover | StepUpDialog (konfirmasi berotorisasi tambahan) |

Jumlah: R 32 · S 29 · O 13 = **74**. Komponen dari pack terpilih (§0) ditambahkan di luar hitungan ini. Primitif layout tidak membawa warna; jarak antar komponen hanya berasal dari primitif layout, bukan margin luar komponen lain. Menu tidak boleh dikecualikan bila ada interaksi drag (alternatif satu-pointer, UB7) atau aksi sekunder per baris. Penamaan `Badge` mengikuti L3 (bila bahasa memberi nama khas, mis. `AttentionBadge`, catat di manifest dan jaga konsisten).

## 6.2 Penemuan komponen domain (Phase 3)

Komponen domain berasal dari brief B7 (daftar eksplisit) dan/atau ditemukan dengan prosedur berikut. **Setiap kandidat harus lolos tiga uji:**

1. **Reuse:** pola dipakai pada ≥ 2 langkah journey atau ≥ 2 surface.
2. **State sendiri:** punya ≥ 3 state atau semantik data khas domain yang tidak bisa diekspresikan sebagai konfigurasi komponen inti.
3. **Semantik aksesibilitas sendiri:** butuh peran, pengumuman, atau interaksi keyboard yang tidak tercakup komposisi komponen inti.

Prosedur: (a) enumerasi langkah journey dan entitas dari B5; (b) daftar pola UI per langkah; (c) petakan ke katalog inti; (d) pola yang hanya komposisi inti **tidak** menjadi komponen: dokumentasikan sebagai *Pattern* di dokumen 60; (e) tulis `reports/domain-components.md`: kandidat, lolos/gagal tiga uji, rujukan journey, keputusan; (f) beri nama PascalCase tanpa prefiks merek, kelompokkan per domain; (g) kandidat yang sama fungsinya dengan komponen pack terpilih memakai komponen pack (§0 aturan 7).

## 6.3 Seksi wajib untuk SETIAP komponen (`{N}` halaman, kedalaman setara)

Setiap `components/<Nama>.html` memuat seksi berikut, **dalam urutan ini**. Seksi yang tidak relevan ditulis "Not applicable" dengan alasan satu kalimat, tidak dihapus.

1. **Purpose dan when not to use.** Satu-dua kalimat, plus kapan komponen lain lebih tepat.
2. **Anatomy.** Bagian dan token tiap bagian (hanya nama token, tidak ada hex).
3. **Variants.**
4. **Sizes.** Dalam px (web) dan dp/pt (native), per kelas perangkat (§8). Setiap ukuran menyebut tinggi visual **dan** area klik (pointer ≥ 24×24, sentuh ≥ 44×44, perluasan modalitas bila ada) serta tombol atau kontrol yang memperluasnya.
5. **States.** Default, hover, focus, pressed, selected, disabled (blocked with reason), loading, error, read-only, empty. Tiap state = penukaran token atau state layer sesuai L16 (I4); kombinasi state mengikuti §6.9.
6. **Behaviour.** Peta keyboard, pointer, touch. Setiap drag punya alternatif satu-pointer **dan** keyboard.
7. **Accessibility.** Role/aria atau API semantik native, politeness, urutan fokus, label pembaca layar, ukuran target (≥ 44×44 di sentuh), dan SC WCAG 2.2 yang disentuh (§9.2).
8. **Content.** Aturan label dan contoh microcopy untuk setiap `ui_locale` (dari L11).
9. **Role dan permission.** Perilaku per role (§10).
10. **Responsive.** Perilaku per kelas perangkat dan per lebar kontainer.
11. **Semantic mapping.** Bila membawa status: tabel state → kelas C → token → ikon → perlakuan (§7).
12. **Do dan Don't.** Minimal 2 masing-masing; Don't yang relevan merujuk ke larangan di §13.
13. **Edge cases.** Minimal: string panjang (+40% untuk locale terpanjang), teks 200%, 0 item, jumlah maksimum, offline, loading, nilai ekstrem.
14. **Token usage.** Tabel bagian → token. Dilarang hex mentah.
15. **API.** Props, event, dan parts sesuai konvensi §6.8: nama, tipe, default, wajib atau tidak, deskripsi.
16. **Target mapping.** Nama widget/komponen, path file, daftar props, dan cara state menukar token, untuk **setiap** target di brief.
17. **Preview.** Iframe ke `previews/<Nama>.html` yang memperlihatkan **semua varian dan state** (termasuk kombinasi wajib §6.9) di semua brand × tema (dipilih lewat pemilih sumbu).
18. **Status kematangan dan asumsi.** `Draft` / `Reviewed` / `Stable` dan rujukan `A-nn`.

## 6.4 Kontrak teknis reference web `[ENGINE]`

- **`primary_web_reference: html-first`** (B4): setiap komponen adalah template HTML semantik + CSS + modul JavaScript opsional yang menempel lewat atribut `data-{ns}-module`. Fungsi inti (tautan, kirim form, Details memakai `<details>`, navigasi, LanguageSelector) bekerja tanpa JavaScript; JavaScript hanya memperkaya (validasi inline, Combobox, penghitung karakter). Komponen yang hakikatnya butuh JavaScript (Combobox, CommandPalette, Tree interaktif, DatePicker kalender) punya fallback HTML yang didokumentasikan (mis. `<select>`, daftar tautan bertingkat, input teks berformat). `window.{NS}` tetap ada untuk menginisialisasi modul. Kontrak props §6.8 menjadi kontrak data template.
- Semua komponen diekspor dari `window.{NS}` (bundle lokal; framework dan DOM library versi ter-pin dan disertakan sebagai file, bukan CDN). Framework dari `primary_web_reference`.
- Props: kontrol mendukung `size`, `disabled`, dan **`reason`** (string). Aksi yang diblokir memakai `aria-disabled="true"` + `reason` yang terlihat, **bukan** atribut `disabled` native, karena pengguna harus tahu mengapa. Karena `aria-disabled` saja tidak memblokir input (engine 1.8.0): field teks yang diblokir memakai `readonly` + `aria-disabled` + alasan; checkbox, radio, dan switch yang diblokir dicegah berubah oleh script dan alasannya terlihat; fallback tanpa JavaScript boleh memakai `disabled` native asalkan alasan tetap tertulis di sebelahnya.
- Prop status hanya menerima `critical | warning | positive | info | neutral-negative`.
- Warna hanya dari `var(--token)`; tidak ada hex di komponen (I3). Teruskan `ref` dan `className`.
- Loading mengunci lebar dan menyetel `aria-busy`.
- Fokus: outline 2px `focus-ring`, offset 2px; inset −2px untuk baris dan item navigasi. Berlaku untuk semua elemen interaktif termasuk baris kustom dan kartu. Di atas `surface-inverse`, fill semantik solid, dan overlay event kritis memakai `focus-ring-inverse`.

## 6.5 Kontrak minimum komponen inti

Perlakuan visual (fill, outline, bentuk, kedalaman) selalu diambil dari bahasa desain (L2-L9); kontrak di bawah hanya perilaku dan aturan yang sama di semua bahasa. Halaman final **memperluasnya penuh** sesuai §6.3.

| Komponen | Kontrak minimum |
|---|---|
| Button | Varian: primer, sekunder, tersier, destruktif. Maksimal satu primer per tampilan. Ukuran dari L5, tunduk pada STD-4. Label berupa kata kerja spesifik (L11). Loading: spinner menggantikan label, lebar terkunci, `aria-busy`. Diblokir: `aria-disabled` + `reason`. Aksi terbatas peran menampilkan ikon gembok. |
| Link | Di dalam teks berjalan selalu punya penanda non-warna (garis bawah); teks menyebut tujuan; tautan eksternal ditandai. |
| TextField / Select / Combobox / DatePicker | Label tampak di atas (≥ 16), helper di bawah, border kontrol ≥ 3:1, penanda "optional". Error = ikon + teks + `aria-describedby`. `autocomplete` untuk data pribadi (SC 1.3.5). Di ponsel, Select dan DatePicker menjadi sheet, bukan popover. DatePicker menjelaskan tanggal yang tidak bisa dipilih. Menu di portal pada `z-popover`. |
| Checkbox / RadioGroup / Switch | Penanda terpilih non-warna (centang, titik, posisi thumb). Indeterminate (`aria-checked="mixed"`) **hanya untuk Checkbox**; role switch dan radio tidak mendukung mixed. Lingkaran radio memakai `shape-circle`. Switch berlaku seketika. Area klik 24×24 pointer, 44×44 sentuh; label bagian dari target. Panah memindahkan fokus di RadioGroup. |
| Form | Judul + deskripsi, ErrorSummary setelah submit gagal, fieldset dengan legend, 1 atau 2 kolom, action bar dengan satu primer (sticky bila panjang). Aturan fokus tunggal (engine 1.8.0): validasi di klien → fokus ke field invalid pertama, ErrorSummary dirender dan jumlah error diumumkan assertive; render ulang dari server (tanpa JavaScript) → ErrorSummary menerima fokus. Switch yang berlaku seketika tidak ditaruh di dalam Form ber-tombol Simpan; ringkasan diumumkan assertive; Esc tidak membuang data tanpa konfirmasi; data yang sudah dimasukkan tidak diminta ulang (SC 3.3.7). |
| FileDropzone / FilterChip | Dropzone: jalur keyboard "Choose file" selalu ada; state idle, dragover, uploading (progress), success, error + alasan. FilterChip: seleksi bertanda non-warna; di ponsel kumpulan filter menjadi "Filter (n)" yang membuka sheet. |
| PrimaryNav / BottomNav / Tabs / SegmentedControl / Breadcrumb / Pagination / Stepper | Terpilih = penanda non-warna + `aria-current`. Nav mengerut ke rail saat ruang tidak cukup. Panah hanya untuk widget komposit (tablist, radiogroup, rail/menubar); Breadcrumb, Pagination, dan Stepper adalah daftar tautan yang dinavigasi dengan Tab. Tab yang banyak menggulir horizontal di ponsel. Stepper: langkah saat ini, lampau, mendatang berbeda secara non-warna; `aria-current="step"`; vertikal di ponsel. |
| StatusLabel / Badge | StatusLabel: ikon status terkunci + teks isi (≥ 16); status netral = teks tanpa ikon. Badge: hanya untuk kelas yang diizinkan fill oleh L3; teks isi ≥ 16; badge kritis baru diumumkan assertive. Dilarang badge untuk metadata biasa bila teks inline cukup. |
| InlineAlert / Toast / NotificationItem | InlineAlert persisten, ikon status, `role="status"` atau `role="alert"` untuk kritis. Toast: maksimal 3, bertahan ≥ 10 detik bila punya aksi, berhenti saat hover/fokus, tidak menutup kontrol utama. NotificationItem: penanda belum dibaca non-warna, dikelompokkan per hari; event kritis tidak pernah hanya sebuah item. |
| ProgressBar / Skeleton / EmptyState | Progress determinate untuk impor dan laporan. Skeleton meniru tata letak asli. EmptyState spesifik (apa yang kosong dan kapan terisi), CTA hanya bila aksinya valid. |
| ConnectionStatus / CountdownTimer | ConnectionStatus: live (tenang), reconnecting (C5), stale (C2, dengan "last updated"), offline (peringatan persisten, pekerjaan antre). `role="status"`. CountdownTimer: ikon jam + angka tabular; di bawah ambang beralih ke C2; `role="timer"`; diumumkan hanya di ambang dan di nol. |
| Table / List / Card / InlineMetrics / Avatar / Tooltip | Table: header jelas, di bawah breakpoint tablet menjadi kartu bertumpuk (label: nilai); kolom sekunder melipat ke baris ekspandabel di tablet; tidak pernah memotong status, harga, atau waktu (nama boleh dipotong dengan ellipsis + tooltip/long-press). Card hanya bila L6 mengizinkan; InlineMetrics maksimal 3. Tooltip tidak pernah satu-satunya tempat info penting; dapat ditutup (Esc), dapat di-hover (SC 1.4.13). |
| Timeline / Chart | Timeline: avatar atau ikon status, kalimat dengan tautan target, alasan, waktu relatif (tepat saat hover; elemen `time` ber-ISO). Chart: palet L10, status = outline + ikon (bukan fill semantik), tabel data sebagai alternatif, label tidak bergantung warna. |
| Modal / Sheet / ContextPanel / StepUpDialog | Modal: fokus terkunci, Esc = Cancel (juga pada konfirmasi destruktif), fokus kembali ke pemicu. Sheet: bottom sheet di ponsel. ContextPanel: docked di desktop (mendorong konten), overlay di tablet (tanpa scrim, Esc menutup), halaman penuh di ponsel. StepUpDialog: menamai aksi dan item, tidak mengandalkan ingatan semata (SC 3.3.8; sediakan paste/autofill atau jalur alternatif; keputusan dicatat `A-nn`). |
| TextArea | Semua aturan TextField. Tinggi tumbuh mengikuti isi sampai batas, lalu bergulir. Penghitung karakter (`type-caption`) diumumkan polite hanya di 80% dan 100% batas. Teks yang sudah diketik tidak pernah dipotong; kelebihan ditandai sebagai error. |
| Menu | Pemicu ber-`aria-haspopup="menu"` dan `aria-expanded`; item `role="menuitem"`. Panah memindahkan fokus, huruf melompat ke item, Esc menutup dan mengembalikan fokus ke pemicu. Item destruktif dipisah divider dan berlabel kata kerja jelas; item terbatas peran memakai ikon gembok atau disembunyikan (§10). Di ponsel menjadi sheet. Area item ≥ 44 di sentuh. Menjadi alternatif satu-pointer untuk setiap drag (UB7). |
| PinInput | Satu field logis bagi pembaca layar (bukan N field terpisah): `autocomplete="one-time-code"`, `inputmode="numeric"`, mendukung paste dan autofill (SC 3.3.8). Tampilan per digit boleh, fokus tetap satu. Error menyebut sisa percobaan bila kebijakannya ada di brief (selain itu `A-nn`). Isi tidak pernah dikosongkan tanpa aksi pengguna. |
| Stack / Inline / Grid / Container / Divider | Stack (vertikal) dan Inline (horizontal, boleh wrap) hanya menerima `gap` dari token `space-*`. Grid mengikuti kolom §8.1 dan lebar kontainer. Container membatasi lebar dengan `layout-content-max` atau `layout-measure` dan margin §8.1. Divider dekoratif disembunyikan dari teknologi bantu; pemisah grup bermakna memakai `role="separator"`. Semua arah memakai properti logis (§12.4). |
| AppShell / PageHeader | AppShell menyusun region §8.2 dengan landmark (`header`, `nav`, `main`, `aside`), SkipLink, dan safe-area inset (§8.3). PageHeader: tepat satu `h1`, breadcrumb bila ada, deskripsi singkat, maks satu aksi primer plus Menu untuk aksi sekunder; sticky hanya bila L17 mengizinkan dan tidak menutup fokus (SC 2.4.11). |
| SearchField / NumberInput | SearchField: `role="searchbox"` di dalam landmark `search` (bila memberi saran, pakai Combobox pola APG di dalam landmark search), tombol hapus berlabel, jumlah hasil diumumkan polite, debounce ≥ 300 ms tanpa memindahkan fokus. NumberInput: `inputmode` sesuai, tombol tambah/kurang dengan area klik ≥ 44 di sentuh, panah atas/bawah mengubah nilai, min/max/step disebut di helper, format lokal (B1) diterapkan saat blur tanpa menghilangkan nilai mentah. |
| TimePicker / DateRangePicker / Slider | TimePicker mengikuti format jam B1 dan selalu menyediakan input ketik. DateRangePicker: dua field berlabel (mulai, selesai) plus kalender; rentang tidak valid dijelaskan. Slider: `role="slider"` dengan `aria-valuetext` bermakna, panah dan Page Up/Down, nilai juga bisa diketik (alternatif drag, SC 2.5.7), thumb dengan area klik ≥ 44 di sentuh. |
| Popover / Accordion / Tag / DescriptionList | Popover non-modal, berlabel, Esc menutup, fokus kembali ke pemicu; bukan pengganti Tooltip dan bukan satu-satunya tempat info penting. Accordion: tombol header ber-`aria-expanded` dan `aria-controls`, level heading benar; panel yang berisi error terbuka otomatis. Tag: metadata netral, tidak pernah status (I1); tombol hapus berlabel dengan area klik ≥ 44 di sentuh. DescriptionList: `dl`/`dt`/`dd`; nilai status, harga, dan waktu tidak dipotong. |
| Spinner / Banner | Spinner hanya untuk tunggu < 2 detik atau di dalam kontrol, ber-`role="status"` dengan teks tersembunyi; lebih dari 2 detik beralih ke Skeleton atau ProgressBar. Banner: pesan tingkat sistem atau halaman (pemeliharaan, mode offline, langganan) di bawah global bar; bertahan sampai kondisinya berubah; dapat ditutup hanya bila bukan C1 atau C2; maks satu banner per tingkat. |
| CommandPalette / Kbd / CopyButton | CommandPalette: dibuka pintasan bermodifier yang bisa diubah, dialog berisi combobox dan listbox, menampilkan pintasan tiap aksi dengan Kbd, menghormati izin (§10). Kbd: elemen `kbd` dengan label terbaca ("Control plus K"); simbol mengikuti OS (L14). CopyButton: mengumumkan keberhasilan secara polite, tidak hanya mengandalkan perubahan ikon, punya pesan bila akses clipboard ditolak. |
| Table (data kompleks) | Sort: header kolom berupa tombol dengan `aria-sort`; satu kolom aktif kecuali brief meminta multi-sort. Seleksi: kolom checkbox dengan "pilih semua" (indeterminate saat sebagian), jumlah terpilih diumumkan, bar aksi massal muncul sticky tanpa menggeser layout dan tanpa menutup fokus. Header dan kolom identitas sticky saat gulir horizontal. Resize kolom punya alternatif keyboard. Virtualisasi memakai `aria-rowcount` dan `aria-rowindex`. Edit inline: Enter masuk, Esc batal, Tab ke sel berikut, error per sel. State: loading (skeleton baris), kosong (EmptyState spesifik), error (InlineAlert C1 + Retry), gagal sebagian (baris bertanda). Paginasi default untuk data operasional; daftar panjang lain memakai tombol "Muat lagi" dengan posisi fokus terjaga, bukan gulir tak berujung otomatis. |
| SkipLink / VisuallyHidden / LiveAnnouncer | SkipLink: elemen fokus pertama di setiap halaman, tampak saat difokus, menuju `main` (dan target lain bila navigasi panjang); target menerima fokus. VisuallyHidden: tersembunyi secara visual tetapi tetap dibaca teknologi bantu (bukan `display: none`); varian `focusable` tampil saat difokus. LiveAnnouncer: satu region polite dan satu assertive per aplikasi, dibuat saat aplikasi dimuat (bukan saat pesan muncul); pesan yang sama berturut-turut tetap diumumkan; assertive hanya untuk C1 dan event kritis; semua pengumuman komponen lain lewat LiveAnnouncer. Native: API pengumuman platform. |
| ErrorSummary | Muncul di atas form setelah submit gagal; judul dari glosarium; daftar error berupa tautan ke field yang memindahkan fokus ke field itu; urutan sama dengan urutan field; menerima fokus saat muncul; judul dokumen diawali penanda error dari glosarium. Tidak dipakai untuk error sistem (itu InlineAlert C1, §12.2). |
| PasswordInput | Tombol tampilkan/sembunyikan berlabel dengan area klik ≥ 44 di sentuh; `autocomplete` `current-password` atau `new-password`; aturan sandi terlihat sebelum mengetik, bukan hanya setelah gagal; paste dan pengelola sandi tidak diblokir (SC 3.3.8); kekuatan sandi tidak hanya warna; kembali tersembunyi saat submit. |
| FormattedInput | Untuk nomor dengan pola tetap (identitas, rekening, telepon, kode pos). Pemisah tampilan tidak ikut terkirim; nilai mentah yang dikirim; paste dengan format apa pun dinormalkan; caret tidak melompat; format dijelaskan di helper dan dibaca pembaca layar; `inputmode` sesuai. Panjang dan pola dari brief; yang tidak ada di brief dicatat `A-nn`. Tidak dipakai untuk tanggal. |
| Image | `alt` wajib; string kosong hanya untuk gambar dekoratif dan ditulis eksplisit. Rasio dari token `aspect-*` agar tidak ada pergeseran layout; `loading="lazy"` di luar viewport awal; tidak ada teks penting di dalam gambar (SC 1.4.5); state loading (skeleton) dan gagal (fallback dengan alt terlihat); keterangan memakai `figure`/`figcaption`. |
| Tree | `role="tree"`/`treeitem` dengan `aria-expanded`, `aria-level`, `aria-setsize`, `aria-posinset`; satu tab stop (roving tabindex); panah kanan/kiri membuka, menutup, dan berpindah ke anak atau induk; atas/bawah antar item terlihat; Home/End; ketik huruf untuk melompat. Seleksi bertanda non-warna. Anak dimuat lazy dengan state loading per node. Indentasi dari token `space-*` dengan properti logis. Di ponsel menjadi navigasi bertingkat (drill-down), bukan pohon menjorok. |

## 6.6 Kontrak komponen domain

Setiap komponen domain (dari B7 atau §6.2) wajib memiliki kontrak minimum dalam format yang sama dengan tabel §6.5 **sebelum** Phase 4, lalu diperluas ke 18 seksi §6.3. Komponen domain yang membawa status, event kritis, atau aksi finansial wajib memetakan state-nya di §7 dan perilaku per role di §10.

## 6.7 Penguncian `{N}`

Di gerbang Phase 3: `{N}` = (komponen inti terpilih) + (komponen domain) + (komponen pack terpilih, §0), dan `{P}` = (pattern dasar terpilih, §11.2) + (pattern domain, §6.2d) + (pattern pack terpilih). Tulis keduanya ke `manifest.json` beserta alasan setiap pengecualian. **Penutupan dependensi (engine 1.8.0):** komponen terpilih menarik setiap komponen di `depends_on` record kanonisnya, walau komponen itu tingkat S yang dikecualikan atau tingkat O; pembatalan pengecualian dicatat dengan alasannya (`compose.mjs`, `reports/scope.md`). Pattern hanya memakai komponen di `{N}`; komponen opsional di luar `{N}` dicatat di `manual_notes` pattern. Setelah itu R6 berlaku untuk keduanya.

## 6.8 Konvensi API komponen

API sama di semua komponen dan semua target (R7). Nama prop ditulis camelCase identik di setiap target; hanya tipe yang mengikuti bahasa target.

| Kebutuhan | Nama baku | Aturan |
|---|---|---|
| Ukuran | `size: "sm" \| "md" \| "lg"` | tidak ada nama lain (`small`, `compact`, `xl`); kepadatan adalah sumbu mode (§5.9), bukan prop |
| Varian visual | `variant` | enum per komponen tercatat di `components.json`; aksi: `primary \| secondary \| tertiary \| destructive` |
| Status | `status` | hanya lima nilai semantik (§6.4) |
| Ketersediaan | `disabled`, `reason`, `loading`, `readOnly` | `reason` wajib bila aksi diblokir; `disabled` hanya untuk komponen yang benar-benar tidak relevan |
| Validasi | `required`, `invalid`, `errorText`, `helperText` | `invalid` tanpa `errorText` ditolak lint |
| Label | `label` (wajib untuk kontrol), `description` | `placeholder` tidak pernah menggantikan `label` |
| Ikon | `iconStart`, `iconEnd`, `icon` (khusus IconButton, wajib bersama `label` untuk nama aksesibel) | ikon hanya dari set L9 |
| Nilai | `value`, `defaultValue`, `onValueChange` | semua kontrol mendukung controlled dan uncontrolled dengan pasangan ini; tidak ada `onChange` khusus per komponen |
| Buka/tutup | `open`, `defaultOpen`, `onOpenChange` | overlay, Menu, Popover, Accordion item, Sheet |
| Seleksi | `selected`, `defaultSelected`, `onSelectedChange` | baris, chip, kartu yang bisa dipilih |
| State boolean lain | `x`, `defaultX`, `onXChange` | pola umum untuk state boolean yang tidak tercakup di atas (mis. `revealed`/`onRevealedChange` di PasswordInput, `expanded`/`onExpandedChange`) |
| Komit | `onValueCommit` | dipicu saat nilai final (lepas thumb Slider, blur NumberInput); `onValueChange` tetap untuk setiap perubahan |
| Aktivasi | `onPress` | dipicu saat pelepasan pointer, Enter, atau Space (SC 2.5.2); reference web memetakannya ke event klik dan keyboard |
| Komposisi | parts bernama `<Komponen>.<Part>` (mis. `Tabs.List`, `Tabs.Tab`, `Tabs.Panel`, `Menu.Trigger`, `Menu.Item`) | komponen multi-bagian memakai parts, bukan prop array yang berisi markup |
| Polimorfisme | `asChild` | hanya Button dan Link (merender aksi sebagai tautan); komponen lain tidak polimorfik |
| Integrasi | `ref`, `className`, `id`, `data-*` | selalu diteruskan ke elemen akar; `style` tidak boleh mengubah warna (lint) |

Token komponen dinamai `{komponen}-{varian?}-{bagian}-{properti}-{state?}` (mis. `button-primary-container-background-hover`, `chip-selected-border`), selalu alias ke token semantik.

## 6.9 Model state interaksi

1. **Lapisan state.** State komponen dibentuk dari empat lapisan yang digabung, bukan daftar datar:
   - **dasar**: default, selected, error;
   - **interaksi**: rest, hover, pressed, dragged;
   - **fokus**: tanpa atau dengan ring;
   - **ketersediaan**: enabled, disabled, loading, read-only.
2. **Prioritas.** Ketersediaan menimpa semuanya; dasar menentukan fill dan penanda; interaksi memodifikasi dasar; ring fokus selalu ditambahkan di luar (tidak menggantikan apa pun).
3. **Strategi dari L16.** `token-swap`: tiap kombinasi dasar × interaksi punya token sendiri (mis. `*-selected-hover`). `state-layer`: lapisan warna konten dengan opasitas `state-layer-*` (hover 0.08, pressed 0.12, selected 0.12, dragged 0.16) ditumpuk di atas fill dasar; kontras komposit diuji (§5.5).
4. **Hover** hanya diterapkan di `(hover: hover)`; tidak ada hover yang "menempel" di sentuh. **Fokus** memakai `:focus-visible`; fokus yang dipindahkan program (setelah dialog, rute baru) juga menampilkan ring.
5. **Read-only** tampil sebagai nilai berteks penuh (kontras penuh, tanpa border kontrol aktif) dengan `aria-readonly`; tidak sama dengan disabled.
6. **Kombinasi wajib** di setiap preview yang relevan: selected + hover, selected + focus, error + focus, disabled + selected, loading + pressed dicegah (tidak bisa ditekan saat loading).
7. Transformasi saat ditekan hanya dari `state-press-transform` (L16); tidak pernah mengubah layout dan menjadi `none` di bawah reduced motion.
