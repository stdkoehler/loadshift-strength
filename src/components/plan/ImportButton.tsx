'use client';

import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { importCycleAction } from '@/server/actions/import.actions';
import { queryKeys } from '@/query/keys';
import { IconUpload } from '@/components/ui/Icons';

export function ImportButton() {
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

  return (
    <>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={busy}
        title="Import from JSON"
        className="rounded-md px-2 py-1 text-neutral-400 hover:text-neutral-200 disabled:opacity-50"
      >
        <IconUpload width={18} height={18} />
      </button>
      <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFile} />
    </>
  );
}
