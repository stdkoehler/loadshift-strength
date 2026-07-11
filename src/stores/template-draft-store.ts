import { create } from 'zustand';
import type { FullPlan } from '@/lib/types';

interface TemplateDraftState {
  draft: FullPlan | null;
  dirty: boolean;
  nextTempId: number;
  init: (plan: FullPlan) => void;
  clear: () => void;
  takeTempId: () => number;
  update: (updater: (plan: FullPlan) => FullPlan) => void;
}

// Holds the in-progress edit of a template while TemplateDraftEditor is open. Edits
// only ever touch this local copy - nothing reaches the DB until the "Save"
// button calls replaceTemplateContentAction with the whole draft. New days/exercises/
// phases get a negative, globally-unique temp id (see takeTempId) so they can be
// referenced before they have a real DB id.
export const useTemplateDraftStore = create<TemplateDraftState>((set, get) => ({
  draft: null,
  dirty: false,
  nextTempId: -1,

  init: (plan) => set({ draft: structuredClone(plan), dirty: false, nextTempId: -1 }),
  clear: () => set({ draft: null, dirty: false, nextTempId: -1 }),

  takeTempId: () => {
    const id = get().nextTempId;
    set({ nextTempId: id - 1 });
    return id;
  },

  update: (updater) =>
    set((s) => (s.draft ? { draft: updater(s.draft), dirty: true } : s)),
}));
