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
import type { BudgetClientItem, BudgetLine } from "@/features/budgets/types/budget";

function budgetLine(overrides: Partial<BudgetLine> = {}): BudgetLine {
  return {
    id: "ai-1",
    type: "custom",
    label: "Test",
    quantity: 1,
    unitLabel: "unitat",
    unitPrice: 100,
    subtotal: 100,
    pricingMode: "range",
    clientDescription: "Test description",
    ...overrides,
  };
}

function clientItem(
  overrides: Partial<BudgetClientItem> = {}
): BudgetClientItem {
  return {
    id: "1",
    title: "Test",
    description: "Test description",
    total: 100,
    quantity: 1,
    unitLabel: "unitat",
    unitPrice: 100,
    lineType: "custom",
    clientDescription: "Test description",
    ...overrides,
  };
}

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
  it("appendAiLines adds new items to the list", async () => {
    const { result } = renderHook(() =>
      useBudgetEditController({
        budget: mockBudgetRow,
        contact: mockContactRow,
        lines: [mockBudgetLineRow],
      })
    );
    expect(result.current.items).toHaveLength(1);

    await act(async () => {
      result.current.appendAiLines([budgetLine()]);
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[1]).toMatchObject({
      id: "ai-1",
      title: "Test",
      description: "Test description",
      total: 100,
    });
  });
  it("updateItem updates an item in the list", async () => {
    const { result } = renderHook(() =>
      useBudgetEditController({
        budget: mockBudgetRow,
        contact: mockContactRow,
        lines: [mockBudgetLineRow],
      })
    );
    await act(async () => {
      result.current.appendAiLines([budgetLine()]);
    });
    await act(async () => {
      result.current.updateItem("ai-1", { title: "Updated Test" });
    });
    expect(result.current.items[1]).toMatchObject({
      id: "ai-1",
      title: "Updated Test",
    });
  });
  it("removeItem removes an item from the list", async () => {
    const { result } = renderHook(() =>
      useBudgetEditController({
        budget: mockBudgetRow,
        contact: mockContactRow,
        lines: [mockBudgetLineRow],
      })
    );
    await act(async () => {
      result.current.appendAiLines([budgetLine()]);
    });
    await act(async () => {
      result.current.removeItem("ai-1");
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0]!.id).toBe(mockBudgetLineRow.id);
  });
  it("replaceItems replaces the items in the list", async () => {
    const { result } = renderHook(() =>
      useBudgetEditController({
        budget: mockBudgetRow,
        contact: mockContactRow,
        lines: [mockBudgetLineRow],
      })
    );
    const nextItems = [clientItem({ id: "2", title: "Replaced" })];

    await act(async () => {
      result.current.appendAiLines([budgetLine()]);
    });
    expect(result.current.items).toHaveLength(2);

    await act(async () => {
      result.current.replaceItems(nextItems);
    });

    expect(result.current.items).toEqual(nextItems);
  });
});
