# Engine findings

Setiap run engine menulis `reports/engine-findings.md` (R19). Pemelihara engine memindahkan temuan ke sini, menetapkan status, dan menutupnya lewat rilis engine. Temuan yang sudah diperbaiki tetap tercatat agar regresi bisa ditelusuri.

- Format: `TEMPLATE.md`.
- Daftar: `findings-1.8.0.md` (ditutup atau dibuka di rilis 1.8.0).
- Regresi: setiap temuan yang diperbaiki sebaiknya punya asersi di `fixtures/*/expect.json`.
