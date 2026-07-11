// Reference plan seeded into a fresh install so the app doesn't start empty.
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

function mondayOf(date: Date): string {
  const d = new Date(date);
  const js = d.getDay(); // 0=Sun..6=Sat
  const diff = js === 0 ? -6 : 1 - js;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

type RampSet = { reps: number; weight: number; role?: string };
type ExerciseDef =
  | { name: string; sets: number; reps: number; rest: number; start: number; increment: number; role?: string }
  | { ramp: true; name: string; rest: number; sets: RampSet[] }
  | { phased: true; name: string; sets: number; rest: number; hyper: [number, number]; strength: [number, number]; endurance: [number, number] };

type DayDef = { weekday: number; name: string; focus?: string; isRest?: boolean; exercises: ExerciseDef[] };

const DAYS: DayDef[] = [
  { weekday: 1, name: 'Chest / Shoulders', focus: 'Strength', exercises: [
    { name: 'Barbell Bench Press', sets: 5, reps: 5, rest: 2.5, start: 89, increment: 1.25 },
    { name: 'Barbell Close-Grip Bench Press', sets: 3, reps: 12, rest: 2.5, start: 69, increment: 1.25 },
    { name: 'Dumbbell Fly (2x25 kg)', sets: 3, reps: 25, rest: 2.5, start: 25, increment: 1.25, role: 'Endurance-Touch' },
    { name: 'Lateral Raise', sets: 3, reps: 20, rest: 2.5, start: 15, increment: 0.5, role: 'Endurance-Touch' },
  ] },
  { weekday: 2, name: 'Legs', focus: 'Strength', exercises: [
    { ramp: true, name: 'Barbell Squat', rest: 2.5, sets: [
      { reps: 25, weight: 49, role: 'Warm-up' },
      { reps: 6, weight: 149, role: 'Top-Set' },
      { reps: 6, weight: 149, role: 'Top-Set' },
      { reps: 8, weight: 119, role: 'Back-off' },
    ] },
    { name: 'Deadlift', sets: 5, reps: 6, rest: 2.5, start: 97, increment: 1.25 },
    { name: 'Barbell Calf Raise', sets: 5, reps: 20, rest: 2.5, start: 119, increment: 1.25, role: 'Endurance-Touch' },
    { name: 'Hanging Leg Raise (Bodyweight)', sets: 3, reps: 25, rest: 2.5, start: 0, increment: 0 },
  ] },
  { weekday: 3, name: 'Rest', focus: '', isRest: true, exercises: [] },
  { weekday: 4, name: 'Back', focus: 'Periodized', exercises: [
    { phased: true, name: 'Pull-Ups', sets: 5, rest: 2.0, hyper: [10, 22], strength: [5, 30], endurance: [18, 15] },
    { phased: true, name: 'Barbell Row', sets: 5, rest: 2.0, hyper: [10, 72], strength: [6, 78], endurance: [18, 55] },
    { phased: true, name: 'Dumbbell Row', sets: 3, rest: 1.5, hyper: [12, 40], strength: [7, 44], endurance: [22, 30] },
    { phased: true, name: 'Pullover', sets: 5, rest: 1.5, hyper: [14, 40], strength: [9, 44], endurance: [20, 32] },
  ] },
  { weekday: 5, name: 'Chest', focus: 'Hypertrophy', exercises: [
    { name: 'Barbell Bench Press', sets: 5, reps: 12, rest: 2.5, start: 79, increment: 1.25 },
    { name: 'Dumbbell Bench Press (2x25 kg)', sets: 3, reps: 15, rest: 2.5, start: 25, increment: 1.25 },
    { name: 'Dumbbell Incline Bench Press (2x25 kg)', sets: 3, reps: 15, rest: 2.5, start: 25, increment: 1.25 },
    { ramp: true, name: 'Barbell Incline Bench Press', rest: 2.5, sets: [
      { reps: 15, weight: 39, role: 'Warm-up' },
      { reps: 10, weight: 49, role: 'Top-Set' },
      { reps: 10, weight: 49, role: 'Top-Set' },
      { reps: 10, weight: 49, role: 'Top-Set' },
      { reps: 10, weight: 49, role: 'Top-Set' },
    ] },
    { name: 'Skull Crushers', sets: 5, reps: 18, rest: 2.5, start: 20, increment: 0.5, role: 'Endurance-Touch' },
  ] },
  { weekday: 6, name: 'Legs', focus: 'Hypertrophy', exercises: [
    { ramp: true, name: 'Barbell Squat', rest: 2.5, sets: [
      { reps: 25, weight: 49, role: 'Warm-up' },
      { reps: 25, weight: 69, role: 'Warm-up' },
      { reps: 23, weight: 89, role: 'Warm-up' },
      { reps: 18, weight: 109, role: 'Warm-up' },
      { reps: 16, weight: 119, role: 'Top-Set' },
      { reps: 16, weight: 119, role: 'Top-Set' },
    ] },
    { name: 'Deadlift', sets: 5, reps: 10, rest: 2.5, start: 92, increment: 2.5 },
    { name: 'Barbell Calf Raise', sets: 5, reps: 20, rest: 2.5, start: 119, increment: 1.25, role: 'Endurance-Touch' },
  ] },
  { weekday: 7, name: 'Shoulders', focus: 'Periodized', exercises: [
    { phased: true, name: 'Dumbbell Shoulder Press', sets: 5, rest: 1.5, hyper: [11, 18], strength: [6, 22], endurance: [22, 13] },
    { phased: true, name: 'Barbell Shoulder Press', sets: 5, rest: 1.5, hyper: [10, 32], strength: [6, 36], endurance: [18, 24] },
    { phased: true, name: 'Dumbbell Lateral Raise', sets: 5, rest: 1.5, hyper: [13, 15], strength: [9, 17], endurance: [22, 11] },
    { phased: true, name: 'Dumbbell Rear Delt Raise', sets: 4, rest: 1.5, hyper: [13, 23], strength: [9, 26], endurance: [19, 18] },
  ] },
];

const PHASE_DEFS = [
  { name: 'Hypertrophy', startWeek: 1, endWeek: 3, color: '#34d399', key: 'hyper' as const },
  { name: 'Strength', startWeek: 4, endWeek: 5, color: '#f87171', key: 'strength' as const },
  { name: 'Strength-Endurance', startWeek: 6, endWeek: 8, color: '#60a5fa', key: 'endurance' as const },
];

export function seedIfEmpty(db: BetterSQLite3Database<typeof schema>) {
  const count = db.select().from(schema.cycles).all().length;
  if (count > 0) return;

  const startDate = mondayOf(new Date());

  db.transaction((tx) => {
    const cycleId = tx
      .insert(schema.cycles)
      .values({ name: 'Cycle 2026', startDate, lengthWeeks: 8, isActive: true })
      .returning({ id: schema.cycles.id })
      .get().id;

    const phaseIds: Record<'hyper' | 'strength' | 'endurance', number> = { hyper: 0, strength: 0, endurance: 0 };
    PHASE_DEFS.forEach((p, i) => {
      phaseIds[p.key] = tx
        .insert(schema.phases)
        .values({ cycleId, name: p.name, startWeek: p.startWeek, endWeek: p.endWeek, color: p.color, orderIndex: i + 1 })
        .returning({ id: schema.phases.id })
        .get().id;
    });

    DAYS.forEach((d, di) => {
      const dayId = tx
        .insert(schema.days)
        .values({ cycleId, weekday: d.weekday, name: d.name, focus: d.focus || null, isRest: !!d.isRest, orderIndex: di + 1 })
        .returning({ id: schema.days.id })
        .get().id;

      d.exercises.forEach((ex, ei) => {
        let progressionType = 'constant';
        if ('phased' in ex) progressionType = 'phased';
        else if (!('ramp' in ex) && ex.increment > 0) progressionType = 'linear';

        const exId = tx
          .insert(schema.exercises)
          .values({ dayId, name: ex.name, progressionType, pauseMin: ex.rest ?? null, notes: null, orderIndex: ei + 1 })
          .returning({ id: schema.exercises.id })
          .get().id;

        if ('ramp' in ex) {
          ex.sets.forEach((s, si) => {
            const setId = tx
              .insert(schema.sets)
              .values({ exerciseId: exId, setIndex: si + 1, role: s.role || null })
              .returning({ id: schema.sets.id })
              .get().id;
            tx.insert(schema.setTargets).values({ setId, phaseId: null, reps: s.reps, baseWeight: s.weight, incrementPerWeek: 0 }).run();
          });
        } else if ('phased' in ex) {
          for (let si = 0; si < ex.sets; si++) {
            const setId = tx
              .insert(schema.sets)
              .values({ exerciseId: exId, setIndex: si + 1, role: null })
              .returning({ id: schema.sets.id })
              .get().id;
            for (const p of PHASE_DEFS) {
              const [reps, weight] = ex[p.key];
              tx.insert(schema.setTargets).values({ setId, phaseId: phaseIds[p.key], reps, baseWeight: weight, incrementPerWeek: 0 }).run();
            }
          }
        } else {
          for (let si = 0; si < ex.sets; si++) {
            const setId = tx
              .insert(schema.sets)
              .values({ exerciseId: exId, setIndex: si + 1, role: ex.role || null })
              .returning({ id: schema.sets.id })
              .get().id;
            tx.insert(schema.setTargets).values({ setId, phaseId: null, reps: ex.reps, baseWeight: ex.start, incrementPerWeek: ex.increment || 0 }).run();
          }
        }
      });
    });
  });

  console.log('Seeded initial cycle "Cycle 2026".');
}
