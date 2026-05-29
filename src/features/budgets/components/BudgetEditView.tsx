"use client";

import type {
  BudgetLineRow,
  BudgetRow,
  ContactRow,
} from "@/features/budgets/types/budgetsDb";
import { BudgetDraftView } from "@/features/budgets/components/BudgetDraftView";
import { BudgetAIInput } from "@/features/budgets/components/BudgetAIInput";
import { useBudgetEditController } from "@/features/budgets/hooks/useBudgetEditController";

export function BudgetEditView({
  budget,
  contact,
  lines,
}: {
  budget: BudgetRow;
  contact: ContactRow;
  lines: BudgetLineRow[];
}) {
  const c = useBudgetEditController({ budget, contact, lines });

  return (
    <BudgetDraftView
      mode="edit"
      budgetId={budget.id}
      budgetStatus={budget.status}
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
          submitLabel="Afegir"
          placeholder="Escriu el que vols afegir… (p. ex. Pintar passadís 8 m² + reparar esquerdes)"
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
      onSave={c.handleSave}
    />
  );
}
