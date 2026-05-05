"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { BudgetLine } from "@/features/budgets/types/budget";
import { formatEUR } from "@/shared/lib/formatCurrency";
import { isPricePending } from "@/features/budgets/lib/isPricePending";
import styles from "./DraggableLine.module.css";

interface Props {
  line: BudgetLine;
  onRemove: () => void;
  onUpdate: (
    patch: Partial<Pick<BudgetLine, "label" | "quantity" | "unitPrice">>
  ) => void;
}

export function DraggableLine({
  line,
  onRemove,
  onUpdate,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState({
    label: "",
    quantity: "",
    unitPrice: "",
  });

  function startEdit() {
    setIsEditing(true);
    setEditDraft({
      label: line.label,
      quantity: String(line.quantity),
      unitPrice: String(line.unitPrice),
    });
  }

  function saveEdit() {
    onUpdate({
      label: editDraft.label.trim() || line.label,
      quantity: parseFloat(editDraft.quantity) || 0,
      unitPrice: parseFloat(editDraft.unitPrice) || 0,
    });
    setIsEditing(false);
  }

  return (
    <div
      className={`${styles.lineItem} ${isEditing ? styles.lineItemEditing : ""}`}
    >
      {isEditing ? (
        <form
          className={styles.editForm}
          onSubmit={(e) => {
            e.preventDefault();
            saveEdit();
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
                  setEditDraft((d) => ({ ...d, quantity: e.target.value }))
                }
              />
            </label>
            <label className={styles.editLabel}>
              <span className={styles.editLabelText}>Preu (€/{line.unitLabel})</span>
              <input
                className={`${styles.editField} ${styles.editFieldNumber}`}
                type="number"
                min="0"
                step="any"
                value={editDraft.unitPrice}
                onChange={(e) =>
                  setEditDraft((d) => ({ ...d, unitPrice: e.target.value }))
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
                onClick={() => setIsEditing(false)}
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
              <p className={styles.lineSubtotal}>{formatEUR(line.subtotal)}</p>
            )}
            <button
              type="button"
              className={styles.editButton}
              onClick={startEdit}
              aria-label={`Editar ${line.label}`}
            >
              <Pencil size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.removeButton}
              onClick={onRemove}
              aria-label={`Eliminar ${line.label}`}
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
