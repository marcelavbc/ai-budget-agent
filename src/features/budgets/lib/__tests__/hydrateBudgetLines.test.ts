import { describe, expect, it } from "vitest";
import { hydrateBudgetLines } from "../hydrateBudgetLines";

describe("hydrateBudgetLines", () => {
  it("hydrates a doors line using template defaults", () => {
    const result = hydrateBudgetLines([
      {
        type: "doors",
        label: "Pintura de portes",
        quantity: 5,
        unitLabel: "unitat",
        clientDescription: "",
      },
    ]);

    expect(result).toEqual([
      {
        id: expect.stringMatching(/^doors-0-/),
        type: "doors",
        label: "Pintura de portes",
        quantity: 5,
        unitLabel: "unitat",
        unitPrice: 30,
        subtotal: 150,
        pricingMode: "input",
        clientDescription: "",
        optionGroupId: undefined,
        optionLabel: undefined,
      },
    ]);
  });

  it("uses quantity 1 by default for custom partida lines", () => {
    const result = hydrateBudgetLines([
      {
        type: "custom",
        label: "Partida especial",
        quantity: null,
        unitLabel: "partida",
        clientDescription: "",
      },
    ]);

    expect(result).toEqual([
      {
        id: expect.stringMatching(/^custom-0-/),
        type: "custom",
        label: "Partida especial",
        quantity: 1,
        unitLabel: "partida",
        unitPrice: 0,
        subtotal: 0,
        pricingMode: "input",
        clientDescription: "",
        optionGroupId: undefined,
        optionLabel: undefined,
      },
    ]);
  });

  it("uses quantity 0 by default when quantity is null for m²", () => {
    const result = hydrateBudgetLines([
      {
        type: "repair",
        label: "Reparació de desperfectes",
        quantity: null,
        unitLabel: "m²",
        clientDescription: "",
      },
    ]);

    expect(result).toEqual([
      {
        id: expect.stringMatching(/^repair-0-/),
        type: "repair",
        label: "Reparació de desperfectes",
        quantity: 0,
        unitLabel: "m²",
        unitPrice: 4,
        subtotal: 0,
        pricingMode: "range",
        clientDescription: "",
        optionGroupId: undefined,
        optionLabel: undefined,
      },
    ]);
  });

  it("sets unitPrice 0 and pricingMode input when AI unit mismatches template unit", () => {
    // Template for "repair" expects m², but AI returned "partida".
    // 4 €/m² applied to 1 partida is nonsensical — price must be entered manually.
    const result = hydrateBudgetLines([
      {
        type: "repair",
        label: "Reparació d'esquerdes",
        quantity: 1,
        unitLabel: "partida",
        clientDescription: "",
      },
    ]);

    expect(result).toEqual([
      {
        id: expect.stringMatching(/^repair-0-/),
        type: "repair",
        label: "Reparació d'esquerdes",
        quantity: 1,
        unitLabel: "partida",
        unitPrice: 0,
        subtotal: 0,
        pricingMode: "input",
        clientDescription: "",
        optionGroupId: undefined,
        optionLabel: undefined,
      },
    ]);
  });
});
