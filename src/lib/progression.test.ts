import { describe, expect, it } from 'vitest';
import { computeTarget, effectiveWeek, phaseForWeek, weekNumberFor, weekdayFor, type Phase, type SetTarget } from './progression';

describe('weekNumberFor', () => {
  it('returns week 1 on the cycle start date', () => {
    expect(weekNumberFor('2024-01-01', '2024-01-01')).toBe(1);
  });
  it('returns week 2 exactly 7 days later', () => {
    expect(weekNumberFor('2024-01-01', '2024-01-08')).toBe(2);
  });
  it('returns week 0 (or negative) before the cycle start', () => {
    expect(weekNumberFor('2024-01-01', '2023-12-25')).toBe(0);
  });
});

describe('weekdayFor', () => {
  it('maps Monday to 1', () => {
    expect(weekdayFor('2024-01-01')).toBe(1); // 2024-01-01 is a Monday
  });
  it('maps Sunday to 7', () => {
    expect(weekdayFor('2024-01-07')).toBe(7); // 2024-01-07 is a Sunday
  });
});

describe('phaseForWeek', () => {
  const phases: Phase[] = [
    { id: 1, name: 'Hypertrophy', startWeek: 1, endWeek: 3, color: null },
    { id: 2, name: 'Strength', startWeek: 4, endWeek: 5, color: null },
  ];
  it('finds the phase containing the week', () => {
    expect(phaseForWeek(phases, 2)?.name).toBe('Hypertrophy');
    expect(phaseForWeek(phases, 4)?.name).toBe('Strength');
  });
  it('returns null when no phase covers the week', () => {
    expect(phaseForWeek(phases, 10)).toBeNull();
  });
});

describe('computeTarget', () => {
  it('returns nulls when there are no set targets', () => {
    expect(computeTarget('constant', [], [], 1)).toEqual({ weight: null, reps: null, rir: null });
  });

  it('constant: same weight/reps regardless of week', () => {
    const targets: SetTarget[] = [{ phaseId: null, reps: 10, baseWeight: 50, incrementPerWeek: 0 }];
    expect(computeTarget('constant', targets, [], 1)).toEqual({ weight: 50, reps: 10, rir: null });
    expect(computeTarget('constant', targets, [], 5)).toEqual({ weight: 50, reps: 10, rir: null });
  });

  it('constant: passes targetRir through unchanged', () => {
    const targets: SetTarget[] = [{ phaseId: null, reps: 10, baseWeight: 50, incrementPerWeek: 0, targetRir: 2 }];
    expect(computeTarget('constant', targets, [], 1)).toEqual({ weight: 50, reps: 10, rir: 2 });
  });

  it('linear: weight increases by increment_per_week for each week past week 1', () => {
    const targets: SetTarget[] = [{ phaseId: null, reps: 8, baseWeight: 100, incrementPerWeek: 2.5 }];
    expect(computeTarget('linear', targets, [], 1)).toEqual({ weight: 100, reps: 8, rir: null });
    expect(computeTarget('linear', targets, [], 4)).toEqual({ weight: 107.5, reps: 8, rir: null });
  });

  it('phased: picks the target row matching the current phase', () => {
    const phases: Phase[] = [
      { id: 1, name: 'Hypertrophy', startWeek: 1, endWeek: 3, color: null },
      { id: 2, name: 'Strength', startWeek: 4, endWeek: 5, color: null },
    ];
    const targets: SetTarget[] = [
      { phaseId: 1, reps: 15, baseWeight: 39, incrementPerWeek: 0, targetRir: 3 },
      { phaseId: 2, reps: 6, baseWeight: 149, incrementPerWeek: 0, targetRir: 1 },
    ];
    expect(computeTarget('phased', targets, phases, 2)).toEqual({ weight: 39, reps: 15, phase: 'Hypertrophy', rir: 3 });
    expect(computeTarget('phased', targets, phases, 4)).toEqual({ weight: 149, reps: 6, phase: 'Strength', rir: 1 });
  });

  it('phased: falls back to the first target row when no phase matches the week', () => {
    const phases: Phase[] = [{ id: 1, name: 'Hypertrophy', startWeek: 1, endWeek: 3, color: null }];
    const targets: SetTarget[] = [{ phaseId: 1, reps: 15, baseWeight: 39, incrementPerWeek: 0 }];
    expect(computeTarget('phased', targets, phases, 10)).toEqual({ weight: 39, reps: 15, phase: null, rir: null });
  });

  it('phased: applies increment_per_week within the phase', () => {
    const phases: Phase[] = [{ id: 1, name: 'Strength', startWeek: 4, endWeek: 6, color: null }];
    const targets: SetTarget[] = [{ phaseId: 1, reps: 6, baseWeight: 140, incrementPerWeek: 2 }];
    expect(computeTarget('phased', targets, phases, 6)).toEqual({ weight: 144, reps: 6, phase: 'Strength', rir: null });
  });
});

describe('effectiveWeek', () => {
  it('returns the raw week when no wave length is set', () => {
    expect(effectiveWeek(null, 7)).toBe(7);
    expect(effectiveWeek(undefined, 7)).toBe(7);
    expect(effectiveWeek(0, 7)).toBe(7);
  });

  it('wraps the week modulo the wave length', () => {
    expect(effectiveWeek(3, 1)).toBe(1);
    expect(effectiveWeek(3, 3)).toBe(3);
    expect(effectiveWeek(3, 4)).toBe(1);
    expect(effectiveWeek(3, 6)).toBe(3);
    expect(effectiveWeek(3, 7)).toBe(1);
  });

  it('lets a phased wave repeat across a longer cycle', () => {
    const phases: Phase[] = [
      { id: 1, name: 'W1', startWeek: 1, endWeek: 1, color: null },
      { id: 2, name: 'W2', startWeek: 2, endWeek: 2, color: null },
      { id: 3, name: 'W3', startWeek: 3, endWeek: 3, color: null },
    ];
    const targets: SetTarget[] = [
      { phaseId: 1, reps: 8, baseWeight: 80, incrementPerWeek: 0 },
      { phaseId: 2, reps: 6, baseWeight: 85, incrementPerWeek: 0 },
      { phaseId: 3, reps: 4, baseWeight: 90, incrementPerWeek: 0 },
    ];
    // week 4 of an 8-week cycle should replay W1's target, same as week 1 -
    // pass the raw absolute week plus waveLengthWeeks; computeTarget wraps internally.
    const week1 = computeTarget('phased', targets, phases, 1, 3);
    const week4 = computeTarget('phased', targets, phases, 4, 3);
    expect(week4).toEqual(week1);
    expect(week4.weight).toBe(80);
  });
});

describe('computeTarget with incrementPerRepeat (wave ratchet)', () => {
  const phases: Phase[] = [
    { id: 1, name: 'W1', startWeek: 1, endWeek: 1, color: null },
    { id: 2, name: 'W2', startWeek: 2, endWeek: 2, color: null },
    { id: 3, name: 'W3', startWeek: 3, endWeek: 3, color: null },
  ];
  const targets: SetTarget[] = [
    { phaseId: 1, reps: 8, baseWeight: 80, incrementPerWeek: 0, incrementPerRepeat: 2.5 },
    { phaseId: 2, reps: 6, baseWeight: 85, incrementPerWeek: 0, incrementPerRepeat: 2.5 },
    { phaseId: 3, reps: 4, baseWeight: 90, incrementPerWeek: 0, incrementPerRepeat: 2.5 },
  ];

  it('adds nothing on the first pass through the wave (repeatIndex 0)', () => {
    expect(computeTarget('phased', targets, phases, 1, 3).weight).toBe(80);
    expect(computeTarget('phased', targets, phases, 3, 3).weight).toBe(90);
  });

  it('adds incrementPerRepeat once per full wave repeat', () => {
    // weeks 4-6 = repeat 1 -> +2.5; weeks 7-9 = repeat 2 -> +5
    expect(computeTarget('phased', targets, phases, 4, 3).weight).toBe(82.5);
    expect(computeTarget('phased', targets, phases, 6, 3).weight).toBe(92.5);
    expect(computeTarget('phased', targets, phases, 7, 3).weight).toBe(85);
  });

  it('is a no-op without waveLengthWeeks (falls back to the first target row, no repeat math)', () => {
    // No waveLengthWeeks passed -> repeatIndex is always 0, and week 4 matches no phase
    // (phases only cover 1-3) so it falls back to targets[0] (W1, 80) unmodified.
    expect(computeTarget('phased', targets, phases, 4).weight).toBe(80);
  });

  it('linear progression ignores waveLengthWeeks entirely (keeps climbing, does not wrap)', () => {
    const linearTargets: SetTarget[] = [{ phaseId: null, reps: 8, baseWeight: 100, incrementPerWeek: 2.5 }];
    // Without the fix this would have wrapped week 7 back down via effectiveWeek(3, 7) = 1.
    expect(computeTarget('linear', linearTargets, [], 7, 3).weight).toBe(115);
  });
});
