import type { ExerciseWithSets, Phase } from '@/lib/types';
import type { EditorState, PhaseVal } from './types';

function emptyPhaseVals(phases: Phase[], reps = 10, weight = 20, rir: number | string = ''): Record<number, PhaseVal> {
  return Object.fromEntries(phases.map((p) => [p.id, { reps, weight, rir }]));
}

// Reverse-engineers editor state from an existing exercise (or defaults for a new one).
// This mirrors the original app's deriveState exactly - see the "uniform vs custom
// detection" block below, which decides whether to show the compact "same for every
// set" editor or the per-set ramp editor based on whether the existing data actually
// varies across sets.
export function deriveState(initial: ExerciseWithSets | null, phases: Phase[]): EditorState {
  if (!initial) {
    return {
      name: '',
      progressionType: 'linear',
      pauseMin: 2.5,
      notes: '',
      structure: 'uniform',
      activePhase: phases[0]?.id ?? null,
      uniform: { numSets: 3, reps: 10, weight: 20, increment: 1.25, rir: '' },
      custom: [{ _key: crypto.randomUUID(), reps: 10, weight: 20, role: '', rir: '' }],
      phaseVals: emptyPhaseVals(phases),
      customPhase: [{ _key: crypto.randomUUID(), role: '', vals: emptyPhaseVals(phases) }],
      repeatIncrement: '',
    };
  }

  const sets = initial.sets || [];
  const first = sets[0];
  const firstT = first?.targets?.[0];

  const base: EditorState = {
    name: initial.name,
    progressionType: initial.progressionType as EditorState['progressionType'],
    pauseMin: initial.pauseMin ?? '',
    notes: initial.notes || '',
    structure: 'uniform',
    activePhase: phases[0]?.id ?? null,
    uniform: {
      numSets: sets.length || 1,
      reps: firstT?.reps ?? 10,
      weight: firstT?.baseWeight ?? 20,
      increment: firstT?.incrementPerWeek ?? 1.25,
      rir: firstT?.targetRir ?? '',
    },
    custom: sets.map((s) => ({
      _key: crypto.randomUUID(),
      reps: s.targets?.[0]?.reps ?? '',
      weight: s.targets?.[0]?.baseWeight ?? '',
      role: s.role || '',
      rir: s.targets?.[0]?.targetRir ?? '',
    })),
    phaseVals: Object.fromEntries(
      phases.map((p) => {
        const t = first?.targets?.find((x) => x.phaseId === p.id);
        return [p.id, { reps: t?.reps ?? 10, weight: t?.baseWeight ?? 20, rir: t?.targetRir ?? '' }];
      })
    ),
    customPhase: sets.map((s) => {
      const plain = s.targets?.find((x) => x.phaseId == null);
      return {
        _key: crypto.randomUUID(),
        role: s.role || '',
        vals: Object.fromEntries(
          phases.map((p) => {
            const t = s.targets?.find((x) => x.phaseId === p.id) || plain;
            return [p.id, { reps: t?.reps ?? '', weight: t?.baseWeight ?? '', rir: t?.targetRir ?? '' }];
          })
        ),
      };
    }),
    repeatIncrement: first?.targets?.find((x) => x.phaseId != null)?.incrementPerRepeat ?? '',
  };

  // uniform vs custom detection
  let uniform = true;
  if (initial.progressionType === 'phased') {
    outer: for (const s of sets) {
      if (s.role) { uniform = false; break; }
      for (const p of phases) {
        const t = s.targets?.find((x) => x.phaseId === p.id);
        const f = first?.targets?.find((x) => x.phaseId === p.id);
        if (
          (t?.reps ?? null) !== (f?.reps ?? null) ||
          (t?.baseWeight ?? null) !== (f?.baseWeight ?? null) ||
          (t?.targetRir ?? null) !== (f?.targetRir ?? null)
        ) {
          uniform = false;
          break outer;
        }
      }
    }
  } else {
    for (const s of sets) {
      const t = s.targets?.[0];
      if (
        s.role ||
        !t ||
        t.reps !== firstT?.reps ||
        t.baseWeight !== firstT?.baseWeight ||
        t.incrementPerWeek !== firstT?.incrementPerWeek ||
        (t.targetRir ?? null) !== (firstT?.targetRir ?? null)
      ) {
        uniform = false;
        break;
      }
    }
  }
  base.structure = uniform ? 'uniform' : 'custom';
  if (!base.custom.length) base.custom = [{ _key: crypto.randomUUID(), reps: 10, weight: 20, role: '', rir: '' }];
  if (!base.customPhase.length) base.customPhase = [{ _key: crypto.randomUUID(), role: '', vals: emptyPhaseVals(phases) }];
  return base;
}

export { emptyPhaseVals };
