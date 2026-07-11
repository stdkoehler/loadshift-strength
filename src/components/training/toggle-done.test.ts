import { describe, expect, it } from 'vitest';
import { toggleDone } from './toggle-done';

const target = { targetReps: 8, targetWeight: 89 };

describe('toggleDone', () => {
  it('check on empty fields: prefills from target', () => {
    const result = toggleDone({ reps: '', weight: '', done: false }, target);
    expect(result).toEqual({ reps: '8', weight: '89', done: true });
  });

  it('check when a field already has a user value: leaves it alone', () => {
    const result = toggleDone({ reps: '10', weight: '', done: false }, target);
    expect(result).toEqual({ reps: '10', weight: '89', done: true });
  });

  it('uncheck after a plain target-prefill: clears back to empty (clean reset)', () => {
    const checked = toggleDone({ reps: '', weight: '', done: false }, target);
    const unchecked = toggleDone(checked, target);
    expect(unchecked).toEqual({ reps: '', weight: '', done: false });
  });

  it('uncheck when the user edited a value away from target: leaves it untouched', () => {
    const edited = { reps: '8', weight: '95', done: true }; // weight deliberately different from target (89)
    const unchecked = toggleDone(edited, target);
    expect(unchecked).toEqual({ reps: '', weight: '95', done: false });
  });

  it('uncheck when both values were manually edited: neither is cleared', () => {
    const edited = { reps: '12', weight: '95', done: true };
    const unchecked = toggleDone(edited, target);
    expect(unchecked).toEqual({ reps: '12', weight: '95', done: false });
  });

  it('handles missing target values gracefully (no target defined)', () => {
    const result = toggleDone({ reps: '', weight: '', done: false }, { targetReps: null, targetWeight: null });
    expect(result).toEqual({ reps: '', weight: '', done: true });
  });
});
