'use client';

import { SetRow } from './SetRow';
import { IconTimer } from '@/components/ui/Icons';
import { useRestTimerStore } from '@/stores/rest-timer-store';
import { ensureNotificationPermission, startBackgroundKeepAlive } from '@/lib/rest-timer/audio';
import type { SessionExercise } from '@/lib/types';

export function ExerciseCard({ exercise, date }: { exercise: SessionExercise; date: string }) {
  const start = useRestTimerStore((s) => s.start);

  const startRest = () => {
    const seconds = Math.round((exercise.pauseMin ?? 1.5) * 60);
    startBackgroundKeepAlive();
    void ensureNotificationPermission();
    start(seconds, exercise.name);
  };

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-neutral-100">{exercise.name}</h3>
        <div className="flex items-center gap-2">
          {exercise.pauseMin != null && <span className="text-xs text-neutral-500">Rest {exercise.pauseMin} min</span>}
          <button type="button" aria-label="Start rest timer" onClick={startRest} className="text-neutral-500 hover:text-emerald-400">
            <IconTimer width={17} height={17} />
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {exercise.sets.map((set) => (
          <SetRow key={set.setIndex} exerciseId={exercise.id} date={date} set={set} />
        ))}
      </div>
      {exercise.notes && <p className="mt-3 text-xs text-neutral-500">{exercise.notes}</p>}
    </div>
  );
}
