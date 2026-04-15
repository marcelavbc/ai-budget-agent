import type { BudgetBreakdown, ParsedJob } from "@/types/budget";
import { pricingRules } from "./pricingRules";

export function calculateBudget(parsedJob: ParsedJob): BudgetBreakdown | null {
  if (!parsedJob.areaM2 || !parsedJob.wallCondition) {
    return null;
  }

  const baseVisitCost = pricingRules.baseVisitCost;
  const pricePerM2 = pricingRules.pricePerM2;
  const conditionMultiplier =
    pricingRules.wallConditionMultiplier[parsedJob.wallCondition];

  const paintingCost = parsedJob.areaM2 * pricePerM2 * conditionMultiplier;
  const total = baseVisitCost + paintingCost;

  return {
    baseVisitCost,
    pricePerM2,
    conditionMultiplier,
    paintingCost: Number(paintingCost.toFixed(2)),
    total: Number(total.toFixed(2)),
  };
}
