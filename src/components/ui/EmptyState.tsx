'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createCycleAction, activateCycleAction } from '@/server/actions/cycles.actions';
import { queryKeys } from '@/query/keys';
import { ImportButton } from '@/components/plan/ImportButton';
import { todayIso } from '@/lib/date';

export function EmptyState() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const createEmptyCycle = async () => {
    setBusy(true);
    try {
      const cycle = await createCycleAction({ name: 'New Cycle', startDate: todayIso(), lengthWeeks: 8 });
      await activateCycleAction(cycle.id);
      await queryClient.invalidateQueries({ queryKey: queryKeys.activeCycle() });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      <p className="text-sm text-neutral-500">No active cycle.</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={createEmptyCycle}
          disabled={busy}
          className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-neutral-950 disabled:opacity-50"
        >
          Create New Cycle
        </button>
        <span className="text-xs text-neutral-600">or</span>
        <span className="rounded-md border border-neutral-700 px-2 py-1.5">
          <ImportButton />
        </span>
      </div>
    </div>
  );
}
