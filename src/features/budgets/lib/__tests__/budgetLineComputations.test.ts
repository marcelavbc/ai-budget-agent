import { describe, it, expect } from "vitest";
import {
  applyPricePerSqm,
  computeHasPending,
} from "../budgetLineComputations";
import type { BudgetLine } from "@/features/budgets/types/budget";

function makeLine(overrides: Partial<BudgetLine> = {}): BudgetLine {
  return {
    id: "1",
    type: "custom",
    label: "Partida",
    quantity: 1,
    unitLabel: "partida",
    unitPrice: 100,
    subtotal: 100,
    pricingMode: "input",
    ...overrides,
  };
}

describe("applyPricePerSqm", () => {
  it("updates unitPrice and subtotal for walls_and_ceilings m² lines", () => {
    const line = makeLine({
      type: "walls_and_ceilings",
      unitLabel: "m²",
      quantity: 20,
      unitPrice: 12,
      subtotal: 240,
    });

    const [result] = applyPricePerSqm([line], 15);

    expect(result.unitPrice).toBe(15);
    expect(result.subtotal).toBe(300);
  });

  it("does not modify non-walls_and_ceilings lines", () => {
    const line = makeLine({
      type: "doors",
      unitLabel: "unitat",
      unitPrice: 80,
      subtotal: 80,
    });
    const [result] = applyPricePerSqm([line], 20);

    expect(result.unitPrice).toBe(80);
    expect(result.subtotal).toBe(80);
  });

  it("does not modify walls_and_ceilings lines with non-m² unit", () => {
    const line = makeLine({
      type: "walls_and_ceilings",
      unitLabel: "partida",
      unitPrice: 200,
      subtotal: 200,
    });
    const [result] = applyPricePerSqm([line], 15);

    expect(result.unitPrice).toBe(200);
  });
});

describe("computeHasPending", () => {
  it("returns false when no custom line has unitPrice=0", () => {
    expect(computeHasPending([makeLine({ unitPrice: 50 })])).toBe(false);
  });

  it("returns true when a custom line has unitPrice=0", () => {
    expect(
      computeHasPending([makeLine({ type: "custom", unitPrice: 0 })])
    ).toBe(true);
  });

  it("returns true for non-custom lines with unitPrice=0 (any unpriced line is pending)", () => {
    expect(computeHasPending([makeLine({ type: "doors", unitPrice: 0 })])).toBe(
      true
    );
  });

  it("returns false for empty array", () => {
    expect(computeHasPending([])).toBe(false);
  });
});

