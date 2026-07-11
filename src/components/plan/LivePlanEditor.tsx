'use client';

import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePlan } from '@/query/hooks/usePlan';
import { queryKeys } from '@/query/keys';
import {
  deleteExerciseAction,
  createExerciseAction,
  updateExerciseAction,
  reorderExercisesAction,
} from '@/server/actions/exercises.actions';
import { createDayAction, deleteDayAction, updateDayAction } from '@/server/actions/days.actions';
import { updateCycleAction } from '@/server/actions/cycles.actions';
import { createPhaseAction, deletePhaseAction, updatePhaseAction } from '@/server/actions/phases.actions';
import { PlanEditor } from './PlanEditor';
import type { Phase } from '@/lib/types';

/**
 * Wires PlanEditor to the active plan: every save/delete hits the DB immediately via
 * server actions, then invalidates the plan query. See TemplateDraftEditor for the
 * local-draft counterpart used when editing a template.
 */
export function LivePlanEditor({ cycleId, headerExtra }: { cycleId: number; headerExtra?: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: plan } = usePlan(cycleId);

  const invalidatePlan = () => queryClient.invalidateQueries({ queryKey: queryKeys.plan(cycleId) });
  const invalidateCycle = () => queryClient.invalidateQueries({ queryKey: queryKeys.activeCycle() });

  if (!plan) return <p className="px-4 py-6 text-sm text-neutral-500">Loading...</p>;

  return (
    <PlanEditor
      plan={plan}
      headerExtra={headerExtra}
      allowImportExport
      onSaveExercise={async (dayId, exerciseId, payload) => {
        if (exerciseId) await updateExerciseAction(exerciseId, payload);
        else await createExerciseAction(dayId, payload);
        await invalidatePlan();
      }}
      onDeleteExercise={async (exerciseId) => {
        await deleteExerciseAction(exerciseId);
        await invalidatePlan();
      }}
      onReorderExercises={async (dayId, orderedIds) => {
        await reorderExercisesAction(dayId, orderedIds);
        await invalidatePlan();
      }}
      onSaveDay={async (day, payload) => {
        if (day) await updateDayAction(day.id, payload);
        else await createDayAction(cycleId, payload);
        await invalidatePlan();
      }}
      onDeleteDay={async (day) => {
        await deleteDayAction(day.id);
        await invalidatePlan();
      }}
      onSaveCycle={async (payload) => {
        await updateCycleAction(cycleId, payload);
        await invalidateCycle();
        await invalidatePlan();
      }}
      onSavePhaseRow={async (id, payload) => {
        await updatePhaseAction(id, payload);
        await invalidatePlan();
      }}
      onAddPhaseRow={async (payload) => {
        const created = await createPhaseAction(cycleId, payload);
        await invalidatePlan();
        return created as Phase;
      }}
      onDeletePhaseRow={async (id) => {
        await deletePhaseAction(id);
        await invalidatePlan();
      }}
    />
  );
}
