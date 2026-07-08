'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { ExerciseWithSets, Phase } from '@/lib/types';
import type { ProgressionType } from '@/lib/progression';
import { deriveState } from './deriveState';
import { buildPayload } from './buildPayload';
import type { EditorState } from './types';
import { inputClass, labelClass, segButtonClass } from './styles';
import { UniformNonPhased } from './UniformNonPhased';
import { RampNonPhased } from './RampNonPhased';
import { UniformPhased } from './UniformPhased';
import { RampPhased } from './RampPhased';
import type { ExerciseInput } from '@/zod/exercise.schema';

const PROGRESSION_LABELS: Record<ProgressionType, string> = {
  konstant: 'Konstant',
  linear: 'Linear',
  phasen: 'Phasen-Welle',
};

export function ExerciseEditor({
  initial,
  phases,
  onSave,
  onClose,
  onDelete,
}: {
  initial: ExerciseWithSets | null;
  phases: Phase[];
  onSave: (payload: ExerciseInput) => Promise<void> | void;
  onClose: () => void;
  onDelete?: () => void;
}) {
  const [st, setSt] = useState<EditorState>(() => deriveState(initial, phases));
  const [saving, setSaving] = useState(false);
  const isPhasen = st.progressionType === 'phasen';
  const patch = (p: Partial<EditorState>) => setSt((s) => ({ ...s, ...p }));

  const canSave = st.name.trim().length > 0;
  const save = async () => {
    setSaving(true);
    try {
      await onSave(buildPayload(st, phases));
    } finally {
      setSaving(false);
    }
  };

  const footer = (
    <>
      {onDelete && (
        <button type="button" onClick={onDelete} className="rounded-md bg-red-500/15 px-3 py-1.5 text-sm text-red-400">
          Loeschen
        </button>
      )}
      <button type="button" onClick={onClose} className="ml-auto rounded-md px-3 py-1.5 text-sm text-neutral-400">
        Abbrechen
      </button>
      <button
        type="button"
        disabled={!canSave || saving}
        onClick={save}
        className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-neutral-950 disabled:opacity-50"
      >
        Speichern
      </button>
    </>
  );

  return (
    <Modal title={initial ? 'Uebung bearbeiten' : 'Neue Uebung'} onClose={onClose} footer={footer}>
      <div>
        <label className={labelClass}>Name</label>
        <input
          autoFocus
          className={inputClass}
          value={st.name}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="z.B. LH Bankdruecken"
        />
      </div>

      <div>
        <label className={labelClass}>Progression</label>
        <div className="flex gap-1">
          {(['konstant', 'linear', 'phasen'] as ProgressionType[]).map((t) => (
            <button key={t} type="button" className={segButtonClass(st.progressionType === t)} onClick={() => patch({ progressionType: t })}>
              {PROGRESSION_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Pause (min)</label>
          <input inputMode="decimal" className={inputClass} value={st.pauseMin} onChange={(e) => patch({ pauseMin: e.target.value })} />
        </div>
        <div>
          <label className={labelClass}>Satz-Struktur</label>
          <div className="flex gap-1">
            <button type="button" className={segButtonClass(st.structure === 'uniform')} onClick={() => patch({ structure: 'uniform' })}>
              Gleich
            </button>
            <button type="button" className={segButtonClass(st.structure === 'custom')} onClick={() => patch({ structure: 'custom' })}>
              Ramp
            </button>
          </div>
        </div>
      </div>

      <div>
        <label className={labelClass}>Notizen</label>
        <textarea
          rows={3}
          className={inputClass}
          value={st.notes}
          onChange={(e) => patch({ notes: e.target.value })}
          placeholder="z.B. Hinweise zur Ausfuehrung, Begruendung fuer Gewichtsanpassungen, ..."
        />
      </div>

      {isPhasen && (
        <div>
          <label className={labelClass}>Steigerung je Wellen-Wiederholung (kg)</label>
          <input
            inputMode="decimal"
            placeholder="0 = keine automatische Steigerung"
            className={inputClass}
            value={st.repeatIncrement}
            onChange={(e) => patch({ repeatIncrement: e.target.value })}
          />
          <p className="mt-1 text-xs text-neutral-500">
            Nur relevant, wenn der Zyklus eine Wellenlaenge hat (Zyklus-Einstellungen). Wird einmal pro
            komplettem Wellendurchlauf zu allen Phasen-Gewichten addiert, damit die Welle nicht endlos identisch
            wiederholt.
          </p>
        </div>
      )}

      {isPhasen && st.structure === 'uniform' && <UniformPhased st={st} patch={patch} phases={phases} />}
      {isPhasen && st.structure === 'custom' && <RampPhased st={st} patch={patch} phases={phases} />}
      {!isPhasen && st.structure === 'uniform' && <UniformNonPhased st={st} patch={patch} />}
      {!isPhasen && st.structure === 'custom' && <RampNonPhased st={st} patch={patch} />}
    </Modal>
  );
}
