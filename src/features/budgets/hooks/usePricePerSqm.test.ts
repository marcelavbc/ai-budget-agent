// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { BudgetClientItem } from "@/features/budgets/types/budget";
import { usePricePerSqm } from "./usePricePerSqm";

const DEFAULT_PRICE_PER_SQM = 12;

function makeSqmItem(
  overrides: Partial<BudgetClientItem> = {}
): BudgetClientItem {
  return {
    id: "1",
    title: "Cuina: pintura sostre",
    description: "",
    total: 240,
    quantity: 20,
    unitLabel: "m²",
    unitPrice: 12,
    lineType: "walls_and_ceilings",
    ...overrides,
  };
}

function notSqmItem(
  overrides: Partial<BudgetClientItem> = {}
): BudgetClientItem {
  return {
    id: "2",
    title: "aplicar morteig",
    description: "",
    total: 240,
    quantity: 20,
    unitLabel: "m²",
    unitPrice: 0,
    lineType: "custom",
    ...overrides,
  };
}

describe("usePricePerSqm", () => {
  it("initializes with default price per sqm", () => {
    const { result } = renderHook(() =>
      usePricePerSqm({
        items: [],
        onItemsReplace: () => {},
      })
    );
    expect(result.current.pricePerSqm).toBe(DEFAULT_PRICE_PER_SQM);
  });

  it("setPricePerSqm updates price and applies it to existing items", () => {
    const initialItems = [makeSqmItem()];
    let items = initialItems;

    const { result } = renderHook(() =>
      usePricePerSqm({
        items: initialItems,
        onItemsReplace: (next) => {
          items = next;
        },
      })
    );

    act(() => {
      result.current.setPricePerSqm(15);
    });

    expect(result.current.pricePerSqm).toBe(15);
    expect(items[0]).toMatchObject({
      quantity: 20,
      unitPrice: 15,
      total: 300,
    });
  });

  it("applyPriceToNewItems applies price only to eligible items", () => {
    const { result } = renderHook(() =>
      usePricePerSqm({
        items: [],
        onItemsReplace: () => {},
      })
    );

    const newItems = result.current.applyPriceToNewItems([
      notSqmItem(),
      makeSqmItem(),
    ]);

    expect(newItems[0]!.unitPrice).toBe(0);
    expect(newItems[1]!.unitPrice).toBe(12);
  });
});
