// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBudgetCreateController } from "@/features/budgets/hooks/useBudgetCreateController";

describe("useBudgetCreateController", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("switches to edit mode after first save", async () => {
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
    // verificar que persistedBudget no es null
    expect(result.current.persistedBudget).not.toBeNull();
  });
});
