import { useState } from "react";
import type {
  BudgetLine,
  BudgetListItem,
} from "@/features/budgets/types/budget";
import { isBudgetOptionGroup } from "@/features/budgets/types/budget";
import { normalizeLinesWithDraftContext } from "@/features/budgets/lib/normalizeLinesWithDraftContext";
import {
  applyPricePerSqm,
  computeHasPending,
} from "@/features/budgets/lib/budgetLineComputations";
import {
  applyLineMap,
  buildOptionGroups,
  getAllLines,
  stripLine,
} from "@/features/budgets/lib/budgetListItems";

export function useBudgetLines() {
  const [items, setItems] = useState<BudgetListItem[]>([]);
  const [pricePerSqm, setPricePerSqm] = useState(12);

  function addLines(newLines: BudgetLine[]) {
    setItems((prev) => {
      const existingLines = getAllLines(prev);
      const normalized = normalizeLinesWithDraftContext(
        newLines,
        existingLines
      );
      return buildOptionGroups([...prev, ...normalized]);
    });
  }

  function removeLine(id: string) {
    setItems((prev) => stripLine(prev, id));
  }

  function updateLine(
    id: string,
    patch: Partial<Pick<BudgetLine, "label" | "quantity" | "unitPrice">>
  ) {
    setItems((prev) => {
      if (typeof patch.unitPrice === "number") {
        const targetLine = getAllLines(prev).find((l) => l.id === id);
        if (
          targetLine?.type === "walls_and_ceilings" &&
          targetLine.unitLabel === "m²"
        ) {
          setPricePerSqm(patch.unitPrice);
        }
      }

      return prev.map((item) => {
        if (!isBudgetOptionGroup(item)) {
          const line = item as BudgetLine;
          if (line.id !== id) return line;
          const updated = { ...line, ...patch };
          return { ...updated, subtotal: updated.quantity * updated.unitPrice };
        }
        const updatedOptions = item.options.map((l) => {
          if (l.id !== id) return l;
          const updated = { ...l, ...patch };
          return { ...updated, subtotal: updated.quantity * updated.unitPrice };
        });
        return {
          ...item,
          title: updatedOptions[0]?.label ?? item.title,
          options: updatedOptions,
        };
      });
    });
  }

  // ─── derived state ──────────────────────────────────────────────────────────

  const allLines = getAllLines(items);
  const adjustedAllLines = applyPricePerSqm(allLines, pricePerSqm);
  const lineMap = new Map(adjustedAllLines.map((l) => [l.id, l]));
  const adjustedItems = applyLineMap(items, lineMap);

  const hasPending = computeHasPending(adjustedAllLines);

  return {
    items: adjustedItems,
    hasPending,
    pricePerSqm,
    setPricePerSqm,
    addLines,
    removeLine,
    updateLine,
  };
}
