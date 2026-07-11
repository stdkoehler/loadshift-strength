export interface ToggleDoneInput {
  reps: string;
  weight: string;
  done: boolean;
}

export interface Target {
  targetReps: number | null;
  targetWeight: number | null;
}

// Pure function, deliberately stateless: it recomputes intent from the *current*
// field values vs. the target every time, rather than remembering "did we
// just auto-fill this field". That statelessness is what makes it survive a
// save -> invalidate -> refetch cycle in between two clicks - an ephemeral
// "just auto-filled" flag would get wiped by the refetch before a second click
// could read it.
export function toggleDone(current: ToggleDoneInput, target: Target): ToggleDoneInput {
  const next = !current.done;
  let { reps, weight } = current;

  if (next) {
    // checking: prefill empty fields from target
    if (reps === '' && target.targetReps != null) reps = String(target.targetReps);
    if (weight === '' && target.targetWeight != null) weight = String(target.targetWeight);
  } else {
    // unchecking: only clear a field if it still exactly matches target (meaning it
    // was never edited away from the auto-filled default) - values the user
    // deliberately changed to something else are left untouched.
    if (reps !== '' && target.targetReps != null && Number(reps) === target.targetReps) reps = '';
    if (weight !== '' && target.targetWeight != null && Number(weight) === target.targetWeight) weight = '';
  }

  return { reps, weight, done: next };
}
