export interface ToggleDoneInput {
  reps: string;
  weight: string;
  done: boolean;
}

export interface Soll {
  sollReps: number | null;
  sollWeight: number | null;
}

// Pure function, deliberately stateless: it recomputes intent from the *current*
// field values vs. the target (soll) every time, rather than remembering "did we
// just auto-fill this field". That statelessness is what makes it survive a
// save -> invalidate -> refetch cycle in between two clicks - an ephemeral
// "just auto-filled" flag would get wiped by the refetch before a second click
// could read it.
export function toggleDone(current: ToggleDoneInput, soll: Soll): ToggleDoneInput {
  const next = !current.done;
  let { reps, weight } = current;

  if (next) {
    // checking: prefill empty fields from soll
    if (reps === '' && soll.sollReps != null) reps = String(soll.sollReps);
    if (weight === '' && soll.sollWeight != null) weight = String(soll.sollWeight);
  } else {
    // unchecking: only clear a field if it still exactly matches soll (meaning it
    // was never edited away from the auto-filled default) - values the user
    // deliberately changed to something else are left untouched.
    if (reps !== '' && soll.sollReps != null && Number(reps) === soll.sollReps) reps = '';
    if (weight !== '' && soll.sollWeight != null && Number(weight) === soll.sollWeight) weight = '';
  }

  return { reps, weight, done: next };
}
