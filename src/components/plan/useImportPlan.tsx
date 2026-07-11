'use client';

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { importCycleAction } from '@/server/actions/import.actions';
import { queryKeys } from '@/query/keys';

/**
 * Headless import trigger - shared by the standalone ImportButton (empty-plan state)
 * and PlanEditor's overflow menu, which needs to trigger the same hidden file input
 * from a menu item instead of rendering its own icon button.
 */
export function useImportPlan() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (
      !confirm(
        'Import creates a NEW cycle from this file and activates it immediately ' +
          '(the current cycle is kept, but is no longer shown). Continue?'
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importCycleAction(data, { activate: true });
      await queryClient.invalidateQueries({ queryKey: queryKeys.activeCycle() });
    } catch (err) {
      alert('Import failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  };

  const trigger = () => fileInputRef.current?.click();
  const inputElement = (
    <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFile} />
  );

  return { trigger, inputElement, busy };
}
