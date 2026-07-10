'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { Phase } from '@/lib/types';
import type { PhasePayload } from './plan-editor-types';

const inputClass = 'w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100';
const labelClass = 'mb-1 block text-xs font-medium text-neutral-400';

export function PhasesEditorModal({
  phases,
  onClose,
  onSaveRow,
  onAddRow,
  onDeleteRow,
}: {
  phases: Phase[];
  onClose: () => void;
  onSaveRow: (id: number, payload: PhasePayload) => Promise<void> | void;
  onAddRow: (payload: PhasePayload) => Promise<Phase> | Phase;
  onDeleteRow: (id: number) => Promise<void> | void;
}) {
  const [rows, setRows] = useState(phases.map((p) => ({ ...p })));
  const update = (i: number, patch: Partial<Phase>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const saveRow = async (row: Phase) => {
    await onSaveRow(row.id, { name: row.name, startWeek: Number(row.startWeek), endWeek: Number(row.endWeek), color: row.color });
  };
  const addRow = async () => {
    const p = await onAddRow({ name: 'Neue Phase', startWeek: 1, endWeek: 1, color: '#7c5cff' });
    setRows((r) => [...r, p]);
  };
  const del = async (row: Phase) => {
    await onDeleteRow(row.id);
    setRows((r) => r.filter((x) => x.id !== row.id));
  };

  const footer = (
    <button type="button" onClick={onClose} className="w-full rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-neutral-950">
      Fertig
    </button>
  );

  return (
    <Modal title="Periodisierungs-Phasen" onClose={onClose} footer={footer}>
      <p className="text-xs text-neutral-500">Phasen steuern Phasen-Wellen-Uebungen. Wochenbereiche frei anpassbar.</p>
      {rows.map((row, i) => (
        <div key={row.id} className="flex flex-col gap-2 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <input
              className={`${inputClass} flex-1`}
              value={row.name}
              onChange={(e) => update(i, { name: e.target.value })}
              onBlur={() => saveRow(rows[i])}
            />
            <input
              type="color"
              className="h-9 w-12 rounded-md border border-neutral-700 bg-neutral-800 p-1"
              value={row.color || '#7c5cff'}
              onChange={(e) => update(i, { color: e.target.value })}
              onBlur={() => saveRow(rows[i])}
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className={labelClass}>Von Woche</label>
              <input inputMode="numeric" className={inputClass} value={row.startWeek} onChange={(e) => update(i, { startWeek: Number(e.target.value) })} onBlur={() => saveRow(rows[i])} />
            </div>
            <div className="flex-1">
              <label className={labelClass}>Bis Woche</label>
              <input inputMode="numeric" className={inputClass} value={row.endWeek} onChange={(e) => update(i, { endWeek: Number(e.target.value) })} onBlur={() => saveRow(rows[i])} />
            </div>
            <button type="button" onClick={() => del(row)} className="rounded-md px-2 py-2 text-neutral-500 hover:text-red-400" aria-label="Phase loeschen">
              ✕
            </button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addRow} className="rounded-md border border-dashed border-neutral-700 py-2 text-sm text-neutral-400">
        + Phase hinzufuegen
      </button>
    </Modal>
  );
}
