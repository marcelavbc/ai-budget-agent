"use client";

import type { BudgetLine, BudgetOptionGroup } from "@/types/budget";
import { DraggableLine } from "./DraggableLine";
import styles from "./BudgetOptionGroupCard.module.css";

export function BudgetOptionGroupCard({
  group,
  onRemoveLine,
  onUpdateLine,
}: {
  group: BudgetOptionGroup;
  onRemoveLine: (lineId: string) => void;
  onUpdateLine: (
    lineId: string,
    patch: Partial<Pick<BudgetLine, "label" | "quantity" | "unitPrice">>
  ) => void;
}) {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.kicker}>Opcions alternatives</span>
          <span className={styles.title}>{group.title}</span>
        </div>
        <p className={styles.hint}>
          Escollir una opció. No sumar els imports.
        </p>
      </div>

      <div className={styles.options}>
        {group.options.map((line) => (
          <div key={line.id} className={styles.optionRow}>
            <div className={styles.badge}>
              {(line.optionLabel ?? "").trim() || "Opció"}
            </div>
            <div className={styles.optionLine}>
              <DraggableLine
                line={line}
                isDragOver={false}
                isDropCompatible={null}
                onRemove={() => onRemoveLine(line.id)}
                onUpdate={(patch) => onUpdateLine(line.id, patch)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

