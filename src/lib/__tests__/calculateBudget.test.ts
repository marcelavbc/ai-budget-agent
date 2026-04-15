import { describe, expect, it } from "vitest";
import { calculateBudget } from "../calculateBudget";

describe("calculateBudget", () => {
  it("calculates budget correctly for good wall condition", () => {
    const result = calculateBudget({
      jobType: "interior_painting",
      areaM2: 20,
      color: "blanc",
      wallCondition: "good",
    });

    expect(result).toEqual({
      baseVisitCost: 30,
      pricePerM2: 12,
      conditionMultiplier: 1,
      paintingCost: 240,
      total: 270,
    });
  });

  it("returns null when required data is missing", () => {
    const result = calculateBudget({
      jobType: "interior_painting",
      areaM2: null,
      color: "blanc",
      wallCondition: "good",
    });

    expect(result).toBeNull();
  });
});
