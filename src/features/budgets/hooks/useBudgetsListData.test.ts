// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBudgetsListData } from "./useBudgetsListData";
import {
  mockBudgetRow,
  mockBudgetRowTwo,
} from "../test/fixtures/budgetEditRows";

describe("useBudgetsListData", () => {
  it("returns budgets as items", () => {
    const { result } = renderHook(() =>
      useBudgetsListData({ budgets: [mockBudgetRow, mockBudgetRowTwo] })
    );
    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[0]!.title).toBe("Pressupost test");
    expect(result.current.items[1]!.title).toBe("Test Item Two");
  });
  it("applies status override to a budget", () => {
    const { result } = renderHook(() =>
      useBudgetsListData({ budgets: [mockBudgetRow, mockBudgetRowTwo] })
    );
    act(() => {
      result.current.setBudgetStatus(mockBudgetRow.id, "sent");
    });
    expect(result.current.items[0]!.status).toBe("sent");
  });
});
