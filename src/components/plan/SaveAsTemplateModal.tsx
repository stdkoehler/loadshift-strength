'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
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
      title="Als Vorlage speichern"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className="ml-auto rounded-md px-3 py-1.5 text-sm text-neutral-400">
            Abbrechen
          </button>
          <button
            type="button"
            disabled={busy || !name.trim()}
            onClick={save}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-neutral-950 disabled:opacity-50"
          >
            Speichern
          </button>
        </>
      }
    >
      <div>
        <label className={labelClass}>Name der Vorlage</label>
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </div>
      <div>
        <label className={labelClass}>Bestehende Vorlage ueberschreiben (optional)</label>
        <select
          className={inputClass}
          value={overwriteId}
          onChange={(e) => setOverwriteId(e.target.value === '' ? '' : Number(e.target.value))}
        >
          <option value="">Als neue Vorlage anlegen</option>
          {templates?.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>
      <p className="text-xs text-neutral-500">
        Speichert die aktuelle Struktur (Tage, Uebungen, Saetze, Phasen) als wiederverwendbare Vorlage - ohne Startdatum und ohne
        geloggte Trainingstage. Dein aktiver Plan und seine Historie bleiben unveraendert.
      </p>
    </Modal>
  );
}
