import { useState } from "react";
import type { BudgetLine, BudgetOptionGroup, BudgetListItem } from "@/features/budgets/types/budget";
import {
  isBudgetOptionGroup,
} from "@/features/budgets/types/budget";
import { normalizeLinesWithDraftContext } from "@/features/budgets/lib/normalizeLinesWithDraftContext";
import {
  applyPricePerSqm,
  computeHasPending,
} from "@/features/budgets/lib/budgetLineComputations";

// ─── helpers ──────────────────────────────────────────────────────────────────

function getAllLines(items: BudgetListItem[]): BudgetLine[] {
  return items.flatMap((item) =>
    isBudgetOptionGroup(item)
        ? item.options
        : [item as BudgetLine]
  );
}

function applyLineMap(
  items: BudgetListItem[],
  map: Map<string, BudgetLine>
): BudgetListItem[] {
  return items.map((item) => {
    if (isBudgetOptionGroup(item)) {
      const updated = item.options.map((l) => map.get(l.id) ?? l);
      return {
        ...item,
        title: updated[0]?.label ?? item.title,
        options: updated,
      } satisfies BudgetOptionGroup;
    }
    return map.get((item as BudgetLine).id) ?? item;
  });
}

/** Remove a line from items (ungrouped or inside a group), disbanding group if only 1 line remains. */
function stripLine(prev: BudgetListItem[], lineId: string): BudgetListItem[] {
  return prev
    .map((item): BudgetListItem | null => {
      if (!isBudgetOptionGroup(item)) {
        return (item as BudgetLine).id === lineId ? null : item;
      }
      const filtered = item.options.filter((l) => l.id !== lineId);
      if (filtered.length === item.options.length) return item;
      if (filtered.length === 0) return null;
      if (filtered.length === 1) {
        const [only] = filtered;
        return {
          ...only,
          optionGroupId: undefined,
          optionLabel: undefined,
        };
      }
      return {
        ...item,
        title: filtered[0]?.label ?? item.title,
        options: filtered,
      };
    })
    .filter((item): item is BudgetListItem => item !== null);
}

function isOptionLine(line: BudgetLine): boolean {
  return typeof line.optionGroupId === "string" && line.optionGroupId.trim().length > 0;
}

function buildOptionGroups(items: BudgetListItem[]): BudgetListItem[] {
  const result: BudgetListItem[] = [];
  let i = 0;

  while (i < items.length) {
    const item = items[i];
    if (isBudgetOptionGroup(item)) {
      result.push(item);
      i += 1;
      continue;
    }

    const line = item as BudgetLine;
    if (!isOptionLine(line)) {
      result.push(line);
      i += 1;
      continue;
    }

    const groupId = line.optionGroupId!.trim();
    const options: BudgetLine[] = [line];
    let j = i + 1;
    while (j < items.length) {
      const next = items[j];
      if (isBudgetOptionGroup(next)) break;
      const nextLine = next as BudgetLine;
      if ((nextLine.optionGroupId ?? "").trim() !== groupId) break;
      options.push(nextLine);
      j += 1;
    }

    if (options.length < 2) {
      result.push({ ...line, optionGroupId: undefined, optionLabel: undefined });
    } else {
      const group: BudgetOptionGroup = {
        id: groupId,
        title: options[0]?.label ?? "Opcions alternatives",
        options,
      };
      result.push(group);
    }

    i = j;
  }

  return result;
}

// ─── hook ─────────────────────────────────────────────────────────────────────

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
    if (typeof patch.unitPrice === "number") {
      const targetLine = getAllLines(items).find((l) => l.id === id);
      if (targetLine?.type === "walls_and_ceilings" && targetLine.unitLabel === "m²") {
        setPricePerSqm(patch.unitPrice);
      }
    }

    setItems((prev) =>
      prev.map((item) => {
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
      })
    );
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
