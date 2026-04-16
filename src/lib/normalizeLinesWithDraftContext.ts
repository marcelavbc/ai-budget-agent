import type { BudgetLine } from "@/types/budget";

export function normalizeLinesWithDraftContext(
  newLines: BudgetLine[],
  existingLines: BudgetLine[]
): BudgetLine[] {
  const lastWallsLine = [...existingLines]
    .reverse()
    .find(
      (line) =>
        line.type === "walls_and_ceilings" &&
        line.unitLabel === "m²" &&
        line.quantity > 0
    );

  return newLines.map((line) => {
    // Key case: repair line without quantity → inherits wall surface
    if (
      line.type === "repair" &&
      line.unitLabel === "m²" &&
      line.quantity === 0 &&
      lastWallsLine
    ) {
      const quantity = lastWallsLine.quantity;

      return {
        ...line,
        quantity,
        subtotal: quantity * line.unitPrice,
      };
    }

    return line;
  });
}
