"use client";

import { Trash2 } from "lucide-react";
import type { BudgetClientItem } from "@/features/budgets/types/budget";
import { DecimalFieldInput } from "@/shared/components/DecimalFieldInput";
import styles from "./BudgetItemCard.module.css";

type Props = {
  item: BudgetClientItem;
  optionLabel?: string;
  onItemChange: (id: string, patch: Partial<BudgetClientItem>) => void;
  onItemRemove?: (id: string) => void;
};

export function BudgetItemCard({
  item,
  optionLabel,
  onItemChange,
  onItemRemove,
}: Props) {
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitleRow}>
          {optionLabel ? (
            <span className={styles.optionBadge}>{optionLabel}</span>
          ) : null}
          <div className={styles.itemTitleInputWrap}>
            <input
              className={styles.itemTitleInput}
              type="text"
              value={item.title}
              onChange={(e) =>
                onItemChange(item.id, { title: e.target.value })
              }
              placeholder="Títol de la partida"
            />
          </div>
        </div>
        <div className={styles.cardHeaderRight}>
          <DecimalFieldInput
            className={styles.cardTotalInput}
            aria-label="Import total de la partida (€)"
            value={item.total ?? 0}
            onChange={(t) => {
              const total = Math.round(t * 100) / 100;
              const quantity = item.quantity ?? 1;
              const patch: Partial<BudgetClientItem> = { total };
              if (quantity > 0) {
                patch.unitPrice = Math.round((total / quantity) * 100) / 100;
              }
              onItemChange(item.id, patch);
            }}
          />
          {onItemRemove ? (
            <div className={styles.cardIconActions}>
              <button
                type="button"
                className={styles.iconBtnDanger}
                onClick={() => onItemRemove(item.id)}
                aria-label={`Eliminar ${item.title}`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className={styles.itemMetaRow}>
        <label className={styles.itemField}>
          <span className={styles.itemFieldLabel}>Quant.</span>
          <DecimalFieldInput
            className={styles.itemFieldInput}
            value={item.quantity ?? 1}
            onChange={(q) => {
              const quantity = Math.round(q * 100) / 100;
              const unitPrice = item.unitPrice ?? 0;
              const total = Math.round(quantity * unitPrice * 100) / 100;
              onItemChange(item.id, { quantity, total });
            }}
          />
        </label>

        {item.unitLabel === "m²" ? (
          <label className={styles.itemField}>
            <span className={styles.itemFieldLabel}>Preu (€/m²)</span>
            <DecimalFieldInput
              className={styles.itemFieldInput}
              value={item.unitPrice ?? 0}
              onChange={(unitPrice) => {
                const price = Math.round(unitPrice * 100) / 100;
                const quantity = item.quantity ?? 0;
                const total = Math.round(quantity * price * 100) / 100;
                onItemChange(item.id, { unitPrice: price, total });
              }}
            />
          </label>
        ) : null}

        <label className={styles.itemField}>
          <span className={styles.itemFieldLabel}>Unitat</span>
          <select
            className={styles.itemFieldInput}
            value={item.unitLabel ?? "partida"}
            onChange={(e) =>
              onItemChange(item.id, {
                unitLabel: e.target.value as BudgetClientItem["unitLabel"],
              })
            }
          >
            <option value="partida">partida</option>
            <option value="unitat">unitat</option>
            <option value="m²">m²</option>
          </select>
        </label>
      </div>

      <textarea
        className={styles.descTextarea}
        value={item.description}
        onChange={(e) =>
          onItemChange(item.id, { description: e.target.value })
        }
        rows={4}
        placeholder="Descripció de la partida…"
      />
      {(item.clientDescription?.trim() ?? "").length > 0 ? (
        <details className={styles.originalDescBlock}>
          <summary className={styles.originalDescSummary}>Text original</summary>
          <p className={styles.originalDescText}>{item.clientDescription}</p>
          {item.description !== item.clientDescription ? (
            <button
              type="button"
              className={styles.linkLike}
              onClick={() =>
                onItemChange(item.id, {
                  description: item.clientDescription!,
                })
              }
            >
              Usar text original
            </button>
          ) : null}
        </details>
      ) : null}
    </div>
  );
}
