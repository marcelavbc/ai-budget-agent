import { pricingRules } from "@/lib/pricingRules";
import { calculatePaintableSurface } from "@/lib/calculatePaintableSurface";
import type { BudgetBreakdown, ParsedJob } from "@/types/budget";

export function calculateBudget(parsedJob: ParsedJob): BudgetBreakdown | null {
  if (!parsedJob.areaM2) {
    return null;
  }

  const pricePerM2 = pricingRules.pricePerM2;
  const paintableSurfaceM2 = calculatePaintableSurface(parsedJob.areaM2);
  const paintingCost = paintableSurfaceM2 * pricePerM2;
  const total = paintingCost;

  return {
    pricePerM2,
    paintableSurfaceM2: Number(paintableSurfaceM2.toFixed(2)),
    paintingCost: Number(paintingCost.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}
