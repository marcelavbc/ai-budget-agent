import { describe, expect, it } from "vitest";
import { buildBudgetText } from "../buildBudgetText";

describe("buildBudgetText", () => {
  it("builds the budget text in Catalan", () => {
    const result = buildBudgetText(
      {
        jobType: "interior_painting",
        areaM2: 20,
        color: "blanc",
        wallCondition: "good",
      },
      {
        baseVisitCost: 30,
        pricePerM2: 12,
        conditionMultiplier: 1,
        paintingCost: 240,
        total: 270,
      },
    );

    expect(result).toContain("Pressupost de pintura");
    expect(result).toContain("Superfície: 20 m²");
    expect(result).toContain("Estat de les parets: bon estat");
    expect(result).toContain("Total estimat: 270€");
  });

  it("returns fallback text when there is not enough information", () => {
    const result = buildBudgetText(
      {
        jobType: "interior_painting",
        areaM2: null,
        color: null,
        wallCondition: null,
      },
      null,
    );

    expect(result).toContain("No hi ha prou informació");
  });
});
