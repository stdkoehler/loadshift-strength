'use client';

import { useUiStore } from '@/stores/ui-store';
import { useSession } from '@/query/hooks/useSession';
import { DateNav } from './DateNav';
import { ExerciseCard } from './ExerciseCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { fmt } from '@/lib/date';

export function TrainingView() {
  const selectedDate = useUiStore((s) => s.selectedDate);
  const { data: session, isLoading, isError } = useSession(selectedDate);

  if (!isLoading && !isError && session === null) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col">
      <DateNav />

      {isLoading && <p className="px-4 py-6 text-sm text-neutral-500">Loading...</p>}
      {isError && <p className="px-4 py-6 text-sm text-red-400">Error loading session.</p>}

      {!isLoading && !isError && session?.rest && (
        <p className="px-4 py-6 text-sm text-neutral-500">Rest day.</p>
      )}

      {!isLoading && !isError && session && !session.rest && session.exercises.length === 0 && (
        <p className="px-4 py-6 text-sm text-neutral-500">No training day planned.</p>
      )}

      {!isLoading && !isError && session && !session.rest && session.exercises.length > 0 && (
        <div className="flex flex-col gap-3 px-4 pb-6">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>
              Week {session.week}
              {session.phase ? ` · ${session.phase.name}` : ''}
            </span>
            <span>Volume: {fmt(session.dayVolume)} kg</span>
          </div>
          {session.exercises.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} date={selectedDate} />
          ))}
        </div>
      )}
    </div>
  );
}
