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
      },
    ]);

    expect(result).toEqual([
      {
        id: "doors-0",
        type: "doors",
        label: "Pintura de portes",
        quantity: 5,
        unitLabel: "unitat",
        unitPrice: 30,
        subtotal: 150,
        pricingMode: "input",
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
      },
    ]);

    expect(result).toEqual([
      {
        id: "custom-0",
        type: "custom",
        label: "Partida especial",
        quantity: 1,
        unitLabel: "partida",
        unitPrice: 0,
        subtotal: 0,
        pricingMode: "input",
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
      },
    ]);

    expect(result).toEqual([
      {
        id: "repair-0",
        type: "repair",
        label: "Reparació de desperfectes",
        quantity: 0,
        unitLabel: "m²",
        unitPrice: 4,
        subtotal: 0,
        pricingMode: "range",
      },
    ]);
  });
});
