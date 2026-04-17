"use client";

import { useState } from "react";
import type { BudgetLine } from "@/types/budget";
import { formatEUR } from "@/lib/formatCurrency";
import { isPricePending } from "@/lib/isPricePending";
import styles from "./BudgetLinesList.module.css";

interface Props {
  lines: BudgetLine[];
  hasPending: boolean;
  total: number | null;
  warnings?: string[];
  onRemoveLine: (id: string) => void;
  onUpdateLine: (
    id: string,
    patch: Partial<Pick<BudgetLine, "label" | "quantity" | "unitPrice">>
  ) => void;
}

export function BudgetLinesList({
  lines,
  hasPending,
  total,
  warnings,
  onRemoveLine,
  onUpdateLine,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState({
    label: "",
    quantity: "",
    unitPrice: "",
  });

  function startEdit(line: BudgetLine) {
    setEditingId(line.id);
    setEditDraft({
      label: line.label,
      quantity: String(line.quantity),
      unitPrice: String(line.unitPrice),
    });
  }

  function saveEdit(line: BudgetLine) {
    onUpdateLine(line.id, {
      label: editDraft.label.trim() || line.label,
      quantity: parseFloat(editDraft.quantity) || 0,
      unitPrice: parseFloat(editDraft.unitPrice) || 0,
    });
    setEditingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }
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
            <div
              key={line.id}
              className={`${styles.lineItem} ${editingId === line.id ? styles.lineItemEditing : ""}`}
            >
              {editingId === line.id ? (
                <form
                  className={styles.editForm}
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveEdit(line);
                  }}
                >
                  <label className={styles.editLabel}>
                    <span className={styles.editLabelText}>Descripció</span>
                    <input
                      className={`${styles.editField} ${styles.editFieldWide}`}
                      value={editDraft.label}
                      onChange={(e) =>
                        setEditDraft((d) => ({ ...d, label: e.target.value }))
                      }
                      autoFocus
                    />
                  </label>
                  <div className={styles.editRow}>
                    <label className={styles.editLabel}>
                      <span className={styles.editLabelText}>Quantitat</span>
                      <input
                        className={`${styles.editField} ${styles.editFieldNumber}`}
                        type="number"
                        min="0"
                        step="any"
                        value={editDraft.quantity}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            quantity: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <label className={styles.editLabel}>
                      <span className={styles.editLabelText}>Preu (€)</span>
                      <input
                        className={`${styles.editField} ${styles.editFieldNumber}`}
                        type="number"
                        min="0"
                        step="any"
                        value={editDraft.unitPrice}
                        onChange={(e) =>
                          setEditDraft((d) => ({
                            ...d,
                            unitPrice: e.target.value,
                          }))
                        }
                      />
                    </label>
                    <div className={styles.editActions}>
                      <button type="submit" className={styles.saveButton}>
                        Guardar
                      </button>
                      <button
                        type="button"
                        className={styles.cancelButton}
                        onClick={cancelEdit}
                      >
                        Cancel·lar
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <>
                  <div className={styles.lineMain}>
                    <p className={styles.lineTitle}>{line.label}</p>
                    {isPricePending(line) ? (
                      <p className={styles.lineMeta}>preu pendent</p>
                    ) : (
                      <p className={styles.lineMeta}>
                        {line.quantity} {line.unitLabel} × {line.unitPrice} €/
                        {line.unitLabel}
                      </p>
                    )}
                  </div>

                  <div className={styles.lineActions}>
                    {isPricePending(line) ? (
                      <p className={styles.lineSubtotalPending}>Pendent</p>
                    ) : (
                      <p className={styles.lineSubtotal}>
                        {formatEUR(line.subtotal)}
                      </p>
                    )}
                    <button
                      type="button"
                      className={styles.editButton}
                      onClick={() => startEdit(line)}
                      aria-label={`Editar ${line.label}`}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => onRemoveLine(line.id)}
                      aria-label={`Eliminar ${line.label}`}
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
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
