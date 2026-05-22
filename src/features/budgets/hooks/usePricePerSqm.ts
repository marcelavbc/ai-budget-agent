import { useCallback, useState } from "react";
import type { BudgetClientItem } from "@/features/budgets/types/budget";

const DEFAULT_PRICE_PER_SQM = 12;

function applyPricePerSqmToItems(
  items: BudgetClientItem[],
  pricePerSqm: number
): BudgetClientItem[] {
  return items.map((item) => {
    if (item.unitLabel !== "m²") return item;
    const quantity = item.quantity ?? 0;
    return {
      ...item,
      unitPrice: pricePerSqm,
      total: Math.round(quantity * pricePerSqm * 100) / 100,
    };
  });
}

export function usePricePerSqm(args: {
  items: BudgetClientItem[];
  onItemsReplace: (items: BudgetClientItem[]) => void;
}) {
  const { items, onItemsReplace } = args;
  const [pricePerSqm, setPricePerSqmState] = useState(DEFAULT_PRICE_PER_SQM);

  const setPricePerSqm = useCallback(
    (value: number) => {
      setPricePerSqmState(value);
      onItemsReplace(applyPricePerSqmToItems(items, value));
    },
    [items, onItemsReplace]
  );

  return { pricePerSqm, setPricePerSqm };
}
