'use client';

import { useEffect, useState } from 'react';
import { useProgress, useProgressList } from '@/query/hooks/useProgress';
import { usePlan } from '@/query/hooks/usePlan';
import { LineChart, BarChart } from './Charts';
import { PlanOverview } from './PlanOverview';
import { Dropdown } from '@/components/ui/Dropdown';

const TARGET_COLOR = '#a78bfa';
const ACTUAL_COLOR = '#34d399';

export function ProgressView() {
  const { data: list } = useProgressList();
  const [exerciseId, setExerciseId] = useState<number | undefined>(undefined);
  const { data } = useProgress(exerciseId);
  const { data: plan } = usePlan(list?.cycle?.id);

  useEffect(() => {
    if (exerciseId == null && list?.exercises?.length) setExerciseId(list.exercises[0].id);
  }, [list, exerciseId]);

  if (!list) return <p className="px-4 py-6 text-sm text-neutral-500">Loading...</p>;
  if (!list.exercises.length) return <p className="px-4 py-6 text-sm text-neutral-500">No exercises in the active cycle.</p>;

  const hasActual = data?.weeks?.some((w) => w.actualTop != null || w.volumeActual > 0);

  return (
    <div className="flex flex-col gap-4 px-4 py-3">
      {plan && <PlanOverview plan={plan} />}

      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">Progress</div>
        <div className="mt-2">
          <Dropdown
            options={list.exercises.map((it) => ({ value: it.id, label: `${it.day} · ${it.name}` }))}
            value={exerciseId}
            onChange={setExerciseId}
          />
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

          {!hasActual && (
            <p className="text-xs text-neutral-500">
              No actual values logged yet - enter weights in the Training tab and your progress will show up here.
            </p>
          )}
        </>
      )}
    </div>
  );
}
