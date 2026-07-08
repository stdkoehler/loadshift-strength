// Date <-> cycle-week helpers and Soll (target) computation.

export type ProgressionType = 'konstant' | 'linear' | 'phasen';

export interface Phase {
  id: number;
  name: string;
  startWeek: number;
  endWeek: number;
  color: string | null;
}

export interface SetTarget {
  phaseId: number | null;
  reps: number | null;
  baseWeight: number | null;
  incrementPerWeek: number;
  targetRir?: number | null;
  incrementPerRepeat?: number;
}

export interface TargetResult {
  weight: number | null;
  reps: number | null;
  phase?: string | null;
  rir: number | null;
}

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Monday-based week number of `date` within a cycle starting at `startDate` (ISO strings).
// Week 1 = the 7 days beginning on startDate. Returns integer (can be <1 or >length).
export function weekNumberFor(startDateIso: string, dateIso: string): number {
  const start = new Date(startDateIso + 'T00:00:00Z');
  const date = new Date(dateIso + 'T00:00:00Z');
  const diffDays = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return Math.floor(diffDays / 7) + 1;
}

// weekday 1=Mon .. 7=Sun
export function weekdayFor(dateIso: string): number {
  const d = new Date(dateIso + 'T00:00:00Z');
  const js = d.getUTCDay(); // 0=Sun..6=Sat
  return js === 0 ? 7 : js;
}

// Generic over P so callers can pass either the plain `Phase` shape or a full DB row
// (which has extra columns) and get that same richer type back out.
export function phaseForWeek<P extends Phase>(phases: P[], week: number): P | null {
  for (const p of phases) {
    if (week >= p.startWeek && week <= p.endWeek) return p;
  }
  return null;
}

export function round(n: number): number {
  return Math.round(n * 100) / 100;
}

// If a cycle has a waveLengthWeeks set, phasen targets repeat every N weeks instead of
// running once across the whole cycle - e.g. a 3-week DUP wave (waveLengthWeeks: 3) run
// over a 12-week cycle plays week 1/2/3, then 1/2/3 again for weeks 4-6, etc. Phases are
// still defined once with startWeek/endWeek inside that N-week window (1..N).
// Absolute week numbers (for log dates, "week X of Y" labels) are untouched - only the
// week passed to phaseForWeek/computeTarget is wrapped.
export function effectiveWeek(waveLengthWeeks: number | null | undefined, week: number): number {
  if (!waveLengthWeeks || waveLengthWeeks <= 0) return week;
  if (week < 1) return week;
  return ((week - 1) % waveLengthWeeks) + 1;
}

// Compute target weight & reps for a single set at a given cycle week.
// setTargets: array of set_target rows for this set (1 row for konstant/linear, N rows keyed by phaseId for phasen)
// `week` is the raw absolute cycle week (NOT pre-wrapped) - only the phasen branch below
// wraps it via waveLengthWeeks; linear/konstant always use the absolute week, since their
// progression should keep climbing across a cycle regardless of any wave repeat setting.
export function computeTarget<T extends SetTarget, P extends Phase>(
  progressionType: ProgressionType,
  setTargets: T[],
  phases: P[],
  week: number,
  waveLengthWeeks?: number | null
): TargetResult {
  if (!setTargets || setTargets.length === 0) return { weight: null, reps: null, rir: null };

  if (progressionType === 'phasen') {
    const effWeek = effectiveWeek(waveLengthWeeks, week);
    const phase = phaseForWeek(phases, effWeek);
    let t = phase ? setTargets.find((x) => x.phaseId === phase.id) : undefined;
    if (!t) t = setTargets[0]; // fallback
    const withinPhaseWeeks = phase ? effWeek - phase.startWeek : 0;
    // Which repeat of the wave we're on (0 for the first pass through weeks 1..N).
    // incrementPerRepeat is added once per repeat, so the wave ratchets up instead of
    // replaying the exact same numbers forever.
    const repeatIndex = waveLengthWeeks && waveLengthWeeks > 0 ? Math.floor((week - 1) / waveLengthWeeks) : 0;
    const weight =
      t.baseWeight == null
        ? null
        : round(
            t.baseWeight +
              Math.max(0, withinPhaseWeeks) * (t.incrementPerWeek || 0) +
              repeatIndex * (t.incrementPerRepeat || 0)
          );
    return { weight, reps: t.reps ?? null, phase: phase ? phase.name : null, rir: t.targetRir ?? null };
  }

  const t = setTargets[0];
  if (progressionType === 'linear') {
    const weight = t.baseWeight == null ? null : round(t.baseWeight + (week - 1) * (t.incrementPerWeek || 0));
    return { weight, reps: t.reps ?? null, rir: t.targetRir ?? null };
  }
  // konstant
  return { weight: t.baseWeight ?? null, reps: t.reps ?? null, rir: t.targetRir ?? null };
}
