"use client";

import type { BudgetLine, BudgetListItem } from "@/features/budgets/types/budget";
import { isBudgetOptionGroup } from "@/features/budgets/types/budget";
import { DraggableLine } from "./DraggableLine";
import { BudgetOptionGroupCard } from "./BudgetOptionGroupCard";
import styles from "./BudgetLinesList.module.css";

interface Props {
  items: BudgetListItem[];
  hasPending: boolean;
  warnings?: string[];
  onRemoveLine: (id: string) => void;
  onUpdateLine: (
    id: string,
    patch: Partial<Pick<BudgetLine, "label" | "quantity" | "unitPrice">>
  ) => void;
  onGenerateDraft?: () => void;
}

export function BudgetLinesList({
  items,
  hasPending,
  warnings,
  onRemoveLine,
  onUpdateLine,
  onGenerateDraft,
}: Props) {
  if (items.length === 0) {
    return (
      <section className={styles.empty} aria-live="polite">
        <h2 className={styles.emptyTitle}>Encara no hi ha línies</h2>
        <p className={styles.emptyText}>
          Escriu una partida a dalt (p. ex. “Pintar menjador 18 m²”) i la veurem
          aquí amb el preu estimat de cada línia.
        </p>
      </section>
    );
  }

  return (
    <section className={styles.result} aria-live="polite">
      <div className={styles.linesBlock}>
        <h2 className={styles.linesLabel}>Desglossament</h2>

        <div className={styles.linesList}>
          {items.map((item) =>
            isBudgetOptionGroup(item) ? (
              <BudgetOptionGroupCard
                key={item.id}
                group={item}
                onRemoveLine={onRemoveLine}
                onUpdateLine={onUpdateLine}
              />
            ) : (
              <DraggableLine
                key={(item as BudgetLine).id}
                line={item as BudgetLine}
                onRemove={() => onRemoveLine((item as BudgetLine).id)}
                onUpdate={(patch) => onUpdateLine((item as BudgetLine).id, patch)}
              />
            )
          )}
        </div>
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
