"use client";

import type { BudgetLine } from "@/types/budget";
import { formatEUR } from "@/lib/formatCurrency";
import styles from "./BudgetLinesList.module.css";

interface Props {
  lines: BudgetLine[];
  hasPending: boolean;
  total: number | null;
  warnings?: string[];
  onRemoveLine: (id: string) => void;
}

export function BudgetLinesList({
  lines,
  hasPending,
  total,
  warnings,
  onRemoveLine,
}: Props) {
  if (lines.length === 0) return null;

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
            No s'ha pogut calcular un total amb les dades indicades.
          </p>
        )}
      </div>

      <div className={styles.linesBlock}>
        <h2 className={styles.linesLabel}>Desglossament</h2>

        <div className={styles.linesList}>
          {lines.map((line) => (
            <div key={line.id} className={styles.lineItem}>
              <div className={styles.lineMain}>
                <p className={styles.lineTitle}>{line.label}</p>

                {line.type === "custom" && line.unitPrice === 0 ? (
                  <p className={styles.lineMeta}>
                    {line.quantity} {line.unitLabel} · preu pendent
                  </p>
                ) : (
                  <p className={styles.lineMeta}>
                    {line.quantity} {line.unitLabel} × {line.unitPrice} €/
                    {line.unitLabel}
                  </p>
                )}
              </div>

              <div className={styles.lineActions}>
                {line.type === "custom" && line.unitPrice === 0 ? (
                  <p className={styles.lineSubtotalPending}>Pendent</p>
                ) : (
                  <p className={styles.lineSubtotal}>
                    {formatEUR(line.subtotal)}
                  </p>
                )}

                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => onRemoveLine(line.id)}
                  aria-label={`Eliminar ${line.label}`}
                >
                  <span className={styles.removeButton}>Eliminar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
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
