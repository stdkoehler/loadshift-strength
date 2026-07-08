import type { Phase } from '@/lib/types';
import type { ExerciseInput } from '@/zod/exercise.schema';
import type { EditorState } from './types';

function num(v: number | string | null | undefined): number | null {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export function buildPayload(st: EditorState, phases: Phase[]): ExerciseInput {
  const isPhasen = st.progressionType === 'phasen';
  const common = {
    name: st.name.trim(),
    progressionType: st.progressionType,
    pauseMin: st.pauseMin === '' ? null : Number(st.pauseMin),
    notes: st.notes || null,
  };

  let sets: ExerciseInput['sets'] = [];

  const repeatIncrement = num(st.repeatIncrement) ?? 0;

  if (isPhasen && st.structure === 'uniform') {
    const n = Math.max(1, Number(st.uniform.numSets) || 1);
    sets = Array.from({ length: n }, () => ({
      role: null,
      targets: phases.map((p) => ({
        phaseId: p.id,
        reps: num(st.phaseVals[p.id]?.reps),
        baseWeight: num(st.phaseVals[p.id]?.weight),
        incrementPerWeek: 0,
        targetRir: num(st.phaseVals[p.id]?.rir),
        incrementPerRepeat: repeatIncrement,
      })),
    }));
  } else if (isPhasen && st.structure === 'custom') {
    sets = st.customPhase.map((c) => ({
      role: c.role || null,
      targets: phases.map((p) => ({
        phaseId: p.id,
        reps: num(c.vals[p.id]?.reps),
        baseWeight: num(c.vals[p.id]?.weight),
        incrementPerWeek: 0,
        targetRir: num(c.vals[p.id]?.rir),
        incrementPerRepeat: repeatIncrement,
      })),
    }));
  } else if (st.structure === 'uniform') {
    const n = Math.max(1, Number(st.uniform.numSets) || 1);
    const inc = st.progressionType === 'linear' ? (num(st.uniform.increment) ?? 0) : 0;
    sets = Array.from({ length: n }, () => ({
      role: null,
      targets: [
        {
          phaseId: null,
          reps: num(st.uniform.reps),
          baseWeight: num(st.uniform.weight),
          incrementPerWeek: inc,
          targetRir: num(st.uniform.rir),
        },
      ],
    }));
  } else {
    const inc = st.progressionType === 'linear' ? (num(st.uniform.increment) ?? 0) : 0;
    sets = st.custom.map((c) => ({
      role: c.role || null,
      targets: [{ phaseId: null, reps: num(c.reps), baseWeight: num(c.weight), incrementPerWeek: inc, targetRir: num(c.rir) }],
    }));
  }

  return { ...common, sets };
}
