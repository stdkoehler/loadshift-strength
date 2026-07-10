'use client';

import { useActiveCycle } from '@/query/hooks/useActiveCycle';
import { useUiStore } from '@/stores/ui-store';
import { EmptyState } from '@/components/ui/EmptyState';
import { LivePlanEditor } from './LivePlanEditor';
import { TemplateDraftEditor } from './TemplateDraftEditor';
import { TemplatesModal, LoadTemplatePrompt } from './TemplatesModal';
import { SaveAsTemplateModal } from './SaveAsTemplateModal';
import { IconBookmark } from '@/components/ui/Icons';

export function PlanView() {
  const { data: cycle } = useActiveCycle();
  const openModal = useUiStore((s) => s.openModal);
  const setOpenModal = useUiStore((s) => s.setOpenModal);
  const templateEditingId = useUiStore((s) => s.templateEditingId);
  const setTemplateEditingId = useUiStore((s) => s.setTemplateEditingId);

  if (templateEditingId != null) {
    return <TemplateDraftEditor cycleId={templateEditingId} onExit={() => setTemplateEditingId(null)} />;
  }

  if (cycle === null) return <EmptyState />;
  if (!cycle) return <p className="px-4 py-6 text-sm text-neutral-500">Lade...</p>;

  return (
    <>
      <LivePlanEditor
        cycleId={cycle.id}
        headerExtra={
          <>
            <button
              type="button"
              title="Als Vorlage speichern"
              onClick={() => setOpenModal('saveAsTemplate')}
              className="rounded-md px-2 py-1 text-neutral-400 hover:text-neutral-200"
            >
              <IconBookmark width={18} height={18} />
            </button>
            <button
              type="button"
              onClick={() => setOpenModal('templates')}
              className="ml-1 rounded-md border border-neutral-700 px-2 py-1 text-xs text-neutral-300"
            >
              Vorlagen
            </button>
          </>
        }
      />
      {openModal === 'templates' && <TemplatesModal onClose={() => setOpenModal(null)} />}
      {openModal === 'saveAsTemplate' && <SaveAsTemplateModal cycle={cycle} onClose={() => setOpenModal(null)} />}
      <LoadTemplatePrompt onClose={() => setOpenModal(null)} />
    </>
  );
}
