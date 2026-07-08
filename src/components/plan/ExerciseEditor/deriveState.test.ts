import { describe, expect, it } from 'vitest';
import { deriveState } from './deriveState';
import { buildPayload } from './buildPayload';
import type { ExerciseWithSets, Phase } from '@/lib/types';

const phases: Phase[] = [
  { id: 1, cycleId: 1, name: 'Hypertrophie', startWeek: 1, endWeek: 3, color: '#34d399', orderIndex: 1 },
  { id: 2, cycleId: 1, name: 'Kraft', startWeek: 4, endWeek: 5, color: '#f87171', orderIndex: 2 },
];

function ex(partial: Partial<ExerciseWithSets>): ExerciseWithSets {
  return {
    id: 1,
    dayId: 1,
    name: 'Test',
    progressionType: 'konstant',
    pauseMin: null,
    notes: null,
    orderIndex: 1,
    sets: [],
    ...partial,
  };
}

describe('deriveState + buildPayload roundtrip', () => {
  it('non-phased uniform (konstant): detects uniform structure and rebuilds identical targets', () => {
    const fixture = ex({
      progressionType: 'konstant',
      sets: [
        { id: 1, exerciseId: 1, setIndex: 1, role: null, targets: [{ id: 1, setId: 1, phaseId: null, reps: 10, baseWeight: 80, incrementPerWeek: 0, targetRir: null, incrementPerRepeat: 0 }] },
        { id: 2, exerciseId: 1, setIndex: 2, role: null, targets: [{ id: 2, setId: 2, phaseId: null, reps: 10, baseWeight: 80, incrementPerWeek: 0, targetRir: null, incrementPerRepeat: 0 }] },
        { id: 3, exerciseId: 1, setIndex: 3, role: null, targets: [{ id: 3, setId: 3, phaseId: null, reps: 10, baseWeight: 80, incrementPerWeek: 0, targetRir: null, incrementPerRepeat: 0 }] },
      ],
    });
    const state = deriveState(fixture, []);
    expect(state.structure).toBe('uniform');
    const payload = buildPayload(state, []);
    expect(payload.sets).toHaveLength(3);
    for (const s of payload.sets) {
      expect(s.role).toBeNull();
      expect(s.targets).toEqual([{ phaseId: null, reps: 10, baseWeight: 80, incrementPerWeek: 0, targetRir: null }]);
    }
  });

  it('non-phased custom (ramp): detects custom structure and preserves per-set reps/weight/role/rir', () => {
    const fixture = ex({
      progressionType: 'konstant',
      sets: [
        { id: 1, exerciseId: 1, setIndex: 1, role: 'Warm-up', targets: [{ id: 1, setId: 1, phaseId: null, reps: 15, baseWeight: 39, incrementPerWeek: 0, targetRir: 3, incrementPerRepeat: 0 }] },
        { id: 2, exerciseId: 1, setIndex: 2, role: 'Top-Satz', targets: [{ id: 2, setId: 2, phaseId: null, reps: 6, baseWeight: 149, incrementPerWeek: 0, targetRir: 1, incrementPerRepeat: 0 }] },
      ],
    });
    const state = deriveState(fixture, []);
    expect(state.structure).toBe('custom');
    const payload = buildPayload(state, []);
    expect(payload.sets).toEqual([
      { role: 'Warm-up', targets: [{ phaseId: null, reps: 15, baseWeight: 39, incrementPerWeek: 0, targetRir: 3 }] },
      { role: 'Top-Satz', targets: [{ phaseId: null, reps: 6, baseWeight: 149, incrementPerWeek: 0, targetRir: 1 }] },
    ]);
  });

  it('phased uniform: same reps/weight per phase across all sets, no roles, shared repeat-increment', () => {
    const fixture = ex({
      progressionType: 'phasen',
      sets: [
        {
          id: 1, exerciseId: 1, setIndex: 1, role: null,
          targets: [
            { id: 1, setId: 1, phaseId: 1, reps: 12, baseWeight: 5, incrementPerWeek: 0, targetRir: null, incrementPerRepeat: 2.5 },
            { id: 2, setId: 1, phaseId: 2, reps: 5, baseWeight: 30, incrementPerWeek: 0, targetRir: null, incrementPerRepeat: 2.5 },
          ],
        },
        {
          id: 2, exerciseId: 1, setIndex: 2, role: null,
          targets: [
            { id: 3, setId: 2, phaseId: 1, reps: 12, baseWeight: 5, incrementPerWeek: 0, targetRir: null, incrementPerRepeat: 2.5 },
            { id: 4, setId: 2, phaseId: 2, reps: 5, baseWeight: 30, incrementPerWeek: 0, targetRir: null, incrementPerRepeat: 2.5 },
          ],
        },
      ],
    });
    const state = deriveState(fixture, phases);
    expect(state.structure).toBe('uniform');
    expect(state.repeatIncrement).toBe(2.5);
    const payload = buildPayload(state, phases);
    expect(payload.sets).toHaveLength(2);
    for (const s of payload.sets) {
      expect(s.role).toBeNull();
      expect(s.targets).toEqual([
        { phaseId: 1, reps: 12, baseWeight: 5, incrementPerWeek: 0, targetRir: null, incrementPerRepeat: 2.5 },
        { phaseId: 2, reps: 5, baseWeight: 30, incrementPerWeek: 0, targetRir: null, incrementPerRepeat: 2.5 },
      ]);
    }
  });

  it('phased custom (ramp): different reps/weight/rir per set AND per phase, roles shared across phases', () => {
    const fixture = ex({
      progressionType: 'phasen',
      sets: [
        {
          id: 1, exerciseId: 1, setIndex: 1, role: 'Warm-up',
          targets: [
            { id: 1, setId: 1, phaseId: 1, reps: 15, baseWeight: 0, incrementPerWeek: 0, targetRir: 4, incrementPerRepeat: 1.25 },
            { id: 2, setId: 1, phaseId: 2, reps: 8, baseWeight: 10, incrementPerWeek: 0, targetRir: 3, incrementPerRepeat: 1.25 },
          ],
        },
        {
          id: 2, exerciseId: 1, setIndex: 2, role: 'Top-Satz',
          targets: [
            { id: 3, setId: 2, phaseId: 1, reps: 12, baseWeight: 5, incrementPerWeek: 0, targetRir: 2, incrementPerRepeat: 1.25 },
            { id: 4, setId: 2, phaseId: 2, reps: 5, baseWeight: 30, incrementPerWeek: 0, targetRir: 0, incrementPerRepeat: 1.25 },
          ],
        },
      ],
    });
    const state = deriveState(fixture, phases);
    expect(state.structure).toBe('custom');
    expect(state.repeatIncrement).toBe(1.25);
    const payload = buildPayload(state, phases);
    expect(payload.sets).toEqual([
      { role: 'Warm-up', targets: [{ phaseId: 1, reps: 15, baseWeight: 0, incrementPerWeek: 0, targetRir: 4, incrementPerRepeat: 1.25 }, { phaseId: 2, reps: 8, baseWeight: 10, incrementPerWeek: 0, targetRir: 3, incrementPerRepeat: 1.25 }] },
      { role: 'Top-Satz', targets: [{ phaseId: 1, reps: 12, baseWeight: 5, incrementPerWeek: 0, targetRir: 2, incrementPerRepeat: 1.25 }, { phaseId: 2, reps: 5, baseWeight: 30, incrementPerWeek: 0, targetRir: 0, incrementPerRepeat: 1.25 }] },
    ]);
  });

  it('linear progression: carries the increment_per_week through uniform structure', () => {
    const fixture = ex({
      progressionType: 'linear',
      sets: [
        { id: 1, exerciseId: 1, setIndex: 1, role: null, targets: [{ id: 1, setId: 1, phaseId: null, reps: 8, baseWeight: 100, incrementPerWeek: 2.5, targetRir: null, incrementPerRepeat: 0 }] },
      ],
    });
    const state = deriveState(fixture, []);
    expect(state.structure).toBe('uniform');
    const payload = buildPayload(state, []);
    expect(payload.sets[0].targets[0]).toEqual({ phaseId: null, reps: 8, baseWeight: 100, incrementPerWeek: 2.5, targetRir: null });
  });

  it('new exercise (no initial): defaults to a sensible starting state', () => {
    const state = deriveState(null, phases);
    expect(state.structure).toBe('uniform');
    expect(state.progressionType).toBe('linear');
    expect(state.repeatIncrement).toBe('');
    const payload = buildPayload(state, phases);
    expect(payload.sets).toHaveLength(3); // default numSets
  });
});
