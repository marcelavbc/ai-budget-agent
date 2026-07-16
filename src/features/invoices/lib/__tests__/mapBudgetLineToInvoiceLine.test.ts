import { describe, expect, it } from "vitest";
import { mapBudgetLineToInvoiceLineContent } from "@/features/invoices/lib/mapBudgetLineToInvoiceLine";

describe("mapBudgetLineToInvoiceLineContent", () => {
  it("joins title and description with a blank line when both are present", () => {
    const result = mapBudgetLineToInvoiceLineContent({
      title: "Pintura de parets",
      description: "- Preparació de superfície\n- Dues mans de pintura",
      unit: "m²",
    });

    expect(result.description).toBe(
      "Pintura de parets\n\n- Preparació de superfície\n- Dues mans de pintura"
    );
    expect(result.unit).toBe("m²");
  });

  it("uses title alone when description is empty or null (no extra whitespace)", () => {
    expect(
      mapBudgetLineToInvoiceLineContent({
        title: "Partida única",
        description: null,
        unit: "partida",
      })
    ).toEqual({
      description: "Partida única",
      unit: "partida",
    });

    expect(
      mapBudgetLineToInvoiceLineContent({
        title: "Partida única",
        description: "   ",
        unit: null,
      })
    ).toEqual({
      description: "Partida única",
      unit: null,
    });
  });

  it("copies unit in both cases and falls back title to Partida when blank", () => {
    expect(
      mapBudgetLineToInvoiceLineContent({
        title: "  ",
        description: "Detall del treball",
        unit: "unitat",
      })
    ).toEqual({
      description: "Partida\n\nDetall del treball",
      unit: "unitat",
    });
  });
});
