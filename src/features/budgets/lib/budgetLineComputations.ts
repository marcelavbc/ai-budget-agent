import type {
  BudgetClientItem,
  BudgetLine,
  BudgetLineType,
  BudgetLineUnit,
} from "@/features/budgets/types/budget";
import { isPricePending } from "@/features/budgets/lib/isPricePending";

export function shouldApplyPricePerSqm(item: {
  lineType?: BudgetLineType;
  unitLabel?: BudgetLineUnit;
  title?: string;
}): boolean {
  if (item.unitLabel !== "m²") return false;
  if (item.lineType === "walls_and_ceilings") return true;
  if (item.lineType) return false;
  const t = (item.title ?? "").toLowerCase();
  if (t.includes("reparació") || t.includes("reparacio")) return false;
  return true;
}

export function totalForPricePerSqm(
  quantity: number,
  pricePerSqm: number
): number {
  return Math.round(quantity * pricePerSqm * 100) / 100;
}

export function applyPricePerSqmToClientItem(
  item: BudgetClientItem,
  pricePerSqm: number
): BudgetClientItem {
  const quantity = item.quantity ?? 0;
  return {
    ...item,
    unitPrice: pricePerSqm,
    total: totalForPricePerSqm(quantity, pricePerSqm),
  };
}

export function applyPricePerSqmToClientItems(
  items: BudgetClientItem[],
  pricePerSqm: number
): BudgetClientItem[] {
  return items.map((item) =>
    shouldApplyPricePerSqm(item)
      ? applyPricePerSqmToClientItem(item, pricePerSqm)
      : item
  );
}

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
