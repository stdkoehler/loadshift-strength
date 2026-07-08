export const inputClass =
  'w-full rounded-md border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600';
export const labelClass = 'mb-1 block text-xs font-medium text-neutral-400';
export const hintClass = 'text-xs text-neutral-500';
export const segButtonClass = (active: boolean) =>
  `flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${active ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`;
