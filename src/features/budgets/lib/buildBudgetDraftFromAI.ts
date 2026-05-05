import { hydrateBudgetLines } from "@/features/budgets/lib/hydrateBudgetLines";
import { parseBudgetLinesWithAI } from "@/features/budgets/lib/parseBudgetLinesWithAI";
import type { BudgetLine } from "@/features/budgets/types/budget";

export async function buildBudgetDraftFromAI(
  description: string
): Promise<BudgetLine[]> {
  const parsed = await parseBudgetLinesWithAI(description);

  return hydrateBudgetLines(parsed.lines);
}
