import type { BudgetLine } from "@/types/budget";
import { isPricePending } from "@/lib/isPricePending";

export function applyPricePerSqm(
  lines: BudgetLine[],
  pricePerSqm: number
): BudgetLine[] {
  return lines.map((line) =>
    line.type === "walls_and_ceilings" && line.unitLabel === "m²"
      ? {
          ...line,
          unitPrice: pricePerSqm,
          subtotal: line.quantity * pricePerSqm,
        }
      : line
  );
}

export function computeHasPending(lines: BudgetLine[]): boolean {
  return lines.some(isPricePending);
}
