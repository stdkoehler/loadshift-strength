// Runs at container start, before the server, against the mounted DATA_DIR volume.
// Plain CommonJS (no TS, no schema import) so it can run with only the pruned
// node_modules that Next's `output: standalone` trace already includes - no
// separate install step needed in the runtime image.
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const { migrate } = require('drizzle-orm/better-sqlite3/migrator');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'workout.sqlite');

const sqlite = new Database(DB_PATH);
// DELETE (not WAL) - see src/db/client.ts for why: WAL's -shm file needs mmap-based
// locking that Docker Desktop bind mounts (and NAS SMB/NFS mounts) don't support.
sqlite.pragma('journal_mode = DELETE');
sqlite.pragma('foreign_keys = ON');
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: path.join(__dirname, '..', 'drizzle') });
seedIfEmpty(sqlite);
sqlite.close();
console.log('Migrations applied.');

// Plain-SQL port of src/db/seed.ts - kept as raw better-sqlite3 statements (not
// Drizzle query builder) to match this script's no-schema-import constraint,
// so a fresh container volume shows the same reference plan as the original app.
function seedIfEmpty(sqlite) {
  const count = sqlite.prepare('SELECT COUNT(*) AS c FROM cycles').get().c;
  if (count > 0) return;

  function mondayOf(date) {
    const d = new Date(date);
    const js = d.getDay();
    const diff = js === 0 ? -6 : 1 - js;
    d.setDate(d.getDate() + diff);
    return d.toISOString().slice(0, 10);
  }

  const DAYS = [
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
    { weekday: 3, name: 'Rest', focus: '', is_rest: true, exercises: [] },
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
    { name: 'Hypertrophy', start_week: 1, end_week: 3, color: '#34d399', key: 'hyper' },
    { name: 'Strength', start_week: 4, end_week: 5, color: '#f87171', key: 'strength' },
    { name: 'Strength-Endurance', start_week: 6, end_week: 8, color: '#60a5fa', key: 'endurance' },
  ];

  const startDate = mondayOf(new Date());

  const tx = sqlite.transaction(() => {
    const cycleId = sqlite.prepare(
      'INSERT INTO cycles (name, start_date, length_weeks, is_active) VALUES (?, ?, ?, 1)'
    ).run('Cycle 2026', startDate, 8).lastInsertRowid;

    const phaseIds = {};
    PHASE_DEFS.forEach((p, i) => {
      phaseIds[p.key] = sqlite.prepare(
        'INSERT INTO phases (cycle_id, name, start_week, end_week, color, order_index) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(cycleId, p.name, p.start_week, p.end_week, p.color, i + 1).lastInsertRowid;
    });

    const insDay = sqlite.prepare(
      'INSERT INTO days (cycle_id, weekday, name, focus, is_rest, order_index) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const insEx = sqlite.prepare(
      'INSERT INTO exercises (day_id, name, progression_type, pause_min, notes, order_index) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const insSet = sqlite.prepare('INSERT INTO sets (exercise_id, set_index, role) VALUES (?, ?, ?)');
    const insTarget = sqlite.prepare(
      'INSERT INTO set_targets (set_id, phase_id, reps, base_weight, increment_per_week) VALUES (?, ?, ?, ?, ?)'
    );

    DAYS.forEach((d, di) => {
      const dayId = insDay.run(cycleId, d.weekday, d.name, d.focus || null, d.is_rest ? 1 : 0, di + 1).lastInsertRowid;
      d.exercises.forEach((ex, ei) => {
        let progType = 'constant';
        if (ex.phased) progType = 'phased';
        else if (!ex.ramp && ex.increment > 0) progType = 'linear';

        const exId = insEx.run(dayId, ex.name, progType, ex.rest ?? null, null, ei + 1).lastInsertRowid;

        if (ex.ramp) {
          ex.sets.forEach((s, si) => {
            const setId = insSet.run(exId, si + 1, s.role || null).lastInsertRowid;
            insTarget.run(setId, null, s.reps, s.weight, 0);
          });
        } else if (ex.phased) {
          for (let si = 0; si < ex.sets; si++) {
            const setId = insSet.run(exId, si + 1, null).lastInsertRowid;
            for (const p of PHASE_DEFS) {
              const [reps, weight] = ex[p.key];
              insTarget.run(setId, phaseIds[p.key], reps, weight, 0);
            }
          }
        } else {
          for (let si = 0; si < ex.sets; si++) {
            const setId = insSet.run(exId, si + 1, ex.role || null).lastInsertRowid;
            insTarget.run(setId, null, ex.reps, ex.start, ex.increment || 0);
          }
        }
      });
    });
  });
  tx();
  console.log('Seeded initial cycle "Cycle 2026".');
}
