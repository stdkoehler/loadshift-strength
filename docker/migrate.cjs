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
    { weekday: 3, name: 'Pause', focus: '', is_rest: true, exercises: [] },
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
    { name: 'Hypertrophie', start_week: 1, end_week: 3, color: '#34d399', key: 'hyper' },
    { name: 'Kraft', start_week: 4, end_week: 5, color: '#f87171', key: 'kraft' },
    { name: 'Kraftausdauer', start_week: 6, end_week: 8, color: '#60a5fa', key: 'ausdauer' },
  ];

  const startDate = mondayOf(new Date());

  const tx = sqlite.transaction(() => {
    const cycleId = sqlite.prepare(
      'INSERT INTO cycles (name, start_date, length_weeks, is_active) VALUES (?, ?, ?, 1)'
    ).run('Zyklus 2026', startDate, 8).lastInsertRowid;

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
        let progType = 'konstant';
        if (ex.phased) progType = 'phasen';
        else if (!ex.ramp && ex.steig > 0) progType = 'linear';

        const exId = insEx.run(dayId, ex.name, progType, ex.pause ?? null, null, ei + 1).lastInsertRowid;

        if (ex.ramp) {
          ex.sets.forEach((s, si) => {
            const setId = insSet.run(exId, si + 1, s.role || null).lastInsertRowid;
            insTarget.run(setId, null, s.wdh, s.weight, 0);
          });
        } else if (ex.phased) {
          for (let si = 0; si < ex.saetze; si++) {
            const setId = insSet.run(exId, si + 1, null).lastInsertRowid;
            for (const p of PHASE_DEFS) {
              const [reps, weight] = ex[p.key];
              insTarget.run(setId, phaseIds[p.key], reps, weight, 0);
            }
          }
        } else {
          for (let si = 0; si < ex.saetze; si++) {
            const setId = insSet.run(exId, si + 1, ex.role || null).lastInsertRowid;
            insTarget.run(setId, null, ex.wdh, ex.start, ex.steig || 0);
          }
        }
      });
    });
  });
  tx();
  console.log('Seeded initial cycle "Zyklus 2026".');
}
