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
  };
}
