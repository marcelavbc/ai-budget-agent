import { useState } from "react";
import type { BudgetLine, BudgetGroup, BudgetListItem } from "@/types/budget";
import { isBudgetGroup } from "@/types/budget";
import { normalizeLinesWithDraftContext } from "@/lib/normalizeLinesWithDraftContext";
import {
  applyPricePerSqm,
  computeHasPending,
  computeTotal,
} from "@/lib/budgetLineComputations";
import { extractZone } from "@/lib/extractZone";

// ─── helpers ──────────────────────────────────────────────────────────────────

function getAllLines(items: BudgetListItem[]): BudgetLine[] {
  return items.flatMap((item) =>
    isBudgetGroup(item) ? item.lines : [item as BudgetLine]
  );
}

function groupSubtotal(lines: BudgetLine[]): number {
  return lines.reduce((sum, l) => sum + l.subtotal, 0);
}

function applyLineMap(
  items: BudgetListItem[],
  map: Map<string, BudgetLine>
): BudgetListItem[] {
  return items.map((item) => {
    if (isBudgetGroup(item)) {
      const updated = item.lines.map((l) => map.get(l.id) ?? l);
      return { ...item, lines: updated, subtotal: groupSubtotal(updated) };
    }
    return map.get((item as BudgetLine).id) ?? item;
  });
}

/** Remove a line from items (ungrouped or inside a group), disbanding group if only 1 line remains. */
function stripLine(prev: BudgetListItem[], lineId: string): BudgetListItem[] {
  return prev
    .map((item): BudgetListItem | null => {
      if (!isBudgetGroup(item)) {
        return (item as BudgetLine).id === lineId ? null : item;
      }
      const filtered = item.lines.filter((l) => l.id !== lineId);
      if (filtered.length === item.lines.length) return item;
      if (filtered.length === 0) return null;
      if (filtered.length === 1) return filtered[0];
      return { ...item, lines: filtered, subtotal: groupSubtotal(filtered) };
    })
    .filter((item): item is BudgetListItem => item !== null);
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
      return [...prev, ...normalized];
    });
  }

  function removeLine(id: string) {
    setItems((prev) => stripLine(prev, id));
  }

  function updateLine(
    id: string,
    patch: Partial<Pick<BudgetLine, "label" | "quantity" | "unitPrice">>
  ) {
    setItems((prev) =>
      prev.map((item) => {
        if (!isBudgetGroup(item)) {
          const line = item as BudgetLine;
          if (line.id !== id) return line;
          const updated = { ...line, ...patch };
          return { ...updated, subtotal: updated.quantity * updated.unitPrice };
        }
        const updatedLines = item.lines.map((l) => {
          if (l.id !== id) return l;
          const updated = { ...l, ...patch };
          return { ...updated, subtotal: updated.quantity * updated.unitPrice };
        });
        return {
          ...item,
          lines: updatedLines,
          subtotal: groupSubtotal(updatedLines),
        };
      })
    );
  }

  /**
   * Moves dragLineId onto targetId (another line or a group).
   * Returns false when zones are incompatible — no state change is made.
   */
  function moveLineToTarget(dragLineId: string, targetId: string): boolean {
    let compatible = false;

    setItems((prev) => {
      const allLines = getAllLines(prev);
      const dragLine = allLines.find((l) => l.id === dragLineId);
      if (!dragLine) return prev;

      const dragZone = extractZone(dragLine.label);

      // ── dropped on a group ───────────────────────────────────────────────
      const targetGroup = prev.find(
        (item) => isBudgetGroup(item) && item.id === targetId
      ) as BudgetGroup | undefined;

      if (targetGroup) {
        if (targetGroup.zone !== dragZone) return prev;
        compatible = true;
        const stripped = stripLine(prev, dragLineId);
        return stripped.map((item) => {
          if (isBudgetGroup(item) && item.id === targetId) {
            const lines = [...item.lines, dragLine];
            return { ...item, lines, subtotal: groupSubtotal(lines) };
          }
          return item;
        });
      }

      // ── dropped on a line ────────────────────────────────────────────────
      const targetLine = allLines.find((l) => l.id === targetId);
      if (!targetLine) return prev;

      if (extractZone(targetLine.label) !== dragZone) return prev;
      compatible = true;

      // If targetLine is inside an existing group, add dragLine there
      const hostGroup = prev.find(
        (item) =>
          isBudgetGroup(item) &&
          (item as BudgetGroup).lines.some((l) => l.id === targetId)
      ) as BudgetGroup | undefined;

      if (hostGroup) {
        const stripped = stripLine(prev, dragLineId);
        return stripped.map((item) => {
          if (isBudgetGroup(item) && item.id === hostGroup.id) {
            const lines = [...item.lines, dragLine];
            return { ...item, lines, subtotal: groupSubtotal(lines) };
          }
          return item;
        });
      }

      // Both ungrouped → create new group at targetLine's position
      const newGroup: BudgetGroup = {
        id: `group-${crypto.randomUUID()}`,
        zone: dragZone,
        lines: [targetLine, dragLine],
        subtotal: groupSubtotal([targetLine, dragLine]),
      };

      return prev
        .map((item): BudgetListItem | null => {
          if (isBudgetGroup(item)) return item;
          const lineId = (item as BudgetLine).id;
          if (lineId === targetId) return newGroup;
          if (lineId === dragLineId) return null;
          return item;
        })
        .filter((item): item is BudgetListItem => item !== null);
    });

    return compatible;
  }

  function ungroupGroup(groupId: string) {
    setItems((prev) =>
      prev.flatMap((item) => {
        if (isBudgetGroup(item) && item.id === groupId) return item.lines;
        return [item];
      })
    );
  }

  // ─── derived state ──────────────────────────────────────────────────────────

  const allLines = getAllLines(items);
  const adjustedAllLines = applyPricePerSqm(allLines, pricePerSqm);
  const lineMap = new Map(adjustedAllLines.map((l) => [l.id, l]));
  const adjustedItems = applyLineMap(items, lineMap);

  const hasPending = computeHasPending(adjustedAllLines);
  const adjustedTotal = computeTotal(adjustedAllLines);

  return {
    items: adjustedItems,
    hasPending,
    adjustedTotal,
    pricePerSqm,
    setPricePerSqm,
    addLines,
    removeLine,
    updateLine,
    moveLineToTarget,
    ungroupGroup,
  };
}
