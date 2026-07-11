'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { upsertLogAction } from '@/server/actions/logs.actions';
import { queryKeys } from '@/query/keys';
import { fmt, todayIso } from '@/lib/date';
import { toggleDone } from './toggle-done';
import type { SessionSet } from '@/lib/types';

const ROLE_CLASS: Record<string, string> = {
  'Warm-up': 'bg-sky-500/15 text-sky-300',
  'Top-Set': 'bg-amber-500/15 text-amber-300',
  'Back-off': 'bg-violet-500/15 text-violet-300',
  'Endurance-Touch': 'bg-emerald-500/15 text-emerald-300',
};

function RoleChip({ role }: { role: string | null }) {
  if (!role) return null;
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_CLASS[role] ?? 'bg-neutral-700 text-neutral-300'}`}>
      {role}
    </span>
  );
}

export function SetRow({ exerciseId, date, set }: { exerciseId: number; date: string; set: SessionSet }) {
  const queryClient = useQueryClient();
  const editable = date === todayIso();
  const [reps, setReps] = useState(set.actualReps != null ? String(set.actualReps) : '');
  const [weight, setWeight] = useState(set.actualWeight != null ? String(set.actualWeight) : '');
  const [rir, setRir] = useState(set.actualRir != null ? String(set.actualRir) : '');
  const [done, setDone] = useState(set.done);

  useEffect(() => {
    setReps(set.actualReps != null ? String(set.actualReps) : '');
    setWeight(set.actualWeight != null ? String(set.actualWeight) : '');
    setRir(set.actualRir != null ? String(set.actualRir) : '');
    setDone(set.done);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set.actualReps, set.actualWeight, set.actualRir, set.done, date, exerciseId]);

  const save = async (nextReps: string, nextWeight: string, nextRir: string, nextDone: boolean) => {
    await upsertLogAction({
      exerciseId,
      setIndex: set.setIndex,
      logDate: date,
      actualReps: nextReps === '' ? null : Number(nextReps),
      actualWeight: nextWeight === '' ? null : Number(nextWeight),
      actualRir: nextRir === '' ? null : Number(nextRir),
      done: nextDone,
    });
    await queryClient.invalidateQueries({ queryKey: queryKeys.session(date) });
  };

  const handleToggle = () => {
    const result = toggleDone({ reps, weight, done }, { targetReps: set.targetReps, targetWeight: set.targetWeight });
    setReps(result.reps);
    setWeight(result.weight);
    setDone(result.done);
    void save(result.reps, result.weight, rir, result.done);
  };

  return (
    <div className={`flex items-center gap-3 rounded-lg px-3 py-2 ${done ? 'bg-emerald-500/10' : 'bg-neutral-900'}`}>
      <div className="w-5 text-center text-sm text-neutral-500">{set.setIndex}</div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="text-sm text-neutral-300">
          <b className="text-neutral-100">{set.targetReps ?? '–'}</b>
          <span className="mx-1 text-neutral-600">×</span>
          <b className="text-neutral-100">{set.targetWeight != null ? fmt(set.targetWeight) : '–'}</b>
          <span className="text-neutral-500"> kg</span>
          {set.targetRir != null && <span className="ml-2 text-xs text-neutral-500">RIR {fmt(set.targetRir)}</span>}
        </div>
        <RoleChip role={set.role} />
      </div>
      <div className="flex items-center gap-2">
        <input
          inputMode="numeric"
          placeholder={set.targetReps != null ? String(set.targetReps) : 'Reps'}
          value={reps}
          disabled={!editable}
          onChange={(e) => setReps(e.target.value)}
          onBlur={() => void save(reps, weight, rir, done)}
          className="w-14 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-center text-sm text-neutral-100 disabled:opacity-60"
        />
        <span className="text-neutral-600">×</span>
        <input
          inputMode="decimal"
          placeholder={set.targetWeight != null ? fmt(set.targetWeight) : 'kg'}
          value={weight}
          disabled={!editable}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={() => void save(reps, weight, rir, done)}
          className="w-16 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-center text-sm text-neutral-100 disabled:opacity-60"
        />
        <input
          inputMode="decimal"
          placeholder={set.targetRir != null ? `RIR ${fmt(set.targetRir)}` : 'RIR'}
          value={rir}
          disabled={!editable}
          onChange={(e) => setRir(e.target.value)}
          onBlur={() => void save(reps, weight, rir, done)}
          className="w-14 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-center text-sm text-neutral-100 disabled:opacity-60"
        />
        <button
          type="button"
          aria-label="done"
          onClick={handleToggle}
          disabled={!editable}
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors disabled:opacity-60 ${
            done ? 'border-emerald-500 bg-emerald-500 text-neutral-950' : 'border-neutral-600 text-neutral-500'
          }`}
        >
          ✓
        </button>
      </div>
    </div>
  );
}
