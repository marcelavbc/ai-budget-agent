"use client";

import { useRef, useState, type SetStateAction } from "react";
import { buildAutoQuoteNumber } from "@/lib/generateQuoteNumber";
import { useGenerateBudgetDraft } from "@/hooks/useGenerateBudgetDraft";
import { useBudgetLines } from "@/hooks/useBudgetLines";
import { BudgetForm } from "@/components/BudgetForm";
import { BudgetLinesList } from "@/components/BudgetLinesList";
import { BudgetDraftView } from "@/components/BudgetDraftView";
import { generateBudgetDraft } from "@/lib/generateBudgetDraft";
import {
  defaultBudgetClientDetails,
  type BudgetClientDetails,
  type BudgetClientItem,
} from "@/types/budget";

import styles from "./page.module.css";

export default function NewBudgetPage() {
  const { submit, loading, formError, lastResponse } = useGenerateBudgetDraft();
  const {
    items,
    hasPending,
    adjustedTotal,
    pricePerSqm,
    setPricePerSqm,
    addLines,
    removeLine,
    updateLine,
    moveLineToTarget,
    ungroupGroup,
  } = useBudgetLines();

  const [view, setView] = useState<"lines" | "draft">("lines");
  const [draftItems, setDraftItems] = useState<BudgetClientItem[]>([]);
  const [clientDetails, setClientDetails] = useState<BudgetClientDetails>(
    defaultBudgetClientDetails,
  );
  const [quoteManuallyEdited, setQuoteManuallyEdited] = useState(false);
  const quoteManuallyEditedRef = useRef(false);

  function setClientWithAutoQuote(action: SetStateAction<BudgetClientDetails>) {
    setClientDetails((prev) => {
      const next =
        typeof action === "function"
          ? (action as (p: BudgetClientDetails) => BudgetClientDetails)(prev)
          : action;
      const nameOrDateChanged =
        next.nameOrCompany !== prev.nameOrCompany || next.date !== prev.date;
      if (!quoteManuallyEditedRef.current && nameOrDateChanged) {
        return {
          ...next,
          quoteNumber: buildAutoQuoteNumber(next.nameOrCompany, next.date),
        };
      }
      return next;
    });
  }

  function handleQuoteNumberChange(value: string) {
    setQuoteManuallyEdited(true);
    quoteManuallyEditedRef.current = true;
    setClientDetails((prev) => ({ ...prev, quoteNumber: value }));
  }

  function handleResetQuoteAutomation() {
    setQuoteManuallyEdited(false);
    quoteManuallyEditedRef.current = false;
    setClientDetails((prev) => ({
      ...prev,
      quoteNumber: buildAutoQuoteNumber(prev.nameOrCompany, prev.date),
    }));
  }

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
              total={adjustedTotal}
              warnings={lastResponse?.errors}
              onRemoveLine={removeLine}
              onUpdateLine={updateLine}
              onGroupLines={moveLineToTarget}
              onUngroupGroup={ungroupGroup}
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
            quoteManuallyEdited={quoteManuallyEdited}
            onQuoteNumberChange={handleQuoteNumberChange}
            onResetQuoteAutomation={handleResetQuoteAutomation}
            onBack={() => setView("lines")}
          />
        )}
      </div>
    </div>
  );
}

