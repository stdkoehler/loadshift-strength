'use client';

import { useActiveCycle } from '@/query/hooks/useActiveCycle';
import { useUiStore } from '@/stores/ui-store';
import { EmptyState } from '@/components/ui/EmptyState';
import { LivePlanEditor } from './LivePlanEditor';
import { TemplateDraftEditor } from './TemplateDraftEditor';
import { TemplatesModal, LoadTemplatePrompt } from './TemplatesModal';
import { SaveAsTemplateModal } from './SaveAsTemplateModal';
import { IconBookmark, IconFolder } from '@/components/ui/Icons';

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
  if (!cycle) return <p className="px-4 py-6 text-sm text-neutral-500">Loading...</p>;

  return (
    <>
      <LivePlanEditor
        cycleId={cycle.id}
        extraMenuItems={[
          { label: 'Manage Templates', icon: IconFolder, onClick: () => setOpenModal('templates') },
          { label: 'Save as Template', icon: IconBookmark, onClick: () => setOpenModal('saveAsTemplate') },
        ]}
      />
      {openModal === 'templates' && <TemplatesModal onClose={() => setOpenModal(null)} />}
      {openModal === 'saveAsTemplate' && <SaveAsTemplateModal cycle={cycle} onClose={() => setOpenModal(null)} />}
      <LoadTemplatePrompt onClose={() => setOpenModal(null)} />
    </>
  );
}
