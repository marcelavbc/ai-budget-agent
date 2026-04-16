import { describe, expect, it } from "vitest";
import { calculateBudget } from "../calculateBudget";

describe("calculateBudget", () => {
  it("calculates budget using paintable surface", () => {
    const result = calculateBudget({
      jobType: "interior_painting",
      areaM2: 20,
      color: "blanc",
      wallCondition: null,
    });

    expect(result).toEqual({
      pricePerM2: 12,
      paintableSurfaceM2: 60,
      paintingCost: 720,
      total: 720,
    });
  });

  it("returns null when area is missing", () => {
    const result = calculateBudget({
      jobType: "interior_painting",
      areaM2: null,
      color: "blanc",
      wallCondition: null,
    });

    expect(result).toBeNull();
  });
});
