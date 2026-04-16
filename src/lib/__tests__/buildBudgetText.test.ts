import { describe, expect, it } from "vitest";
import { buildBudgetText } from "../buildBudgetText";

describe("buildBudgetText", () => {
  it("builds a more realistic budget text in Catalan", () => {
    const result = buildBudgetText(
      {
        jobType: "interior_painting",
        areaM2: 20,
        color: "blanc",
        wallCondition: "good",
      },
      {
        pricePerM2: 12,
        paintableSurfaceM2: 60,
        paintingCost: 720,
        total: 750,
      }
    );

    expect(result).toContain("PRESSUPOST");
    expect(result).toContain("CONDICIONS GENERALS");
    expect(result).toContain("INTERVENCIÓ");
    expect(result).toContain("Superfície estimada a pintar: 60 m²");
    expect(result).toContain("TOTAL ESTIMAT: 750 €");
    expect(result).toContain("FORMA DE PAGAMENT");
  });

  it("returns a helpful message when area is missing", () => {
    const result = buildBudgetText(
      {
        jobType: "interior_painting",
        areaM2: null,
        color: null,
        wallCondition: "good",
      },
      null
    );

    expect(result).toContain("Si us plau, indica els metres quadrats");
  });
});
