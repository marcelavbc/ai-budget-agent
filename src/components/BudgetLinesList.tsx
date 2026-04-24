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
import { isBudgetGroup, canGroup, templateGroup } from "@/types/budget";
import { formatEUR } from "@/lib/formatCurrency";
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
  onGenerateDraft?: () => void;
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
  onGenerateDraft,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  // Line currently being dragged (null when nothing is dragged)
  const activeLine = (() => {
    if (!activeId) return null;
    for (const item of items) {
      if (!isBudgetGroup(item)) {
        if ((item as BudgetLine).id === activeId) return item as BudgetLine;
      } else {
        const found = (item as import("@/types/budget").BudgetGroup).lines.find(
          (l) => l.id === activeId
        );
        if (found) return found;
      }
    }
    return null;
  })();

  // Template group of the line currently being dragged
  const activeDragZone = activeLine ? templateGroup[activeLine.type] : null;

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
        "Grups incompatibles — només es poden agrupar línies del mateix grup."
      );
  }

  if (items.length === 0) {
    return (
      <section className={styles.empty} aria-live="polite">
        <h2 className={styles.emptyTitle}>Encara no hi ha línies</h2>
        <p className={styles.emptyText}>
          Escriu una partida a dalt (p. ex. “Pintar menjador 18 m²”) i la veurem
          aquí amb el total estimat.
        </p>
      </section>
    );
  }

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
                    activeLine === null
                      ? null
                      : canGroup(activeLine, item as BudgetLine)
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
            {warnings.map((msg, index) => (
              <li key={`warning-${index}-${msg}`}>{msg}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {!hasPending && onGenerateDraft && (
        <div className={styles.generateBlock}>
          <button className={styles.generateBtn} onClick={onGenerateDraft}>
            Generar esborrany
          </button>
        </div>
      )}
    </section>
  );
}
