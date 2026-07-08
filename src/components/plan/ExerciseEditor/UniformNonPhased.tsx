import type { EditorState } from './types';
import { inputClass, labelClass } from './styles';

export function UniformNonPhased({ st, patch }: { st: EditorState; patch: (p: Partial<EditorState>) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-2">
        <div>
          <label className={labelClass}>Saetze</label>
          <input
            inputMode="numeric"
            className={inputClass}
            value={st.uniform.numSets}
            onChange={(e) => patch({ uniform: { ...st.uniform, numSets: e.target.value } })}
          />
        </div>
        <div>
          <label className={labelClass}>Wdh</label>
          <input
            inputMode="numeric"
            className={inputClass}
            value={st.uniform.reps}
            onChange={(e) => patch({ uniform: { ...st.uniform, reps: e.target.value } })}
          />
        </div>
        <div>
          <label className={labelClass}>Gewicht (kg)</label>
          <input
            inputMode="decimal"
            className={inputClass}
            value={st.uniform.weight}
            onChange={(e) => patch({ uniform: { ...st.uniform, weight: e.target.value } })}
          />
        </div>
        <div>
          <label className={labelClass}>RIR</label>
          <input
            inputMode="numeric"
            placeholder="–"
            className={inputClass}
            value={st.uniform.rir}
            onChange={(e) => patch({ uniform: { ...st.uniform, rir: e.target.value } })}
          />
        </div>
      </div>
      {st.progressionType === 'linear' && (
        <div>
          <label className={labelClass}>Steigerung / Woche (kg)</label>
          <input
            inputMode="decimal"
            className={inputClass}
            value={st.uniform.increment}
            onChange={(e) => patch({ uniform: { ...st.uniform, increment: e.target.value } })}
          />
        </div>
      )}
    </div>
  );
}
