<!-- ds-module id="M04" name="lifecycle" engine="1.9.0" sections="§7" -->
# Modul M04 · Semantic state dan lifecycle

> Bagian dari Universal Design System Generator, engine `1.9.0`. Berisi §7. Dimuat di fase: 5. Core menang bila bertentangan; modul ini hanya merinci.

---

# 7. SEMANTIC STATE DAN LIFECYCLE `[ENGINE]` + `[BRIEF]`

Dokumen 20. Status adalah data, bukan hiasan: tulis `lifecycle.json` dulu, baru render ke HTML.

## 7.1 Prosedur

1. Untuk setiap entitas di B5: ambil state dari brief; bila tidak ada, turunkan state minimum (mis. draft → aktif → selesai/dibatalkan/gagal) dan catat `A-nn`.
2. Klasifikasikan setiap state ke kelas **C1-C6** (§4.4) memakai pertanyaan berurutan: Apakah perlu tindakan sekarang dan sudah terlambat/gagal (C1)? Perlu seseorang bertindak (C2)? Akhir siklus: negatif sah (C3) atau berhasil (C4)? Sedang diproses pihak lain (C5)? Selain itu (C6).
3. Terapkan perlakuan visual dari L3 (quiet / outline / tinted / filled) dan ikon terkunci (§5.7).
4. Event kritis (I5) tidak dipetakan ke badge: definisikan perlakuan khususnya (overlay, suara, getar, aksi penutup) di doc 20 dan di komponen terkait.
5. Tambahkan **overlay stagnasi** (C2 di atas state apa pun) hanya bila B5 `stagnation_threshold` entitas itu terisi. Ambang adalah kebijakan organisasi: bila journey menyiratkan batas waktu tetapi ambang kosong, catat `A-nn` dan jangan mengarang angka.

## 7.2 Format keluaran

Satu tabel per entitas, kolom: **State · Kelas (C1-C6) · Token · Ikon · Perlakuan (dari L3) · Teks UI (setiap locale) · Siapa yang melihat · Aksi berikutnya**. Setiap sel terisi; tidak ada sel "-" tanpa alasan.

## 7.3 Pola lifecycle umum (dipakai bila entitas serupa ada di brief)

| Pola entitas | Pemetaan awal |
|---|---|
| Pesanan / permintaan | diterima, diproses, dalam perjalanan → C5 · selesai → C4 · melewati SLA → C2 · dibatalkan → C3 |
| Pembayaran | menunggu → C5 · berhasil → C4 · gagal → C1 · kedaluwarsa, dikembalikan → C3 |
| Persetujuan | menunggu persetujuan (pandangan approver) → C2 · disetujui → C4 · ditolak → C3 |
| Perangkat / koneksi | online, live → C6 · menyambung ulang → C5 · basi → C2 · offline saat tugas berjalan → C1 · terkunci → C3 |
| Impor / batch | valid → C4 · gagal → C1 · dilewati → C3 |
| Entri yang tersimpan lokal | belum sinkron → C5 (ikon info, "Not synced") · terkonfirmasi → tanpa penanda · konflik → C2 · ditolak → C1 |

Ini seed netral; hanya dipakai bila entitasnya ada di brief.
