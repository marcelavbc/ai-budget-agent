// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  mockBudgetLineRow,
  mockBudgetRow,
  mockContactRow,
} from "@/features/budgets/test/fixtures/budgetEditRows";
import { useBudgetEditController } from "./useBudgetEditController";
import { updateBudgetWithLines } from "../lib/budgetsClient";

vi.mock("../lib/budgetsClient", () => ({
  updateBudgetWithLines: vi.fn().mockResolvedValue(undefined),
}));

describe("useBudgetEditController", () => {
  it("loads initial client details from budget and contact", () => {
    const { result } = renderHook(() =>
      useBudgetEditController({
        budget: mockBudgetRow,
        contact: mockContactRow,
        lines: [mockBudgetLineRow],
      })
    );
    expect(result.current.clientDetails.nameOrCompany).toBe(
      mockContactRow.name
    );
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]!.title).toBe(mockBudgetLineRow.title);
    expect(result.current.items[0]!.quantity).toBe(mockBudgetLineRow.quantity);
  });

  it("handleSave calls updateBudgetWithLines with correct budgetId", async () => {
    const { result } = renderHook(() =>
      useBudgetEditController({
        budget: mockBudgetRow,
        contact: mockContactRow,
        lines: [mockBudgetLineRow],
      })
    );

    await act(async () => {
      await result.current.handleSave({
        client: result.current.clientDetails,
        items: result.current.items,
      });
    });

    expect(updateBudgetWithLines).toHaveBeenCalledWith({
      budgetId: mockBudgetRow.id,
      contactId: mockBudgetRow.contact_id,
      client: result.current.clientDetails,
      items: result.current.items,
      taxRate: mockBudgetRow.tax_rate ?? 0,
      status: "draft",
    });
  });
});
