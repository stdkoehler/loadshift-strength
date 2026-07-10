import type { ExerciseWithSets, ExportDay, ExportPhase, FullPlan } from '@/lib/types';
import type { ExerciseInput } from '@/zod/exercise.schema';

export interface TemplateDraftPayload {
  cycle: { name: string; lengthWeeks: number; waveLengthWeeks: number | null };
  phases: ExportPhase[];
  days: ExportDay[];
}

// Converts a draft plan to the portable shape replaceTemplateContentAction expects.
// Phases are referenced by name rather than id (mirroring the existing export/import
// format) so that a phase created earlier in the same draft session - which only has a
// temporary negative id - round-trips correctly without any id remapping.
// Fabricates a display-shaped ExerciseWithSets from raw editor input, for a draft
// exercise that doesn't exist in the DB yet. Set/target ids are throwaway (never
// persisted as-is - see toTemplateDraftPayload) and only need to be unique within this
// exercise, so they're just negative local indices.
export function buildDraftExercise(id: number, dayId: number, payload: ExerciseInput): ExerciseWithSets {
  return {
    id,
    dayId,
    name: payload.name,
    progressionType: payload.progressionType,
    pauseMin: payload.pauseMin ?? null,
    notes: payload.notes ?? null,
    orderIndex: 0,
    sets: payload.sets.map((s, si) => ({
      id: -(si + 1),
      exerciseId: id,
      setIndex: si + 1,
      role: s.role ?? null,
      targets: (s.targets || []).map((t, ti) => ({
        id: -(ti + 1),
        setId: -(si + 1),
        phaseId: t.phaseId ?? null,
        reps: t.reps ?? null,
        baseWeight: t.baseWeight ?? null,
        incrementPerWeek: t.incrementPerWeek ?? 0,
        targetRir: t.targetRir ?? null,
        incrementPerRepeat: t.incrementPerRepeat ?? 0,
      })),
    })),
  };
}

export function toTemplateDraftPayload(plan: FullPlan): TemplateDraftPayload {
  const phaseNameById = new Map(plan.phases.map((p) => [p.id, p.name]));

  return {
    cycle: {
      name: plan.cycle.name,
      lengthWeeks: plan.cycle.lengthWeeks,
      waveLengthWeeks: plan.cycle.waveLengthWeeks,
    },
    phases: plan.phases.map((p) => ({ name: p.name, startWeek: p.startWeek, endWeek: p.endWeek, color: p.color })),
    days: plan.days.map((d) => ({
      weekday: d.weekday,
      name: d.name,
      focus: d.focus,
      isRest: d.isRest,
      exercises: d.exercises.map((e) => ({
        name: e.name,
        progressionType: e.progressionType,
        pauseMin: e.pauseMin,
        notes: e.notes,
        sets: e.sets.map((s) => ({
          role: s.role,
          targets: s.targets.map((t) => ({
            phase: t.phaseId != null ? (phaseNameById.get(t.phaseId) ?? null) : null,
            reps: t.reps,
            baseWeight: t.baseWeight,
            incrementPerWeek: t.incrementPerWeek,
            rir: t.targetRir,
            incrementPerRepeat: t.incrementPerRepeat,
          })),
        })),
      })),
    })),
  };
}
