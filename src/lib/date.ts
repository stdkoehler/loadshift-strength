const DOW = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const DOW_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function dowName(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return DOW[d.getUTCDay()];
}

export function dowShort(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return DOW_SHORT[d.getUTCDay()];
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}.${mm}.${d.getUTCFullYear()}`;
}

export function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '';
  return (Math.round(n * 100) / 100).toString();
}
