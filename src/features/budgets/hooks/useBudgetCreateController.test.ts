// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBudgetCreateController } from "@/features/budgets/hooks/useBudgetCreateController";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("useBudgetCreateController", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    push.mockClear();
  });

  it("navigates to the list with the new budget id after first save", async () => {
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
    expect(push).toHaveBeenCalledWith("/budgets?new=1");
  });
});
