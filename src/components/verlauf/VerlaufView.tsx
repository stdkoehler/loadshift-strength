'use client';

import { useState } from 'react';
import { useHistoryDays, useHistoryExerciseNames, useHistoryExercise } from '@/query/hooks/useHistory';
import { LineChart } from '@/components/progress/Charts';
import { Dropdown } from '@/components/ui/Dropdown';
import { DatePicker } from '@/components/ui/DatePicker';
import { IconChevronDown } from '@/components/ui/Icons';
import { addDays, todayIso, formatDate, dowShort, fmt } from '@/lib/date';
import type { HistorySetEntry } from '@/lib/types';

const SOLL_COLOR = '#a78bfa';
const IST_COLOR = '#34d399';

interface ExerciseGroup {
  exerciseId: number;
  exerciseName: string;
  sets: HistorySetEntry[];
}

function groupByExercise(sets: HistorySetEntry[]): ExerciseGroup[] {
  const map = new Map<number, ExerciseGroup>();
  for (const s of sets) {
    let g = map.get(s.exerciseId);
    if (!g) {
      g = { exerciseId: s.exerciseId, exerciseName: s.exerciseName, sets: [] };
      map.set(s.exerciseId, g);
    }
    g.sets.push(s);
  }
  return [...map.values()];
}

function ExerciseLogGroup({ group }: { group: ExerciseGroup }) {
  const [open, setOpen] = useState(false);
  const doneCount = group.sets.filter((s) => s.done).length;
  const allDone = doneCount === group.sets.length;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-md py-1 text-left text-sm hover:bg-neutral-800/50"
      >
        <IconChevronDown width={14} height={14} className={`shrink-0 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        <span className={`h-2 w-2 shrink-0 rounded-full ${allDone ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
        <span className="min-w-0 flex-1 truncate text-neutral-200">{group.exerciseName}</span>
        <span className="shrink-0 text-xs text-neutral-500">
          {doneCount}/{group.sets.length} Saetze
        </span>
      </button>

      {open && (
        <div className="ml-6 flex flex-col gap-1 border-l border-neutral-800 pb-1 pl-3">
          {group.sets.map((s, i) => (
            <div key={`${s.exerciseId}-${s.setIndex}-${i}`} className="flex items-center gap-2 text-sm">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.done ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
              <span className="shrink-0 text-xs text-neutral-500">Satz {s.setIndex}</span>
              <span className="shrink-0 text-xs text-neutral-500">
                Soll {s.sollReps ?? '–'}×{s.sollWeight != null ? fmt(s.sollWeight) : '–'}kg
              </span>
              <span className="shrink-0 text-xs text-neutral-100">
                Ist {s.istReps ?? '–'}×{s.istWeight != null ? fmt(s.istWeight) : '–'}kg
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function VerlaufView() {
  const [from, setFrom] = useState(addDays(todayIso(), -30));
  const [to, setTo] = useState(todayIso());
  const [exerciseName, setExerciseName] = useState<string | undefined>(undefined);

  const { data: days } = useHistoryDays(from, to);
  const { data: exerciseNames } = useHistoryExerciseNames();
  const activeExercise = exerciseName ?? exerciseNames?.[0];
  const { data: trend } = useHistoryExercise(activeExercise, from, to);

  return (
    <div className="flex flex-col gap-4 px-4 py-3">
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">Verlauf</div>
        <div className="mt-2 flex items-center gap-2">
          <DatePicker value={from} onChange={setFrom} className="w-full" />
          <span className="text-neutral-600">–</span>
          <DatePicker value={to} onChange={setTo} className="w-full" />
        </div>
      </div>

      {exerciseNames && exerciseNames.length > 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-neutral-100">Uebungsverlauf</h4>
            <Dropdown
              className="w-auto max-w-[60%]"
              options={exerciseNames.map((n) => ({ value: n, label: n }))}
              value={activeExercise}
              onChange={setExerciseName}
            />
          </div>
          {trend && trend.points.length > 0 ? (
            <>
              <LineChart
                data={trend.points}
                xKey="date"
                series={[
                  { key: 'sollTop', color: SOLL_COLOR, dashed: true },
                  { key: 'istTop', color: IST_COLOR },
                ]}
              />
              <div className="mt-2 flex gap-4 text-xs text-neutral-400">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: SOLL_COLOR }} />Soll
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: IST_COLOR }} />Ist
                </span>
              </div>
            </>
          ) : (
            <p className="text-xs text-neutral-500">Keine Daten in diesem Zeitraum.</p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 pb-6">
        {!days && <p className="text-sm text-neutral-500">Lade...</p>}
        {days?.length === 0 && <p className="text-sm text-neutral-500">Keine geloggten Tage in diesem Zeitraum.</p>}
        {days?.map((day) => (
          <div key={day.date} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-100">
                {dowShort(day.date)}, {formatDate(day.date)}
              </span>
              <span className="text-xs text-neutral-500">{day.cycleName}</span>
            </div>
            <div className="flex flex-col">
              {groupByExercise(day.sets).map((g) => (
                <ExerciseLogGroup key={g.exerciseId} group={g} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
