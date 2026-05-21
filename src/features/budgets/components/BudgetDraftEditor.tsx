"use client";

import { Trash2 } from "lucide-react";
import type { BudgetClientItem } from "@/features/budgets/types/budget";
import { DecimalFieldInput } from "@/shared/components/DecimalFieldInput";
import styles from "./BudgetDraftView.module.css";

interface Props {
  items: BudgetClientItem[];
  onItemChange: (id: string, patch: Partial<BudgetClientItem>) => void;
  onItemRemove?: (id: string) => void;
}

type DraftSegment =
  | { kind: "single"; item: BudgetClientItem }
  | { kind: "optionGroup"; id: string; items: BudgetClientItem[] };

function segmentDraftItems(items: BudgetClientItem[]): DraftSegment[] {
  const segments: DraftSegment[] = [];
  let i = 0;
  while (i < items.length) {
    const cur = items[i]!;
    const groupId = (cur.optionGroupId ?? "").trim();
    if (!groupId) {
      segments.push({ kind: "single", item: cur });
      i += 1;
      continue;
    }
    const groupItems: BudgetClientItem[] = [cur];
    let j = i + 1;
    while (j < items.length) {
      const next = items[j]!;
      if ((next.optionGroupId ?? "").trim() !== groupId) break;
      groupItems.push(next);
      j += 1;
    }
    if (groupItems.length < 2) {
      segments.push({
        kind: "single",
        item: { ...cur, optionGroupId: undefined, optionLabel: undefined },
      });
    } else {
      segments.push({ kind: "optionGroup", id: groupId, items: groupItems });
    }
    i = j;
  }
  return segments;
}

function BudgetDraftEditor({
  items,
  onItemChange,
  onItemRemove,
}: Props) {
  const segments = segmentDraftItems(items);

  return (
    <section className={styles.root}>
      <div className={styles.itemsTopBar}>
        <h3 className={styles.itemsTitle}>Partides</h3>
      </div>

      <ul className={styles.list}>
        {segments.map((seg) => {
          const renderCard = (
            item: BudgetClientItem,
            optionLabel?: string,
            key?: string
          ) => (
            <div key={key ?? item.id} className={styles.card}>
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
                        patch.unitPrice =
                          Math.round((total / quantity) * 100) / 100;
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
                      const total =
                        Math.round(quantity * unitPrice * 100) / 100;
                      onItemChange(item.id, { quantity, total });
                    }}
                  />
                </label>

                <label className={styles.itemField}>
                  <span className={styles.itemFieldLabel}>Unitat</span>
                  <select
                    className={styles.itemFieldInput}
                    value={item.unitLabel ?? "partida"}
                    onChange={(e) =>
                      onItemChange(item.id, {
                        unitLabel: e.target
                          .value as BudgetClientItem["unitLabel"],
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
              {(item.clientDescription?.trim() ?? "").length > 0 &&
              item.description !== item.clientDescription ? (
                <details className={styles.originalDescBlock}>
                  <summary className={styles.originalDescSummary}>
                    Text original
                  </summary>
                  <p className={styles.originalDescText}>
                    {item.clientDescription}
                  </p>
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
                </details>
              ) : null}
            </div>
          );

          if (seg.kind === "single")
            return <li key={seg.item.id}>{renderCard(seg.item)}</li>;

          return (
            <li key={`opt-${seg.id}`} className={styles.optionGroup}>
              <div className={styles.optionGroupHeader}>
                <span className={styles.optionGroupTitle}>
                  Opcions alternatives
                </span>
              </div>
              <div className={styles.optionGroupBody}>
                {seg.items.map((item) =>
                  renderCard(
                    item,
                    (item.optionLabel ?? "").trim() || "Opció",
                    item.id
                  )
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default BudgetDraftEditor;
