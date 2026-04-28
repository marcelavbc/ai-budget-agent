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
  onSave?: (args: {
    client: BudgetClientDetails;
    items: BudgetClientItem[];
    subtotal: number;
  }) => Promise<void>;
  quoteManuallyEdited: boolean;
  onQuoteNumberChange: (value: string) => void;
  onResetQuoteAutomation: () => void;
  onBack: () => void;
}

export function BudgetDraftView({
  mode = "create",
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

  async function handleGeneratePdfLang(lang: "ca" | "es") {
    setPdfMenuOpen(false);
    await exportPdf({ client, items, total: subtotal, lang });
  }
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
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
        await onSave({ client, items, subtotal });
      } else {
        const { budgetId } = await saveBudgetWithLines({
          client,
          items,
          subtotal,
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
        {items.map((item) => (
          <li key={item.id} className={styles.card}>
            <div className={styles.cardHeader}>
              {mode === "edit" ? (
                <input
                  className={styles.itemTitleInput}
                  type="text"
                  value={item.title}
                  onChange={(e) =>
                    onItemChange(item.id, { title: e.target.value })
                  }
                  placeholder="Títol de la partida"
                />
              ) : (
                <span className={styles.cardTitle}>{item.title}</span>
              )}
              <div className={styles.cardHeaderRight}>
                <span className={styles.cardTotal}>
                  {formatEUR(item.total)}
                </span>
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
                      const total =
                        Math.round(quantity * unitPrice * 100) / 100;
                      onItemChange(item.id, { unitPrice, total });
                    }}
                  />
                </label>
              </div>
            ) : null}

            <textarea
              className={styles.descTextarea}
              value={item.description}
              onChange={(e) => handleDescriptionChange(item.id, e.target.value)}
              rows={4}
              placeholder="Descripció de la partida…"
            />
          </li>
        ))}
      </ul>

      {mode === "edit" && itemsFooter ? (
        <div className={styles.itemsFooter}>{itemsFooter}</div>
      ) : null}

      <div className={styles.footer}>
        <span className={styles.totalLabel}>Total pressupost</span>
        <span className={styles.totalValue}>{formatEUR(subtotal)}</span>
        {saveError ? (
          <p className={styles.saveError} role="alert">
            {saveError}
          </p>
        ) : null}
        {pdfError ? (
          <p className={styles.saveError} role="alert">
            {pdfError}
          </p>
        ) : null}
        <div className={styles.footerBtns}>
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
