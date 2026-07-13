import { ROLES, type CustomRow, type EditorState } from './types';
import { inputClass, labelClass } from './styles';
import { SortableList, SortableItem, DragHandle } from '@/components/ui/SortableList';
import { Dropdown } from '@/components/ui/Dropdown';
import { genId } from '@/lib/id';

const ROLE_OPTIONS = [{ value: '', label: '— no role —' }, ...ROLES.filter(Boolean).map((r) => ({ value: r, label: r }))];

export function RampNonPhased({ st, patch }: { st: EditorState; patch: (p: Partial<EditorState>) => void }) {
  const updateRow = (i: number, field: 'reps' | 'weight' | 'role' | 'rir', value: string) => {
    const rows = st.custom.map((c, j) => (j === i ? { ...c, [field]: value } : c));
    patch({ custom: rows });
  };
  const removeRow = (key: string) => patch({ custom: st.custom.filter((c) => c._key !== key) });
  const addRow = () => {
    const last = st.custom[st.custom.length - 1] || { reps: 10, weight: 20, role: '', rir: '' };
    patch({ custom: [...st.custom, { _key: genId(), reps: last.reps, weight: last.weight, role: '', rir: last.rir }] });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className={labelClass}>Individual Sets</label>
      <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-2 text-xs text-neutral-500">
        <span />
        <span />
        <span>Reps</span>
        <span>Weight (kg)</span>
        <span>RIR</span>
        <span />
      </div>
      <SortableList items={st.custom} getId={(c) => c._key} onReorder={(next) => patch({ custom: next })}>
        {(c: CustomRow, i: number) => {
          const rowIndex = st.custom.findIndex((r) => r._key === c._key);
          return (
            <SortableItem key={c._key} id={c._key} className="flex flex-col gap-2 rounded-md border border-neutral-800 p-2">
              {(dragHandleProps) => (
                <>
                  <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] items-center gap-2">
                    <DragHandle {...dragHandleProps} />
                    <span className="text-xs text-neutral-500">Set {i + 1}</span>
                    <input inputMode="numeric" placeholder="Reps" className={inputClass} value={c.reps} onChange={(e) => updateRow(rowIndex, 'reps', e.target.value)} />
                    <input inputMode="decimal" placeholder="kg" className={inputClass} value={c.weight} onChange={(e) => updateRow(rowIndex, 'weight', e.target.value)} />
                    <input inputMode="numeric" placeholder="–" className={inputClass} value={c.rir} onChange={(e) => updateRow(rowIndex, 'rir', e.target.value)} />
                    <button type="button" onClick={() => removeRow(c._key)} className="px-2 text-neutral-500 hover:text-red-400" aria-label="Remove set">
                      ✕
                    </button>
                  </div>
                  <Dropdown options={ROLE_OPTIONS} value={c.role || ''} onChange={(v) => updateRow(rowIndex, 'role', v)} />
                </>
              )}
            </SortableItem>
          );
        }}
      </SortableList>
      <button type="button" onClick={addRow} className="rounded-md border border-dashed border-neutral-700 py-2 text-sm text-neutral-400">
        + Add set
      </button>
      {st.progressionType === 'linear' && (
        <div>
          <label className={labelClass}>Increment / week (kg, for all sets)</label>
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
