import type {
  BudgetLine,
  BudgetListItem,
  BudgetClientItem,
} from "@/features/budgets/types/budget";
import { isBudgetOptionGroup } from "@/features/budgets/types/budget";
import {
  getTemplateDescription,
  templateZone,
} from "@/features/budgets/lib/budgetDescriptionTemplates";

export function generateBudgetDraft(
  items: BudgetListItem[]
): BudgetClientItem[] {
  return items.flatMap((item): BudgetClientItem[] => {
    if (isBudgetOptionGroup(item)) {
      return item.options.map((opt) => ({
        id: opt.id,
        title: opt.label,
        description: getTemplateDescription(templateZone(opt), [opt]),
        total: opt.subtotal,
        quantity: opt.quantity,
        unitLabel: opt.unitLabel,
        unitPrice: opt.unitPrice,
        optionGroupId: item.id,
        optionLabel: opt.optionLabel,
        clientDescription: opt.clientDescription,
      }));
    }

    const line = item as BudgetLine;
    return [
      {
        id: line.id,
        title: line.label,
        description: getTemplateDescription(templateZone(line), [line]),
        total: line.subtotal,
        quantity: line.quantity,
        unitLabel: line.unitLabel,
        unitPrice: line.unitPrice,
        clientDescription: line.clientDescription,
      },
    ];
  });
}
