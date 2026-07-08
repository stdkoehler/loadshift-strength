import { SetRow } from './SetRow';
import type { SessionExercise } from '@/lib/types';

export function ExerciseCard({ exercise, date }: { exercise: SessionExercise; date: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-neutral-100">{exercise.name}</h3>
        {exercise.pauseMin != null && <span className="text-xs text-neutral-500">Pause {exercise.pauseMin} min</span>}
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
