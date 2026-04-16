import { hydrateBudgetLines } from "@/lib/hydrateBudgetLines";
import { parseBudgetLinesWithAI } from "@/lib/parseBudgetLinesWithAI";
import type { BudgetLine } from "@/types/budget";

export async function buildBudgetDraftFromAI(
  description: string
): Promise<BudgetLine[]> {
  const parsed = await parseBudgetLinesWithAI(description);

  return hydrateBudgetLines(parsed.lines);
}
