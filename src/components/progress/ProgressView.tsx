'use client';

import { useEffect, useState } from 'react';
import { useProgress, useProgressList } from '@/query/hooks/useProgress';
import { usePlan } from '@/query/hooks/usePlan';
import { LineChart, BarChart } from './Charts';
import { PlanOverview } from './PlanOverview';
import { AiExportModal } from './AiExportModal';
import { IconSparkle } from '@/components/ui/Icons';

const TARGET_COLOR = '#a78bfa';
const ACTUAL_COLOR = '#34d399';
const WD: Record<number, string> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat', 7: 'Sun' };

export function ProgressView() {
  const { data: list } = useProgressList();
  const [weekday, setWeekday] = useState<number | undefined>(undefined);
  const [exerciseId, setExerciseId] = useState<number | undefined>(undefined);
  const [aiExportOpen, setAiExportOpen] = useState(false);
  const { data } = useProgress(exerciseId);
  const { data: plan } = usePlan(list?.cycle?.id);

  // Days in plan order (as returned by the API), deduped by weekday - day *names* can repeat
  // (e.g. two "Legs" days in one week), so weekday is the only safe grouping key.
  const days = list
    ? Array.from(new Map(list.exercises.map((e) => [e.weekday, { weekday: e.weekday, name: e.day }])).values())
    : [];
  const dayExercises = list ? list.exercises.filter((e) => e.weekday === weekday) : [];

  useEffect(() => {
    if (weekday == null && days.length) setWeekday(days[0].weekday);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  useEffect(() => {
    if (!dayExercises.length) return;
    if (!dayExercises.some((e) => e.id === exerciseId)) setExerciseId(dayExercises[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekday, list]);

  if (!list) return <p className="px-4 py-6 text-sm text-neutral-500">Loading...</p>;
  if (!list.exercises.length) return <p className="px-4 py-6 text-sm text-neutral-500">No exercises in the active cycle.</p>;

  const hasActual = data?.weeks?.some((w) => w.actualTop != null || w.volumeActual > 0);
  const hasRir = data?.weeks?.some((w) => w.targetRir != null || w.actualRir != null);

  return (
    <div className="flex flex-col gap-4 px-4 py-3">
      {plan && <PlanOverview plan={plan} />}

      <div>
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Progress</div>
          <button
            type="button"
            onClick={() => setAiExportOpen(true)}
            className="flex items-center gap-1 rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-1 text-xs text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
          >
            <IconSparkle width={13} height={13} />
            Export for AI
          </button>
        </div>

        <div className="app-scroll-x -mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
          {days.map((d) => (
            <button
              key={d.weekday}
              type="button"
              onClick={() => setWeekday(d.weekday)}
              className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                d.weekday === weekday
                  ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                  : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-600'
              }`}
            >
              {WD[d.weekday]} · {d.name}
            </button>
          ))}
        </div>

        <div className="mt-2 flex flex-col gap-1.5">
          {dayExercises.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => setExerciseId(ex.id)}
              className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                ex.id === exerciseId
                  ? 'border-emerald-500/60 bg-emerald-500/10 text-neutral-100'
                  : 'border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:border-neutral-700'
              }`}
            >
              {ex.name}
            </button>
          ))}
        </div>
      </div>

      {!data && <p className="text-sm text-neutral-500">Loading...</p>}

      {data && (
        <>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
            <h4 className="text-sm font-semibold text-neutral-100">Working Weight (Top Set)</h4>
            <p className="mb-2 text-xs text-neutral-500">Target vs. actually logged, kg per week</p>
            <LineChart
              data={data.weeks}
              xKey="week"
              series={[
                { key: 'targetTop', color: TARGET_COLOR, dashed: true },
                { key: 'actualTop', color: ACTUAL_COLOR },
              ]}
            />
            <div className="mt-2 flex gap-4 text-xs text-neutral-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: TARGET_COLOR }} />Target</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: ACTUAL_COLOR }} />Actual</span>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
            <h4 className="text-sm font-semibold text-neutral-100">Volume</h4>
            <p className="mb-2 text-xs text-neutral-500">kg (sets × reps × weight) per week</p>
            <BarChart
              data={data.weeks}
              xKey="week"
              keys={[
                { key: 'volumeTarget', color: TARGET_COLOR, soft: true },
                { key: 'volumeActual', color: ACTUAL_COLOR },
              ]}
            />
            <div className="mt-2 flex gap-4 text-xs text-neutral-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: TARGET_COLOR, opacity: 0.45 }} />Target</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: ACTUAL_COLOR }} />Actual</span>
            </div>
          </div>

          {hasRir && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
              <h4 className="text-sm font-semibold text-neutral-100">RIR (Reps in Reserve)</h4>
              <p className="mb-2 text-xs text-neutral-500">Target vs. actually felt, average per week</p>
              <LineChart
                data={data.weeks}
                xKey="week"
                series={[
                  { key: 'targetRir', color: TARGET_COLOR, dashed: true },
                  { key: 'actualRir', color: ACTUAL_COLOR },
                ]}
              />
              <div className="mt-2 flex gap-4 text-xs text-neutral-400">
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: TARGET_COLOR }} />Target</span>
                <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: ACTUAL_COLOR }} />Actual</span>
              </div>
            </div>
          )}

          {!hasActual && (
            <p className="text-xs text-neutral-500">
              No actual values logged yet - enter weights in the Training tab and your progress will show up here.
            </p>
          )}
        </>
      )}

      {aiExportOpen && <AiExportModal cycle={list.cycle} onClose={() => setAiExportOpen(false)} />}
    </div>
  );
}
