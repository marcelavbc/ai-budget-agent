import { useCallback, useState } from "react";
import type { BudgetClientItem } from "@/features/budgets/types/budget";
import {
  applyPricePerSqmToClientItem,
  applyPricePerSqmToClientItems,
  shouldApplyPricePerSqm,
} from "@/features/budgets/lib/budgetLineComputations";

const DEFAULT_PRICE_PER_SQM = 12;

export function usePricePerSqm(args: {
  items: BudgetClientItem[];
  onItemsReplace: (items: BudgetClientItem[]) => void;
}) {
  const { items, onItemsReplace } = args;
  const [pricePerSqm, setPricePerSqmState] = useState(DEFAULT_PRICE_PER_SQM);

  const setPricePerSqm = useCallback(
    (value: number) => {
      setPricePerSqmState(value);
      onItemsReplace(applyPricePerSqmToClientItems(items, value));
    },
    [items, onItemsReplace]
  );

  const applyPriceToNewItems = useCallback(
    (newItems: BudgetClientItem[]) =>
      newItems.map((item) =>
        shouldApplyPricePerSqm(item)
          ? applyPricePerSqmToClientItem(item, pricePerSqm)
          : item
      ),
    [pricePerSqm]
  );

  return { pricePerSqm, setPricePerSqm, applyPriceToNewItems };
}
