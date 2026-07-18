# PT Prima Larvae — Panel Hatchery

Prototype panel monitoring hatchery udang (frontend **HTML/CSS/JS**, tanpa framework build).
Backend **Laravel** menyusul; seluruh akses data dilewatkan satu lapisan (`js/api.js`) agar
mudah ditukar dari `localStorage` ke REST API.

## Fitur

- **Pemantauan 13 kategori parameter** hatchery (induk, air, larva, panen, hasil tambak) dengan
  **peringatan dini** otomatis (NH3 terhitung, komposisi Vibrio, survival).
- **Login per-akun** & **pemisahan peran** — Petugas/Piket, Ka.Sie/PJ, Kabag Produksi, MPM/QA,
  Admin — dengan pelingkupan per bagian (Maturasi, Larva, Panen).
- **Alur pengesahan** sesuai form lapangan: `Draft → Disahkan → Diperiksa`.
- **Asisten AI** (placeholder; integrasi model asli via proxy Laravel `POST /api/assistant`).
- UI biru sesuai brand, kartu responsif (tanpa scroll horizontal), form & detail via drawer.

## Menjalankan lokal

Gunakan static server (ES modules butuh `http://`, bukan `file://`):

```bash
python -m http.server 8000
# buka http://localhost:8000
```

## Demo

- **Live:** https://jovialmisael.github.io/PT-Prima-Larvae-Website-Panel/
- **Akun demo** (kata sandi: `prima123`): `dwi` (Kabag Produksi), `bayu` (MPM/QA),
  `kasie.larva`, `petugas.larva`, `admin`.

## Catatan

Skala prototype untuk pengujian. Data tersimpan di `localStorage`; otorisasi & login masih
**disimulasikan di sisi klien** dan akan ditegakkan backend Laravel (policy/middleware).
