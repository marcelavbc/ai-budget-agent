"use client";

import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type {
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import type { BudgetLine, BudgetListItem } from "@/types/budget";
import { isBudgetGroup } from "@/types/budget";
import { formatEUR } from "@/lib/formatCurrency";
import { extractZone } from "@/lib/extractZone";
import { DraggableLine } from "./DraggableLine";
import { BudgetGroupCard } from "./BudgetGroupCard";
import styles from "./BudgetLinesList.module.css";

interface Props {
  items: BudgetListItem[];
  hasPending: boolean;
  total: number | null;
  warnings?: string[];
  onRemoveLine: (id: string) => void;
  onUpdateLine: (
    id: string,
    patch: Partial<Pick<BudgetLine, "label" | "quantity" | "unitPrice">>
  ) => void;
  onGroupLines: (dragId: string, targetId: string) => boolean;
  onUngroupGroup: (groupId: string) => void;
}

export function BudgetLinesList({
  items,
  hasPending,
  total,
  warnings,
  onRemoveLine,
  onUpdateLine,
  onGroupLines,
  onUngroupGroup,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  // Zone of the line currently being dragged (null when nothing is dragged)
  const activeDragZone = (() => {
    if (!activeId) return null;
    for (const item of items) {
      if (!isBudgetGroup(item)) {
        if ((item as BudgetLine).id === activeId)
          return extractZone((item as BudgetLine).label);
      } else {
        const found = (item as import("@/types/budget").BudgetGroup).lines.find(
          (l) => l.id === activeId
        );
        if (found) return extractZone(found.label);
      }
    }
    return null;
  })();

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
    setDropError(null);
  }

  function handleDragOver(event: DragOverEvent) {
    setOverId(event.over ? (event.over.id as string) : null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);
    if (!over || active.id === over.id) return;
    const ok = onGroupLines(active.id as string, over.id as string);
    if (!ok)
      setDropError(
        "Zones incompatibles — només es poden agrupar línies de la mateixa zona."
      );
  }

  if (items.length === 0) return null;

  return (
    <section className={styles.result} aria-live="polite">
      <div className={styles.totalBlock}>
        <span className={styles.totalLabel}>Total estimat</span>

        {hasPending ? (
          <span className={styles.totalPending}>Pendent</span>
        ) : total != null ? (
          <span className={styles.totalValue}>{formatEUR(total)}</span>
        ) : (
          <p className={styles.totalUnavailable}>
            No s&apos;ha pogut calcular un total amb les dades indicades.
          </p>
        )}
      </div>

      <div className={styles.linesBlock}>
        <h2 className={styles.linesLabel}>Desglossament</h2>

        {dropError && (
          <p className={styles.dropError} role="alert">
            {dropError}
          </p>
        )}

        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className={styles.linesList}>
            {items.map((item) =>
              isBudgetGroup(item) ? (
                <BudgetGroupCard
                  key={item.id}
                  group={item}
                  activeDragZone={activeDragZone}
                  onRemoveLine={onRemoveLine}
                  onUpdateLine={onUpdateLine}
                  onUngroup={() => onUngroupGroup(item.id)}
                />
              ) : (
                <DraggableLine
                  key={(item as BudgetLine).id}
                  line={item as BudgetLine}
                  isDragOver={overId === (item as BudgetLine).id}
                  isDropCompatible={
                    activeId === null
                      ? null
                      : activeDragZone ===
                        extractZone((item as BudgetLine).label)
                  }
                  onRemove={() => onRemoveLine((item as BudgetLine).id)}
                  onUpdate={(patch) =>
                    onUpdateLine((item as BudgetLine).id, patch)
                  }
                />
              )
            )}
          </div>
        </DndContext>
      </div>

      {warnings && warnings.length > 0 ? (
        <div className={styles.warnings}>
          <p className={styles.warningsTitle}>Avís</p>
          <ul className={styles.warningsList}>
            {warnings.map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
