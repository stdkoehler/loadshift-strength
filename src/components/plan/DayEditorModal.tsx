'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Dropdown } from '@/components/ui/Dropdown';
import type { Day } from '@/lib/types';
import type { DayPayload } from './plan-editor-types';

const WD: Record<number, string> = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday', 7: 'Sunday' };
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
          Delete
        </button>
      )}
      <button type="button" onClick={onClose} className="ml-auto rounded-md px-3 py-1.5 text-sm text-neutral-400">
        Cancel
      </button>
      <button type="button" onClick={save} className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-neutral-950">
        Save
      </button>
    </>
  );

  return (
    <Modal title={day ? 'Edit Day' : 'New Training Day'} onClose={onClose} footer={footer}>
      <div>
        <label className={labelClass}>Weekday</label>
        <Dropdown
          options={Object.entries(WD).map(([k, v]) => ({ value: Number(k), label: v }))}
          value={weekday}
          onChange={setWeekday}
        />
      </div>
      <div>
        <label className={labelClass}>Label (muscle group)</label>
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chest / Shoulders" />
      </div>
      <div>
        <label className={labelClass}>Focus (optional)</label>
        <input className={inputClass} value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="e.g. Strength, Hypertrophy" />
      </div>
      <div>
        <label className={labelClass}>Type</label>
        <div className="flex gap-1">
          <button type="button" className={segButtonClass(!isRest)} onClick={() => setIsRest(false)}>Training Day</button>
          <button type="button" className={segButtonClass(isRest)} onClick={() => setIsRest(true)}>Rest Day</button>
        </div>
      </div>
    </Modal>
  );
}
