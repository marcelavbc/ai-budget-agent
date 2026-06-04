import { describe, it, expect } from "vitest";
import { budgetLinesToClientItemsFromAI } from "./budgetLinesToClientItemsFromAI";
import type { BudgetLine } from "@/features/budgets/types/budget";

const mockLinesData: BudgetLine[] = [
  {
    id: "123",
    type: "walls_and_ceilings",
    label: "Test Line",
    quantity: 1,
    unitLabel: "unitat",
    unitPrice: 100,
    subtotal: 100,
    pricingMode: "range",
    optionGroupId: "123",
    optionLabel: "Test Option",
    clientDescription: "Test Description",
  },
];

describe("budgetLinesToClientItemsFromAI", () => {
  it("converts a list of BudgetLines to a list of BudgetClientItems", () => {
    const result = budgetLinesToClientItemsFromAI(mockLinesData);
    expect(result).toEqual([
      {
        id: "123",
        title: "Test Line",
        description:
          "Protecció de totes les superfícies i objectes susceptibles a ser tacats, reparació dels desperfectes mitjançant massilla i acabat amb pintura plàstica Jotun Jotaprof Supermate en color a escollir.",
        total: 100,
        quantity: 1,
        unitLabel: "unitat",
        unitPrice: 100,
        lineType: "walls_and_ceilings",
        optionGroupId: "123",
        optionLabel: "Test Option",
        clientDescription: "Test Description",
      },
    ]);
  });
});
