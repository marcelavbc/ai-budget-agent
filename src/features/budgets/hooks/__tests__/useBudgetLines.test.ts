/** @vitest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBudgetLines } from "@/features/budgets/hooks/useBudgetLines";
import { getAllLines } from "@/features/budgets/lib/budgetListItems";
import type { BudgetLine } from "@/features/budgets/types/budget";
import { isBudgetOptionGroup } from "@/features/budgets/types/budget";

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

describe("useBudgetLines", () => {
  describe("addLines", () => {
    it("adds a single line → items has 1 element, hasPending false", () => {
      const { result } = renderHook(() => useBudgetLines());
      act(() => {
        result.current.addLines([makeLine()]);
      });
      expect(result.current.items).toHaveLength(1);
      expect(isBudgetOptionGroup(result.current.items[0]!)).toBe(false);
      expect(result.current.hasPending).toBe(false);
    });

    it("adds two lines with the same optionGroupId → a BudgetOptionGroup is created", () => {
      const { result } = renderHook(() => useBudgetLines());
      act(() => {
        result.current.addLines([
          makeLine({
            id: "a",
            optionGroupId: "grp",
            optionLabel: "Opció A",
            label: "Primera",
          }),
          makeLine({
            id: "b",
            optionGroupId: "grp",
            optionLabel: "Opció B",
            label: "Segona",
          }),
        ]);
      });
      expect(result.current.items).toHaveLength(1);
      const item = result.current.items[0]!;
      expect(isBudgetOptionGroup(item)).toBe(true);
      if (isBudgetOptionGroup(item)) {
        expect(item.id).toBe("grp");
        expect(item.options).toHaveLength(2);
      }
    });

    it("adds a line with unitPrice 0 → hasPending true (non–m²-walls line so price is not replaced)", () => {
      const { result } = renderHook(() => useBudgetLines());
      act(() => {
        result.current.addLines([
          makeLine({
            id: "d1",
            type: "doors",
            label: "Porta",
            quantity: 1,
            unitLabel: "unitat",
            unitPrice: 0,
            subtotal: 0,
          }),
        ]);
      });
      expect(result.current.hasPending).toBe(true);
    });
  });

  describe("removeLine", () => {
    it("removes the only line → items is empty", () => {
      const { result } = renderHook(() => useBudgetLines());
      act(() => {
        result.current.addLines([makeLine({ id: "only" })]);
      });
      act(() => {
        result.current.removeLine("only");
      });
      expect(result.current.items).toEqual([]);
    });

    it("removes one line from a 2-option group → group disbands; remaining line loses optionGroupId and optionLabel", () => {
      const { result } = renderHook(() => useBudgetLines());
      act(() => {
        result.current.addLines([
          makeLine({
            id: "1",
            optionGroupId: "g",
            optionLabel: "Primera",
            label: "Un",
          }),
          makeLine({
            id: "2",
            optionGroupId: "g",
            optionLabel: "Segona",
            label: "Dos",
          }),
        ]);
      });
      act(() => {
        result.current.removeLine("1");
      });
      expect(result.current.items).toHaveLength(1);
      const remaining = result.current.items[0]!;
      expect(isBudgetOptionGroup(remaining)).toBe(false);
      expect(remaining).toMatchObject({
        id: "2",
        label: "Dos",
        optionGroupId: undefined,
        optionLabel: undefined,
      });
    });
  });

  describe("updateLine", () => {
    it("updates label on a line → label changes", () => {
      const { result } = renderHook(() => useBudgetLines());
      act(() => {
        result.current.addLines([makeLine({ id: "x" })]);
      });
      act(() => {
        result.current.updateLine("x", { label: "Nou" });
      });
      const line = getAllLines(result.current.items)[0]!;
      expect(line.label).toBe("Nou");
    });

    it("updates quantity → subtotal is recalculated (quantity * unitPrice)", () => {
      const { result } = renderHook(() => useBudgetLines());
      act(() => {
        result.current.addLines([makeLine({ id: "x" })]);
      });
      act(() => {
        result.current.updateLine("x", { quantity: 20 });
      });
      const line = getAllLines(result.current.items)[0]!;
      expect(line.quantity).toBe(20);
      expect(line.unitPrice).toBe(12);
      expect(line.subtotal).toBe(240);
    });

    it("updates unitPrice on a walls_and_ceilings m² line → pricePerSqm updates and all lines of that type reflect the new price", () => {
      const { result } = renderHook(() => useBudgetLines());
      act(() => {
        result.current.addLines([
          makeLine({ id: "w1", label: "Parets A", quantity: 10 }),
          makeLine({ id: "w2", label: "Parets B", quantity: 5 }),
        ]);
      });
      act(() => {
        result.current.updateLine("w1", { unitPrice: 25 });
      });
      expect(result.current.pricePerSqm).toBe(25);
      const lines = getAllLines(result.current.items);
      const walls = lines.filter(
        (l) => l.type === "walls_and_ceilings" && l.unitLabel === "m²"
      );
      expect(walls).toHaveLength(2);
      expect(walls[0]!.unitPrice).toBe(25);
      expect(walls[1]!.unitPrice).toBe(25);
      expect(walls[0]!.subtotal).toBe(250);
      expect(walls[1]!.subtotal).toBe(125);
    });
  });

  describe("hasPending", () => {
    it("no pending lines → hasPending false", () => {
      const { result } = renderHook(() => useBudgetLines());
      act(() => {
        result.current.addLines([makeLine()]);
      });
      expect(result.current.hasPending).toBe(false);
    });

    it("one line with unitPrice 0 → hasPending true (line not subject to m² wall price override)", () => {
      const { result } = renderHook(() => useBudgetLines());
      act(() => {
        result.current.addLines([
          makeLine({
            id: "z",
            type: "windows",
            label: "Finestra",
            quantity: 2,
            unitLabel: "unitat",
            unitPrice: 0,
            subtotal: 0,
          }),
        ]);
      });
      expect(result.current.hasPending).toBe(true);
    });
  });
});
