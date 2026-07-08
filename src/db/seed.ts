// Ported 1:1 from server/backend/src/seed.js so a fresh next-ref install shows
// the same reference plan as the original app instead of an empty state.
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

function mondayOf(date: Date): string {
  const d = new Date(date);
  const js = d.getDay(); // 0=Sun..6=Sat
  const diff = js === 0 ? -6 : 1 - js;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

type RampSet = { wdh: number; weight: number; role?: string };
type ExerciseDef =
  | { name: string; saetze: number; wdh: number; pause: number; start: number; steig: number; role?: string }
  | { ramp: true; name: string; pause: number; sets: RampSet[] }
  | { phased: true; name: string; saetze: number; pause: number; hyper: [number, number]; kraft: [number, number]; ausdauer: [number, number] };

type DayDef = { weekday: number; name: string; focus?: string; isRest?: boolean; exercises: ExerciseDef[] };

const DAYS: DayDef[] = [
  { weekday: 1, name: 'Brust / Schulter', focus: 'Kraft', exercises: [
    { name: 'LH Bankdruecken', saetze: 5, wdh: 5, pause: 2.5, start: 89, steig: 1.25 },
    { name: 'LH Bankdruecken eng', saetze: 3, wdh: 12, pause: 2.5, start: 69, steig: 1.25 },
    { name: 'KH Fly (2x25 kg Kurzhantel)', saetze: 3, wdh: 25, pause: 2.5, start: 25, steig: 1.25, role: 'Kraftausdauer-Touch' },
    { name: 'Seitheben', saetze: 3, wdh: 20, pause: 2.5, start: 15, steig: 0.5, role: 'Kraftausdauer-Touch' },
  ] },
  { weekday: 2, name: 'Leg', focus: 'Kraft', exercises: [
    { ramp: true, name: 'LH Kniebeugen', pause: 2.5, sets: [
      { wdh: 25, weight: 49, role: 'Warm-up' },
      { wdh: 6, weight: 149, role: 'Top-Satz' },
      { wdh: 6, weight: 149, role: 'Top-Satz' },
      { wdh: 8, weight: 119, role: 'Back-off' },
    ] },
    { name: 'Kreuzheben', saetze: 5, wdh: 6, pause: 2.5, start: 97, steig: 1.25 },
    { name: 'LH Wadenheben', saetze: 5, wdh: 20, pause: 2.5, start: 119, steig: 1.25, role: 'Kraftausdauer-Touch' },
    { name: 'Haengend Beinheben (Koerpergewicht)', saetze: 3, wdh: 25, pause: 2.5, start: 0, steig: 0 },
  ] },
  { weekday: 3, name: 'Pause', focus: '', isRest: true, exercises: [] },
  { weekday: 4, name: 'Ruecken', focus: 'Periodisiert', exercises: [
    { phased: true, name: 'Klimmzuege', saetze: 5, pause: 2.0, hyper: [10, 22], kraft: [5, 30], ausdauer: [18, 15] },
    { phased: true, name: 'LH Rudern', saetze: 5, pause: 2.0, hyper: [10, 72], kraft: [6, 78], ausdauer: [18, 55] },
    { phased: true, name: 'KH Rudern', saetze: 3, pause: 1.5, hyper: [12, 40], kraft: [7, 44], ausdauer: [22, 30] },
    { phased: true, name: 'Ueberzuege', saetze: 5, pause: 1.5, hyper: [14, 40], kraft: [9, 44], ausdauer: [20, 32] },
  ] },
  { weekday: 5, name: 'Brust', focus: 'Hypertrophie', exercises: [
    { name: 'LH Bankdruecken', saetze: 5, wdh: 12, pause: 2.5, start: 79, steig: 1.25 },
    { name: 'KH Bankdruecken (2x25 kg Kurzhantel)', saetze: 3, wdh: 15, pause: 2.5, start: 25, steig: 1.25 },
    { name: 'KH Schraegbankdruecken (2x25 kg Kurzhantel)', saetze: 3, wdh: 15, pause: 2.5, start: 25, steig: 1.25 },
    { ramp: true, name: 'LH Schraegbankdruecken', pause: 2.5, sets: [
      { wdh: 15, weight: 39, role: 'Warm-up' },
      { wdh: 10, weight: 49, role: 'Top-Satz' },
      { wdh: 10, weight: 49, role: 'Top-Satz' },
      { wdh: 10, weight: 49, role: 'Top-Satz' },
      { wdh: 10, weight: 49, role: 'Top-Satz' },
    ] },
    { name: 'Stirndruecken', saetze: 5, wdh: 18, pause: 2.5, start: 20, steig: 0.5, role: 'Kraftausdauer-Touch' },
  ] },
  { weekday: 6, name: 'Leg', focus: 'Hypertrophie', exercises: [
    { ramp: true, name: 'LH Kniebeugen', pause: 2.5, sets: [
      { wdh: 25, weight: 49, role: 'Warm-up' },
      { wdh: 25, weight: 69, role: 'Warm-up' },
      { wdh: 23, weight: 89, role: 'Warm-up' },
      { wdh: 18, weight: 109, role: 'Warm-up' },
      { wdh: 16, weight: 119, role: 'Top-Satz' },
      { wdh: 16, weight: 119, role: 'Top-Satz' },
    ] },
    { name: 'Kreuzheben', saetze: 5, wdh: 10, pause: 2.5, start: 92, steig: 2.5 },
    { name: 'LH Wadenheben', saetze: 5, wdh: 20, pause: 2.5, start: 119, steig: 1.25, role: 'Kraftausdauer-Touch' },
  ] },
  { weekday: 7, name: 'Schulter', focus: 'Periodisiert', exercises: [
    { phased: true, name: 'KH Schulterdruecken', saetze: 5, pause: 1.5, hyper: [11, 18], kraft: [6, 22], ausdauer: [22, 13] },
    { phased: true, name: 'LH Schulterdruecken', saetze: 5, pause: 1.5, hyper: [10, 32], kraft: [6, 36], ausdauer: [18, 24] },
    { phased: true, name: 'KH Seitheben', saetze: 5, pause: 1.5, hyper: [13, 15], kraft: [9, 17], ausdauer: [22, 11] },
    { phased: true, name: 'KH vorg. Seitheben', saetze: 4, pause: 1.5, hyper: [13, 23], kraft: [9, 26], ausdauer: [19, 18] },
  ] },
];

const PHASE_DEFS = [
  { name: 'Hypertrophie', startWeek: 1, endWeek: 3, color: '#34d399', key: 'hyper' as const },
  { name: 'Kraft', startWeek: 4, endWeek: 5, color: '#f87171', key: 'kraft' as const },
  { name: 'Kraftausdauer', startWeek: 6, endWeek: 8, color: '#60a5fa', key: 'ausdauer' as const },
];

export function seedIfEmpty(db: BetterSQLite3Database<typeof schema>) {
  const count = db.select().from(schema.cycles).all().length;
  if (count > 0) return;

  const startDate = mondayOf(new Date());

  db.transaction((tx) => {
    const cycleId = tx
      .insert(schema.cycles)
      .values({ name: 'Zyklus 2026', startDate, lengthWeeks: 8, isActive: true })
      .returning({ id: schema.cycles.id })
      .get().id;

    const phaseIds: Record<'hyper' | 'kraft' | 'ausdauer', number> = { hyper: 0, kraft: 0, ausdauer: 0 };
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
        let progressionType = 'konstant';
        if ('phased' in ex) progressionType = 'phasen';
        else if (!('ramp' in ex) && ex.steig > 0) progressionType = 'linear';

        const exId = tx
          .insert(schema.exercises)
          .values({ dayId, name: ex.name, progressionType, pauseMin: ex.pause ?? null, notes: null, orderIndex: ei + 1 })
          .returning({ id: schema.exercises.id })
          .get().id;

        if ('ramp' in ex) {
          ex.sets.forEach((s, si) => {
            const setId = tx
              .insert(schema.sets)
              .values({ exerciseId: exId, setIndex: si + 1, role: s.role || null })
              .returning({ id: schema.sets.id })
              .get().id;
            tx.insert(schema.setTargets).values({ setId, phaseId: null, reps: s.wdh, baseWeight: s.weight, incrementPerWeek: 0 }).run();
          });
        } else if ('phased' in ex) {
          for (let si = 0; si < ex.saetze; si++) {
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
          for (let si = 0; si < ex.saetze; si++) {
            const setId = tx
              .insert(schema.sets)
              .values({ exerciseId: exId, setIndex: si + 1, role: ex.role || null })
              .returning({ id: schema.sets.id })
              .get().id;
            tx.insert(schema.setTargets).values({ setId, phaseId: null, reps: ex.wdh, baseWeight: ex.start, incrementPerWeek: ex.steig || 0 }).run();
          }
        }
      });
    });
  });

  console.log('Seeded initial cycle "Zyklus 2026".');
}
