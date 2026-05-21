"use client";

import { useCallback, useRef, useState } from "react";
import { useClickOutside } from "@/shared/hooks/useClickOutside";
import { useRouter } from "next/navigation";
import { ChevronDown, FileDown, Trash2 } from "lucide-react";
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
  budgetStatus?: string | null;
  items: BudgetClientItem[];
  clientDetails: BudgetClientDetails;
  onClientDetailsChange: React.Dispatch<
    React.SetStateAction<BudgetClientDetails>
  >;
  onItemChange: (id: string, patch: Partial<BudgetClientItem>) => void;
  onItemRemove?: (id: string) => void;
  itemsFooter?: React.ReactNode;
  onSave?: (args: {
    client: BudgetClientDetails;
    items: BudgetClientItem[];
  }) => Promise<void>;
  quoteManuallyEdited: boolean;
  onQuoteNumberChange: (value: string) => void;
  onResetQuoteAutomation: () => void;
  onBack: () => void;
}

export function BudgetDraftView({
  mode = "create",
  budgetStatus,
  items,
  clientDetails: client,
  onClientDetailsChange: setClient,
  onItemChange,
  onItemRemove,
  itemsFooter,
  onSave,
  quoteManuallyEdited,
  onQuoteNumberChange,
  onResetQuoteAutomation,
  onBack,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const { exportPdf, generating, pdfError } = usePdfExport();
  const pdfMenuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const draftComplete = isBudgetDraftComplete({ client, items });
  const status = normalizeBudgetStatus(budgetStatus);
  const closePdfMenu = useCallback(() => setPdfMenuOpen(false), []);
  useClickOutside(pdfMenuRef, pdfMenuOpen, closePdfMenu);

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
        await saveBudgetWithLines({
          client,
          items,
        });
      }
      router.push("/budgets");
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

  async function handleGenerateBudgetPdf(lang: "ca" | "es") {
    setPdfMenuOpen(false);
    await exportPdf({ client, items, lang });
  }

  const segments = segmentDraftItems(items);

  return (
    <section
      className={`${styles.root} ${mode === "edit" ? styles.rootEdit : ""}`}
    >
      <div className={styles.topBar}>
        {mode !== "edit" ? (
          <button type="button" className={styles.backBtn} onClick={onBack}>
            ← Tornar a les partides
          </button>
        ) : null}
        {mode === "edit" ? (
          <>
            <h2 className={`${styles.heading} ${styles.headingEdit}`}>
              Editar pressupost
            </h2>
            <div className={styles.editHeaderActions}>
              <span
                className={`${styles.statusPill} ${statusPillClass(status)}`}
              >
                {budgetStatusLabel(status)}
              </span>
              <div
                className={styles.generateBudgetDropdown}
                ref={pdfMenuRef}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setPdfMenuOpen(false);
                }}
              >
                <button
                  type="button"
                  className={styles.generateBudgetBtn}
                  disabled={generating}
                  aria-busy={generating || undefined}
                  aria-haspopup="menu"
                  aria-expanded={pdfMenuOpen}
                  onClick={() => setPdfMenuOpen((v) => !v)}
                >
                  {generating ? (
                    "Generant…"
                  ) : (
                    <>
                      <FileDown size={16} aria-hidden="true" />
                      Generar pressupost
                      <ChevronDown size={14} aria-hidden="true" />
                    </>
                  )}
                </button>
                {pdfMenuOpen ? (
                  <div className={styles.generateBudgetMenu} role="menu">
                    <button
                      type="button"
                      className={styles.generateBudgetMenuItem}
                      role="menuitem"
                      disabled={generating}
                      onClick={() => handleGenerateBudgetPdf("ca")}
                    >
                      Català <span className={styles.generateBudgetMenuHint}>PDF</span>
                    </button>
                    <button
                      type="button"
                      className={styles.generateBudgetMenuItem}
                      role="menuitem"
                      disabled={generating}
                      onClick={() => handleGenerateBudgetPdf("es")}
                    >
                      Castellano{" "}
                      <span className={styles.generateBudgetMenuHint}>PDF</span>
                    </button>
                  </div>
                ) : null}
              </div>
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
                  handleDescriptionChange(item.id, e.target.value)
                }
                rows={4}
                placeholder="Descripció de la partida…"
              />
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

      {mode === "edit" && itemsFooter ? (
        <div className={styles.itemsFooter}>{itemsFooter}</div>
      ) : null}

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
