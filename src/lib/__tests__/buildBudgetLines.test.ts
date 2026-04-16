import { describe, expect, it } from "vitest";
import { buildBudgetLines } from "../buildBudgetLines";

describe("buildBudgetLines", () => {
  it("creates one painting line from breakdown", () => {
    const result = buildBudgetLines({
      pricePerM2: 12,
      paintableSurfaceM2: 60,
      paintingCost: 720,
      total: 720,
    });

    expect(result).toEqual([
      {
        id: "painting-walls-ceilings",
        type: "walls_and_ceilings",
        label: "Pintura de parets i sostres",
        quantity: 60,
        unitLabel: "m²",
        unitPrice: 12,
        subtotal: 720,
        pricingMode: "range",
      },
    ]);
  });

  it("returns empty array when breakdown is null", () => {
    expect(buildBudgetLines(null)).toEqual([]);
  });
});
