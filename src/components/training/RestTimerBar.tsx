'use client';

import { useEffect, useRef, useState } from 'react';
import { useRestTimerStore, hydrateRestTimerFromStorage } from '@/stores/rest-timer-store';
import { startAlarmLoop, stopAlarmLoop, notifyRestOver, stopBackgroundKeepAlive } from '@/lib/rest-timer/audio';
import { IconClose } from '@/components/ui/Icons';

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function RestTimerBar() {
  const endsAt = useRestTimerStore((s) => s.endsAt);
  const durationSec = useRestTimerStore((s) => s.durationSec);
  const label = useRestTimerStore((s) => s.label);
  const addSeconds = useRestTimerStore((s) => s.addSeconds);
  const cancel = useRestTimerStore((s) => s.cancel);

  const [remaining, setRemaining] = useState(0);
  const [ringing, setRinging] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    hydrateRestTimerFromStorage();
  }, []);

  useEffect(() => {
    if (endsAt == null) return;
    firedRef.current = false;
    setRinging(false);

    const tick = () => {
      const secondsLeft = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setRemaining(secondsLeft);
      if (secondsLeft === 0 && !firedRef.current) {
        firedRef.current = true;
        startAlarmLoop();
        notifyRestOver(label ? `${label} - next set` : 'Time for the next set');
        stopBackgroundKeepAlive();
        setRinging(true);
      }
    };

    tick();
    const interval = window.setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, [endsAt, label]);

  // Belt-and-braces: never leave the alarm looping if the bar itself unmounts.
  useEffect(() => () => stopAlarmLoop(), []);

  if (endsAt == null) return null;

  const acknowledge = () => {
    stopAlarmLoop();
    stopBackgroundKeepAlive();
    cancel();
  };

  if (ringing) {
    return (
      <button
        type="button"
        onClick={acknowledge}
        className="w-full animate-pulse border-t border-emerald-500 bg-emerald-500/20 px-4 py-3 text-center text-sm font-semibold text-emerald-300"
      >
        Rest over{label ? ` · ${label}` : ''} — tap to acknowledge
      </button>
    );
  }

  const progress = durationSec > 0 ? Math.min(1, Math.max(0, 1 - remaining / durationSec)) : 0;

  return (
    <div className="border-t border-neutral-800 bg-neutral-900 px-4 py-2">
      <div className="mx-auto flex w-full max-w-[900px] items-center gap-3">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>{label ? `Rest · ${label}` : 'Rest'}</span>
            <span className="font-mono text-sm text-neutral-100">{formatTime(remaining)}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full bg-emerald-500 transition-[width] duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => addSeconds(15)}
          className="rounded-md border border-neutral-700 px-2 py-1 text-xs font-medium text-neutral-300"
        >
          +15s
        </button>
        <button
          type="button"
          aria-label="Cancel rest"
          onClick={() => {
            cancel();
            stopBackgroundKeepAlive();
          }}
          className="text-neutral-500 hover:text-neutral-300"
        >
          <IconClose width={16} height={16} />
        </button>
      </div>
    </div>
  );
}
