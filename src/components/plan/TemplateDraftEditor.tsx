'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { usePlan } from '@/query/hooks/usePlan';
import { queryKeys } from '@/query/keys';
import { useTemplateDraftStore } from '@/stores/template-draft-store';
import { replaceTemplateContentAction } from '@/server/actions/template-draft.actions';
import { buildDraftExercise, toTemplateDraftPayload } from '@/lib/template-draft';
import { PlanEditor } from './PlanEditor';
import type { Phase } from '@/lib/types';

/**
 * Wires PlanEditor to a local draft (see stores/template-draft-store.ts) instead of
 * the DB: every save/delete only mutates the draft in memory. "Speichern" persists the
 * whole draft in one go via replaceTemplateContentAction; "Verwerfen" just discards it.
 */
export function TemplateDraftEditor({ cycleId, onExit }: { cycleId: number; onExit: () => void }) {
  const queryClient = useQueryClient();
  const { data: sourcePlan } = usePlan(cycleId);
  const draft = useTemplateDraftStore((s) => s.draft);
  const dirty = useTemplateDraftStore((s) => s.dirty);
  const init = useTemplateDraftStore((s) => s.init);
  const clear = useTemplateDraftStore((s) => s.clear);
  const takeTempId = useTemplateDraftStore((s) => s.takeTempId);
  const update = useTemplateDraftStore((s) => s.update);

  useEffect(() => {
    if (sourcePlan && !draft) init(sourcePlan);
  }, [sourcePlan, draft, init]);

  if (!draft) return <p className="px-4 py-6 text-sm text-neutral-500">Lade...</p>;

  const discard = () => {
    if (dirty && !confirm('Ungespeicherte Aenderungen an dieser Vorlage verwerfen?')) return;
    clear();
    onExit();
  };

  const save = async () => {
    await replaceTemplateContentAction(cycleId, toTemplateDraftPayload(draft));
    await queryClient.invalidateQueries({ queryKey: queryKeys.plan(cycleId) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.templates() });
    clear();
    onExit();
  };

  return (
    <PlanEditor
      plan={draft}
      allowImportExport={false}
      headerExtra={
        <>
          <button
            type="button"
            onClick={discard}
            className="ml-1 rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300"
          >
            Verwerfen
          </button>
          <button
            type="button"
            disabled={!dirty}
            onClick={save}
            className="ml-1 rounded-md bg-emerald-500 px-2 py-1 text-xs font-medium text-neutral-950 disabled:opacity-50"
          >
            Speichern
          </button>
        </>
      }
      onSaveExercise={(dayId, exerciseId, payload) => {
        const id = exerciseId ?? takeTempId();
        update((plan) => ({
          ...plan,
          days: plan.days.map((d) =>
            d.id !== dayId
              ? d
              : {
                  ...d,
                  exercises: exerciseId
                    ? d.exercises.map((e) => (e.id === exerciseId ? buildDraftExercise(id, dayId, payload) : e))
                    : [...d.exercises, buildDraftExercise(id, dayId, payload)],
                }
          ),
        }));
      }}
      onDeleteExercise={(exerciseId) => {
        update((plan) => ({
          ...plan,
          days: plan.days.map((d) => ({ ...d, exercises: d.exercises.filter((e) => e.id !== exerciseId) })),
        }));
      }}
      onSaveDay={(day, payload) => {
        if (day) {
          update((plan) => ({ ...plan, days: plan.days.map((d) => (d.id === day.id ? { ...d, ...payload } : d)) }));
          return;
        }
        const id = takeTempId();
        update((plan) => ({
          ...plan,
          days: [...plan.days, { id, cycleId, orderIndex: plan.days.length + 1, ...payload, exercises: [] }],
        }));
      }}
      onDeleteDay={(day) => {
        update((plan) => ({ ...plan, days: plan.days.filter((d) => d.id !== day.id) }));
      }}
      onSaveCycle={(payload) => {
        update((plan) => ({ ...plan, cycle: { ...plan.cycle, ...payload } }));
      }}
      onSavePhaseRow={(id, payload) => {
        update((plan) => ({ ...plan, phases: plan.phases.map((p) => (p.id === id ? { ...p, ...payload } : p)) }));
      }}
      onAddPhaseRow={(payload) => {
        const id = takeTempId();
        const created: Phase = { id, cycleId, orderIndex: draft.phases.length + 1, ...payload };
        update((plan) => ({ ...plan, phases: [...plan.phases, created] }));
        return created;
      }}
      onDeletePhaseRow={(id) => {
        update((plan) => ({ ...plan, phases: plan.phases.filter((p) => p.id !== id) }));
      }}
    />
  );
}
