'use client';

import { useRef, type ReactNode } from 'react';
import { IconClose } from '@/components/ui/Icons';

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  // Only close on a genuine click on the backdrop itself - i.e. the mousedown that
  // started the click must also have been on the backdrop. Otherwise, selecting text
  // inside the modal (e.g. dragging from an input out past the modal edge) ends the
  // drag with a mouseup over the backdrop, which would otherwise register as an
  // "outside click" and close the modal mid-selection.
  const mouseDownOnBackdrop = useRef(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onMouseDown={(e) => {
        mouseDownOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (mouseDownOnBackdrop.current && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[90vh] w-full flex-col rounded-t-2xl border border-neutral-800 bg-neutral-900 sm:max-w-md sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-3">
          <h3 className="text-sm font-semibold text-neutral-100">{title}</h3>
          <button type="button" onClick={onClose} className="text-neutral-500 hover:text-neutral-300" aria-label="schliessen">
            <IconClose width={18} height={18} />
          </button>
        </div>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 py-4">{children}</div>
        {footer && <div className="flex items-center gap-2 border-t border-neutral-800 px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}
