import { describe, expect, it } from "vitest";
import type { BudgetLine } from "@/features/budgets/types/budget";
import {
  applyPricePerSqm,
  computeHasPending,
} from "@/features/budgets/lib/budgetLineComputations";
import { isPricePending } from "@/features/budgets/lib/isPricePending";

function makeLine(overrides: Partial<BudgetLine> = {}): BudgetLine {
  return {
    id: "l1",
    type: "walls_and_ceilings",
    label: "Parets",
    quantity: 10,
    unitLabel: "m²",
    unitPrice: 12,
    subtotal: 120,
    pricingMode: "input",
    ...overrides,
  };
}

describe("applyPricePerSqm", () => {
  it("walls_and_ceilings line with m² unitLabel applies new price and recomputes subtotal", () => {
    const lines = [makeLine({ quantity: 10, unitPrice: 12, subtotal: 120 })];
    const next = applyPricePerSqm(lines, 15);
    expect(next[0]?.unitPrice).toBe(15);
    expect(next[0]?.subtotal).toBe(150);
  });

  it("walls_and_ceilings line with partida unitLabel leaves unitPrice and subtotal unchanged", () => {
    const lines = [
      makeLine({
        unitLabel: "partida",
        unitPrice: 500,
        subtotal: 500,
      }),
    ];
    const next = applyPricePerSqm(lines, 99);
    expect(next[0]?.unitPrice).toBe(500);
    expect(next[0]?.subtotal).toBe(500);
  });

  it("non-walls line type (e.g. doors) is left unchanged", () => {
    const lines = [
      makeLine({
        type: "doors",
        unitLabel: "m²",
        quantity: 8,
        unitPrice: 20,
        subtotal: 160,
      }),
    ];
    const next = applyPricePerSqm(lines, 50);
    expect(next[0]?.unitPrice).toBe(20);
    expect(next[0]?.subtotal).toBe(160);
  });

  it("mixed list only updates walls_and_ceilings lines that use m²", () => {
    const wallsM2 = makeLine({
      id: "w",
      quantity: 4,
      unitPrice: 10,
      subtotal: 40,
    });
    const wallsPartida = makeLine({
      id: "wp",
      unitLabel: "partida",
      unitPrice: 300,
      subtotal: 300,
    });
    const doorsM2 = makeLine({
      id: "d",
      type: "doors",
      unitLabel: "m²",
      quantity: 2,
      unitPrice: 25,
      subtotal: 50,
    });

    const next = applyPricePerSqm([wallsM2, wallsPartida, doorsM2], 18);

    expect(next[0]).toMatchObject({ id: "w", unitPrice: 18, subtotal: 72 });
    expect(next[1]).toMatchObject({ id: "wp", unitPrice: 300, subtotal: 300 });
    expect(next[2]).toMatchObject({ id: "d", unitPrice: 25, subtotal: 50 });
  });
});

describe("computeHasPending (via isPricePending)", () => {
  it("line with unitPrice 0 yields hasPending true", () => {
    expect(isPricePending(makeLine({ unitPrice: 0, subtotal: 0 }))).toBe(true);
    expect(computeHasPending([makeLine({ unitPrice: 0, subtotal: 0 })])).toBe(
      true
    );
  });

  it("line with m² unitLabel and quantity 0 yields hasPending true", () => {
    const line = makeLine({ quantity: 0, unitPrice: 10, subtotal: 0 });
    expect(isPricePending(line)).toBe(true);
    expect(computeHasPending([line])).toBe(true);
  });

  it("partida line with quantity 1 and unitPrice > 0 yields hasPending false", () => {
    const line = makeLine({
      unitLabel: "partida",
      quantity: 1,
      unitPrice: 400,
      subtotal: 400,
    });
    expect(isPricePending(line)).toBe(false);
    expect(computeHasPending([line])).toBe(false);
  });

  it("all lines valid yields hasPending false", () => {
    const lines = [
      makeLine({ id: "a", quantity: 5, unitPrice: 10, subtotal: 50 }),
      makeLine({
        id: "b",
        type: "doors",
        unitLabel: "unitat",
        quantity: 2,
        unitPrice: 30,
        subtotal: 60,
      }),
    ];
    expect(computeHasPending(lines)).toBe(false);
  });

  it("one pending line among valid lines yields hasPending true", () => {
    const lines = [
      makeLine({ id: "ok", quantity: 5, unitPrice: 10, subtotal: 50 }),
      makeLine({ id: "bad", unitPrice: 0, subtotal: 0 }),
    ];
    expect(computeHasPending(lines)).toBe(true);
  });
});
