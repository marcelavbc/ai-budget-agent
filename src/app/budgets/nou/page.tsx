"use client";

import { BudgetDraftView } from "@/features/budgets/components/BudgetDraftView";
import { BudgetAIInput } from "@/features/budgets/components/BudgetAIInput";
import { useBudgetCreateController } from "@/features/budgets/hooks/useBudgetCreateController";

import styles from "./page.module.css";

export default function NewBudgetPage() {
  const c = useBudgetCreateController();

  return (
    <div className={styles.wrap}>
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.title}>
            {c.persistedBudget ? "Editar pressupost" : "Nou pressupost"}
          </h1>
        </header>

        <BudgetDraftView
          mode={c.persistedBudget ? "edit" : "create"}
          showEditHeading={false}
          budgetId={c.persistedBudget?.budgetId}
          budgetStatus={c.budgetStatus}
          onBudgetStatusChange={c.setBudgetStatus}
          items={c.items}
          clientDetails={c.clientDetails}
          onClientDetailsChange={c.setClientWithAutoQuote}
          onItemChange={c.updateItem}
          onItemsReplace={c.replaceItems}
          onItemRemove={c.removeItem}
          itemsFooter={
            <BudgetAIInput
              loading={c.loading}
              formError={c.formError}
              showPricePerSqm={true}
              pricePerSqm={c.pricePerSqm}
              onPriceChange={c.setPricePerSqm}
              onSubmit={async (description) => {
                const lines = await c.submit(description);
                if (!lines) return false;
                c.appendAiLines(lines);
                return true;
              }}
            />
          }
          quoteManuallyEdited={c.quoteManuallyEdited}
          onQuoteNumberChange={c.onQuoteNumberChange}
          onResetQuoteAutomation={c.resetAutomation}
          onContactSelect={c.onContactSelect}
          onSave={c.handleSave}
        />
      </div>
    </div>
  );
}
