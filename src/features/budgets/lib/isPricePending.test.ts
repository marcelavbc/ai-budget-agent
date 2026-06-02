import { describe, expect, it } from "vitest";
import type { BudgetLine } from "@/features/budgets/types/budget";
import { isPricePending } from "./isPricePending";

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeLine(overrides: Partial<BudgetLine>): BudgetLine {
  return {
    id: "test-id",
    type: "walls_and_ceilings",
    label: "Test",
    quantity: 0,
    unitLabel: "m²",
    unitPrice: 0,
    subtotal: 0,
    pricingMode: "input",
    ...overrides,
  };
}

// ─── isPricePending ────────────────────────────────────────────────────────────

describe("isPricePending", () => {
  it("returns true when quantity and unitPrice are 0", () => {
    const line = makeLine({ quantity: 0, unitPrice: 0, subtotal: 0 });
    expect(isPricePending(line)).toBe(true);
  });

  it("returns true for custom line with no price", () => {
    const line = makeLine({ type: "custom", unitPrice: 0, subtotal: 0 });
    expect(isPricePending(line)).toBe(true);
  });

  it("returns false for normal line with real price and quantity", () => {
    const line = makeLine({
      type: "walls_and_ceilings",
      quantity: 20,
      unitPrice: 12,
      subtotal: 240,
    });
    expect(isPricePending(line)).toBe(false);
  });

  it("returns true when quantity > 0 but unitPrice is 0 (effective subtotal 0)", () => {
    // Quantity set but price not defined.
    const line = makeLine({ quantity: 5, unitPrice: 0, subtotal: 0 });
    expect(isPricePending(line)).toBe(true);
  });

  it("returns true when unitLabel is m² and quantity is 0 (area unknown)", () => {
    const line = makeLine({
      unitLabel: "m²",
      quantity: 0,
      unitPrice: 14,
      subtotal: 0,
    });
    expect(isPricePending(line)).toBe(true);
  });

  it("returns true when unitLabel is unitat and quantity is 0", () => {
    const line = makeLine({
      unitLabel: "unitat",
      quantity: 0,
      unitPrice: 30,
      subtotal: 0,
    });
    expect(isPricePending(line)).toBe(true);
  });

  it("returns false for partida line with quantity 1 (intentional fixed cost)", () => {
    const line = makeLine({
      unitLabel: "partida",
      quantity: 1,
      unitPrice: 150,
      subtotal: 150,
    });
    expect(isPricePending(line)).toBe(false);
  });
});
