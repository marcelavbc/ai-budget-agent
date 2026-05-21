import type {
  BudgetClientItem,
  BudgetLine,
} from "@/features/budgets/types/budget";
import {
  getTemplateDescription,
  templateZone,
} from "@/features/budgets/lib/budgetDescriptionTemplates";

export function budgetLinesToClientItemsFromAI(
  lines: BudgetLine[]
): BudgetClientItem[] {
  return lines.map((line) => ({
    id: line.id,
    title: line.label,
    description: getTemplateDescription(templateZone(line), [line]),
    total: line.subtotal,
    quantity: line.quantity,
    unitLabel: line.unitLabel,
    unitPrice: line.unitPrice,
    optionGroupId: line.optionGroupId,
    optionLabel: line.optionLabel,
    clientDescription: line.clientDescription,
  }));
}
