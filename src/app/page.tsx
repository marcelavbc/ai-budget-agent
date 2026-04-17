"use client";

import { useGenerateBudgetDraft } from "@/hooks/useGenerateBudgetDraft";
import { useBudgetLines } from "@/hooks/useBudgetLines";
import { BudgetForm } from "@/components/BudgetForm";
import { BudgetLinesList } from "@/components/BudgetLinesList";

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
  } = useBudgetLines();

  async function handleSubmit(description: string): Promise<boolean> {
    const lines = await submit(description);
    if (lines) {
      addLines(lines);
      return true;
    }
    return false;
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
        />
      </div>
    </div>
  );
}
