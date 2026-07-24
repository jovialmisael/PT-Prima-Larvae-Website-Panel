# Blueprint: Peran, Alur, & Form — Panel Hatchery PT Prima Larvae

Dokumen acuan (living doc). Sumber: form fisik PrimaLarvae (Form 06/06.A/13/16/23) &
Excel harian tim lab (`Panduan Prototype/PR-Juni-2026.xlsx`, 31 sheet = 1 sheet/tanggal).

## 1. Organisasi & peran

| Divisi | Kabag (pemantau + kontak eskalasi) | Ka.Sie/PJ | Staf pelaksana | QA |
|---|---|---|---|---|
| **Produksi** | Kabag Produksi | Ka.Sie Produksi | Petugas Produksi (±20, diwakili 1 akun) | — |
| **Lab & Algae** | Kabag Lab & Algae | Ka.Sie Lab | Petugas Lab (±20, diwakili 1 akun) | — |
| **MPM/QA** | Kabag MPM | — | — | Petugas QC |
| **Sistem** | — | — | — | Admin |

- **`level`**: `petugas | kasie | kabag | qc | admin`.
- **Hanya petugas yang menginput data.** Ka.Sie, QC, dan Kabag MPM mengesahkan; Kabag divisi
  **memantau & menjadi target eskalasi kontak** (tidak menginput).
- **Standar/batas parameter dimiliki Kabag Lab.**
- Akun demo berbasis peran (bukan nama orang), kata sandi `prima123`: `petugas.produksi`,
  `kasie.produksi`, `kabag.produksi`, `petugas.lab`, `kasie.lab`, `kabag.lab`, `qc`,
  `kabag.mpm`, `admin`.

## 2. Alur (value stream) induk → tambak & pemiliknya

```
Induk/Maturasi ─► Spawner/Pemijahan ─► Nauplii ─► Larvae (Z/M) ─► Post-Larvae ─► Panen ─► Tambak
   Form 06          Form 06.A                        Form 13         Form 16
  (Produksi)      (Produksi+Lab)                  (Produksi+Lab)  (Produksi+Lab)
```
Pendukung: Kultur Algae, Artemia, Probiotik (Form 23), PCR/Kimia (Lab).

**Kasus dasar:** Produksi = orang lapangan, mengukur langsung & **membawa sampel ke Lab**. Lab
menguji sampel (mikro, bakteri, PCR) lalu menetapkan **standar & rekomendasi** ke Produksi.
QC & MPM mengesahkan.

## 3. Katalog form → section per-role

Prinsip: **struktur ikut form asli, input dipisah per role** — tiap role mengisi bagiannya,
lalu digabung menjadi satu form (join pada `formId + tankId + tanggal [+ stadia]`).

| Form | No | Section Lab | Section Produksi |
|---|---|---|---|
| Observasi Bak Larvae | 13 | `labCekLarva`, `labMikro` (MICRO/Mikroskopis) | `prodLarvae` (air harian), `prodAlgae` |
| Observasi Bak Post Larvae | 16 | `labMikroPl` (mikro PL) | `prodPostLarvae` (PL & panen) |
| Kualitas Air Maturasi | 06 | — | `prodInduk` |
| Kualitas Spawner | 06.A | `spawnerNauplii` (nauplii abnormal) | `spawnerKontrol` (suhu palam) |
| Artemia & Kualitas Algae | — | `labAlgae` | `prodArtemia` |
| Persiapan Water | — | — | `prodPersiapanWater` |
| Pemakaian Probiotik & Tindakan | 23 | — | `prodTindakan` |
| PCR & Kimia | — | `labPcrKimia` | — |

Registry di `js/schema.js` (`FORMS`). Pengesahan **diseragamkan 4 langkah** untuk semua form
(Draft → Ka.Sie → QC → MPM) — meski beberapa form fisik melewati QC — demi kesederhanaan prototype.

## 4. Rantai pengesahan (berjenjang)

```
Draft ──► Diparaf Ka.Sie ──► Diparaf QC ──► Disahkan (MPM)
(Petugas)   (Ka.Sie/PJ)       (Petugas QC)   (Kabag MPM)
```
Tiap transisi menyimpan stempel `{ name, role, at }` pada
`dibuatOleh / diparafKasie / diparafQc / disahkanMpm`. Rekaman terkunci dari edit setelah paraf
pertama. *(Beberapa form melewati QC; untuk prototype rantai diseragamkan 4 langkah.)*

## 5. Peran fitur

- **Alert (pengawas 24 jam):** tiap baris dibandingkan ke batas → `aman/waspada/bahaya`, disertai
  **tindakan** yang harus dilakukan & **kontak** (Kabag divisi terkait).
- **AI (analis pendamping):** membaca tabel gabungan + alert, menjelaskan sebab lintas-parameter,
  memberi rekomendasi. **Bersifat saran, bukan otoritas** — pengesahan tetap di QC/MPM.

## 6. Dua prinsip yang dilayani

1. **Tiap parameter = batas + tindakan + kontak**, batas **dikalibrasi dari data siklus sendiri**
   (bukan dari buku).
2. **Satu tabel berkelanjutan** (1 baris/tank/hari) agar siklus berhasil vs gagal bisa dibandingkan.
