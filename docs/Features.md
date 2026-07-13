# Features

A walkthrough of LoadShift Strength's core loop — define a periodized plan, train against it with live
feedback, then zoom out to see how a cycle and a full training year actually went. Screenshots below are
from a demo cycle built for this doc: **Summer Peak 2026**, a 12-week Push/Pull/Legs split
(Monday/Wednesday/Friday), with three earlier 12-week cycles seeded behind it so History has a full year
of data to show.

## 1. Defining a plan with phases

A cycle is split into **phases** — periodization blocks like Accumulation, Intensification, and Deload.
Each phase is just a week range (freely adjustable, don't have to be even) plus a color, which is what
lets the Progress view later paint "where in the cycle am I" as a colored timeline instead of a bare
progress bar.

![Periodization Phases editor — Accumulation (1-6), Intensification (7-10), Deload (11-12)](screenshots/define_phases.png)

Exercises key into those phases through **Phased Wave** progression: instead of one flat target, each
phase gets its own reps × weight × RIR row. The app automatically applies whichever phase's row matches
the current week — Barbell Bench Press here runs 8×70 (RIR 3) during Accumulation, tightens to 5×85
(RIR 2) for Intensification, and backs off to 5×60 (RIR 4) for Deload, with zero manual editing week to
week.

![Phased Wave progression — a different reps/weight/RIR target per phase](screenshots/exercise_phase_constant.png)

Plans aren't locked into the cycle they were built in. The overflow menu on the plan editor can save the
current day/exercise structure as a reusable **Template**, or export/import the whole plan as JSON — useful
for spinning up the next cycle from a known-good structure instead of rebuilding it by hand.

![Save as Template / Export / Import Plan (JSON)](screenshots/saving_plan_template.png)

## 2. Set structures: Uniform vs. Ramp

Every exercise also picks a **set structure**, independent of progression type. *Uniform* repeats the same
target across every set (as shown above). *Ramp* breaks an exercise into individually-configured sets, each
with its own reps/weight/RIR and an optional role tag — warm-up, top-set, back-off — so a session can ramp
up in weight and taper back down without needing separate "exercises" for each step.

Ramp works with **Linear** progression too: here Barbell Overhead Press warms up at 15×20, hits two top
sets at 5×45, and backs off to 8×35 — with a single "increment per week" that nudges every set's weight up
together as the cycle progresses.

![Ramp + Linear — warm-up, two top sets, a back-off set, one shared weekly increment](screenshots/ramp.png)

Ramp also combines with **Phased Wave**: pick a phase, and that phase gets its own independent set-by-set
ramp. Below, Intensification's ramp for Barbell Bench Press is being edited — a warm-up, two top sets, and
a back-off — while Accumulation and Deload keep their own separate ramps untouched.

![Phased Wave + Ramp — an independent set-by-set ramp per phase](screenshots/exercise_phase_ramp.png)

## 3. Training: check-off, RIR, and rest timer

The Training tab shows one calendar day at a time, every set pre-filled with that week's target computed
from the plan and the active phase — including the role-tagged Ramp sets from the plan editor, shown here
with their warm-up/top-set/back-off color coding carried straight through into the session.

For each set you can adjust actual reps/weight, log **RIR** (reps in reserve — how hard it actually felt
vs. how hard it was programmed to feel), tap the checkmark to mark it **done**, and start a per-exercise
**rest timer** that counts down at the bottom of the screen.

![Monday's Ramp session: warm-up, two top sets, and a back-off set, with the rest timer running at 2:23](screenshots/training-timer-checkoff.png)

## 4. Looking at a plan in progress

The Progress tab is scoped to the active cycle. It opens with a plan overview: a colored phase timeline
(matching the phase colors from step 1) showing exactly where "now" falls — week 7 of 12, inside
Intensification — plus a per-day heatmap of every exercise's week-by-week completion.

![Plan Overview: phase timeline + per-exercise weekly completion, week 7 of 12](screenshots/plan_progress.png)

Picking an exercise below that drills into target-vs-actual charts — working top-set weight and training
volume per week — so it's immediately visible whether the actual line is tracking the target line or
drifting from it.

## 5. Long-term tracking across cycles

The History tab isn't scoped to one cycle — it takes a date range and aggregates across every cycle inside
it, so a single exercise's trend can span cycles with completely different structures as long as the
exercise name matches.

With the range set to 01.10.2025 – 31.07.2026, Barbell Bench Press shows four distinct 12-week waves — one
per historical cycle, each with a higher baseline than the last — overlaid with its RIR trend, and a
day-by-day log of every logged session underneath.

![A full year of Barbell Bench Press history across 4 cycles, plus the day-by-day session log](screenshots/plan_history_and_logs.png)

This is where "am I progressing over months, not just this cycle" gets answered — each new cycle in this
demo was seeded roughly 6-7% heavier than the one before it, and that shows up as a rising staircase of
waves rather than one flat trend line.
