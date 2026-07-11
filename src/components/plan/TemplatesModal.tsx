'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import { useTemplates } from '@/query/hooks/useTemplates';
import { queryKeys } from '@/query/keys';
import { useUiStore } from '@/stores/ui-store';
import { createTemplateAction, loadTemplateAction } from '@/server/actions/templates.actions';
import { deleteCycleAction } from '@/server/actions/cycles.actions';
import { IconEdit, IconTrash, IconPlus } from '@/components/ui/Icons';
import { todayIso } from '@/lib/date';

export function TemplatesModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: templates } = useTemplates();
  const setOpenModal = useUiStore((s) => s.setOpenModal);
  const setTemplateEditingId = useUiStore((s) => s.setTemplateEditingId);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  const invalidateTemplates = () => queryClient.invalidateQueries({ queryKey: queryKeys.templates() });

  const create = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      const template = await createTemplateAction({ name: newName.trim(), lengthWeeks: 8 });
      await invalidateTemplates();
      setTemplateEditingId(template.id);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const edit = (id: number) => {
    setTemplateEditingId(id);
    onClose();
  };

  const remove = async (id: number) => {
    if (!confirm('Delete template?')) return;
    setBusy(true);
    try {
      await deleteCycleAction(id);
      await invalidateTemplates();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const inputClass = 'w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100';

  return (
    <Modal title="Templates" onClose={onClose}>
      {!templates && <p className="text-sm text-neutral-500">Loading...</p>}
      {templates?.length === 0 && !creating && (
        <p className="text-sm text-neutral-500">No templates yet. Create a new one or save your active plan as a template.</p>
      )}

      <div className="flex flex-col gap-2">
        {templates?.map((t) => (
          <div key={t.id} className="flex items-center gap-2 rounded-lg bg-neutral-800/60 px-3 py-2">
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-neutral-100">{t.name}</div>
              <div className="text-xs text-neutral-500">{t.lengthWeeks} weeks</div>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => setOpenModal({ type: 'loadTemplate', templateId: t.id })}
              className="rounded-md bg-emerald-500 px-2 py-1 text-xs font-medium text-neutral-950 disabled:opacity-50"
            >
              Load
            </button>
            <button type="button" disabled={busy} onClick={() => edit(t.id)} className="rounded-md px-2 py-1 text-neutral-400 hover:text-neutral-200" aria-label="Edit template">
              <IconEdit width={16} height={16} />
            </button>
            <button type="button" disabled={busy} onClick={() => remove(t.id)} className="rounded-md px-2 py-1 text-neutral-500 hover:text-red-400" aria-label="Delete template">
              <IconTrash width={16} height={16} />
            </button>
          </div>
        ))}
      </div>

      {creating ? (
        <div className="flex flex-col gap-2 rounded-lg border border-neutral-700 p-3">
          <label className="text-xs font-medium text-neutral-400">Name of the new template</label>
          <input className={inputClass} value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setCreating(false)} className="rounded-md px-3 py-1.5 text-sm text-neutral-400">
              Cancel
            </button>
            <button
              type="button"
              disabled={busy || !newName.trim()}
              onClick={create}
              className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-neutral-950 disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center justify-center gap-1 rounded-md border border-dashed border-neutral-700 py-2 text-sm text-neutral-400"
        >
          <IconPlus width={16} height={16} /> New Template
        </button>
      )}
    </Modal>
  );
}

export function LoadTemplatePrompt({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const openModal = useUiStore((s) => s.openModal);
  const setOpenModal = useUiStore((s) => s.setOpenModal);
  const [startDate, setStartDate] = useState(todayIso());
  const [busy, setBusy] = useState(false);

  const loadModal = openModal && typeof openModal === 'object' && openModal.type === 'loadTemplate' ? openModal : null;
  if (!loadModal) return null;

  const confirmLoad = async () => {
    setBusy(true);
    try {
      await loadTemplateAction({ templateId: loadModal.templateId, startDate });
      await queryClient.invalidateQueries({ queryKey: queryKeys.activeCycle() });
      setOpenModal(null);
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Load Template"
      onClose={() => setOpenModal(null)}
      footer={
        <>
          <button type="button" onClick={() => setOpenModal(null)} className="ml-auto rounded-md px-3 py-1.5 text-sm text-neutral-400">
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={confirmLoad}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-neutral-950 disabled:opacity-50"
          >
            Load
          </button>
        </>
      }
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-400">Start date (Monday of week 1)</label>
        <DatePicker value={startDate} onChange={setStartDate} />
      </div>
      <p className="text-xs text-neutral-500">
        Creates a new copy of this template as the active plan starting on the chosen date. The current active plan is kept (including its history), but is no longer shown.
      </p>
    </Modal>
  );
}
