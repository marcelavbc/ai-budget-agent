import { describe, expect, it } from "vitest";
import { isBudgetDraftComplete } from "../budgetDraft";
import type { BudgetClientDetails, BudgetClientItem } from "@/types/budget";

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
  it("retorna false si falta algun camp obligatori del client", () => {
    const items = baseItems();

    expect(
      isBudgetDraftComplete({ client: { ...baseClient(), nameOrCompany: "" }, items }),
    ).toBe(false);
    expect(
      isBudgetDraftComplete({ client: { ...baseClient(), address: "   " }, items }),
    ).toBe(false);
    expect(
      isBudgetDraftComplete({ client: { ...baseClient(), quoteNumber: "" }, items }),
    ).toBe(false);
    expect(
      isBudgetDraftComplete({ client: { ...baseClient(), date: "" }, items }),
    ).toBe(false);
    expect(
      isBudgetDraftComplete({ client: { ...baseClient(), estimatedTime: "" }, items }),
    ).toBe(false);
  });

  it("retorna false si no hi ha partides o falta descripció", () => {
    expect(isBudgetDraftComplete({ client: baseClient(), items: [] })).toBe(false);
    expect(
      isBudgetDraftComplete({
        client: baseClient(),
        items: [{ ...baseItems()[0], description: "  " }],
      }),
    ).toBe(false);
  });

  it("retorna true quan tot és complet", () => {
    expect(isBudgetDraftComplete({ client: baseClient(), items: baseItems() })).toBe(
      true,
    );
  });
});
