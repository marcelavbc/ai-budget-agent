import type {
  BudgetLine,
  BudgetOptionGroup,
  BudgetListItem,
} from "@/features/budgets/types/budget";
import { isBudgetOptionGroup } from "@/features/budgets/types/budget";

export function getAllLines(items: BudgetListItem[]): BudgetLine[] {
  return items.flatMap((item) =>
    isBudgetOptionGroup(item) ? item.options : [item as BudgetLine]
  );
}

export function applyLineMap(
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
export function stripLine(
  prev: BudgetListItem[],
  lineId: string
): BudgetListItem[] {
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

export function isOptionLine(line: BudgetLine): boolean {
  return (
    typeof line.optionGroupId === "string" &&
    line.optionGroupId.trim().length > 0
  );
}

export function buildOptionGroups(items: BudgetListItem[]): BudgetListItem[] {
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
      result.push({
        ...line,
        optionGroupId: undefined,
        optionLabel: undefined,
      });
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
