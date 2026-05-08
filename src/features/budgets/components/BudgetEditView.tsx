"use client";

import type {
  BudgetLineRow,
  BudgetRow,
  ClientRow,
} from "@/features/budgets/types/budgetsDb";
import { BudgetDraftView } from "@/features/budgets/components/BudgetDraftView";
import { BudgetAIInput } from "@/features/budgets/components/BudgetAIInput";
import { useBudgetEditController } from "@/features/budgets/hooks/useBudgetEditController";
import { useRouter } from "next/navigation";

export function BudgetEditView({
  budget,
  client,
  lines,
}: {
  budget: BudgetRow;
  client: ClientRow;
  lines: BudgetLineRow[];
}) {
  const c = useBudgetEditController({ budget, client, lines });
  const router = useRouter();

  return (
    <BudgetDraftView
      mode="edit"
      budgetStatus={budget.status}
      items={c.items}
      clientDetails={c.clientDetails}
      onClientDetailsChange={c.setClientWithAutoQuote}
      onItemChange={c.updateItem}
      onItemRemove={c.removeItem}
      itemsFooter={
        <BudgetAIInput
          loading={c.loading}
          formError={c.formError}
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
      onBack={() => router.push(`/budgets/${budget.id}`)}
      onSave={c.handleSave}
    />
  );
}
