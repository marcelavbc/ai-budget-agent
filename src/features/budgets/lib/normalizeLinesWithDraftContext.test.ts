import { describe, expect, it } from "vitest";
import type { BudgetLine } from "@/features/budgets/types/budget";
import { normalizeLinesWithDraftContext } from "@/features/budgets/lib/normalizeLinesWithDraftContext";

function makeLine(overrides: Partial<BudgetLine> = {}): BudgetLine {
  return {
    id: "l1",
    type: "walls_and_ceilings",
    label: "Parets",
    quantity: 20,
    unitLabel: "m²",
    unitPrice: 12,
    subtotal: 240,
    pricingMode: "input",
    ...overrides,
  };
}

describe("normalizeLinesWithDraftContext", () => {
  describe("repair inherits walls quantity", () => {
    it("repair line with quantity 0 and existing walls_and_ceilings m² line inherits quantity and recalculates subtotal", () => {
      const newLines = [
        makeLine({
          id: "repair-1",
          type: "repair",
          label: "Reparació",
          quantity: 0,
          unitPrice: 15,
          subtotal: 0,
        }),
      ];
      const existingLines = [
        makeLine({ id: "walls-1", quantity: 32, unitPrice: 10, subtotal: 320 }),
      ];

      const next = normalizeLinesWithDraftContext(newLines, existingLines);

      expect(next[0]).toMatchObject({ quantity: 32, subtotal: 480 });
    });

    it("repair line with quantity 0 and no existing walls line stays unchanged", () => {
      const repairLine = makeLine({
        id: "repair-1",
        type: "repair",
        label: "Reparació",
        quantity: 0,
        unitPrice: 15,
        subtotal: 0,
      });

      const next = normalizeLinesWithDraftContext(
        [repairLine],
        [
          makeLine({
            id: "doors-1",
            type: "doors",
            label: "Portes",
            quantity: 3,
            unitLabel: "unitat",
            subtotal: 90,
          }),
        ]
      );

      expect(next).toEqual([repairLine]);
    });

    it("repair line with quantity greater than 0 is not overridden", () => {
      const repairLine = makeLine({
        id: "repair-1",
        type: "repair",
        label: "Reparació",
        quantity: 8,
        unitPrice: 15,
        subtotal: 120,
      });

      const next = normalizeLinesWithDraftContext(
        [repairLine],
        [makeLine({ id: "walls-1", quantity: 32, subtotal: 384 })]
      );

      expect(next).toEqual([repairLine]);
    });

    it("repair line with unitLabel partida is not overridden", () => {
      const repairLine = makeLine({
        id: "repair-1",
        type: "repair",
        label: "Reparació",
        quantity: 0,
        unitLabel: "partida",
        unitPrice: 150,
        subtotal: 0,
      });

      const next = normalizeLinesWithDraftContext(
        [repairLine],
        [makeLine({ id: "walls-1", quantity: 32, subtotal: 384 })]
      );

      expect(next).toEqual([repairLine]);
    });

    it("multiple walls lines inherit from the last one", () => {
      const newLines = [
        makeLine({
          id: "repair-1",
          type: "repair",
          label: "Reparació",
          quantity: 0,
          unitPrice: 15,
          subtotal: 0,
        }),
      ];
      const existingLines = [
        makeLine({ id: "walls-1", quantity: 18, subtotal: 216 }),
        makeLine({
          id: "doors-1",
          type: "doors",
          unitLabel: "unitat",
          quantity: 2,
          subtotal: 24,
        }),
        makeLine({ id: "walls-2", quantity: 41, subtotal: 492 }),
      ];

      const next = normalizeLinesWithDraftContext(newLines, existingLines);

      expect(next[0]).toMatchObject({ quantity: 41, subtotal: 615 });
    });
  });

  describe("non-repair lines", () => {
    it("walls_and_ceilings line is never modified", () => {
      const wallsLine = makeLine({ id: "walls-1", quantity: 0, subtotal: 0 });

      const next = normalizeLinesWithDraftContext(
        [wallsLine],
        [makeLine({ id: "existing-walls", quantity: 30, subtotal: 360 })]
      );

      expect(next).toEqual([wallsLine]);
    });

    it("custom line is never modified", () => {
      const customLine = makeLine({
        id: "custom-1",
        type: "custom",
        label: "Partida personalitzada",
        quantity: 0,
        subtotal: 0,
      });

      const next = normalizeLinesWithDraftContext(
        [customLine],
        [makeLine({ id: "existing-walls", quantity: 30, subtotal: 360 })]
      );

      expect(next).toEqual([customLine]);
    });

    it("doors line is never modified", () => {
      const doorsLine = makeLine({
        id: "doors-1",
        type: "doors",
        label: "Portes",
        quantity: 0,
        subtotal: 0,
      });

      const next = normalizeLinesWithDraftContext(
        [doorsLine],
        [makeLine({ id: "existing-walls", quantity: 30, subtotal: 360 })]
      );

      expect(next).toEqual([doorsLine]);
    });
  });

  describe("edge cases", () => {
    it("empty newLines returns an empty array", () => {
      expect(normalizeLinesWithDraftContext([], [makeLine()])).toEqual([]);
    });

    it("empty existingLines with repair line quantity 0 stays unchanged", () => {
      const repairLine = makeLine({
        id: "repair-1",
        type: "repair",
        label: "Reparació",
        quantity: 0,
        unitPrice: 15,
        subtotal: 0,
      });

      const next = normalizeLinesWithDraftContext([repairLine], []);

      expect(next).toEqual([repairLine]);
    });
  });
});
