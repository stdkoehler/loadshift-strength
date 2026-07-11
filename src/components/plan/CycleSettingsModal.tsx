'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import type { Cycle } from '@/lib/types';
import type { CyclePayload } from './plan-editor-types';

export function CycleSettingsModal({
  cycle,
  onClose,
  onSave,
}: {
  cycle: Cycle;
  onClose: () => void;
  onSave: (payload: CyclePayload) => Promise<void> | void;
}) {
  const [name, setName] = useState(cycle.name);
  const [startDate, setStartDate] = useState(cycle.startDate ?? '');
  const [length, setLength] = useState(String(cycle.lengthWeeks));
  const [waveLength, setWaveLength] = useState(cycle.waveLengthWeeks != null ? String(cycle.waveLengthWeeks) : '');

  const save = async () => {
    await onSave({
      name: name.trim(),
      ...(cycle.isTemplate ? {} : { startDate }),
      lengthWeeks: Number(length),
      waveLengthWeeks: waveLength.trim() === '' ? null : Number(waveLength),
    });
  };

  const footer = (
    <>
      <button type="button" onClick={onClose} className="ml-auto rounded-md px-3 py-1.5 text-sm text-neutral-400">
        Cancel
      </button>
      <button type="button" onClick={save} className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-neutral-950">
        Save
      </button>
    </>
  );

  const inputClass = 'w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100';
  const labelClass = 'mb-1 block text-xs font-medium text-neutral-400';

  return (
    <Modal title="Cycle Settings" onClose={onClose} footer={footer}>
      <div>
        <label className={labelClass}>Name</label>
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      {!cycle.isTemplate && (
        <div>
          <label className={labelClass}>Start date (Monday of week 1)</label>
          <DatePicker value={startDate} onChange={setStartDate} />
        </div>
      )}
      <div>
        <label className={labelClass}>Length (weeks)</label>
        <input inputMode="numeric" className={inputClass} value={length} onChange={(e) => setLength(e.target.value)} />
      </div>
      <div>
        <label className={labelClass}>Wave repeats every N weeks (optional)</label>
        <input
          inputMode="numeric"
          placeholder="empty = no repeat"
          className={inputClass}
          value={waveLength}
          onChange={(e) => setWaveLength(e.target.value)}
        />
      </div>
      <p className="text-xs text-neutral-500">The start date determines which calendar day belongs to which training week.</p>
      <p className="text-xs text-neutral-500">
        With a wave length of N set, phased-wave exercises replay phases 1..N over and over (e.g. a 3-week wave
        over a 12-week cycle), instead of running through once linearly.
      </p>
    </Modal>
  );
}
