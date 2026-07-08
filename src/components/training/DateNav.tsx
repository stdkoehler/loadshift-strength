'use client';

import { useUiStore } from '@/stores/ui-store';
import { addDays, dowName, formatDate, todayIso } from '@/lib/date';

export function DateNav() {
  const selectedDate = useUiStore((s) => s.selectedDate);
  const setSelectedDate = useUiStore((s) => s.setSelectedDate);

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-3">
      <button
        type="button"
        onClick={() => setSelectedDate(addDays(selectedDate, -1))}
        className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300"
        aria-label="vorheriger Tag"
      >
        ←
      </button>
      <div className="flex flex-col items-center">
        <span className="text-sm font-medium text-neutral-100">{dowName(selectedDate)}</span>
        <span className="text-xs text-neutral-500">{formatDate(selectedDate)}</span>
      </div>
      <div className="flex items-center gap-2">
        {selectedDate !== todayIso() && (
          <button
            type="button"
            onClick={() => setSelectedDate(todayIso())}
            className="rounded-md border border-neutral-700 px-2 py-1.5 text-xs text-neutral-400"
          >
            Heute
          </button>
        )}
        <button
          type="button"
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300"
          aria-label="naechster Tag"
        >
          →
        </button>
      </div>
    </div>
  );
}
