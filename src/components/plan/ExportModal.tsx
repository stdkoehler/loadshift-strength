'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import type { Cycle } from '@/lib/types';

export function ExportModal({ cycle, onClose }: { cycle: Cycle; onClose: () => void }) {
  const [includeLogs, setIncludeLogs] = useState(false);
  const [busy, setBusy] = useState(false);

  const doExport = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/export/${cycle.id}?logs=${includeLogs ? 1 : 0}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const safeName = cycle.name.replace(/[^a-z0-9-_]+/gi, '_');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}-export.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onClose();
    } catch (err) {
      alert('Export fehlgeschlagen: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setBusy(false);
    }
  };

  const footer = (
    <>
      <button type="button" onClick={onClose} className="ml-auto rounded-md px-3 py-1.5 text-sm text-neutral-400">
        Abbrechen
      </button>
      <button type="button" disabled={busy} onClick={doExport} className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-neutral-950 disabled:opacity-50">
        Exportieren
      </button>
    </>
  );

  const segButtonClass = (active: boolean) =>
    `flex-1 rounded-md px-3 py-1.5 text-sm font-medium ${active ? 'bg-emerald-500 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`;

  return (
    <Modal title="Plan exportieren" onClose={onClose} footer={footer}>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-400">Was soll exportiert werden?</label>
        <div className="flex gap-1">
          <button type="button" className={segButtonClass(!includeLogs)} onClick={() => setIncludeLogs(false)}>Nur Plan</button>
          <button type="button" className={segButtonClass(includeLogs)} onClick={() => setIncludeLogs(true)}>Plan + Fortschritt</button>
        </div>
      </div>
      <p className="text-xs text-neutral-500">
        Der Export enthaelt Tage, Uebungen, Saetze und Periodisierungs-Phasen als JSON-Datei.
        {includeLogs ? ' Zusaetzlich alle bisher geloggten Ist-Werte.' : ' Ohne geloggte Ist-Werte.'}
        {' '}Beim spaeteren Import entsteht daraus ein neuer, aktiver Zyklus.
      </p>
    </Modal>
  );
}
