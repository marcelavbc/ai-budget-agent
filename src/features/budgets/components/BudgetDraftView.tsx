"use client";

import { useState } from "react";
import { FileDown, Trash2 } from "lucide-react";
import type {
  BudgetClientDetails,
  BudgetClientItem,
} from "@/features/budgets/types/budget";
import { isBudgetDraftComplete } from "@/features/budgets/lib/budgetDraft";
import { saveBudgetWithLines } from "@/features/budgets/lib/budgetsClient";
import {
  budgetStatusLabel,
  normalizeBudgetStatus,
  type BudgetStatus,
} from "@/features/budgets/lib/budgetStatus";
import { usePdfExport } from "@/features/budgets/hooks/usePdfExport";
import { StatusPill } from "@/features/budgets/components/StatusPill";
import { BudgetClientForm } from "@/features/budgets/components/BudgetClientForm";
import { DecimalFieldInput } from "@/shared/components/DecimalFieldInput";
import styles from "./BudgetDraftView.module.css";

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

function statusPillClass(value: BudgetStatus): string {
  if (value === "sent") return styles.statusPillSent;
  if (value === "approved") return styles.statusPillApproved;
  if (value === "invoiced") return styles.statusPillInvoiced;
  return styles.statusPillDraft;
}

interface Props {
  mode?: "create" | "edit";
  /** When false, edit mode skips the in-component h2 (page provides the title). */
  showEditHeading?: boolean;
  budgetId?: string;
  budgetStatus?: string | null;
  onBudgetStatusChange?: (status: BudgetStatus) => void;
  items: BudgetClientItem[];
  clientDetails: BudgetClientDetails;
  onClientDetailsChange: React.Dispatch<
    React.SetStateAction<BudgetClientDetails>
  >;
  onItemChange: (id: string, patch: Partial<BudgetClientItem>) => void;
  onItemsReplace?: (items: BudgetClientItem[]) => void;
  onItemRemove?: (id: string) => void;
  itemsFooter?: React.ReactNode;
  onSave?: (args: {
    client: BudgetClientDetails;
    items: BudgetClientItem[];
  }) => Promise<void>;
  quoteManuallyEdited: boolean;
  onQuoteNumberChange: (value: string) => void;
  onResetQuoteAutomation: () => void;
}

export function BudgetDraftView({
  mode = "create",
  showEditHeading = true,
  budgetId,
  budgetStatus,
  onBudgetStatusChange,
  items,
  clientDetails: client,
  onClientDetailsChange: setClient,
  onItemChange,
  onItemsReplace,
  onItemRemove,
  itemsFooter,
  onSave,
  quoteManuallyEdited,
  onQuoteNumberChange,
  onResetQuoteAutomation,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [itemsSnapshot, setItemsSnapshot] = useState<BudgetClientItem[] | null>(
    null
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const { exportPdf, generating, pdfError } = usePdfExport();

  const draftComplete = isBudgetDraftComplete({ client, items });
  const status = normalizeBudgetStatus(budgetStatus);

  function handleDescriptionChange(id: string, value: string) {
    onItemChange(id, { description: value });
  }

  async function handleSaveBudget() {
    if (!draftComplete || isSaving) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave({ client, items });
      } else {
        await saveBudgetWithLines({ client, items });
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setSaveError(
        e instanceof Error
          ? e.message
          : "No s'ha pogut guardar el pressupost. Torna-ho a provar."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleGenerateBudgetPdf() {
    await exportPdf({ client, items });
  }

  async function handleTranslate() {
    setItemsSnapshot(items);
    setIsTranslating(true);
    try {
      const res = await fetch("/api/translate-budget-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, targetLang: "es" }),
      });
      if (!res.ok) throw new Error("Translation failed");
      const data = (await res.json()) as { items: BudgetClientItem[] };
      if (onItemsReplace) {
        onItemsReplace(data.items);
      } else {
        for (const item of data.items) {
          onItemChange(item.id, {
            title: item.title,
            description: item.description,
          });
        }
      }
      setClient((prev) => ({ ...prev, lang: "es" }));
    } finally {
      setIsTranslating(false);
    }
  }

  function handleRevertTranslation() {
    if (!itemsSnapshot) return;
    if (onItemsReplace) {
      onItemsReplace(itemsSnapshot);
    } else {
      for (const item of itemsSnapshot) {
        onItemChange(item.id, {
          title: item.title,
          description: item.description,
        });
      }
    }
    setClient((prev) => ({ ...prev, lang: "ca" }));
    setItemsSnapshot(null);
  }

  const translationButtons =
    mode === "edit"
      ? client.lang === "ca" && itemsSnapshot === null
        ? (
            <button
              type="button"
              className={styles.generateBudgetBtn}
              onClick={handleTranslate}
              disabled={isTranslating}
              aria-busy={isTranslating || undefined}
            >
              Traduir al castellà
            </button>
          )
        : client.lang === "es" || itemsSnapshot !== null
          ? (
              <button
                type="button"
                className={styles.generateBudgetBtn}
                onClick={handleRevertTranslation}
              >
                Tornar al català
              </button>
            )
          : null
      : null;

  const segments = segmentDraftItems(items);

  return (
    <section
      className={`${styles.root} ${mode === "edit" ? styles.rootEdit : ""}`}
    >
      <div className={styles.topBar}>
        {mode === "edit" ? (
          <>
            {showEditHeading ? (
              <h2 className={`${styles.heading} ${styles.headingEdit}`}>
                Editar pressupost
              </h2>
            ) : null}
            <div className={styles.editHeaderActions}>
              {budgetId ? (
                <StatusPill
                  budgetId={budgetId}
                  initialStatus={budgetStatus ?? status}
                  onStatusChange={onBudgetStatusChange}
                />
              ) : (
                <span
                  className={`${styles.statusPill} ${statusPillClass(status)}`}
                >
                  {budgetStatusLabel(status)}
                </span>
              )}
              {translationButtons}
              <button
                type="button"
                className={styles.generateBudgetBtn}
                disabled={generating}
                aria-busy={generating || undefined}
                onClick={handleGenerateBudgetPdf}
              >
                {generating ? (
                  "Generant…"
                ) : (
                  <>
                    <FileDown size={16} aria-hidden="true" />
                    Generar pressupost
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <span className={styles.draftBadge}>ESBORRANY DEL PRESSUPOST</span>
        )}
      </div>

      <BudgetClientForm
        client={client}
        onChange={setClient}
        quoteManuallyEdited={quoteManuallyEdited}
        onQuoteNumberChange={onQuoteNumberChange}
        onResetQuoteAutomation={onResetQuoteAutomation}
      />

      <div className={styles.itemsTopBar}>
        <h3 className={styles.itemsTitle}>Partides</h3>
      </div>

      {itemsFooter ? (
        <div className={styles.itemsFooter}>{itemsFooter}</div>
      ) : null}

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

                {item.unitLabel === "m²" ? (
                  <label className={styles.itemField}>
                    <span className={styles.itemFieldLabel}>Preu (€/m²)</span>
                    <DecimalFieldInput
                      className={styles.itemFieldInput}
                      value={item.unitPrice ?? 0}
                      onChange={(unitPrice) => {
                        const price = Math.round(unitPrice * 100) / 100;
                        const quantity = item.quantity ?? 0;
                        const total =
                          Math.round(quantity * price * 100) / 100;
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
                  handleDescriptionChange(item.id, e.target.value)
                }
                rows={4}
                placeholder="Descripció de la partida…"
              />
              {(item.clientDescription?.trim() ?? "").length > 0 ? (
                <details className={styles.originalDescBlock}>
                  <summary className={styles.originalDescSummary}>
                    Text original
                  </summary>
                  <p className={styles.originalDescText}>
                    {item.clientDescription}
                  </p>
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

          if (seg.kind === "single") {
            return <li key={seg.item.id}>{renderCard(seg.item)}</li>;
          }

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

      <div className={styles.footer}>
        {saveError ? (
          <p className={styles.saveError} role="alert">
            {saveError}
          </p>
        ) : null}
        {mode === "edit" && pdfError ? (
          <p className={styles.saveError} role="alert">
            {pdfError}
          </p>
        ) : null}
        <div className={styles.footerBtns}>
          <button
            type="button"
            className={styles.saveBtn}
            onClick={handleSaveBudget}
            disabled={!draftComplete || isSaving}
          >
            {isSaving
              ? "Guardant pressupost…"
              : mode === "edit"
                ? "Guardar canvis"
                : "Guardar pressupost"}
          </button>
        </div>
      </div>
    </section>
  );
}
