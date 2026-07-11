'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { DatePicker } from '@/components/ui/DatePicker';
import type { Cycle } from '@/lib/types';

export function AiExportModal({ cycle, onClose }: { cycle: Cycle; onClose: () => void }) {
  const [from, setFrom] = useState(cycle.startDate ?? '');
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchPayload = async () => {
    const res = await fetch(`/api/export/${cycle.id}/ai?from=${from}&to=${to}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
  };

  const copy = async () => {
    setBusy(true);
    setCopied(false);
    try {
      const data = await fetchPayload();
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
    } catch (err) {
      alert('Export failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    setBusy(true);
    try {
      const data = await fetchPayload();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const safeName = cycle.name.replace(/[^a-z0-9-_]+/gi, '_');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}-ai-export.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  };

  const footer = (
    <>
      <button type="button" onClick={onClose} className="ml-auto rounded-md px-3 py-1.5 text-sm text-neutral-400">
        Close
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={download}
        className="rounded-md border border-neutral-700 px-3 py-1.5 text-sm text-neutral-300 disabled:opacity-50"
      >
        Download JSON
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={copy}
        className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-neutral-950 disabled:opacity-50"
      >
        {copied ? 'Copied!' : 'Copy to Clipboard'}
      </button>
    </>
  );

  return (
    <Modal title="Export for AI" onClose={onClose} footer={footer}>
      <div className="flex items-center gap-2">
        <DatePicker value={from} onChange={setFrom} className="w-full" />
        <span className="text-neutral-600">–</span>
        <DatePicker value={to} onChange={setTo} className="w-full" />
      </div>
      <p className="text-xs text-neutral-500">
        Produces a compact JSON summary of the full plan structure (exercises, sets, target reps/weight/RIR and
        progression rules) plus every logged set in this date range - including the actual RIR you felt. Meant to be
        pasted into an LLM to review and suggest plan changes, not to be re-imported here.
      </p>
    </Modal>
  );
}
