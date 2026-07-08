import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';
import { integer, real, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

export const cycles = sqliteTable('cycles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  // Null for templates - a template has no calendar placement, only a loaded
  // instance (isTemplate: false) does.
  startDate: text('start_date'),
  lengthWeeks: integer('length_weeks').notNull().default(8),
  // If set, phasen-progression targets repeat every N weeks instead of running once
  // linearly across the whole cycle (see effectiveWeek() in lib/progression.ts).
  waveLengthWeeks: integer('wave_length_weeks'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(false),
  // A template is reusable structure (days/exercises/sets/phases) with no start date
  // and never logged against directly. "Loading" a template deep-copies it into a new,
  // dated, non-template cycle - see server/actions/templates.actions.ts.
  isTemplate: integer('is_template', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const phases = sqliteTable('phases', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cycleId: integer('cycle_id').notNull().references(() => cycles.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  startWeek: integer('start_week').notNull(),
  endWeek: integer('end_week').notNull(),
  color: text('color'),
  orderIndex: integer('order_index').notNull(),
});

export const days = sqliteTable('days', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cycleId: integer('cycle_id').notNull().references(() => cycles.id, { onDelete: 'cascade' }),
  weekday: integer('weekday').notNull(),
  name: text('name').notNull(),
  focus: text('focus'),
  isRest: integer('is_rest', { mode: 'boolean' }).notNull().default(false),
  orderIndex: integer('order_index').notNull(),
}, (t) => [unique('days_cycle_weekday_unique').on(t.cycleId, t.weekday)]);

export const exercises = sqliteTable('exercises', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  dayId: integer('day_id').notNull().references(() => days.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  progressionType: text('progression_type').notNull().default('konstant'), // 'konstant' | 'linear' | 'phasen'
  pauseMin: real('pause_min'),
  notes: text('notes'),
  orderIndex: integer('order_index').notNull(),
});

export const sets = sqliteTable('sets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  exerciseId: integer('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
  setIndex: integer('set_index').notNull(),
  role: text('role'),
});

export const setTargets = sqliteTable('set_targets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  setId: integer('set_id').notNull().references(() => sets.id, { onDelete: 'cascade' }),
  phaseId: integer('phase_id').references(() => phases.id, { onDelete: 'cascade' }),
  reps: integer('reps'),
  baseWeight: real('base_weight'),
  incrementPerWeek: real('increment_per_week').notNull().default(0),
  // Intended reps-in-reserve/RPE for this target. Store-and-display only - not used in
  // any weight/reps computation.
  targetRir: real('target_rir'),
  // For phasen progression on a wave-repeating cycle (cycles.waveLengthWeeks): added to
  // baseWeight once per full wave repeat, so the same 3-week (etc.) wave shape ratchets
  // up instead of replaying identically forever. No-op outside phasen/wave-repeat.
  incrementPerRepeat: real('increment_per_repeat').notNull().default(0),
});

export const logs = sqliteTable('logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cycleId: integer('cycle_id').notNull().references(() => cycles.id, { onDelete: 'cascade' }),
  exerciseId: integer('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
  setIndex: integer('set_index').notNull(),
  logDate: text('log_date').notNull(),
  weekNumber: integer('week_number').notNull(),
  actualReps: integer('actual_reps'),
  actualWeight: real('actual_weight'),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
  // Snapshot of the planned (soll) values at the moment this row was written, so a
  // day's history stays accurate even if the exercise's targets are edited later.
  sollReps: integer('soll_reps'),
  sollWeight: real('soll_weight'),
  sollRir: real('soll_rir'),
}, (t) => [unique('logs_exercise_set_date_unique').on(t.exerciseId, t.setIndex, t.logDate)]);

// ---------- relations (for the relational query API: db.query.x.findMany({ with: {...} })) ----------

export const cyclesRelations = relations(cycles, ({ many }) => ({
  phases: many(phases),
  days: many(days),
  logs: many(logs),
}));

export const phasesRelations = relations(phases, ({ one, many }) => ({
  cycle: one(cycles, { fields: [phases.cycleId], references: [cycles.id] }),
  targets: many(setTargets),
}));

export const daysRelations = relations(days, ({ one, many }) => ({
  cycle: one(cycles, { fields: [days.cycleId], references: [cycles.id] }),
  exercises: many(exercises),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  day: one(days, { fields: [exercises.dayId], references: [days.id] }),
  sets: many(sets),
  logs: many(logs),
}));

export const setsRelations = relations(sets, ({ one, many }) => ({
  exercise: one(exercises, { fields: [sets.exerciseId], references: [exercises.id] }),
  targets: many(setTargets),
}));

export const setTargetsRelations = relations(setTargets, ({ one }) => ({
  set: one(sets, { fields: [setTargets.setId], references: [sets.id] }),
  phase: one(phases, { fields: [setTargets.phaseId], references: [phases.id] }),
}));

export const logsRelations = relations(logs, ({ one }) => ({
  cycle: one(cycles, { fields: [logs.cycleId], references: [cycles.id] }),
  exercise: one(exercises, { fields: [logs.exerciseId], references: [exercises.id] }),
}));
