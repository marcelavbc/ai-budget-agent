"use client";

import { useState, useEffect } from "react";
import { useGenerateBudgetDraft } from "@/features/budgets/hooks/useGenerateBudgetDraft";
import { useBudgetLines } from "@/features/budgets/hooks/useBudgetLines";
import { useQuoteNumber } from "@/features/budgets/hooks/useQuoteNumber";
import { BudgetForm } from "@/features/budgets/components/BudgetForm";
import BudgetDraftEditor from "@/features/budgets/components/BudgetDraftEditor";
import { BudgetDraftView } from "@/features/budgets/components/BudgetDraftView";
import { generateBudgetDraft } from "@/features/budgets/lib/generateBudgetDraft";
import {
  defaultBudgetClientDetails,
  type BudgetClientDetails,
  type BudgetClientItem,
} from "@/features/budgets/types/budget";

import styles from "./page.module.css";

export default function NewBudgetPage() {
  const { submit, loading, formError, lastResponse } = useGenerateBudgetDraft();
  const {
    items,
    hasPending,
    pricePerSqm,
    setPricePerSqm,
    addLines,
    removeLine,
    updateLine,
  } = useBudgetLines();

  const [view, setView] = useState<"lines" | "draft">("lines");
  const [draftItems, setDraftItems] = useState<BudgetClientItem[]>([]);
  const [clientDetails, setClientDetails] = useState<BudgetClientDetails>(
    defaultBudgetClientDetails
  );
  const {
    quoteManuallyEdited,
    setClientWithAutoQuote,
    onQuoteNumberChange,
    resetAutomation,
  } = useQuoteNumber({ setClientDetails, initialManuallyEdited: false });

  // Sync BudgetLine[] → BudgetClientItem[] as AI adds items, preserving user edits
  useEffect(() => {
    if (items.length === 0) return;
    const freshClientItems = generateBudgetDraft(items);
    setDraftItems((prev) => {
      const existingMap = new Map(prev.map((item) => [item.id, item]));
      return freshClientItems.map((fresh) => {
        const existing = existingMap.get(fresh.id);
        if (!existing) return fresh;
        return {
          ...existing,
          clientDescription:
            fresh.clientDescription ?? existing.clientDescription,
        };
      });
    });
  }, [items]);

  async function handleSubmit(description: string): Promise<boolean> {
    const lines = await submit(description);
    if (lines) {
      addLines(lines);
      return true;
    }
    return false;
  }

  function handleItemRemove(id: string) {
    setDraftItems((prev) => prev.filter((item) => item.id !== id));
    removeLine(id);
  }

  function handleDraftItemChange(id: string, patch: Partial<BudgetClientItem>) {
    setDraftItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );

    const linePatch: Parameters<typeof updateLine>[1] = {};
    if (patch.title !== undefined) linePatch.label = patch.title;
    if (patch.quantity !== undefined) linePatch.quantity = patch.quantity;
    if (patch.unitPrice !== undefined) linePatch.unitPrice = patch.unitPrice;

    if (Object.keys(linePatch).length > 0) {
      updateLine(id, linePatch);
    }
  }

  function handleGenerateDraft() {
    setView("draft");
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.title}>Nou pressupost</h1>
        </header>

        {view === "lines" ? (
          <>
            <BudgetForm
              loading={loading}
              formError={formError}
              pricePerSqm={pricePerSqm}
              onPriceChange={setPricePerSqm}
              onSubmit={handleSubmit}
            />

            {draftItems.length === 0 ? (
              <section className={styles.emptyItems} aria-live="polite">
                <h2 className={styles.emptyItemsTitle}>
                  Encara no hi ha partides
                </h2>
                <p className={styles.emptyItemsText}>
                  Escriu una partida a dalt (p. ex. Pintar menjador 18 m²) i la
                  veurem aquí amb el preu estimat i la descripció.
                </p>
              </section>
            ) : (
              <>
                {lastResponse?.errors && lastResponse.errors.length > 0 && (
                  <div className={styles.warnings}>
                    <p className={styles.warningsTitle}>Avís</p>
                    <ul className={styles.warningsList}>
                      {lastResponse.errors.map((msg, index) => (
                        <li key={`warning-${index}-${msg}`}>{msg}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <BudgetDraftEditor
                  items={draftItems}
                  onItemChange={handleDraftItemChange}
                  onItemRemove={handleItemRemove}
                  warnings={lastResponse?.errors}
                />
                <div className={styles.generateBlock}>
                  <button
                    className={styles.generateBtn}
                    onClick={handleGenerateDraft}
                    disabled={hasPending}
                  >
                    Generar esborrany
                  </button>
                </div>
              </>
            )}
          </>
        ) : (
          <BudgetDraftView
            items={draftItems}
            clientDetails={clientDetails}
            onClientDetailsChange={setClientWithAutoQuote}
            onItemChange={handleDraftItemChange}
            onItemRemove={handleItemRemove}
            quoteManuallyEdited={quoteManuallyEdited}
            onQuoteNumberChange={onQuoteNumberChange}
            onResetQuoteAutomation={resetAutomation}
            onBack={() => setView("lines")}
          />
        )}
      </div>
    </div>
  );
}
