<!-- ds-module id="M09" name="content" engine="1.9.0" sections="§12" -->
# Modul M09 · Konten, error, loading, lokalisasi, glosarium

> Bagian dari Universal Design System Generator, engine `1.9.0`. Berisi §12. Dimuat di fase: 4, 8. Core menang bila bertentangan; modul ini hanya merinci.

---

# 12. KONTEN, ERROR, DAN LOADING `[ENGINE]` + `[LANGUAGE]`

Dokumen 70. Nada dan contoh berasal dari L11; struktur di bawah tetap.

## 12.1 Aturan penulisan (default engine, dapat diperketat L11)

- Tombol memakai kata kerja aktif yang spesifik ("Approve request", bukan "Submit"). Kata kerja yang sama dari tombol sampai toast ("Publish" → "Published").
- Error mengatakan apa yang salah dan cara memperbaikinya, dalam suara sistem; tidak pernah menyalahkan pengguna atau memakai "Oops".
- Empty state spesifik; CTA hanya bila aksinya valid.
- Aturan huruf kapital, format angka, tanggal, mata uang, dan zona waktu dari B1 `formats` dan L11.
- Setiap string UI contoh disediakan untuk **setiap `ui_locale`**; layout diuji dengan locale terpanjang.

## 12.2 Taksonomi error

| Tipe | Kapan | Ditampilkan sebagai |
|---|---|---|
| Validation | input salah atau kosong | inline di bawah field: border critical, teks `critical-strong`, ikon |
| Policy | aturan bisnis tidak terpenuhi | InlineAlert C2 di atas form berisi aturan dan saran |
| System | server gagal | InlineAlert C1 di atas konten dengan Retry (bukan toast) |
| Permission | RBAC menolak | dicegah lebih dulu: hidden atau disabled dengan alasan |
| Offline | koneksi hilang | InlineAlert C2 persisten; aksi antre dan menampilkan "Will send when online" **bila pattern OfflineSync dipilih**; selain itu aksi yang butuh server diblokir dengan alasan "butuh koneksi" |
| Forbidden | tautan langsung ke sumber yang tidak boleh diakses role | EmptyState varian restricted: apa yang tidak bisa diakses, mengapa, dan cara meminta akses (PermissionRequest bila dipilih); tidak membocorkan isi |
| Not found | item terhapus atau hilang | empty state penuh dengan jalan kembali |

## 12.3 Loading dan asinkron

- Skeleton yang meniru tata letak asli untuk muat pertama daftar dan tabel.
- Spinner hanya di dalam kontrol kecil untuk aksi di bawah 2 detik.
- Progress determinate untuk impor dan pembuatan laporan.
- Optimistic UI dengan rollback untuk aksi sering dan dapat dibalik; bila gagal, rollback disertai toast singkat yang menjelaskan apa yang dibatalkan.
- Bila ada surface offline-first (B3/B4): pekerjaan berlanjut, jumlah outbox terlihat, dan **tidak ada yang ditampilkan sebagai terkonfirmasi sebelum server mengonfirmasi** (I6).

## 12.4 Lokalisasi dan arah tulisan

- **Arah:** locale dengan aksara Arab, Ibrani, Thaana, atau Suryani (mis. `ar`, `he`, `fa`, `ur`, `ps`, `dv`) adalah RTL. Komponen hanya memakai properti logis (`margin-inline-start`, `inset-inline-end`, `text-align: start`); properti fisik (`left`, `right`, `margin-left`) dilarang di komponen (V6). Native: `Directionality`/`EdgeInsetsDirectional` (Flutter), leading/trailing (SwiftUI), start/end (Compose).
- **Ikon berarah** (panah, chevron, kembali, maju, indentasi, arah progress dan slider) dicerminkan di RTL; jam, centang, logo, angka, dan kontrol media tidak dicerminkan. Daftar dicatat per ikon di `components.json`.
- **Isi campuran:** angka, kode, dan identifier diisolasi (`bdi` atau `unicode-bidi: isolate`) dan tetap LTR; konten buatan pengguna memakai `dir="auto"`.
- **Aksara di luar cakupan font:** bila sebuah `ui_locale` memakai aksara yang tidak didukung keluarga L4, tambahkan Noto Sans atau Noto Serif untuk aksara itu (OFL, di-bundle) ke fallback. Aksara bertumpuk atau tinggi (Thai, Lao, Khmer, Myanmar, Devanagari, Bengali, Arab) memakai rasio tinggi baris +0.15. CJK: rasio body minimal 1.6, tanpa tracking negatif, tanpa italic. Lantai 16 tetap berlaku.
- **Format pesan:** semua string UI ditulis sebagai ICU MessageFormat (plural menurut kategori CLDR, `select` untuk varian); angka, tanggal, mata uang, dan urutan sortir memakai formatter locale, bukan penggabungan string. Uji pseudo-lokalisasi: +40% panjang dan karakter beraksen.
- **Konvensi lokal:** hari pertama minggu, format nama, alamat, dan telepon dari B1 `formats`.

## 12.5 Glosarium

`assets/glossary.json` adalah sumber tunggal istilah UI. Isinya: setiap entitas, state, role, dan aksi dari brief, ditambah label komponen bawaan (mis. "Batal", "Simpan", "Muat lagi"), dengan label per `ui_locale`, definisi satu kalimat, dan sinonim yang dilarang. Sumber: B1 `glossary_seed` (menang), brief B2 dan B5, aturan kata kerja L11. Istilah yang diturunkan generator dicatat `A-nn`. Teks UI di `lifecycle.json`, `components.json`, dan `patterns.json` hanya memakai label glosarium (V3); sinonim terlarang tidak boleh muncul di mana pun.
