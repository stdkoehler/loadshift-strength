'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Dropdown } from '@/components/ui/Dropdown';
import { useTemplates } from '@/query/hooks/useTemplates';
import { queryKeys } from '@/query/keys';
import { saveActivePlanAsTemplateAction } from '@/server/actions/templates.actions';
import type { Cycle } from '@/lib/types';

export function SaveAsTemplateModal({ cycle, onClose }: { cycle: Cycle; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: templates } = useTemplates();
  const [name, setName] = useState(cycle.name);
  const [overwriteId, setOverwriteId] = useState<number | ''>('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await saveActivePlanAsTemplateAction({
        cycleId: cycle.id,
        name: name.trim(),
        overwriteTemplateId: overwriteId === '' ? null : overwriteId,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.templates() });
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const inputClass = 'w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100';
  const labelClass = 'mb-1 block text-xs font-medium text-neutral-400';

  return (
    <Modal
      title="Save as Template"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="ml-auto rounded-md px-3 py-1.5 text-sm text-neutral-400">
            Cancel
          </button>
          <button
            type="button"
            disabled={busy || !name.trim()}
            onClick={save}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-neutral-950 disabled:opacity-50"
          >
            Save
          </button>
        </>
      }
    >
      <div>
        <label className={labelClass}>Template name</label>
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div>
        <label className={labelClass}>Overwrite an existing template (optional)</label>
        <Dropdown
          options={[{ value: '' as const, label: 'Create as new template' }, ...(templates?.map((t) => ({ value: t.id, label: t.name })) ?? [])]}
          value={overwriteId}
          onChange={setOverwriteId}
        />
      </div>
      <p className="text-xs text-neutral-500">
        Saves the current structure (days, exercises, sets, phases) as a reusable template - without a start date and without
        logged training days. Your active plan and its history remain unchanged.
      </p>
    </Modal>
  );
}
