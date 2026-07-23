/* ===========================================================================
   dailySheet.js — READ-MODEL "satu tabel berkelanjutan": 1 baris per tank per
   hari, menggabungkan koleksi tank-scoped (Prinsip 2). Tidak memigrasi data —
   hanya menggabung saat baca sehingga siklus bisa dibandingkan & diekspor CSV.
   =========================================================================== */

import { getCategory } from './schema.js';
import { evalField } from './alerts.js';
import { computeField } from './compute.js';
import * as api from './api.js';

// Koleksi tank-scoped yang digabung (punya tankId + tanggal)
const SOURCE_COLLECTIONS = ['prodLarvae', 'labCekLarva', 'labMikro', 'prodPostLarvae'];

// Kolom parameter kunci: (koleksi, key field). Definisi field diambil dari schema.
const SHEET_COLUMNS = [
  ['prodLarvae', 'suhuSore'],
  ['prodLarvae', 'phSore'],
  ['prodLarvae', 'do'],
  ['prodLarvae', 'nh3'],
  ['prodLarvae', 'nitrit'],
  ['prodLarvae', 'salinitas'],
  ['prodLarvae', 'alkalinitas'],
  ['labCekLarva', 'sr'],
  ['labCekLarva', 'mortalitas'],
  ['labMikro', 'tvc'],
  ['labMikro', 'tcbsLuminescent'],
];

export function sheetColumns() {
  return SHEET_COLUMNS.map(([collection, key]) => {
    const cat = getCategory(collection);
    const field = cat.fields.find((f) => f.key === key);
    return { collection, key, label: field.label, unit: field.unit || '', field };
  });
}

// Bangun baris 1-tank-1-hari dari gabungan koleksi tank-scoped.
export function buildDailyRows({ tankId = null } = {}) {
  const groups = new Map(); // `${tankId}__${tanggal}` → { tankId, tanggal, recs }
  for (const collection of SOURCE_COLLECTIONS) {
    for (const rec of api.list(collection)) {         // terurut terbaru dulu
      if (!rec.tankId || !rec.tanggal) continue;
      if (tankId && rec.tankId !== tankId) continue;
      const k = `${rec.tankId}__${rec.tanggal}`;
      if (!groups.has(k)) groups.set(k, { tankId: rec.tankId, tanggal: rec.tanggal, recs: {} });
      const g = groups.get(k);
      if (!g.recs[collection]) g.recs[collection] = rec; // ambil record terbaru hari itu
    }
  }

  const cols = sheetColumns();
  const rows = [...groups.values()].map((g) => {
    const cells = {};
    for (const col of cols) {
      const rec = g.recs[col.collection];
      if (!rec) { cells[col.key] = { value: null, status: 'none' }; continue; }
      const value = col.field.type === 'computed' ? computeField(col.field, rec) : rec[col.key];
      cells[col.key] = { value, status: evalField(col.field, rec) };
    }
    const doc = g.recs.labCekLarva?.doc ?? g.recs.prodPostLarvae?.doc ?? null;
    const stadia = g.recs.labCekLarva?.stadiaDominan ?? g.recs.prodPostLarvae?.stadia ?? g.recs.labMikro?.stadia ?? '';
    return {
      tankId: g.tankId, tankLabel: api.refLabel('tank', g.tankId, 'namaTank'),
      tanggal: g.tanggal, doc, stadia, cells,
    };
  });
  rows.sort((a, b) => a.tankLabel.localeCompare(b.tankLabel) || String(b.tanggal).localeCompare(String(a.tanggal)));
  return rows;
}

/* --- Ekspor CSV (satu baris per tank-hari) --- */
function csvCell(v) {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
export function toCSV(rows) {
  const cols = sheetColumns();
  const header = ['Tank', 'Tanggal', 'DOC', 'Stadia', ...cols.map((c) => (c.unit ? `${c.label} (${c.unit})` : c.label))];
  const lines = [header.map(csvCell).join(',')];
  for (const r of rows) {
    lines.push([
      r.tankLabel, r.tanggal, r.doc ?? '', r.stadia ?? '',
      ...cols.map((c) => { const v = r.cells[c.key].value; return v == null || v === '' ? '' : v; }),
    ].map(csvCell).join(','));
  }
  return lines.join('\n');
}
export function downloadCSV(filename, csv) {
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
