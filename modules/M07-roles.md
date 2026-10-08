<!-- ds-module id="M07" name="roles" engine="1.8.0" sections="§10" -->
# Modul M07 · Role, permission, dan coverage

> Bagian dari Universal Design System Generator, engine `1.8.0`. Berisi §10. Dimuat di fase: 4, 7. Core menang bila bertentangan; modul ini hanya merinci.

---

# 10. ROLE, PERMISSION, DAN COVERAGE `[ENGINE]` + `[BRIEF]`

Dokumen 50. **Izin berasal dari server; UI hanya mencerminkannya.**

## 10.1 Empat pola

| Pola | Kapan | Contoh generik |
|---|---|---|
| Hidden entirely | role tidak boleh tahu fitur itu ada | role operasional tidak melihat menu keuangan |
| Disabled with a reason | objek terlihat, aksi tidak diizinkan sekarang | "Publish" nonaktif dengan alasan "2 prasyarat belum terpenuhi" |
| Step-up authorization | boleh bila ada otorisasi tambahan (supervisor, PIN, kode) | membatalkan transaksi, menyetujui pengembalian dana |
| Read-only | detail penuh tanpa edit | pihak manajemen melihat data operasional |

Aturan: nama role tampil sebagai chip netral, tidak pernah memakai warna semantik atau interaksi (I1). Bila brief mendeklarasikan event kritis, **kritis tidak pernah dibatasi izin** (I5): setiap role yang relevan melihatnya.

## 10.2 Matriks coverage (dibangun dari B2, B3, B5)

Prinsip: **role menentukan data dan aksi; state menentukan label atau badge; breakpoint menentukan layout.** Untuk setiap entitas utama yang punya aksi berbeda antar role, bangun satu matriks: **baris = role, kolom = state penting (kelas C), sel = perilaku per kelas perangkat** (hidden / disabled + alasan / step-up / read-only / aksi penuh, plus perbedaan layout). Minimal tiga matriks: satu untuk entitas yang paling banyak role-nya, satu untuk entitas finansial atau berisiko (bila ada), satu untuk entitas yang dilihat pihak eksternal tanpa akun (bila ada).
