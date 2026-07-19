# PT Prima Larvae — Panel Hatchery

Prototype panel monitoring hatchery udang (frontend **HTML/CSS/JS**, tanpa framework build).
Backend **Laravel** menyusul; seluruh akses data dilewatkan satu lapisan (`js/api.js`) agar
mudah ditukar dari `localStorage` ke REST API.

## Fitur

- **Pemantauan 13 kategori parameter** hatchery (induk, air, larva, panen, hasil tambak) dengan
  **peringatan dini** otomatis (NH3 terhitung, komposisi Vibrio, survival).
- **Login per-akun** & **3 divisi** — **Lab** (standar mutu + analisis), **Produksi** (pencatatan
  SOP operasional), **MPM** (QA/verifikasi), + Admin. Tiap divisi punya Kepala + staf.
- **Alur pengesahan** berjenjang: `Draft (staf) → Disahkan (Kepala divisi) → Diperiksa (MPM)`.
- **Standar Parameter** dikelola Lab; **Temuan & Rekomendasi** Lab tampil ke Produksi.
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
- **Akun demo** (kata sandi: `prima123`): `kepala.lab`, `analis.lab`,
  `kepala.produksi`, `petugas.produksi`, `kepala.mpm`, `admin`.

## Catatan

Skala prototype untuk pengujian. Data tersimpan di `localStorage`; otorisasi & login masih
**disimulasikan di sisi klien** dan akan ditegakkan backend Laravel (policy/middleware).
