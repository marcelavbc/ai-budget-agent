"use client";

import { useDroppable } from "@dnd-kit/core";
import type { BudgetGroup, BudgetLine } from "@/types/budget";
import { formatEUR } from "@/lib/formatCurrency";
import { isPricePending } from "@/lib/isPricePending";
import { DraggableLine } from "./DraggableLine";
import styles from "./BudgetGroupCard.module.css";

interface Props {
  group: BudgetGroup;
  activeDragZone: string | null; // zone of the line currently being dragged
  onRemoveLine: (lineId: string) => void;
  onUpdateLine: (
    lineId: string,
    patch: Partial<Pick<BudgetLine, "label" | "quantity" | "unitPrice">>
  ) => void;
}

export function BudgetGroupCard({
  group,
  activeDragZone,
  onRemoveLine,
  onUpdateLine,
}: Props) {
  const isCompatible =
    activeDragZone !== null ? activeDragZone === group.zone : null;

  const { setNodeRef, isOver } = useDroppable({ id: group.id });

  const dropClass =
    isOver && isCompatible === true
      ? styles.dropCompatible
      : isOver && isCompatible === false
        ? styles.dropIncompatible
        : "";

  const hasPending = group.lines.some(isPricePending);

  return (
    <div ref={setNodeRef} className={`${styles.groupCard} ${dropClass}`}>
      <div className={styles.groupHeader}>
        <span className={styles.groupZone}>{group.zone}</span>
        {hasPending ? (
          <span className={styles.groupSubtotalPending}>Pendent</span>
        ) : (
          <span className={styles.groupSubtotal}>
            {formatEUR(group.subtotal)}
          </span>
        )}
      </div>

      <div className={styles.groupLines}>
        {group.lines.map((line) => (
          <DraggableLine
            key={line.id}
            line={line}
            isDragOver={false}
            isDropCompatible={null}
            onRemove={() => onRemoveLine(line.id)}
            onUpdate={(patch) => onUpdateLine(line.id, patch)}
          />
        ))}
      </div>

      {isOver && isCompatible === false && (
        <p className={styles.zoneError}>
          Zona incompatible — només s&apos;accepten línies de &ldquo;
          {group.zone}&rdquo;
        </p>
      )}
    </div>
  );
}
