import type { Phase } from '@/lib/types';
import { ROLES, type CustomPhaseRow, type EditorState } from './types';
import { emptyPhaseVals } from './deriveState';
import { hintClass, inputClass, labelClass } from './styles';
import { SortableList, SortableItem, DragHandle } from '@/components/ui/SortableList';
import { Dropdown } from '@/components/ui/Dropdown';

const ROLE_OPTIONS = [{ value: '', label: '— no role —' }, ...ROLES.filter(Boolean).map((r) => ({ value: r, label: r }))];

export function RampPhased({
  st,
  patch,
  phases,
}: {
  st: EditorState;
  patch: (p: Partial<EditorState>) => void;
  phases: Phase[];
}) {
  if (phases.length === 0) {
    return <p className={hintClass}>Create periodization phases first (&quot;Phases&quot; button above).</p>;
  }

  const activePhase = phases.find((p) => p.id === st.activePhase) ?? phases[0];

  const updateVal = (i: number, field: 'reps' | 'weight' | 'rir', value: string) => {
    const rows = st.customPhase.map((c, j) =>
      j !== i ? c : { ...c, vals: { ...c.vals, [activePhase.id]: { ...c.vals[activePhase.id], [field]: value } } }
    );
    patch({ customPhase: rows });
  };
  const updateRole = (i: number, role: string) => {
    const rows = st.customPhase.map((c, j) => (j === i ? { ...c, role } : c));
    patch({ customPhase: rows });
  };
  const removeRow = (key: string) => patch({ customPhase: st.customPhase.filter((c) => c._key !== key) });
  const addRow = () => {
    const last = st.customPhase[st.customPhase.length - 1];
    const vals = last ? JSON.parse(JSON.stringify(last.vals)) : emptyPhaseVals(phases);
    patch({ customPhase: [...st.customPhase, { _key: crypto.randomUUID(), role: '', vals }] });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className={labelClass}>Select Phase</label>
      <div className="flex gap-1">
        {phases.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => patch({ activePhase: p.id })}
            className="flex-1 rounded-md px-2 py-1.5 text-xs font-medium"
            style={
              activePhase.id === p.id
                ? { background: p.color ?? '#34d399', color: '#0d0f13' }
                : { background: '#262626', color: '#a3a3a3' }
            }
          >
            {p.name}
          </button>
        ))}
      </div>
      <p className={hintClass}>
        Reps/weight apply to <b style={{ color: activePhase.color ?? undefined }}>{activePhase.name}</b>. Set role
        applies across all phases.
      </p>

      <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] gap-2 text-xs text-neutral-500">
        <span />
        <span />
        <span>Reps</span>
        <span>Weight (kg)</span>
        <span>RIR</span>
        <span />
      </div>
      <SortableList items={st.customPhase} getId={(c) => c._key} onReorder={(next) => patch({ customPhase: next })}>
        {(c: CustomPhaseRow, i: number) => {
          const rowIndex = st.customPhase.findIndex((r) => r._key === c._key);
          const v = c.vals[activePhase.id] || { reps: '', weight: '', rir: '' };
          return (
            <SortableItem key={c._key} id={c._key} className="flex flex-col gap-2 rounded-md border border-neutral-800 p-2">
              {(dragHandleProps) => (
                <>
                  <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_auto] items-center gap-2">
                    <DragHandle {...dragHandleProps} />
                    <span className="text-xs text-neutral-500">Set {i + 1}</span>
                    <input inputMode="numeric" placeholder="Reps" className={inputClass} value={v.reps} onChange={(e) => updateVal(rowIndex, 'reps', e.target.value)} />
                    <input inputMode="decimal" placeholder="kg" className={inputClass} value={v.weight} onChange={(e) => updateVal(rowIndex, 'weight', e.target.value)} />
                    <input inputMode="numeric" placeholder="–" className={inputClass} value={v.rir ?? ''} onChange={(e) => updateVal(rowIndex, 'rir', e.target.value)} />
                    <button type="button" onClick={() => removeRow(c._key)} className="px-2 text-neutral-500 hover:text-red-400" aria-label="Remove set">
                      ✕
                    </button>
                  </div>
                  <Dropdown options={ROLE_OPTIONS} value={c.role || ''} onChange={(v) => updateRole(rowIndex, v)} />
                </>
              )}
            </SortableItem>
          );
        }}
      </SortableList>
      <button type="button" onClick={addRow} className="rounded-md border border-dashed border-neutral-700 py-2 text-sm text-neutral-400">
        + Add set
      </button>
    </div>
  );
}
