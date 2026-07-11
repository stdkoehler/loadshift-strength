'use client';

import { useEffect, useRef, useState } from 'react';
import type { ComponentType, SVGProps } from 'react';
import { IconMoreVertical } from './Icons';

export interface ActionMenuItem {
  label: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  onClick: () => void;
  disabled?: boolean;
}

/**
 * Single overflow menu for secondary plan actions (templates, export/import) so the
 * header doesn't grow an icon every time a feature is added - see PlanEditor.
 */
export function ActionMenu({ items, className = '' }: { items: ActionMenuItem[]; className?: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="More actions"
        className="rounded-md px-2 py-1 text-neutral-400 hover:text-neutral-200"
      >
        <IconMoreVertical width={18} height={18} />
      </button>

      {open && (
        <ul
          role="menu"
          className="app-scroll absolute right-0 top-full z-20 mt-1 max-h-72 min-w-[200px] overflow-y-auto rounded-xl border border-neutral-800 bg-neutral-900 py-1 shadow-lg shadow-black/40"
        >
          {items.map((item, i) => (
            <li key={i} role="none">
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-neutral-200 transition-colors hover:bg-neutral-800 disabled:opacity-50"
              >
                {item.icon && <item.icon width={16} height={16} className="shrink-0 text-neutral-400" />}
                <span className="truncate">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
