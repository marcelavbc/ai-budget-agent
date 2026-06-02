"use client";

import { useState } from "react";
import { FileDown } from "lucide-react";
import type {
  BudgetClientDetails,
  BudgetClientItem,
} from "@/features/budgets/types/budget";
import { isBudgetDraftComplete } from "@/features/budgets/lib/budgetDraft";
import {
  budgetStatusLabel,
  normalizeBudgetStatus,
  type BudgetStatus,
} from "@/features/budgets/lib/budgetStatus";
import { usePdfExport } from "@/features/budgets/hooks/usePdfExport";
import { useTranslation } from "@/features/budgets/hooks/useTranslation";
import { StatusPill } from "@/features/budgets/components/StatusPill";
import { BudgetClientForm } from "@/features/budgets/components/BudgetClientForm";
import { BudgetItemCard } from "@/features/budgets/components/BudgetItemCard";
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
  onContactSelect?: (contactId: string) => void;
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
  onContactSelect,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { exportPdf, generating, pdfError } = usePdfExport();
  const {
    isTranslating,
    handleTranslate,
    handleRevertTranslation,
    hasSnapshot,
  } = useTranslation({
    items,
    onItemsReplace,
    onItemChange,
    setClient,
  });

  const draftComplete = isBudgetDraftComplete({ client, items });
  const status = normalizeBudgetStatus(budgetStatus);

  async function handleSaveBudget() {
    if (!draftComplete || isSaving) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave({ client, items });
      } else {
        throw new Error("BudgetDraftView requires onSave prop");
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

  const translationButtons =
    mode === "edit" ? (
      client.lang === "ca" && !hasSnapshot ? (
        <button
          type="button"
          className={styles.generateBudgetBtn}
          onClick={handleTranslate}
          disabled={isTranslating}
          aria-busy={isTranslating || undefined}
        >
          Traduir al castellà
        </button>
      ) : client.lang === "es" || hasSnapshot ? (
        <button
          type="button"
          className={styles.generateBudgetBtn}
          onClick={handleRevertTranslation}
        >
          Tornar al català
        </button>
      ) : null
    ) : null;

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
        onContactSelect={onContactSelect}
      />

      <div className={styles.itemsTopBar}>
        <h3 className={styles.itemsTitle}>Partides</h3>
      </div>

      {itemsFooter ? (
        <div className={styles.itemsFooter}>{itemsFooter}</div>
      ) : null}

      <ul className={styles.list}>
        {segments.map((seg) => {
          if (seg.kind === "single") {
            return (
              <li key={seg.item.id}>
                <BudgetItemCard
                  item={seg.item}
                  onItemChange={onItemChange}
                  onItemRemove={onItemRemove}
                />
              </li>
            );
          }

          return (
            <li key={`opt-${seg.id}`} className={styles.optionGroup}>
              <div className={styles.optionGroupHeader}>
                <span className={styles.optionGroupTitle}>
                  Opcions alternatives
                </span>
              </div>
              <div className={styles.optionGroupBody}>
                {seg.items.map((item) => (
                  <BudgetItemCard
                    key={item.id}
                    item={item}
                    optionLabel={(item.optionLabel ?? "").trim() || "Opció"}
                    onItemChange={onItemChange}
                    onItemRemove={onItemRemove}
                  />
                ))}
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
