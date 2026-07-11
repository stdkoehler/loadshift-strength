'use client';

import { useImportPlan } from './useImportPlan';
import { IconUpload } from '@/components/ui/Icons';

export function ImportButton() {
  const { trigger, inputElement, busy } = useImportPlan();

  return (
    <>
      <button
        type="button"
        onClick={trigger}
        disabled={busy}
        title="Import from JSON"
        className="rounded-md px-2 py-1 text-neutral-400 hover:text-neutral-200 disabled:opacity-50"
      >
        <IconUpload width={18} height={18} />
      </button>
      {inputElement}
    </>
  );
}
