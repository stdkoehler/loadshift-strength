'use client';

import { useState } from 'react';
import { useHistoryDays, useHistoryExerciseNames, useHistoryExercise } from '@/query/hooks/useHistory';
import { LineChart } from '@/components/progress/Charts';
import { DatePicker } from '@/components/ui/DatePicker';
import { IconChevronDown } from '@/components/ui/Icons';
import { addDays, todayIso, formatDate, dowShort, fmt } from '@/lib/date';
import type { HistorySetEntry } from '@/lib/types';

const TARGET_COLOR = '#a78bfa';
const ACTUAL_COLOR = '#34d399';

// Below this count, tap chips alone are fine. Past it (e.g. years of logs across many
// plans), a filter input keeps the picker usable without shrinking every chip to fit.
const FILTER_THRESHOLD = 15;

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
          {doneCount}/{group.sets.length} sets
        </span>
      </button>

      {open && (
        <div className="ml-6 flex flex-col gap-1 border-l border-neutral-800 pb-1 pl-3">
          {group.sets.map((s, i) => (
            <div key={`${s.exerciseId}-${s.setIndex}-${i}`} className="flex items-center gap-2 text-sm">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.done ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
              <span className="shrink-0 text-xs text-neutral-500">Set {s.setIndex}</span>
              <span className="shrink-0 text-xs text-neutral-500">
                Target {s.targetReps ?? '–'}×{s.targetWeight != null ? fmt(s.targetWeight) : '–'}kg
              </span>
              <span className="shrink-0 text-xs text-neutral-100">
                Actual {s.actualReps ?? '–'}×{s.actualWeight != null ? fmt(s.actualWeight) : '–'}kg
                {s.actualRir != null && <> · RIR {fmt(s.actualRir)}</>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HistoryView() {
  const [from, setFrom] = useState(addDays(todayIso(), -30));
  const [to, setTo] = useState(todayIso());
  const [exerciseName, setExerciseName] = useState<string | undefined>(undefined);
  const [filter, setFilter] = useState('');

  const { data: days } = useHistoryDays(from, to);
  const { data: exerciseNames } = useHistoryExerciseNames(from, to);
  const activeExercise = exerciseName ?? exerciseNames?.[0];
  const { data: trend } = useHistoryExercise(activeExercise, from, to);
  const shownNames = filter
    ? (exerciseNames ?? []).filter((n) => n.toLowerCase().includes(filter.toLowerCase()))
    : (exerciseNames ?? []);
  const hasRir = trend?.points?.some((p) => p.targetRir != null || p.actualRir != null);

  return (
    <div className="flex flex-col gap-4 px-4 py-3">
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">History</div>
        <div className="mt-2 flex items-center gap-2">
          <DatePicker value={from} onChange={setFrom} className="w-full" />
          <span className="text-neutral-600">–</span>
          <DatePicker value={to} onChange={setTo} className="w-full" />
        </div>
      </div>

      {exerciseNames && exerciseNames.length > 0 && (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
          <h4 className="mb-2 text-sm font-semibold text-neutral-100">Exercise History</h4>

          {exerciseNames.length > FILTER_THRESHOLD && (
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter exercises..."
              className="mb-2 w-full rounded-lg border border-neutral-800 bg-neutral-950/40 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 outline-none focus:border-emerald-500/70"
            />
          )}

          <div className="mb-3 flex flex-wrap gap-2">
            {shownNames.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setExerciseName(n)}
                className={`rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                  n === activeExercise
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                    : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600'
                }`}
              >
                {n}
              </button>
            ))}
            {shownNames.length === 0 && <p className="text-xs text-neutral-500">No exercises match "{filter}".</p>}
          </div>

          {trend && trend.points.length > 0 ? (
            <>
              <LineChart
                data={trend.points}
                xKey="date"
                series={[
                  { key: 'targetTop', color: TARGET_COLOR, dashed: true },
                  { key: 'actualTop', color: ACTUAL_COLOR },
                ]}
              />
              <div className="mt-2 flex gap-4 text-xs text-neutral-400">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: TARGET_COLOR }} />Target
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: ACTUAL_COLOR }} />Actual
                </span>
              </div>
            </>
          ) : (
            <p className="text-xs text-neutral-500">No data in this date range.</p>
          )}

          {hasRir && (
            <>
              <h4 className="mt-4 text-sm font-semibold text-neutral-100">RIR (Reps in Reserve)</h4>
              <LineChart
                data={trend!.points}
                xKey="date"
                series={[
                  { key: 'targetRir', color: TARGET_COLOR, dashed: true },
                  { key: 'actualRir', color: ACTUAL_COLOR },
                ]}
              />
              <div className="mt-2 flex gap-4 text-xs text-neutral-400">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: TARGET_COLOR }} />Target
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: ACTUAL_COLOR }} />Actual
                </span>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 pb-6">
        {!days && <p className="text-sm text-neutral-500">Loading...</p>}
        {days?.length === 0 && <p className="text-sm text-neutral-500">No logged days in this date range.</p>}
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
