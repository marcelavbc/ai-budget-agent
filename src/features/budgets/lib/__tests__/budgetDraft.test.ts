import { describe, expect, it } from "vitest";
import { isBudgetDraftComplete } from "../budgetDraft";
import type {
  BudgetClientDetails,
  BudgetClientItem,
} from "@/features/budgets/types/budget";

function baseClient(): BudgetClientDetails {
  return {
    nameOrCompany: "Maria Vila",
    address: "Carrer Major 1\n08001 Barcelona",
    quoteNumber: "MV-20260422",
    date: "2026-04-22",
    estimatedTime: "7 a 9 dies hàbils",
  };
}

function baseItems(): BudgetClientItem[] {
  return [
    {
      id: "1",
      title: "Pintar parets",
      description: "Preparació + 2 mans.",
      total: 123,
    },
  ];
}

describe("isBudgetDraftComplete", () => {
  it("returns false when any required client field is missing", () => {
    const items = baseItems();

    expect(
      isBudgetDraftComplete({
        client: { ...baseClient(), nameOrCompany: "" },
        items,
      })
    ).toBe(false);
    expect(
      isBudgetDraftComplete({
        client: { ...baseClient(), quoteNumber: "" },
        items,
      })
    ).toBe(false);
    expect(
      isBudgetDraftComplete({ client: { ...baseClient(), date: "" }, items })
    ).toBe(false);
    expect(
      isBudgetDraftComplete({
        client: { ...baseClient(), estimatedTime: "" },
        items,
      })
    ).toBe(false);
  });

  it("returns false when there are no items or description is missing", () => {
    expect(isBudgetDraftComplete({ client: baseClient(), items: [] })).toBe(
      false
    );
    expect(
      isBudgetDraftComplete({
        client: baseClient(),
        items: [{ ...baseItems()[0], description: "  " }],
      })
    ).toBe(false);
  });

  it("returns true when everything is complete", () => {
    expect(
      isBudgetDraftComplete({ client: baseClient(), items: baseItems() })
    ).toBe(true);
  });
});
