import type { BudgetLine } from "@/features/budgets/types/budget";

/**
 * Returns true when a BudgetLine does not have a real price defined.
 * A line is pending when:
 * - unitPrice is 0 (no price was ever assigned), or
 * - quantity is 0 for a line measured in m² or units (the AI didn't know
 *   the area/count, so the subtotal would be misleadingly 0).
 * "partida" lines with quantity 1 are intentional fixed-cost items, not pending.
 */
export function isPricePending(line: BudgetLine): boolean {
  if (line.unitPrice === 0) return true;
  if (line.unitLabel !== "partida" && line.quantity === 0) return true;
  return false;
}
