import { describe, expect, it } from "vitest";
import { isBudgetDraftComplete } from "./budgetDraft";
import type {
  BudgetClientDetails,
  BudgetClientItem,
} from "@/features/budgets/types/budget";

function baseClient(): BudgetClientDetails {
  return {
    nameOrCompany: "Maria Vila",
    jobAddressStreet: "Carrer Major 1",
    jobAddressPostalCode: "08001",
    jobAddressCity: "Barcelona",
    quoteNumber: "MV-20260422",
    date: "2026-04-22",
    estimatedTime: "7 a 9 dies hàbils",
    lang: "ca",
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
  it("returns false when name or company is missing", () => {
    expect(
      isBudgetDraftComplete({
        client: { ...baseClient(), nameOrCompany: "" },
        items: baseItems(),
      }),
    ).toBe(false);
    expect(
      isBudgetDraftComplete({
        client: { ...baseClient(), nameOrCompany: "   " },
        items: baseItems(),
      }),
    ).toBe(false);
  });

  it("returns true when only name or company is filled", () => {
    expect(
      isBudgetDraftComplete({
        client: {
          ...baseClient(),
          quoteNumber: "",
          date: "",
          estimatedTime: "",
        },
        items: [],
      }),
    ).toBe(true);

    expect(
      isBudgetDraftComplete({
        client: baseClient(),
        items: [{ ...baseItems()[0], description: "  " }],
      }),
    ).toBe(true);
  });
});
