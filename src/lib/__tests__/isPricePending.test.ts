import { describe, expect, it } from "vitest";
import type { BudgetLine } from "@/types/budget";
import { isPricePending } from "../isPricePending";

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
  it("retorna true quan quantity i unitPrice són 0", () => {
    const line = makeLine({ quantity: 0, unitPrice: 0, subtotal: 0 });
    expect(isPricePending(line)).toBe(true);
  });

  it("retorna true per a una línia custom sense preu", () => {
    const line = makeLine({ type: "custom", unitPrice: 0, subtotal: 0 });
    expect(isPricePending(line)).toBe(true);
  });

  it("retorna false per a una línia normal amb preu i quantitat reals", () => {
    const line = makeLine({
      type: "walls_and_ceilings",
      quantity: 20,
      unitPrice: 12,
      subtotal: 240,
    });
    expect(isPricePending(line)).toBe(false);
  });

  it("retorna true quan quantity > 0 però unitPrice és 0 (bug: subtotal = 0 real)", () => {
    // La IA ha assignat quantitat però no s'ha definit el preu.
    const line = makeLine({ quantity: 5, unitPrice: 0, subtotal: 0 });
    expect(isPricePending(line)).toBe(true);
  });

  it("retorna true quan unitLabel és m² i quantity és 0 (la IA no sabia l'àrea)", () => {
    const line = makeLine({
      unitLabel: "m²",
      quantity: 0,
      unitPrice: 14,
      subtotal: 0,
    });
    expect(isPricePending(line)).toBe(true);
  });

  it("retorna true quan unitLabel és unitat i quantity és 0", () => {
    const line = makeLine({
      unitLabel: "unitat",
      quantity: 0,
      unitPrice: 30,
      subtotal: 0,
    });
    expect(isPricePending(line)).toBe(true);
  });

  it("retorna false per a una línia partida amb quantity 1 (cost fix intencional)", () => {
    const line = makeLine({
      unitLabel: "partida",
      quantity: 1,
      unitPrice: 150,
      subtotal: 150,
    });
    expect(isPricePending(line)).toBe(false);
  });
});
