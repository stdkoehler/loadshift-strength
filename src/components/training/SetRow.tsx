'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { upsertLogAction } from '@/server/actions/logs.actions';
import { queryKeys } from '@/query/keys';
import { fmt } from '@/lib/date';
import { toggleDone } from './toggle-done';
import type { SessionSet } from '@/lib/types';

const ROLE_CLASS: Record<string, string> = {
  'Warm-up': 'bg-sky-500/15 text-sky-300',
  'Top-Satz': 'bg-amber-500/15 text-amber-300',
  'Back-off': 'bg-violet-500/15 text-violet-300',
  'Kraftausdauer-Touch': 'bg-emerald-500/15 text-emerald-300',
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
  const [reps, setReps] = useState(set.istReps != null ? String(set.istReps) : '');
  const [weight, setWeight] = useState(set.istWeight != null ? String(set.istWeight) : '');
  const [done, setDone] = useState(set.done);

  useEffect(() => {
    setReps(set.istReps != null ? String(set.istReps) : '');
    setWeight(set.istWeight != null ? String(set.istWeight) : '');
    setDone(set.done);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set.istReps, set.istWeight, set.done, date, exerciseId]);

  const save = async (nextReps: string, nextWeight: string, nextDone: boolean) => {
    await upsertLogAction({
      exerciseId,
      setIndex: set.setIndex,
      logDate: date,
      actualReps: nextReps === '' ? null : Number(nextReps),
      actualWeight: nextWeight === '' ? null : Number(nextWeight),
      done: nextDone,
    });
    await queryClient.invalidateQueries({ queryKey: queryKeys.session(date) });
  };

  const handleToggle = () => {
    const result = toggleDone({ reps, weight, done }, { sollReps: set.sollReps, sollWeight: set.sollWeight });
    setReps(result.reps);
    setWeight(result.weight);
    setDone(result.done);
    void save(result.reps, result.weight, result.done);
  };

  return (
    <div className={`flex items-center gap-3 rounded-lg px-3 py-2 ${done ? 'bg-emerald-500/10' : 'bg-neutral-900'}`}>
      <div className="w-5 text-center text-sm text-neutral-500">{set.setIndex}</div>
      <div className="flex flex-1 flex-col gap-1">
        <div className="text-sm text-neutral-300">
          <b className="text-neutral-100">{set.sollReps ?? '–'}</b>
          <span className="mx-1 text-neutral-600">×</span>
          <b className="text-neutral-100">{set.sollWeight != null ? fmt(set.sollWeight) : '–'}</b>
          <span className="text-neutral-500"> kg</span>
          {set.sollRir != null && <span className="ml-2 text-xs text-neutral-500">RIR {fmt(set.sollRir)}</span>}
        </div>
        <RoleChip role={set.role} />
      </div>
      <div className="flex items-center gap-2">
        <input
          inputMode="numeric"
          placeholder={set.sollReps != null ? String(set.sollReps) : 'Wdh'}
          value={reps}
          onChange={(e) => setReps(e.target.value)}
          onBlur={() => void save(reps, weight, done)}
          className="w-14 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-center text-sm text-neutral-100"
        />
        <span className="text-neutral-600">×</span>
        <input
          inputMode="decimal"
          placeholder={set.sollWeight != null ? fmt(set.sollWeight) : 'kg'}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          onBlur={() => void save(reps, weight, done)}
          className="w-16 rounded-md border border-neutral-700 bg-neutral-800 px-2 py-1 text-center text-sm text-neutral-100"
        />
        <button
          type="button"
          aria-label="erledigt"
          onClick={handleToggle}
          className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
            done ? 'border-emerald-500 bg-emerald-500 text-neutral-950' : 'border-neutral-600 text-neutral-500'
          }`}
        >
          ✓
        </button>
      </div>
    </div>
  );
}
