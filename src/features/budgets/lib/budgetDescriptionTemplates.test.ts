import { describe, it, expect } from "vitest";
import { getTemplateDescription } from "./budgetDescriptionTemplates";
import type { BudgetLine } from "@/features/budgets/types/budget";

function line(overrides: Partial<BudgetLine> = {}): BudgetLine {
  return {
    id: "1",
    type: "custom",
    label: "Línia",
    quantity: 1,
    unitLabel: "unitat",
    unitPrice: 100,
    subtotal: 100,
    pricingMode: "range",
    ...overrides,
  };
}

describe("getTemplateDescription", () => {
  it('zone "repair": returns trimmed clientDescription from lines', () => {
    expect(
      getTemplateDescription("repair", [
        line({ clientDescription: "  Reparació de fissures  " }),
      ])
    ).toBe("Reparació de fissures");
  });

  it('zone "interior": template with default color when none is found', () => {
    expect(getTemplateDescription("interior", [line()])).toBe(
      "Protecció de totes les superfícies i objectes susceptibles a ser tacats, reparació dels desperfectes mitjançant massilla i acabat amb pintura plàstica Jotun Jotaprof Supermate en color a escollir."
    );
  });

  it('zone "interior": template with color from label', () => {
    expect(
      getTemplateDescription("interior", [line({ label: "Pintura blanc" })])
    ).toBe(
      "Protecció de totes les superfícies i objectes susceptibles a ser tacats, reparació dels desperfectes mitjançant massilla i acabat amb pintura plàstica Jotun Jotaprof Supermate en color blanc."
    );
  });

  it('zone "exterior": fixed template', () => {
    expect(getTemplateDescription("exterior", [line()])).toBe(
      "Sanejat de la superficie, aplicació de fons fixador Isaval Fixenol i acabat amb dues capes de revestiment per exteriors d'alta qualitat a base de resina de silicona Isaval Bixolan en un color a escollir."
    );
  });

  it('zone "openings": fixed template', () => {
    expect(getTemplateDescription("openings", [line()])).toBe(
      "Polit i neteja de la superficie i acabat amb esmalt Titanlux Ecològic en color a escollir."
    );
  });

  it('zone "enamel": fixed template', () => {
    expect(getTemplateDescription("enamel", [line()])).toBe(
      "Polit i neteja de la superficie, aplicació d'imprimació antioxidant de la marca Isaval i acabat amb esmalt sintètic Jotun Jotaprof en color a escollir."
    );
  });

  it("default zone: returns trimmed clientDescription from lines", () => {
    expect(
      getTemplateDescription("custom", [
        line({ clientDescription: "Descripció personalitzada" }),
      ])
    ).toBe("Descripció personalitzada");
  });

  it("returns empty string when no line has clientDescription", () => {
    expect(getTemplateDescription("repair", [line()])).toBe("");
  });
});
