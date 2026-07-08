import { create } from 'zustand';
import { todayIso } from '@/lib/date';

export type PlanModal =
  | null
  | 'cycle'
  | 'phases'
  | 'export'
  | { type: 'day'; dayId?: number }
  | { type: 'exercise'; dayId: number; exerciseId?: number };

interface UiState {
  selectedDate: string;
  setSelectedDate: (date: string) => void;

  openModal: PlanModal;
  setOpenModal: (modal: PlanModal) => void;

  exportIncludeLogs: boolean;
  setExportIncludeLogs: (value: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedDate: todayIso(),
  setSelectedDate: (date) => set({ selectedDate: date }),

  openModal: null,
  setOpenModal: (modal) => set({ openModal: modal }),

  exportIncludeLogs: false,
  setExportIncludeLogs: (value) => set({ exportIncludeLogs: value }),
}));
