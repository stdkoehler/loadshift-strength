'use client';

import type { CSSProperties, ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconGrip } from './Icons';

type SortableId = string | number;

/**
 * Touch-friendly drag-to-reorder list. Wraps dnd-kit's DndContext/SortableContext with
 * sensors tuned so a drag doesn't fight page scrolling: PointerSensor needs a few pixels
 * of movement (ignores clicks on the row itself), TouchSensor needs a short press-and-
 * hold (ignores a finger scrolling past the row).
 */
export function SortableList<T>({
  items,
  getId,
  onReorder,
  children,
}: {
  items: T[];
  getId: (item: T) => SortableId;
  onReorder: (next: T[]) => void;
  children: (item: T, index: number) => ReactNode;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => getId(i) === active.id);
    const newIndex = items.findIndex((i) => getId(i) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(getId)} strategy={verticalListSortingStrategy}>
        {items.map((item, index) => children(item, index))}
      </SortableContext>
    </DndContext>
  );
}

export function SortableItem({
  id,
  className,
  children,
}: {
  id: SortableId;
  className?: string;
  children: (dragHandleProps: { attributes: object; listeners: object | undefined }) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      {children({ attributes, listeners })}
    </div>
  );
}

export function DragHandle({ attributes, listeners }: { attributes: object; listeners: object | undefined }) {
  return (
    <button
      type="button"
      {...attributes}
      {...listeners}
      className="cursor-grab touch-none px-1 text-neutral-600 hover:text-neutral-300 active:cursor-grabbing"
      style={{ touchAction: 'none' }}
      aria-label="Ziehen zum Sortieren"
    >
      <IconGrip width={16} height={16} />
    </button>
  );
}
