import { create } from 'zustand';

const STORAGE_KEY = 'rest-timer';

interface Persisted {
  endsAt: number | null;
  durationSec: number;
  label: string | null;
}

interface RestTimerState extends Persisted {
  start: (durationSec: number, label?: string) => void;
  addSeconds: (delta: number) => void;
  cancel: () => void;
}

const EMPTY: Persisted = { endsAt: null, durationSec: 0, label: null };

function loadPersisted(): Persisted {
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    if (typeof parsed.endsAt === 'number' && parsed.endsAt > Date.now()) {
      return { endsAt: parsed.endsAt, durationSec: parsed.durationSec ?? 0, label: parsed.label ?? null };
    }
  } catch {
    // ignore malformed storage
  }
  return EMPTY;
}

function persist(state: Persisted) {
  if (typeof window === 'undefined') return;
  if (state.endsAt == null) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

export const useRestTimerStore = create<RestTimerState>((set, get) => ({
  ...EMPTY,

  start: (durationSec, label) => {
    const next: Persisted = { endsAt: Date.now() + durationSec * 1000, durationSec, label: label ?? null };
    persist(next);
    set(next);
  },

  addSeconds: (delta) => {
    const { endsAt, durationSec, label } = get();
    if (endsAt == null) return;
    const next: Persisted = { endsAt: Math.max(Date.now(), endsAt + delta * 1000), durationSec, label };
    persist(next);
    set(next);
  },

  cancel: () => {
    persist(EMPTY);
    set(EMPTY);
  },
}));

/**
 * Reads any still-active timer from localStorage into the store. Must run
 * from a client-side effect (not during store creation) so the very first
 * client render still matches the server-rendered (always-empty) HTML.
 */
export function hydrateRestTimerFromStorage() {
  const persisted = loadPersisted();
  if (persisted.endsAt != null) useRestTimerStore.setState(persisted);
}
