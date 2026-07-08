import { create } from 'zustand';
import { todayIso } from '@/lib/date';

export type PlanModal =
  | null
  | 'cycle'
  | 'phases'
  | 'export'
  | 'templates'
  | 'saveAsTemplate'
  | { type: 'day'; dayId?: number }
  | { type: 'exercise'; dayId: number; exerciseId?: number }
  | { type: 'loadTemplate'; templateId: number };

interface UiState {
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  openModal: PlanModal;
  setOpenModal: (modal: PlanModal) => void;

  exportIncludeLogs: boolean;
  setExportIncludeLogs: (value: boolean) => void;

  // Non-null while the Plan tab is editing a template's structure instead of the
  // active plan (see PlanView/PlanEditor).
  templateEditingId: number | null;
  setTemplateEditingId: (id: number | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedDate: todayIso(),
  setSelectedDate: (date) => set({ selectedDate: date }),

  openModal: null,
  setOpenModal: (modal) => set({ openModal: modal }),

  exportIncludeLogs: false,
  setExportIncludeLogs: (value) => set({ exportIncludeLogs: value }),

  templateEditingId: null,
  setTemplateEditingId: (id) => set({ templateEditingId: id }),
}));
