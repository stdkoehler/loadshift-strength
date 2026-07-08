import type { Phase } from '@/lib/types';
import type { EditorState } from './types';
import { hintClass, inputClass, labelClass } from './styles';

export function UniformPhased({
  st,
  patch,
  phases,
}: {
  st: EditorState;
  patch: (p: Partial<EditorState>) => void;
  phases: Phase[];
}) {
  const updatePhaseVal = (phaseId: number, field: 'reps' | 'weight' | 'rir', value: string) => {
    patch({ phaseVals: { ...st.phaseVals, [phaseId]: { ...st.phaseVals[phaseId], [field]: value } } });
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className={labelClass}>Anzahl Saetze</label>
        <input
          inputMode="numeric"
          className={inputClass}
          value={st.uniform.numSets}
          onChange={(e) => patch({ uniform: { ...st.uniform, numSets: e.target.value } })}
        />
      </div>
      <div>
        <label className={labelClass}>Ziel je Phase (Wdh x Gewicht)</label>
        <div className="flex flex-col gap-2">
          {phases.map((p) => (
            <div key={p.id} className="grid grid-cols-[1fr_1fr_1fr_1fr] items-center gap-2">
              <span className="text-xs font-medium" style={{ color: p.color ?? undefined }}>{p.name}</span>
              <input
                inputMode="numeric"
                placeholder="Wdh"
                className={inputClass}
                value={st.phaseVals[p.id]?.reps ?? ''}
                onChange={(e) => updatePhaseVal(p.id, 'reps', e.target.value)}
              />
              <input
                inputMode="decimal"
                placeholder="kg"
                className={inputClass}
                value={st.phaseVals[p.id]?.weight ?? ''}
                onChange={(e) => updatePhaseVal(p.id, 'weight', e.target.value)}
              />
              <input
                inputMode="numeric"
                placeholder="RIR"
                className={inputClass}
                value={st.phaseVals[p.id]?.rir ?? ''}
                onChange={(e) => updatePhaseVal(p.id, 'rir', e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>
      <p className={hintClass}>Gewicht/Wdh richten sich je Woche automatisch nach der aktiven Phase.</p>
    </div>
  );
}
