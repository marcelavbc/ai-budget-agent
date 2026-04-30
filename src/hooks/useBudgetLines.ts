import { useState } from "react";
import type {
  BudgetLine,
  BudgetGroup,
  BudgetOptionGroup,
  BudgetListItem,
  BudgetLineType,
} from "@/types/budget";
import {
  isBudgetGroup,
  isBudgetOptionGroup,
  templateGroup,
  canGroup,
} from "@/types/budget";
import { normalizeLinesWithDraftContext } from "@/lib/normalizeLinesWithDraftContext";
import {
  applyPricePerSqm,
  computeHasPending,
} from "@/lib/budgetLineComputations";

// ─── helpers ──────────────────────────────────────────────────────────────────

function getAllLines(items: BudgetListItem[]): BudgetLine[] {
  return items.flatMap((item) =>
    isBudgetGroup(item)
      ? item.lines
      : isBudgetOptionGroup(item)
        ? item.options
        : [item as BudgetLine]
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
      if (!isBudgetGroup(item) && !isBudgetOptionGroup(item)) {
        return (item as BudgetLine).id === lineId ? null : item;
      }
      if (isBudgetOptionGroup(item)) {
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
      }
      const filtered = item.lines.filter((l) => l.id !== lineId);
      if (filtered.length === item.lines.length) return item;
      if (filtered.length === 0) return null;
      if (filtered.length === 1) return filtered[0];
      return { ...item, lines: filtered, subtotal: groupSubtotal(filtered) };
    })
    .filter((item): item is BudgetListItem => item !== null);
}

const AUTO_GROUP_RULES: Record<string, BudgetLineType[]> = {
  interior: ["walls_and_ceilings", "repair"],
  openings: ["doors", "windows"],
  exterior: ["exterior"],
};

function autoGroup(items: BudgetListItem[]): BudgetListItem[] {
  let result = [...items];

  for (const [zone, types] of Object.entries(AUTO_GROUP_RULES)) {
    // Collect loose lines that belong to this zone
    const looseIds = new Set(
      result
        .filter(
          (item): item is BudgetLine =>
            !isBudgetGroup(item) &&
            !isBudgetOptionGroup(item) &&
            !((item as BudgetLine).optionGroupId ?? "").trim() &&
            types.includes((item as BudgetLine).type)
        )
        .map((l) => l.id)
    );

    if (looseIds.size === 0) continue;

    // Find an existing group for this zone
    const existingGroup = result.find(
      (item) => isBudgetGroup(item) && (item as BudgetGroup).zone === zone
    ) as BudgetGroup | undefined;

    if (existingGroup) {
      // Add loose lines into the existing group
      const looseLines = result.filter(
        (item): item is BudgetLine =>
          !isBudgetGroup(item) &&
          !isBudgetOptionGroup(item) &&
          looseIds.has((item as BudgetLine).id)
      );
      result = result
        .filter(
          (item) =>
            !(
              !isBudgetGroup(item) &&
              !isBudgetOptionGroup(item) &&
              looseIds.has((item as BudgetLine).id)
            )
        )
        .map((item) => {
          if (isBudgetGroup(item) && item.id === existingGroup.id) {
            const lines = [...item.lines, ...looseLines];
            return { ...item, lines, subtotal: groupSubtotal(lines) };
          }
          return item;
        });
    } else if (looseIds.size > 1) {
      // Create a new group only when there are 2+ loose lines
      const looseLines = result.filter(
        (item): item is BudgetLine =>
          !isBudgetGroup(item) &&
          !isBudgetOptionGroup(item) &&
          looseIds.has((item as BudgetLine).id)
      );
      const newGroup: BudgetGroup = {
        id: `group-${crypto.randomUUID()}`,
        zone,
        lines: looseLines,
        subtotal: groupSubtotal(looseLines),
      };
      // Replace loose lines with the new group (at position of first loose line)
      let placed = false;
      result = result
        .map((item): BudgetListItem | null => {
          if (isBudgetGroup(item)) return item;
          if (isBudgetOptionGroup(item)) return item;
          const id = (item as BudgetLine).id;
          if (!looseIds.has(id)) return item;
          if (!placed) {
            placed = true;
            return newGroup;
          }
          return null;
        })
        .filter((item): item is BudgetListItem => item !== null);
    }
  }

  return result;
}

function isOptionLine(line: BudgetLine): boolean {
  return typeof line.optionGroupId === "string" && line.optionGroupId.trim().length > 0;
}

function buildOptionGroups(items: BudgetListItem[]): BudgetListItem[] {
  const result: BudgetListItem[] = [];
  let i = 0;

  while (i < items.length) {
    const item = items[i];
    if (isBudgetGroup(item) || isBudgetOptionGroup(item)) {
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
      if (isBudgetGroup(next) || isBudgetOptionGroup(next)) break;
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
      return buildOptionGroups(autoGroup([...prev, ...normalized]));
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
        if (!isBudgetGroup(item) && !isBudgetOptionGroup(item)) {
          const line = item as BudgetLine;
          if (line.id !== id) return line;
          const updated = { ...line, ...patch };
          return { ...updated, subtotal: updated.quantity * updated.unitPrice };
        }
        if (isBudgetOptionGroup(item)) {
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
   * Returns false when template groups are incompatible — no state change is made.
   */
  function moveLineToTarget(dragLineId: string, targetId: string): boolean {
    let compatible = false;

    setItems((prev) => {
      const allLines = getAllLines(prev);
      const dragLine = allLines.find((l) => l.id === dragLineId);
      if (!dragLine) return prev;
      if ((dragLine.optionGroupId ?? "").trim()) return prev;

      const dragGroup = templateGroup[dragLine.type];

      // ── dropped on a group ───────────────────────────────────────────────
      const targetGroup = prev.find(
        (item) => isBudgetGroup(item) && item.id === targetId
      ) as BudgetGroup | undefined;

      if (targetGroup) {
        if (dragGroup === "custom" || targetGroup.zone !== dragGroup)
          return prev;
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
      if ((targetLine.optionGroupId ?? "").trim()) return prev;

      if (!canGroup(dragLine, targetLine)) return prev;
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
        zone: dragGroup,
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

  return {
    items: adjustedItems,
    hasPending,
    pricePerSqm,
    setPricePerSqm,
    addLines,
    removeLine,
    updateLine,
    moveLineToTarget,
    ungroupGroup,
  };
}
