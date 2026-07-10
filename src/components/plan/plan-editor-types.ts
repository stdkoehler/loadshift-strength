// Shared payload shapes passed from the day/cycle/phase edit modals up to whichever
// editor host (LivePlanEditor or TemplateDraftEditor) decides how to persist them.

export interface DayPayload {
  name: string;
  weekday: number;
  focus: string | null;
  isRest: boolean;
}

export interface CyclePayload {
  name: string;
  startDate?: string;
  lengthWeeks: number;
  waveLengthWeeks: number | null;
}

export interface PhasePayload {
  name: string;
  startWeek: number;
  endWeek: number;
  color: string | null;
}
