'use client';

import { useEffect, useState } from 'react';
import { useProgress, useProgressList } from '@/query/hooks/useProgress';
import { usePlan } from '@/query/hooks/usePlan';
import { LineChart, BarChart } from './Charts';
import { PlanOverview } from './PlanOverview';
import { Dropdown } from '@/components/ui/Dropdown';

const SOLL_COLOR = '#a78bfa';
const IST_COLOR = '#34d399';

export function ProgressView() {
  const { data: list } = useProgressList();
  const [exerciseId, setExerciseId] = useState<number | undefined>(undefined);
  const { data } = useProgress(exerciseId);
  const { data: plan } = usePlan(list?.cycle?.id);

  useEffect(() => {
    if (exerciseId == null && list?.exercises?.length) setExerciseId(list.exercises[0].id);
  }, [list, exerciseId]);

  if (!list) return <p className="px-4 py-6 text-sm text-neutral-500">Lade...</p>;
  if (!list.exercises.length) return <p className="px-4 py-6 text-sm text-neutral-500">Keine Uebungen im aktiven Zyklus.</p>;

  const hasIst = data?.weeks?.some((w) => w.istTop != null || w.volumeIst > 0);

  return (
    <div className="flex flex-col gap-4 px-4 py-3">
      {plan && <PlanOverview plan={plan} />}

      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">Fortschritt</div>
        <div className="mt-2">
          <Dropdown
            options={list.exercises.map((it) => ({ value: it.id, label: `${it.day} · ${it.name}` }))}
            value={exerciseId}
            onChange={setExerciseId}
          />
        </div>
      </div>

      {!data && <p className="text-sm text-neutral-500">Lade...</p>}

      {data && (
        <>
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
            <h4 className="text-sm font-semibold text-neutral-100">Arbeitsgewicht (Top-Satz)</h4>
            <p className="mb-2 text-xs text-neutral-500">Soll vs. tatsaechlich geloggt, kg pro Woche</p>
            <LineChart
              data={data.weeks}
              xKey="week"
              series={[
                { key: 'sollTop', color: SOLL_COLOR, dashed: true },
                { key: 'istTop', color: IST_COLOR },
              ]}
            />
            <div className="mt-2 flex gap-4 text-xs text-neutral-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: SOLL_COLOR }} />Soll</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: IST_COLOR }} />Ist</span>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
            <h4 className="text-sm font-semibold text-neutral-100">Volumen</h4>
            <p className="mb-2 text-xs text-neutral-500">kg (Saetze × Wdh × Gewicht) pro Woche</p>
            <BarChart
              data={data.weeks}
              xKey="week"
              keys={[
                { key: 'volumeSoll', color: SOLL_COLOR, soft: true },
                { key: 'volumeIst', color: IST_COLOR },
              ]}
            />
            <div className="mt-2 flex gap-4 text-xs text-neutral-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: SOLL_COLOR, opacity: 0.45 }} />Soll</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: IST_COLOR }} />Ist</span>
            </div>
          </div>

          {!hasIst && (
            <p className="text-xs text-neutral-500">
              Noch keine Ist-Werte geloggt - trage im Training-Tab Gewichte ein, dann erscheint hier dein Verlauf.
            </p>
          )}
        </>
      )}
    </div>
  );
}
