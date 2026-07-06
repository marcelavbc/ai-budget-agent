import { describe, expect, it } from "vitest";
import type {
  BudgetClientDetails,
  BudgetClientItem,
} from "@/features/budgets/types/budget";
import {
  calcBudgetHeaderAmounts,
  calcTotalsFromSubtotal,
  deriveBudgetTitle,
  normalizeOptionalString,
  toBudgetLineRows,
} from "@/features/budgets/lib/helpers";

function makeClientDetails(
  overrides: Partial<BudgetClientDetails> = {}
): BudgetClientDetails {
  return {
    nameOrCompany: "Joan García",
    quoteNumber: "2025-01",
    date: "2025-01-15",
    estimatedTime: "5 dies",
    lang: "ca",
    ...overrides,
  };
}

function makeItem(overrides: Partial<BudgetClientItem> = {}): BudgetClientItem {
  return {
    id: "i1",
    title: "Parets menjador",
    description: "Pintura plàstica",
    quantity: 10,
    unitLabel: "m²",
    unitPrice: 12,
    total: 120,
    ...overrides,
  };
}

describe("normalizeOptionalString", () => {
  it("normal string returns trimmed string", () => {
    expect(normalizeOptionalString("  hola  ")).toBe("hola");
  });

  it("empty string returns null", () => {
    expect(normalizeOptionalString("")).toBeNull();
  });

  it("whitespace only returns null", () => {
    expect(normalizeOptionalString("   ")).toBeNull();
  });

  it("null returns null", () => {
    expect(normalizeOptionalString(null)).toBeNull();
  });

  it("undefined returns null", () => {
    expect(normalizeOptionalString(undefined)).toBeNull();
  });
});

describe("deriveBudgetTitle", () => {
  it("has nameOrCompany returns name", () => {
    expect(deriveBudgetTitle(makeClientDetails())).toBe("Joan García");
  });

  it("empty name returns null", () => {
    expect(
      deriveBudgetTitle(makeClientDetails({ nameOrCompany: "" }))
    ).toBeNull();
  });

  it("name with whitespace returns trimmed name", () => {
    expect(
      deriveBudgetTitle(makeClientDetails({ nameOrCompany: "  Joan García  " }))
    ).toBe("Joan García");
  });
});

describe("calcBudgetHeaderAmounts", () => {
  it("single item with taxRate 0 returns correct subtotal and zero tax_amount", () => {
    expect(calcBudgetHeaderAmounts([makeItem()], 0)).toEqual({
      subtotal: 120,
      tax_amount: 0,
    });
  });

  it("multiple items subtotal is the sum of all totals", () => {
    const items = [
      makeItem({ id: "i1", total: 120 }),
      makeItem({ id: "i2", total: 80 }),
      makeItem({ id: "i3", total: 49.5 }),
    ];

    expect(calcBudgetHeaderAmounts(items, 0)).toEqual({
      subtotal: 249.5,
      tax_amount: 0,
    });
  });

  it("taxRate 21 rounds tax_amount to 2 decimals", () => {
    const items = [makeItem({ total: 100.05 })];

    expect(calcBudgetHeaderAmounts(items, 21)).toEqual({
      subtotal: 100.05,
      tax_amount: 21.01,
    });
  });

  it("taxRate null calculates zero tax_amount without mutating intent", () => {
    const items = [makeItem({ total: 100.05 })];

    expect(calcBudgetHeaderAmounts(items, null)).toEqual({
      subtotal: 100.05,
      tax_amount: 0,
    });
  });
});

describe("calcTotalsFromSubtotal", () => {
  it("taxRate 0 returns total equal to subtotal and zero tax_amount", () => {
    expect(calcTotalsFromSubtotal(120, 0)).toEqual({
      subtotal: 120,
      tax_amount: 0,
      total: 120,
    });
  });

  it("taxRate 21 returns correct rounded tax_amount and total", () => {
    expect(calcTotalsFromSubtotal(100.05, 21)).toEqual({
      subtotal: 100.05,
      tax_amount: 21.01,
      total: 121.06,
    });
  });

  it("floating point input is rounded to 2 decimals", () => {
    expect(calcTotalsFromSubtotal(0.1 + 0.2, 21)).toEqual({
      subtotal: 0.30000000000000004,
      tax_amount: 0.06,
      total: 0.36,
    });
  });

  it("taxRate null behaves as 0 for totals", () => {
    expect(calcTotalsFromSubtotal(99.99, null)).toEqual({
      subtotal: 99.99,
      tax_amount: 0,
      total: 99.99,
    });
  });
});

describe("toBudgetLineRows", () => {
  it("maps item fields correctly", () => {
    const [row] = toBudgetLineRows("budget-1", [makeItem()]);

    expect(row).toMatchObject({
      budget_id: "budget-1",
      title: "Parets menjador",
      description: "Pintura plàstica",
      quantity: 10,
      unit: "m²",
      unit_price: 12,
      line_total: 120,
      sort_order: 0,
    });
  });

  it("sort_order matches array index", () => {
    const rows = toBudgetLineRows("budget-1", [
      makeItem({ id: "i1" }),
      makeItem({ id: "i2" }),
      makeItem({ id: "i3" }),
    ]);

    expect(rows.map((row) => row.sort_order)).toEqual([0, 1, 2]);
  });

  it("empty title becomes null via normalizeOptionalString", () => {
    const [row] = toBudgetLineRows("budget-1", [makeItem({ title: "   " })]);

    expect(row?.title).toBe("");
  });

  it("empty description is stored as empty string for DB not-null constraint", () => {
    const [row] = toBudgetLineRows("budget-1", [
      makeItem({ description: "  " }),
    ]);

    expect(row?.description).toBe("");
  });

  it("missing unitPrice is derived from total and quantity", () => {
    const [row] = toBudgetLineRows("budget-1", [
      makeItem({ unitPrice: undefined, total: 120, quantity: 10 }),
    ]);

    expect(row?.unit_price).toBe(12);
  });

  it("optionGroupId and optionLabel are preserved when present", () => {
    const [row] = toBudgetLineRows("budget-1", [
      makeItem({ optionGroupId: "group-1", optionLabel: "Opció A" }),
    ]);

    expect(row).toMatchObject({
      option_group_id: "group-1",
      option_label: "Opció A",
    });
  });

  it("optionGroupId null or undefined maps option_group_id to null", () => {
    const rows = toBudgetLineRows("budget-1", [
      makeItem({ id: "i1", optionGroupId: undefined }),
      makeItem({ id: "i2", optionGroupId: undefined, optionLabel: undefined }),
    ]);

    expect(rows[0]?.option_group_id).toBeNull();
    expect(rows[1]?.option_group_id).toBeNull();
  });
});
