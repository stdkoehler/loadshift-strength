'use client';

import { useState } from 'react';
import { computeTarget, weekNumberFor, weekdayFor, effectiveWeek, phaseForWeek } from '@/lib/progression';
import { todayIso } from '@/lib/date';
import type { FullPlan, ExerciseWithSets, Phase } from '@/lib/types';

const WD: Record<number, string> = { 1: 'Mo', 2: 'Di', 3: 'Mi', 4: 'Do', 5: 'Fr', 6: 'Sa', 7: 'So' };
const FALLBACK_COLORS = ['#2a78d6', '#eb6834', '#eda100', '#1baf7a', '#4a3aa7', '#e34948'];

// Sequential emerald ramp (the app's signature accent) tuned for the dark surface.
// Both ends stay clearly green - low is muted, not near-black (which would read as
// "no data", same as the #3f3f46 no-value gray), high is vivid, not near-white.
// The midpoint is chosen so each half changes by roughly the same amount (~90 units
// of RGB distance) - an earlier version placed the midpoint too close to the top
// stop, which flattened contrast across the rep range where almost all real sets
// land (5-12 reps), making wave-to-wave differences invisible even though the ramp
// looked fine end-to-end.
const HEAT_RAMP: [number, [number, number, number]][] = [
  [0, [25, 70, 55]], // muted forest-teal (low)
  [0.5, [18, 150, 100]], // mid vivid green
  [1, [52, 211, 153]], // emerald-400, vivid but saturated (high)
];

function heatColor(t: number): string {
  const clamped = Math.min(1, Math.max(0, t));
  let lo = HEAT_RAMP[0];
  let hi = HEAT_RAMP[HEAT_RAMP.length - 1];
  for (let i = 0; i < HEAT_RAMP.length - 1; i++) {
    if (clamped >= HEAT_RAMP[i][0] && clamped <= HEAT_RAMP[i + 1][0]) {
      lo = HEAT_RAMP[i];
      hi = HEAT_RAMP[i + 1];
      break;
    }
  }
  const span = hi[0] - lo[0] || 1;
  const localT = (clamped - lo[0]) / span;
  const [r1, g1, b1] = lo[1];
  const [r2, g2, b2] = hi[1];
  const r = Math.round(r1 + (r2 - r1) * localT);
  const g = Math.round(g1 + (g2 - g1) * localT);
  const b = Math.round(b1 + (b2 - b1) * localT);
  return `rgb(${r}, ${g}, ${b})`;
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '–';
  return (Math.round(n * 100) / 100).toString();
}

// Stimulus intensity by rep count, on a fixed scale (not per-exercise-relative):
// few reps = heavy/strength work, many reps = light/endurance work. This is what
// "heavy vs. light" actually means - raw kg is meaningless in isolation (25kg is
// heavy for a lateral raise, trivial for a deadlift), and reps are reliably filled
// in on every set (unlike RIR, which is sparse and doesn't disambiguate on its own -
// 2 RIR happens at both 5 reps and 20 reps depending on load).
// The ceiling is deliberately low (20, not e.g. 30): almost all working sets in a
// plan fall in the 1-20 range, so that's the span that needs the ramp's full
// resolution to show wave-to-wave differences (e.g. 8 vs. 9 vs. 10 reps). Anything
// at or above 20 reps is uniformly "light/endurance" - finer distinction there
// (20 vs. 25 vs. 30) isn't useful and would just steal resolution from the range
// that matters.
const REP_FLOOR = 1;
const REP_CEIL = 20;

function intensityFromReps(reps: number): number {
  const clamped = Math.min(REP_CEIL, Math.max(REP_FLOOR, reps));
  return 1 - (clamped - REP_FLOOR) / (REP_CEIL - REP_FLOOR);
}

// Prefer the top (working) set over warm-up ramp sets, matching the logic used for
// the exercise-detail progress charts - warm-up weight/reps would otherwise dilute
// the at-a-glance read of how the plan actually progresses.
function primarySet(ex: ExerciseWithSets) {
  const working = ex.sets.filter((s) => s.role !== 'Warm-up');
  const pool = working.length ? working : ex.sets;
  return pool.find((s) => s.role === 'Top-Satz') ?? pool[0];
}

interface WeekCell {
  week: number;
  weight: number | null;
  reps: number | null;
  phase: string | null;
}

function weeklyValues(ex: ExerciseWithSets, phases: Phase[], waveLengthWeeks: number | null, lengthWeeks: number): WeekCell[] {
  const set = primarySet(ex);
  if (!set || !set.targets.length) return [];
  const cells: WeekCell[] = [];
  for (let week = 1; week <= lengthWeeks; week++) {
    const r = computeTarget(ex.progressionType as 'konstant' | 'linear' | 'phasen', set.targets, phases, week, waveLengthWeeks);
    cells.push({ week, weight: r.weight, reps: r.reps, phase: r.phase ?? null });
  }
  return cells;
}

function ExerciseHeatRow({
  ex,
  phases,
  waveLengthWeeks,
  lengthWeeks,
  markerWeek,
}: {
  ex: ExerciseWithSets;
  phases: Phase[];
  waveLengthWeeks: number | null;
  lengthWeeks: number;
  markerWeek: number | null;
}) {
  const [activeWeek, setActiveWeek] = useState<number | null>(null);
  const cells = weeklyValues(ex, phases, waveLengthWeeks, lengthWeeks);

  const shown = cells.find((c) => c.week === (activeWeek ?? markerWeek)) ?? null;

  return (
    <li className="text-[11px] leading-tight">
      <div className="truncate text-neutral-200">{ex.name}</div>
      {cells.length === 0 ? (
        <div className="text-neutral-500">–</div>
      ) : (
        <>
          <div className="mt-1 flex h-3.5 w-full gap-px">
            {cells.map((c) => {
              const isMarker = c.week === markerWeek;
              return (
                <button
                  key={c.week}
                  type="button"
                  tabIndex={0}
                  onMouseEnter={() => setActiveWeek(c.week)}
                  onMouseLeave={() => setActiveWeek(null)}
                  onFocus={() => setActiveWeek(c.week)}
                  onBlur={() => setActiveWeek(null)}
                  onClick={() => setActiveWeek(c.week)}
                  aria-label={`Woche ${c.week}${c.phase ? ` · ${c.phase}` : ''}: ${fmt(c.weight)}kg × ${c.reps ?? '–'}`}
                  className={`min-w-0 flex-1 rounded-[2px] outline-none ${isMarker ? 'ring-1 ring-neutral-100/70' : ''}`}
                  style={{ background: c.reps == null ? '#3f3f46' : heatColor(intensityFromReps(c.reps)) }}
                />
              );
            })}
          </div>
          <div className="mt-0.5 h-3 truncate text-neutral-500">
            {shown ? (
              <>
                Wo {shown.week}
                {shown.phase ? ` · ${shown.phase}` : ''} · {fmt(shown.weight)}kg × {shown.reps ?? '–'}
              </>
            ) : (
              ' '
            )}
          </div>
        </>
      )}
    </li>
  );
}

export function PlanOverview({ plan }: { plan: FullPlan }) {
  const { cycle, phases, days } = plan;

  const today = todayIso();
  const absWeek = cycle.startDate ? weekNumberFor(cycle.startDate, today) : null;
  const todayWeekday = weekdayFor(today);

  const totalWeeks = cycle.waveLengthWeeks && cycle.waveLengthWeeks > 0 ? cycle.waveLengthWeeks : cycle.lengthWeeks;
  const markerWeek =
    absWeek == null
      ? null
      : cycle.waveLengthWeeks && cycle.waveLengthWeeks > 0
        ? effectiveWeek(cycle.waveLengthWeeks, absWeek)
        : Math.min(Math.max(absWeek, 1), cycle.lengthWeeks);
  const currentPhase = markerWeek != null ? phaseForWeek(phases, markerWeek) : null;

  const sortedPhases = [...phases].sort((a, b) => a.startWeek - b.startWeek);
  const orderedDays = [...days].sort((a, b) => a.weekday - b.weekday);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 p-3">
      <div>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-neutral-100">Plan-Uebersicht</h4>
          {absWeek != null && (
            <span className="text-xs text-neutral-400">
              Woche {absWeek} von {cycle.lengthWeeks}
              {currentPhase ? ` · ${currentPhase.name}` : ''}
            </span>
          )}
        </div>

        {sortedPhases.length > 0 && (
          <div className="mt-3">
            <div className="relative flex h-3 w-full gap-[2px]">
              {sortedPhases.map((p, i) => {
                const span = Math.max(p.endWeek - p.startWeek + 1, 1);
                const widthPct = (span / totalWeeks) * 100;
                const color = p.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
                return (
                  <div
                    key={p.id}
                    title={`${p.name} (Wo ${p.startWeek}–${p.endWeek})`}
                    className={`h-full ${i === 0 ? 'rounded-l-full' : ''} ${i === sortedPhases.length - 1 ? 'rounded-r-full' : ''}`}
                    style={{ width: `${widthPct}%`, background: color }}
                  />
                );
              })}
              {markerWeek != null && (
                <div
                  title={`Heute · Woche ${markerWeek}`}
                  className="pointer-events-none absolute -top-1.5 flex -translate-x-1/2 flex-col items-center"
                  style={{ left: `${Math.min(Math.max(((markerWeek - 0.5) / totalWeeks) * 100, 0), 100)}%` }}
                >
                  <div className="h-1.5 w-1.5 rotate-45 bg-neutral-100" />
                  <div className="h-8 w-px bg-neutral-100/80" />
                </div>
              )}
            </div>
            <div className="mt-2 flex gap-[2px]">
              {sortedPhases.map((p, i) => {
                const span = Math.max(p.endWeek - p.startWeek + 1, 1);
                const widthPct = (span / totalWeeks) * 100;
                return (
                  <div key={p.id} className="truncate text-center text-[10px] text-neutral-400" style={{ width: `${widthPct}%` }}>
                    {p.name}
                  </div>
                );
              })}
            </div>
            {cycle.waveLengthWeeks ? (
              <p className="mt-1 text-[11px] text-neutral-500">Welle wiederholt sich alle {cycle.waveLengthWeeks} Wochen</p>
            ) : null}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-[10px] text-neutral-500">
        <span>Stimulus:</span>
        <div className="h-2 w-20 rounded-full" style={{ background: 'linear-gradient(90deg, rgb(25,70,55), rgb(18,150,100), rgb(52,211,153))' }} />
        <span>leicht (viele Wdh) → schwer (wenig Wdh)</span>
      </div>

      <div className="app-scroll-x -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {orderedDays.map((day) => {
          const isToday = day.weekday === todayWeekday;
          return (
            <div
              key={day.id}
              className={`w-56 shrink-0 rounded-lg border p-2 ${
                isToday ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-neutral-800 bg-neutral-950/40'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${day.isRest ? 'bg-neutral-600' : 'bg-emerald-400'}`} />
                <span className="truncate text-xs font-semibold text-neutral-100">{WD[day.weekday]} · {day.name}</span>
              </div>

              {day.isRest ? (
                <p className="mt-1.5 text-[11px] text-neutral-500">Ruhetag</p>
              ) : (
                <ul className="mt-1.5 flex flex-col gap-2">
                  {day.exercises.map((ex) => (
                    <ExerciseHeatRow
                      key={ex.id}
                      ex={ex}
                      phases={sortedPhases}
                      waveLengthWeeks={cycle.waveLengthWeeks}
                      lengthWeeks={cycle.lengthWeeks}
                      markerWeek={markerWeek}
                    />
                  ))}
                  {day.exercises.length === 0 && <li className="text-[11px] text-neutral-600">Keine Uebungen</li>}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
