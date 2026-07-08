import { ROLES, type EditorState } from './types';
import { inputClass, labelClass } from './styles';

export function RampNonPhased({ st, patch }: { st: EditorState; patch: (p: Partial<EditorState>) => void }) {
  const updateRow = (i: number, field: 'reps' | 'weight' | 'role' | 'rir', value: string) => {
    const rows = st.custom.map((c, j) => (j === i ? { ...c, [field]: value } : c));
    patch({ custom: rows });
  };
  const removeRow = (i: number) => patch({ custom: st.custom.filter((_, j) => j !== i) });
  const addRow = () => {
    const last = st.custom[st.custom.length - 1] || { reps: 10, weight: 20, role: '', rir: '' };
    patch({ custom: [...st.custom, { reps: last.reps, weight: last.weight, role: '', rir: last.rir }] });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className={labelClass}>Einzelne Saetze</label>
      <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 text-xs text-neutral-500">
        <span />
        <span>Wdh</span>
        <span>Gewicht (kg)</span>
        <span>RIR</span>
        <span />
      </div>
      {st.custom.map((c, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-md border border-neutral-800 p-2">
          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-2">
            <span className="text-xs text-neutral-500">Satz {i + 1}</span>
            <input inputMode="numeric" placeholder="Wdh" className={inputClass} value={c.reps} onChange={(e) => updateRow(i, 'reps', e.target.value)} />
            <input inputMode="decimal" placeholder="kg" className={inputClass} value={c.weight} onChange={(e) => updateRow(i, 'weight', e.target.value)} />
            <input inputMode="numeric" placeholder="–" className={inputClass} value={c.rir} onChange={(e) => updateRow(i, 'rir', e.target.value)} />
            <button type="button" onClick={() => removeRow(i)} className="px-2 text-neutral-500 hover:text-red-400" aria-label="Satz entfernen">
              ✕
            </button>
          </div>
          <select
            className={inputClass}
            value={c.role || ''}
            onChange={(e) => updateRow(i, 'role', e.target.value)}
          >
            <option value="">— keine Rolle —</option>
            {ROLES.filter(Boolean).map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      ))}
      <button type="button" onClick={addRow} className="rounded-md border border-dashed border-neutral-700 py-2 text-sm text-neutral-400">
        + Satz hinzufuegen
      </button>
      {st.progressionType === 'linear' && (
        <div>
          <label className={labelClass}>Steigerung / Woche (kg, fuer alle Saetze)</label>
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
