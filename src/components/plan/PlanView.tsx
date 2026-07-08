'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useActiveCycle } from '@/query/hooks/useActiveCycle';
import { usePlan } from '@/query/hooks/usePlan';
import { queryKeys } from '@/query/keys';
import { useUiStore } from '@/stores/ui-store';
import { fmt } from '@/lib/date';
import { deleteExerciseAction, createExerciseAction, updateExerciseAction } from '@/server/actions/exercises.actions';
import { ExerciseEditor } from './ExerciseEditor/ExerciseEditor';
import { CycleSettingsModal } from './CycleSettingsModal';
import { PhasesEditorModal } from './PhasesEditorModal';
import { DayEditorModal } from './DayEditorModal';
import { ExportModal } from './ExportModal';
import { ImportButton } from './ImportButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconSettings, IconDownload, IconEdit, IconPlus } from '@/components/ui/Icons';
import type { ExerciseWithSets } from '@/lib/types';
import type { ExerciseInput } from '@/zod/exercise.schema';

const WD: Record<number, string> = { 1: 'Montag', 2: 'Dienstag', 3: 'Mittwoch', 4: 'Donnerstag', 5: 'Freitag', 6: 'Samstag', 7: 'Sonntag' };

function exSummary(ex: ExerciseWithSets): string {
  if (ex.progressionType === 'phasen') return `Phasen-Welle · ${ex.sets.length} Saetze`;
  const sets = ex.sets || [];
  const first = sets[0]?.targets?.[0];
  const firstRole = sets[0]?.role || null;
  const uniform = sets.every(
    (s) => s.targets?.[0]?.reps === first?.reps && s.targets?.[0]?.baseWeight === first?.baseWeight && (s.role || null) === firstRole
  );
  if (uniform && first) {
    const inc = first.incrementPerWeek ? ` · +${fmt(first.incrementPerWeek)}/Wo` : '';
    return `${sets.length} × ${first.reps ?? '–'} @ ${fmt(first.baseWeight)}kg${inc}`;
  }
  return `Ramp · ${sets.length} Saetze`;
}

export function PlanView() {
  const queryClient = useQueryClient();
  const { data: cycle } = useActiveCycle();
  const { data: plan } = usePlan(cycle?.id);
  const openModal = useUiStore((s) => s.openModal);
  const setOpenModal = useUiStore((s) => s.setOpenModal);

  const invalidatePlan = async () => {
    if (cycle) await queryClient.invalidateQueries({ queryKey: queryKeys.plan(cycle.id) });
  };
  const invalidateCycle = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.activeCycle() });
  };

  if (cycle === null) return <EmptyState />;
  if (!cycle || !plan) return <p className="px-4 py-6 text-sm text-neutral-500">Lade...</p>;

  const saveExercise = async (dayId: number, exerciseId: number | undefined, payload: ExerciseInput) => {
    if (exerciseId) await updateExerciseAction(exerciseId, payload);
    else await createExerciseAction(dayId, payload);
    setOpenModal(null);
    await invalidatePlan();
  };
  const deleteExercise = async (exerciseId: number) => {
    if (!confirm('Uebung loeschen?')) return;
    await deleteExerciseAction(exerciseId);
    setOpenModal(null);
    await invalidatePlan();
  };

  const exerciseModal = openModal && typeof openModal === 'object' && openModal.type === 'exercise' ? openModal : null;
  const dayModal = openModal && typeof openModal === 'object' && openModal.type === 'day' ? openModal : null;
  const editingExercise = exerciseModal?.exerciseId
    ? plan.days.flatMap((d) => d.exercises).find((e) => e.id === exerciseModal.exerciseId) ?? null
    : null;
  const editingDay = dayModal?.dayId ? plan.days.find((d) => d.id === dayModal.dayId) ?? null : null;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Plan bearbeiten</div>
          <div className="text-base font-semibold text-neutral-100">{cycle.name}</div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" title="Zyklus-Einstellungen" onClick={() => setOpenModal('cycle')} className="rounded-md px-2 py-1 text-neutral-400 hover:text-neutral-200">
            <IconSettings width={18} height={18} />
          </button>
          <button type="button" title="Als JSON exportieren" onClick={() => setOpenModal('export')} className="rounded-md px-2 py-1 text-neutral-400 hover:text-neutral-200">
            <IconDownload width={18} height={18} />
          </button>
          <ImportButton />
        </div>
      </div>

      <div className="flex items-center gap-2 px-4 pb-2 text-xs text-neutral-500">
        <span className="rounded-full bg-neutral-800 px-2 py-0.5">{cycle.lengthWeeks} Wochen</span>
        <span className="rounded-full bg-neutral-800 px-2 py-0.5">Start {cycle.startDate}</span>
        <button type="button" onClick={() => setOpenModal('phases')} className="ml-auto rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300">
          Phasen
        </button>
      </div>

      <div className="flex flex-col gap-3 px-4 pb-6">
        {plan.days.map((day) => (
          <div key={day.id} className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${day.isRest ? 'bg-neutral-600' : 'bg-emerald-400'}`} />
              <span className="text-sm font-semibold text-neutral-100">{day.name}</span>
              <span className="text-xs text-neutral-500">
                {WD[day.weekday]}
                {day.focus ? ` · ${day.focus}` : ''}
              </span>
              <button
                type="button"
                onClick={() => setOpenModal({ type: 'day', dayId: day.id })}
                className="ml-auto rounded-md px-2 py-1 text-neutral-500 hover:text-neutral-200"
                aria-label="Tag bearbeiten"
              >
                <IconEdit width={16} height={16} />
              </button>
            </div>

            {!day.isRest &&
              day.exercises.map((ex) => (
                <div key={ex.id} className="mt-2 flex items-center gap-2 rounded-lg bg-neutral-950/40 px-2 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-neutral-100">{ex.name}</div>
                    <div className="truncate text-xs text-neutral-500">{exSummary(ex)}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenModal({ type: 'exercise', dayId: day.id, exerciseId: ex.id })}
                    className="rounded-md px-2 py-1 text-neutral-500 hover:text-neutral-200"
                    aria-label="Uebung bearbeiten"
                  >
                    <IconEdit width={16} height={16} />
                  </button>
                </div>
              ))}

            {!day.isRest && (
              <button
                type="button"
                onClick={() => setOpenModal({ type: 'exercise', dayId: day.id })}
                className="mt-2 flex w-full items-center justify-center gap-1 rounded-md border border-dashed border-neutral-700 py-1.5 text-xs text-neutral-400"
              >
                <IconPlus width={14} height={14} /> Uebung hinzufuegen
              </button>
            )}
            {day.isRest && <div className="mt-2 pl-4 text-xs text-neutral-500">Ruhetag</div>}
          </div>
        ))}

        <button
          type="button"
          onClick={() => setOpenModal({ type: 'day' })}
          className="flex items-center justify-center gap-1 rounded-md border border-dashed border-neutral-700 py-2 text-sm text-neutral-400"
        >
          <IconPlus width={16} height={16} /> Trainingstag hinzufuegen
        </button>
      </div>

      {exerciseModal && (
        <ExerciseEditor
          key={editingExercise ? `ex-${editingExercise.id}` : `new-${exerciseModal.dayId}`}
          initial={editingExercise}
          phases={plan.phases}
          onSave={(payload) => saveExercise(exerciseModal.dayId, exerciseModal.exerciseId, payload)}
          onClose={() => setOpenModal(null)}
          onDelete={editingExercise ? () => deleteExercise(editingExercise.id) : undefined}
        />
      )}

      {dayModal && (
        <DayEditorModal
          cycleId={cycle.id}
          day={editingDay}
          onClose={() => setOpenModal(null)}
          onSaved={async () => {
            setOpenModal(null);
            await invalidatePlan();
          }}
        />
      )}

      {openModal === 'cycle' && (
        <CycleSettingsModal
          cycle={cycle}
          onClose={() => setOpenModal(null)}
          onSaved={async () => {
            setOpenModal(null);
            await invalidateCycle();
            await invalidatePlan();
          }}
        />
      )}

      {openModal === 'phases' && (
        <PhasesEditorModal
          cycleId={cycle.id}
          phases={plan.phases}
          onClose={() => setOpenModal(null)}
          onSaved={invalidatePlan}
        />
      )}

      {openModal === 'export' && <ExportModal cycle={cycle} onClose={() => setOpenModal(null)} />}
    </div>
  );
}
