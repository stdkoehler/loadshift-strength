'use client';

import { useEffect, useRef, useState } from 'react';
import { IconChevronDown } from './Icons';

export interface DropdownOption<T extends string | number> {
  value: T;
  label: string;
}

const PANEL_MAX_HEIGHT = 256;

/**
 * The app's default select control. A plain HTML <select>'s popup is OS/browser
 * chrome that CSS can't restyle - no custom scrollbar, no theme colors - so this
 * reimplements it in ordinary DOM and reuses .app-scroll for its option list.
 */
export function Dropdown<T extends string | number>({
  options,
  value,
  onChange,
  placeholder = 'Auswaehlen',
  className = '',
}: {
  options: DropdownOption<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) {
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < PANEL_MAX_HEIGHT && rect.top > spaceBelow);
    }
    const selectedIndex = options.findIndex((o) => o.value === value);
    setHighlight(selectedIndex >= 0 ? selectedIndex : 0);

    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((i) => Math.min(i + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const opt = options[highlight];
      if (opt) {
        onChange(opt.value);
        setOpen(false);
      }
    }
  };

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={rootRef} className={`relative ${className}`} onKeyDown={open ? onListKeyDown : undefined}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-left text-sm text-neutral-100 outline-none transition-colors hover:border-neutral-600 focus:border-emerald-500/70 focus:ring-2 focus:ring-emerald-500/30"
      >
        <span className={`truncate ${selected ? '' : 'text-neutral-500'}`}>{selected ? selected.label : placeholder}</span>
        <IconChevronDown
          width={16}
          height={16}
          className={`shrink-0 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className={`app-scroll absolute z-20 max-h-64 w-full overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900 py-1 shadow-lg shadow-black/40 ${
            openUpward ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {options.map((opt, i) => (
            <li key={opt.value}>
              <button
                type="button"
                role="option"
                aria-selected={opt.value === value}
                onMouseEnter={() => setHighlight(i)}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`block w-full truncate px-3 py-2 text-left text-sm transition-colors ${
                  opt.value === value
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : i === highlight
                      ? 'bg-neutral-800 text-neutral-200'
                      : 'text-neutral-200'
                }`}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
