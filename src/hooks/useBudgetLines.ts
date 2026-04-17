import { useState } from "react";
import type { BudgetLine } from "@/types/budget";
import { normalizeLinesWithDraftContext } from "@/lib/normalizeLinesWithDraftContext";
import {
  applyPricePerSqm,
  computeHasPending,
  computeTotal,
} from "@/lib/budgetLineComputations";

export function useBudgetLines() {
  const [draftLines, setDraftLines] = useState<BudgetLine[]>([]);
  const [pricePerSqm, setPricePerSqm] = useState(12);

  function addLines(newLines: BudgetLine[]) {
    setDraftLines((prev) => {
      const normalized = normalizeLinesWithDraftContext(newLines, prev);
      return [...prev, ...normalized];
    });
  }

  function removeLine(id: string) {
    setDraftLines((prev) => prev.filter((line) => line.id !== id));
  }

  function updateLine(
    id: string,
    patch: Partial<Pick<BudgetLine, "label" | "quantity" | "unitPrice">>
  ) {
    setDraftLines((prev) =>
      prev.map((line) => {
        if (line.id !== id) return line;
        const updated = { ...line, ...patch };
        return { ...updated, subtotal: updated.quantity * updated.unitPrice };
      })
    );
  }

  const adjustedLines = applyPricePerSqm(draftLines, pricePerSqm);
  const hasPending = computeHasPending(adjustedLines);
  const adjustedTotal = computeTotal(adjustedLines);

  return {
    adjustedLines,
    hasPending,
    adjustedTotal,
    pricePerSqm,
    setPricePerSqm,
    addLines,
    removeLine,
    updateLine,
  };
}
