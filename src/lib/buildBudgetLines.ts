import { lineTemplates } from "@/lib/lineTemplates";
import type { BudgetBreakdown, BudgetLine } from "@/types/budget";

export function buildBudgetLines(
  breakdown: BudgetBreakdown | null
): BudgetLine[] {
  if (!breakdown) return [];

  const paintingTemplate = lineTemplates.walls_and_ceilings;

  return [
    {
      id: "painting-walls-ceilings",
      type: paintingTemplate.type,
      label: paintingTemplate.label,
      quantity: breakdown.paintableSurfaceM2,
      unitLabel: paintingTemplate.unitLabel,
      unitPrice: breakdown.pricePerM2,
      subtotal: breakdown.paintingCost,
      pricingMode: paintingTemplate.pricingMode,
    },
  ];
}
