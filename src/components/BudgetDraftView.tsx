"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, FileDown, Trash2 } from "lucide-react";
import type { BudgetClientDetails, BudgetClientItem } from "@/types/budget";
import { formatEUR } from "@/lib/formatCurrency";
import { isBudgetDraftComplete } from "@/lib/budgetDraft";
import { saveBudgetWithLines } from "@/lib/budgetsClient";
import { usePdfExport } from "@/hooks/usePdfExport";
import { BudgetClientForm } from "@/components/BudgetClientForm";
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
      segments.push({ kind: "single", item: { ...cur, optionGroupId: undefined, optionLabel: undefined } });
    } else {
      segments.push({ kind: "optionGroup", id: groupId, items: groupItems });
    }
    i = j;
  }
  return segments;
}

interface Props {
  mode?: "create" | "edit";
  items: BudgetClientItem[];
  clientDetails: BudgetClientDetails;
  onClientDetailsChange: React.Dispatch<
    React.SetStateAction<BudgetClientDetails>
  >;
  onItemChange: (id: string, patch: Partial<BudgetClientItem>) => void;
  onItemRemove?: (id: string) => void;
  itemsFooter?: React.ReactNode;
  footerActions?: React.ReactNode;
  footerNotice?: React.ReactNode;
  onSave?: (args: {
    client: BudgetClientDetails;
    items: BudgetClientItem[];
  }) => Promise<void>;
  quoteManuallyEdited: boolean;
  onQuoteNumberChange: (value: string) => void;
  onResetQuoteAutomation: () => void;
  onBack: () => void;
  /** Hide PDF export (e.g. approved budgets where invoicing is the next step). */
  showPdf?: boolean;
}

export function BudgetDraftView({
  mode = "create",
  items,
  clientDetails: client,
  onClientDetailsChange: setClient,
  onItemChange,
  onItemRemove,
  itemsFooter,
  footerActions,
  footerNotice,
  onSave,
  quoteManuallyEdited,
  onQuoteNumberChange,
  onResetQuoteAutomation,
  onBack,
  showPdf = true,
}: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pdfMenuOpen, setPdfMenuOpen] = useState(false);
  const { exportPdf, generating, pdfError } = usePdfExport();
  const pdfDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!pdfMenuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (pdfDropdownRef.current?.contains(e.target as Node)) return;
      setPdfMenuOpen(false);
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [pdfMenuOpen]);

  useEffect(() => {
    if (showPdf) return;
    setPdfMenuOpen(false);
  }, [showPdf]);

  async function handleGeneratePdfLang(lang: "ca" | "es") {
    setPdfMenuOpen(false);
    await exportPdf({ client, items, lang });
  }
  const draftComplete = isBudgetDraftComplete({ client, items });

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
        const { budgetId } = await saveBudgetWithLines({
          client,
          items,
        });
        router.push(`/budgets/${budgetId}`);
      }
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

  const segments = segmentDraftItems(items);

  return (
    <section className={styles.root}>
      <div className={styles.topBar}>
        {mode !== "edit" ? (
          <button type="button" className={styles.backBtn} onClick={onBack}>
            ← Tornar a les línies
          </button>
        ) : null}
        {mode === "edit" ? (
          <h2 className={styles.heading}>Editar pressupost</h2>
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

      {mode === "edit" ? (
        <div className={styles.itemsTopBar}>
          <h3 className={styles.itemsTitle}>Partides</h3>
        </div>
      ) : null}

      <ul className={styles.list}>
        {segments.map((seg) => {
          const renderCard = (item: BudgetClientItem, optionLabel?: string) => (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                {mode === "edit" ? (
                  <div className={styles.cardTitleRow}>
                    {optionLabel ? (
                      <span className={styles.optionBadge}>{optionLabel}</span>
                    ) : null}
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
                ) : (
                  <div className={styles.cardTitleRow}>
                    {optionLabel ? (
                      <span className={styles.optionBadge}>{optionLabel}</span>
                    ) : null}
                    <span className={styles.cardTitle}>{item.title}</span>
                  </div>
                )}
                <div className={styles.cardHeaderRight}>
                  <span className={styles.cardTotal}>{formatEUR(item.total)}</span>
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

              {mode === "edit" ? (
                <div className={styles.itemMetaRow}>
                  <label className={styles.itemField}>
                    <span className={styles.itemFieldLabel}>Quant.</span>
                    <input
                      className={styles.itemFieldInput}
                      type="number"
                      inputMode="decimal"
                      value={item.quantity ?? 1}
                      min={0}
                      step="0.01"
                      onChange={(e) => {
                        const q = Number(e.target.value);
                        const quantity = Number.isFinite(q) ? q : 0;
                        const unitPrice = item.unitPrice ?? 0;
                        const total = Math.round(quantity * unitPrice * 100) / 100;
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
                          unitLabel:
                            e.target.value as BudgetClientItem["unitLabel"],
                        })
                      }
                    >
                      <option value="partida">partida</option>
                      <option value="unitat">unitat</option>
                      <option value="m²">m²</option>
                    </select>
                  </label>

                  <label className={styles.itemField}>
                    <span className={styles.itemFieldLabel}>Preu</span>
                    <input
                      className={styles.itemFieldInput}
                      type="number"
                      inputMode="decimal"
                      value={item.unitPrice ?? 0}
                      min={0}
                      step="0.01"
                      onChange={(e) => {
                        const p = Number(e.target.value);
                        const unitPrice = Number.isFinite(p) ? p : 0;
                        const quantity = item.quantity ?? 1;
                        const total = Math.round(quantity * unitPrice * 100) / 100;
                        onItemChange(item.id, { unitPrice, total });
                      }}
                    />
                  </label>
                </div>
              ) : null}

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
                <span className={styles.optionGroupHint}>
                  Escollir una opció. No sumar els imports.
                </span>
              </div>
              <div className={styles.optionGroupBody}>
                {seg.items.map((item) =>
                  renderCard(
                    item,
                    (item.optionLabel ?? "").trim() || "Opció"
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
        {showPdf && pdfError ? (
          <p className={styles.saveError} role="alert">
            {pdfError}
          </p>
        ) : null}
        {footerNotice}
        <div className={styles.footerBtns}>
          {footerActions}
          {showPdf ? (
            <div className={styles.pdfDropdown} ref={pdfDropdownRef}>
              <button
                type="button"
                className={styles.pdfBtn}
                disabled={generating}
                aria-busy={generating || undefined}
                aria-haspopup="menu"
                aria-expanded={pdfMenuOpen}
                onClick={() => setPdfMenuOpen((v) => !v)}
              >
                {generating ? (
                  "PDF…"
                ) : (
                  <>
                    <FileDown size={16} aria-hidden="true" />
                    PDF
                    <ChevronDown size={14} aria-hidden="true" />
                  </>
                )}
              </button>
              {pdfMenuOpen ? (
                <div className={styles.pdfMenu} role="menu">
                  <button
                    type="button"
                    className={styles.pdfMenuItem}
                    role="menuitem"
                    disabled={generating}
                    onClick={() => handleGeneratePdfLang("ca")}
                  >
                    Català <span className={styles.pdfMenuHint}>PDF</span>
                  </button>
                  <button
                    type="button"
                    className={styles.pdfMenuItem}
                    role="menuitem"
                    disabled={generating}
                    onClick={() => handleGeneratePdfLang("es")}
                  >
                    Castellano <span className={styles.pdfMenuHint}>PDF</span>
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
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
