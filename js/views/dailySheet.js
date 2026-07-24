/* ===========================================================================
   dailySheet.js (view) — "Lembar Harian Tank": satu tabel berkelanjutan,
   1 baris per tank per hari (Prinsip 2). Sel diwarnai per status batas;
   bisa difilter per tank, dibandingkan antar siklus, dan diekspor CSV.
   =========================================================================== */

import { el, clear, fmt, fmtDate } from '../dom.js';
import { getCategory } from '../schema.js';
import { renderCategoryTrends } from '../components/chart.js';
import { buildDailyRows, sheetColumns, toCSV, downloadCSV } from '../dailySheet.js';
import * as api from '../api.js';

const OUTCOME_CLASS = { Berhasil: 'chip-berhasil', Gagal: 'chip-gagal', Berjalan: 'chip-muted' };

function cellClass(status) {
  return status === 'bahaya' ? 'sheet-cell sheet-bahaya' : status === 'waspada' ? 'sheet-cell sheet-waspada' : 'sheet-cell';
}

export function renderDailySheet() {
  const root = el('div', { class: 'space-y-6' });
  const cols = sheetColumns();
  const tanks = api.list('tank');

  root.appendChild(el('div', { class: 'max-w-2xl' }, [
    el('h1', { class: 'text-2xl mb-1' }, 'Lembar Harian Tank'),
    el('p', { class: 'muted text-sm' },
      'Satu tabel berkelanjutan — satu baris untuk satu tank pada satu hari — menggabungkan air harian, cek larva, dan mikrobiologi. Sel berwarna menandai status batas; ekspor CSV untuk analisis lintas siklus.'),
  ]));

  // --- Kontrol: filter tank + ekspor ---
  const tankSelect = el('select', { class: 'field-input', style: 'max-width:220px' }, [
    el('option', { value: '' }, 'Semua tank'),
    ...tanks.map((t) => el('option', { value: t.id }, t.namaTank)),
  ]);
  const fromInput = el('input', { class: 'field-input', type: 'date', style: 'max-width:160px', 'aria-label': 'Dari tanggal' });
  const toInput = el('input', { class: 'field-input', type: 'date', style: 'max-width:160px', 'aria-label': 'Sampai tanggal' });
  const exportBtn = el('button', { class: 'btn btn-ghost btn-sm' }, '⬇ Ekspor CSV');
  const controls = el('div', { class: 'flex items-center gap-2 flex-wrap' }, [
    el('span', { class: 'text-sm muted' }, 'Tank:'), tankSelect,
    el('span', { class: 'text-sm muted' }, 'Dari:'), fromInput,
    el('span', { class: 'text-sm muted' }, 'Sampai:'), toInput,
    exportBtn,
  ]);

  const tableWrap = el('div', { class: 'card p-0 overflow-x-auto' });

  function currentRows() {
    return buildDailyRows({ tankId: tankSelect.value || null, from: fromInput.value || null, to: toInput.value || null });
  }

  function renderTable() {
    clear(tableWrap);
    const rows = currentRows();
    const table = el('table', { class: 'sheet-table' });

    const headCells = [
      el('th', { class: 'sheet-sticky' }, 'Tank'),
      el('th', {}, 'Tgl'), el('th', {}, 'DOC'), el('th', {}, 'Stadia'),
      ...cols.map((c) => el('th', {}, [c.label, c.unit ? el('span', { class: 'field-unit' }, c.unit) : null])),
    ];
    table.appendChild(el('thead', {}, el('tr', {}, headCells)));

    const tbody = el('tbody', {});
    if (!rows.length) {
      tbody.appendChild(el('tr', {}, el('td', { class: 'p-4 muted', colspan: String(4 + cols.length) }, 'Belum ada data tank-hari.')));
    }
    for (const r of rows) {
      const tds = [
        el('td', { class: 'sheet-sticky font-medium' }, r.tankLabel),
        el('td', {}, fmtDate(r.tanggal)),
        el('td', { class: 'num' }, r.doc == null ? '—' : String(r.doc)),
        el('td', {}, r.stadia || '—'),
        ...cols.map((c) => {
          const cell = r.cells[c.key];
          return el('td', { class: cellClass(cell.status) + ' num' }, cell.value == null || cell.value === '' ? '—' : fmt(cell.value));
        }),
      ];
      tbody.appendChild(el('tr', {}, tds));
    }
    table.appendChild(tbody);
    tableWrap.appendChild(table);
  }

  tankSelect.addEventListener('change', renderTable);
  fromInput.addEventListener('change', renderTable);
  toInput.addEventListener('change', renderTable);
  exportBtn.addEventListener('click', () => {
    const rows = currentRows();
    const suffix = tankSelect.value ? api.refLabel('tank', tankSelect.value, 'namaTank').replace(/\s+/g, '-') : 'semua';
    downloadCSV(`lembar-harian-${suffix}.csv`, toCSV(rows));
  });

  root.appendChild(controls);
  root.appendChild(tableWrap);
  renderTable();

  // --- Banding siklus (berhasil vs gagal) ---
  root.appendChild(renderComparison(tanks));
  return root;
}

function renderComparison(tanks) {
  const wrap = el('div', { class: 'space-y-3' });
  wrap.appendChild(el('div', { class: 'flex items-center justify-between mb-1' }, [
    el('h2', { class: 'text-lg' }, 'Banding Siklus'),
    el('span', { class: 'text-sm muted' }, 'Bandingkan tren siklus berhasil vs gagal'),
  ]));

  const labeled = tanks.filter((t) => t.hasilSiklus === 'Berhasil' || t.hasilSiklus === 'Gagal');
  if (labeled.length < 1) {
    wrap.appendChild(el('div', { class: 'empty-state' }, 'Tandai hasil siklus tank (Berhasil/Gagal) di Master Tank untuk membandingkan.'));
    return wrap;
  }

  // Legenda outcome
  const legend = el('div', { class: 'flex flex-wrap gap-2' });
  for (const t of labeled) {
    legend.appendChild(el('span', { class: 'chip ' + (OUTCOME_CLASS[t.hasilSiklus] || 'chip-muted') },
      `${t.namaTank}: ${t.hasilSiklus}${t.srFinal != null ? ' · SR ' + t.srFinal + '%' : ''}`));
  }
  wrap.appendChild(legend);

  // Overlay tren untuk tank berlabel (pakai ulang chart kategori)
  const ids = new Set(labeled.map((t) => t.id));
  const airRecs = api.list('prodLarvae').filter((r) => ids.has(r.tankId));
  const airTrends = renderCategoryTrends(getCategory('prodLarvae'), airRecs);      // NH3/nitrit/DO
  wrap.appendChild(airTrends || el('div', { class: 'empty-state' }, 'Data air harian belum cukup untuk grafik banding.'));

  const srRecs = api.list('labCekLarva').filter((r) => ids.has(r.tankId));
  const srTrends = renderCategoryTrends(getCategory('labCekLarva'), srRecs);        // SR/mortalitas
  if (srTrends) wrap.appendChild(srTrends);
  return wrap;
}
