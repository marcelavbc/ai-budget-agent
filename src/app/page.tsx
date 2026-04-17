"use client";

import { useState } from "react";
import { useGenerateBudgetDraft } from "@/hooks/useGenerateBudgetDraft";
import { useBudgetLines } from "@/hooks/useBudgetLines";
import { BudgetForm } from "@/components/BudgetForm";
import { BudgetLinesList } from "@/components/BudgetLinesList";
import { BudgetDraftView } from "@/components/BudgetDraftView";
import { generateBudgetDraft } from "@/lib/generateBudgetDraft";
import type { BudgetClientItem } from "@/types/budget";

import styles from "./page.module.css";

export default function Home() {
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
          <h1 className={styles.title}>Pressupost de pintura</h1>
          <p className={styles.subtitle}>
            Escriu una partida i afegeix-la al pressupost.
          </p>
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
          <BudgetDraftView items={draftItems} onBack={() => setView("lines")} />
        )}
      </div>
    </div>
  );
}
