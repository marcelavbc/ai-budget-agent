import { describe, expect, it } from "vitest";
import { buildBudgetText } from "../buildBudgetText";

describe("buildBudgetText", () => {
  it("builds a cleaner budget text in Catalan", () => {
    const result = buildBudgetText(
      {
        jobType: "interior_painting",
        areaM2: 20,
        color: "blanc",
        wallCondition: null,
      },
      {
        pricePerM2: 12,
        paintableSurfaceM2: 60,
        paintingCost: 720,
        total: 720,
      }
    );

    expect(result).toContain("PRESSUPOST");
    expect(result).toContain("CONDICIONS GENERALS");
    expect(result).toContain("INTERVENCIÓ");
    expect(result).toContain("IMPORT TOTAL: 720 €");
    expect(result).toContain("FORMA DE PAGAMENT");
    expect(result).not.toContain("DADES DE CÀLCUL");
  });

  it("returns a helpful message when area is missing", () => {
    const result = buildBudgetText(
      {
        jobType: "interior_painting",
        areaM2: null,
        color: null,
        wallCondition: null,
      },
      null
    );

    expect(result).toContain("Si us plau, indica els metres quadrats");
  });
});
