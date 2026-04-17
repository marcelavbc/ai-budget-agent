import type { BudgetLine } from "@/types/budget";
import { formatEUR } from "@/lib/formatCurrency";
import { isPricePending } from "@/lib/isPricePending";

export function displayLinePrice(line: BudgetLine): string {
  if (isPricePending(line)) return "Pendent";
  return formatEUR(line.subtotal);
}
