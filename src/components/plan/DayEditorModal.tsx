'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { Day } from '@/lib/types';
import type { DayPayload } from './plan-editor-types';

const WD: Record<number, string> = { 1: 'Montag', 2: 'Dienstag', 3: 'Mittwoch', 4: 'Donnerstag', 5: 'Freitag', 6: 'Samstag', 7: 'Sonntag' };
const inputClass = 'w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100';
const labelClass = 'mb-1 block text-xs font-medium text-neutral-400';
const segButtonClass = (active: boolean) =>
  `flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${active ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`;

export function DayEditorModal({
  day,
  onClose,
  onSave,
  onDelete,
}: {
  day: Day | null;
  onClose: () => void;
  onSave: (payload: DayPayload) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
}) {
  const [name, setName] = useState(day?.name || '');
  const [weekday, setWeekday] = useState(day?.weekday || 1);
  const [focus, setFocus] = useState(day?.focus || '');
  const [isRest, setIsRest] = useState(!!day?.isRest);

  const save = async () => {
    const body: DayPayload = { name: name.trim() || WD[weekday], weekday: Number(weekday), focus: focus.trim() || null, isRest };
    await onSave(body);
  };
  const del = async () => {
    if (!onDelete) return;
    await onDelete();
  };

  const footer = (
    <>
      {onDelete && (
        <button type="button" onClick={del} className="rounded-md bg-red-500/15 px-3 py-1.5 text-sm text-red-400">
          Loeschen
        </button>
      )}
      <button type="button" onClick={onClose} className="ml-auto rounded-md px-3 py-1.5 text-sm text-neutral-400">
        Abbrechen
      </button>
      <button type="button" onClick={save} className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-neutral-950">
        Speichern
      </button>
    </>
  );

  return (
    <Modal title={day ? 'Tag bearbeiten' : 'Neuer Trainingstag'} onClose={onClose} footer={footer}>
      <div>
        <label className={labelClass}>Wochentag</label>
        <select className={inputClass} value={weekday} onChange={(e) => setWeekday(Number(e.target.value))}>
          {Object.entries(WD).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>Bezeichnung (Muskelgruppe)</label>
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Brust / Schulter" />
      </div>
      <div>
        <label className={labelClass}>Fokus (optional)</label>
        <input className={inputClass} value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="z.B. Kraft, Hypertrophie" />
      </div>
      <div>
        <label className={labelClass}>Typ</label>
        <div className="flex gap-1">
          <button type="button" className={segButtonClass(!isRest)} onClick={() => setIsRest(false)}>Trainingstag</button>
          <button type="button" className={segButtonClass(isRest)} onClick={() => setIsRest(true)}>Ruhetag</button>
        </div>
      </div>
    </Modal>
  );
}
