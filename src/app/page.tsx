"use client";

import { useGenerateBudgetDraft } from "@/hooks/useGenerateBudgetDraft";
import { useBudgetLines } from "@/hooks/useBudgetLines";
import { BudgetForm } from "@/components/BudgetForm";
import { BudgetLinesList } from "@/components/BudgetLinesList";

import styles from "./page.module.css";

export default function Home() {
  const { submit, loading, formError, lastResponse } = useGenerateBudgetDraft();
  const {
    adjustedLines,
    hasPending,
    adjustedTotal,
    pricePerSqm,
    setPricePerSqm,
    addLines,
    removeLine,
  } = useBudgetLines();

  async function handleSubmit(description: string): Promise<boolean> {
    const result = await submit(description);
    if (result) {
      addLines(result.lines);
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
          lines={adjustedLines}
          hasPending={hasPending}
          total={adjustedTotal}
          warnings={lastResponse?.errors}
          onRemoveLine={removeLine}
        />
      </div>
    </div>
  );
}
