// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBudgetCreateController } from "@/features/budgets/hooks/useBudgetCreateController";
import type {
  BudgetClientItem,
  BudgetLine,
} from "@/features/budgets/types/budget";

function budgetLine(overrides: Partial<BudgetLine> = {}): BudgetLine {
  return {
    id: "1",
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

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("useBudgetCreateController", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    push.mockClear();
  });

  it("navigates to edit with the new budget id after first save", async () => {
    // mock de /api/budgets
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          budgetId: "1",
          contactId: "1",
        }),
      })
    );
    // renderHook
    const { result } = renderHook(() => useBudgetCreateController());
    // act → handleSave
    await act(async () =>
      result.current.handleSave({
        client: {
          nameOrCompany: "Test Name",
          quoteNumber: "",
          date: "",
          estimatedTime: "",
          lang: "ca",
        },
        items: [],
      })
    );
    expect(push).toHaveBeenCalledWith("/budgets/1/edit");
  });
  it("appends AI lines to the items", async () => {
    const { result } = renderHook(() => useBudgetCreateController());

    await act(async () => {
      result.current.appendAiLines([budgetLine()]);
    });

    expect(result.current.items).toEqual([
      {
        id: "1",
        title: "Test",
        description: "Test description",
        total: 100,
        quantity: 1,
        unitLabel: "unitat",
        unitPrice: 100,
        lineType: "custom",
        clientDescription: "Test description",
      },
    ]);
  });
  it("updates an item", async () => {
    const { result } = renderHook(() => useBudgetCreateController());

    await act(async () => {
      result.current.appendAiLines([budgetLine()]);
    });

    await act(async () => {
      result.current.updateItem("1", { title: "Updated Test" });
    });
    expect(result.current.items).toEqual([
      {
        id: "1",
        title: "Updated Test",
        description: "Test description",
        total: 100,
        quantity: 1,
        unitLabel: "unitat",
        unitPrice: 100,
        lineType: "custom",
        clientDescription: "Test description",
      },
    ]);
  });
  it("removes an item", async () => {
    const { result } = renderHook(() => useBudgetCreateController());

    await act(async () => {
      result.current.appendAiLines([budgetLine()]);
    });

    await act(async () => {
      result.current.removeItem("1");
    });
    expect(result.current.items).toEqual([]);
  });
  it("replaces the items", async () => {
    const { result } = renderHook(() => useBudgetCreateController());
    const nextItems = [
      clientItem({ id: "2", title: "Replaced" }),
      clientItem({ id: "3", title: "Second line" }),
    ];

    await act(async () => {
      result.current.appendAiLines([budgetLine()]);
    });

    await act(async () => {
      result.current.replaceItems(nextItems);
    });

    expect(result.current.items).toEqual(nextItems);
  });
});
