"use client";

import { useState } from "react";
import { useGenerateBudgetDraft } from "@/features/budgets/hooks/useGenerateBudgetDraft";
import { useBudgetLines } from "@/features/budgets/hooks/useBudgetLines";
import { useQuoteNumber } from "@/features/budgets/hooks/useQuoteNumber";
import { BudgetForm } from "@/features/budgets/components/BudgetForm";
import { BudgetLinesList } from "@/features/budgets/components/BudgetLinesList";
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
    defaultBudgetClientDetails,
  );
  const {
    quoteManuallyEdited,
    setClientWithAutoQuote,
    onQuoteNumberChange,
    resetAutomation,
  } = useQuoteNumber({ setClientDetails, initialManuallyEdited: false });

  async function handleSubmit(description: string): Promise<boolean> {
    const lines = await submit(description);
    if (lines) {
      addLines(lines);
      return true;
    }
    return false;
  }

  function handleGenerateDraft() {
    setDraftItems(generateBudgetDraft(items));
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

            <BudgetLinesList
              items={items}
              hasPending={hasPending}
              warnings={lastResponse?.errors}
              onRemoveLine={removeLine}
              onUpdateLine={updateLine}
              onGenerateDraft={handleGenerateDraft}
            />
          </>
        ) : (
          <BudgetDraftView
            items={draftItems}
            clientDetails={clientDetails}
            onClientDetailsChange={setClientWithAutoQuote}
            onItemChange={(id, patch) => {
              setDraftItems((prev) =>
                prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
              );
            }}
            onItemRemove={(id) => {
              setDraftItems((prev) => prev.filter((item) => item.id !== id));
            }}
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

