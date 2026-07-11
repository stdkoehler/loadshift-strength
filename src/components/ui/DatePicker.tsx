'use client';

import { useEffect, useRef, useState } from 'react';
import { IconCalendar } from './Icons';
import { formatDate, todayIso } from '@/lib/date';

const MONTHS = [
  'Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
];
const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const PANEL_HEIGHT = 340;

const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function isoOf(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

// Monday=0..Sunday=6, for the leading blank cells before day 1.
function leadingOffset(year: number, month: number): number {
  const jsDay = new Date(Date.UTC(year, month, 1)).getUTCDay(); // 0=Sun..6=Sat
  return (jsDay + 6) % 7;
}

interface Cell {
  iso: string;
  day: number;
  inMonth: boolean;
}

function buildGrid(year: number, month: number): Cell[] {
  const offset = leadingOffset(year, month);
  const total = daysInMonth(year, month);
  const cells: Cell[] = [];

  const prevTotal = daysInMonth(year, month - 1 < 0 ? 11 : month - 1);
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonth = month === 0 ? 11 : month - 1;
  for (let i = 0; i < offset; i++) {
    const day = prevTotal - offset + i + 1;
    cells.push({ iso: isoOf(prevYear, prevMonth, day), day, inMonth: false });
  }

  for (let day = 1; day <= total; day++) {
    cells.push({ iso: isoOf(year, month, day), day, inMonth: true });
  }

  const nextYear = month === 11 ? year + 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ iso: isoOf(nextYear, nextMonth, nextDay), day: nextDay, inMonth: false });
    nextDay++;
  }

  return cells;
}

/**
 * The app's default date picker. A native <input type="date">'s calendar popup is
 * OS/browser chrome that CSS can't restyle, so this reimplements it in ordinary DOM,
 * matching the visual language of Dropdown (rounded-xl, emerald accents, dark surface).
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Datum waehlen',
  className = '',
}: {
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const valid = ISO_RE.test(value);
  const todayFallback = todayIso();
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [viewYear, setViewYear] = useState(() => Number((valid ? value : todayFallback).slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => Number((valid ? value : todayFallback).slice(5, 7)) - 1);
  const rootRef = useRef<HTMLDivElement>(null);

  const openPicker = () => {
    const base = valid ? value : todayIso();
    setViewYear(Number(base.slice(0, 4)));
    setViewMonth(Number(base.slice(5, 7)) - 1);
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < PANEL_HEIGHT && rect.top > spaceBelow);
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const goMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const cells = buildGrid(viewYear, viewMonth);
  const today = todayIso();

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-left text-sm text-neutral-100 outline-none transition-colors hover:border-neutral-600 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/30"
      >
        <span className={`truncate ${valid ? '' : 'text-neutral-500'}`}>{valid ? formatDate(value) : placeholder}</span>
        <IconCalendar width={16} height={16} className="shrink-0 text-neutral-500" />
      </button>

      {open && (
        <div
          role="dialog"
          className={`absolute z-20 w-72 rounded-xl border border-neutral-800 bg-neutral-900 p-3 shadow-lg shadow-black/40 ${
            openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => goMonth(-1)}
              aria-label="Vorheriger Monat"
              className="rounded-md p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-neutral-100">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={() => goMonth(1)}
              aria-label="Naechster Monat"
              className="rounded-md p-1 text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w) => (
              <div key={w} className="flex h-6 items-center justify-center text-[11px] text-neutral-500">
                {w}
              </div>
            ))}
            {cells.map((c) => {
              const isSelected = c.iso === value;
              const isToday = c.iso === today;
              return (
                <button
                  key={c.iso}
                  type="button"
                  onClick={() => {
                    onChange(c.iso);
                    setOpen(false);
                  }}
                  className={`flex h-8 items-center justify-center rounded-md text-sm transition-colors ${
                    isSelected
                      ? 'bg-emerald-500 font-medium text-neutral-950'
                      : c.inMonth
                        ? 'text-neutral-200 hover:bg-neutral-800'
                        : 'text-neutral-600 hover:bg-neutral-800'
                  } ${isToday && !isSelected ? 'ring-1 ring-inset ring-emerald-500/60' : ''}`}
                >
                  {c.day}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              onChange(today);
              setOpen(false);
            }}
            className="mt-2 w-full rounded-md border border-dashed border-neutral-700 py-1.5 text-xs text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
          >
            Heute
          </button>
        </div>
      )}
    </div>
  );
}
